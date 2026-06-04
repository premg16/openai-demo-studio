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

alter table public.generations enable row level security;

drop policy if exists "Public generations are readable" on public.generations;
create policy "Public generations are readable"
  on public.generations
  for select
  to anon
  using (true);

drop policy if exists "Public generations are insertable" on public.generations;
create policy "Public generations are insertable"
  on public.generations
  for insert
  to anon
  with check (true);

grant usage on schema public to anon;
grant select, insert on public.generations to anon;
