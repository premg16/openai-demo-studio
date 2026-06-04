import OpenAI from "openai";
import type { DemoGeneration } from "@/lib/types";

const generationSchema = {
  type: "object",
  properties: {
    sampleApp: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        why: { type: "string" },
      },
      required: ["title", "description", "why"],
      additionalProperties: false,
    },
    tutorialOutline: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 10,
    },
    architectureNotes: {
      type: "object",
      properties: {
        apis: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
        reasoning: { type: "string" },
      },
      required: ["apis", "reasoning"],
      additionalProperties: false,
    },
    deployChecklist: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 10,
    },
  },
  required: [
    "sampleApp",
    "tutorialOutline",
    "architectureNotes",
    "deployChecklist",
  ],
  additionalProperties: false,
} as const;

const systemPrompt = `You are a developer experience engineer at OpenAI. A developer has given you a README from a GitHub repository. Your job is to help them understand how to extend this project with OpenAI APIs.

Generate four outputs:
1. A sample app idea that builds on this repo using at least one OpenAI API
2. A step-by-step tutorial outline for building that sample app
3. Architecture notes explaining which OpenAI APIs to use and why
4. A practical deploy checklist

Be specific. Name current OpenAI APIs such as the Responses API, gpt-4o, Realtime API, Whisper, DALL-E 3, and Embeddings. Prefer the Responses API and gpt-4o for text generation unless another API is a better fit. Do not recommend older Completions API patterns. Keep every array item plain text, with no markdown bullets, no numbered prefixes, and no nested fragments. Write for developers who know how to code but are new to OpenAI.`;

let client: OpenAI | null = null;

function getOpenAIClient() {
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
): Promise<DemoGeneration> {
  const response = await getOpenAIClient().responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `README:\n\n${readmeText}`,
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

  return JSON.parse(outputText) as DemoGeneration;
}
