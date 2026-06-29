import { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">

      {/* Sidebar — hidden on mobile, visible md+ */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/7 bg-[#0A0A0A] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — desktop only (collapses sidebar) */}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="hidden md:flex text-[#888580] hover:text-[#F0EDE8] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Logo — mobile only */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#D4AF37">
                  <path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/>
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-sm md:text-base font-medium text-[#F0EDE8] leading-tight">{title}</h1>
              {subtitle && <p className="text-[10px] md:text-xs text-[#888580]">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {action}
          </div>
        </header>

        {/* Scrollable content — bottom padding for mobile nav bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
