import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: { Row: import('../types').Profile; Insert: Omit<import('../types').Profile, 'created_at' | 'updated_at'>; Update: Partial<import('../types').Profile> }
      income: { Row: import('../types').Income; Insert: Omit<import('../types').Income, 'id' | 'created_at'>; Update: Partial<import('../types').Income> }
      expenses: { Row: import('../types').Expense; Insert: Omit<import('../types').Expense, 'id' | 'created_at'>; Update: Partial<import('../types').Expense> }
      budgets: { Row: import('../types').Budget; Insert: Omit<import('../types').Budget, 'id' | 'created_at'>; Update: Partial<import('../types').Budget> }
      financial_goals: { Row: import('../types').FinancialGoal; Insert: Omit<import('../types').FinancialGoal, 'id' | 'created_at'>; Update: Partial<import('../types').FinancialGoal> }
      savings: { Row: import('../types').Savings; Insert: Omit<import('../types').Savings, 'id' | 'created_at'>; Update: Partial<import('../types').Savings> }
      notifications: { Row: import('../types').Notification; Insert: Omit<import('../types').Notification, 'id' | 'created_at'>; Update: Partial<import('../types').Notification> }
    }
  }
}
