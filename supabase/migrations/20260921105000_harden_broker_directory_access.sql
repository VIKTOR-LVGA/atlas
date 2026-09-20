-- Preserve the original hard boundary: consumers receive a permission error,
-- not an empty result, when trying to query the broker directory directly.

revoke select on table public.brokers from authenticated;

create or replace function public.get_current_broker_profile()
returns table (
  id uuid, auth_user_id uuid, display_name text, legal_name text,
  organization_name text, email text, phone text, finma_reference text, active boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  return query select b.id, b.auth_user_id, b.display_name, b.legal_name,
    b.organization_name, b.email, b.phone, b.finma_reference, b.active
  from public.brokers b where b.id = public.current_broker_id();
end;
$$;

create or replace function public.get_admin_brokers()
returns setof public.brokers
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  return query select b.* from public.brokers b order by b.display_name;
end;
$$;

revoke all on function public.get_current_broker_profile() from public, anon;
revoke all on function public.get_admin_brokers() from public, anon;
grant execute on function public.get_current_broker_profile() to authenticated;
grant execute on function public.get_admin_brokers() to authenticated;
