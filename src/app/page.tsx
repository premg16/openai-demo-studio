import { InputForm } from "@/components/input-form";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  FileCode2,
  GitBranch,
  Presentation,
  Route,
  Sparkles,
} from "lucide-react";

const outcomes = [
  {
    icon: GitBranch,
    title: "Repo x-ray",
    text: "Framework, language, repo type, setup quality, and deploy readiness.",
  },
  {
    icon: Route,
    title: "3 demo paths",
    text: "Quick Win, Portfolio-Worthy, and Production-Grade directions.",
  },
  {
    icon: FileCode2,
    title: "Starter pack",
    text: "Files, env vars, install commands, snippets, and build steps.",
  },
  {
    icon: Presentation,
    title: "Pitch mode",
    text: "A ready-to-present problem, demo idea, architecture, and deploy plan.",
  },
];

const pathRows = [
  ["Quick Win", "Low effort", "README assistant"],
  ["Portfolio-Worthy", "Medium effort", "Interactive repo copilot"],
  ["Production-Grade", "High effort", "Hosted developer workflow"],
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="px-5 py-5 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              OpenAI Demo Studio
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Repo strategy lab for builders
            </p>
          </div>
          <a
            href="/generate"
            className="inline-flex min-h-10 items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-4 text-sm font-black text-[var(--foreground)] shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--foreground)]"
          >
            Saved work
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="px-5 pb-14 pt-4 md:px-8 md:pb-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-[var(--foreground)] bg-[var(--panel)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent-strong)] shadow-[5px_5px_0_var(--foreground)]">
              <Sparkles size={15} aria-hidden="true" />
              Repo in. Demo strategy out.
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.92] text-[var(--foreground)] md:text-7xl xl:text-8xl">
              Find the best OpenAI feature for any repo.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
              Paste a GitHub URL or README. The studio turns it into a clear
              demo direction, architecture map, starter code plan, and pitch you
              can actually build from.
            </p>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                ["Input", "GitHub repo or README"],
                ["Output", "Demo path and starter pack"],
                ["Use", "Portfolio, hackathon, devrel"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-2 text-base font-black text-[var(--foreground)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <InputForm />
            <div className="hidden border border-[var(--foreground)] bg-[var(--ink)] p-4 text-[var(--panel)] shadow-[10px_10px_0_var(--accent)] md:block">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--mint)]">
                    Sample output
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Repo Copilot demo
                  </h2>
                </div>
                <Boxes size={26} aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-2">
                {pathRows.map(([path, effort, idea]) => (
                  <div
                    key={path}
                    className="grid gap-2 border border-white/15 bg-white/[0.06] p-3 sm:grid-cols-[150px_110px_1fr]"
                  >
                    <p className="font-black">{path}</p>
                    <p className="text-sm text-white/70">{effort}</p>
                    <p className="text-sm text-white/85">{idea}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 border border-white/15 bg-[var(--accent)] p-3">
                {[
                  "Architecture blueprint",
                  "Starter files and commands",
                  "GitHub issue body",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--panel)] px-5 py-12 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              What you get back
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              Not a chatbot. A buildable demo brief.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome) => {
              const Icon = outcome.icon;

              return (
                <div
                  key={outcome.title}
                  className="border border-[var(--border)] bg-white p-5"
                >
                  <Icon
                    className="text-[var(--accent)]"
                    size={26}
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-xl font-black text-[var(--foreground)]">
                    {outcome.title}
                  </h3>
                  <p className="mt-2 leading-7 text-[var(--muted)]">
                    {outcome.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-3">
          {[
            ["For portfolio builders", "Turn a repo into a polished project idea with a clear build path."],
            ["For hackathons", "Pick the strongest demo angle fast and start from a usable plan."],
            ["For devrel teams", "Create tutorial outlines, architecture notes, and issue-ready scopes."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="border-l-4 border-[var(--accent)] bg-[var(--panel)] py-2 pl-5"
            >
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
