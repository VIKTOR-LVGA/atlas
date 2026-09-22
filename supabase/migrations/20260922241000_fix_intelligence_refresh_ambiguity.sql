-- Fix ambiguous column references in refresh_intelligence_snapshots
create or replace function public.refresh_intelligence_snapshots(
  p_trigger_source text default 'manual',
  p_period_days integer default 365
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid;
  min_k integer := public.intelligence_min_cohort_size();
  meth text := public.intelligence_methodology_version();
  p_start date := (timezone('Europe/Zurich', now()))::date - greatest(p_period_days, 30);
  p_end date := (timezone('Europe/Zurich', now()))::date;
  v_policies_scanned integer := 0;
  v_policies_eligible integer := 0;
  v_quotes_eligible integer := 0;
  v_contracts_eligible integer := 0;
  v_switches_eligible integer := 0;
  v_snapshots_written integer := 0;
  r record;
  premiums numeric[];
  n integer;
  med numeric;
  p25 numeric;
  p75 numeric;
  masked boolean;
begin
  if public.current_user_role() is distinct from 'admin'
     and coalesce(p_trigger_source, '') not in ('scheduler', 'system') then
    if auth.uid() is not null and public.current_user_role() is distinct from 'admin' then
      raise exception 'admin required to refresh intelligence snapshots';
    end if;
  end if;

  insert into public.intelligence_snapshot_runs (
    status, methodology_version, minimum_cohort_size, period_start, period_end, trigger_source
  ) values (
    'running', meth, min_k, p_start, p_end, coalesce(p_trigger_source, 'manual')
  ) returning id into run_id;

  begin
    insert into public.analytics_policy_fact (
      source_policy_id, category, insurer_label, annualized_premium, premium_frequency,
      currency, canton, eligible_premium, eligible_coverage, observed_on, updated_at
    )
    select
      p.id,
      coalesce(nullif(trim(p.policy_type), ''), 'other'),
      nullif(trim(p.provider), ''),
      public.intelligence_annualize_premium(p.premium_amount, p.premium_frequency),
      p.premium_frequency,
      coalesce(p.currency, 'CHF'),
      nullif(upper(left(trim(coalesce(
        p.details->>'canton_or_premium_region',
        p.details->>'canton',
        ''
      )), 2)), ''),
      (
        p.premium_amount is not null
        and p.premium_amount > 0
        and public.intelligence_annualize_premium(p.premium_amount, p.premium_frequency) is not null
        and coalesce(p.currency, 'CHF') = 'CHF'
        and coalesce(p.status, 'active') = 'active'
      ),
      true,
      coalesce(p.created_at::date, p_end),
      now()
    from public.policies p
    where coalesce(p.created_at::date, p_end) between p_start and p_end
    on conflict (source_policy_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      annualized_premium = excluded.annualized_premium,
      premium_frequency = excluded.premium_frequency,
      currency = excluded.currency,
      canton = excluded.canton,
      eligible_premium = excluded.eligible_premium,
      observed_on = excluded.observed_on,
      updated_at = now();

    select count(*) into v_policies_scanned from public.analytics_policy_fact
    where observed_on between p_start and p_end;
    select count(*) into v_policies_eligible from public.analytics_policy_fact
    where observed_on between p_start and p_end and eligible_premium;

    insert into public.analytics_quote_fact (
      source_offer_id, category, insurer_label, annualized_premium, currency, verified, observed_on
    )
    select
      o.id,
      coalesce(nullif(trim(o.policy_category), ''), 'other'),
      nullif(trim(o.insurer), ''),
      public.intelligence_annualize_premium(o.premium_amount, o.premium_frequency),
      coalesce(o.currency, 'CHF'),
      o.verified_at is not null,
      coalesce(o.proposed_at::date, o.created_at::date, p_end)
    from public.insurance_offers o
    where o.verified_at is not null
      and o.status in ('sent','proposed','viewed','interested','clarification_requested','accepted','converted')
      and coalesce(o.proposed_at::date, o.created_at::date, p_end) between p_start and p_end
    on conflict (source_offer_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      annualized_premium = excluded.annualized_premium,
      verified = excluded.verified,
      observed_on = excluded.observed_on;

    select count(*) into v_quotes_eligible from public.analytics_quote_fact
    where observed_on between p_start and p_end and verified;

    insert into public.analytics_contract_fact (
      source_contract_id, category, insurer_label, observed_on
    )
    select
      c.id,
      coalesce(nullif(trim(c.category), ''), 'other'),
      nullif(trim(c.insurer), ''),
      coalesce(c.contract_start_date, c.created_at::date, p_end)
    from public.broker_contracts c
    where coalesce(c.contract_start_date, c.created_at::date, p_end) between p_start and p_end
    on conflict (source_contract_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      observed_on = excluded.observed_on;

    select count(*) into v_contracts_eligible from public.analytics_contract_fact
    where observed_on between p_start and p_end;

    insert into public.analytics_switch_fact (
      source_switch_id, category, from_insurer, to_insurer,
      old_annual_premium, new_annual_premium, premium_delta,
      reason_code, confirmation_source, observed_on
    )
    select
      s.id,
      coalesce(nullif(trim(s.category), ''), 'other'),
      nullif(trim(s.from_insurer), ''),
      nullif(trim(s.to_insurer), ''),
      s.old_premium,
      s.new_premium,
      case when s.old_premium is not null and s.new_premium is not null
        then s.new_premium - s.old_premium else null end,
      s.reason_code,
      s.source,
      coalesce(s.confirmed_at::date, s.created_at::date, p_end)
    from public.switch_events s
    where coalesce(s.confirmed_at::date, s.created_at::date, p_end) between p_start and p_end
      and s.from_insurer is distinct from s.to_insurer
    on conflict (source_switch_id) do update set
      category = excluded.category,
      from_insurer = excluded.from_insurer,
      to_insurer = excluded.to_insurer,
      old_annual_premium = excluded.old_annual_premium,
      new_annual_premium = excluded.new_annual_premium,
      premium_delta = excluded.premium_delta,
      reason_code = excluded.reason_code,
      confirmation_source = excluded.confirmation_source,
      observed_on = excluded.observed_on;

    select count(*) into v_switches_eligible from public.analytics_switch_fact
    where observed_on between p_start and p_end;

    delete from public.intelligence_market_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_premium_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_switching_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_coverage_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_insurer_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_geography_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;

    for r in
      select
        f.category,
        null::text as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
      group by f.category
      union all
      select
        f.category,
        f.insurer_label as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
        and f.insurer_label is not null
      group by f.category, f.insurer_label
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      p25 := public.intelligence_percentile(premiums, 25);
      p75 := public.intelligence_percentile(premiums, 75);
      masked := n < min_k;

      insert into public.intelligence_market_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, age_band, insurer, observed_policies, median_premium, p25_premium, p75_premium,
        source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, null, r.insurer, r.n,
        case when masked then null else med end,
        case when masked then null else p25 end,
        case when masked then null else p75 end,
        n, masked
      );
      v_snapshots_written := v_snapshots_written + 1;

      insert into public.intelligence_premium_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, age_band, insurer, source_count, median_premium, p25_premium, p75_premium, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, null, r.insurer, n,
        case when masked then null else med end,
        case when masked then null else p25 end,
        case when masked then null else p75 end,
        masked
      );
      v_snapshots_written := v_snapshots_written + 1;
    end loop;

    for r in
      select
        coalesce(s.category, 'other') as category,
        coalesce(s.from_insurer, 'unknown') as from_insurer,
        coalesce(s.to_insurer, 'unknown') as to_insurer,
        count(*)::integer as n
      from public.analytics_switch_fact s
      where s.observed_on between p_start and p_end
      group by 1, 2, 3
    loop
      masked := r.n < min_k;
      insert into public.intelligence_switching_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, from_insurer, to_insurer, switch_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, r.from_insurer, r.to_insurer,
        case when masked then 0 else r.n end,
        masked
      );
      v_snapshots_written := v_snapshots_written + 1;
    end loop;

    for r in
      select
        coalesce(pc.insurance_category, 'other') as category,
        coalesce(nullif(trim(pc.canonical_type), ''), 'unknown') as coverage_code,
        count(*) filter (where pc.coverage_status in ('included','excluded'))::integer as known_n,
        count(*) filter (where pc.coverage_status = 'included')::integer as included_n
      from public.policy_coverages pc
      where pc.created_at::date between p_start and p_end
      group by 1, 2
    loop
      masked := r.known_n < min_k;
      insert into public.intelligence_coverage_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, coverage_code, penetration_pct, source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, r.coverage_code,
        case when masked or r.known_n = 0 then null
          else round((r.included_n::numeric / r.known_n::numeric) * 100, 2) end,
        r.known_n,
        masked
      );
      v_snapshots_written := v_snapshots_written + 1;
    end loop;

    for r in
      select
        f.category,
        f.canton,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
        and f.canton is not null
        and length(f.canton) = 2
      group by f.category, f.canton
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      masked := r.n < min_k;
      insert into public.intelligence_geography_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, observed_policies, median_premium, switch_count, source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, r.canton, r.n,
        case when masked then null else med end,
        coalesce((
          select count(*)::integer from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category, 'other') = r.category
            and s.canton = r.canton
        ), 0),
        r.n,
        masked
      );
      v_snapshots_written := v_snapshots_written + 1;
    end loop;

    for r in
      select
        f.category,
        coalesce(f.insurer_label, 'unknown') as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
      group by f.category, coalesce(f.insurer_label, 'unknown')
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      masked := r.n < min_k;
      insert into public.intelligence_insurer_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, insurer, observed_policies, observed_share_pct, median_premium,
        switch_inflow, switch_outflow, net_observed_switching, source_count, privacy_masked
      )
      select
        now(), p_start, p_end, meth, min_k,
        r.category, r.insurer, r.n,
        null,
        case when masked then null else med end,
        coalesce((select count(*) from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category,'other') = r.category
            and coalesce(s.to_insurer,'unknown') = r.insurer), 0),
        coalesce((select count(*) from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category,'other') = r.category
            and coalesce(s.from_insurer,'unknown') = r.insurer), 0),
        0,
        r.n,
        masked;
      update public.intelligence_insurer_snapshot
      set net_observed_switching = switch_inflow - switch_outflow
      where methodology_version = meth and period_start = p_start and period_end = p_end
        and category = r.category and insurer = r.insurer
        and calculated_at >= now() - interval '1 minute';
      v_snapshots_written := v_snapshots_written + 1;
    end loop;

    update public.intelligence_snapshot_runs
    set
      status = 'succeeded',
      finished_at = now(),
      policies_scanned = v_policies_scanned,
      policies_eligible = v_policies_eligible,
      quotes_eligible = v_quotes_eligible,
      contracts_eligible = v_contracts_eligible,
      switches_eligible = v_switches_eligible,
      snapshots_written = v_snapshots_written
    where id = run_id;

  exception when others then
    update public.intelligence_snapshot_runs
    set status = 'failed', finished_at = now(), error_message = left(SQLERRM, 500)
    where id = run_id;
    raise;
  end;

  return run_id;
end;
$$;
