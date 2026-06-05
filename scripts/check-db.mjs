import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

function loadLocalEnv() {
  if (!existsSync(".env.local")) {
    return;
  }

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing from .env.local.");
  process.exit(1);
}

let parsed;

try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL is not a valid Postgres URL.");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      host: parsed.host,
      username: parsed.username,
      database: parsed.pathname.replace("/", ""),
      hasPassword: Boolean(parsed.password),
      sslmode: parsed.searchParams.get("sslmode"),
    },
    null,
    2,
  ),
);

const sql = postgres(databaseUrl, {
  connect_timeout: 10,
  max: 1,
  prepare: false,
});

try {
  await sql`select 1`;
  console.log("Database connection ok.");
} catch (error) {
  console.error(
    JSON.stringify(
      {
        code: error.code,
        message: error.message,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
