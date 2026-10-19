-- Read-only preflight for the two pending ATLAS migrations.
-- Run with a transaction_read_only session. This file performs no writes.
begin transaction read only;

select current_database() as database_name, current_user as database_role;

select version
from supabase_migrations.schema_migrations
where version in ('20261018120000', '20261018130000')
order by version;

select conname, pg_get_constraintdef(oid, true) as definition
from pg_constraint
where conrelid = 'public.documents'::regclass
  and conname = 'documents_document_type_check';

select document_type, count(*) as row_count
from public.documents
where document_type not in (
  'policy', 'general_conditions', 'supplementary_conditions', 'invoice',
  'premium_notice', 'renewal_notice', 'claim_document', 'coverage_summary',
  'customer_information', 'certificate', 'quote', 'offer', 'unknown'
)
group by document_type
order by document_type;

select p.oid::regprocedure as function_signature,
       pg_get_functiondef(p.oid) as rollback_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'review_intelligence_application',
    'get_atlas_system_health',
    'get_pilot_funnel_metrics'
  )
order by p.proname, p.oid;

select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'documents', 'policies', 'policy_coverages', 'family_members',
    'opportunities', 'consultation_requests', 'atlas_conversations',
    'atlas_messages'
  )
order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in (
         'documents', 'policies', 'policy_coverages', 'family_members',
         'opportunities', 'consultation_requests', 'atlas_conversations',
         'atlas_messages'
       ))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select event_object_schema, event_object_table, trigger_name,
       action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema in ('public', 'auth', 'storage')
  and event_object_table in (
    'users', 'documents', 'policies', 'policy_coverages',
    'consultation_requests', 'objects'
  )
order by event_object_schema, event_object_table, trigger_name;

select conrelid::regclass as child_table,
       conname,
       confrelid::regclass as parent_table,
       pg_get_constraintdef(oid, true) as definition
from pg_constraint
where contype = 'f'
  and (
    conrelid in (
      'public.documents'::regclass,
      'public.policies'::regclass,
      'public.policy_coverages'::regclass
    )
    or confrelid in (
      'public.documents'::regclass,
      'public.policies'::regclass,
      'public.policy_coverages'::regclass
    )
  )
order by conrelid::regclass::text, conname;

select bucket_id, count(*) as object_count
from storage.objects
where bucket_id = 'policy-documents'
group by bucket_id;

select pid, usename, state, wait_event_type, wait_event,
       now() - query_start as running_for,
       left(query, 180) as query
from pg_stat_activity
where datname = current_database()
  and pid <> pg_backend_pid()
  and state <> 'idle'
order by query_start;

rollback;
