"use client";

import { AlertTriangle, Clock3, RotateCcw } from "lucide-react";
import type { GenerationRow } from "@/lib/types";

type SavedHistoryProps = {
  activeId: string | null;
  generations: GenerationRow[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (generation: GenerationRow) => void;
};

function truncate(value: string, maxLength = 40) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .replace(" AM", "am")
    .replace(" PM", "pm");
}

export function SavedHistory({
  activeId,
  generations,
  isLoading,
  error,
  onRetry,
  onSelect,
}: SavedHistoryProps) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Saved work
        </p>
        <h2 className="mt-1 text-xl font-black">Recent Generations</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 border border-[var(--border)] bg-white px-3 py-4 text-sm font-semibold text-[var(--muted)]">
          <Clock3 size={17} aria-hidden="true" />
          Loading history
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="border border-[var(--orange)] bg-[#fff3ec] p-3">
          <div className="flex gap-2 text-sm font-bold text-[var(--orange)]">
            <AlertTriangle size={17} aria-hidden="true" />
            {error}
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex min-h-9 items-center gap-2 bg-[var(--orange)] px-3 text-sm font-black text-white"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error && generations.length === 0 ? (
        <div className="border border-[var(--border)] bg-white px-3 py-4 text-sm font-semibold text-[var(--muted)]">
          No generations yet
        </div>
      ) : null}

      <div className="grid gap-2 overflow-y-auto pb-4">
        {generations.map((generation) => {
          const label = generation.repo_url ?? "Pasted README";
          const isActive = generation.id === activeId;

          return (
            <button
              type="button"
              key={generation.id}
              onClick={() => onSelect(generation)}
              className={`border p-3 text-left transition hover:-translate-y-0.5 ${
                isActive
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--panel)]"
                  : "border-[var(--border)] bg-white text-[var(--foreground)]"
              }`}
            >
              <span className="block text-sm font-black">
                {truncate(label)}
              </span>
              <span
                className={`mono mt-2 block text-xs ${
                  isActive ? "text-[#d6d0bf]" : "text-[var(--muted)]"
                }`}
              >
                {formatDate(generation.created_at)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
