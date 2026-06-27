-- Run this in your Supabase SQL Editor

-- Profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text not null default '',
  avatar_url text,
  currency text not null default '₹',
  monthly_income numeric not null default 0,
  financial_goal text not null default '',
  country text not null default 'India',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles for all using (auth.uid() = user_id);

-- Income
create table income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);
alter table income enable row level security;
create policy "Users manage own income" on income for all using (auth.uid() = user_id);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  payment_method text not null default 'UPI',
  notes text,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);

-- Budgets
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  amount numeric not null,
  month text not null, -- YYYY-MM
  created_at timestamptz default now(),
  unique(user_id, category, month)
);
alter table budgets enable row level security;
create policy "Users manage own budgets" on budgets for all using (auth.uid() = user_id);

-- Financial Goals
create table financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_saved numeric not null default 0,
  deadline date not null,
  priority text not null default 'Medium',
  created_at timestamptz default now()
);
alter table financial_goals enable row level security;
create policy "Users manage own goals" on financial_goals for all using (auth.uid() = user_id);

-- Savings
create table savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null,
  note text,
  date date not null,
  created_at timestamptz default now()
);
alter table savings enable row level security;
create policy "Users manage own savings" on savings for all using (auth.uid() = user_id);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
