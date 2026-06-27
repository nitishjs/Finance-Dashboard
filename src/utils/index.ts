// Simple className merger
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ').trim()
}

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${Math.abs(amount).toLocaleString('en-IN')}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

export function getHealthGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#3DAA7A' }
  if (score >= 65) return { label: 'Good', color: '#D4AF37' }
  if (score >= 50) return { label: 'Fair', color: '#E67E22' }
  return { label: 'Needs Work', color: '#C94F4F' }
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment',
  'Healthcare', 'Education', 'Investment', 'Rent', 'EMI', 'Other',
] as const

export const INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Investment', 'Rental', 'Bonus', 'Other',
] as const

export const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'Net Banking', 'Wallet'] as const

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#D4AF37',
  Travel: '#3A7BD5',
  Shopping: '#9B59B6',
  Bills: '#C94F4F',
  Entertainment: '#E67E22',
  Healthcare: '#3DAA7A',
  Education: '#1ABC9C',
  Investment: '#2ECC71',
  Rent: '#E74C3C',
  EMI: '#F39C12',
  Other: '#888580',
  Salary: '#3DAA7A',
  Freelancing: '#3A7BD5',
  Business: '#9B59B6',
  Rental: '#D4AF37',
  Bonus: '#E67E22',
}
