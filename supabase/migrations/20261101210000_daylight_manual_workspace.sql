-- New manual-account workspace, intentionally independent of Supabase Auth.
-- For an existing project with old Supabase Auth-based tables, dl_ prefix avoids overwrites.
create table if not exists public.users (
 id uuid primary key default gen_random_uuid(),
 first_name text not null, last_name text not null,
 username text not null unique check(username=lower(username) and username~'^[a-z][a-z0-9_]{2,19}$'),
 password_hash text,password_salt text,pin_hash text,pin_salt text,
 claim_code_hash text, is_admin boolean not null default false,
 has_completed_onboarding boolean not null default false,
 failed_login_attempts integer not null default 0,
 locked_until timestamptz,
 created_at timestamptz not null default now()
);
insert into public.users (first_name,last_name,username,is_admin)
 values ('Joey','Natale','joeyn028',true) on conflict(username) do nothing;
create table if not exists public.sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 token_hash text not null unique,access_hash text,
 created_at timestamptz not null default now(),last_full_auth_at timestamptz not null default now(),
 last_unlocked_at timestamptz,expires_at timestamptz not null default(now()+interval '30 days'),
 failed_pin_attempts integer not null default 0,pin_locked boolean not null default false
);
create index if not exists sessions_owner_idx on public.sessions(user_id);
create table if not exists public.dl_calendars (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 name text not null check(length(trim(name))>0),shade text not null default 'gray-1',
 sort_order int not null default 0,is_visible boolean not null default true,
 created_at timestamptz not null default now(),client_id text,
 unique(user_id,client_id),unique(user_id,id)
);
create index if not exists dl_calendars_owner_idx on public.dl_calendars(user_id);
create table if not exists public.dl_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 calendar_id uuid not null,title text not null check(length(trim(title))>0),
 description text not null default '',location_name text not null default '',location_address text not null default '',
 starts_at timestamptz not null,ends_at timestamptz not null,all_day boolean not null default false,
 repeat_rule jsonb not null default '{}'::jsonb,reminder_offset_minutes int,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint dl_events_valid_range check(ends_at>starts_at),
 constraint dl_events_owned_calendar foreign key(user_id,calendar_id)
 references public.dl_calendars(user_id,id) on delete cascade
);
create index if not exists dl_events_owner_start_idx on public.dl_events(user_id,starts_at);
create index if not exists dl_events_calendar_idx on public.dl_events(calendar_id);
create table if not exists public.dl_tasks (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 title text not null check(length(trim(title))>0),notes text not null default '',due_date date,
 completed boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists dl_tasks_owner_due_idx on public.dl_tasks(user_id,due_date);
create table if not exists public.dl_subscriptions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 calendar_id uuid,name text not null default '',url text not null,
 last_fetched_at timestamptz,created_at timestamptz not null default now(),
 constraint dl_subscriptions_owned_calendar foreign key(user_id,calendar_id)
 references public.dl_calendars(user_id,id) on delete cascade
);
create index if not exists dl_subscriptions_owner_idx on public.dl_subscriptions(user_id);
create index if not exists dl_subscriptions_calendar_idx on public.dl_subscriptions(calendar_id);
create table if not exists public.dl_user_settings (
 user_id uuid primary key references public.users(id) on delete cascade,
 theme text not null default 'system' check(theme in ('system','dark','light')),
 accent text not null default 'graphite',custom_accent_hex text,
 default_view text not null default 'week' check(default_view in ('day','week','month','agenda')),
 start_of_week text not null default 'sunday' check(start_of_week in ('sunday','monday')),
 reduce_motion boolean not null default false,mcp_allow_delete boolean not null default false,
 extra jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now()
);
create table if not exists public.dl_mcp_tokens (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 name text not null check(length(trim(name))>0),token_hash text not null unique check(token_hash~'^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),last_used_at timestamptz,revoked boolean not null default false
);
create index if not exists dl_mcp_tokens_owner_idx on public.dl_mcp_tokens(user_id);
create table if not exists public.dl_mcp_audit_log (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 tool text not null,action text not null,target_id uuid,created_at timestamptz not null default now()
);
create index if not exists dl_mcp_audit_owner_idx on public.dl_mcp_audit_log(user_id);
-- The frontend never queries tables. The server is the only access path.
do $$ declare tbl text; begin
 foreach tbl in array array['users','sessions','dl_calendars','dl_events','dl_tasks','dl_subscriptions','dl_user_settings','dl_mcp_tokens','dl_mcp_audit_log'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on table public.%I from anon,authenticated',tbl);
  execute format('grant all on table public.%I to service_role',tbl);
 end loop;
end $$;
