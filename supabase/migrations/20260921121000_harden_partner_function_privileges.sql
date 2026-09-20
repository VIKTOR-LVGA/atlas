-- Follow-up hardening identified by the live Supabase Security Advisor.
-- Additive only; the production application does not depend on these grants.

-- Trigger functions never need direct API execution.
revoke all on function public.protect_partner_application_columns()
  from public, anon, authenticated;

-- Cover the two foreign-key lookup paths introduced by partner onboarding.
create index if not exists partner_applications_broker_idx
  on public.partner_applications (broker_id)
  where broker_id is not null;

create index if not exists partner_application_reviews_reviewer_idx
  on public.partner_application_reviews (reviewed_by)
  where reviewed_by is not null;
