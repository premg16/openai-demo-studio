const GITHUB_REPO_PATTERN =
  /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/;

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
    status: 404,
    error: "README not found on main or master",
  };
}
