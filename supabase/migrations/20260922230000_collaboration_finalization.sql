-- Collaboration 1.0 finalization: quote docs, offer versioning, revocation.
-- Additive / backward compatible.

-- ---------------------------------------------------------------------------
-- Document types: quote / offer
-- ---------------------------------------------------------------------------
alter table public.documents
  drop constraint if exists documents_document_type_check;

alter table public.documents
  add constraint documents_document_type_check check (document_type in (
    'policy', 'general_conditions', 'supplementary_conditions', 'invoice',
    'premium_notice', 'renewal_notice', 'claim_document', 'coverage_summary',
    'customer_information', 'certificate', 'quote', 'offer', 'unknown'
  ));

-- ---------------------------------------------------------------------------
-- Offer extraction + versioning
-- ---------------------------------------------------------------------------
alter table public.insurance_offers
  add column if not exists extraction_status text;

alter table public.insurance_offers
  add column if not exists extraction_error text;

alter table public.insurance_offers
  add column if not exists verified_at timestamptz;

alter table public.insurance_offers
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

alter table public.insurance_offers
  add column if not exists parent_offer_id uuid references public.insurance_offers(id) on delete set null;

alter table public.insurance_offers
  add column if not exists is_current boolean not null default true;

alter table public.insurance_offers
  add column if not exists decision_offer_version integer;

alter table public.insurance_offers
  drop constraint if exists insurance_offers_extraction_status_check;

alter table public.insurance_offers
  add constraint insurance_offers_extraction_status_check check (
    extraction_status is null or extraction_status in (
      'uploaded', 'analyzing', 'needs_review', 'verified', 'ready_to_send', 'failed'
    )
  );

create index if not exists insurance_offers_parent_idx
  on public.insurance_offers (parent_offer_id)
  where parent_offer_id is not null;

create index if not exists insurance_offers_source_policy_current_idx
  on public.insurance_offers (source_policy_id, is_current)
  where source_policy_id is not null and is_current = true;

-- ---------------------------------------------------------------------------
-- Immutability of material terms after send
-- ---------------------------------------------------------------------------
create or replace function public.enforce_insurance_offer_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked boolean;
begin
  locked := old.status in (
    'sent', 'proposed', 'viewed', 'interested', 'clarification_requested',
    'declined', 'accepted', 'rejected', 'expired', 'converted'
  );

  if locked then
    if
      new.insurer is distinct from old.insurer
      or new.product is distinct from old.product
      or new.policy_category is distinct from old.policy_category
      or new.premium_amount is distinct from old.premium_amount
      or new.premium_frequency is distinct from old.premium_frequency
      or new.currency is distinct from old.currency
      or new.effective_date is distinct from old.effective_date
      or new.quote_validity_date is distinct from old.quote_validity_date
      or new.source_policy_id is distinct from old.source_policy_id
      or new.quote_document_id is distinct from old.quote_document_id
      or new.consumer_visible_notes is distinct from old.consumer_visible_notes
      or new.metadata is distinct from old.metadata
      or new.version is distinct from old.version
      or new.parent_offer_id is distinct from old.parent_offer_id
    then
      raise exception 'OFFER_IMMUTABLE: material terms of a sent offer cannot be changed; create a revision';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists insurance_offers_enforce_immutability on public.insurance_offers;
create trigger insurance_offers_enforce_immutability
  before update on public.insurance_offers
  for each row
  execute function public.enforce_insurance_offer_immutability();

-- ---------------------------------------------------------------------------
-- Create offer revision (new row; keep old immutable)
-- ---------------------------------------------------------------------------
create or replace function public.create_insurance_offer_revision(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  broker_row public.brokers%rowtype;
  src public.insurance_offers%rowtype;
  new_id uuid;
begin
  select * into broker_row from public.brokers
  where auth_user_id = auth.uid() and active = true
  limit 1;
  if broker_row.id is null and public.current_user_role() <> 'admin' then
    raise exception 'Not authorized';
  end if;

  select * into src from public.insurance_offers where id = p_offer_id;
  if src.id is null then raise exception 'Offer not found'; end if;
  if broker_row.id is not null and src.broker_id <> broker_row.id then
    raise exception 'Not authorized';
  end if;
  if src.status not in (
    'sent', 'proposed', 'viewed', 'interested', 'clarification_requested',
    'declined', 'accepted', 'rejected', 'expired'
  ) then
    raise exception 'Revision only for previously sent offers';
  end if;

  update public.insurance_offers set is_current = false where id = src.id;

  insert into public.insurance_offers (
    consultation_request_id, broker_id, insurer, product, policy_category,
    premium_amount, premium_frequency, status, metadata, source_policy_id,
    quote_document_id, quote_validity_date, effective_date, currency,
    consumer_visible_notes, version, parent_offer_id, is_current,
    extraction_status
  ) values (
    src.consultation_request_id, src.broker_id, src.insurer, src.product, src.policy_category,
    src.premium_amount, src.premium_frequency, 'draft', coalesce(src.metadata, '{}'::jsonb),
    src.source_policy_id, src.quote_document_id, src.quote_validity_date, src.effective_date,
    src.currency, src.consumer_visible_notes, coalesce(src.version, 1) + 1, src.id, true,
    case when src.quote_document_id is not null then 'needs_review' else null end
  ) returning id into new_id;

  insert into public.insurance_offer_items (offer_id, item_kind, code, label, value_text, value_numeric, currency)
  select new_id, item_kind, code, label, value_text, value_numeric, currency
  from public.insurance_offer_items where offer_id = src.id;

  perform public.write_platform_audit(
    'offer_revision_created',
    'insurance_offer',
    new_id,
    jsonb_build_object('parent_offer_id', src.id, 'version', coalesce(src.version, 1) + 1)
  );

  return new_id;
end;
$$;

revoke all on function public.create_insurance_offer_revision(uuid) from public, anon;
grant execute on function public.create_insurance_offer_revision(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Register quote PDF for offer (document owned by consumer)
-- ---------------------------------------------------------------------------
create or replace function public.broker_register_offer_quote_document(
  p_consultation_id uuid,
  p_offer_id uuid,
  p_file_name text,
  p_file_path text,
  p_file_size bigint,
  p_mime_type text default 'application/pdf',
  p_file_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  broker_row public.brokers%rowtype;
  req public.consultation_requests%rowtype;
  offer_row public.insurance_offers%rowtype;
  doc_id uuid;
begin
  select * into broker_row from public.brokers
  where auth_user_id = auth.uid() and active = true limit 1;
  if broker_row.id is null then raise exception 'Broker required'; end if;

  select * into req from public.consultation_requests where id = p_consultation_id;
  if req.id is null or req.assigned_broker_id is distinct from broker_row.id then
    raise exception 'Not assigned to this consultation';
  end if;

  select * into offer_row from public.insurance_offers
  where id = p_offer_id and consultation_request_id = p_consultation_id and broker_id = broker_row.id;
  if offer_row.id is null then raise exception 'Offer not found'; end if;
  if offer_row.status not in ('draft') then
    raise exception 'Quote PDF can only attach to draft offers (create a revision to change)';
  end if;

  if p_file_path is null or position(('quotes/' || p_consultation_id::text) in p_file_path) <> 1 then
    raise exception 'Invalid quote file path';
  end if;

  insert into public.documents (
    user_id, file_name, file_path, file_size, mime_type, file_hash,
    document_type, status
  ) values (
    req.user_id, left(trim(p_file_name), 240), p_file_path, p_file_size,
    coalesce(nullif(p_mime_type, ''), 'application/pdf'), p_file_hash,
    'quote', 'uploaded'
  ) returning id into doc_id;

  update public.insurance_offers
  set
    quote_document_id = doc_id,
    extraction_status = 'uploaded',
    extraction_error = null
  where id = offer_row.id;

  return doc_id;
end;
$$;

revoke all on function public.broker_register_offer_quote_document(uuid, uuid, text, text, bigint, text, text) from public, anon;
grant execute on function public.broker_register_offer_quote_document(uuid, uuid, text, text, bigint, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Revoke active shares when consultation closes
-- ---------------------------------------------------------------------------
create or replace function public.revoke_consultation_shares(p_consultation_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  allowed boolean := false;
begin
  if public.current_user_role() = 'admin' then
    allowed := true;
  elsif public.current_user_role() = 'consumer' then
    allowed := exists (
      select 1 from public.consultation_requests
      where id = p_consultation_id and user_id = auth.uid()
    );
  elsif public.current_user_role() = 'broker' then
    allowed := exists (
      select 1 from public.consultation_requests cr
      join public.brokers b on b.id = cr.assigned_broker_id
      where cr.id = p_consultation_id
        and b.auth_user_id = auth.uid()
        and b.active
    );
  end if;

  if not allowed then
    raise exception 'Not authorized';
  end if;

  update public.consultation_shared_resources
  set revoked_at = now()
  where consultation_request_id = p_consultation_id
    and revoked_at is null;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.revoke_consultation_shares(uuid) from public, anon;
grant execute on function public.revoke_consultation_shares(uuid) to authenticated;

create or replace function public.auto_revoke_shares_on_consultation_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('won', 'lost', 'completed', 'cancelled')
     and (old.status is distinct from new.status) then
    update public.consultation_shared_resources
    set revoked_at = coalesce(revoked_at, now())
    where consultation_request_id = new.id
      and revoked_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists consultation_requests_auto_revoke_shares on public.consultation_requests;
create trigger consultation_requests_auto_revoke_shares
  after update of status on public.consultation_requests
  for each row
  execute function public.auto_revoke_shares_on_consultation_close();

-- ---------------------------------------------------------------------------
-- Documents / storage access for offer quote PDFs
-- ---------------------------------------------------------------------------
drop policy if exists "Offer quote document select" on public.documents;
create policy "Offer quote document select"
  on public.documents for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.insurance_offers o
      join public.consultation_requests cr on cr.id = o.consultation_request_id
      where o.quote_document_id = documents.id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and exists (
              select 1 from public.brokers b
              where b.id = o.broker_id and b.auth_user_id = auth.uid() and b.active
            )
          )
        )
        -- consumer only after send (or broker always for their offer)
        and (
          public.current_user_role() = 'broker'
          or public.current_user_role() = 'admin'
          or o.status in (
            'sent', 'proposed', 'viewed', 'interested', 'clarification_requested',
            'declined', 'accepted', 'rejected', 'expired', 'converted'
          )
        )
    )
  );

drop policy if exists "Offer quote storage select" on storage.objects;
create policy "Offer quote storage select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'policy-documents'
    and (
      public.current_user_role() = 'admin'
      or exists (
        select 1 from public.documents d
        join public.insurance_offers o on o.quote_document_id = d.id
        join public.consultation_requests cr on cr.id = o.consultation_request_id
        where d.file_path = storage.objects.name
          and (
            (
              public.current_user_role() = 'broker'
              and o.broker_id = public.current_broker_id()
            )
            or (
              cr.user_id = auth.uid()
              and o.status in (
                'sent', 'proposed', 'viewed', 'interested', 'clarification_requested',
                'declined', 'accepted', 'rejected', 'expired', 'converted'
              )
            )
          )
      )
      or (
        name like 'quotes/%'
        and exists (
          select 1 from public.consultation_requests cr
          where cr.assigned_broker_id = public.current_broker_id()
            and name like ('quotes/' || cr.id::text || '/%')
        )
      )
    )
  );

drop policy if exists "Offer quote storage insert" on storage.objects;
create policy "Offer quote storage insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'policy-documents'
    and name like 'quotes/%'
    and exists (
      select 1 from public.consultation_requests cr
      where cr.assigned_broker_id = public.current_broker_id()
        and name like ('quotes/' || cr.id::text || '/%')
    )
  );


-- ---------------------------------------------------------------------------
-- Validate source_policy_id is shared on consultation
-- ---------------------------------------------------------------------------
create or replace function public.validate_offer_source_policy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_policy_id is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.consultation_request_id = new.consultation_request_id
      and csr.resource_type = 'policy'
      and csr.resource_id = new.source_policy_id
      and csr.revoked_at is null
      and cr.user_id = (
        select user_id from public.consultation_requests where id = new.consultation_request_id
      )
  ) then
    raise exception 'source_policy_id must be an explicitly shared policy on this consultation';
  end if;
  return new;
end;
$$;

drop trigger if exists insurance_offers_validate_source_policy on public.insurance_offers;
create trigger insurance_offers_validate_source_policy
  before insert or update of source_policy_id on public.insurance_offers
  for each row
  execute function public.validate_offer_source_policy();
