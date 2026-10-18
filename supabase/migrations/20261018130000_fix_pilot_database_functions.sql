-- Repair functions reported invalid by `supabase db lint` on the ATLAS schema.
-- Apply to staging first. This migration does not change table data or RLS.

create or replace function public.review_intelligence_application(
  p_application_id uuid,
  p_decision text,
  p_admin_notes text default null,
  p_rejection_reason text default null,
  p_module_access text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_row public.intelligence_applications%rowtype;
  v_company_id uuid;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  if p_decision not in ('under_review', 'approve', 'reject', 'suspend') then
    raise exception 'invalid decision';
  end if;

  select * into app_row
  from public.intelligence_applications
  where id = p_application_id
  for update;

  if app_row.id is null then
    raise exception 'application not found';
  end if;

  insert into public.intelligence_application_reviews (
    application_id, decision, admin_notes, reviewed_by
  ) values (
    app_row.id, p_decision, p_admin_notes, auth.uid()
  );

  if p_decision = 'under_review' then
    update public.intelligence_applications
    set status = 'under_review', updated_at = now()
    where id = app_row.id;
    return null;
  end if;

  if p_decision = 'reject' then
    update public.intelligence_applications
    set status = 'rejected',
        rejection_reason = coalesce(p_rejection_reason, 'Requisiti non soddisfatti'),
        updated_at = now()
    where id = app_row.id;
    return null;
  end if;

  if p_decision = 'approve' then
    insert into public.intelligence_companies (
      legal_name, display_name, company_type, website, country, market_scope,
      module_access
    ) values (
      coalesce(app_row.legal_entity, app_row.company_name),
      app_row.company_name,
      app_row.company_type,
      app_row.website,
      app_row.country,
      app_row.market_scope,
      coalesce(
        p_module_access,
        app_row.desired_modules,
        array[
          'market_overview', 'switching', 'premium_benchmark',
          'coverage_benchmark', 'geography', 'insurer_comparison'
        ]
      )
    )
    returning id into v_company_id;

    insert into public.intelligence_memberships (
      company_id, user_id, member_role, active
    ) values (
      v_company_id, app_row.user_id, 'company_admin', true
    )
    on conflict (company_id, user_id) do update
      set active = true, member_role = 'company_admin';

    update public.intelligence_applications
    set status = 'approved', company_id = v_company_id, updated_at = now()
    where id = app_row.id;

    perform public.write_platform_audit(
      'intelligence_application_approved',
      'intelligence_application',
      app_row.id,
      jsonb_build_object('company_id', v_company_id)
    );
    return v_company_id;
  end if;

  if p_decision = 'suspend' and app_row.company_id is not null then
    update public.intelligence_companies
    set status = 'suspended', updated_at = now()
    where id = app_row.company_id;

    update public.intelligence_memberships as im
    set active = false
    where im.company_id = app_row.company_id;
  end if;

  return app_row.company_id;
end;
$$;

revoke all on function public.review_intelligence_application(
  uuid, text, text, text, text[]
) from public, anon;
grant execute on function public.review_intelligence_application(
  uuid, text, text, text, text[]
) to authenticated;

create or replace function public.get_atlas_system_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_run public.intelligence_snapshot_runs%rowtype;
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'admin required';
  end if;

  select * into last_run
  from public.intelligence_snapshot_runs
  order by started_at desc
  limit 1;

  return jsonb_build_object(
    'web', 'ok',
    'database', 'ok',
    'checked_at', now(),
    'intelligence', jsonb_build_object(
      'min_cohort_size', public.intelligence_min_cohort_size(),
      'methodology_version', public.intelligence_methodology_version(),
      'last_run_status', last_run.status,
      'last_run_finished_at', last_run.finished_at,
      'last_run_error', last_run.error_message,
      'policies_eligible', last_run.policies_eligible,
      'snapshots_written', last_run.snapshots_written,
      'trigger_source', last_run.trigger_source
    ),
    'counts', jsonb_build_object(
      'consumers', (
        select count(*)
        from public.profiles p
        left join public.user_roles ur on ur.user_id = p.id
        where coalesce(ur.role, 'consumer') = 'consumer'
      ),
      'brokers', (select count(*) from public.brokers where active),
      'policies', (select count(*) from public.policies),
      'documents', (select count(*) from public.documents),
      'consultations', (select count(*) from public.consultation_requests),
      'offers', (select count(*) from public.insurance_offers),
      'contracts', (select count(*) from public.broker_contracts)
    )
  );
end;
$$;

revoke all on function public.get_atlas_system_health() from public, anon;
grant execute on function public.get_atlas_system_health() to authenticated;

create or replace function public.get_pilot_funnel_metrics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'admin required';
  end if;

  return jsonb_build_object(
    'registered_consumers', (
      select count(*)
      from public.profiles p
      left join public.user_roles ur on ur.user_id = p.id
      where coalesce(ur.role, 'consumer') = 'consumer'
    ),
    'policies_uploaded', (select count(*) from public.policies),
    'documents', (select count(*) from public.documents),
    'consultations_requested', (select count(*) from public.consultation_requests),
    'broker_accepted', (
      select count(*) from public.consultation_requests
      where broker_acceptance = 'accepted' or assigned_broker_id is not null
    ),
    'offers_sent', (
      select count(*) from public.insurance_offers
      where status in ('sent','proposed','viewed','interested','accepted','converted')
        or verified_at is not null
    ),
    'contracts', (select count(*) from public.broker_contracts),
    'as_of', now()
  );
end;
$$;

revoke all on function public.get_pilot_funnel_metrics() from public, anon;
grant execute on function public.get_pilot_funnel_metrics() to authenticated;
