-- Expand self-service partner registration without changing existing rows or
-- production-facing contracts.

alter table public.partner_applications
  add column if not exists accuracy_declared_at timestamptz;

alter table public.partner_applications
  drop constraint if exists partner_applications_type_check;

alter table public.partner_applications
  add constraint partner_applications_type_check check (
    partner_type in (
      'independent_broker',
      'brokerage_company',
      'agency',
      'general_agent',
      'other'
    )
  );

