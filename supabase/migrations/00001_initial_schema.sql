-- ============================================
-- Psi Szlak — Initial Schema
-- 6 tables with RLS enabled
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Users ──
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  dog_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users: read all" on public.users
  for select using (true);

create policy "Users: update own" on public.users
  for update using (auth.uid() = id);

create policy "Users: insert own" on public.users
  for insert with check (auth.uid() = id);

-- ── Routes ──
create table public.routes (
  id uuid primary key default uuid_generate_v4(),
  source_id text not null unique,
  name text,
  description text,
  geometry jsonb not null,
  length_km double precision,
  surface_type text not null default 'unknown'
    check (surface_type in ('dirt', 'gravel', 'asphalt', 'mixed', 'unknown')),
  difficulty text not null default 'unknown'
    check (difficulty in ('easy', 'moderate', 'hard', 'unknown')),
  water_access boolean,
  dogs_allowed boolean,
  trail_color text
    check (trail_color in ('red', 'blue', 'yellow', 'green', 'black')),
  is_marked boolean not null default false,
  center_lat double precision not null,
  center_lon double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.routes enable row level security;

create policy "Routes: read by authenticated" on public.routes
  for select to authenticated using (true);

-- ── Search Areas (cache) ──
create table public.search_areas (
  id uuid primary key default uuid_generate_v4(),
  bbox_hash text not null unique,
  north double precision not null,
  south double precision not null,
  east double precision not null,
  west double precision not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table public.search_areas enable row level security;

create policy "Search areas: read by all" on public.search_areas
  for select using (true);

-- Service role handles inserts via Edge Function

-- ── Favorites ──
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, route_id)
);

alter table public.favorites enable row level security;

create policy "Favorites: CRUD own" on public.favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Activity Log ──
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  walked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "Activity log: insert own" on public.activity_log
  for insert with check (auth.uid() = user_id);

create policy "Activity log: select own" on public.activity_log
  for select using (auth.uid() = user_id);

-- ── Invitations ──
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by uuid not null references public.users(id) on delete cascade,
  used_by uuid references public.users(id),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "Invitations: create by authenticated" on public.invitations
  for insert to authenticated with check (auth.uid() = created_by);

create policy "Invitations: read own created" on public.invitations
  for select to authenticated using (auth.uid() = created_by);

-- Public validation (token lookup) handled by Edge Function with service role

-- ── Indexes ──
create index idx_routes_center on public.routes (center_lat, center_lon);
create index idx_routes_source_id on public.routes (source_id);
create index idx_favorites_user on public.favorites (user_id);
create index idx_activity_user on public.activity_log (user_id);
create index idx_invitations_token on public.invitations (token);
create index idx_search_areas_bbox on public.search_areas (north, south, east, west);
