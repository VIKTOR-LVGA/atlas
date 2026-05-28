-- Sprint 11: structured correction learning signals (nullable, retrocompatible)

alter table public.extraction_corrections
  add column if not exists field_name text,
  add column if not exists field_path text,
  add column if not exists ai_value_before jsonb,
  add column if not exists corrected_value_after jsonb,
  add column if not exists confidence_before numeric,
  add column if not exists correction_source text,
  add column if not exists correction_kind text,
  add column if not exists reviewed_at timestamptz;

-- Backfill learning columns for legacy coverage assignment rows (idempotent)
update public.extraction_corrections
set
  correction_kind = coalesce(correction_kind, 'assigned'),
  field_path = coalesce(field_path, 'coverage.assignment'),
  correction_source = coalesce(correction_source, 'assignment'),
  ai_value_before = coalesce(ai_value_before, previous_assignment),
  corrected_value_after = coalesce(corrected_value_after, corrected_assignment)
where correction_type = 'coverage_person_assignment'
  and (
    correction_kind is null
    or field_path is null
    or correction_source is null
    or ai_value_before is null
    or corrected_value_after is null
  );

create index if not exists extraction_corrections_user_field_created_idx
  on public.extraction_corrections (user_id, field_name, created_at desc)
  where field_name is not null;

create index if not exists extraction_corrections_user_kind_created_idx
  on public.extraction_corrections (user_id, correction_kind, created_at desc)
  where correction_kind is not null;
