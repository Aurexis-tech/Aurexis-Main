-- Aurexis · 0001_init — initial schema (Phase 0, authored not auto-run).
--
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor
-- in the Supabase dashboard. Requires the default `auth` schema (Supabase Auth).
-- The /api functions use the SERVICE-ROLE key, which BYPASSES RLS; the policies
-- below are what protect data once the browser (anon key) reads/writes directly
-- in Phase 1.

-- ── extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── health: trivial connectivity probe for /api/db-ping ──────────────────────
create table if not exists public.health (
  id         smallint primary key default 1,
  note       text not null default 'ok',
  checked_at timestamptz not null default now()
);
insert into public.health (id, note) values (1, 'ok')
  on conflict (id) do nothing;

alter table public.health enable row level security;
-- Read-only to anyone (the service role bypasses RLS anyway; this just makes a
-- key-less/anon connectivity check possible). No insert/update/delete policy.
drop policy if exists "health readable by anyone" on public.health;
create policy "health readable by anyone" on public.health for select using (true);

-- ── profiles: one row per auth user ──────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  answers       jsonb not null default '{}'::jsonb,  -- energy/risk/domain/style/time
  profile_label text,                                -- e.g. "Bold Builder"
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles owner select" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles owner update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── sessions: a saved run of the engine (resume support) ─────────────────────
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  stage      text not null default 'profile',    -- current screen in the flow
  answers    jsonb not null default '{}'::jsonb,  -- profile answers
  chosen     jsonb,                               -- chosen opportunity (Discover)
  blueprint  jsonb,                               -- generated blueprint (Phase 2+)
  state      jsonb not null default '{}'::jsonb,  -- misc resumable state
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);

alter table public.sessions enable row level security;
drop policy if exists "sessions owner select" on public.sessions;
drop policy if exists "sessions owner insert" on public.sessions;
drop policy if exists "sessions owner update" on public.sessions;
drop policy if exists "sessions owner delete" on public.sessions;
create policy "sessions owner select" on public.sessions
  for select using (auth.uid() = user_id);
create policy "sessions owner insert" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions owner update" on public.sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions owner delete" on public.sessions
  for delete using (auth.uid() = user_id);

-- ── updated_at maintenance ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();
