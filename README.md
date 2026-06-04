# OpenAI Demo Studio

OpenAI Demo Studio turns a GitHub repository URL or pasted README into four developer-facing outputs: a sample app idea, tutorial outline, architecture notes, and deploy checklist. It is built as a practical demo of the OpenAI Responses API with structured outputs, plus a reusable tool for developers evaluating how OpenAI can fit into an existing project.

![Demo screenshot placeholder](./public/demo-placeholder.svg)

## How It Works

1. Paste a public GitHub repository URL or paste raw README markdown.
2. For GitHub URLs, the app fetches `README.md` from the repo's `main` branch, then falls back to `master`.
3. The README text is truncated to 8,000 characters and sent to `/api/analyze`.
4. `/api/analyze` calls the OpenAI Responses API with a strict JSON schema.
5. The app renders four typed result cards in `/generate`.
6. The generation is saved in Supabase so it can appear in the recent history panel.

## OpenAI APIs Used

The app uses the OpenAI Responses API because it is the current unified API for generating model responses and supports structured JSON output from the same endpoint. The model is configured as `gpt-4o` because the product needs strong developer-facing writing, reasoning over README content, and reliable structured output.

The route uses `text.format.type = "json_schema"` so the response matches the expected object shape:

```ts
{
  sampleApp: { title, description, why },
  tutorialOutline: string[],
  architectureNotes: { apis, reasoning },
  deployChecklist: string[]
}
```

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Create the Supabase table by running the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

5. Start the app.

```bash
bun dev
```

6. Open `http://localhost:3000`, paste a public repo URL, and analyze it.

## Supabase Table

The app stores generations in a single public table:

```sql
create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  repo_url text,
  readme_snippet text not null,
  sample_app jsonb not null,
  tutorial_outline jsonb not null,
  architecture_notes jsonb not null,
  deploy_checklist jsonb not null
);
```

For v1, history is public. Use the full SQL in `supabase/schema.sql` to enable row level security with explicit public read and insert policies for the anon role.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Set the same three environment variables in the Vercel project settings.
4. Deploy with the default Next.js settings.
5. After deploy, test both input modes and confirm the history sidebar shows saved generations.

## Project Scripts

```bash
bun dev
bun run typecheck
bun run build
```

## Definition Of Done

- `bun install` runs clean.
- TypeScript passes with no errors.
- The app runs on `localhost:3000`.
- GitHub URL input fetches a real README.
- `/api/analyze` returns valid structured JSON for that README.
- All four result cards render correctly.
- Generation saves to Supabase.
- History sidebar shows past generations.
- Vercel has the required environment variables.
- The README explains the app as a tutorial.
- The repo is public on GitHub.
