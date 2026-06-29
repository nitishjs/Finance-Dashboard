import { NavLink } from 'react-router-dom'

const items = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fillOpacity={a ? 0.2 : 0}/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" fillOpacity={a ? 0.2 : 0}/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" fillOpacity={a ? 0.2 : 0}/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" fillOpacity={a ? 0.2 : 0}/>
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'History',
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    to: '/income',
    label: 'Income',
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
        <polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-white/10 safe-bottom">
      <div className="flex">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-all duration-150 ${
                isActive ? 'text-[#D4AF37]' : 'text-[#555250] active:text-[#888580]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${isActive ? 'bg-[#D4AF37]/15' : ''}`}>
                  {item.icon(isActive)}
                </div>
                <span className={`text-[10px] leading-none transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
