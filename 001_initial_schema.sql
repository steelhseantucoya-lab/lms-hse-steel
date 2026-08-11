
-- LMS HSE STEEL - esquema inicial de producción
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  rut text,
  email text,
  company text default 'STEEL INGENIERÍA',
  job_title text,
  site_area text,
  role text not null check (role in ('worker','admin')) default 'worker',
  account_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_no int not null check (module_no between 1 and 10),
  status text not null check (status in ('not_started','in_progress','approved','needs_reinforcement')) default 'not_started',
  max_video_seconds int not null default 0,
  video_completed boolean not null default false,
  recap_completed boolean not null default false,
  case_completed boolean not null default false,
  score int check (score between 0 and 100),
  attempts int not null default 0,
  critical_failures int not null default 0,
  approved_at timestamptz,
  version text not null default 'LMS-HSE-IHN Rev.04',
  updated_at timestamptz not null default now(),
  unique(user_id,module_no)
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_no int not null check (module_no between 1 and 10),
  score int not null check (score between 0 and 100),
  passed boolean not null,
  critical_failures int not null default 0,
  weak_topics text[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  certificate_code text not null unique,
  issued_at date not null default current_date,
  expires_at date not null,
  lms_version text not null default 'LMS-HSE-IHN Rev.04',
  status text not null check(status in ('valid','expired','revoked')) default 'valid',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.module_progress enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_log enable row level security;

create policy "profile_self_read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profile_admin_update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy "progress_self_read" on public.module_progress for select using (user_id=auth.uid() or public.is_admin());
create policy "progress_self_insert" on public.module_progress for insert with check (user_id=auth.uid());
create policy "progress_self_update" on public.module_progress for update using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "attempt_self_read" on public.assessment_attempts for select using (user_id=auth.uid() or public.is_admin());
create policy "attempt_self_insert" on public.assessment_attempts for insert with check (user_id=auth.uid());

create policy "certificate_self_read" on public.certificates for select using (user_id=auth.uid() or public.is_admin());
create policy "certificate_admin_write" on public.certificates for all using (public.is_admin()) with check (public.is_admin());

create policy "audit_admin_read" on public.audit_log for select using (public.is_admin());
create policy "audit_authenticated_insert" on public.audit_log for insert to authenticated with check (actor_user_id=auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id,full_name,email,role,account_verified)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),
    new.email,
    case when new.raw_user_meta_data->>'role'='admin' then 'admin' else 'worker' end,
    new.email_confirmed_at is not null
  )
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
