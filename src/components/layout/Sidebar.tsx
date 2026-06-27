import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils'

const navItems = [
  { to: '/dashboard', icon: GridIcon, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowsIcon, label: 'Transactions' },
  { to: '/income', icon: TrendingUpIcon, label: 'Income' },
  { to: '/expenses', icon: TrendingDownIcon, label: 'Expenses' },
  { to: '/budget', icon: WalletIcon, label: 'Budget' },
  { to: '/goals', icon: TargetIcon, label: 'Goals' },
  { to: '/savings', icon: PiggyIcon, label: 'Savings' },
  { to: '/analytics', icon: ChartIcon, label: 'Analytics' },
  { to: '/ai', icon: RobotIcon, label: 'AI Assistant' },
]

const bottomItems = [
  { to: '/profile', icon: SettingsIcon, label: 'Settings' },
]

interface SidebarProps { collapsed?: boolean }

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'flex flex-col bg-[#111111] border-r border-white/7 transition-all duration-300 h-screen sticky top-0',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-white/7', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4AF37">
            <path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/>
          </svg>
        </div>
        {!collapsed && <span className="text-sm font-medium text-[#F0EDE8]">Fin<span className="text-[#D4AF37]">Gold</span></span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {!collapsed && <p className="text-[10px] text-[#555250] uppercase tracking-widest px-2 mb-2">Overview</p>}
        {navItems.slice(0, 2).map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
        {!collapsed && <p className="text-[10px] text-[#555250] uppercase tracking-widest px-2 mt-4 mb-2">Finance</p>}
        {navItems.slice(2, 7).map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
        {!collapsed && <p className="text-[10px] text-[#555250] uppercase tracking-widest px-2 mt-4 mb-2">Tools</p>}
        {navItems.slice(7).map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/7 p-2 space-y-0.5">
        {bottomItems.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-xl text-[#888580] hover:text-[#F0EDE8] hover:bg-white/5 transition-all text-sm',
            collapsed && 'justify-center'
          )}
        >
          <LogOutIcon />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* User */}
        <NavLink to="/profile" className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-all',
          collapsed && 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-medium flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#F0EDE8] truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-[#555250]">Pro Plan</p>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}

function NavItem({ to, icon: Icon, label, collapsed }: { to: string; icon: () => React.ReactElement; label: string; collapsed?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-2 py-2 rounded-xl text-sm transition-all',
        isActive
          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
          : 'text-[#888580] hover:text-[#F0EDE8] hover:bg-white/5',
        collapsed && 'justify-center'
      )}
    >
      <Icon />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

// SVG icons inline to avoid extra deps
function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function ArrowsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg> }
function TrendingUpIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function TrendingDownIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg> }
function WalletIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 14a1 1 0 100-2 1 1 0 000 2z"/><path d="M16 7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v2"/></svg> }
function TargetIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }
function PiggyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 9c0-3.87-3.13-7-7-7S5 5.13 5 9H3l1 4h1c0 1.7.7 3.23 1.83 4.33L6 20h4l.5-1.5c.48.1.98.15 1.5.15s1.02-.05 1.5-.15L14 20h4l-.83-2.67C18.3 16.23 19 14.7 19 13h1l1-4h-2z"/></svg> }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function RobotIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V3M8 3h8M9 15h.01M15 15h.01"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function LogOutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> }
