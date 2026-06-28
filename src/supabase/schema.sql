-- =============================================================================
-- FINGold — Corrected Database Schema
-- Run the entire contents of this file in your Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / CREATE OR REPLACE.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- STEP 1: profiles table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade unique not null,
  full_name   text not null default '',
  avatar_url  text,
  currency    text not null default '₹',
  monthly_income numeric not null default 0,
  financial_goal text not null default '',
  country     text not null default 'India',
  timezone    text not null default 'Asia/Kolkata',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- STEP 2: RLS on profiles
--
-- ROOT CAUSE #1 — "FOR ALL USING (...)" also gates INSERT rows but
-- auth.uid() is NULL during the trigger call (no session yet).
-- Fix: use explicit per-operation policies so the service-role trigger
-- is never subject to RLS (service role bypasses RLS by default).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Drop old catch-all policy if it exists (safe re-run)
drop policy if exists "Users manage own profile" on public.profiles;

-- SELECT — only your own row
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = user_id);

-- INSERT — only authenticated users, only for themselves
-- (trigger runs as service role → bypasses RLS entirely, so this
--  only affects client-side inserts which we don't use)
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- UPDATE — only your own row
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE — only your own row
create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 3: auto-update updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- STEP 4: handle_new_user trigger
--
-- ROOT CAUSE #2 — The original function had no `set search_path = public`.
-- When SECURITY DEFINER runs without a fixed search_path, Postgres uses
-- the invoker's (auth schema) search_path and cannot find the `profiles`
-- table, causing the 500 error.
--
-- ROOT CAUSE #3 — `execute procedure` is deprecated in PostgreSQL 14+
-- (Supabase runs PG15). Use `execute function` instead.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public          -- ← Critical fix: pin the search path
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
exception
  -- Swallow duplicate-key errors so retries never fail signup
  when unique_violation then
    return new;
end;
$$;

-- Drop and recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();  -- ← "function" not "procedure"


-- ---------------------------------------------------------------------------
-- STEP 5: income
-- ---------------------------------------------------------------------------
create table if not exists public.income (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  source      text not null,
  amount      numeric not null check (amount > 0),
  category    text not null,
  date        date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.income enable row level security;
drop policy if exists "Users manage own income" on public.income;

create policy "income: select own"
  on public.income for select using (auth.uid() = user_id);
create policy "income: insert own"
  on public.income for insert with check (auth.uid() = user_id);
create policy "income: update own"
  on public.income for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income: delete own"
  on public.income for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 6: expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  amount         numeric not null check (amount > 0),
  category       text not null,
  date           date not null,
  payment_method text not null default 'UPI',
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.expenses enable row level security;
drop policy if exists "Users manage own expenses" on public.expenses;

create policy "expenses: select own"
  on public.expenses for select using (auth.uid() = user_id);
create policy "expenses: insert own"
  on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses: update own"
  on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses: delete own"
  on public.expenses for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 7: budgets
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  category    text not null,
  amount      numeric not null check (amount > 0),
  month       text not null,   -- YYYY-MM format
  created_at  timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table public.budgets enable row level security;
drop policy if exists "Users manage own budgets" on public.budgets;

create policy "budgets: select own"
  on public.budgets for select using (auth.uid() = user_id);
create policy "budgets: insert own"
  on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets: update own"
  on public.budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets: delete own"
  on public.budgets for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 8: financial_goals
-- ---------------------------------------------------------------------------
create table if not exists public.financial_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  target_amount  numeric not null check (target_amount > 0),
  current_saved  numeric not null default 0 check (current_saved >= 0),
  deadline       date not null,
  priority       text not null default 'Medium'
                   check (priority in ('Low', 'Medium', 'High')),
  created_at     timestamptz not null default now()
);

alter table public.financial_goals enable row level security;
drop policy if exists "Users manage own goals" on public.financial_goals;

create policy "goals: select own"
  on public.financial_goals for select using (auth.uid() = user_id);
create policy "goals: insert own"
  on public.financial_goals for insert with check (auth.uid() = user_id);
create policy "goals: update own"
  on public.financial_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals: delete own"
  on public.financial_goals for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 9: savings
-- ---------------------------------------------------------------------------
create table if not exists public.savings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  amount      numeric not null check (amount > 0),
  note        text,
  date        date not null,
  created_at  timestamptz not null default now()
);

alter table public.savings enable row level security;
drop policy if exists "Users manage own savings" on public.savings;

create policy "savings: select own"
  on public.savings for select using (auth.uid() = user_id);
create policy "savings: insert own"
  on public.savings for insert with check (auth.uid() = user_id);
create policy "savings: update own"
  on public.savings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings: delete own"
  on public.savings for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 10: notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  message     text not null,
  type        text not null default 'info'
                check (type in ('info', 'success', 'warning', 'danger')),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "Users manage own notifications" on public.notifications;

create policy "notifications: select own"
  on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: insert own"
  on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications: update own"
  on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications: delete own"
  on public.notifications for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- STEP 11: Performance indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_income_user_date       on public.income (user_id, date desc);
create index if not exists idx_expenses_user_date     on public.expenses (user_id, date desc);
create index if not exists idx_expenses_user_category on public.expenses (user_id, category);
create index if not exists idx_budgets_user_month     on public.budgets (user_id, month);
create index if not exists idx_goals_user_id          on public.financial_goals (user_id);
create index if not exists idx_savings_user_date      on public.savings (user_id, date desc);
create index if not exists idx_notifications_user     on public.notifications (user_id, created_at desc);


-- ---------------------------------------------------------------------------
-- Done. Verify with:
--   select * from public.profiles limit 5;
--   select trigger_name from information_schema.triggers
--     where event_object_table = 'users';
-- ---------------------------------------------------------------------------
