-- Daylight Prompt 1: authorized clean replacement of custom credentials with Supabase Auth.
-- Destructive: clears ONLY Daylight account and application data.
begin;
truncate table public.dl_mcp_audit_log,public.dl_mcp_tokens,public.dl_events,public.dl_subscriptions,public.dl_calendars,public.dl_tasks,public.dl_user_settings cascade;
-- The old public.users table is the abandoned password/PIN/claim system.
-- Every Daylight owner relation now references auth.users(id).
alter table public.dl_calendars drop constraint if exists dl_calendars_user_id_fkey;
alter table public.dl_events drop constraint if exists dl_events_user_id_fkey;
alter table public.dl_tasks drop constraint if exists dl_tasks_user_id_fkey;
alter table public.dl_subscriptions drop constraint if exists dl_subscriptions_user_id_fkey;
alter table public.dl_user_settings drop constraint if exists dl_user_settings_user_id_fkey;
alter table public.dl_mcp_tokens drop constraint if exists dl_mcp_tokens_user_id_fkey;
alter table public.dl_mcp_audit_log drop constraint if exists dl_mcp_audit_log_user_id_fkey;
alter table public.dl_calendars add constraint dl_calendars_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_events add constraint dl_events_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_tasks add constraint dl_tasks_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_subscriptions add constraint dl_subscriptions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_user_settings add constraint dl_user_settings_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_mcp_tokens add constraint dl_mcp_tokens_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_mcp_audit_log add constraint dl_mcp_audit_log_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.dl_events add column if not exists status text not null default 'confirmed';
create unique index if not exists dl_subscription_feed_unique on public.dl_subscriptions(user_id,url);
create unique index if not exists dl_event_external_uid_unique on public.dl_events(source_subscription_id,external_uid) where source_subscription_id is not null and external_uid is not null;
do $$
declare table_name text;
begin
 foreach table_name in array array['dl_calendars','dl_events','dl_tasks','dl_subscriptions','dl_user_settings','dl_mcp_tokens','dl_mcp_audit_log']
 loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('drop policy if exists daylight_owner_access on public.%I',table_name);
  execute format('create policy daylight_owner_access on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',table_name);
 end loop;
end $$;
-- Secret token material and logs remain restricted to the server's service role.
revoke all on public.dl_mcp_tokens,public.dl_mcp_audit_log from anon,authenticated;
grant select,insert,update,delete on public.dl_calendars,public.dl_events,public.dl_tasks,public.dl_subscriptions,public.dl_user_settings to authenticated;
-- No legacy account or opaque session tables survive the cutover.
drop table if exists public.sessions;
drop table if exists public.users;
commit;
