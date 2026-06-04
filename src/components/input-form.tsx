"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardPaste, Github, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ApiError, GenerationRow } from "@/lib/types";

type InputMode = "github" | "readme";

function isGitHubRepoUrl(value: string) {
  return /^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/.*)?$/.test(
    value.trim(),
  );
}

async function parseJson<T>(response: Response) {
  return (await response.json()) as T;
}

export function InputForm() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [readmeText, setReadmeText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "github" && !isGitHubRepoUrl(repoUrl)) {
      setError("Enter a valid github.com repository URL.");
      return;
    }

    if (mode === "readme" && !readmeText.trim()) {
      setError("Paste README content before analyzing.");
      return;
    }

    setIsLoading(true);

    try {
      let sourceReadme = readmeText.trim();

      if (mode === "github") {
        const fetchResponse = await fetch(
          `/api/fetch-readme?url=${encodeURIComponent(repoUrl.trim())}`,
        );

        if (!fetchResponse.ok) {
          const payload = await parseJson<ApiError>(fetchResponse);
          throw new Error(
            payload.error ||
              "Could not fetch README. Check the URL or try pasting the README directly.",
          );
        }

        const payload = await parseJson<{ content: string }>(fetchResponse);
        sourceReadme = payload.content;
      }

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readmeText: sourceReadme,
          repoUrl: mode === "github" ? repoUrl.trim() : null,
        }),
      });

      if (!analyzeResponse.ok) {
        const payload = await parseJson<ApiError>(analyzeResponse);
        throw new Error(payload.error || "Generation failed. Try again.");
      }

      const generation = await parseJson<GenerationRow>(analyzeResponse);
      sessionStorage.setItem("latest-generation", JSON.stringify(generation));
      router.push("/generate");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Generation failed. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="w-full max-w-[600px] border border-[var(--foreground)] bg-[var(--panel)] p-4 shadow-[10px_10px_0_var(--foreground)] md:p-5"
    >
      <div className="grid grid-cols-2 gap-2 border border-[var(--border)] bg-[var(--panel-strong)] p-1">
        <button
          type="button"
          onClick={() => setMode("github")}
          className={`flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-bold transition ${
            mode === "github"
              ? "bg-[var(--foreground)] text-[var(--panel)]"
              : "text-[var(--muted)] hover:bg-[var(--panel)]"
          }`}
        >
          <Github size={17} aria-hidden="true" />
          GitHub URL
        </button>
        <button
          type="button"
          onClick={() => setMode("readme")}
          className={`flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-bold transition ${
            mode === "readme"
              ? "bg-[var(--foreground)] text-[var(--panel)]"
              : "text-[var(--muted)] hover:bg-[var(--panel)]"
          }`}
        >
          <ClipboardPaste size={17} aria-hidden="true" />
          Paste README
        </button>
      </div>

      <div className="mt-4">
        {mode === "github" ? (
          <input
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            onBlur={() => {
              if (repoUrl && !isGitHubRepoUrl(repoUrl)) {
                setError("Enter a valid github.com repository URL.");
              }
            }}
            placeholder="https://github.com/owner/repo"
            className="min-h-14 w-full border border-[var(--foreground)] bg-white px-4 text-base outline-none transition placeholder:text-[var(--muted)] focus:focus-ring"
          />
        ) : (
          <textarea
            value={readmeText}
            onChange={(event) => setReadmeText(event.target.value)}
            placeholder="Paste your README.md content here"
            rows={8}
            className="min-h-56 w-full resize-y border border-[var(--foreground)] bg-white px-4 py-3 text-base leading-7 outline-none transition placeholder:text-[var(--muted)] focus:focus-ring"
          />
        )}
      </div>

      {error ? (
        <div className="mt-3 border border-[var(--orange)] bg-[#fff3ec] px-3 py-2 text-sm font-semibold text-[var(--orange)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 bg-[var(--accent)] px-5 text-base font-black text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={19} aria-hidden="true" />
            Analyzing...
          </>
        ) : (
          <>
            Analyze Repo
            <ArrowRight size={19} aria-hidden="true" />
          </>
        )}
      </button>
    </motion.form>
  );
}
