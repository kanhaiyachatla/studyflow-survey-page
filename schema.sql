create table if not exists public.uninstall_feedback (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('survey', 'reinstall', 'review')),
  reason text,
  details text check (details is null or char_length(details) <= 500),
  created_at timestamptz not null default now(),
  constraint survey_has_feedback check (
    event_type <> 'survey' or reason is not null or details is not null
  ),
  constraint actions_have_no_feedback check (
    event_type = 'survey' or (reason is null and details is null)
  )
);

alter table public.uninstall_feedback
  drop constraint if exists uninstall_feedback_reason_check;
alter table public.uninstall_feedback
  drop constraint if exists uninstall_feedback_reason_values_check;
alter table public.uninstall_feedback
  add constraint uninstall_feedback_reason_values_check check (
    reason is null or reason in (
      'I didn''t use it enough',
      'It was missing something I needed',
      'Something wasn''t working as expected',
      'It affected browser performance',
      'I found another solution',
      'Something else'
    )
  );

alter table public.uninstall_feedback enable row level security;

revoke all on table public.uninstall_feedback from anon, authenticated;
grant insert on table public.uninstall_feedback to anon;

drop policy if exists "Allow anonymous feedback submissions"
  on public.uninstall_feedback;
create policy "Allow anonymous feedback submissions"
  on public.uninstall_feedback
  for insert
  to anon
  with check (true);
