-- ============================================================================
-- 00003 — Roles, credits, profile fields. Idempotent (safe to re-run).
-- ============================================================================

-- Profile columns: role, credits, account info, active flag
alter table public.profiles
  add column if not exists role          text    not null default 'user',
  add column if not exists credits_total integer not null default 100,
  add column if not exists credits_used  integer not null default 0,
  add column if not exists is_active     boolean not null default true,
  add column if not exists phone         text,
  add column if not exists company       text;

-- role constraint (guard if not already present)
do $$ begin
  alter table public.profiles add constraint profiles_role_chk check (role in ('admin','user'));
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Grant admin + big credit pool to the founder account
-- ----------------------------------------------------------------------------
update public.profiles
set role = 'admin', credits_total = 100000000
where id in (
  select id from auth.users where lower(email) = 'phnguyenduckien@gmail.com'
);

-- ----------------------------------------------------------------------------
-- is_admin() — SECURITY DEFINER so RLS policies can call it without recursion
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Admin can read & update every profile (in addition to profiles_own).
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Update new-user trigger to also store email (for admin listing & display)
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'phnguyenduckien@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan) values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Backfill email for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
