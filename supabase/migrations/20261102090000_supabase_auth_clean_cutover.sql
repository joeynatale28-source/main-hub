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
drop table if exists public.events;
drop table if exists public.tasks;
drop table if exists public.subscriptions;
drop table if exists public.calendars;
drop table if exists public.sessions;
drop table if exists public.users;

-- A feed refresh upserts by UID and removes UIDs absent from the latest successful fetch.
-- The old delete/reinsert implementation broke stable identity and duplicate handling.
create or replace function public.dl_replace_subscription_events(
 p_user_id uuid,p_subscription_id uuid,p_events jsonb
) returns integer language plpgsql set search_path=public,pg_temp as $func$
declare v_calendar uuid;v_count integer;
begin
 select calendar_id into v_calendar from public.dl_subscriptions
 where id=p_subscription_id and user_id=p_user_id for update;
 if v_calendar is null then raise exception 'Subscription not found';end if;
 if p_events is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>5000
 then raise exception 'Invalid subscription content';end if;
 insert into public.dl_events(
 user_id,calendar_id,source_subscription_id,external_uid,title,description,
 location_name,location_address,starts_at,ends_at,all_day,repeat_rule,status
 )
 select p_user_id,v_calendar,p_subscription_id,j.external_uid,j.title,
 coalesce(j.description,''),coalesce(j.location_name,''),coalesce(j.location_address,''),
 j.starts_at,j.ends_at,j.all_day,coalesce(j.repeat_rule,'{}'::jsonb),coalesce(j.status,'confirmed')
 from jsonb_to_recordset(p_events) as j(
 external_uid text,title text,description text,location_name text,location_address text,
 starts_at timestamptz,ends_at timestamptz,all_day boolean,repeat_rule jsonb,status text
 )
 on conflict (source_subscription_id,external_uid)
 where source_subscription_id is not null and external_uid is not null
 do update set title=excluded.title,description=excluded.description,
 location_name=excluded.location_name,location_address=excluded.location_address,
 starts_at=excluded.starts_at,ends_at=excluded.ends_at,all_day=excluded.all_day,
 repeat_rule=excluded.repeat_rule,status=excluded.status,updated_at=now();
 get diagnostics v_count=row_count;
 delete from public.dl_events e where e.user_id=p_user_id
 and e.source_subscription_id=p_subscription_id
 and not exists (select 1 from jsonb_array_elements(p_events) j
                 where j->>'external_uid'=e.external_uid);
 update public.dl_subscriptions set last_fetched_at=now(),last_error_code=null,last_error_at=null
 where id=p_subscription_id and user_id=p_user_id;
 return v_count;
end
$func$;
commit;
