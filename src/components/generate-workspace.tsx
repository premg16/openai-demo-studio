"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Loader2, PanelLeftClose } from "lucide-react";
import type { ApiError, GenerationRow } from "@/lib/types";
import { ResultCard } from "@/components/result-card";
import { SavedHistory } from "@/components/saved-history";

function readLatestGeneration() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem("latest-generation");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GenerationRow;
  } catch {
    sessionStorage.removeItem("latest-generation");
    return null;
  }
}

export function GenerateWorkspace() {
  const [activeGeneration, setActiveGeneration] = useState<GenerationRow | null>(
    null,
  );
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/generations", { cache: "no-store" });

      if (!response.ok) {
        const payload = (await response.json()) as ApiError;
        throw new Error(payload.error || "Could not load generations");
      }

      const rows = (await response.json()) as GenerationRow[];
      setGenerations(rows);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Could not load generations",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveGeneration(readLatestGeneration());
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  const mergedHistory = useMemo(() => {
    if (!activeGeneration) {
      return generations;
    }

    const withoutActive = generations.filter(
      (generation) => generation.id !== activeGeneration.id,
    );

    return [activeGeneration, ...withoutActive].slice(0, 10);
  }, [activeGeneration, generations]);

  return (
    <main className="page-shell lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-[var(--foreground)] bg-[var(--panel)] lg:block">
        <SavedHistory
          activeId={activeGeneration?.id ?? null}
          generations={mergedHistory}
          isLoading={isLoadingHistory}
          error={historyError}
          onRetry={loadHistory}
          onSelect={(generation) => setActiveGeneration(generation)}
        />
      </aside>

      <section className="min-h-screen px-5 py-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 text-sm font-bold shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-y-0.5"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              New analysis
            </Link>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 text-sm font-bold shadow-[4px_4px_0_var(--foreground)] lg:hidden"
            >
              <History size={17} aria-hidden="true" />
              Recent
            </button>
          </div>

          {activeGeneration ? (
            <div className="grid gap-5 pb-28 lg:pb-8">
              <div className="border border-[var(--foreground)] bg-[var(--foreground)] p-4 text-[var(--panel)] shadow-[10px_10px_0_var(--border)] md:p-5">
                <p className="mono text-xs uppercase tracking-[0.18em] text-[#d6d0bf]">
                  Active generation
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">
                  {activeGeneration.repo_url ?? "Pasted README"}
                </h1>
              </div>

              <ResultCard
                title="Sample App"
                type="sample"
                icon="spark"
                content={activeGeneration.sampleApp}
                animationDelay={0}
              />
              <ResultCard
                title="Tutorial Outline"
                type="tutorial"
                icon="list"
                content={activeGeneration.tutorialOutline}
                animationDelay={0.1}
              />
              <ResultCard
                title="Architecture Notes"
                type="architecture"
                icon="network"
                content={activeGeneration.architectureNotes}
                animationDelay={0.2}
              />
              <ResultCard
                title="Deploy Checklist"
                type="checklist"
                icon="check"
                content={activeGeneration.deployChecklist}
                animationDelay={0.3}
              />
            </div>
          ) : (
            <div className="grid min-h-[62vh] place-items-center">
              <div className="max-w-xl border border-[var(--foreground)] bg-[var(--panel)] p-6 text-center shadow-[10px_10px_0_var(--foreground)]">
                <div className="mx-auto grid size-12 place-items-center bg-[var(--accent)] text-white">
                  {isLoadingHistory ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <PanelLeftClose size={22} />
                  )}
                </div>
                <h1 className="mt-4 text-3xl font-black">No generation open</h1>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  Start a new analysis or select a recent generation from the
                  history panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-[var(--foreground)] bg-[var(--panel)] shadow-[0_-18px_60px_rgba(23,23,21,0.18)] transition-transform duration-300 lg:hidden ${
          isDrawerOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsDrawerOpen((value) => !value)}
          className="flex min-h-16 w-full items-center justify-between px-5 text-left font-black"
        >
          <span className="inline-flex items-center gap-2">
            <History size={18} aria-hidden="true" />
            Recent Generations
          </span>
          <span className="mono text-xs text-[var(--muted)]">
            {isDrawerOpen ? "Close" : "Open"}
          </span>
        </button>
        <div className="max-h-[70vh] overflow-y-auto border-t border-[var(--border)]">
          <SavedHistory
            activeId={activeGeneration?.id ?? null}
            generations={mergedHistory}
            isLoading={isLoadingHistory}
            error={historyError}
            onRetry={loadHistory}
            onSelect={(generation) => {
              setActiveGeneration(generation);
              setIsDrawerOpen(false);
            }}
          />
        </div>
      </div>
    </main>
  );
}
