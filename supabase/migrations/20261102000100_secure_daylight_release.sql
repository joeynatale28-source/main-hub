-- DAYLIGHT RELEASE — MANUAL ACCOUNT CREATION
-- Run ONLY in Supabase SQL Editor as the project owner, after applying this migration:
-- SELECT public.admin_create_user('First', 'Last', 'username', 'choose-a-private-password', false);
-- Example for the existing owner account, ONLY IF IT DOES NOT ALREADY EXIST:
-- SELECT public.admin_create_user('Joey', 'Natale', 'joeyn028', '<PRIVATE_PASSWORD>', true);
-- Never paste real passwords into source control or migration history.
-- Existing Daylight users and data are preserved; no account is automatically seeded.
create extension if not exists pgcrypto with schema extensions;
alter table public.dl_user_settings
  add column if not exists show_weekends boolean not null default true,
  add column if not exists compact_mode boolean not null default false,
  add column if not exists show_week_numbers boolean not null default false,
  add column if not exists show_declined_events boolean not null default false,
  add column if not exists work_hours_start time not null default time '09:00',
  add column if not exists work_hours_end time not null default time '17:00',
  add column if not exists task_reminders boolean not null default false,
  add column if not exists event_reminders boolean not null default false,
  add column if not exists notification_sound boolean not null default false,
  add column if not exists default_reminder_minutes integer not null default 15,
  add column if not exists time_zone text not null default 'auto';
alter table public.dl_events
  add column if not exists source_subscription_id uuid references public.dl_subscriptions(id) on delete cascade,
  add column if not exists external_uid text;
create index if not exists dl_events_user_starts_idx on public.dl_events(user_id,starts_at);
create index if not exists dl_events_source_idx on public.dl_events(user_id,source_subscription_id);
create index if not exists dl_sessions_expiry_idx on public.sessions(expires_at);
create index if not exists dl_mcp_tokens_active_hash_idx on public.dl_mcp_tokens(token_hash) where revoked=false;
create index if not exists dl_subscriptions_owner_idx on public.dl_subscriptions(user_id);
create index if not exists dl_tasks_due_idx on public.dl_tasks(user_id,due_date);
-- An owner-only SQL Editor helper. SECURITY INVOKER: no elevated access given to callers.
create or replace function public.admin_create_user(
  first_name text, last_name text, username text, plain_password text, is_admin boolean default false
) returns uuid language plpgsql security invoker
set search_path=public,extensions,pg_temp
as $$
declare created uuid;
begin
 if length(trim(first_name))<1 or length(trim(last_name))<1 then raise exception 'Name is required'; end if;
 if lower(trim(username)) !~ '^[a-z][a-z0-9_]{2,19}$' then raise exception 'Invalid username'; end if;
 if length(plain_password)<12 then raise exception 'Password must have at least 12 characters'; end if;
 insert into public.users(first_name,last_name,username,password_hash,password_salt,is_admin,has_completed_onboarding)
 values(trim(first_name),trim(last_name),lower(trim(username)),extensions.crypt(plain_password,extensions.gen_salt('bf',12)),null,is_admin,true)
 returning id into created;
 insert into public.dl_user_settings(user_id) values(created)
 on conflict(user_id) do nothing;
 insert into public.dl_calendars(user_id,name,shade,sort_order,is_visible,client_id)
 values(created,'Personal','gray-1',0,true,'personal'),
       (created,'Work','gray-2',1,true,'work'),
       (created,'Life & plans','gray-3',2,true,'life'),
       (created,'US Holidays','gray-4',3,true,'us-holidays')
 on conflict(user_id,client_id) do nothing;
 return created;
end;
$$;
revoke all on function public.admin_create_user(text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_create_user(text,text,text,text,boolean) to postgres;
-- All user-owned data tables are denied to anon/authenticated; service-role Edge functions
-- validate a hashed Daylight session and scope each read/write to resolved user_id.
do $$
declare t text;
begin
 foreach t in array array['users','sessions','dl_calendars','dl_events','dl_tasks','dl_subscriptions','dl_user_settings','dl_mcp_tokens','dl_mcp_audit_log'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
 end loop;
end $$;
