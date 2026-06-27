import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Select, Modal, Progress, Badge, EmptyState } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { budgetService, expenseService } from '../services'
import { formatCurrency, currentMonth, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../utils'
import type { Budget, Expense } from '../types'

const schema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive('Budget must be positive'),
})
type FormData = z.infer<typeof schema>

export default function BudgetPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [month, setMonth] = useState(currentMonth())

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any
  })

  const load = async () => {
    if (!user) return
    const [bud, exp] = await Promise.all([budgetService.listByMonth(user.id, month), expenseService.listByMonth(user.id, month)])
    setBudgets(bud.data ?? [])
    setExpenses(exp.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user, month])

  const openAdd = () => { setEditing(null); reset(); setModalOpen(true) }
  const openEdit = (b: Budget) => { setEditing(b); reset({ category: b.category, amount: b.amount }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const { error } = await budgetService.upsert({ ...data, user_id: user.id, month })
    if (error) { toast({ type: 'error', title: 'Failed to save budget' }); return }
    toast({ type: 'success', title: editing ? 'Budget updated' : 'Budget created' })
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this budget?')) return
    await budgetService.delete(id)
    toast({ type: 'success', title: 'Budget removed' })
    load()
  }

  const enriched = budgets.map(b => {
    const spent = expenses.filter(e => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0)
    const pct = Math.round((spent / Number(b.amount)) * 100)
    const remaining = Number(b.amount) - spent
    const over = spent > Number(b.amount)
    return { ...b, spent, pct, remaining, over }
  })

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = enriched.reduce((s, b) => s + b.spent, 0)
  const overCount = enriched.filter(b => b.over).length

  return (
    <AppShell
      title="Budget Planner"
      subtitle={`Managing budgets for ${month}`}
      action={
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDE8] focus:outline-none"/>
          <Button variant="primary" size="sm" onClick={openAdd}>+ Add budget</Button>
        </div>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">Total Budget</p><p className="text-xl font-medium">{formatCurrency(totalBudget)}</p></Card>
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">Total Spent</p><p className={`text-xl font-medium ${totalSpent > totalBudget ? 'text-[#C94F4F]' : 'text-[#F0EDE8]'}`}>{formatCurrency(totalSpent)}</p></Card>
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">Remaining</p><p className={`text-xl font-medium ${totalBudget - totalSpent >= 0 ? 'text-[#3DAA7A]' : 'text-[#C94F4F]'}`}>{formatCurrency(totalBudget - totalSpent)}</p></Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Over budget</p>
          <p className={`text-xl font-medium ${overCount > 0 ? 'text-[#C94F4F]' : 'text-[#3DAA7A]'}`}>{overCount} {overCount === 1 ? 'category' : 'categories'}</p>
        </Card>
      </div>

      {/* Overall progress */}
      {totalBudget > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-medium">Overall Budget Usage</span>
            <span className="text-[#888580]">{Math.round((totalSpent / totalBudget) * 100)}%</span>
          </div>
          <Progress value={totalSpent} max={totalBudget} color={totalSpent > totalBudget ? '#C94F4F' : '#D4AF37'} className="h-2" />
          <div className="flex justify-between text-xs text-[#888580] mt-2">
            <span>Spent: {formatCurrency(totalSpent)}</span>
            <span>Budget: {formatCurrency(totalBudget)}</span>
          </div>
        </Card>
      )}

      {/* Budget categories */}
      {loading ? (
        <div className="space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#151515] rounded-2xl border border-white/7"/>)}</div>
      ) : enriched.length === 0 ? (
        <Card className="p-5">
          <EmptyState icon="💼" title="No budgets set" description={`Set category budgets for ${month} to track your spending.`} action={<Button variant="primary" onClick={openAdd}>Create first budget</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {enriched.map(b => (
            <Card key={b.id} className={`p-5 ${b.over ? 'border-[#C94F4F]/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[b.category] ?? '#888' }} />
                  <span className="text-sm font-medium">{b.category}</span>
                  {b.over && <span className="text-xs bg-[#C94F4F]/10 text-[#C94F4F] border border-[#C94F4F]/20 px-2 py-0.5 rounded-full">Over budget ⚠</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="text-xs text-[#888580] hover:text-[#F0EDE8] px-2 py-1 rounded-lg hover:bg-white/5">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-[#C94F4F] hover:bg-[#C94F4F]/10 px-2 py-1 rounded-lg">×</button>
                </div>
              </div>
              <Progress value={b.spent} max={Number(b.amount)} color={b.over ? '#C94F4F' : CATEGORY_COLORS[b.category] ?? '#D4AF37'} className="mb-3" />
              <div className="flex justify-between text-xs text-[#888580]">
                <span>Spent: <strong className={`${b.over ? 'text-[#C94F4F]' : 'text-[#F0EDE8]'}`}>{formatCurrency(b.spent)}</strong></span>
                <span>Budget: <strong className="text-[#F0EDE8]">{formatCurrency(Number(b.amount))}</strong></span>
              </div>
              <p className="text-xs mt-1" style={{ color: b.over ? '#C94F4F' : '#3DAA7A' }}>
                {b.over ? `Over by ${formatCurrency(Math.abs(b.remaining))}` : `${formatCurrency(b.remaining)} remaining`}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Budget' : 'Add Budget'}>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Select label="Category" options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))} error={errors.category?.message} {...register('category')} />
          <Input label={`Budget amount for ${month} (₹)`} type="number" step="100" placeholder="10000" error={errors.amount?.message} {...register('amount')} />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>{editing ? 'Update' : 'Set Budget'}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
