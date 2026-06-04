"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardPaste,
  Github,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ApiError, GenerationRow } from "@/lib/types";

type InputMode = "github" | "readme";
type AnalysisStageId =
  | "fetch"
  | "detect"
  | "opportunities"
  | "paths"
  | "starter"
  | "save";

const analysisStages: { id: AnalysisStageId; label: string }[] = [
  { id: "fetch", label: "Fetch README" },
  { id: "detect", label: "Detect stack" },
  { id: "opportunities", label: "Find OpenAI fit" },
  { id: "paths", label: "Generate demo paths" },
  { id: "starter", label: "Build starter pack" },
  { id: "save", label: "Save generation" },
];

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
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<InputMode>("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [readmeText, setReadmeText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<AnalysisStageId | null>(null);
  const [failedStage, setFailedStage] = useState<AnalysisStageId | null>(null);

  function setStage(stage: AnalysisStageId) {
    setActiveStage(stage);
    setFailedStage(null);
  }

  function failStage(stage: AnalysisStageId, message: string) {
    setActiveStage(stage);
    setFailedStage(stage);
    setError(message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFailedStage(null);

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
        setStage("fetch");
        const fetchResponse = await fetch(
          `/api/fetch-readme?url=${encodeURIComponent(repoUrl.trim())}`,
        );

        if (!fetchResponse.ok) {
          const payload = await parseJson<ApiError>(fetchResponse);
          failStage(
            "fetch",
            payload.error ||
              "Could not fetch README. Check the URL or try pasting the README directly.",
          );
          return;
        }

        const payload = await parseJson<{ content: string }>(fetchResponse);
        sourceReadme = payload.content;
      } else {
        setStage("fetch");
      }

      setStage("detect");
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setStage("opportunities");
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setStage("paths");
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readmeText: sourceReadme,
          repoUrl: mode === "github" ? repoUrl.trim() : null,
          preferredPath: "portfolio",
        }),
      });

      if (!analyzeResponse.ok) {
        const payload = await parseJson<ApiError>(analyzeResponse);
        failStage("paths", payload.error || "Generation failed. Try again.");
        return;
      }

      setStage("starter");
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      const generation = await parseJson<GenerationRow>(analyzeResponse);
      setStage("save");
      sessionStorage.setItem("latest-generation", JSON.stringify(generation));
      router.push("/generate");
    } catch (submitError) {
      failStage(
        activeStage ?? "paths",
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
      ref={formRef}
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
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              className="inline-flex min-h-9 items-center gap-2 bg-[var(--orange)] px-3 text-sm font-black text-white"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("readme");
                setError("");
                setFailedStage(null);
              }}
              className="inline-flex min-h-9 items-center gap-2 border border-[var(--orange)] bg-white px-3 text-sm font-black text-[var(--orange)]"
            >
              <ClipboardPaste size={15} aria-hidden="true" />
              Paste README instead
            </button>
          </div>
        </div>
      ) : null}

      {(isLoading || activeStage || failedStage) ? (
        <div className="mt-4 grid gap-2 border border-[var(--border)] bg-white p-3">
          {analysisStages.map((stage) => {
            const activeIndex = activeStage
              ? analysisStages.findIndex((item) => item.id === activeStage)
              : -1;
            const stageIndex = analysisStages.findIndex(
              (item) => item.id === stage.id,
            );
            const isDone = activeIndex > stageIndex && !failedStage;
            const isActive = activeStage === stage.id && !failedStage;
            const isFailed = failedStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 text-sm font-bold ${
                  isFailed
                    ? "text-[var(--orange)]"
                    : isDone || isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted)]"
                }`}
              >
                <span
                  className={`grid size-6 place-items-center border ${
                    isFailed
                      ? "border-[var(--orange)] bg-[#fff3ec]"
                      : isDone
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--panel)]"
                  }`}
                >
                  {isDone ? (
                    <Check size={14} aria-hidden="true" />
                  ) : isActive ? (
                    <Loader2
                      className="animate-spin"
                      size={14}
                      aria-hidden="true"
                    />
                  ) : isFailed ? (
                    <AlertTriangle size={14} aria-hidden="true" />
                  ) : (
                    <span className="size-1.5 bg-current" />
                  )}
                </span>
                {stage.label}
              </div>
            );
          })}
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
