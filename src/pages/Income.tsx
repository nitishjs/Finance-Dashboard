import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Select, Textarea, Modal, EmptyState } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { incomeService } from '../services'
import { formatCurrency, formatDate, INCOME_CATEGORIES } from '../utils'
import type { Income } from '../types'

const schema = z.object({
  source:   z.string().min(1, 'Source is required'),
  amount:   z.coerce.number().positive('Amount must be positive'),
  category: z.enum(INCOME_CATEGORIES),
  date:     z.string().min(1, 'Date is required'),
  notes:    z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function IncomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [incomes, setIncomes]   = useState<Income[]>([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]   = useState<Income | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { date: new Date().toISOString().slice(0, 10) }
  })

  const load = async () => {
    if (!user) return
    const { data } = await incomeService.list(user.id)
    setIncomes(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [user])

  const openAdd = () => { setEditing(null); reset({ date: new Date().toISOString().slice(0, 10) }); setModalOpen(true) }
  const openEdit = (inc: Income) => {
    setEditing(inc)
    reset({ source: inc.source, amount: inc.amount, category: inc.category, date: inc.date, notes: inc.notes ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const { error } = editing
      ? await incomeService.update(editing.id, data)
      : await incomeService.create({ ...data, user_id: user.id })
    if (error) { toast({ type: 'error', title: editing ? 'Update failed' : 'Failed to add income' }); return }
    toast({ type: 'success', title: editing ? 'Income updated' : 'Income added' })
    setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income entry?')) return
    await incomeService.delete(id)
    toast({ type: 'success', title: 'Income deleted' }); load()
  }

  const totalIncome   = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const thisMonth     = new Date().toISOString().slice(0, 7)
  const monthlyIncome = incomes.filter(i => i.date.startsWith(thisMonth)).reduce((s, i) => s + Number(i.amount), 0)

  return (
    <AppShell
      title="Income"
      subtitle="Track all your income sources"
      action={<Button variant="primary" size="sm" onClick={openAdd}>+ Add</Button>}
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
        <Card className="p-3 md:p-4"><p className="text-[10px] md:text-xs text-[#888580] mb-1">This Month</p><p className="text-lg md:text-xl font-medium text-[#D4AF37]">{formatCurrency(monthlyIncome)}</p></Card>
        <Card className="p-3 md:p-4"><p className="text-[10px] md:text-xs text-[#888580] mb-1">All Time</p><p className="text-lg md:text-xl font-medium">{formatCurrency(totalIncome)}</p></Card>
        <Card className="p-3 md:p-4"><p className="text-[10px] md:text-xs text-[#888580] mb-1">Entries</p><p className="text-lg md:text-xl font-medium">{incomes.length}</p></Card>
      </div>

      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#1C1C1C] rounded-xl"/>)}</div>
        ) : incomes.length === 0 ? (
          <EmptyState icon="💰" title="No income recorded" description="Add your first income entry." action={<Button variant="primary" onClick={openAdd}>Add income</Button>} />
        ) : (
          <div className="space-y-2">
            {incomes.map(inc => (
              <div key={inc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1C1C1C] transition-colors group">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-[#3DAA7A]/10 flex items-center justify-center flex-shrink-0 text-[#3DAA7A] text-base">↑</div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inc.source}</p>
                  <p className="text-[10px] text-[#555250]">{inc.category} · {formatDate(inc.date)}</p>
                </div>
                {/* Amount */}
                <p className="text-sm font-medium text-[#3DAA7A] flex-shrink-0">+{formatCurrency(Number(inc.amount))}</p>
                {/* Actions — visible on hover desktop, always on mobile */}
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(inc)} className="text-xs text-[#888580] hover:text-[#F0EDE8] px-2 py-1 rounded-lg hover:bg-white/5">Edit</button>
                  <button onClick={() => handleDelete(inc.id)} className="text-xs text-[#C94F4F] hover:bg-[#C94F4F]/10 px-2 py-1 rounded-lg">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input label="Source" placeholder="e.g. Salary, Freelance project" error={errors.source?.message} {...register('source')} />
          <Input label="Amount (₹)" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />
          <Select label="Category" options={INCOME_CATEGORIES.map(c => ({ value: c, label: c }))} error={errors.category?.message} {...register('category')} />
          <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
          <Textarea label="Notes (optional)" placeholder="Any details…" rows={2} {...register('notes')} />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>{editing ? 'Update' : 'Add Income'}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
