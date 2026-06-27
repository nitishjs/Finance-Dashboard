import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Select, Modal, Progress, EmptyState, Badge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { goalService } from '../services'
import { formatCurrency, formatDate } from '../utils'
import type { FinancialGoal } from '../types'

const PRIORITIES = ['Low', 'Medium', 'High'] as const

const schema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  target_amount: z.coerce.number().positive('Target must be positive'),
  current_saved: z.coerce.number().min(0, 'Cannot be negative'),
  deadline: z.string().min(1, 'Deadline is required'),
  priority: z.enum(PRIORITIES),
})
type FormData = z.infer<typeof schema>

const PRIORITY_COLORS: Record<string, string> = {
  High: '#C94F4F',
  Medium: '#D4AF37',
  Low: '#3DAA7A',
}

const GOAL_ICONS: Record<string, string> = {
  emergency: '🛡️', laptop: '💻', car: '🚗', house: '🏠',
  vacation: '✈️', wedding: '💍', education: '🎓', default: '🎯',
}

function getGoalIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const key of Object.keys(GOAL_ICONS)) {
    if (lower.includes(key)) return GOAL_ICONS[key]
  }
  return GOAL_ICONS.default
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [addSavingModal, setAddSavingModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [editing, setEditing] = useState<FinancialGoal | null>(null)
  const [addAmount, setAddAmount] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { priority: 'Medium', current_saved: 0 },
  })

  const load = async () => {
    if (!user) return
    const { data } = await goalService.list(user.id)
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const openAdd = () => {
    setEditing(null)
    reset({ priority: 'Medium', current_saved: 0 })
    setModalOpen(true)
  }

  const openEdit = (g: FinancialGoal) => {
    setEditing(g)
    reset({
      name: g.name,
      target_amount: g.target_amount,
      current_saved: g.current_saved,
      deadline: g.deadline,
      priority: g.priority,
    })
    setModalOpen(true)
  }

  const openAddSaving = (g: FinancialGoal) => {
    setSelectedGoal(g)
    setAddAmount('')
    setAddSavingModal(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const payload = { ...data, user_id: user.id }
    const { error } = editing
      ? await goalService.update(editing.id, data)
      : await goalService.create(payload)
    if (error) { toast({ type: 'error', title: 'Failed to save goal', description: error.message }); return }
    toast({ type: 'success', title: editing ? 'Goal updated' : 'Goal created' })
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    const { error } = await goalService.delete(id)
    if (error) { toast({ type: 'error', title: 'Failed to delete' }); return }
    toast({ type: 'success', title: 'Goal deleted' })
    load()
  }

  const handleAddSaving = async () => {
    if (!selectedGoal || !addAmount) return
    const extra = parseFloat(addAmount)
    if (isNaN(extra) || extra <= 0) { toast({ type: 'error', title: 'Enter a valid amount' }); return }
    const newSaved = Number(selectedGoal.current_saved) + extra
    const { error } = await goalService.update(selectedGoal.id, { current_saved: newSaved })
    if (error) { toast({ type: 'error', title: 'Update failed' }); return }
    if (newSaved >= Number(selectedGoal.target_amount)) {
      toast({ type: 'success', title: '🎉 Goal achieved!', description: `You hit your target for "${selectedGoal.name}"!` })
    } else {
      toast({ type: 'success', title: 'Savings added', description: `+${formatCurrency(extra)} added to ${selectedGoal.name}` })
    }
    setAddSavingModal(false)
    load()
  }

  const totalTargeted = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_saved), 0)
  const achieved = goals.filter(g => Number(g.current_saved) >= Number(g.target_amount)).length

  return (
    <AppShell
      title="Financial Goals"
      subtitle={`${goals.length} goals · ${achieved} achieved`}
      action={<Button variant="primary" size="sm" onClick={openAdd}>+ New goal</Button>}
    >
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Targeted</p>
          <p className="text-xl font-medium">{formatCurrency(totalTargeted)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Saved</p>
          <p className="text-xl font-medium text-[#D4AF37]">{formatCurrency(totalSaved)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Still Needed</p>
          <p className="text-xl font-medium text-[#888580]">{formatCurrency(Math.max(0, totalTargeted - totalSaved))}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Goals Achieved</p>
          <p className="text-xl font-medium text-[#3DAA7A]">{achieved} / {goals.length}</p>
        </Card>
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-[#151515] rounded-2xl border border-white/7 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon="🎯"
            title="No goals yet"
            description="Set a financial goal — emergency fund, laptop, vacation — and track your progress."
            action={<Button variant="primary" onClick={openAdd}>Create first goal</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = Math.min(100, Math.round((Number(g.current_saved) / Number(g.target_amount)) * 100))
            const done = pct >= 100
            const days = daysUntil(g.deadline)
            const remaining = Number(g.target_amount) - Number(g.current_saved)

            return (
              <Card
                key={g.id}
                className={`p-5 transition-all duration-200 ${done ? 'border-[#3DAA7A]/30' : 'card-hover'}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getGoalIcon(g.name)}</div>
                    <div>
                      <p className="text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-[#888580]">Due {formatDate(g.deadline)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        color: PRIORITY_COLORS[g.priority],
                        background: `${PRIORITY_COLORS[g.priority]}15`,
                        borderColor: `${PRIORITY_COLORS[g.priority]}30`,
                      }}
                    >
                      {g.priority}
                    </span>
                    {done && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3DAA7A]/15 text-[#3DAA7A] border border-[#3DAA7A]/30">✓ Done</span>}
                  </div>
                </div>

                {/* Progress ring + bar */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Mini ring */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#1C1C1C" strokeWidth="6" />
                      <circle
                        cx="28" cy="28" r="22" fill="none"
                        stroke={done ? '#3DAA7A' : '#D4AF37'} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-medium" style={{ color: done ? '#3DAA7A' : '#D4AF37' }}>{pct}%</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#888580]">Saved</span>
                      <span className="font-medium">{formatCurrency(Number(g.current_saved))}</span>
                    </div>
                    <Progress value={Number(g.current_saved)} max={Number(g.target_amount)} color={done ? '#3DAA7A' : '#D4AF37'} />
                    <div className="flex justify-between text-xs">
                      <span className="text-[#555250]">{done ? 'Goal reached! 🎉' : `${formatCurrency(remaining)} more needed`}</span>
                      <span className="text-[#555250]">Target: {formatCurrency(Number(g.target_amount))}</span>
                    </div>
                  </div>
                </div>

                {/* Deadline info */}
                <div className="flex items-center justify-between py-3 border-t border-white/7">
                  <p className="text-xs" style={{ color: days < 0 ? '#C94F4F' : days < 30 ? '#D4AF37' : '#888580' }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days} days left`}
                  </p>
                  <div className="flex gap-1">
                    {!done && (
                      <button
                        onClick={() => openAddSaving(g)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 transition-colors"
                      >
                        + Add savings
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(g)}
                      className="text-xs px-2 py-1.5 rounded-lg text-[#888580] hover:text-[#F0EDE8] hover:bg-white/5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-xs px-2 py-1.5 rounded-lg text-[#C94F4F] hover:bg-[#C94F4F]/10 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'New Financial Goal'}>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input
            label="Goal name"
            placeholder="e.g. Emergency Fund, Buy Laptop, Vacation"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target amount (₹)"
              type="number"
              step="500"
              placeholder="100000"
              error={errors.target_amount?.message}
              {...register('target_amount')}
            />
            <Input
              label="Already saved (₹)"
              type="number"
              step="100"
              placeholder="0"
              error={errors.current_saved?.message}
              {...register('current_saved')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Deadline"
              type="date"
              error={errors.deadline?.message}
              {...register('deadline')}
            />
            <Select
              label="Priority"
              options={PRIORITIES.map(p => ({ value: p, label: p }))}
              error={errors.priority?.message}
              {...register('priority')}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>
              {editing ? 'Update goal' : 'Create goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Savings to Goal Modal */}
      <Modal open={addSavingModal} onClose={() => setAddSavingModal(false)} title={`Add to: ${selectedGoal?.name}`}>
        {selectedGoal && (
          <div className="space-y-4">
            <div className="bg-[#1C1C1C] rounded-xl p-4">
              <div className="flex justify-between text-xs text-[#888580] mb-2">
                <span>Current saved</span>
                <span>Target</span>
              </div>
              <div className="flex justify-between text-sm font-medium mb-3">
                <span className="text-[#D4AF37]">{formatCurrency(Number(selectedGoal.current_saved))}</span>
                <span>{formatCurrency(Number(selectedGoal.target_amount))}</span>
              </div>
              <Progress value={Number(selectedGoal.current_saved)} max={Number(selectedGoal.target_amount)} />
            </div>
            <Input
              label="Amount to add (₹)"
              type="number"
              step="100"
              placeholder="5000"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
            />
            {addAmount && Number(addAmount) > 0 && (
              <div className="text-xs text-[#888580] bg-[#1C1C1C] rounded-xl p-3">
                After adding: <strong className="text-[#D4AF37]">{formatCurrency(Number(selectedGoal.current_saved) + Number(addAmount))}</strong>
                {' '}({Math.min(100, Math.round(((Number(selectedGoal.current_saved) + Number(addAmount)) / Number(selectedGoal.target_amount)) * 100))}%)
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setAddSavingModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={handleAddSaving}>Add savings</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
