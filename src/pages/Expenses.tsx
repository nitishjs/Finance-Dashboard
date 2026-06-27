import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Select, Textarea, Modal, EmptyState } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { expenseService } from '../services'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, PAYMENT_METHODS, CATEGORY_COLORS } from '../utils'
import type { Expense } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.enum(PAYMENT_METHODS),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ExpensesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filterCat, setFilterCat] = useState('all')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { date: new Date().toISOString().slice(0, 10), payment_method: 'UPI', category: 'Food' }
  })

  const load = async () => {
    if (!user) return
    const { data } = await expenseService.list(user.id)
    setExpenses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const openAdd = () => { setEditing(null); reset({ date: new Date().toISOString().slice(0, 10), payment_method: 'UPI', category: 'Food' }); setModalOpen(true) }
  const openEdit = (exp: Expense) => {
    setEditing(exp)
    reset({ name: exp.name, amount: exp.amount, category: exp.category, date: exp.date, payment_method: exp.payment_method as FormData['payment_method'], notes: exp.notes ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    if (editing) {
      const { error } = await expenseService.update(editing.id, data)
      if (error) { toast({ type: 'error', title: 'Update failed' }); return }
      toast({ type: 'success', title: 'Expense updated' })
    } else {
      const { error } = await expenseService.create({ ...data, user_id: user.id })
      if (error) { toast({ type: 'error', title: 'Failed to add expense' }); return }
      toast({ type: 'success', title: 'Expense added' })
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await expenseService.delete(id)
    toast({ type: 'success', title: 'Expense deleted' })
    load()
  }

  const displayed = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat)
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyExp = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <AppShell
      title="Expenses"
      subtitle="Track every rupee spent"
      action={<Button variant="primary" size="sm" onClick={openAdd}>+ Add expense</Button>}
    >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">This Month</p><p className="text-xl font-medium text-[#C94F4F]">{formatCurrency(monthlyExp)}</p></Card>
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">All Time</p><p className="text-xl font-medium">{formatCurrency(totalExp)}</p></Card>
        <Card className="p-4"><p className="text-xs text-[#888580] mb-1">Entries</p><p className="text-xl font-medium">{expenses.length}</p></Card>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...EXPENSE_CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-colors ${filterCat === cat ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#151515] border border-white/7 text-[#888580] hover:text-[#F0EDE8]'}`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <Card className="p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-[#1C1C1C] rounded-xl"/>)}</div>
        ) : displayed.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses found" description="Add your first expense or change the filter." action={<Button variant="primary" onClick={openAdd}>Add expense</Button>} />
        ) : (
          <div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-3 py-2 text-[10px] text-[#555250] uppercase tracking-wide mb-1">
              <span>Name</span><span>Category</span><span>Date</span><span>Method</span><span className="text-right">Amount</span><span/>
            </div>
            {displayed.map(exp => (
              <div key={exp.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-3 py-3 rounded-xl hover:bg-[#1C1C1C] transition-colors group">
                <div>
                  <p className="text-sm font-medium">{exp.name}</p>
                  {exp.notes && <p className="text-[10px] text-[#555250]">{exp.notes}</p>}
                </div>
                <span className="text-xs px-2 py-1 rounded-lg w-fit" style={{ background: `${CATEGORY_COLORS[exp.category] ?? '#888'}20`, color: CATEGORY_COLORS[exp.category] ?? '#888' }}>
                  {exp.category}
                </span>
                <span className="text-xs text-[#888580]">{formatDate(exp.date)}</span>
                <span className="text-xs text-[#888580]">{exp.payment_method}</span>
                <span className="text-sm font-medium text-[#C94F4F] text-right">-{formatCurrency(Number(exp.amount))}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(exp)} className="text-xs text-[#888580] hover:text-[#F0EDE8] px-2 py-1 rounded-lg hover:bg-white/5">Edit</button>
                  <button onClick={() => handleDelete(exp.id)} className="text-xs text-[#C94F4F] hover:bg-[#C94F4F]/10 px-2 py-1 rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input label="Expense name" placeholder="e.g. Dinner, Uber, Airtel bill" error={errors.name?.message} {...register('name')} />
          <Input label="Amount (₹)" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))} error={errors.category?.message} {...register('category')} />
            <Select label="Payment method" options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))} error={errors.payment_method?.message} {...register('payment_method')} />
          </div>
          <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
          <Textarea label="Notes (optional)" placeholder="Any details…" rows={2} {...register('notes')} />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>{editing ? 'Update' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
