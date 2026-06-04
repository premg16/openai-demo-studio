import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { ArchitectureNotes, DemoGeneration, SampleApp } from "@/lib/types";

export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  repoUrl: text("repo_url"),
  readmeSnippet: text("readme_snippet").notNull(),
  generation: jsonb("generation").$type<DemoGeneration | null>(),
  sampleApp: jsonb("sample_app").$type<SampleApp>().notNull(),
  tutorialOutline: jsonb("tutorial_outline").$type<string[]>().notNull(),
  architectureNotes: jsonb("architecture_notes")
    .$type<ArchitectureNotes>()
    .notNull(),
  deployChecklist: jsonb("deploy_checklist").$type<string[]>().notNull(),
}).enableRLS();

export const usageLimits = pgTable(
  "usage_limits",
  {
    identityHash: text("identity_hash").notNull(),
    day: text("day").notNull(),
    count: integer("count").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.identityHash, table.day] })],
).enableRLS();

export type GenerationRecord = typeof generations.$inferSelect;
export type NewGenerationRecord = typeof generations.$inferInsert;
