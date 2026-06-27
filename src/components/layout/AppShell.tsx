import { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'

interface AppShellProps { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }

export function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <Sidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/7 bg-[#0A0A0A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="text-[#888580] hover:text-[#F0EDE8] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 className="text-base font-medium text-[#F0EDE8]">{title}</h1>
              {subtitle && <p className="text-xs text-[#888580]">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {action}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
