-- FixU: complete setup (schema + holidays). Run once in the Supabase SQL Editor.

-- FixU initial schema (Phase 1: calendar core).
-- Single-user app: every user-owned row carries user_id and RLS limits access to its owner.
-- Shared reference data (public holidays, football fixtures) is readable by any signed-in user
-- and written only by the service role (imports, cron).

create extension if not exists pgcrypto;

-- Enums -------------------------------------------------------------------------------------------
create type public.event_state as enum ('planned', 'done', 'missed', 'rescheduled', 'cancelled');
create type public.event_source as enum ('manual', 'nl', 'suggestion', 'import', 'recurring');
create type public.life_area as enum ('gym', 'health', 'work', 'side_hustle', 'social', 'routine', 'finance', 'travel', 'other');
create type public.holiday_scope as enum ('national', 'regional', 'local', 'company');
create type public.goal_period as enum ('day', 'week', 'month', 'year');
create type public.action_status as enum ('proposed', 'applied', 'undone', 'discarded');

-- updated_at helper ----------------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- Settings: the editable baseline profile (brief §4) --------------------------------------------------
create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- Calendar layers and their visibility -------------------------------------------------------------
create table public.layers (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (key in ('personal', 'holidays', 'company', 'football', 'cultural')),
  visible boolean not null default true,
  primary key (user_id, key)
);

-- Events: planned / done / missed / rescheduled ------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  area public.life_area not null default 'other',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  state public.event_state not null default 'planned',
  rescheduled_to uuid references public.events (id) on delete set null,
  source public.event_source not null default 'manual',
  recurring_rule_id uuid,
  external_id text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at),
  unique (user_id, external_id)
);
create index events_user_time on public.events (user_id, starts_at);
create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();

-- Recurring rules (e.g. Thursday afterwork, only when in Madrid) ------------------------------------
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  area public.life_area not null default 'social',
  weekday smallint not null check (weekday between 1 and 7), -- ISO, Monday = 1
  start_time time not null,
  duration_min integer not null default 120,
  condition text,            -- e.g. 'in_madrid_that_week'
  side_effects text[] not null default '{}', -- e.g. {'no_workout_thursday_evening','no_workout_friday_morning'}
  active boolean not null default true
);
alter table public.events add constraint events_rule_fk foreign key (recurring_rule_id) references public.recurring_rules (id) on delete set null;

-- Trips: the scheduler derives "in Madrid this week" from these --------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  city text not null,
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index trips_user_dates on public.trips (user_id, start_date);

-- Holidays: public (shared, with official source) and company (per user, e.g. NTT DATA) ---------------
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = public holiday
  date date not null,
  name text not null,
  scope public.holiday_scope not null,
  source_name text,
  source_url text,
  provisional boolean not null default false,
  check ((scope = 'company') = (user_id is not null)),
  check (scope = 'company' or source_name is not null)
);
create unique index holidays_unique on public.holidays (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), date, scope, name);

-- Football fixtures (Real Madrid), refreshed daily ---------------------------------------------------
create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  competition text not null,
  home text not null,
  away text not null,
  kickoff timestamptz not null,
  kickoff_confirmed boolean not null default true,
  status text not null default 'SCHEDULED',
  source text not null,
  updated_at timestamptz not null default now()
);
create index fixtures_kickoff on public.fixtures (kickoff);

-- Goals per area and period ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  area public.life_area not null,
  period public.goal_period not null,
  metric text not null,     -- e.g. 'sessions', 'hours', 'avg_steps'
  target numeric not null check (target > 0),
  label text not null,
  active boolean not null default true
);

-- Scheduler suggestions (amber catch-ups etc.) ----------------------------------------------------------
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,       -- 'catch_up' | 'wake_earlier' | ...
  area public.life_area not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  score numeric not null,
  reason text not null,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'dismissed', 'expired')),
  week_start date not null,
  created_at timestamptz not null default now()
);

-- Every AI-proposed change waits here; applying stores the undo payload ----------------------------
create table public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,       -- 'create_event' | 'move_event' | 'add_trip' | ...
  input_text text,
  proposal jsonb not null,
  undo jsonb,
  status public.action_status not null default 'proposed',
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

-- Row-level security ----------------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.layers enable row level security;
alter table public.events enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.trips enable row level security;
alter table public.holidays enable row level security;
alter table public.fixtures enable row level security;
alter table public.goals enable row level security;
alter table public.suggestions enable row level security;
alter table public.pending_actions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings', 'layers', 'events', 'recurring_rules', 'trips', 'goals', 'suggestions', 'pending_actions'] loop
    execute format('create policy "%1$s: owner" on public.%1$I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

create policy "holidays: read public and own" on public.holidays for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "holidays: write own company days" on public.holidays for all to authenticated
  using ((select auth.uid()) = user_id and scope = 'company')
  with check ((select auth.uid()) = user_id and scope = 'company');

create policy "fixtures: read" on public.fixtures for select to authenticated using (true);

-- Generated by scripts/seed-holidays.mjs from data/holidays. Do not edit by hand.
insert into public.holidays (date, name, scope, source_name, source_url, provisional) values
('2026-01-01', 'New Year’s Day (Año Nuevo)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-01-06', 'Epiphany (Epifanía del Señor)', 'regional', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-04-02', 'Maundy Thursday (Jueves Santo)', 'regional', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-04-03', 'Good Friday (Viernes Santo)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-05-01', 'Labour Day (Fiesta del Trabajo)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-05-02', 'Community of Madrid Day (Fiesta de la Comunidad de Madrid)', 'regional', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-05-15', 'San Isidro Labrador', 'local', 'BOCM núm. 296, 12 Dec 2025 — Resolución de 2 de diciembre de 2025, Dirección General de Trabajo (fiestas locales 2026); not changed by the correction in BOCM 8 Jan 2026', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/12/BOCM-20251212-34.PDF', false),
('2026-08-15', 'Assumption (Asunción de la Virgen)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-10-12', 'Spain’s National Day (Fiesta Nacional de España)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-11-02', 'Day after All Saints (Día siguiente a Todos los Santos)', 'regional', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-11-09', 'Nuestra Señora de la Almudena', 'local', 'BOCM núm. 296, 12 Dec 2025 — Resolución de 2 de diciembre de 2025, Dirección General de Trabajo (fiestas locales 2026); not changed by the correction in BOCM 8 Jan 2026', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/12/BOCM-20251212-34.PDF', false),
('2026-12-07', 'Monday after Constitution Day (Lunes siguiente al Día de la Constitución)', 'regional', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-12-08', 'Immaculate Conception (Inmaculada Concepción)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2026-12-25', 'Christmas Day (Natividad del Señor)', 'national', 'BOE núm. 259, 28 Oct 2025 — Resolución de 17 de octubre de 2025, Dirección General de Trabajo (fiestas laborales 2026)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-21667', false),
('2027-01-01', 'New Year’s Day (Año Nuevo)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-01-06', 'Epiphany (Epifanía del Señor)', 'regional', 'BOCM núm. 234, 1 Oct 2026 — Decreto 82/2026, de 30 de septiembre (fiestas laborales 2027, Comunidad de Madrid)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/10/01/BOCM-20261001-19.PDF', false),
('2027-03-19', 'Saint Joseph (San José)', 'regional', 'BOCM núm. 234, 1 Oct 2026 — Decreto 82/2026, de 30 de septiembre (fiestas laborales 2027, Comunidad de Madrid)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/10/01/BOCM-20261001-19.PDF', false),
('2027-03-25', 'Maundy Thursday (Jueves Santo)', 'regional', 'BOCM núm. 234, 1 Oct 2026 — Decreto 82/2026, de 30 de septiembre (fiestas laborales 2027, Comunidad de Madrid)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/10/01/BOCM-20261001-19.PDF', false),
('2027-03-26', 'Good Friday (Viernes Santo)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-05-01', 'Labour Day (Fiesta del Trabajo)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-05-15', 'San Isidro Labrador', 'local', 'Agreed by Madrid city council (Pleno, 29 Sep 2026) as reported; official BOCM list of 2027 local holidays not yet published', null, true),
('2027-08-16', 'Monday after the Assumption (traslado de la Asunción)', 'regional', 'BOCM núm. 234, 1 Oct 2026 — Decreto 82/2026, de 30 de septiembre (fiestas laborales 2027, Comunidad de Madrid)', 'https://www.bocm.es/boletin/CM_Orden_BOCM/2026/10/01/BOCM-20261001-19.PDF', false),
('2027-10-12', 'Spain’s National Day (Fiesta Nacional de España)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-11-01', 'All Saints’ Day (Todos los Santos)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-11-09', 'Nuestra Señora de la Almudena', 'local', 'Agreed by Madrid city council (Pleno, 29 Sep 2026) as reported; official BOCM list of 2027 local holidays not yet published', null, true),
('2027-12-06', 'Constitution Day (Día de la Constitución)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-12-08', 'Immaculate Conception (Inmaculada Concepción)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false),
('2027-12-25', 'Christmas Day (Natividad del Señor)', 'national', 'BOE, 13 Oct 2026 — Resolución de 8 de octubre de 2026, Dirección General de Trabajo (fiestas laborales 2027)', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', false)
on conflict (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), date, scope, name)
do update set source_name = excluded.source_name, source_url = excluded.source_url, provisional = excluded.provisional;
