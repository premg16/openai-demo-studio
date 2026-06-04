import { InputForm } from "@/components/input-form";

export default function Home() {
  return (
    <main className="page-shell px-5 py-10 md:px-8 md:py-16">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl content-center gap-10">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex border border-[var(--foreground)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)] shadow-[5px_5px_0_var(--foreground)]">
            Developer demo generator
          </div>
          <h1 className="text-5xl font-black leading-[0.95] text-[var(--foreground)] md:text-7xl">
            Turn any repo into a developer demo
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
            Paste a GitHub URL. Get a sample app idea, tutorial outline,
            architecture notes, and deploy checklist, powered by OpenAI.
          </p>
        </div>

        <InputForm />
      </section>
    </main>
  );
}
