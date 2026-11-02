-- Replace feed contents by UID without deleting/recreating unchanged event rows.
create or replace function public.dl_replace_subscription_events(p_user_id uuid,p_subscription_id uuid,p_events jsonb)
returns integer language plpgsql set search_path to 'public','pg_temp'
as $$
declare v_calendar uuid; v_count integer;
begin
 select calendar_id into v_calendar from public.dl_subscriptions
 where id=p_subscription_id and user_id=p_user_id for update;
 if v_calendar is null then raise exception 'Subscription not found'; end if;
 if p_events is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>5000 then
  raise exception 'Invalid subscription content';
 end if;
 insert into public.dl_events(
 user_id,calendar_id,source_subscription_id,external_uid,title,description,
 location_name,location_address,starts_at,ends_at,all_day,repeat_rule,status)
 select p_user_id,v_calendar,p_subscription_id,j.external_uid,j.title,j.description,
 j.location_name,j.location_address,j.starts_at,j.ends_at,j.all_day,
 coalesce(j.repeat_rule,'{}'::jsonb),coalesce(j.status,'confirmed')
 from jsonb_to_recordset(p_events) as j(
 external_uid text,title text,description text,location_name text,location_address text,
 starts_at timestamptz,ends_at timestamptz,all_day boolean,repeat_rule jsonb,status text)
 on conflict (source_subscription_id,external_uid) do update
 set title=excluded.title,description=excluded.description,location_name=excluded.location_name,
 location_address=excluded.location_address,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
 all_day=excluded.all_day,repeat_rule=excluded.repeat_rule,status=excluded.status,
 updated_at=now();
 get diagnostics v_count=row_count;
 delete from public.dl_events e
 where e.user_id=p_user_id and e.source_subscription_id=p_subscription_id
 and not exists(select 1 from jsonb_array_elements(p_events) j where j->>'external_uid'=e.external_uid);
 update public.dl_subscriptions set last_fetched_at=now() where id=p_subscription_id and user_id=p_user_id;
 return v_count;
end;$$;