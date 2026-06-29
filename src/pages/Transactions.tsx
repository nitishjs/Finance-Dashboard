import { useEffect, useState, useMemo } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card, Badge, Button, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { incomeService, expenseService } from '../services'
import { formatCurrency, formatDate, CATEGORY_COLORS } from '../utils'
import type { Income, Expense } from '../types'

type TxRow = { id: string; type: 'income' | 'expense'; name: string; amount: number; category: string; date: string; payment_method?: string; notes?: string }

export default function TransactionsPage() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  useEffect(() => {
    if (!user) return
    Promise.all([incomeService.list(user.id), expenseService.list(user.id)]).then(([inc, exp]) => {
      setIncomes(inc.data ?? [])
      setExpenses(exp.data ?? [])
      setLoading(false)
    })
  }, [user])

  const rows: TxRow[] = useMemo(() => [
    ...incomes.map(i => ({ id: i.id, type: 'income' as const, name: i.source, amount: Number(i.amount), category: i.category, date: i.date, notes: i.notes })),
    ...expenses.map(e => ({ id: e.id, type: 'expense' as const, name: e.name, amount: Number(e.amount), category: e.category, date: e.date, payment_method: e.payment_method, notes: e.notes })),
  ], [incomes, expenses])

  const categories = useMemo(() => ['all', ...new Set(rows.map(r => r.category))], [rows])

  const filtered = useMemo(() => {
    return rows
      .filter(r => filterType === 'all' || r.type === filterType)
      .filter(r => filterCategory === 'all' || r.category === filterCategory)
      .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sortBy === 'date'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : b.amount - a.amount
      )
  }, [rows, filterType, filterCategory, search, sortBy])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalIncome = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  return (
    <AppShell title="Transactions" subtitle="All your financial activity">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Income</p>
          <p className="text-xl font-medium text-[#3DAA7A]">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Total Expenses</p>
          <p className="text-xl font-medium text-[#C94F4F]">{formatCurrency(totalExpense)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#888580] mb-1">Net Flow</p>
          <p className={`text-xl font-medium ${totalIncome - totalExpense >= 0 ? 'text-[#3DAA7A]' : 'text-[#C94F4F]'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex gap-1 bg-[#1C1C1C] rounded-xl p-1">
            {(['all', 'income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => { setFilterType(t); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${filterType === t ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#888580] hover:text-[#F0EDE8]'}`}>
                {t}
              </button>
            ))}
          </div>
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDE8] focus:outline-none focus:border-[#D4AF37]/50"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
            className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDE8] focus:outline-none focus:border-[#D4AF37]/50"
          >
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-[#1C1C1C] rounded-xl"/>)}</div>
        ) : paginated.length === 0 ? (
          <p className="text-center text-sm text-[#555250] py-12">No transactions match your filters.</p>
        ) : (
          <div className="space-y-1">
            {paginated.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1C1C1C] transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: tx.type === 'income' ? 'rgba(61,170,122,0.15)' : 'rgba(201,79,79,0.1)' }}>
                  {tx.type === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{tx.name}</p>
                  <p className="text-[10px] text-[#555250]">
                    <span style={{ color: CATEGORY_COLORS[tx.category] ?? '#888580' }}>{tx.category}</span>
                    {' · '}{formatDate(tx.date)}
                    {tx.payment_method && <span className="hidden sm:inline">{' · '}{tx.payment_method}</span>}
                    {tx.notes && <span className="hidden sm:inline">{' · '}{tx.notes}</span>}
                  </p>
                </div>
                <p className={`text-sm font-medium flex-shrink-0 ${tx.type === 'income' ? 'text-[#3DAA7A]' : 'text-[#C94F4F]'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/7">
            <p className="text-xs text-[#888580]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Button>
              {(() => {
                const delta = 2
                const start = Math.max(1, Math.min(page - delta, totalPages - delta * 2))
                const end   = Math.min(totalPages, start + delta * 2)
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs ${page === p ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#888580] hover:text-[#F0EDE8]'}`}>
                    {p}
                  </button>
                ))
              })()}
              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</Button>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  )
}
