import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { GenerationRow } from "@/lib/types";

type GenerationRecord = {
  id: string;
  created_at: string;
  repo_url: string | null;
  readme_snippet: string;
  sample_app: GenerationRow["sampleApp"];
  tutorial_outline: GenerationRow["tutorialOutline"];
  architecture_notes: GenerationRow["architectureNotes"];
  deploy_checklist: GenerationRow["deployChecklist"];
};

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase history fetch failed", error);
      return NextResponse.json({ error: "Could not load generations" }, { status: 500 });
    }

    const rows: GenerationRow[] = ((data ?? []) as GenerationRecord[]).map(
      (row) => ({
        id: row.id,
        created_at: row.created_at,
        repo_url: row.repo_url,
        readme_snippet: row.readme_snippet,
        sampleApp: row.sample_app,
        tutorialOutline: row.tutorial_outline,
        architectureNotes: row.architecture_notes,
        deployChecklist: row.deploy_checklist,
      }),
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Supabase history fetch failed", error);
    return NextResponse.json({ error: "Could not load generations" }, { status: 500 });
  }
}
