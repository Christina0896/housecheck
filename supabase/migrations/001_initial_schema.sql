create extension if not exists pgcrypto;

create type public.evidence_level as enum (
  'map-verified',
  'agent-stated',
  'estimated'
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  source_id text not null,
  source_name text not null,
  source_url text,
  slug text not null unique,
  title text not null,
  address text not null,
  locality text not null,
  county text not null,
  price integer not null check (price >= 0),
  bedrooms smallint not null default 0 check (bedrooms >= 0),
  bathrooms smallint not null default 0 check (bathrooms >= 0),
  floor_area_sqm numeric(10, 2),
  ber_rating text,
  land_acres numeric(12, 4),
  land_hectares numeric(12, 4),
  land_size_approximate boolean not null default true,
  land_evidence public.evidence_level not null default 'estimated',
  latitude double precision not null,
  longitude double precision not null,
  image_url text not null,
  summary text not null default '',
  description text not null default '',
  first_seen date not null default current_date,
  last_seen date not null default current_date,
  is_new boolean not null default true,
  price_changed boolean not null default false,
  settings jsonb not null default '[]'::jsonb,
  distances jsonb not null default '{"lakeKm":null,"coastKm":null,"forestKm":null,"townKm":null}'::jsonb,
  nearest_lake text,
  nearest_forest text,
  features jsonb not null default '[]'::jsonb,
  match_score smallint not null default 0 check (match_score between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_name, source_id)
);

create index if not exists properties_active_match_idx
  on public.properties (is_active, match_score desc);
create index if not exists properties_county_price_idx
  on public.properties (county, price);
create index if not exists properties_land_acres_idx
  on public.properties (land_acres desc nulls last);
create index if not exists properties_last_seen_idx
  on public.properties (last_seen desc);
create index if not exists properties_settings_gin_idx
  on public.properties using gin (settings);

create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  price integer not null check (price >= 0),
  observed_at timestamptz not null default now()
);

create index if not exists price_history_property_observed_idx
  on public.price_history (property_id, observed_at desc);

create table if not exists public.scraper_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  discovered_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  notes text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

alter table public.properties enable row level security;
alter table public.price_history enable row level security;
alter table public.scraper_runs enable row level security;

create policy "Public can read active properties"
on public.properties
for select
to anon, authenticated
using (is_active = true);
