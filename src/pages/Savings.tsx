import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Textarea, Modal, EmptyState } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { savingsService } from '../services'
import { formatCurrency, formatDate } from '../utils'
import type { Savings } from '../types'

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function SavingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savings, setSavings] = useState<Savings[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const load = async () => {
    if (!user) return
    const { data } = await savingsService.list(user.id)
    setSavings(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const { error } = await savingsService.create({ ...data, user_id: user.id })
    if (error) { toast({ type: 'error', title: 'Failed to record savings' }); return }
    toast({ type: 'success', title: 'Savings recorded!' })
    setModalOpen(false)
    reset({ date: new Date().toISOString().slice(0, 10) })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this savings entry?')) return
    await savingsService.delete(id)
    toast({ type: 'success', title: 'Entry deleted' })
    load()
  }

  const totalSaved = savings.reduce((s, r) => s + Number(r.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthSaved = savings.filter(s => s.date.startsWith(thisMonth)).reduce((s, r) => s + Number(r.amount), 0)

  // Build cumulative chart data
  const sorted = [...savings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let running = 0
  const chartData = sorted.map(s => {
    running += Number(s.amount)
    return { date: s.date.slice(0, 7), amount: running }
  })
  // Deduplicate months (keep last cumulative per month)
  const monthlyChart = Object.values(
    chartData.reduce<Record<string, { date: string; amount: number }>>((acc, d) => {
      acc[d.date] = d
      return acc
    }, {})
  ).slice(-12)

  return (
    <AppShell
      title="Savings"
      subtitle="Track every rupee you put aside"
      action={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>+ Record savings</Button>}
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Saved (All Time)</p>
          <p className="text-2xl font-medium text-[#D4AF37]">{formatCurrency(totalSaved)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Saved This Month</p>
          <p className="text-2xl font-medium">{formatCurrency(monthSaved)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Entries</p>
          <p className="text-2xl font-medium">{savings.length}</p>
        </Card>
      </div>

      {/* Growth chart */}
      {monthlyChart.length > 1 && (
        <Card className="p-5 mb-6">
          <p className="text-sm font-medium mb-1">Savings Growth</p>
          <p className="text-xs text-[#888580] mb-4">Cumulative savings over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `₹${Math.round(v / 1000)}K`} />
              <Tooltip
                contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [formatCurrency(v as number), 'Cumulative']}
              />
              <Area dataKey="amount" stroke="#D4AF37" strokeWidth={2} fill="url(#savGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Entries list */}
      <Card className="p-5">
        <p className="text-sm font-medium mb-4">Savings History</p>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[#1C1C1C] rounded-xl" />)}
          </div>
        ) : savings.length === 0 ? (
          <EmptyState
            icon="🐷"
            title="No savings recorded"
            description="Start recording your savings to watch your wealth grow."
            action={<Button variant="primary" onClick={() => setModalOpen(true)}>Record first savings</Button>}
          />
        ) : (
          <div>
            {savings.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1C1C1C] transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-sm text-[#D4AF37] flex-shrink-0">
                  🐷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F0EDE8] truncate">{s.note ?? `Savings entry #${savings.length - idx}`}</p>
                  <p className="text-[10px] text-[#555250]">{formatDate(s.date)}</p>
                </div>
                <span className="text-sm font-medium text-[#D4AF37] flex-shrink-0">+{formatCurrency(Number(s.amount))}</span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-[#C94F4F] hover:bg-[#C94F4F]/10 px-2 py-1 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Savings">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input
            label="Amount saved (₹)"
            type="number"
            step="100"
            placeholder="5000"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Textarea
            label="Note (optional)"
            placeholder="e.g. Monthly SIP, bonus savings…"
            rows={2}
            {...register('note')}
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
