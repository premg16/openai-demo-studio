const GITHUB_REPO_PATTERN =
  /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/;

type GitHubReadmeResponse = {
  download_url?: string | null;
};

export function parseGitHubRepoUrl(url: string) {
  const match = url.trim().match(GITHUB_REPO_PATTERN);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

export async function fetchReadmeFromGitHub(url: string) {
  const repo = parseGitHubRepoUrl(url);

  if (!repo) {
    return {
      ok: false as const,
      status: 400,
      error: "Invalid GitHub URL",
    };
  }

  const apiResponse = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/readme`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "openai-demo-studio",
      },
      cache: "no-store",
    },
  );

  if (apiResponse.ok) {
    const metadata = (await apiResponse.json()) as GitHubReadmeResponse;

    if (metadata.download_url) {
      const readmeResponse = await fetch(metadata.download_url, {
        headers: {
          Accept: "text/markdown,text/plain,*/*",
        },
        cache: "no-store",
      });

      if (readmeResponse.ok) {
        return {
          ok: true as const,
          content: await readmeResponse.text(),
        };
      }
    }
  }

  if (apiResponse.status === 404) {
    return {
      ok: false as const,
      status: 404,
      error:
        "Repository or README not found. Check the owner/repo spelling, or paste the README directly.",
    };
  }

  for (const branch of ["main", "master"]) {
    const readmeUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/README.md`;
    const response = await fetch(readmeUrl, {
      headers: {
        Accept: "text/markdown,text/plain,*/*",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return {
        ok: true as const,
        content: await response.text(),
      };
    }
  }

  return {
    ok: false as const,
    status: apiResponse.status === 403 ? 429 : 404,
    error:
      apiResponse.status === 403
        ? "GitHub rate limit reached. Try again soon, or paste the README directly."
        : "README not found. Try pasting the README directly.",
  };
}
