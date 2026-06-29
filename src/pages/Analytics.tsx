import { useEffect, useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { incomeService, expenseService, savingsService } from '../services'
import { formatCurrency, currentMonth, CATEGORY_COLORS } from '../utils'
import type { Income, Expense, Savings } from '../types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getMonthLabel(ym: string) {
  const [, m] = ym.split('-')
  return MONTHS[parseInt(m, 10) - 1]
}

function last6Months(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [savings, setSavings] = useState<Savings[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      incomeService.list(user.id),
      expenseService.list(user.id),
      savingsService.list(user.id),
    ]).then(([inc, exp, sav]) => {
      setIncomes(inc.data ?? [])
      setExpenses(exp.data ?? [])
      setSavings(sav.data ?? [])
      setLoading(false)
    })
  }, [user])

  const months = last6Months()

  // Monthly income vs expenses trend
  const trendData = months.map(m => {
    const inc = incomes.filter(i => i.date.startsWith(m)).reduce((s, i) => s + Number(i.amount), 0)
    const exp = expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0)
    const sav = savings.filter(s => s.date.startsWith(m)).reduce((s, r) => s + Number(r.amount), 0)
    return { month: getMonthLabel(m), income: inc, expenses: exp, savings: sav, net: inc - exp }
  })

  // Expense by category
  const categoryMap: Record<string, number> = {}
  expenses.forEach(e => { categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount) })
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Income by category
  const incCategoryMap: Record<string, number> = {}
  incomes.forEach(i => { incCategoryMap[i.category] = (incCategoryMap[i.category] ?? 0) + Number(i.amount) })
  const incPieData = Object.entries(incCategoryMap).map(([name, value]) => ({ name, value }))

  // Cumulative savings
  const sortedSav = [...savings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let runningTotal = 0
  const savCumData = sortedSav.map(s => {
    runningTotal += Number(s.amount)
    return { date: s.date.slice(0, 7), total: runningTotal }
  })
  const savMonthly = Object.values(
    savCumData.reduce<Record<string, { date: string; total: number }>>((acc, d) => { acc[d.date] = d; return acc }, {})
  )

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalSavings = savings.reduce((s, r) => s + Number(r.amount), 0)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0'

  const tooltipStyle = {
    contentStyle: { background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#F0EDE8' },
    itemStyle: { color: '#F0EDE8' },
  }

  return (
    <AppShell title="Analytics" subtitle="Deep-dive into your financial data">
      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatCurrency(totalIncome), color: '#3DAA7A' },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: '#C94F4F' },
          { label: 'Net Savings', value: formatCurrency(totalIncome - totalExpenses), color: '#D4AF37' },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: '#3A7BD5' },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <p className="text-xs text-[#888580] mb-1">{k.label}</p>
            <p className="text-xl font-medium" style={{ color: k.color }}>{k.value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-[#151515] rounded-2xl border border-white/7 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Income vs Expenses */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="p-5">
              <p className="text-sm font-medium mb-1">Income vs Expenses</p>
              <p className="text-xs text-[#888580] mb-4">Last 6 months</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} barGap={4}>
                  <XAxis dataKey="month" tick={{ fill: '#888580', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `₹${Math.round(v / 1000)}K`} />
                  <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(v as number)} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#888580' }} />
                  <Bar dataKey="income" name="Income" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expenses" name="Expenses" fill="#C94F4F" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Cash Flow (Net) */}
            <Card className="p-5">
              <p className="text-sm font-medium mb-1">Net Cash Flow</p>
              <p className="text-xs text-[#888580] mb-4">Income minus expenses per month</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData}>
                  <XAxis dataKey="month" tick={{ fill: '#888580', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `₹${Math.round(v / 1000)}K`} />
                  <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(v as number)} />
                  <Bar dataKey="net" name="Net flow" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {trendData.map((entry, i) => (
                      <Cell key={i} fill={entry.net >= 0 ? '#3DAA7A' : '#C94F4F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Expense Pie + Income Pie */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="p-5">
              <p className="text-sm font-medium mb-1">Expense Breakdown</p>
              <p className="text-xs text-[#888580] mb-4">All time by category</p>
              {pieData.length === 0 ? (
                <p className="text-xs text-center text-[#555250] py-16">No expense data</p>
              ) : (
                <div className="flex gap-4 items-center">
                  <ResponsiveContainer width={160} height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 40}, 60%, 55%)`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: unknown) => formatCurrency(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-44">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[d.name] ?? '#888' }} />
                          <span className="text-[#888580]">{d.name}</span>
                        </div>
                        <span className="font-medium">{Math.round((d.value / totalExpenses) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <p className="text-sm font-medium mb-1">Income Sources</p>
              <p className="text-xs text-[#888580] mb-4">All time by category</p>
              {incPieData.length === 0 ? (
                <p className="text-xs text-center text-[#555250] py-16">No income data</p>
              ) : (
                <div className="flex gap-4 items-center">
                  <ResponsiveContainer width={160} height={180}>
                    <PieChart>
                      <Pie data={incPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                        {incPieData.map((entry, i) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 55 + 120}, 60%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: unknown) => formatCurrency(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {incPieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[d.name] ?? '#3DAA7A' }} />
                          <span className="text-[#888580]">{d.name}</span>
                        </div>
                        <span>{formatCurrency(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Savings growth */}
          <Card className="p-5 mb-4">
            <p className="text-sm font-medium mb-1">Savings Growth</p>
            <p className="text-xs text-[#888580] mb-4">Cumulative savings over time</p>
            {savMonthly.length < 2 ? (
              <p className="text-xs text-center text-[#555250] py-8">Record at least 2 months of savings to see a trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={savMonthly}>
                  <defs>
                    <linearGradient id="savGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={getMonthLabel} />
                  <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `₹${Math.round(v / 1000)}K`} />
                  <Tooltip {...tooltipStyle} formatter={(v: unknown) => [formatCurrency(v as number), 'Total saved']} />
                  <Area dataKey="total" stroke="#D4AF37" strokeWidth={2} fill="url(#savGradA)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Monthly spending trend line */}
          <Card className="p-5">
            <p className="text-sm font-medium mb-1">Monthly Spending Trend</p>
            <p className="text-xs text-[#888580] mb-4">Income, expenses & savings — last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: '#888580', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888580', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₹${Math.round(v / 1000)}K`} />
                <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#888580' }} />
                <Line dataKey="income" name="Income" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', r: 3 }} />
                <Line dataKey="expenses" name="Expenses" stroke="#C94F4F" strokeWidth={2} dot={{ fill: '#C94F4F', r: 3 }} />
                <Line dataKey="savings" name="Savings" stroke="#3DAA7A" strokeWidth={2} dot={{ fill: '#3DAA7A', r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </AppShell>
  )
}
