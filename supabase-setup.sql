create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  guests smallint not null check (guests between 1 and 10),
  attendance text not null check (attendance in ('attending', 'not_attending')),
  message text not null default '' check (char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.rsvps
  drop constraint if exists rsvps_attendance_check;

alter table public.rsvps
  add constraint rsvps_attendance_check
  check (attendance in ('attending', 'not_attending'))
  not valid;

alter table public.rsvps enable row level security;

revoke all on public.rsvps from anon, authenticated;
grant insert (name, guests, attendance, message) on public.rsvps to anon, authenticated;
grant select (name, message, created_at) on public.rsvps to anon, authenticated;

drop policy if exists "Guests can submit RSVPs" on public.rsvps;
create policy "Guests can submit RSVPs"
  on public.rsvps for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 100
    and guests between 1 and 10
    and attendance in ('attending', 'not_attending')
    and char_length(message) <= 1000
  );

drop policy if exists "Anyone can read public wishes from RSVPs" on public.rsvps;
create policy "Anyone can read public wishes from RSVPs"
  on public.rsvps for select
  to anon, authenticated
  using (char_length(btrim(message)) > 0);
