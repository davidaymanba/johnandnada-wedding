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

-- Blessings are private to the couple. RLS is on with NO public policies, so the public (anon) key
-- can neither read nor write. The Next.js route handler uses the service-role key server-side;
-- the couple reads messages at /blessings?key=GUESTBOOK_ADMIN_KEY (or in the Supabase table editor).
drop policy if exists "public read approved" on public.guestbook;

-- To hide a message:  update public.guestbook set approved = false where id = '...';
