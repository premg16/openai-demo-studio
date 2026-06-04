import OpenAI from "openai";
import { normalizeGeneration } from "@/lib/generation";
import type { DemoGeneration, DemoPathId } from "@/lib/types";

export const FREE_MODEL = "gpt-5-nano";
export const DEFAULT_BYOK_MODEL = "gpt-5-mini";

const stringArray = (minItems: number, maxItems: number) => ({
  type: "array",
  items: { type: "string" },
  minItems,
  maxItems,
});

const sampleAppSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    why: { type: "string" },
  },
  required: ["title", "description", "why"],
  additionalProperties: false,
} as const;

const architectureNotesSchema = {
  type: "object",
  properties: {
    apis: stringArray(1, 6),
    reasoning: { type: "string" },
  },
  required: ["apis", "reasoning"],
  additionalProperties: false,
} as const;

const blueprintSchema = {
  type: "object",
  properties: {
    userFlow: { type: "string" },
    frontend: { type: "string" },
    backend: { type: "string" },
    openaiLayer: { type: "string" },
    storage: { type: "string" },
    deployment: { type: "string" },
  },
  required: [
    "userFlow",
    "frontend",
    "backend",
    "openaiLayer",
    "storage",
    "deployment",
  ],
  additionalProperties: false,
} as const;

const beforeAfterSchema = {
  type: "object",
  properties: {
    currentRepo: { type: "string" },
    openaiEnhanced: { type: "string" },
  },
  required: ["currentRepo", "openaiEnhanced"],
  additionalProperties: false,
} as const;

const starterPackSchema = {
  type: "object",
  properties: {
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          purpose: { type: "string" },
          snippet: { type: "string" },
        },
        required: ["path", "purpose", "snippet"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 5,
    },
    envVars: stringArray(1, 6),
    installCommands: stringArray(1, 5),
    implementationSteps: stringArray(4, 8),
  },
  required: ["files", "envVars", "installCommands", "implementationSteps"],
  additionalProperties: false,
} as const;

const miniPreviewSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    screenType: { type: "string" },
    primaryAction: { type: "string" },
    panels: stringArray(3, 5),
  },
  required: ["title", "screenType", "primaryAction", "panels"],
  additionalProperties: false,
} as const;

const presentationSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    problem: { type: "string" },
    demoIdea: { type: "string" },
    architecture: { type: "string" },
    buildSteps: stringArray(4, 8),
    deployPlan: stringArray(4, 8),
  },
  required: [
    "title",
    "problem",
    "demoIdea",
    "architecture",
    "buildSteps",
    "deployPlan",
  ],
  additionalProperties: false,
} as const;

const demoPathSchema = {
  type: "object",
  properties: {
    id: { type: "string", enum: ["quick_win", "portfolio", "production"] },
    label: { type: "string" },
    summary: { type: "string" },
    sampleApp: sampleAppSchema,
    effort: { type: "string", enum: ["Low", "Medium", "High"] },
    wowFactor: { type: "integer", minimum: 1, maximum: 5 },
    apiFit: { type: "string", enum: ["Strong", "Good", "Experimental"] },
    tutorialOutline: stringArray(4, 8),
    architectureNotes: architectureNotesSchema,
    deployChecklist: stringArray(4, 8),
    blueprint: blueprintSchema,
    beforeAfter: beforeAfterSchema,
    starterPack: starterPackSchema,
    miniPreview: miniPreviewSchema,
    presentation: presentationSchema,
  },
  required: [
    "id",
    "label",
    "summary",
    "sampleApp",
    "effort",
    "wowFactor",
    "apiFit",
    "tutorialOutline",
    "architectureNotes",
    "deployChecklist",
    "blueprint",
    "beforeAfter",
    "starterPack",
    "miniPreview",
    "presentation",
  ],
  additionalProperties: false,
} as const;

const generationSchema = {
  type: "object",
  properties: {
    repoXray: {
      type: "object",
      properties: {
        framework: { type: "string" },
        language: { type: "string" },
        repoType: { type: "string" },
        detectedFeatures: stringArray(3, 8),
        setupQuality: { type: "string" },
        deployReadiness: { type: "string" },
      },
      required: [
        "framework",
        "language",
        "repoType",
        "detectedFeatures",
        "setupQuality",
        "deployReadiness",
      ],
      additionalProperties: false,
    },
    demoPaths: {
      type: "array",
      items: demoPathSchema,
      minItems: 3,
      maxItems: 3,
    },
    selectedPath: {
      type: "string",
      enum: ["quick_win", "portfolio", "production"],
    },
    apiMatch: {
      type: "array",
      items: {
        type: "object",
        properties: {
          api: { type: "string" },
          fit: { type: "string", enum: ["Strong", "Good", "Experimental"] },
          score: { type: "integer", minimum: 1, maximum: 100 },
          reasoning: { type: "string" },
        },
        required: ["api", "fit", "score", "reasoning"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 6,
    },
    sampleApp: sampleAppSchema,
    tutorialOutline: stringArray(4, 8),
    architectureNotes: architectureNotesSchema,
    deployChecklist: stringArray(4, 8),
  },
  required: [
    "repoXray",
    "demoPaths",
    "selectedPath",
    "apiMatch",
    "sampleApp",
    "tutorialOutline",
    "architectureNotes",
    "deployChecklist",
  ],
  additionalProperties: false,
} as const;

const systemPrompt = `You are a developer experience engineer at OpenAI. A developer has given you a README from a GitHub repository. Your job is to turn it into an immersive developer demo lab.

Generate a structured product analysis that helps a developer decide what OpenAI-powered demo to build, how to build it, and how to present it.

Rules:
- Return exactly three demo paths: Quick Win, Portfolio-Worthy, and Production-Grade.
- Set selectedPath to "portfolio" unless the user explicitly asks otherwise.
- Keep every array item plain text, with no markdown bullets, no numbered prefixes, and no nested fragments.
- Recommend current OpenAI APIs such as the Responses API, Realtime API, File Search, Web Search, Embeddings, image generation, and Whisper only when they fit the repo.
- Prefer the Responses API for structured generation and tool-using workflows.
- Do not recommend older Completions API patterns.
- Starter code snippets must be short, practical, and safe to display as text.
- The mini preview is a static UI concept only. Do not output HTML.
- Write for developers who know how to code but are new to OpenAI.`;

let client: OpenAI | null = null;

function getOpenAIClient(apiKey?: string) {
  if (apiKey) {
    return new OpenAI({ apiKey });
  }

  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

export async function analyzeRepo(
  readmeText: string,
  preferredPath: DemoPathId = "portfolio",
  options: {
    apiKey?: string;
    model?: string;
  } = {},
): Promise<DemoGeneration> {
  const response = await getOpenAIClient(options.apiKey).responses.create({
    model: options.model || process.env.OPENAI_MODEL || FREE_MODEL,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Preferred path: ${preferredPath}

README:

${readmeText}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "openai_demo_studio_generation",
        schema: generationSchema,
        strict: true,
      },
    },
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new Error("OpenAI response did not include output text");
  }

  return normalizeGeneration(JSON.parse(outputText) as DemoGeneration);
}
