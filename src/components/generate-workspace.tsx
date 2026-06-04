"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  Loader2,
  MonitorPlay,
  Network,
  PanelLeftClose,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getActivePath } from "@/lib/generation";
import type {
  ApiError,
  ApiMatch,
  DemoPath,
  DemoPathId,
  GenerationRow,
} from "@/lib/types";
import { SavedHistory } from "@/components/saved-history";

type LabTab = "overview" | "blueprint" | "starter" | "presentation";

const tabs: { id: LabTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={17} /> },
  { id: "blueprint", label: "Blueprint", icon: <Network size={17} /> },
  { id: "starter", label: "Starter Pack", icon: <Code2 size={17} /> },
  { id: "presentation", label: "Presentation", icon: <MonitorPlay size={17} /> },
];

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

function cleanListText(value: string) {
  return value
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\*\*/g, "")
    .trim();
}

function formatMarkdown(generation: GenerationRow, path: DemoPath) {
  const apiMatches = generation.apiMatch
    .map((item) => `- ${item.api}: ${item.fit} fit, ${item.score}/100. ${item.reasoning}`)
    .join("\n");
  const starterFiles = path.starterPack.files
    .map(
      (file) => `### ${file.path}
${file.purpose}

\`\`\`ts
${file.snippet}
\`\`\``,
    )
    .join("\n\n");

  return `# ${path.presentation.title}

Source: ${generation.repo_url ?? "Pasted README"}

## Repo X-Ray
- Framework: ${generation.repoXray.framework}
- Language: ${generation.repoXray.language}
- Repo type: ${generation.repoXray.repoType}
- Setup quality: ${generation.repoXray.setupQuality}
- Deploy readiness: ${generation.repoXray.deployReadiness}

## Demo Path
${path.label}: ${path.summary}

Effort: ${path.effort}
Wow factor: ${path.wowFactor}/5
API fit: ${path.apiFit}

## Before And After
Current repo: ${path.beforeAfter.currentRepo}

OpenAI-enhanced version: ${path.beforeAfter.openaiEnhanced}

## API Match
${apiMatches}

## Blueprint
- User flow: ${path.blueprint.userFlow}
- Frontend: ${path.blueprint.frontend}
- Backend: ${path.blueprint.backend}
- OpenAI layer: ${path.blueprint.openaiLayer}
- Storage: ${path.blueprint.storage}
- Deployment: ${path.blueprint.deployment}

## Starter Pack
Install commands:
${path.starterPack.installCommands.map((item) => `- ${item}`).join("\n")}

Environment variables:
${path.starterPack.envVars.map((item) => `- ${item}`).join("\n")}

${starterFiles}

## Tutorial Outline
${path.tutorialOutline.map((item) => `- ${cleanListText(item)}`).join("\n")}

## Deploy Checklist
${path.deployChecklist.map((item) => `- ${cleanListText(item)}`).join("\n")}
`;
}

function StatBadge({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "orange" | "blue";
}) {
  const tones = {
    neutral: "bg-[var(--panel)] text-[var(--foreground)]",
    green: "bg-[#dcebd2] text-[var(--accent-strong)]",
    orange: "bg-[#fff3ec] text-[var(--orange)]",
    blue: "bg-[#e5eef8] text-[var(--blue)]",
  };

  return (
    <div className={`border border-[var(--foreground)] p-3 ${tones[tone]}`}>
      <p className="mono text-[11px] uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function SectionShell({
  children,
  title,
  icon,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="border border-[var(--foreground)] bg-[var(--panel)] p-4 shadow-[7px_7px_0_var(--foreground)] md:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-10 place-items-center border border-[var(--foreground)] bg-[#f2c84b]">
          {icon}
        </div>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function PathPicker({
  activeId,
  paths,
  onSelect,
}: {
  activeId: DemoPathId;
  paths: DemoPath[];
  onSelect: (id: DemoPathId) => void;
}) {
  return (
    <div className="grid gap-2 border border-[var(--border)] bg-[var(--panel-strong)] p-1 md:grid-cols-3">
      {paths.map((path) => (
        <button
          key={path.id}
          type="button"
          onClick={() => onSelect(path.id)}
          className={`min-h-20 border px-3 py-2 text-left transition ${
            activeId === path.id
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--panel)]"
              : "border-transparent text-[var(--muted)] hover:bg-[var(--panel)]"
          }`}
        >
          <span className="block text-sm font-black">{path.label}</span>
          <span className="mt-1 block text-xs leading-5 opacity-80">
            {path.summary}
          </span>
        </button>
      ))}
    </div>
  );
}

function RepoXrayPanel({ generation }: { generation: GenerationRow }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StatBadge label="Framework" value={generation.repoXray.framework} />
      <StatBadge label="Language" value={generation.repoXray.language} tone="blue" />
      <StatBadge label="Repo type" value={generation.repoXray.repoType} tone="green" />
      <StatBadge
        label="Setup quality"
        value={generation.repoXray.setupQuality}
        tone="orange"
      />
      <StatBadge
        label="Deploy readiness"
        value={generation.repoXray.deployReadiness}
        tone="green"
      />
      <div className="border border-[var(--foreground)] bg-white p-3">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Detected features
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {generation.repoXray.detectedFeatures.map((feature) => (
            <span
              key={feature}
              className="border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs font-bold"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiMatchRail({
  apiMatch,
  path,
}: {
  apiMatch: ApiMatch[];
  path: DemoPath;
}) {
  return (
    <aside className="grid gap-3 lg:sticky lg:top-6 lg:self-start">
      <StatBadge label="Effort" value={path.effort} tone="orange" />
      <StatBadge label="Wow factor" value={`${path.wowFactor}/5`} tone="blue" />
      <StatBadge label="API fit" value={path.apiFit} tone="green" />
      <div className="border border-[var(--foreground)] bg-[var(--panel)] p-4 shadow-[6px_6px_0_var(--foreground)]">
        <div className="mb-3 flex items-center gap-2">
          <Gauge size={18} aria-hidden="true" />
          <h3 className="font-black">API Match</h3>
        </div>
        <div className="grid gap-3">
          {apiMatch.map((item) => (
            <div key={item.api} className="border border-[var(--border)] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black">{item.api}</span>
                <span className="mono text-xs">{item.score}/100</span>
              </div>
              <div className="mt-2 h-2 border border-[var(--foreground)] bg-[var(--panel-strong)]">
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                {item.fit}: {item.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function OverviewTab({
  generation,
  path,
}: {
  generation: GenerationRow;
  path: DemoPath;
}) {
  return (
    <div className="grid gap-5">
      <SectionShell title="Repo X-Ray" icon={<Boxes size={20} />}>
        <RepoXrayPanel generation={generation} />
      </SectionShell>

      <SectionShell title="Before And After" icon={<Sparkles size={20} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-[var(--border)] bg-white p-4">
            <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Current repo
            </p>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              {path.beforeAfter.currentRepo}
            </p>
          </div>
          <div className="border border-[var(--foreground)] bg-[#dcebd2] p-4">
            <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              OpenAI version
            </p>
            <p className="mt-2 leading-7 text-[var(--accent-strong)]">
              {path.beforeAfter.openaiEnhanced}
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell title="Mini Preview" icon={<MonitorPlay size={20} />}>
        <div className="border border-[var(--foreground)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {path.miniPreview.screenType}
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {path.miniPreview.title}
              </h3>
            </div>
            <button
              type="button"
              className="min-h-10 bg-[var(--accent)] px-4 text-sm font-black text-white"
            >
              {path.miniPreview.primaryAction}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {path.miniPreview.panels.map((panel) => (
              <div
                key={panel}
                className="min-h-24 border border-[var(--border)] bg-[var(--panel)] p-3 text-sm font-bold text-[var(--muted)]"
              >
                {panel}
              </div>
            ))}
          </div>
        </div>
      </SectionShell>
    </div>
  );
}

function BlueprintTab({ path }: { path: DemoPath }) {
  const nodes = [
    ["User flow", path.blueprint.userFlow],
    ["Frontend", path.blueprint.frontend],
    ["Backend", path.blueprint.backend],
    ["OpenAI layer", path.blueprint.openaiLayer],
    ["Storage", path.blueprint.storage],
    ["Deployment", path.blueprint.deployment],
  ];

  return (
    <SectionShell title="Animated Architecture Map" icon={<Network size={20} />}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nodes.map(([title, body], index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="relative min-h-36 border border-[var(--foreground)] bg-white p-4"
          >
            {index < nodes.length - 1 ? (
              <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[var(--foreground)] xl:block" />
            ) : null}
            <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-lg font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function StarterTab({ path }: { path: DemoPath }) {
  return (
    <div className="grid gap-5">
      <SectionShell title="Commands And Env Vars" icon={<Rocket size={20} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-[var(--border)] bg-white p-4">
            <h3 className="font-black">Install commands</h3>
            <div className="mt-3 grid gap-2">
              {path.starterPack.installCommands.map((command) => (
                <code
                  key={command}
                  className="mono block border border-[var(--foreground)] bg-[var(--foreground)] px-3 py-2 text-sm text-[var(--panel)]"
                >
                  {command}
                </code>
              ))}
            </div>
          </div>
          <div className="border border-[var(--border)] bg-white p-4">
            <h3 className="font-black">Environment variables</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {path.starterPack.envVars.map((envVar) => (
                <span
                  key={envVar}
                  className="mono border border-[var(--foreground)] bg-[var(--panel)] px-3 py-2 text-sm font-bold"
                >
                  {envVar}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell title="Files To Create" icon={<FileText size={20} />}>
        <div className="grid gap-3">
          {path.starterPack.files.map((file) => (
            <div key={file.path} className="border border-[var(--border)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="mono text-sm font-black">{file.path}</h3>
                <span className="text-xs font-bold text-[var(--muted)]">
                  {file.purpose}
                </span>
              </div>
              <pre className="mono mt-3 overflow-x-auto border border-[var(--foreground)] bg-[var(--foreground)] p-3 text-xs leading-5 text-[var(--panel)]">
                <code>{file.snippet}</code>
              </pre>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

function PresentationTab({
  path,
  onOpen,
}: {
  path: DemoPath;
  onOpen: () => void;
}) {
  const slides = [
    ["Problem", path.presentation.problem],
    ["Demo idea", path.presentation.demoIdea],
    ["Architecture", path.presentation.architecture],
  ];

  return (
    <SectionShell title="Presentation Mode" icon={<MonitorPlay size={20} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-3xl font-black">{path.presentation.title}</h3>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-10 items-center gap-2 bg-[var(--foreground)] px-4 text-sm font-black text-[var(--panel)]"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Open full screen
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {slides.map(([title, body]) => (
          <div key={title} className="min-h-40 border border-[var(--foreground)] bg-white p-4">
            <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {title}
            </p>
            <p className="mt-3 leading-7 text-[var(--foreground)]">{body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function ExportButtons({
  generation,
  path,
}: {
  generation: GenerationRow;
  path: DemoPath;
}) {
  const [message, setMessage] = useState("");
  const markdown = useMemo(() => formatMarkdown(generation, path), [generation, path]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied`);
    } catch {
      setMessage("Clipboard unavailable");
    }

    window.setTimeout(() => setMessage(""), 1800);
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "openai-demo-studio-plan.md";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Markdown downloaded");
    window.setTimeout(() => setMessage(""), 1800);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => copy(markdown, "Markdown")}
        className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 text-sm font-black"
      >
        <Clipboard size={16} aria-hidden="true" />
        Copy Markdown
      </button>
      <button
        type="button"
        onClick={downloadMarkdown}
        className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 text-sm font-black"
      >
        <Download size={16} aria-hidden="true" />
        Download
      </button>
      <button
        type="button"
        onClick={() => copy(markdown, "GitHub issue body")}
        className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 text-sm font-black"
      >
        <FileText size={16} aria-hidden="true" />
        Copy Issue
      </button>
      {message ? (
        <span className="text-sm font-bold text-[var(--accent-strong)]">
          {message}
        </span>
      ) : null}
    </div>
  );
}

function PresentationModal({
  path,
  onClose,
}: {
  path: DemoPath;
  onClose: () => void;
}) {
  const slides = [
    ["Problem", path.presentation.problem],
    ["Demo", path.presentation.demoIdea],
    ["Architecture", path.presentation.architecture],
    ["Build", path.presentation.buildSteps.join(" | ")],
    ["Deploy", path.presentation.deployPlan.join(" | ")],
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--foreground)] text-[var(--panel)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#4c4a42] bg-[var(--foreground)] px-5 py-4">
        <h2 className="text-xl font-black">{path.presentation.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center border border-[var(--panel)]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
        {slides.map(([title, body], index) => (
          <motion.section
            key={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="min-h-[360px] border border-[var(--panel)] p-8"
          >
            <p className="mono text-sm uppercase tracking-[0.18em] text-[#d6d0bf]">
              Slide {index + 1}
            </p>
            <h3 className="mt-5 text-5xl font-black leading-tight">{title}</h3>
            <p className="mt-6 max-w-4xl text-2xl leading-10 text-[#d6d0bf]">
              {body}
            </p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

export function GenerateWorkspace() {
  const [activeGeneration, setActiveGeneration] = useState<GenerationRow | null>(
    null,
  );
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LabTab>("overview");
  const [activePathId, setActivePathId] = useState<DemoPathId>("portfolio");
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

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
      const latest = readLatestGeneration();
      setActiveGeneration(latest);
      setActivePathId(latest?.selectedPath ?? "portfolio");
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActivePathId(activeGeneration?.selectedPath ?? "portfolio");
      setActiveTab("overview");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeGeneration?.id, activeGeneration?.selectedPath]);

  const mergedHistory = useMemo(() => {
    if (!activeGeneration) {
      return generations;
    }

    const withoutActive = generations.filter(
      (generation) => generation.id !== activeGeneration.id,
    );

    return [activeGeneration, ...withoutActive].slice(0, 10);
  }, [activeGeneration, generations]);

  const activePath = activeGeneration
    ? getActivePath(activeGeneration, activePathId)
    : null;

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
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

          {activeGeneration && activePath ? (
            <div className="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-8">
              <div className="grid gap-5">
                <div className="border border-[var(--foreground)] bg-[var(--foreground)] p-4 text-[var(--panel)] shadow-[10px_10px_0_var(--border)] md:p-5">
                  <p className="mono text-xs uppercase tracking-[0.18em] text-[#d6d0bf]">
                    Developer demo lab
                  </p>
                  <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">
                    {activeGeneration.repo_url ?? "Pasted README"}
                  </h1>
                  <p className="mt-3 max-w-3xl leading-7 text-[#d6d0bf]">
                    {activePath.summary}
                  </p>
                </div>

                <PathPicker
                  activeId={activePath.id}
                  paths={activeGeneration.demoPaths}
                  onSelect={setActivePathId}
                />

                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex min-h-11 items-center gap-2 border px-3 text-sm font-black ${
                        activeTab === tab.id
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--panel)]"
                          : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <ExportButtons generation={activeGeneration} path={activePath} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${activePath.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "overview" ? (
                      <OverviewTab generation={activeGeneration} path={activePath} />
                    ) : null}
                    {activeTab === "blueprint" ? (
                      <BlueprintTab path={activePath} />
                    ) : null}
                    {activeTab === "starter" ? (
                      <StarterTab path={activePath} />
                    ) : null}
                    {activeTab === "presentation" ? (
                      <PresentationTab
                        path={activePath}
                        onOpen={() => setIsPresentationOpen(true)}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              <ApiMatchRail
                apiMatch={activeGeneration.apiMatch}
                path={activePath}
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

      {isPresentationOpen && activePath ? (
        <PresentationModal
          path={activePath}
          onClose={() => setIsPresentationOpen(false)}
        />
      ) : null}
    </main>
  );
}
