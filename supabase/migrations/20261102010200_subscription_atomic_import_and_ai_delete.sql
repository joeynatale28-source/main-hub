-- One transaction for replacement of a subscription's read-only events.
-- Only the service-role Edge API may invoke this function after validating the session.
create or replace function public.dl_replace_subscription_events(
  p_user_id uuid, p_subscription_id uuid, p_events jsonb
) returns integer
language plpgsql security invoker
set search_path=public,pg_temp
as $$
declare v_calendar uuid; v_count integer;
begin
 select calendar_id into v_calendar from public.dl_subscriptions
 where id=p_subscription_id and user_id=p_user_id for update;
 if v_calendar is null then raise exception 'Subscription not found'; end if;
 if p_events is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events)>5000 then
  raise exception 'Invalid subscription content';
 end if;
 delete from public.dl_events where user_id=p_user_id and source_subscription_id=p_subscription_id;
 insert into public.dl_events(
  user_id,calendar_id,source_subscription_id,external_uid,title,description,
  location_name,location_address,starts_at,ends_at,all_day,repeat_rule
 )
 select p_user_id,v_calendar,p_subscription_id,
 j.external_uid,j.title,j.description,j.location_name,j.location_address,
 j.starts_at,j.ends_at,j.all_day,coalesce(j.repeat_rule,'{}'::jsonb)
 from jsonb_to_recordset(p_events) as j(
  external_uid text,title text,description text,location_name text,location_address text,
  starts_at timestamptz,ends_at timestamptz,all_day boolean,repeat_rule jsonb
 );
 get diagnostics v_count=row_count;
 update public.dl_subscriptions set last_fetched_at=now() where id=p_subscription_id and user_id=p_user_id;
 return v_count;
end;
$$;
revoke all on function public.dl_replace_subscription_events(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.dl_replace_subscription_events(uuid,uuid,jsonb) to service_role;

-- Atomic delete and audit, scoped to the authenticated MCP token's owner.
create or replace function public.dl_mcp_delete_owned(
 p_user_id uuid,p_kind text,p_target uuid
) returns boolean
language plpgsql security invoker
set search_path=public,pg_temp
as $$
declare v_allowed boolean; v_found boolean;
begin
 select mcp_allow_delete into v_allowed from public.dl_user_settings
 where user_id=p_user_id;
 if not coalesce(v_allowed,false) then
  raise exception 'Deletes are disabled for AI access. The owner can enable them in Daylight → Settings → AI access.';
 end if;
 if p_kind='event' then
  delete from public.dl_events where user_id=p_user_id and id=p_target;
 elsif p_kind='task' then
  delete from public.dl_tasks where user_id=p_user_id and id=p_target;
 else
  raise exception 'Unknown delete kind';
 end if;
 v_found=found;
 if v_found then
  insert into public.dl_mcp_audit_log(user_id,tool,action,target_id)
  values(p_user_id,'delete_'||p_kind,'delete',p_target);
 end if;
 return v_found;
end;
$$;
revoke all on function public.dl_mcp_delete_owned(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.dl_mcp_delete_owned(uuid,text,uuid) to service_role;
