-- Phase 0: FOUN-01 + FOUN-02
-- Table has no production data (project at 0% progress).
-- DROP + ADD is safe and avoids boolean→text cast issues.

-- FOUN-01: water_access boolean → text enum
ALTER TABLE public.routes DROP COLUMN IF EXISTS water_access;
ALTER TABLE public.routes
  ADD COLUMN water_access text NOT NULL DEFAULT 'none'
    CHECK (water_access IN ('none', 'nearby', 'on_route'));

-- FOUN-02a: routes.source
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS source text
    CHECK (source IN ('osm', 'pttk'));

-- FOUN-02b: routes.water_type
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS water_type text
    CHECK (water_type IN ('river', 'lake', 'stream'));

-- FOUN-02c: invitations.used_at
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS used_at timestamptz;
