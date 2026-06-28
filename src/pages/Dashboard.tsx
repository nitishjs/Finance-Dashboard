import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AppShell } from '../components/layout/AppShell'
import { Card, KpiCard, Progress } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { incomeService, expenseService, goalService, budgetService } from '../services'
import { formatCurrency, currentMonth, getHealthGrade, CATEGORY_COLORS } from '../utils'
import type { Income, Expense, FinancialGoal, Budget } from '../types'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function last6Months(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [allIncomes, setAllIncomes] = useState<Income[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const month = currentMonth()

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [inc, exp, allInc, allExp, gls, bud] = await Promise.all([
        incomeService.listByMonth(user.id, month),
        expenseService.listByMonth(user.id, month),
        incomeService.list(user.id),
        expenseService.list(user.id),
        goalService.list(user.id),
        budgetService.listByMonth(user.id, month),
      ])
      setIncomes(inc.data ?? [])
      setExpenses(exp.data ?? [])
      setAllIncomes(allInc.data ?? [])
      setAllExpenses(allExp.data ?? [])
      setGoals((gls.data ?? []).slice(0, 3))
      setBudgets(bud.data ?? [])
      setLoading(false)
    }
    load()
  }, [user, month])

  // Current month stats
  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthlySavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((monthlySavings / totalIncome) * 100) : 0
  const budgetTotal = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const healthScore = Math.min(100, Math.round(
    savingsRate * 1.4 +
    (budgetTotal > 0 ? Math.max(0, ((budgetTotal - totalExpenses) / budgetTotal) * 30) : 0)
  ))
  const health = getHealthGrade(healthScore)

  // Category breakdown for pie (current month)
  const categoryMap: Record<string, number> = {}
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount)
  })
  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Recent transactions merged
  const recentTx = [
    ...incomes.map(i => ({ ...i, type: 'income' as const, name: i.source })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  // Budget status
  const budgetStatus = budgets.map(b => {
    const spent = expenses
      .filter(e => e.category === b.category)
      .reduce((s, e) => s + Number(e.amount), 0)
    return { ...b, spent, over: spent > Number(b.amount) }
  })

  // Real 6-month trend from actual data
  const months6 = last6Months()
  const trendData = months6.map(m => {
    const [, mo] = m.split('-')
    const inc = allIncomes
      .filter(i => i.date.startsWith(m))
      .reduce((s, i) => s + Number(i.amount), 0)
    const exp = allExpenses
      .filter(e => e.date.startsWith(m))
      .reduce((s, e) => s + Number(e.amount), 0)
    return { month: MONTH_LABELS[parseInt(mo, 10) - 1], income: inc, expenses: exp }
  })

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  if (loading) return (
    <AppShell title="Dashboard">
      <LoadingSkeleton />
    </AppShell>
  )

  return (
    <AppShell
      title="Dashboard"
      subtitle={monthLabel}
      action={
        <Link
          to="/expenses"
          className="bg-[#D4AF37] text-[#0A0A0A] text-xs font-medium px-3 py-2 rounded-xl hover:bg-[#c4a030] transition-colors flex items-center gap-1"
        >
          + Add transaction
        </Link>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Monthly Income"
          value={formatCurrency(totalIncome)}
          delta={totalIncome === 0 ? 'No income added yet' : `${savingsRate}% saved this month`}
          deltaUp={savingsRate > 20}
          accent
        />
        <KpiCard
          label="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          delta={totalExpenses === 0 ? 'No expenses added yet' : totalExpenses <= totalIncome ? 'Within budget' : 'Over income'}
          deltaUp={totalExpenses <= totalIncome}
        />
        <KpiCard
          label="Net Savings"
          value={formatCurrency(Math.abs(monthlySavings))}
          delta={monthlySavings >= 0 ? `${savingsRate}% savings rate` : 'Spending more than earning'}
          deltaUp={monthlySavings >= 0}
          accent={monthlySavings > 0}
        />
        <KpiCard
          label="Health Score"
          value={`${healthScore}/100`}
          delta={health.label}
          deltaUp={healthScore >= 60}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        {/* Income vs Expense bar chart */}
        <div className="col-span-2">
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Income vs Expenses</p>
                <p className="text-xs text-[#888580]">Last 6 months</p>
              </div>
              <div className="flex gap-3 text-xs text-[#888580]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#D4AF37]" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#C94F4F]" /> Expenses
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={4}>
                <XAxis dataKey="month" tick={{ fill: '#888580', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#888580', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: unknown) => `₹${Math.round((v as number) / 1000)}K`}
                />
                <Tooltip
                  contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F0EDE8', fontSize: 12 }}
                  formatter={(v: unknown) => formatCurrency(v as number)}
                />
                <Bar dataKey="income" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#C94F4F" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
            {trendData.every(d => d.income === 0 && d.expenses === 0) && (
              <p className="text-xs text-center text-[#555250] mt-2">
                Add income and expenses to see your trend chart
              </p>
            )}
          </Card>
        </div>

        {/* Health Score ring */}
        <Card className="p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-medium mb-4">Health Score</p>
          <div className="relative w-28 h-28 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1C1C1C" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
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
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="text-center bg-[#1C1C1C] rounded-xl p-2">
              <p className="text-sm font-medium text-[#3DAA7A]">{savingsRate}%</p>
              <p className="text-[10px] text-[#888580]">Savings rate</p>
            </div>
            <div className="text-center bg-[#1C1C1C] rounded-xl p-2">
              <p className="text-sm font-medium text-[#D4AF37]">
                {budgetStatus.filter(b => !b.over).length}/{budgetStatus.length}
              </p>
              <p className="text-[10px] text-[#888580]">Budgets OK</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Transactions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Recent Transactions</p>
            <Link to="/transactions" className="text-xs text-[#D4AF37] hover:underline">View all</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-xs text-[#555250]">No transactions yet</p>
              <Link to="/income" className="text-xs text-[#D4AF37] hover:underline mt-1 inline-block">Add income</Link>
              {' · '}
              <Link to="/expenses" className="text-xs text-[#D4AF37] hover:underline mt-1 inline-block">Add expense</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(61,170,122,0.15)' : 'rgba(201,79,79,0.1)' }}
                  >
                    {tx.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{tx.name}</p>
                    <p className="text-[10px] text-[#555250]">{tx.category}</p>
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
              <p className="text-xs text-[#555250]">No budgets set for this month</p>
              <Link to="/budget" className="text-xs text-[#D4AF37] hover:underline mt-1 inline-block">Set budgets</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetStatus.map(b => (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={b.over ? 'text-[#C94F4F]' : 'text-[#F0EDE8]'}>
                      {b.category} {b.over && '⚠'}
                    </span>
                    <span className="text-[#888580]">
                      {formatCurrency(b.spent)} / {formatCurrency(Number(b.amount))}
                    </span>
                  </div>
                  <Progress
                    value={b.spent}
                    max={Number(b.amount)}
                    color={CATEGORY_COLORS[b.category] ?? '#D4AF37'}
                  />
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
              <p className="text-xs text-[#555250]">No goals set yet</p>
              <Link to="/goals" className="text-xs text-[#D4AF37] hover:underline mt-1 inline-block">Create a goal</Link>
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
                    <Progress value={Number(g.current_saved)} max={Number(g.target_amount)} />
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

      {/* Expense Breakdown (only if there are expenses) */}
      {pieData.length > 0 && (
        <Card className="p-5 mt-4">
          <p className="text-sm font-medium mb-4">Expense Breakdown — {monthLabel}</p>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 50}, 60%, 55%)`} />
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
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[d.name] ?? '#888580' }} />
                    <span className="text-[#888580]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(d.value)}</span>
                    <span className="text-[#555250] w-8 text-right">
                      {Math.round((d.value / totalExpenses) * 100)}%
                    </span>
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

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#151515] rounded-2xl border border-white/7" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-64 bg-[#151515] rounded-2xl border border-white/7" />
        <div className="h-64 bg-[#151515] rounded-2xl border border-white/7" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-[#151515] rounded-2xl border border-white/7" />)}
      </div>
    </div>
  )
}
