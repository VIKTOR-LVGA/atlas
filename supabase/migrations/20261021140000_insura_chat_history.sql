create table if not exists public.insura_chat_history (
 user_id uuid primary key references auth.users(id) on delete cascade,
 messages jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 constraint insura_chat_history_array check (jsonb_typeof(messages) = 'array')
);
alter table public.insura_chat_history enable row level security;
create policy "Users read own chat" on public.insura_chat_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own chat" on public.insura_chat_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own chat" on public.insura_chat_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
