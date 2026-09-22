-- Consumers may read non-draft offers on their own consultations.
drop policy if exists insurance_offers_consumer_select on public.insurance_offers;
create policy insurance_offers_consumer_select on public.insurance_offers
  for select to authenticated
  using (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and cr.user_id = auth.uid()
    )
    and status <> 'draft'
  );
