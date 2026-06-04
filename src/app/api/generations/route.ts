import { NextResponse } from "next/server";
import {
  drizzleRowToGeneration,
  getRecentGenerations,
  isMissingDatabaseUrl,
  isMissingGenerationsTable,
} from "@/db/generations";

export async function GET() {
  try {
    if (isMissingDatabaseUrl()) {
      return NextResponse.json(
        {
          error:
            "DATABASE_URL is not configured. Add your Supabase direct connection string to .env.local.",
        },
        { status: 503 },
      );
    }

    const rows = await getRecentGenerations();

    return NextResponse.json((rows ?? []).map(drizzleRowToGeneration));
  } catch (error) {
    console.error("Generation history fetch failed", error);

    if (isMissingGenerationsTable(error)) {
      return NextResponse.json(
        {
          error:
            "The generations table is not set up. Run the migration in supabase/migrations or the SQL in supabase/schema.sql.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Could not load generations" }, { status: 500 });
  }
}
