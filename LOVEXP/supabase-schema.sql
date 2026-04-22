-- Love XP Supabase schema
-- Run this in the Supabase SQL editor.
-- For quickest testing, disable email confirmation in Auth > Providers > Email.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null,
  avatar_url text,
  theme text not null default 'fantasy' check (theme in ('fantasy','romantic','n64','retro')),
  points_balance integer not null default 0,
  lifetime_earned integer not null default 0,
  lifetime_spent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique,
  tone_mode text not null default 'balanced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'partner',
  created_at timestamptz not null default now(),
  unique(couple_id, user_id),
  unique(user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  points_value integer not null default 0,
  recurrence_type text not null default 'one_time',
  due_date timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  points_value integer not null default 0,
  bonus_points integer not null default 0,
  priority text not null default 'normal',
  due_at timestamptz,
  status text not null default 'awaiting_accept',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  point_cost integer not null default 0,
  cooldown_days integer not null default 0,
  approval_required boolean not null default true,
  is_reusable boolean not null default true,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.value_reviews (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null,
  item_title text not null,
  current_value integer not null,
  proposed_value integer not null,
  reason text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text,
  icon text default '✨',
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
drop trigger if exists couples_updated_at on public.couples;
create trigger couples_updated_at before update on public.couples for each row execute function public.handle_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.handle_updated_at();
drop trigger if exists quests_updated_at on public.quests;
create trigger quests_updated_at before update on public.quests for each row execute function public.handle_updated_at();
drop trigger if exists rewards_updated_at on public.rewards;
create trigger rewards_updated_at before update on public.rewards for each row execute function public.handle_updated_at();
drop trigger if exists value_reviews_updated_at on public.value_reviews;
create trigger value_reviews_updated_at before update on public.value_reviews for each row execute function public.handle_updated_at();

create or replace function public.user_is_in_couple(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couple_members cm
    where cm.couple_id = target_couple and cm.user_id = auth.uid()
  );
$$;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.tasks enable row level security;
alter table public.quests enable row level security;
alter table public.rewards enable row level security;
alter table public.value_reviews enable row level security;
alter table public.activity_events enable row level security;

-- Profiles
create policy "profiles_select_self_or_partner"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.couple_members me
    join public.couple_members them on me.couple_id = them.couple_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  )
);

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Couples
create policy "couples_select_if_member"
on public.couples for select
to authenticated
using (public.user_is_in_couple(id));

create policy "couples_insert_creator"
on public.couples for insert
to authenticated
with check (created_by_user_id = auth.uid());

create policy "couples_update_if_member"
on public.couples for update
to authenticated
using (public.user_is_in_couple(id))
with check (public.user_is_in_couple(id));

-- Couple members
create policy "couple_members_select_if_member"
on public.couple_members for select
to authenticated
using (public.user_is_in_couple(couple_id) or user_id = auth.uid());

create policy "couple_members_insert_self"
on public.couple_members for insert
to authenticated
with check (user_id = auth.uid());

-- Shared couple data
create policy "tasks_select_if_member"
on public.tasks for select to authenticated
using (public.user_is_in_couple(couple_id));
create policy "tasks_insert_if_member"
on public.tasks for insert to authenticated
with check (public.user_is_in_couple(couple_id));
create policy "tasks_update_if_member"
on public.tasks for update to authenticated
using (public.user_is_in_couple(couple_id))
with check (public.user_is_in_couple(couple_id));

create policy "quests_select_if_member"
on public.quests for select to authenticated
using (public.user_is_in_couple(couple_id));
create policy "quests_insert_if_member"
on public.quests for insert to authenticated
with check (public.user_is_in_couple(couple_id));
create policy "quests_update_if_member"
on public.quests for update to authenticated
using (public.user_is_in_couple(couple_id))
with check (public.user_is_in_couple(couple_id));

create policy "rewards_select_if_member"
on public.rewards for select to authenticated
using (public.user_is_in_couple(couple_id));
create policy "rewards_insert_if_member"
on public.rewards for insert to authenticated
with check (public.user_is_in_couple(couple_id));
create policy "rewards_update_if_member"
on public.rewards for update to authenticated
using (public.user_is_in_couple(couple_id))
with check (public.user_is_in_couple(couple_id));

create policy "reviews_select_if_member"
on public.value_reviews for select to authenticated
using (public.user_is_in_couple(couple_id));
create policy "reviews_insert_if_member"
on public.value_reviews for insert to authenticated
with check (public.user_is_in_couple(couple_id));
create policy "reviews_update_if_member"
on public.value_reviews for update to authenticated
using (public.user_is_in_couple(couple_id))
with check (public.user_is_in_couple(couple_id));

create policy "activity_select_if_member"
on public.activity_events for select to authenticated
using (public.user_is_in_couple(couple_id));
create policy "activity_insert_if_member"
on public.activity_events for insert to authenticated
with check (public.user_is_in_couple(couple_id));
