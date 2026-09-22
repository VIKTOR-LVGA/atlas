-- Storage policies for quote PDFs using current_broker_id()

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
