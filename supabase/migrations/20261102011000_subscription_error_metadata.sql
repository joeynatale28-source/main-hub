alter table public.dl_subscriptions
  add column if not exists name_custom boolean not null default false,
  add column if not exists last_error_code text,
  add column if not exists last_error_at timestamptz;
