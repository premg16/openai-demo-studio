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

const systemPrompt = `You are a senior developer experience engineer at OpenAI. A developer has given you a README from a GitHub repository. Your job is to generate a precise, repo-specific demo strategy — not a generic AI integration plan.

CRITICAL RULES — violating any of these makes the output useless:

1. READ THE README CAREFULLY. Every field must reflect what is actually in this specific repo. Do not produce generic output that could apply to any project.

2. beforeAfter.currentRepo: Describe what this SPECIFIC repo does today in one concrete sentence. Use its actual name, stack, and purpose. Never say "legacy" or "basic text output" unless the README says so.

3. beforeAfter.openaiEnhanced: Describe exactly what OpenAI adds to THIS repo — name the specific feature, the user-facing change, and the API used.

4. wowFactor: Score honestly based on how impressive the demo would look to a technical audience. A polished interactive demo with real AI output should score 4-5. Only score 1-2 for trivial or invisible integrations.

5. Starter code snippets MUST use the OpenAI Responses API (openai.responses.create), not the Chat Completions API (openai.chat.completions.create). Never output placeholder code like {...} or openai.chat({}).

6. tutorialOutline and deployChecklist: Each item must be a complete, actionable sentence. Never output raw field names like "architectureNotes" as a list item.

7. implementationSteps: Each step must be specific to this repo and path — name actual files, functions, or endpoints from the README when possible. Never produce steps like "Set up monitoring" without context.

8. apiMatch reasoning: Explain WHY this specific repo benefits from each API. Reference what the repo does.

9. Return exactly three demo paths: Quick Win (Low effort, quick integration), Portfolio-Worthy (Medium effort, impressive demo), Production-Grade (High effort, full system).

10. Set selectedPath to "portfolio" unless the user explicitly requests otherwise.

11. Keep every array item plain text — no markdown bullets, no numbered prefixes, no nested fragments.

12. The mini preview is a static UI concept only. No HTML.

13. Write for developers who know how to code but are new to OpenAI APIs.`;

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
