-- Isolate ownership checks from policies added to the shared resource tables.
-- Without this helper, selecting a policy during the share INSERT can recurse
-- through the broker visibility policy back into consultation_shared_resources.

create or replace function public.current_user_owns_consultation_resource(
  p_resource_type text,
  p_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_resource_type
    when 'policy' then exists (
      select 1 from public.policies p where p.id = p_resource_id and p.user_id = auth.uid()
    )
    when 'document' then exists (
      select 1 from public.documents d where d.id = p_resource_id and d.user_id = auth.uid()
    )
    when 'vehicle' then exists (
      select 1 from public.vehicles v where v.id = p_resource_id and v.user_id = auth.uid()
    )
    when 'property' then exists (
      select 1 from public.properties pr where pr.id = p_resource_id and pr.user_id = auth.uid()
    )
    when 'family_member' then exists (
      select 1 from public.family_members fm where fm.id = p_resource_id and fm.user_id = auth.uid()
    )
    else false
  end;
$$;

revoke all on function public.current_user_owns_consultation_resource(text, uuid) from public, anon;
grant execute on function public.current_user_owns_consultation_resource(text, uuid) to authenticated;

drop policy "Consumer shares owned consultation resources"
  on public.consultation_shared_resources;

create policy "Consumer shares owned consultation resources"
  on public.consultation_shared_resources for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = (select auth.uid())
    )
    and public.current_user_owns_consultation_resource(resource_type, resource_id)
  );
