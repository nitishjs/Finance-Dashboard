export interface Profile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  currency: string
  monthly_income: number
  financial_goal: string
  country: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  user_id: string
  source: string
  amount: number
  category: IncomeCategory
  date: string
  notes?: string
  created_at: string
}

export type IncomeCategory =
  | 'Salary'
  | 'Freelancing'
  | 'Business'
  | 'Investment'
  | 'Rental'
  | 'Bonus'
  | 'Other'

export interface Expense {
  id: string
  user_id: string
  name: string
  amount: number
  category: ExpenseCategory
  date: string
  payment_method: PaymentMethod
  notes?: string
  created_at: string
}

export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Investment'
  | 'Rent'
  | 'EMI'
  | 'Other'

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Net Banking' | 'Wallet'

export interface Budget {
  id: string
  user_id: string
  category: ExpenseCategory
  amount: number
  month: string // YYYY-MM
  created_at: string
}

export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_saved: number
  deadline: string
  priority: 'Low' | 'Medium' | 'High'
  created_at: string
}

export interface Savings {
  id: string
  user_id: string
  amount: number
  note?: string
  date: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  name: string
  amount: number
  category: string
  date: string
  payment_method?: string
  notes?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'warning' | 'success' | 'info' | 'danger'
  read: boolean
  created_at: string
}

export interface MonthlyStats {
  month: string
  income: number
  expenses: number
  savings: number
  net: number
}

export interface DashboardSummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  healthScore: number
  budgetUsed: number
  budgetTotal: number
}
