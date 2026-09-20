-- Partner applications, platform audit log, approval RPCs, analytics helpers.
-- Additive only: does not alter role enum, commission split rules, or existing RLS of core tables.

-- ---------------------------------------------------------------------------
-- Partner applications
-- ---------------------------------------------------------------------------
create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  organization_name text,
  legal_name text,
  professional_email text not null,
  phone text not null,
  website text,
  partner_type text not null default 'independent_broker',
  primary_canton text not null,
  served_cantons text[] not null default '{}',
  languages text[] not null default '{}',
  professional_id text,
  experience_notes text,
  message text,
  consent_given_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  status text not null default 'submitted',
  rejection_reason text,
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  broker_id uuid references public.brokers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_applications_status_check check (status in (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'
  )),
  constraint partner_applications_type_check check (partner_type in (
    'independent_broker', 'agency', 'general_agent', 'other'
  )),
  constraint partner_applications_email_check check (char_length(professional_email) between 3 and 254),
  constraint partner_applications_message_check check (message is null or char_length(message) <= 4000),
  constraint partner_applications_experience_check check (experience_notes is null or char_length(experience_notes) <= 4000)
);

create index partner_applications_status_idx
  on public.partner_applications (status, created_at desc);

create trigger partner_applications_set_updated_at
  before update on public.partner_applications
  for each row execute function public.set_row_updated_at();

alter table public.brokers
  add column if not exists website text,
  add column if not exists partner_type text,
  add column if not exists primary_canton text,
  add column if not exists served_cantons text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists professional_id text,
  add column if not exists experience_notes text;

-- ---------------------------------------------------------------------------
-- Platform audit log (admin-only read)
-- ---------------------------------------------------------------------------
create table public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid,
  actor_role text,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint platform_audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index platform_audit_log_created_idx on public.platform_audit_log (created_at desc);
create index platform_audit_log_event_idx on public.platform_audit_log (event_type, created_at desc);

alter table public.partner_applications enable row level security;
alter table public.platform_audit_log enable row level security;
revoke all on table public.partner_applications from anon, authenticated;
revoke all on table public.platform_audit_log from anon, authenticated;
grant select, insert, update on table public.partner_applications to authenticated;
grant select on table public.platform_audit_log to authenticated;

create policy "Applicants read own application, admins read all"
  on public.partner_applications for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
  );

create policy "Consumers insert own application"
  on public.partner_applications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.current_user_role()) = 'consumer'
    and status in ('draft', 'submitted')
  );

create policy "Applicants update draft or rejected applications"
  on public.partner_applications for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.current_user_role()) = 'consumer'
    and status in ('draft', 'rejected')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'submitted')
  );

create policy "Admins update partner applications"
  on public.partner_applications for update to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admins read platform audit log"
  on public.platform_audit_log for select to authenticated
  using ((select public.current_user_role()) = 'admin');

-- Prevent applicants from writing admin-only columns via RLS trigger
create or replace function public.protect_partner_application_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() = 'admin' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.admin_notes := old.admin_notes;
    new.rejection_reason := old.rejection_reason;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    new.broker_id := old.broker_id;
    if old.status not in ('draft', 'rejected') then
      raise exception 'application locked';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception 'invalid applicant status transition';
    end if;
  end if;
  if tg_op = 'INSERT' then
    new.admin_notes := null;
    new.rejection_reason := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.broker_id := null;
  end if;
  return new;
end;
$$;

create trigger partner_applications_protect_columns
  before insert or update on public.partner_applications
  for each row execute function public.protect_partner_application_columns();

create or replace function public.write_platform_audit(
  p_event_type text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.platform_audit_log (event_type, actor_id, actor_role, target_type, target_id, metadata)
  values (
    p_event_type,
    auth.uid(),
    public.current_user_role(),
    p_target_type,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.write_platform_audit(text, text, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Canton normalization (properties / vehicles)
-- ---------------------------------------------------------------------------
create or replace function public.normalize_canton_code(p_value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare normalized text;
begin
  if p_value is null or length(trim(p_value)) = 0 then return null; end if;
  normalized := upper(trim(p_value));
  if normalized in (
    'AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW',
    'SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'
  ) then
    return normalized;
  end if;
  return case
    when normalized in ('ZÜRICH','ZURICH','ZURIGO') then 'ZH'
    when normalized in ('BERN','BERNE','BERNA') then 'BE'
    when normalized in ('LUZERN','LUCERNE','LUCERNA') then 'LU'
    when normalized = 'URI' then 'UR'
    when normalized = 'SCHWYZ' then 'SZ'
    when normalized = 'OBWALDEN' then 'OW'
    when normalized = 'NIDWALDEN' then 'NW'
    when normalized in ('GLARUS','GLARONA') then 'GL'
    when normalized in ('ZUG','ZUgo') then 'ZG'
    when normalized in ('FRIBOURG','FREIBURG','FRIBURGO') then 'FR'
    when normalized in ('SOLOTHURN','SOLEURE','SOLETTA') then 'SO'
    when normalized in ('BASEL-STADT','BASEL STADT','BÂLE-VILLE','BASILEA CITTÀ') then 'BS'
    when normalized in ('BASEL-LANDSCHAFT','BASEL LAND','BÂLE-CAMPAGNE','BASILEA CAMPAGNA') then 'BL'
    when normalized in ('SCHAFFHAUSEN','SCHAFFHOUSE','SCAFFUSA') then 'SH'
    when normalized in ('APPENZELL AUSSERRHODEN','APPENZELL ESTERNO') then 'AR'
    when normalized in ('APPENZELL INNERRHODEN','APPENZELL INTERNO') then 'AI'
    when normalized in ('ST. GALLEN','ST GALLEN','SAINT-GALL','SAN GALLO') then 'SG'
    when normalized in ('GRAUBÜNDEN','GRISONS','GRIGIONI') then 'GR'
    when normalized in ('AARGAU','ARGOVIE','ARGOVIA') then 'AG'
    when normalized in ('THURGAU','THURGOVIE','TUGOVIA') then 'TG'
    when normalized in ('TICINO','TESSIN') then 'TI'
    when normalized in ('VAUD','WAADT') then 'VD'
    when normalized in ('VALAIS','WALLIS') then 'VS'
    when normalized in ('NEUCHÂTEL','NEUCHATEL') then 'NE'
    when normalized in ('GENÈVE','GENEVE','GENEVA','GINEVRA') then 'GE'
    when normalized = 'JURA' then 'JU'
    else null
  end;
end;
$$;

create or replace function public.user_primary_canton(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select public.normalize_canton_code(p.canton)
      from public.properties p
      where p.user_id = p_user_id
        and p.canton is not null
        and length(trim(p.canton)) > 0
      order by p.updated_at desc
      limit 1
    ),
    (
      select public.normalize_canton_code(v.canton)
      from public.vehicles v
      where v.user_id = p_user_id
        and v.canton is not null
        and length(trim(v.canton)) > 0
      order by v.updated_at desc
      limit 1
    )
  );
$$;

revoke all on function public.normalize_canton_code(text) from public, anon;
revoke all on function public.user_primary_canton(uuid) from public, anon;
grant execute on function public.normalize_canton_code(text) to authenticated;
grant execute on function public.user_primary_canton(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Approval / rejection / suspension RPCs
-- ---------------------------------------------------------------------------
create or replace function public.review_partner_application(
  p_application_id uuid,
  p_decision text,
  p_admin_notes text default null,
  p_rejection_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_row public.partner_applications%rowtype;
  new_broker_id uuid;
  display text;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  if p_decision not in ('approve', 'reject', 'under_review', 'suspend') then
    raise exception 'invalid decision';
  end if;

  select * into app_row from public.partner_applications where id = p_application_id for update;
  if not found then raise exception 'application not found'; end if;

  if p_decision = 'under_review' then
    update public.partner_applications
      set status = 'under_review',
          admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
          reviewed_at = now(),
          reviewed_by = auth.uid()
    where id = p_application_id;
    perform public.write_platform_audit(
      'partner_application_under_review', 'partner_application', p_application_id,
      jsonb_build_object('user_id', app_row.user_id)
    );
    return p_application_id;
  end if;

  if p_decision = 'reject' then
    update public.partner_applications
      set status = 'rejected',
          rejection_reason = coalesce(nullif(trim(coalesce(p_rejection_reason, '')), ''), 'Candidatura non approvata'),
          admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
          reviewed_at = now(),
          reviewed_by = auth.uid()
    where id = p_application_id;
    perform public.write_platform_audit(
      'partner_application_rejected', 'partner_application', p_application_id,
      jsonb_build_object('user_id', app_row.user_id)
    );
    return p_application_id;
  end if;

  if p_decision = 'suspend' then
    if app_row.broker_id is not null then
      update public.brokers set active = false where id = app_row.broker_id;
    end if;
    if exists (select 1 from public.user_roles where user_id = app_row.user_id and role = 'broker') then
      update public.user_roles set role = 'consumer' where user_id = app_row.user_id;
    end if;
    update public.partner_applications
      set status = 'suspended',
          admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
          reviewed_at = now(),
          reviewed_by = auth.uid()
    where id = p_application_id;
    perform public.write_platform_audit(
      'partner_suspended', 'partner_application', p_application_id,
      jsonb_build_object('user_id', app_row.user_id, 'broker_id', app_row.broker_id)
    );
    return p_application_id;
  end if;

  -- approve
  display := trim(app_row.first_name || ' ' || app_row.last_name);
  if app_row.broker_id is not null then
    new_broker_id := app_row.broker_id;
    update public.brokers set
      auth_user_id = app_row.user_id,
      display_name = display,
      legal_name = app_row.legal_name,
      organization_name = app_row.organization_name,
      email = app_row.professional_email,
      phone = app_row.phone,
      website = app_row.website,
      partner_type = app_row.partner_type,
      primary_canton = app_row.primary_canton,
      served_cantons = app_row.served_cantons,
      languages = app_row.languages,
      professional_id = app_row.professional_id,
      experience_notes = app_row.experience_notes,
      active = true
    where id = new_broker_id;
  else
    insert into public.brokers (
      auth_user_id, display_name, legal_name, organization_name, email, phone,
      website, partner_type, primary_canton, served_cantons, languages,
      professional_id, experience_notes, active
    ) values (
      app_row.user_id, display, app_row.legal_name, app_row.organization_name,
      app_row.professional_email, app_row.phone, app_row.website, app_row.partner_type,
      app_row.primary_canton, app_row.served_cantons, app_row.languages,
      app_row.professional_id, app_row.experience_notes, true
    )
    returning id into new_broker_id;
  end if;

  insert into public.user_roles (user_id, role)
  values (app_row.user_id, 'broker')
  on conflict (user_id) do update set role = 'broker', updated_at = now();

  update public.partner_applications
    set status = 'approved',
        broker_id = new_broker_id,
        admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
        rejection_reason = null,
        reviewed_at = now(),
        reviewed_by = auth.uid()
  where id = p_application_id;

  perform public.write_platform_audit(
    'partner_application_approved', 'partner_application', p_application_id,
    jsonb_build_object('user_id', app_row.user_id, 'broker_id', new_broker_id)
  );
  perform public.write_platform_audit(
    'role_assigned_broker', 'user', app_row.user_id,
    jsonb_build_object('broker_id', new_broker_id, 'source', 'partner_application')
  );

  return new_broker_id;
end;
$$;

revoke all on function public.review_partner_application(uuid, text, text, text) from public, anon;
grant execute on function public.review_partner_application(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Control-center platform summary (admin)
-- ---------------------------------------------------------------------------
create or replace function public.get_control_center_summary(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  range_from timestamptz := coalesce(p_from, '1970-01-01'::timestamptz);
  range_to timestamptz := coalesce(p_to, now() + interval '1 day');
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from public.profiles where created_at >= range_from and created_at < range_to),
    'users_total', (select count(*) from public.profiles),
    'partners', (select count(*) from public.brokers where created_at >= range_from and created_at < range_to),
    'partners_active', (select count(*) from public.brokers where active),
    'applications_pending', (select count(*) from public.partner_applications where status in ('submitted', 'under_review')),
    'policies', (select count(*) from public.policies where created_at >= range_from and created_at < range_to),
    'policies_total', (select count(*) from public.policies),
    'documents', (select count(*) from public.documents where created_at >= range_from and created_at < range_to),
    'documents_failed', (select count(*) from public.documents where status = 'failed'),
    'documents_processing', (select count(*) from public.documents where status in ('uploaded', 'processing')),
    'consultations', (select count(*) from public.consultation_requests where created_at >= range_from and created_at < range_to),
    'appointments', (select count(*) from public.consultation_appointments where created_at >= range_from and created_at < range_to),
    'offers', (select count(*) from public.insurance_offers where created_at >= range_from and created_at < range_to),
    'contracts', (select count(*) from public.broker_contracts where created_at >= range_from and created_at < range_to),
    'revenue', (
      select jsonb_build_object(
        'gross', coalesce(sum(ca.gross_commission), 0),
        'atlas', coalesce(sum(ca.atlas_share), 0),
        'broker', coalesce(sum(ca.broker_share), 0),
        'expected', coalesce(sum(ca.gross_commission) filter (where ca.status = 'expected'), 0),
        'paid', coalesce(sum(ca.gross_commission) filter (where ca.status in ('paid', 'partially_paid')), 0)
      )
      from public.commission_attributions ca
      where ca.status not in ('cancelled', 'reversed')
        and coalesce(ca.earned_at, ca.created_at) >= range_from
        and coalesce(ca.earned_at, ca.created_at) < range_to
    ),
    'clawbacks', (
      select coalesce(sum(adj.amount), 0)
      from public.commission_adjustments adj
      where adj.adjustment_type = 'clawback'
        and adj.created_at >= range_from
        and adj.created_at < range_to
    )
  );
end;
$$;

create or replace function public.get_platform_engagement_funnel()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  registered bigint;
  with_policy bigint;
  with_document bigint;
  with_opportunity bigint;
  with_consultation bigint;
  with_appointment bigint;
  with_offer bigint;
  with_contract bigint;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;

  select count(*) into registered from public.profiles;
  select count(distinct user_id) into with_policy from public.policies;
  select count(distinct user_id) into with_document from public.documents;
  select count(distinct user_id) into with_opportunity from public.opportunities;
  select count(distinct user_id) into with_consultation from public.consultation_requests;
  select count(distinct cr.user_id) into with_appointment
    from public.consultation_appointments ca
    join public.consultation_requests cr on cr.id = ca.consultation_request_id;
  select count(distinct cr.user_id) into with_offer
    from public.insurance_offers o
    join public.consultation_requests cr on cr.id = o.consultation_request_id;
  select count(distinct user_id) into with_contract from public.broker_contracts;

  return jsonb_build_array(
    jsonb_build_object('id', 'registered', 'label', 'Utenti registrati', 'count', registered),
    jsonb_build_object('id', 'policies', 'label', 'Con almeno 1 polizza', 'count', with_policy),
    jsonb_build_object('id', 'documents', 'label', 'Con documenti', 'count', with_document),
    jsonb_build_object('id', 'opportunities', 'label', 'Con opportunità', 'count', with_opportunity),
    jsonb_build_object('id', 'consultations', 'label', 'Richieste consulenza', 'count', with_consultation),
    jsonb_build_object('id', 'appointments', 'label', 'Con appuntamento', 'count', with_appointment),
    jsonb_build_object('id', 'offers', 'label', 'Con offerta', 'count', with_offer),
    jsonb_build_object('id', 'contracts', 'label', 'Con contratto', 'count', with_contract)
  );
end;
$$;

create or replace function public.get_platform_growth_series(p_months integer default 12)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  months int := greatest(1, least(coalesce(p_months, 12), 36));
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.month)
    from (
      select
        to_char(date_trunc('month', d), 'YYYY-MM') as month,
        (
          select count(*) from public.profiles p
          where p.created_at >= date_trunc('month', d)
            and p.created_at < date_trunc('month', d) + interval '1 month'
        ) as new_users,
        (
          select count(*) from public.profiles p
          where p.created_at < date_trunc('month', d) + interval '1 month'
        ) as cumulative_users
      from generate_series(
        date_trunc('month', now()) - ((months - 1) || ' months')::interval,
        date_trunc('month', now()),
        '1 month'::interval
      ) as d
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_canton_aggregates(p_scope text default 'admin', p_broker_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  role text := public.current_user_role();
  broker_uuid uuid;
begin
  if p_scope = 'partner' then
    if role <> 'broker' then raise exception 'broker role required'; end if;
    broker_uuid := public.current_broker_id();
  elsif p_scope = 'admin' then
    if role <> 'admin' then raise exception 'admin role required'; end if;
    broker_uuid := p_broker_id;
  else
    raise exception 'invalid scope';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(x)::jsonb order by x.canton)
    from (
      select
        coalesce(public.user_primary_canton(cr.user_id), 'UNKNOWN') as canton,
        count(distinct cr.id) as leads,
        count(distinct cr.user_id) as clients,
        count(distinct bc.id) as contracts,
        coalesce(sum(ca.broker_share), 0) as broker_revenue,
        coalesce(sum(ca.gross_commission), 0) as gross_commission,
        coalesce(sum(ca.atlas_share), 0) as atlas_revenue
      from public.consultation_requests cr
      left join public.broker_contracts bc
        on bc.consultation_request_id = cr.id
      left join public.commission_attributions ca
        on ca.consultation_request_id = cr.id
        and ca.status not in ('cancelled', 'reversed')
      where (broker_uuid is null or cr.assigned_broker_id = broker_uuid)
      group by 1
    ) x
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_admin_user_directory()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  created_at timestamptz,
  policies_count bigint,
  documents_count bigint,
  consultations_count bigint,
  primary_canton text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  return query
  select
    p.id,
    p.full_name,
    p.email,
    coalesce(ur.role, 'consumer'),
    p.created_at,
    (select count(*) from public.policies pol where pol.user_id = p.id),
    (select count(*) from public.documents d where d.user_id = p.id),
    (select count(*) from public.consultation_requests cr where cr.user_id = p.id),
    public.user_primary_canton(p.id)
  from public.profiles p
  left join public.user_roles ur on ur.user_id = p.id
  order by p.created_at desc
  limit 2000;
end;
$$;

revoke all on function public.get_control_center_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_platform_engagement_funnel() from public, anon;
revoke all on function public.get_platform_growth_series(integer) from public, anon;
revoke all on function public.get_canton_aggregates(text, uuid) from public, anon;
revoke all on function public.get_admin_user_directory() from public, anon;

grant execute on function public.get_control_center_summary(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_platform_engagement_funnel() to authenticated;
grant execute on function public.get_platform_growth_series(integer) to authenticated;
grant execute on function public.get_canton_aggregates(text, uuid) to authenticated;
grant execute on function public.get_admin_user_directory() to authenticated;

-- Extend broker profile RPC with new columns (compatible return)
create or replace function public.get_current_broker_profile()
returns table (
  id uuid, auth_user_id uuid, display_name text, legal_name text,
  organization_name text, email text, phone text, finma_reference text, active boolean,
  website text, partner_type text, primary_canton text, served_cantons text[],
  languages text[], professional_id text, experience_notes text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  return query select b.id, b.auth_user_id, b.display_name, b.legal_name,
    b.organization_name, b.email, b.phone, b.finma_reference, b.active,
    b.website, b.partner_type, b.primary_canton, b.served_cantons,
    b.languages, b.professional_id, b.experience_notes
  from public.brokers b where b.id = public.current_broker_id();
end;
$$;
