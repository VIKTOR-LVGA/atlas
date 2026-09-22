-- Expand Intelligence company/application types for B2B apply form.
-- Additive.

alter table public.intelligence_companies
  drop constraint if exists intelligence_companies_company_type_check;

alter table public.intelligence_companies
  add constraint intelligence_companies_company_type_check
  check (company_type in (
    'insurer',
    'general_agency',
    'insurance_group',
    'broker_intermediary',
    'insurtech',
    'market_partner',
    'other'
  ));

alter table public.intelligence_applications
  add column if not exists operating_canton text;

-- One open Intelligence application per work email (spam / duplicate protection)
create unique index if not exists intelligence_applications_one_open_per_email
  on public.intelligence_applications (lower(work_email))
  where status in ('submitted', 'under_review');
