import { supabase } from '../supabase/client'
import type { Income, Expense, Budget, FinancialGoal, Savings, Profile } from '../types'

// ─── Profile ───────────────────────────────────────────────────────────────
export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    return data
  },
  async upsert(profile: Partial<Profile> & { user_id: string }) {
    return supabase.from('profiles').upsert({ ...profile, updated_at: new Date().toISOString() }).select().single()
  }
}

// ─── Income ────────────────────────────────────────────────────────────────
export const incomeService = {
  async list(userId: string) {
    return supabase.from('income').select('*').eq('user_id', userId).order('date', { ascending: false })
  },
  async listByMonth(userId: string, month: string) {
    return supabase.from('income').select('*').eq('user_id', userId)
      .gte('date', `${month}-01`).lt('date', nextMonth(month))
      .order('date', { ascending: false })
  },
  async create(data: Omit<Income, 'id' | 'created_at'>) {
    return supabase.from('income').insert(data).select().single()
  },
  async update(id: string, data: Partial<Income>) {
    return supabase.from('income').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('income').delete().eq('id', id)
  }
}

// ─── Expenses ──────────────────────────────────────────────────────────────
export const expenseService = {
  async list(userId: string) {
    return supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false })
  },
  async listByMonth(userId: string, month: string) {
    return supabase.from('expenses').select('*').eq('user_id', userId)
      .gte('date', `${month}-01`).lt('date', nextMonth(month))
      .order('date', { ascending: false })
  },
  async create(data: Omit<Expense, 'id' | 'created_at'>) {
    return supabase.from('expenses').insert(data).select().single()
  },
  async update(id: string, data: Partial<Expense>) {
    return supabase.from('expenses').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('expenses').delete().eq('id', id)
  }
}

// ─── Budgets ───────────────────────────────────────────────────────────────
export const budgetService = {
  async listByMonth(userId: string, month: string) {
    return supabase.from('budgets').select('*').eq('user_id', userId).eq('month', month)
  },
  async upsert(data: Omit<Budget, 'id' | 'created_at'>) {
    return supabase.from('budgets').upsert(data, { onConflict: 'user_id,category,month' }).select().single()
  },
  async delete(id: string) {
    return supabase.from('budgets').delete().eq('id', id)
  }
}

// ─── Goals ─────────────────────────────────────────────────────────────────
export const goalService = {
  async list(userId: string) {
    return supabase.from('financial_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  },
  async create(data: Omit<FinancialGoal, 'id' | 'created_at'>) {
    return supabase.from('financial_goals').insert(data).select().single()
  },
  async update(id: string, data: Partial<FinancialGoal>) {
    return supabase.from('financial_goals').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('financial_goals').delete().eq('id', id)
  }
}

// ─── Savings ───────────────────────────────────────────────────────────────
export const savingsService = {
  async list(userId: string) {
    return supabase.from('savings').select('*').eq('user_id', userId).order('date', { ascending: false })
  },
  async create(data: Omit<Savings, 'id' | 'created_at'>) {
    return supabase.from('savings').insert(data).select().single()
  },
  async delete(id: string) {
    return supabase.from('savings').delete().eq('id', id)
  },
  async totalByUserId(userId: string) {
    const { data } = await supabase.from('savings').select('amount').eq('user_id', userId)
    return (data ?? []).reduce((s, r) => s + Number(r.amount), 0)
  }
}

// ─── Notifications ─────────────────────────────────────────────────────────
export const notificationService = {
  async list(userId: string) {
    return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  },
  async markRead(id: string) {
    return supabase.from('notifications').update({ read: true }).eq('id', id)
  },
  async markAllRead(userId: string) {
    return supabase.from('notifications').update({ read: true }).eq('user_id', userId)
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (m === 12) return `${y + 1}-01`
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

export { nextMonth }
