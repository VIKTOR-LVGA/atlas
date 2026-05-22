update public.documents
set status = case status
  when 'analyzing' then 'processing'
  when 'completed' then 'analyzed'
  when 'error' then 'failed'
  else status
end
where status in ('analyzing', 'completed', 'error');

update public.documents
set status = 'failed'
where status not in ('uploaded', 'processing', 'analyzed', 'failed');

alter table public.documents
  alter column status set default 'uploaded';

alter table public.documents
  drop constraint if exists documents_status_check;

alter table public.documents
  add constraint documents_status_check
  check (status in ('uploaded', 'processing', 'analyzed', 'failed'));

alter table public.policies
  add column if not exists source text not null default 'manual',
  add column if not exists requires_review boolean not null default false;
