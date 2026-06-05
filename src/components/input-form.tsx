"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardPaste,
  EyeOff,
  Github,
  KeyRound,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AnalyzeRequest, ApiError, GenerationRow, RateLimitInfo } from "@/lib/types";

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

const byokModels = [
  { label: "GPT-5 mini (Recommended)", value: "gpt-5-mini" },
  { label: "GPT-5", value: "gpt-5" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 mini", value: "gpt-4.1-mini" },
  { label: "GPT-4.1 nano", value: "gpt-4.1-nano" },
];

const exampleRepos = [
  { label: "Next.js commerce", url: "https://github.com/vercel/commerce" },
  { label: "FastAPI", url: "https://github.com/tiangolo/fastapi" },
  { label: "Excalidraw", url: "https://github.com/excalidraw/excalidraw" },
];

function isGitHubRepoUrl(value: string) {
  return /^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/.*)?$/.test(
    value.trim(),
  );
}

async function parseJson<T>(response: Response) {
  return (await response.json()) as T;
}

function QuotaBanner({ info }: { info: RateLimitInfo }) {
  const pct = Math.round((info.remaining / info.limit) * 100);
  const tone =
    info.remaining === 0
      ? "border-[var(--orange)] bg-[#fff3ec] text-[var(--orange)]"
      : info.remaining <= 1
        ? "border-[var(--orange)] bg-[#fff3ec] text-[var(--orange)]"
        : "border-[var(--accent)] bg-[#dcebd2] text-[var(--accent-strong)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between gap-3 border px-3 py-2 text-xs font-bold ${tone}`}
    >
      <span>
        {info.remaining} of {info.limit} free generations remaining today
      </span>
      <div className="h-1.5 w-20 overflow-hidden rounded-none border border-current bg-current/20">
        <div
          className="h-full bg-current transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </motion.div>
  );
}

export function InputForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<InputMode>("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [readmeText, setReadmeText] = useState("");
  const [error, setError] = useState("");
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");
  const [noSave, setNoSave] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<AnalysisStageId | null>(null);
  const [failedStage, setFailedStage] = useState<AnalysisStageId | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<RateLimitInfo | null>(null);

  function setStage(stage: AnalysisStageId) {
    setActiveStage(stage);
    setFailedStage(null);
  }

  function failStage(stage: AnalysisStageId, message: string) {
    setActiveStage(stage);
    setFailedStage(stage);
    setError(message);
  }

  function readRateLimitHeaders(response: Response): RateLimitInfo | null {
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const resetAt = response.headers.get("X-RateLimit-Reset");
    if (!limit || !remaining || !resetAt) return null;
    return { limit: Number(limit), remaining: Number(remaining), resetAt };
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

    if (useOwnKey && !openaiApiKey.trim()) {
      setError("Add your OpenAI API key or turn off BYOK mode.");
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

      const requestBody: Partial<AnalyzeRequest> = {
        readmeText: sourceReadme,
        repoUrl: mode === "github" ? repoUrl.trim() : null,
        preferredPath: "portfolio",
        openaiApiKey: useOwnKey ? openaiApiKey.trim() : undefined,
        model: useOwnKey ? selectedModel : undefined,
        noSave: noSave || undefined,
      };

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const rateLimit = readRateLimitHeaders(analyzeResponse);
      if (rateLimit && !useOwnKey) {
        setQuotaInfo(rateLimit);
      }

      if (!analyzeResponse.ok) {
        const payload = await parseJson<ApiError>(analyzeResponse);
        failStage("paths", payload.error || "Generation failed. Try again.");
        return;
      }

      setStage("starter");
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      const generation = await parseJson<GenerationRow>(analyzeResponse);

      if (noSave) {
        setStage("save");
      } else {
        setStage("save");
      }

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
          <div className="grid gap-2">
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              onBlur={() => {
                if (repoUrl && !isGitHubRepoUrl(repoUrl)) {
                  setError("Enter a valid github.com repository URL.");
                }
              }}
              placeholder="https://github.com/owner/repo"
              aria-label="GitHub repository URL"
              className="min-h-14 w-full border border-[var(--foreground)] bg-white px-4 text-base outline-none transition placeholder:text-[var(--muted)] focus:focus-ring"
            />
            <div className="flex flex-wrap gap-2">
              {exampleRepos.map((repo) => (
                <button
                  key={repo.url}
                  type="button"
                  onClick={() => {
                    setRepoUrl(repo.url);
                    setError("");
                  }}
                  className="border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                >
                  {repo.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <textarea
              value={readmeText}
              onChange={(event) => setReadmeText(event.target.value)}
              placeholder="Paste your README.md content here"
              rows={8}
              aria-label="README content"
              className="min-h-56 w-full resize-y border border-[var(--foreground)] bg-white px-4 py-3 text-base leading-7 outline-none transition placeholder:text-[var(--muted)] focus:focus-ring"
            />
            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent)]" size={13} aria-hidden="true" />
              README content is used only for this analysis. It may be saved to
              history. Use the no-save option below to keep it private.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border border-[var(--border)] bg-white p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            checked={useOwnKey}
            onChange={(event) => setUseOwnKey(event.target.checked)}
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent)]"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-black text-[var(--foreground)]">
              <KeyRound size={16} aria-hidden="true" />
              Use my OpenAI key
            </span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
              Free mode uses GPT-5 nano with a daily limit. BYOK skips the free
              quota and uses your key only for this request.
            </span>
          </span>
        </label>

        {useOwnKey ? (
          <div className="mt-3 grid gap-3">
            <input
              value={openaiApiKey}
              onChange={(event) => setOpenaiApiKey(event.target.value)}
              type="password"
              autoComplete="off"
              placeholder="sk-..."
              aria-label="OpenAI API key"
              className="min-h-11 w-full border border-[var(--foreground)] bg-white px-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:focus-ring"
            />
            <label className="grid gap-1 text-sm font-bold text-[var(--foreground)]">
              Model
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="min-h-11 w-full border border-[var(--foreground)] bg-white px-3 text-sm outline-none transition focus:focus-ring"
              >
                {byokModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-[var(--accent)]"
                size={14}
                aria-hidden="true"
              />
              The key is sent to the server for this analysis only and is never
              saved with the generation.
            </p>

            <label className="flex cursor-pointer items-start gap-3 border-t border-[var(--border)] pt-3">
              <input
                checked={noSave}
                onChange={(event) => setNoSave(event.target.checked)}
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--accent)]"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                  <EyeOff size={15} aria-hidden="true" />
                  Don&apos;t save this generation
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--muted)]">
                  The result will be shown but not stored in history. Useful for
                  sensitive or private READMEs.
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </div>

      {quotaInfo ? <QuotaBanner info={quotaInfo} /> : null}

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
            {mode === "github" ? (
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
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading || activeStage || failedStage ? (
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
                {stage.id === "save" && noSave && (isActive || isDone) ? (
                  <span className="mono text-[10px] font-normal text-[var(--muted)]">
                    (not saving)
                  </span>
                ) : null}
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
