import { useState, useRef, useEffect } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Spinner } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { incomeService, expenseService, goalService } from '../services'
import { formatCurrency, currentMonth } from '../utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Monthly Summary', prompt: 'Give me a summary of my finances this month and key insights.' },
  { icon: '💡', label: 'Save More', prompt: 'Based on my spending, how can I increase my savings rate?' },
  { icon: '🎯', label: 'Goal Strategy', prompt: 'Help me prioritise my financial goals and suggest a plan to achieve them faster.' },
  { icon: '⚠️', label: 'Spending Alert', prompt: 'Which spending categories should I be most concerned about and why?' },
  { icon: '📈', label: 'Investment Tips', prompt: 'Give me personalised investment tips based on my savings rate and income.' },
  { icon: '🏠', label: 'Budget Advice', prompt: 'Review my budget allocation and suggest improvements using the 50/30/20 rule.' },
]

export default function AIPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)
  const [financialContext, setFinancialContext] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load financial context once
  useEffect(() => {
    if (!user) return
    const month = currentMonth()
    Promise.all([
      incomeService.listByMonth(user.id, month),
      expenseService.listByMonth(user.id, month),
      goalService.list(user.id),
    ]).then(([inc, exp, goals]) => {
      const incomes = inc.data ?? []
      const expenses = exp.data ?? []
      const goalList = goals.data ?? []

      const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0)
      const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0)
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExp) / totalIncome * 100).toFixed(1) : '0'

      const catMap: Record<string, number> = {}
      expenses.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + Number(e.amount) })
      const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cat, amt]) => `${cat}: ${formatCurrency(amt)}`).join(', ')

      const ctx = `
User's Financial Context (${month}):
- Monthly Income: ${formatCurrency(totalIncome)}
- Monthly Expenses: ${formatCurrency(totalExp)}
- Net Savings This Month: ${formatCurrency(totalIncome - totalExp)}
- Savings Rate: ${savingsRate}%
- Top Expense Categories: ${topCategories || 'No expenses yet'}
- Active Financial Goals: ${goalList.map(g => `${g.name} (${Math.round((Number(g.current_saved) / Number(g.target_amount)) * 100)}% complete, target: ${formatCurrency(Number(g.target_amount))})`).join('; ') || 'None set'}
      `.trim()

      setFinancialContext(ctx)
      setContextLoading(false)
    })
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const systemPrompt = `You are FINGold AI, a knowledgeable and empathetic personal finance advisor. You help users manage their money, budget wisely, save more, and achieve their financial goals.

${financialContext}

Guidelines:
- Be concise, actionable, and encouraging
- Use Indian financial context (₹, Indian banks, MF/SIP, etc.)
- Refer to the user's actual data when relevant
- Give specific, numbered recommendations when asked
- Keep responses under 300 words unless the question needs more detail
- Format with clear headings and bullet points when helpful`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
        }),
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text ?? 'Sorry, I could not generate a response. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <AppShell title="AI Finance Assistant" subtitle="Powered by Claude AI">
      <div className="grid grid-cols-[1fr_280px] gap-4 h-[calc(100vh-140px)]">
        {/* Chat Panel */}
        <Card className="flex flex-col overflow-hidden">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-base font-medium mb-2">Your AI Finance Advisor</h3>
                <p className="text-sm text-[#888580] max-w-sm mb-6">
                  Ask me anything about budgeting, saving, investing, or your personal finance data.
                  {contextLoading ? ' Loading your financial context…' : ' I can see your current financial data.'}
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {QUICK_PROMPTS.slice(0, 4).map(p => (
                    <button
                      key={p.label}
                      onClick={() => sendMessage(p.prompt)}
                      disabled={contextLoading}
                      className="text-left p-3 rounded-xl border border-white/7 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all disabled:opacity-50"
                    >
                      <div className="text-lg mb-1">{p.icon}</div>
                      <p className="text-xs font-medium">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#F0EDE8] rounded-tr-md'
                      : 'bg-[#1C1C1C] border border-white/7 text-[#F0EDE8] rounded-tl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-sm mr-2 flex-shrink-0">
                  🤖
                </div>
                <div className="bg-[#1C1C1C] border border-white/7 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                  <Spinner size={14} />
                  <span className="text-xs text-[#888580]">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-white/7 p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances…"
                rows={2}
                disabled={loading || contextLoading}
                className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#555250] resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading || contextLoading}
                className="flex-shrink-0 h-[72px] w-12 rounded-xl"
              >
                ↑
              </Button>
            </div>
            <p className="text-[10px] text-[#555250] mt-2">Press Enter to send · Shift+Enter for newline</p>
          </div>
        </Card>

        {/* Sidebar: quick prompts + info */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-[#888580] uppercase tracking-wide mb-3">Quick Prompts</p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  disabled={loading || contextLoading}
                  className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#1C1C1C] transition-colors disabled:opacity-50 group"
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs group-hover:text-[#F0EDE8] text-[#888580]">{p.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium text-[#888580] uppercase tracking-wide mb-3">Data Context</p>
            {contextLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#888580]">
                <Spinner size={12} /> Loading…
              </div>
            ) : (
              <p className="text-xs text-[#3DAA7A]">✓ Financial data loaded</p>
            )}
            <p className="text-[10px] text-[#555250] mt-2 leading-relaxed">
              The AI has access to your current month's income, expenses, and goals to give personalised advice.
            </p>
          </Card>

          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs text-[#555250]">
              Clear conversation
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
