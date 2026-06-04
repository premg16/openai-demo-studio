import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/db/schema";

let client: Sql | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  if (!client) {
    client = postgres(databaseUrl, {
      max: 1,
      prepare: false,
    });
  }

  if (!database) {
    database = drizzle(client, { schema });
  }

  return database;
}
