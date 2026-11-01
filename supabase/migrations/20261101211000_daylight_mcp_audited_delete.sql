-- Atomic, server-only MCP deletion. With SECURITY INVOKER it uses the service-role caller.
create or replace function public.dl_mcp_delete_owned_item(p_user_id uuid,p_kind text,p_target_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 if not exists(select 1 from public.dl_user_settings where user_id=p_user_id and mcp_allow_delete=true) then
  raise exception 'Deletes are disabled for AI access. The owner can enable them in Daylight -> Settings -> AI access.';
 end if;
 if p_kind='events' then
  delete from public.dl_events where id=p_target_id and user_id=p_user_id;
 elsif p_kind='tasks' then
  delete from public.dl_tasks where id=p_target_id and user_id=p_user_id;
 else raise exception 'Unknown item type'; end if;
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Item not found'; end if;
 insert into public.dl_mcp_audit_log(user_id,tool,action,target_id)
 values(p_user_id,'delete_'||left(p_kind,length(p_kind)-1),'delete',p_target_id);
 return true;
end $$;
revoke all on function public.dl_mcp_delete_owned_item(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.dl_mcp_delete_owned_item(uuid,text,uuid) to service_role;
