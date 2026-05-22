alter table public.policies
  add column if not exists policy_category_label text,
  add column if not exists policy_number text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists currency text not null default 'CHF',
  add column if not exists coverage_amount numeric,
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists extraction_confidence numeric,
  add column if not exists extraction_notes text;

update public.policies
set policy_category_label = policy_type
where policy_category_label is null
  and policy_type not in ('health', 'liability', 'household', 'car', 'legal', 'other');

update public.policies
set policy_type = case
  when lower(policy_type) in ('health', 'liability', 'household', 'car', 'legal', 'other')
    then lower(policy_type)
  when lower(policy_type) like any (array['%cassa%', '%malat%', '%salut%', '%health%', '%helsana%'])
    then 'health'
  when lower(policy_type) like any (array['%rc privata%', '%responsabil%', '%liability%'])
    then 'liability'
  when lower(policy_type) like any (array['%economia%', '%domestic%', '%mobilia%', '%household%', '%casa%'])
    then 'household'
  when lower(policy_type) like any (array['%auto%', '%casco%', '%car%', '%veicol%', '%vehicle%'])
    then 'car'
  when lower(policy_type) like any (array['%giurid%', '%legal%', '%recht%'])
    then 'legal'
  else 'other'
end;

alter table public.policies
  alter column policy_type set default 'other';

alter table public.policies
  drop constraint if exists policies_policy_type_check;

alter table public.policies
  add constraint policies_policy_type_check
  check (policy_type in ('health', 'liability', 'household', 'car', 'legal', 'other'));

alter table public.policies
  drop constraint if exists policies_details_object_check;

alter table public.policies
  add constraint policies_details_object_check
  check (jsonb_typeof(details) = 'object');

alter table public.policies
  drop constraint if exists policies_extraction_confidence_check;

alter table public.policies
  add constraint policies_extraction_confidence_check
  check (
    extraction_confidence is null
    or extraction_confidence between 0 and 100
  );
