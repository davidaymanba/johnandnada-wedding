-- Nada & John — guestbook
create extension if not exists pgcrypto;

create table if not exists public.guestbook (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  message     text not null check (char_length(message) between 1 and 500),
  relation    text check (relation in ('bride', 'groom', 'family')),
  created_at  timestamptz not null default now(),
  approved    boolean not null default true,
  ip_hash     text
);

create index if not exists guestbook_created_at_idx on public.guestbook (created_at desc);
create index if not exists guestbook_ip_recent_idx on public.guestbook (ip_hash, created_at desc);

alter table public.guestbook enable row level security;

-- Anyone may read approved messages. Nobody may insert/update/delete with the public key:
-- inserts go through the Next.js route handler, which uses the service-role key.
drop policy if exists "public read approved" on public.guestbook;
create policy "public read approved" on public.guestbook
  for select using (approved = true);

-- To hide a message:  update public.guestbook set approved = false where id = '...';
