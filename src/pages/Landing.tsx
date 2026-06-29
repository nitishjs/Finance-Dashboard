import { Link } from 'react-router-dom'

const features = [
  { icon: '📊', title: 'Smart Analytics',    desc: 'Visual charts for income, expenses, and net worth trends' },
  { icon: '🎯', title: 'Financial Goals',    desc: 'Set targets, track progress, and hit milestones faster' },
  { icon: '💰', title: 'Budget Planner',     desc: 'Category-wise budgets with real-time overspend alerts' },
  { icon: '🤖', title: 'AI Assistant',       desc: 'Personalised insights and recommendations — coming soon' },
  { icon: '🔒', title: 'Secure & Private',   desc: 'Row-level security so only you can access your data' },
  { icon: '📱', title: 'Mobile Friendly',    desc: 'Manage finances on any device, anywhere, any time' },
]

const testimonials = [
  { name: 'Priya S.',  role: 'Software Engineer', text: 'FINGold gave me clarity I never had. Saved ₹40K in 3 months.' },
  { name: 'Rahul M.',  role: 'Freelancer',         text: 'Finally a finance app that looks as good as it works.' },
  { name: 'Ananya K.', role: 'Product Manager',    text: 'The budget alerts keep me honest every single month.' },
]

const faqs = [
  { q: 'Is my data safe?',            a: 'Yes. Powered by Supabase with Row Level Security — only you can access your records.' },
  { q: 'Is there a mobile app?',      a: 'The web app is fully responsive with a native-style bottom navigation on mobile.' },
  { q: 'Can I export my data?',       a: 'CSV exports are available from the Analytics page.' },
  { q: 'What currencies are supported?', a: 'Any currency symbol — set it in your profile. INR is the default.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0EDE8] overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/7 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#D4AF37">
              <path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/>
            </svg>
          </div>
          <span className="font-medium text-sm">Fin<span className="text-[#D4AF37]">Gold</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-[#888580] hover:text-[#F0EDE8] transition-colors px-2 py-1.5">Sign in</Link>
          <Link to="/register" className="bg-[#D4AF37] text-[#0A0A0A] text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#c4a030] transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-4 md:px-6 pt-16 md:pt-24 pb-12 md:pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-3 py-1.5 text-xs text-[#D4AF37] mb-6 md:mb-8">
          ✦ Premium personal finance dashboard
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium leading-tight mb-4 md:mb-6">
          Your wealth,<br />
          <span className="text-[#D4AF37]">beautifully tracked.</span>
        </h1>
        <p className="text-base md:text-lg text-[#888580] mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed">
          Income, expenses, budgets, goals, and analytics — all in one premium app built for India.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="w-full sm:w-auto bg-[#D4AF37] text-[#0A0A0A] font-semibold px-8 py-3.5 rounded-xl hover:bg-[#c4a030] transition-colors text-sm">
            Start for free →
          </Link>
          <Link to="/login" className="w-full sm:w-auto bg-[#151515] border border-white/10 text-[#F0EDE8] font-medium px-8 py-3.5 rounded-xl hover:bg-[#1C1C1C] transition-colors text-sm">
            Sign in
          </Link>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-4 md:px-8 pb-16 md:pb-24 max-w-5xl mx-auto">
        <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 md:p-8 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 md:mb-6">
            {[
              { label: 'Total Balance',   val: '₹2,84,500', color: '#D4AF37' },
              { label: 'Monthly Income',  val: '₹95,000',   color: '#3DAA7A' },
              { label: 'Expenses',        val: '₹52,300',   color: '#C94F4F' },
              { label: 'Savings Rate',    val: '44.9%',      color: '#D4AF37' },
            ].map(c => (
              <div key={c.label} className="bg-[#0A0A0A] border border-white/7 rounded-xl p-3 md:p-4">
                <p className="text-[10px] text-[#555250] mb-1">{c.label}</p>
                <p className="text-base md:text-xl font-medium" style={{ color: c.color }}>{c.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0A0A0A] border border-white/7 rounded-xl p-3 md:p-4 h-20 md:h-32 flex items-end gap-1 md:gap-2">
            {[40,60,45,70,55,80,65,90,72,85,68,95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? '#D4AF37' : '#C94F4F', opacity: 0.7 }}/>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 pb-16 md:pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-2">Everything you need</h2>
        <p className="text-center text-[#888580] mb-8 md:mb-12 text-sm">Built for people serious about their financial future.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-[#151515] border border-white/7 rounded-2xl p-4 md:p-5 hover:border-[#D4AF37]/20 transition-colors">
              <div className="text-2xl mb-2 md:mb-3">{f.icon}</div>
              <h3 className="font-medium mb-1.5 text-sm md:text-base">{f.title}</h3>
              <p className="text-xs md:text-sm text-[#888580] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 md:px-8 pb-16 md:pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12">Loved by users</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {testimonials.map(t => (
            <div key={t.name} className="bg-[#151515] border border-white/7 rounded-2xl p-4 md:p-5">
              <p className="text-sm text-[#888580] mb-3 leading-relaxed">"{t.text}"</p>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-[#555250]">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 md:px-8 pb-16 md:pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-[#151515] border border-white/7 rounded-2xl p-5 md:p-6">
            <p className="text-sm text-[#888580] mb-1">Free</p>
            <p className="text-4xl font-medium mb-1">₹0</p>
            <p className="text-xs text-[#555250] mb-5">Forever free</p>
            <ul className="space-y-2 text-sm text-[#888580] mb-5">
              {['100 transactions/month','3 financial goals','Basic analytics','Budget planner'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-[#3DAA7A]">✓</span>{f}</li>
              ))}
            </ul>
            <Link to="/register" className="block text-center bg-[#1C1C1C] border border-white/10 text-[#F0EDE8] text-sm font-medium py-2.5 rounded-xl hover:bg-[#252525] transition-colors">
              Get started
            </Link>
          </div>
          <div className="bg-[#151515] border border-[#D4AF37]/30 rounded-2xl p-5 md:p-6 relative">
            <div className="absolute top-4 right-4 bg-[#D4AF37]/10 text-[#D4AF37] text-xs px-2 py-0.5 rounded-full border border-[#D4AF37]/20">Popular</div>
            <p className="text-sm text-[#888580] mb-1">Pro</p>
            <p className="text-4xl font-medium text-[#D4AF37] mb-1">₹299</p>
            <p className="text-xs text-[#555250] mb-5">per month</p>
            <ul className="space-y-2 text-sm text-[#888580] mb-5">
              {['Unlimited transactions','Unlimited goals','AI Finance Assistant','Advanced analytics','CSV exports','Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span>{f}</li>
              ))}
            </ul>
            <Link to="/register" className="block text-center bg-[#D4AF37] text-[#0A0A0A] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#c4a030] transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 pb-16 md:pb-24 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12">Frequently asked</h2>
        <div className="space-y-3">
          {faqs.map(f => (
            <div key={f.q} className="bg-[#151515] border border-white/7 rounded-xl p-4">
              <p className="font-medium text-sm mb-1">{f.q}</p>
              <p className="text-xs md:text-sm text-[#888580] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/7 px-4 py-6 text-center text-xs text-[#555250]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="#D4AF37"><path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/></svg>
          </div>
          <span className="text-[#888580] text-sm font-medium">Fin<span className="text-[#D4AF37]">Gold</span></span>
        </div>
        <p>© 2026 FINGold. Built with React, TypeScript & Supabase.</p>
      </footer>
    </div>
  )
}
