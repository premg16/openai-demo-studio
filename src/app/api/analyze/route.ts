import { NextResponse } from "next/server";
import { drizzleRowToGeneration, saveGeneration } from "@/db/generations";
import { normalizeGeneration } from "@/lib/generation";
import { analyzeRepo } from "@/lib/openai";
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

    const truncatedReadme = readmeText.slice(0, MAX_README_LENGTH);
    const generation = normalizeGeneration(
      await analyzeRepo(truncatedReadme, body.preferredPath),
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generation failed", error);
    return NextResponse.json(
      { error: "Generation failed. Try again." },
      { status: 500 },
    );
  }
}
