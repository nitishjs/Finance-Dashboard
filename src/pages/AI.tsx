import { useState, useRef, useEffect } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Spinner } from '../components/ui'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Monthly Summary',  prompt: 'Give me a summary of my finances this month.' },
  { icon: '💡', label: 'Save More',        prompt: 'How can I increase my savings rate?' },
  { icon: '🎯', label: 'Goal Strategy',    prompt: 'Help me plan to achieve my financial goals faster.' },
  { icon: '⚠️', label: 'Spending Alert',   prompt: 'Which spending categories should I watch out for?' },
  { icon: '📈', label: 'Investment Tips',  prompt: 'Give me personalised investment tips.' },
  { icon: '🏠', label: 'Budget Advice',    prompt: 'Review my budget using the 50/30/20 rule.' },
]

const COMING_SOON_REPLY = 'AI Assistance is available Soon 🚀'

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    // Simulate a short thinking delay, then reply
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: COMING_SOON_REPLY }])
      setLoading(false)
    }, 1200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <AppShell title="AI Finance Assistant" subtitle="Powered by Claude AI">
      <div className="grid grid-cols-[1fr_280px] gap-4 h-[calc(100vh-140px)]">

        {/* ── Chat Panel ─────────────────────────────────────────────── */}
        <Card className="flex flex-col overflow-hidden">

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-base font-medium mb-2">Your AI Finance Advisor</h3>
                <p className="text-sm text-[#888580] max-w-sm mb-6">
                  Ask me anything about budgeting, saving, or your financial data.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {QUICK_PROMPTS.slice(0, 4).map(p => (
                    <button
                      key={p.label}
                      onClick={() => sendMessage(p.prompt)}
                      className="text-left p-3 rounded-xl border border-white/10 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all"
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
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/20 text-[#F0EDE8] rounded-tr-md'
                    : 'bg-[#1C1C1C] border border-white/7 text-[#F0EDE8] rounded-tl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
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

          {/* Input bar */}
          <div className="border-t border-white/7 p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances…"
                rows={2}
                disabled={loading}
                className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#555250] resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
              />
              <Button
                variant="primary"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 h-[72px] w-12 rounded-xl text-lg"
              >
                ↑
              </Button>
            </div>
            <p className="text-[10px] text-[#555250] mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        </Card>

        {/* ── Right sidebar ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-[#888580] uppercase tracking-wide mb-3">Quick Prompts</p>
            <div className="space-y-1">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  disabled={loading}
                  className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#1C1C1C] transition-colors disabled:opacity-50 group"
                >
                  <span className="text-base flex-shrink-0">{p.icon}</span>
                  <span className="text-xs text-[#888580] group-hover:text-[#F0EDE8]">{p.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-[#D4AF37]/20">
            <p className="text-xs font-medium text-[#D4AF37] uppercase tracking-wide mb-2">Coming Soon</p>
            <p className="text-xs text-[#888580] leading-relaxed">
              Full AI-powered financial advice using your real income, expenses and goals — coming soon.
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
