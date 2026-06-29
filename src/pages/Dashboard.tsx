import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { AppShell } from '../components/layout/AppShell'
import { Card, KpiCard, Progress } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { incomeService, expenseService, goalService, budgetService } from '../services'
import { formatCurrency, currentMonth, getHealthGrade, CATEGORY_COLORS } from '../utils'
import type { Income, Expense, FinancialGoal, Budget } from '../types'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ym(date: string) { return date.slice(0, 7) }           // "2026-04-15" → "2026-04"
function label(m: string) {                                       // "2026-04" → "Apr 2026"
  const [y, mo] = m.split('-')
  return `${MONTH_LABELS[parseInt(mo, 10) - 1]} ${y}`
}
function last6(): string[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

export default function DashboardPage() {
  const { user } = useAuth()

  // Load everything in ONE shot — no two-phase race condition
  const [allIncomes, setAllIncomes] = useState<Income[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      incomeService.list(user.id),        // ALL income — filter client-side
      expenseService.list(user.id),       // ALL expenses — filter client-side
      goalService.list(user.id),
      budgetService.listByMonth(user.id, selectedMonth),
    ]).then(([inc, exp, gls, bud]) => {
      const incData  = inc.data  ?? []
      const expData  = exp.data  ?? []

      setAllIncomes(incData)
      setAllExpenses(expData)
      setGoals((gls.data ?? []).slice(0, 3))
      setBudgets(bud.data ?? [])

      // Auto-select latest month that has data (only on first load)
      if (selectedMonth === currentMonth()) {
        const months = new Set([
          ...incData.map(i => ym(i.date)),
          ...expData.map(e => ym(e.date)),
        ])
        const hasCurrentMonth = months.has(currentMonth())
        if (!hasCurrentMonth && months.size > 0) {
          const latest = [...months].sort((a, b) => b.localeCompare(a))[0]
          setSelectedMonth(latest)
        }
      }

      setLoading(false)
    })
  }, [user]) // Only re-fetch when user changes — month changes filter client-side

  // Reload budgets when month changes (budgets are month-specific in DB)
  useEffect(() => {
    if (!user || loading) return
    budgetService.listByMonth(user.id, selectedMonth).then(b => {
      setBudgets(b.data ?? [])
    })
  }, [selectedMonth])

  // ── Derived: filter all data by selected month CLIENT-SIDE ────────────────
  const incomes  = useMemo(() => allIncomes.filter(i => ym(i.date) === selectedMonth),  [allIncomes,  selectedMonth])
  const expenses = useMemo(() => allExpenses.filter(e => ym(e.date) === selectedMonth), [allExpenses, selectedMonth])

  const totalIncome   = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const netSavings    = totalIncome - totalExpenses
  const savingsRate   = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0
  const budgetTotal   = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const healthScore   = Math.min(100, Math.round(
    savingsRate * 1.4 +
    (budgetTotal > 0 ? Math.max(0, ((budgetTotal - totalExpenses) / budgetTotal) * 30) : 0)
  ))
  const health = getHealthGrade(healthScore)

  // Expense category breakdown
  const categoryMap: Record<string, number> = {}
  expenses.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount) })
  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 5)

  // Recent transactions for selected month
  const recentTx = [
    ...incomes.map(i  => ({ ...i, type: 'income'  as const, name: i.source })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  // Budget status
  const budgetStatus = budgets.map(b => {
    const spent = expenses.filter(e => e.category === b.category).reduce((s, e) => s + Number(e.amount), 0)
    return { ...b, spent, over: spent > Number(b.amount) }
  })

  // 6-month trend (always from all data regardless of selected month)
  const trendData = last6().map(m => {
    const inc = allIncomes.filter(i => ym(i.date) === m).reduce((s, i) => s + Number(i.amount), 0)
    const exp = allExpenses.filter(e => ym(e.date) === m).reduce((s, e) => s + Number(e.amount), 0)
    return { month: MONTH_LABELS[parseInt(m.split('-')[1], 10) - 1], income: inc, expenses: exp }
  })

  // Month picker options — all months that have any data + last 6 months
  const monthOptions = useMemo(() => {
    const withData = new Set([
      ...allIncomes.map(i => ym(i.date)),
      ...allExpenses.map(e => ym(e.date)),
      ...last6(),
    ])
    return [...withData].sort((a, b) => b.localeCompare(a)).slice(0, 24)
  }, [allIncomes, allExpenses])

  const hasData       = totalIncome > 0 || totalExpenses > 0
  const isCurrent     = selectedMonth === currentMonth()

  if (loading) return <AppShell title="Dashboard"><Skeleton /></AppShell>

  return (
    <AppShell
      title="Dashboard"
      subtitle={label(selectedMonth)}
      action={
        <div className="flex items-center gap-2">
          {/* Month picker */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDE8] focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer"
          >
            {monthOptions.map(m => {
              const hasAny = allIncomes.some(i => ym(i.date) === m) || allExpenses.some(e => ym(e.date) === m)
              return <option key={m} value={m}>{label(m)}{hasAny ? ' ●' : ''}</option>
            })}
          </select>
          <Link
            to="/expenses"
            className="bg-[#D4AF37] text-[#0A0A0A] text-xs font-medium px-3 py-2 rounded-xl hover:bg-[#c4a030] transition-colors"
          >
            + Add transaction
          </Link>
        </div>
      }
    >
      {/* Past-month banner */}
      {!isCurrent && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
          <p className="text-xs text-[#D4AF37]">📅 Showing <strong>{label(selectedMonth)}</strong></p>
          <button onClick={() => setSelectedMonth(currentMonth())} className="text-xs text-[#D4AF37] hover:underline">
            Switch to {label(currentMonth())}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <KpiCard
          label="Monthly Income"
          value={formatCurrency(totalIncome)}
          delta={hasData ? `${savingsRate}% savings rate` : 'No transactions this month'}
          deltaUp={savingsRate > 20 && hasData}
          accent
        />
        <KpiCard
          label="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          delta={hasData ? (totalExpenses <= totalIncome ? 'Within income' : 'Over income ⚠') : 'No transactions this month'}
          deltaUp={totalExpenses <= totalIncome && hasData}
        />
        <KpiCard
          label="Net Savings"
          value={formatCurrency(Math.abs(netSavings))}
          delta={hasData ? (netSavings >= 0 ? `${savingsRate}% of income saved` : 'Spending exceeds income') : 'No transactions this month'}
          deltaUp={netSavings >= 0 && hasData}
          accent={netSavings > 0}
        />
        <KpiCard
          label="Health Score"
          value={`${healthScore}/100`}
          delta={health.label}
          deltaUp={healthScore >= 60}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="md:col-span-2">
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Income vs Expenses</p>
                <p className="text-xs text-[#888580]">Last 6 months — all your data</p>
              </div>
              <div className="flex gap-3 text-xs text-[#888580]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37] inline-block"/>Income</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#C94F4F] inline-block"/>Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={4}>
                <XAxis dataKey="month" tick={{ fill: '#888580', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: unknown) => `₹${Math.round((v as number)/1000)}K`}/>
                <Tooltip
                  contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F0EDE8', fontSize: 12 }}
                  formatter={(v: unknown) => formatCurrency(v as number)}
                />
                <Bar dataKey="income"   fill="#D4AF37" radius={[4,4,0,0]} maxBarSize={28}/>
                <Bar dataKey="expenses" fill="#C94F4F" radius={[4,4,0,0]} maxBarSize={28}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Health ring */}
        <Card className="p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-medium mb-4">Health Score</p>
          <div className="relative w-28 h-28 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1C1C1C" strokeWidth="10"/>
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={health.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - healthScore / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-medium" style={{ color: health.color }}>{healthScore}</span>
              <span className="text-[10px] text-[#888580]">{health.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="text-center bg-[#1C1C1C] rounded-xl p-2">
              <p className="text-sm font-medium text-[#3DAA7A]">{savingsRate}%</p>
              <p className="text-[10px] text-[#888580]">Savings rate</p>
            </div>
            <div className="text-center bg-[#1C1C1C] rounded-xl p-2">
              <p className="text-sm font-medium text-[#D4AF37]">{budgetStatus.filter(b => !b.over).length}/{budgetStatus.length}</p>
              <p className="text-[10px] text-[#888580]">Budgets OK</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Recent Transactions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Recent Transactions</p>
            <Link to="/transactions" className="text-xs text-[#D4AF37] hover:underline">View all</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-xs text-[#555250] mb-2">No transactions in {label(selectedMonth)}</p>
              <Link to="/income" className="text-xs text-[#D4AF37] hover:underline">Add income</Link>
              {' · '}
              <Link to="/expenses" className="text-xs text-[#D4AF37] hover:underline">Add expense</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(61,170,122,0.15)' : 'rgba(201,79,79,0.1)' }}>
                    {tx.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{tx.name}</p>
                    <p className="text-[10px] text-[#555250]">{tx.category} · {tx.date}</p>
                  </div>
                  <p className={`text-xs font-medium flex-shrink-0 ${tx.type === 'income' ? 'text-[#3DAA7A]' : 'text-[#C94F4F]'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Budget Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Budget Status</p>
            <Link to="/budget" className="text-xs text-[#D4AF37] hover:underline">Manage</Link>
          </div>
          {budgetStatus.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">💼</p>
              <p className="text-xs text-[#555250] mb-2">No budgets for {label(selectedMonth)}</p>
              <Link to="/budget" className="text-xs text-[#D4AF37] hover:underline">Set budgets</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetStatus.map(b => (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={b.over ? 'text-[#C94F4F]' : 'text-[#F0EDE8]'}>{b.category} {b.over && '⚠'}</span>
                    <span className="text-[#888580]">{formatCurrency(b.spent)} / {formatCurrency(Number(b.amount))}</span>
                  </div>
                  <Progress value={b.spent} max={Number(b.amount)} color={CATEGORY_COLORS[b.category] ?? '#D4AF37'}/>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Goals */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Savings Goals</p>
            <Link to="/goals" className="text-xs text-[#D4AF37] hover:underline">View all</Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-xs text-[#555250] mb-2">No goals yet</p>
              <Link to="/goals" className="text-xs text-[#D4AF37] hover:underline">Create a goal</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(g => {
                const pct = Math.min(100, Math.round((Number(g.current_saved) / Number(g.target_amount)) * 100))
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="truncate max-w-[120px]">{g.name}</span>
                      <span className="text-[#D4AF37] flex-shrink-0">{pct}%</span>
                    </div>
                    <Progress value={Number(g.current_saved)} max={Number(g.target_amount)}/>
                    <div className="flex justify-between text-[10px] text-[#555250] mt-1">
                      <span>{formatCurrency(Number(g.current_saved))}</span>
                      <span>{formatCurrency(Number(g.target_amount))}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Expense pie */}
      {pieData.length > 0 && (
        <Card className="p-5 mt-4">
          <p className="text-sm font-medium mb-4">Expense Breakdown — {label(selectedMonth)}</p>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 50},60%,55%)`}/>
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => formatCurrency(v as number)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[d.name] ?? '#888580' }}/>
                    <span className="text-[#888580]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(d.value)}</span>
                    <span className="text-[#555250] w-8 text-right">{Math.round((d.value / totalExpenses) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </AppShell>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#151515] rounded-2xl border border-white/7"/>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="col-span-2 h-64 bg-[#151515] rounded-2xl border border-white/7"/>
        <div className="h-64 bg-[#151515] rounded-2xl border border-white/7"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-[#151515] rounded-2xl border border-white/7"/>)}
      </div>
    </div>
  )
}
