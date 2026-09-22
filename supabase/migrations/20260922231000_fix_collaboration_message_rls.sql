-- Fix message RLS to use current_broker_id() so brokers don't need SELECT on public.brokers.

drop policy if exists consultation_messages_select on public.consultation_messages;
create policy consultation_messages_select on public.consultation_messages
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_messages.consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and cr.assigned_broker_id = public.current_broker_id()
          )
        )
    )
  );

drop policy if exists consultation_messages_insert on public.consultation_messages;
create policy consultation_messages_insert on public.consultation_messages
  for insert to authenticated
  with check (
    sender_user_id = auth.uid()
    and message_kind = 'user'
    and exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and cr.assigned_broker_id = public.current_broker_id()
          )
        )
    )
  );

drop policy if exists consultation_messages_update_read on public.consultation_messages;
create policy consultation_messages_update_read on public.consultation_messages
  for update to authenticated
  using (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and cr.assigned_broker_id = public.current_broker_id()
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and cr.assigned_broker_id = public.current_broker_id()
          )
        )
    )
  );

-- Offer quote document select: avoid direct brokers table privilege
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
            and o.broker_id = public.current_broker_id()
          )
        )
        and (
          public.current_user_role() in ('broker', 'admin')
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
