import { NextResponse } from "next/server";
import { normalizeGeneration } from "@/lib/generation";
import { analyzeRepo } from "@/lib/openai";
import { getSupabaseClient } from "@/lib/supabase";
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
      repo_url: body.repoUrl?.trim() || null,
      readme_snippet: truncatedReadme.slice(0, 500),
      generation,
      sample_app: generation.sampleApp,
      tutorial_outline: generation.tutorialOutline,
      architecture_notes: generation.architectureNotes,
      deploy_checklist: generation.deployChecklist,
    };
    const supabase = getSupabaseClient();
    let saved: {
      id: string;
      created_at: string;
      repo_url: string | null;
      readme_snippet: string;
      generation?: unknown;
      sample_app: unknown;
      tutorial_outline: unknown;
      architecture_notes: unknown;
      deploy_checklist: unknown;
    } | null = null;

    if (supabase) {
      const { data, error } = await supabase
        .from("generations")
        .insert(rowBase)
        .select()
        .single();

      if (error) {
        console.error("Supabase write failed", error);
      } else {
        saved = data;
      }
    }

    const response: GenerationRow = {
      id: saved?.id ?? crypto.randomUUID(),
      created_at: saved?.created_at ?? new Date().toISOString(),
      repo_url: saved?.repo_url ?? rowBase.repo_url,
      readme_snippet: saved?.readme_snippet ?? rowBase.readme_snippet,
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
