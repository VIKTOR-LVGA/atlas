-- ATLAS 2.0 household model. Additive and backwards-compatible.

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text,
  relationship text not null,
  birth_date date,
  gender text,
  is_policy_holder boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_members_relationship_check
    check (relationship in ('self', 'partner', 'child', 'other')),
  constraint family_members_first_name_check
    check (char_length(trim(first_name)) between 1 and 120),
  constraint family_members_notes_size_check
    check (notes is null or char_length(notes) <= 4000),
  constraint family_members_id_user_id_unique unique (id, user_id)
);

create index if not exists family_members_user_id_created_at_idx
  on public.family_members (user_id, created_at);

create unique index if not exists family_members_one_self_per_user_idx
  on public.family_members (user_id)
  where relationship = 'self';

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  property_type text not null,
  occupancy_type text not null,
  street text,
  postal_code text,
  city text,
  canton text,
  country text not null default 'CH',
  household_size integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_type_check
    check (property_type in ('apartment', 'house', 'other')),
  constraint properties_occupancy_check
    check (occupancy_type in ('tenant', 'owner', 'other')),
  constraint properties_country_check check (char_length(country) = 2),
  constraint properties_household_size_check
    check (household_size is null or household_size between 1 and 100),
  constraint properties_label_check check (char_length(trim(label)) between 1 and 120),
  constraint properties_notes_size_check check (notes is null or char_length(notes) <= 4000),
  constraint properties_id_user_id_unique unique (id, user_id)
);

create index if not exists properties_user_id_created_at_idx
  on public.properties (user_id, created_at);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  vehicle_type text not null default 'car',
  make text,
  model text,
  year integer,
  license_plate text,
  canton text,
  ownership_type text,
  first_registration_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_type_check
    check (vehicle_type in ('car', 'motorcycle', 'camper', 'commercial', 'other')),
  constraint vehicles_ownership_check
    check (ownership_type is null or ownership_type in ('owned', 'leased', 'financed', 'other')),
  constraint vehicles_year_check check (year is null or year between 1886 and 2200),
  constraint vehicles_label_check check (char_length(trim(label)) between 1 and 120),
  constraint vehicles_notes_size_check check (notes is null or char_length(notes) <= 4000),
  constraint vehicles_id_user_id_unique unique (id, user_id)
);

create index if not exists vehicles_user_id_created_at_idx
  on public.vehicles (user_id, created_at);

create unique index if not exists policies_id_user_id_uidx
  on public.policies (id, user_id);

alter table public.policies
  add column if not exists family_member_id uuid,
  add column if not exists property_id uuid,
  add column if not exists vehicle_id uuid;

alter table public.policies
  drop constraint if exists policies_family_member_owner_fk,
  add constraint policies_family_member_owner_fk
    foreign key (family_member_id, user_id)
    references public.family_members (id, user_id)
    on delete set null (family_member_id),
  drop constraint if exists policies_property_owner_fk,
  add constraint policies_property_owner_fk
    foreign key (property_id, user_id)
    references public.properties (id, user_id)
    on delete set null (property_id),
  drop constraint if exists policies_vehicle_owner_fk,
  add constraint policies_vehicle_owner_fk
    foreign key (vehicle_id, user_id)
    references public.vehicles (id, user_id)
    on delete set null (vehicle_id);

create index if not exists policies_family_member_id_idx on public.policies (family_member_id);
create index if not exists policies_property_id_idx on public.policies (property_id);
create index if not exists policies_vehicle_id_idx on public.policies (vehicle_id);

create table if not exists public.policy_members (
  policy_id uuid not null,
  family_member_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'insured_person',
  created_at timestamptz not null default now(),
  primary key (policy_id, family_member_id),
  constraint policy_members_policy_owner_fk
    foreign key (policy_id, user_id)
    references public.policies (id, user_id)
    on delete cascade,
  constraint policy_members_family_owner_fk
    foreign key (family_member_id, user_id)
    references public.family_members (id, user_id)
    on delete cascade,
  constraint policy_members_role_check
    check (role in ('policyholder', 'insured_person', 'beneficiary', 'other'))
);

create index if not exists policy_members_user_id_idx on public.policy_members (user_id);
create index if not exists policy_members_family_member_id_idx on public.policy_members (family_member_id);

alter table public.family_members enable row level security;
alter table public.properties enable row level security;
alter table public.vehicles enable row level security;
alter table public.policy_members enable row level security;

grant select, insert, update, delete on table public.family_members to authenticated;
grant select, insert, update, delete on table public.properties to authenticated;
grant select, insert, update, delete on table public.vehicles to authenticated;
grant select, insert, update, delete on table public.policy_members to authenticated;

create policy "Users own family members"
  on public.family_members for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users own properties"
  on public.properties for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users own vehicles"
  on public.vehicles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users own policy members through policy"
  on public.policy_members for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.family_members fm
      where fm.id = family_member_id and fm.user_id = (select auth.uid())
    )
  );

create trigger family_members_set_updated_at
  before update on public.family_members
  for each row execute function public.set_row_updated_at();
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_row_updated_at();
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_row_updated_at();
