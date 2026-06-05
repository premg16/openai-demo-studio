# OpenAI Demo Studio PRD

## 1. Product Summary

OpenAI Demo Studio helps a developer turn any GitHub repository or pasted README into a buildable OpenAI demo plan.

The app answers a practical developer question:

> What OpenAI feature should I add to this repo, and how do I build and present it?

The product is not a generic chatbot. It is a developer demo strategy studio. It analyzes repo context and returns a structured output that includes repo x-ray, demo path options, architecture blueprint, starter code plan, deployment checklist, exports, and presentation content.

## 2. Current Product Positioning

### Primary Positioning

Find the best OpenAI feature for any repo.

### Product Promise

Paste a GitHub URL or README. Get a buildable OpenAI demo direction, architecture map, starter pack, and pitch.

### Short Description

OpenAI Demo Studio turns repository context into a developer-ready OpenAI demo brief.

### One Sentence Pitch

OpenAI Demo Studio helps developers, hackathon teams, and devrel teams convert existing repositories into clear, polished, OpenAI-powered demo projects.

## 3. Target Users

### Primary Users

1. Portfolio builders
   - Want to turn an existing repo into a stronger project.
   - Need a clear idea, architecture, and implementation path.

2. Hackathon participants
   - Need to decide fast what OpenAI feature fits a repo.
   - Need a plan that can be built under time pressure.

3. Developer advocates
   - Need sample app ideas, tutorial outlines, issue scopes, and pitch materials.
   - Need repeatable demo planning from arbitrary repos.

4. Founders and product engineers
   - Want to prototype an OpenAI feature for an existing product.
   - Need options across quick, portfolio, and production levels.

### Secondary Users

1. Engineering managers
   - Need GitHub issue-ready implementation plans.

2. Technical writers
   - Need tutorial outlines and architecture explanations.

3. Students and bootcamp developers
   - Need help turning repo ideas into concrete demos.

## 4. User Jobs

### Main Job

When I have a repo but do not know what OpenAI feature to build, I want a clear demo concept and implementation plan so I can start building confidently.

### Supporting Jobs

1. Understand what kind of repo I am looking at.
2. Identify OpenAI feature opportunities that match the repo.
3. Compare multiple demo paths by effort and wow factor.
4. Get architecture guidance without manually writing a design doc.
5. Get starter files, commands, environment variables, and snippets.
6. Export the plan into Markdown or a GitHub issue.
7. Present the demo idea in a clean slide-like format.
8. Use my own OpenAI key if I do not want to consume free quota.

## 5. Problem Statement

Developers often have repositories but struggle to turn them into impressive, relevant OpenAI demos. The gap is not only code generation. The harder step is product framing:

1. What should this repo become?
2. Which OpenAI API fits it?
3. What is the user flow?
4. What architecture should be used?
5. What files and environment variables are needed?
6. How should it be pitched?

OpenAI Demo Studio fills this strategy and planning gap.

## 6. Goals

### Product Goals

1. Make the app purpose obvious within the first viewport.
2. Let users analyze a GitHub repo or pasted README.
3. Produce structured, consistent, buildable output.
4. Offer three demo path levels:
   - Quick Win
   - Portfolio-Worthy
   - Production-Grade
5. Help users move from idea to implementation plan.
6. Control platform cost through free quota and BYOK.
7. Keep the product usable without auth in v1.

### Developer Goals

1. Keep stack simple:
   - Next.js App Router
   - Bun
   - Tailwind CSS
   - Framer Motion
   - Drizzle ORM
   - Supabase Postgres
   - OpenAI Responses API
2. Keep data model explicit and migration-backed.
3. Avoid rendering model-generated HTML.
4. Keep output structured and safe to render.
5. Keep BYOK keys transient and never store them.

## 7. Non Goals

1. The app does not modify the target repository.
2. The app does not open pull requests.
3. The app does not clone private repositories.
4. The app does not deeply inspect source files beyond README content.
5. The app does not provide user accounts in v1.
6. The app does not stream model tokens in v1.
7. The app does not store BYOK keys.
8. The app does not provide billing or paid plans yet.

## 8. Current Feature Set

### 8.1 Landing Page

Purpose:

Explain the app clearly and drive users to paste a GitHub URL or README.

Current content:

1. Brand:
   - OpenAI Demo Studio
   - Repo strategy lab for builders
2. Main headline:
   - Find the best OpenAI feature for any repo.
3. Supporting copy:
   - Paste a GitHub URL or README. The studio turns it into a clear demo direction, architecture map, starter code plan, and pitch you can actually build from.
4. Input, output, and use case cards:
   - Input: GitHub repo or README
   - Output: Demo path and starter pack
   - Use: Portfolio, hackathon, devrel
5. Embedded input form.
6. Sample output panel.
7. Output explanation:
   - Repo x-ray
   - 3 demo paths
   - Starter pack
   - Pitch mode
8. Target audience section:
   - Portfolio builders
   - Hackathons
   - Devrel teams

### 8.2 Input Modes

The app supports two input modes:

1. GitHub URL
   - Accepts public GitHub repository URLs.
   - Fetches README from `main`, then `master`.
   - Shows a clear fetch failure state.

2. Paste README
   - Accepts raw README markdown.
   - Bypasses GitHub fetch.
   - Useful when README fetching fails or the repo is private.

### 8.3 Analysis Timeline

The form shows staged progress:

1. Fetch README
2. Detect stack
3. Find OpenAI fit
4. Generate demo paths
5. Build starter pack
6. Save generation

Failure behavior:

1. Shows the failed stage.
2. Shows a clear error message.
3. Offers retry.
4. Offers paste README instead for fetch failures.

### 8.4 Free Mode

Free mode uses the server-side `OPENAI_API_KEY`.

Model:

1. Default free model is `gpt-5-nano`.
2. Free usage does not expose the server key to the browser.
3. Free usage is rate limited.

Rate limit:

1. Default limit is 5 generations per client per UTC day.
2. Configured with `FREE_DAILY_LIMIT`.
3. Tracked in Supabase Postgres table `usage_limits`.
4. Identity is hashed from request IP and user agent.
5. API returns rate limit headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`

Failure behavior:

1. If free quota is exceeded, API returns `429`.
2. User is told to use BYOK or try later.
3. If database-backed quota is unavailable, free usage fails closed with `503`.

### 8.5 BYOK Mode

BYOK means bring your own key.

User controls:

1. Checkbox:
   - Use my OpenAI key
2. Password input:
   - OpenAI API key
3. Model select:
   - GPT-5 mini
   - GPT-5
   - GPT-4.1
   - GPT-4.1 mini
   - GPT-4.1 nano

Behavior:

1. BYOK key is sent only to `/api/analyze`.
2. BYOK key is never saved.
3. BYOK key is not placed in session storage.
4. BYOK key is not stored in Supabase.
5. BYOK requests skip free quota.
6. BYOK defaults to `gpt-5-mini`.
7. If BYOK key is rejected, the API returns a clear key error.

### 8.6 Generated Output

The app generates a structured result with:

1. Repo x-ray
   - Framework
   - Language
   - Repo type
   - Detected features
   - Setup quality
   - Deploy readiness

2. Demo paths
   - Quick Win
   - Portfolio-Worthy
   - Production-Grade

3. Selected path
   - Defaults to Portfolio-Worthy

4. API match
   - Recommended OpenAI APIs
   - Fit label
   - Fit score
   - Reasoning

5. Blueprint
   - User flow
   - Frontend
   - Backend
   - OpenAI layer
   - Storage
   - Deployment

6. Before and after
   - Current repo
   - OpenAI-enhanced version

7. Starter pack
   - Files to create
   - Environment variables
   - Install commands
   - Implementation steps
   - Short snippets

8. Mini preview
   - Static UI concept
   - Not arbitrary HTML

9. Presentation
   - Title
   - Problem
   - Demo idea
   - Architecture
   - Build steps
   - Deploy plan

10. Legacy-compatible sections
   - Sample app
   - Tutorial outline
   - Architecture notes
   - Deploy checklist

### 8.7 Result Dashboard

Route:

`/generate`

Layout:

1. Left sidebar
   - Saved history
   - Generation metadata

2. Main content
   - Empty state when no generation is open
   - Repo x-ray summary
   - Main tabs:
     - Overview
     - Blueprint
     - Starter Pack
     - Presentation

3. Right rail on desktop
   - API match
   - Effort
   - Wow factor
   - API fit

4. Demo path control
   - Quick Win
   - Portfolio-Worthy
   - Production-Grade

Expected behavior:

1. Switching paths updates the visible blueprint, starter pack, preview, and presentation content.
2. No new API call is made when switching paths.
3. History can restore saved generations.
4. Old generation formats render through compatibility fallback.

### 8.8 Exports

Export actions:

1. Copy Markdown
2. Download Markdown
3. Copy GitHub issue body

Export content should include:

1. Demo title
2. Repo x-ray
3. Selected demo path
4. API match
5. Blueprint
6. Starter files
7. Environment variables
8. Install commands
9. Build steps
10. Deploy checklist

### 8.9 Presentation Mode

Presentation mode provides a full-screen pitch view.

Slides or slide-like sections:

1. Title
2. Problem
3. Demo idea
4. Architecture
5. Build steps
6. Deploy plan

Expected behavior:

1. Opens from result dashboard.
2. Closes cleanly.
3. Is keyboard accessible.
4. Does not overlap content on mobile.

## 9. Product Requirements

### 9.1 Landing Page Requirements

1. Users must understand the product purpose within 5 seconds.
2. First viewport must show:
   - Product name
   - Clear headline
   - One-sentence value proposition
   - Input form or clear path to input form
   - Sample output signal
3. Copy must explain what users get back.
4. Page must be responsive across:
   - Mobile
   - Tablet
   - Desktop
5. Page must not look like a generic AI wrapper.
6. Page must preserve current visual direction:
   - Editorial
   - Developer lab
   - Grid background
   - Strong black shadows
   - Cream panel system
   - Green accent

### 9.2 Input Requirements

1. GitHub URL validation must run before fetch.
2. Invalid URL must show a clear error.
3. Typo repo or missing README must show a clear fetch error.
4. README paste mode must work without a GitHub URL.
5. Form must prevent duplicate submissions while loading.
6. Error state must not erase user input.
7. BYOK key must not be required in free mode.
8. BYOK key must be required when BYOK mode is enabled.
9. BYOK model select must only affect BYOK requests.

### 9.3 API Requirements

Endpoint:

`POST /api/analyze`

Request body:

```json
{
  "readmeText": "string",
  "repoUrl": "string | null",
  "preferredPath": "quick_win | portfolio | production",
  "openaiApiKey": "string | undefined",
  "model": "string | undefined"
}
```

Free request behavior:

1. Use server `OPENAI_API_KEY`.
2. Use `gpt-5-nano`.
3. Consume daily quota before OpenAI call.
4. Return `429` if quota is exceeded.
5. Return rate limit headers.

BYOK request behavior:

1. Use request-provided key.
2. Use selected request model.
3. Skip free quota.
4. Do not save key.
5. Return `401` if key is rejected.

Response:

Returns a `GenerationRow` with generated content and metadata.

### 9.4 GitHub README Fetch Requirements

Endpoint:

`GET /api/fetch-readme?url=...`

Requirements:

1. Only GitHub repository URLs are accepted.
2. Try `main` branch first.
3. Try `master` branch second.
4. Return readable error if README cannot be fetched.
5. Do not require GitHub auth in v1.

### 9.5 History Requirements

Endpoint:

`GET /api/generations`

Requirements:

1. Return latest 10 generations.
2. Prefer `generation` JSON column.
3. Fall back to legacy columns when needed.
4. Return clear setup error if table is missing.
5. Do not expose database credentials to the client.

## 10. Data Model

### 10.1 `generations`

Purpose:

Stores generated demo outputs.

Columns:

1. `id`
   - UUID primary key
2. `created_at`
   - Timestamp with timezone
3. `repo_url`
   - Optional source repo URL
4. `readme_snippet`
   - First 500 characters of README
5. `generation`
   - Canonical full JSON result
6. `sample_app`
   - Legacy compatibility JSON
7. `tutorial_outline`
   - Legacy compatibility JSON
8. `architecture_notes`
   - Legacy compatibility JSON
9. `deploy_checklist`
   - Legacy compatibility JSON

Security:

1. RLS enabled.
2. `anon` and `authenticated` roles have direct access revoked.
3. Server uses `DATABASE_URL`.

### 10.2 `usage_limits`

Purpose:

Tracks free quota usage.

Columns:

1. `identity_hash`
   - Hashed client identity
2. `day`
   - UTC date string
3. `count`
   - Number of free generations consumed
4. `updated_at`
   - Last usage timestamp

Primary key:

`identity_hash`, `day`

Security:

1. RLS enabled.
2. `anon` and `authenticated` roles have direct access revoked.
3. No raw IPs are stored.

### 10.3 `drizzle.__drizzle_migrations`

Purpose:

Tracks applied Drizzle SQL migrations.

Behavior:

1. Created by `bun run db:migrate`.
2. Records applied migration files.
3. Prevents rerunning already-applied migrations.

## 11. Environment Variables

Required:

1. `OPENAI_API_KEY`
   - Server key for free mode.

2. `DATABASE_URL`
   - Supabase Shared Pooler URI.

Optional:

1. `OPENAI_MODEL`
   - Server fallback only when no explicit model is passed.

2. `FREE_DAILY_LIMIT`
   - Defaults to `5`.

Client-side Supabase keys are not required for current server-side Drizzle access.

## 12. OpenAI Integration

API:

Responses API

Free model:

`gpt-5-nano`

BYOK default model:

`gpt-5-mini`

Structured output:

The API uses `text.format.type = "json_schema"` with strict schema validation.

Important rules:

1. Do not render model-generated HTML.
2. Keep snippets short and text-only.
3. Keep output JSON compatible with `DemoGeneration`.
4. Normalize output before rendering.
5. Store generated JSON in `generation`.

## 13. Security And Privacy

### Current Security Properties

1. Server OpenAI key stays server-side.
2. BYOK key is transient.
3. BYOK key is not saved.
4. BYOK key is not stored in session storage.
5. Supabase database access happens server-side.
6. RLS is enabled on public tables.
7. Direct browser roles cannot read or write tables.
8. Free usage stores hashed identity only.

### Risks

1. No auth means quota is approximate.
2. IP and user agent based identity can be bypassed.
3. In serverless environments, users can still submit many invalid requests.
4. BYOK keys are sent through the app server for request execution.
5. Saved generations may include sensitive README content if users paste it.

### Future Security Improvements

1. Add auth.
2. Add per-user quotas.
3. Add organization-level usage controls.
4. Add request body size limits beyond README truncation.
5. Add abuse monitoring.
6. Add optional "do not save this generation" mode.
7. Add retention controls for saved generations.

## 14. Cost Controls

Current:

1. Free requests use `gpt-5-nano`.
2. Free requests are limited by `FREE_DAILY_LIMIT`.
3. BYOK skips free quota.
4. Invalid inputs are rejected before model calls where possible.

Needed next:

1. Show remaining free quota in the UI.
2. Add usage analytics.
3. Add admin override for daily limits.
4. Add optional captcha or abuse challenge.
5. Add no-save mode for BYOK users.
6. Add model cost labels in BYOK selector.

## 15. UX Principles

1. Show the outcome before asking for effort.
2. Keep technical users moving fast.
3. Use concrete labels instead of vague product language.
4. Make failure states recoverable.
5. Never hide cost-related behavior.
6. Do not over-explain obvious controls.
7. Keep output scannable and exportable.
8. Avoid decorative complexity that slows repeated use.

## 16. Current Visual Direction

Style:

1. Developer lab
2. Editorial
3. Slightly brutalist
4. Cream grid background
5. Strong black foreground
6. Green primary action
7. Heavy shadow blocks
8. Compact dashboard panels

Design rules:

1. Keep cards sharp or lightly rounded.
2. Avoid purple gradient SaaS look.
3. Avoid stock-looking visuals.
4. Use icons for controls.
5. Keep text legible on mobile.
6. Ensure buttons do not wrap awkwardly.
7. Ensure key content appears before scroll on desktop.

## 17. Accessibility Requirements

1. All interactive controls must be keyboard accessible.
2. Form inputs must have accessible names.
3. Error states must be announced or visible.
4. Color contrast must pass normal text standards.
5. Presentation mode must close with keyboard.
6. Focus states must be visible.
7. Tabs must be navigable.
8. Export buttons must have clear labels.
9. Mobile layout must not require horizontal scrolling.

## 18. Error States

### Input Errors

1. Invalid GitHub URL
2. Empty README
3. Missing BYOK key when BYOK mode is enabled

### Fetch Errors

1. Repo not found
2. README not found
3. GitHub request failure

### Generation Errors

1. OpenAI failure
2. Invalid BYOK key
3. Structured output failure
4. Free quota exceeded
5. Free quota unavailable

### Storage Errors

1. Database unavailable
2. Generations table missing
3. Usage table missing
4. Save failure

Expected behavior:

1. Errors must explain next action.
2. Errors must not erase input.
3. Errors must avoid internal stack traces.

## 19. Analytics And Metrics

Recommended product metrics:

1. Landing page to analyze click rate
2. GitHub URL versus README paste usage
3. Fetch README failure rate
4. Analysis success rate
5. Free quota exceeded count
6. BYOK adoption rate
7. Most selected demo path
8. Export usage rate
9. Presentation mode usage rate
10. History restore usage
11. Average generation latency
12. Save failure rate

Recommended technical metrics:

1. API error rate
2. OpenAI request latency
3. Supabase query latency
4. Rate limit table write failures
5. Model error distribution

## 20. QA Test Plan

### Local Setup

1. `bun install`
2. Configure `.env.local`
3. `bun run db:check`
4. `bun run db:migrate`
5. `bun dev`

### Static Checks

1. `bun run lint`
2. `bun run typecheck`
3. `bun run build`
4. `bun run db:generate`

Expected `db:generate` result:

No schema changes.

### Browser QA

Homepage:

1. Page loads.
2. Purpose is clear in first viewport.
3. GitHub tab is active by default.
4. Paste README tab switches correctly.
5. BYOK toggle opens key and model fields.
6. BYOK toggle can be turned off.
7. Form is readable on mobile.

Input validation:

1. Invalid GitHub URL shows error.
2. Empty README shows error.
3. BYOK enabled with no key shows error.

Fetch README:

1. Valid repo fetches README.
2. Typo repo shows fetch error.
3. Missing README shows fetch error.
4. Paste README fallback works.

Generation:

1. Free mode calls server model.
2. Free mode increments usage.
3. Free mode returns rate headers.
4. Free quota exceeded returns `429`.
5. BYOK request skips usage table.
6. Invalid BYOK key returns key error.
7. Successful generation saves to database.

Result dashboard:

1. Empty state renders.
2. History loads latest generations.
3. Generation opens from session storage.
4. Repo x-ray renders.
5. Three paths render.
6. Path switching updates content.
7. Blueprint map renders.
8. Starter pack renders files, env vars, commands, snippets.
9. Presentation mode opens and closes.
10. Copy Markdown works.
11. Download Markdown works.
12. Copy GitHub issue body works.

Responsive:

1. Mobile 390 px
2. Tablet 768 px
3. Desktop 1440 px
4. No horizontal scroll
5. No overlapping text
6. Form controls remain usable

## 21. Acceptance Criteria

### MVP Acceptance

1. User can paste a GitHub repo URL and generate a result.
2. User can paste README content and generate a result.
3. Free mode uses `gpt-5-nano`.
4. Free mode is rate limited.
5. BYOK mode works without storing the key.
6. Result dashboard shows all major generated sections.
7. User can export generated content.
8. Generations save to Supabase.
9. History restores saved generations.
10. App builds successfully.

### Product Polish Acceptance

1. Landing page makes the product purpose obvious.
2. First-time user understands what they will get.
3. Failure states are actionable.
4. Result dashboard is scannable.
5. Mobile layout is polished.
6. Exported Markdown is useful without editing.

## 22. Known Limitations

1. No auth.
2. No private repo access.
3. README-only context can miss source-level details.
4. Rate limiting is anonymous and approximate.
5. No streaming generation.
6. No generated code files are written to a target repo.
7. No PR creation.
8. No payment system.
9. No admin dashboard.
10. No usage chart.

## 23. Roadmap

### Phase 1: Product Polish

1. Add remaining free quota display.
2. Add example repo shortcuts.
3. Improve error copy for all API states.
4. Add loading skeletons for history.
5. Improve mobile result dashboard.
6. Add better empty state on `/generate`.
7. Add copy feedback to export buttons.

### Phase 2: Trust And Control

1. Add no-save toggle.
2. Add privacy notice for README content.
3. Add BYOK key validation before analysis.
4. Add model cost labels.
5. Add per-session local draft persistence.

### Phase 3: Auth And Accounts

1. Add user authentication.
2. Move quota from anonymous identity to user ID.
3. Add saved generation ownership.
4. Add private generation history.
5. Add account-level usage page.

### Phase 4: Repo-Aware Generation

1. GitHub OAuth.
2. Private repo access.
3. Source tree scan.
4. File-level architecture detection.
5. Better framework-specific recommendations.

### Phase 5: Build Automation

1. Generate patch files.
2. Create GitHub issues.
3. Create pull request drafts.
4. Generate implementation branch plans.
5. Add deploy readiness checks.

### Phase 6: Teams And Devrel

1. Shared workspace.
2. Team history.
3. Demo templates.
4. Brandable presentation mode.
5. Export to docs.
6. Export to project management tools.

## 24. Development Notes

### Current Commands

```bash
bun dev
bun run lint
bun run typecheck
bun run build
bun run db:check
bun run db:generate
bun run db:migrate
```

### Important Files

1. `src/app/page.tsx`
   - Landing page.

2. `src/components/input-form.tsx`
   - Input flow, BYOK controls, analysis timeline.

3. `src/app/api/analyze/route.ts`
   - Main generation endpoint, model selection, rate limiting, save.

4. `src/lib/openai.ts`
   - Responses API call and JSON schema.

5. `src/lib/usage.ts`
   - Free quota tracking.

6. `src/db/schema.ts`
   - Drizzle schema.

7. `src/db/generations.ts`
   - Generation persistence and compatibility conversion.

8. `src/components/generate-workspace.tsx`
   - Result dashboard.

9. `supabase/migrations`
   - SQL migrations and Drizzle snapshots.

10. `supabase/schema.sql`
   - Full schema reference.

### Rules For Future Development

1. Use Bun for Next.js work.
2. Keep migrations in `supabase/migrations`.
3. Run `bun run db:generate` after schema changes.
4. Run `bun run db:migrate` to apply migrations.
5. Do not use `db:push` for this project.
6. Keep RLS enabled on public tables.
7. Do not expose database credentials to the browser.
8. Do not store BYOK keys.
9. Do not render model-generated HTML.
10. Keep generated output structured.

## 25. Open Questions

1. Should saved history be private behind auth?
2. Should BYOK generations be saved by default?
3. Should free quota be per IP, per browser, or per account once auth exists?
4. Should users choose free model quality versus speed?
5. Should exports include all paths or only selected path?
6. Should the app provide starter files as downloadable zip?
7. Should GitHub issue export include labels and acceptance criteria?
8. Should Presentation Mode support speaker notes?
9. Should future versions inspect repo files beyond README?
10. Should public app mode include captcha or abuse protection?

## 26. Immediate Next Tasks

1. Add visible quota remaining after each free generation.
2. Add no-save toggle for privacy-sensitive README content.
3. Add sample repo buttons on landing page.
4. Add richer empty state on `/generate`.
5. Improve mobile result dashboard navigation.
6. Add copy success feedback to exports.
7. Add tests for rate limit exceeded state.
8. Add tests for BYOK validation state.
9. Add privacy note near README paste.
10. Add production logging around OpenAI and database failures.
