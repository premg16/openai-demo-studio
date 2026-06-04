# OpenAI Demo Studio

OpenAI Demo Studio turns a GitHub repository URL or pasted README into an immersive developer demo lab. It generates a repo x-ray, three OpenAI demo paths, an architecture blueprint, a starter code pack, exportable Markdown, and a presentation-ready pitch.

![Demo screenshot placeholder](./public/demo-placeholder.svg)

## How It Works

1. Paste a public GitHub repository URL or paste raw README markdown.
2. For GitHub URLs, the app fetches `README.md` from the repo's `main` branch, then falls back to `master`.
3. The README text is truncated to 8,000 characters and sent to `/api/analyze`.
4. The UI shows an analysis timeline while the app fetches, detects, designs, builds, and saves.
5. `/api/analyze` calls the OpenAI Responses API with a strict JSON schema.
6. The app renders a dashboard with Overview, Blueprint, Starter Pack, and Presentation tabs.
7. The generation is saved in Supabase Postgres through Drizzle so it can appear in the recent history panel.

## OpenAI APIs Used

The app uses the OpenAI Responses API because it is the unified endpoint for generating model responses and supports structured JSON output. The model is configured through `OPENAI_MODEL`, with the default kept in `src/lib/openai.ts`.

The route uses `text.format.type = "json_schema"` so the response matches the expected object shape:

```ts
{
  repoXray: { framework, language, repoType, detectedFeatures },
  demoPaths: [
    { id, label, sampleApp, blueprint, starterPack, presentation }
  ],
  selectedPath: "portfolio",
  apiMatch: [{ api, fit, score, reasoning }]
}
```

## Immersive Features

1. The analysis timeline shows the current stage and the exact stage that failed.
2. Repo X-Ray summarizes the framework, language, repo type, setup quality, deploy readiness, and detected features.
3. Choose Your Demo Path lets you switch between Quick Win, Portfolio-Worthy, and Production-Grade without another API call.
4. Blueprint shows the user flow, frontend, backend, OpenAI layer, storage, and deployment as an architecture map.
5. Starter Pack gives files to create, install commands, environment variables, implementation steps, and code snippets.
6. Presentation Mode opens a full-screen pitch view for the generated demo.
7. Export actions copy Markdown, download Markdown, or copy a GitHub issue body.

## Local Setup

1. Install dependencies.

```bash
bun install
```

2. Copy the environment file.

```bash
cp .env.example .env.local
```

3. Add your environment variables.

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=
DATABASE_URL="postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
FREE_DAILY_LIMIT=5
```

Free usage uses `gpt-5-nano`.
`OPENAI_MODEL` is optional and only used as a server fallback when a route does not pass a model explicitly.
`FREE_DAILY_LIMIT` is optional and defaults to `5` generations per client per UTC day.
`DATABASE_URL` should be the Supabase Shared Pooler URI from Project Settings, Database, Connect. Keep it server-side only and do not prefix it with `NEXT_PUBLIC_`.
The direct URI `db.your-ref.supabase.co:5432` can fail on IPv4-only networks because Supabase direct database connections are IPv6-only unless the project has the IPv4 add-on.
If your database password contains special characters, URL-encode the password and keep the full value quoted in `.env.local`.

4. Apply the database migrations.

```bash
bun run db:check
bun run db:migrate
```

You can also run the SQL files in `supabase/migrations` inside the Supabase SQL editor.

Use `bun run db:generate` only after changing `src/db/schema.ts` and wanting a new migration file. Use `bun run db:migrate` to apply migration files and record them in `drizzle.__drizzle_migrations`.

```bash
bun run db:generate
bun run db:migrate
```

Drizzle stores local migration snapshots in `supabase/migrations/meta`. When `bun run db:migrate` runs, Drizzle also creates a database-side migration log table at `drizzle.__drizzle_migrations` and records which SQL files have already been applied.

## Cost Controls

Free generations use the server `OPENAI_API_KEY`, default to `gpt-5-nano`, and are limited by `FREE_DAILY_LIMIT`. Usage is tracked in the `usage_limits` table by a hashed client identity and UTC day.

Users can choose BYOK in the form, paste their own OpenAI API key, and select a model for that single request. BYOK requests skip the free quota and the key is not saved with the generation.

5. Start the app.

```bash
bun dev
```

6. Open `http://localhost:3000`, paste a public repo URL, and analyze it.

## Supabase Table

The app stores generations in a single table mapped in `src/db/schema.ts`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  repo_url text,
  readme_snippet text not null,
  generation jsonb,
  sample_app jsonb not null,
  tutorial_outline jsonb not null,
  architecture_notes jsonb not null,
  deploy_checklist jsonb not null
);
```

Use the migration in `supabase/migrations` or the full SQL in `supabase/schema.sql` to add the canonical `generation` JSON column and keep the legacy columns for old saved rows. The app reads and writes through Drizzle on the server using `DATABASE_URL`.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Set the same environment variables in the Vercel project settings.
4. Deploy with the default Next.js settings.
5. After deploy, test both input modes and confirm the history sidebar shows saved generations.

The repo includes `vercel.json` so Vercel uses Bun for install and build:

```bash
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
vercel env add DATABASE_URL
vercel deploy --prod
```

## Project Scripts

```bash
bun dev
bun run typecheck
bun run build
bun run db:check
bun run db:generate
bun run db:migrate
```

## Definition Of Done

- `bun install` runs clean.
- TypeScript passes with no errors.
- The app runs on `localhost:3000`.
- GitHub URL input fetches a real README.
- `/api/analyze` returns valid structured JSON for that README.
- Repo x-ray, demo paths, blueprint, starter pack, presentation mode, and export actions render correctly.
- Generation saves to Supabase Postgres through Drizzle.
- History sidebar shows past generations.
- Vercel has `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and `DATABASE_URL`.
- The README explains the app as a tutorial.
- The repo is public on GitHub.
