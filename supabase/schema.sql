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

create table if not exists public.usage_limits (
  identity_hash text not null,
  day text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint usage_limits_identity_hash_day_pk primary key (identity_hash, day)
);

alter table public.generations
  add column if not exists generation jsonb;

alter table public.generations enable row level security;
alter table public.usage_limits enable row level security;

drop policy if exists "Public generations are readable" on public.generations;
drop policy if exists "Public generations are insertable" on public.generations;

revoke select, insert, update, delete on public.generations from anon, authenticated;
revoke select, insert, update, delete on public.usage_limits from anon, authenticated;
