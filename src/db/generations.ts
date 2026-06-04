import { desc } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import {
  generations,
  type GenerationRecord,
  type NewGenerationRecord,
} from "@/db/schema";
import { rowToGeneration } from "@/lib/generation";
import type { GenerationRow } from "@/lib/types";

type LegacyRowShape = Parameters<typeof rowToGeneration>[0];

export function isMissingDatabaseUrl() {
  return !process.env.DATABASE_URL;
}

export function isMissingGenerationsTable(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  ) {
    return true;
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return message.includes("generations") && message.includes("does not exist");
}

export function drizzleRowToGeneration(row: GenerationRecord): GenerationRow {
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt);

  const legacyRow: LegacyRowShape = {
    id: row.id,
    created_at: createdAt,
    repo_url: row.repoUrl,
    readme_snippet: row.readmeSnippet,
    generation: row.generation,
    sample_app: row.sampleApp,
    tutorial_outline: row.tutorialOutline,
    architecture_notes: row.architectureNotes,
    deploy_checklist: row.deployChecklist,
  };

  return rowToGeneration(legacyRow);
}

export async function saveGeneration(values: NewGenerationRecord) {
  const database = getDatabase();

  if (!database) {
    return null;
  }

  const [row] = await database.insert(generations).values(values).returning();
  return row ?? null;
}

export async function getRecentGenerations() {
  const database = getDatabase();

  if (!database) {
    return null;
  }

  return database
    .select()
    .from(generations)
    .orderBy(desc(generations.createdAt))
    .limit(10);
}
