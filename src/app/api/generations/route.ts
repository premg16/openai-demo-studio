import { NextResponse } from "next/server";
import { rowToGeneration } from "@/lib/generation";
import { getSupabaseClient } from "@/lib/supabase";
import type { DemoGeneration, GenerationRow } from "@/lib/types";

type GenerationRecord = {
  id: string;
  created_at: string;
  repo_url: string | null;
  readme_snippet: string;
  generation?: DemoGeneration | null;
  sample_app?: GenerationRow["sampleApp"] | null;
  tutorial_outline?: GenerationRow["tutorialOutline"] | null;
  architecture_notes?: GenerationRow["architectureNotes"] | null;
  deploy_checklist?: GenerationRow["deployChecklist"] | null;
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
      if (error.code === "PGRST205") {
        return NextResponse.json([]);
      }

      return NextResponse.json({ error: "Could not load generations" }, { status: 500 });
    }

    const rows: GenerationRow[] = ((data ?? []) as GenerationRecord[]).map(
      rowToGeneration,
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Supabase history fetch failed", error);
    return NextResponse.json({ error: "Could not load generations" }, { status: 500 });
  }
}
