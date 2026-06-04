import { NextResponse } from "next/server";
import { drizzleRowToGeneration, saveGeneration } from "@/db/generations";
import { normalizeGeneration } from "@/lib/generation";
import { analyzeRepo, DEFAULT_BYOK_MODEL, FREE_MODEL } from "@/lib/openai";
import {
  consumeFreeUsage,
  normalizeOptionalApiKey,
  normalizeOptionalModel,
} from "@/lib/usage";
import type { AnalyzeRequest, GenerationRow } from "@/lib/types";

const MAX_README_LENGTH = 8000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeRequest>;
    const readmeText = body.readmeText?.trim();

    if (!readmeText) {
      return NextResponse.json(
        { error: "Missing or empty readmeText" },
        { status: 400 },
      );
    }

    const ownApiKey = normalizeOptionalApiKey(body.openaiApiKey);
    const model = ownApiKey
      ? normalizeOptionalModel(body.model, DEFAULT_BYOK_MODEL)
      : FREE_MODEL;
    let usage = null;

    if (!ownApiKey) {
      try {
        usage = await consumeFreeUsage(request);
      } catch (usageError) {
        console.error("Free usage check failed", usageError);
        return NextResponse.json(
          {
            error:
              "Free usage is temporarily unavailable. Add your own OpenAI key or try again later.",
          },
          { status: 503 },
        );
      }
    }

    if (usage && !usage.allowed) {
      return NextResponse.json(
        {
          error: `Free daily limit reached. Add your own OpenAI key or try again after ${new Date(
            usage.resetAt,
          ).toLocaleString()}.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(usage.limit),
            "X-RateLimit-Remaining": String(usage.remaining),
            "X-RateLimit-Reset": usage.resetAt,
          },
        },
      );
    }

    const truncatedReadme = readmeText.slice(0, MAX_README_LENGTH);
    const generation = normalizeGeneration(
      await analyzeRepo(truncatedReadme, body.preferredPath, {
        apiKey: ownApiKey || undefined,
        model,
      }),
    );
    const rowBase = {
      repoUrl: body.repoUrl?.trim() || null,
      readmeSnippet: truncatedReadme.slice(0, 500),
      generation,
      sampleApp: generation.sampleApp,
      tutorialOutline: generation.tutorialOutline,
      architectureNotes: generation.architectureNotes,
      deployChecklist: generation.deployChecklist,
    };

    let saved: GenerationRow | null = null;

    try {
      const savedRow = await saveGeneration(rowBase);
      saved = savedRow ? drizzleRowToGeneration(savedRow) : null;
    } catch (error) {
      console.error("Generation save failed", error);
    }

    const response: GenerationRow = {
      id: saved?.id ?? crypto.randomUUID(),
      created_at: saved?.created_at ?? new Date().toISOString(),
      repo_url: saved?.repo_url ?? rowBase.repoUrl,
      readme_snippet: saved?.readme_snippet ?? rowBase.readmeSnippet,
      ...generation,
    };

    return NextResponse.json(response, {
      headers: usage
        ? {
            "X-RateLimit-Limit": String(usage.limit),
            "X-RateLimit-Remaining": String(usage.remaining),
            "X-RateLimit-Reset": usage.resetAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Generation failed", error);
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : null;

    if (status === 401) {
      return NextResponse.json(
        { error: "OpenAI key was rejected. Check the key and try again." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Generation failed. Try again." },
      { status: 500 },
    );
  }
}
