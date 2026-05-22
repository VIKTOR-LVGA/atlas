alter table public.profiles
  add column if not exists phone text,
  add column if not exists language text,
  add column if not exists currency text,
  add column if not exists date_format text,
  add column if not exists notification_email boolean,
  add column if not exists notification_push boolean,
  add column if not exists notification_sms boolean;

alter table public.profiles
  alter column language set default 'it',
  alter column currency set default 'CHF',
  alter column date_format set default 'DD/MM/YYYY',
  alter column notification_email set default true,
  alter column notification_push set default true,
  alter column notification_sms set default false;

update public.profiles
set
  language = case
    when language in ('it', 'de', 'fr', 'en') then language
    else 'it'
  end,
  currency = 'CHF',
  date_format = case
    when date_format in ('DD/MM/YYYY', 'YYYY-MM-DD') then date_format
    else 'DD/MM/YYYY'
  end,
  notification_email = coalesce(notification_email, true),
  notification_push = coalesce(notification_push, true),
  notification_sms = coalesce(notification_sms, false);

alter table public.profiles
  alter column language set not null,
  alter column currency set not null,
  alter column date_format set not null,
  alter column notification_email set not null,
  alter column notification_push set not null,
  alter column notification_sms set not null;

alter table public.profiles
  drop constraint if exists profiles_language_check,
  add constraint profiles_language_check
    check (language in ('it', 'de', 'fr', 'en')),
  drop constraint if exists profiles_currency_check,
  add constraint profiles_currency_check
    check (currency = 'CHF'),
  drop constraint if exists profiles_date_format_check,
  add constraint profiles_date_format_check
    check (date_format in ('DD/MM/YYYY', 'YYYY-MM-DD'));

revoke update on table public.profiles from authenticated;
grant update (
  full_name,
  avatar_url,
  phone,
  language,
  currency,
  date_format,
  notification_email,
  notification_push,
  notification_sms
) on table public.profiles to authenticated;
