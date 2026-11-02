-- Destructive owner-authorized Daylight v3 reset; intentionally retains no legacy user data.
-- Run only during coordinated auth cutover; this migration does not create user accounts.
truncate table public.dl_mcp_audit_log,public.dl_mcp_tokens,public.dl_events,public.dl_tasks,public.dl_subscriptions,public.dl_calendars,public.dl_user_settings restart identity cascade;
truncate table public.sessions cascade;
delete from public.users;
alter table public.dl_calendars drop constraint if exists dl_calendars_user_id_fkey;
alter table public.dl_events drop constraint if exists dl_events_user_id_fkey;
alter table public.dl_tasks drop constraint if exists dl_tasks_user_id_fkey;
alter table public.dl_subscriptions drop constraint if exists dl_subscriptions_user_id_fkey;
alter table public.dl_user_settings drop constraint if exists dl_user_settings_user_id_fkey;
alter table public.dl_mcp_tokens drop constraint if exists dl_mcp_tokens_user_id_fkey;
alter table public.dl_mcp_audit_log drop constraint if exists dl_mcp_audit_log_user_id_fkey;
alter table public.dl_calendars add constraint dl_calendars_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_events add constraint dl_events_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_tasks add constraint dl_tasks_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_subscriptions add constraint dl_subscriptions_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_user_settings add constraint dl_user_settings_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_mcp_tokens add constraint dl_mcp_tokens_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_mcp_audit_log add constraint dl_mcp_audit_log_user_id_fkey foreign key(user_id) references auth.users(id) on delete cascade;
alter table public.dl_events add column if not exists excluded_dates jsonb not null default '[]'::jsonb;
alter table public.dl_events add column if not exists status text not null default 'confirmed';
create unique index if not exists dl_subscriptions_feed_user_url on public.dl_subscriptions(user_id,url);
create unique index if not exists dl_events_feed_uid_dedup on public.dl_events(source_subscription_id,external_uid) where source_subscription_id is not null and external_uid is not null;
alter table public.dl_user_settings alter column show_declined_events set default false;
do $$ declare tab text; begin
foreach tab in array array['dl_calendars','dl_events','dl_tasks','dl_subscriptions','dl_user_settings','dl_mcp_tokens','dl_mcp_audit_log'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('drop policy if exists "daylight_owner" on public.%I',tab);
 execute format('create policy "daylight_owner" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',tab);
end loop;end $$;
