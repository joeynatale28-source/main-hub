-- Align the deployed session-scoped API update payload with calendar/subscription schemas.
-- Without updated_at, Supabase rejects calendar Hide/Rename even though the UI shows the request.
alter table public.dl_calendars add column if not exists updated_at timestamptz not null default now();
alter table public.dl_subscriptions add column if not exists updated_at timestamptz not null default now();
