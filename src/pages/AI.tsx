import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui'

const FEATURES = [
  { icon: '📊', label: 'Monthly Summary', desc: 'Get a full breakdown of your income, expenses and savings for any month.' },
  { icon: '💡', label: 'Save More Tips', desc: 'Personalised suggestions to increase your savings rate based on your spending.' },
  { icon: '🎯', label: 'Goal Strategy', desc: 'A step-by-step plan to hit your financial goals faster.' },
  { icon: '⚠️', label: 'Spending Alerts', desc: 'Identify which categories are eating into your budget the most.' },
  { icon: '📈', label: 'Investment Tips', desc: 'Tailored investment advice based on your income and savings rate.' },
  { icon: '🏠', label: 'Budget Advice', desc: 'Smart budget allocation using the 50/30/20 rule and your real data.' },
]

export default function AIPage() {
  return (
    <AppShell title="AI Finance Assistant" subtitle="Powered by Claude AI">
      {/* Coming Soon hero */}
      <div className="flex flex-col items-center justify-center text-center py-16 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-4xl mb-6">
          🤖
        </div>
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 text-xs text-[#D4AF37] mb-5">
          ✦ Coming Soon
        </div>
        <h2 className="text-3xl font-medium text-[#F0EDE8] mb-3">
          AI Assistance is coming soon.
        </h2>
        <p className="text-sm text-[#888580] max-w-md leading-relaxed">
          Your personal finance AI advisor — powered by Claude — will analyse your real income, expenses and goals to give you advice that's actually useful.
        </p>
      </div>

      {/* Feature preview cards */}
      <div className="mb-6">
        <p className="text-xs text-[#555250] uppercase tracking-widest text-center mb-5">What's coming</p>
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Card key={f.label} className="p-5 opacity-75">
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-sm font-medium text-[#F0EDE8] mb-1.5">{f.label}</p>
              <p className="text-xs text-[#888580] leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Disabled chat UI preview */}
      <Card className="p-5 opacity-50 pointer-events-none select-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-base">🤖</div>
          <div className="bg-[#1C1C1C] border border-white/7 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-[#888580]">
            Hello! I'm your FINGold AI advisor. I'll be ready to help you manage your finances soon.
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 h-10 bg-[#111111] border border-white/10 rounded-xl px-3 flex items-center">
            <span className="text-xs text-[#555250]">Ask about your finances…</span>
          </div>
          <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] text-lg">↑</div>
        </div>
      </Card>
    </AppShell>
  )
}
