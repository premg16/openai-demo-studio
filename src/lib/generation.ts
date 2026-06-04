import type {
  ApiFit,
  DemoGeneration,
  DemoPath,
  DemoPathId,
  EffortLevel,
  GenerationRow,
} from "@/lib/types";

type LegacyGenerationRecord = {
  id: string;
  created_at: string;
  repo_url: string | null;
  readme_snippet: string;
  generation?: DemoGeneration | null;
  sample_app?: DemoGeneration["sampleApp"] | null;
  tutorial_outline?: string[] | null;
  architecture_notes?: DemoGeneration["architectureNotes"] | null;
  deploy_checklist?: string[] | null;
};

const defaultPathId: DemoPathId = "portfolio";

function clampWowFactor(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function normalizePath(path: DemoPath, fallbackId: DemoPathId): DemoPath {
  return {
    ...path,
    id: path.id || fallbackId,
    effort: path.effort || ("Medium" satisfies EffortLevel),
    apiFit: path.apiFit || ("Good" satisfies ApiFit),
    wowFactor: clampWowFactor(path.wowFactor || 3),
  };
}

export function normalizeGeneration(generation: DemoGeneration): DemoGeneration {
  const paths = generation.demoPaths.map((path, index) =>
    normalizePath(
      path,
      index === 0 ? "quick_win" : index === 1 ? "portfolio" : "production",
    ),
  );
  const selectedPath = paths.some((path) => path.id === generation.selectedPath)
    ? generation.selectedPath
    : defaultPathId;
  const activePath =
    paths.find((path) => path.id === selectedPath) ?? paths[0];

  return {
    ...generation,
    demoPaths: paths,
    selectedPath,
    sampleApp: generation.sampleApp ?? activePath.sampleApp,
    tutorialOutline: generation.tutorialOutline ?? activePath.tutorialOutline,
    architectureNotes:
      generation.architectureNotes ?? activePath.architectureNotes,
    deployChecklist: generation.deployChecklist ?? activePath.deployChecklist,
  };
}

export function getActivePath(generation: DemoGeneration, pathId: DemoPathId) {
  return (
    generation.demoPaths.find((path) => path.id === pathId) ??
    generation.demoPaths.find((path) => path.id === generation.selectedPath) ??
    generation.demoPaths[0]
  );
}

export function createLegacyGeneration(
  row: Pick<
    LegacyGenerationRecord,
    "sample_app" | "tutorial_outline" | "architecture_notes" | "deploy_checklist"
  >,
): DemoGeneration {
  const sampleApp = row.sample_app ?? {
    title: "OpenAI demo extension",
    description:
      "A generated demo concept based on the saved legacy generation.",
    why: "This saved item was created before immersive demo paths were added.",
  };
  const tutorialOutline = row.tutorial_outline ?? [
    "Review the repository setup",
    "Add an OpenAI API route",
    "Connect the frontend workflow",
    "Deploy and verify the demo",
  ];
  const architectureNotes = row.architecture_notes ?? {
    apis: ["Responses API"],
    reasoning:
      "Use the Responses API to generate structured developer-facing output.",
  };
  const deployChecklist = row.deploy_checklist ?? [
    "Add environment variables",
    "Run the production build",
    "Deploy to Vercel",
    "Verify the generated workflow",
  ];
  const path: DemoPath = {
    id: defaultPathId,
    label: "Portfolio-Worthy",
    summary: sampleApp.description,
    sampleApp,
    effort: "Medium",
    wowFactor: 3,
    apiFit: "Good",
    tutorialOutline,
    architectureNotes,
    deployChecklist,
    blueprint: {
      userFlow: "User submits repo context and reviews the generated plan.",
      frontend: "Render the generated cards in the Next.js interface.",
      backend: "Use API routes to call OpenAI and persist the result.",
      openaiLayer: architectureNotes.reasoning,
      storage: "Save generation metadata and JSON output in Supabase.",
      deployment: "Deploy the Next.js app to Vercel with required env vars.",
    },
    beforeAfter: {
      currentRepo: "Existing repository context from a saved generation.",
      openaiEnhanced: sampleApp.description,
    },
    starterPack: {
      files: [
        {
          path: "src/app/api/demo/route.ts",
          purpose: "Call OpenAI for the suggested demo workflow.",
          snippet: "export async function POST() { /* add demo call */ }",
        },
      ],
      envVars: ["OPENAI_API_KEY"],
      installCommands: ["bun add openai"],
      implementationSteps: tutorialOutline,
    },
    miniPreview: {
      title: sampleApp.title,
      screenType: "Generated demo preview",
      primaryAction: "Run demo",
      panels: ["Input", "Generated output", "Deploy checklist"],
    },
    presentation: {
      title: sampleApp.title,
      problem: sampleApp.why,
      demoIdea: sampleApp.description,
      architecture: architectureNotes.reasoning,
      buildSteps: tutorialOutline,
      deployPlan: deployChecklist,
    },
  };

  return normalizeGeneration({
    repoXray: {
      framework: "Unknown",
      language: "Unknown",
      repoType: "Legacy generation",
      detectedFeatures: ["Saved before repo x-ray support"],
      setupQuality: "Unknown",
      deployReadiness: "Review required",
    },
    demoPaths: [path],
    selectedPath: defaultPathId,
    apiMatch: architectureNotes.apis.map((api) => ({
      api,
      fit: "Good",
      score: 75,
      reasoning: architectureNotes.reasoning,
    })),
    sampleApp,
    tutorialOutline,
    architectureNotes,
    deployChecklist,
  });
}

export function rowToGeneration(row: LegacyGenerationRecord): GenerationRow {
  const generation = normalizeGeneration(
    row.generation ?? createLegacyGeneration(row),
  );

  return {
    id: row.id,
    created_at: row.created_at,
    repo_url: row.repo_url,
    readme_snippet: row.readme_snippet,
    ...generation,
  };
}
