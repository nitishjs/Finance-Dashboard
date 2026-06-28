-- =============================================================================
-- FINGold — Fix "500: Database error saving new user"
-- 
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- and are getting a 500 error on signup.
-- This is safe to run even if tables already have data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FIX 1: Drop the broken trigger function and recreate it with
--   • set search_path = public  (the main crash cause)
--   • unique_violation exception handler (prevents retry loops)
--   • `execute function` instead of deprecated `execute procedure`
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- FIX 2: Replace the single "FOR ALL" policy on profiles with
-- per-operation policies that include WITH CHECK on INSERT/UPDATE.
--
-- "FOR ALL USING (...)" without WITH CHECK means INSERT is effectively
-- blocked for any row where auth.uid() != user_id — including the trigger.
-- The trigger runs as service role (bypasses RLS), but if for any reason
-- the policy is evaluated, it must be correct.
-- ---------------------------------------------------------------------------
drop policy if exists "Users manage own profile"  on public.profiles;
drop policy if exists "profiles: select own"       on public.profiles;
drop policy if exists "profiles: insert own"       on public.profiles;
drop policy if exists "profiles: update own"       on public.profiles;
drop policy if exists "profiles: delete own"       on public.profiles;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- FIX 3: Add the same per-operation policy pattern to all other tables
-- (replaces the "FOR ALL" shortcut which can silently block writes)
-- ---------------------------------------------------------------------------

-- income
drop policy if exists "Users manage own income" on public.income;
drop policy if exists "income: select own"      on public.income;
drop policy if exists "income: insert own"      on public.income;
drop policy if exists "income: update own"      on public.income;
drop policy if exists "income: delete own"      on public.income;

create policy "income: select own" on public.income for select using (auth.uid() = user_id);
create policy "income: insert own" on public.income for insert with check (auth.uid() = user_id);
create policy "income: update own" on public.income for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income: delete own" on public.income for delete using (auth.uid() = user_id);

-- expenses
drop policy if exists "Users manage own expenses" on public.expenses;
drop policy if exists "expenses: select own"      on public.expenses;
drop policy if exists "expenses: insert own"      on public.expenses;
drop policy if exists "expenses: update own"      on public.expenses;
drop policy if exists "expenses: delete own"      on public.expenses;

create policy "expenses: select own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses: insert own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses: update own" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses: delete own" on public.expenses for delete using (auth.uid() = user_id);

-- budgets
drop policy if exists "Users manage own budgets" on public.budgets;
drop policy if exists "budgets: select own"      on public.budgets;
drop policy if exists "budgets: insert own"      on public.budgets;
drop policy if exists "budgets: update own"      on public.budgets;
drop policy if exists "budgets: delete own"      on public.budgets;

create policy "budgets: select own" on public.budgets for select using (auth.uid() = user_id);
create policy "budgets: insert own" on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets: update own" on public.budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets: delete own" on public.budgets for delete using (auth.uid() = user_id);

-- financial_goals
drop policy if exists "Users manage own goals" on public.financial_goals;
drop policy if exists "goals: select own"      on public.financial_goals;
drop policy if exists "goals: insert own"      on public.financial_goals;
drop policy if exists "goals: update own"      on public.financial_goals;
drop policy if exists "goals: delete own"      on public.financial_goals;

create policy "goals: select own" on public.financial_goals for select using (auth.uid() = user_id);
create policy "goals: insert own" on public.financial_goals for insert with check (auth.uid() = user_id);
create policy "goals: update own" on public.financial_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals: delete own" on public.financial_goals for delete using (auth.uid() = user_id);

-- savings
drop policy if exists "Users manage own savings" on public.savings;
drop policy if exists "savings: select own"      on public.savings;
drop policy if exists "savings: insert own"      on public.savings;
drop policy if exists "savings: update own"      on public.savings;
drop policy if exists "savings: delete own"      on public.savings;

create policy "savings: select own" on public.savings for select using (auth.uid() = user_id);
create policy "savings: insert own" on public.savings for insert with check (auth.uid() = user_id);
create policy "savings: update own" on public.savings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings: delete own" on public.savings for delete using (auth.uid() = user_id);

-- notifications
drop policy if exists "Users manage own notifications" on public.notifications;
drop policy if exists "notifications: select own"      on public.notifications;
drop policy if exists "notifications: insert own"      on public.notifications;
drop policy if exists "notifications: update own"      on public.notifications;
drop policy if exists "notifications: delete own"      on public.notifications;

create policy "notifications: select own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: insert own" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications: update own" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications: delete own" on public.notifications for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- VERIFY — run this after applying the fix to confirm trigger is alive:
-- ---------------------------------------------------------------------------
-- select
--   trigger_name,
--   event_manipulation,
--   action_statement
-- from information_schema.triggers
-- where event_object_schema = 'auth'
--   and event_object_table  = 'users';
--
-- Expected row:
--   on_auth_user_created | INSERT | EXECUTE FUNCTION public.handle_new_user()
-- ---------------------------------------------------------------------------
