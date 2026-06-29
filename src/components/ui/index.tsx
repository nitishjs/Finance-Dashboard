import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(v => typeof v === 'string' && v).join(' ').trim()
}

// ─── Card ──────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void }
export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={cn('bg-[#151515] border border-white/7 rounded-2xl', hover ? 'card-hover cursor-pointer' : '', className ?? '')}>
      {children}
    </div>
  )
}

// ─── Button ────────────────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'; className?: string; onClick?: () => void
  type?: 'button' | 'submit' | 'reset'; disabled?: boolean; loading?: boolean
}
export function Button({ children, variant = 'secondary', size = 'md', className, onClick, type = 'button', disabled, loading }: ButtonProps) {
  const variants = {
    primary:   'bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#c4a030] active:scale-95',
    secondary: 'bg-[#1C1C1C] border border-white/10 text-[#F0EDE8] hover:bg-[#252525] active:scale-95',
    ghost:     'text-[#888580] hover:text-[#F0EDE8] hover:bg-white/5 active:scale-95',
    danger:    'bg-[#C94F4F]/20 border border-[#C94F4F]/30 text-[#C94F4F] hover:bg-[#C94F4F]/30 active:scale-95',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-6 text-sm' }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className ?? '')}>
      {loading && <Spinner />}{children}
    </button>
  )
}

// ─── Input ─────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; icon?: ReactNode }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#888580] uppercase tracking-wide">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888580]">{icon}</span>}
      <input ref={ref}
        className={cn(
          'w-full h-11 bg-[#111111] border border-white/10 rounded-xl px-3 text-sm text-[#F0EDE8] placeholder:text-[#555250]',
          'focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-colors',
          icon ? 'pl-9' : '', error ? 'border-[#C94F4F]/50' : '', className ?? ''
        )}
        {...props} />
    </div>
    {error && <p className="text-xs text-[#C94F4F]">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ─── Select ────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: { value: string; label: string }[] }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#888580] uppercase tracking-wide">{label}</label>}
    <select ref={ref}
      className={cn(
        'w-full h-11 bg-[#111111] border border-white/10 rounded-xl px-3 text-sm text-[#F0EDE8]',
        'focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-colors',
        error ? 'border-[#C94F4F]/50' : '', className ?? ''
      )}
      {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-[#C94F4F]">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ─── Textarea ──────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#888580] uppercase tracking-wide">{label}</label>}
    <textarea ref={ref}
      className={cn(
        'w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-3 text-sm text-[#F0EDE8] placeholder:text-[#555250] resize-none',
        'focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-colors',
        error ? 'border-[#C94F4F]/50' : '', className ?? ''
      )}
      {...props} />
    {error && <p className="text-xs text-[#C94F4F]">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// ─── Badge ─────────────────────────────────────────────────────────
interface BadgeProps { children: ReactNode; variant?: 'gold' | 'success' | 'danger' | 'info' | 'muted'; className?: string }
export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  const variants = {
    gold:    'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30',
    success: 'bg-[#3DAA7A]/10 text-[#3DAA7A] border-[#3DAA7A]/30',
    danger:  'bg-[#C94F4F]/10 text-[#C94F4F] border-[#C94F4F]/30',
    info:    'bg-[#3A7BD5]/10 text-[#3A7BD5] border-[#3A7BD5]/30',
    muted:   'bg-white/5 text-[#888580] border-white/10',
  }
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border', variants[variant], className ?? '')}>{children}</span>
}

// ─── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Modal — slides up on mobile, centered on desktop ─────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode }
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Sheet — full width bottom on mobile, centered card on desktop */}
      <div
        className={[
          'relative bg-[#151515] border border-white/10 shadow-2xl w-full',
          // Mobile: slide up from bottom, rounded top corners
          'rounded-t-3xl md:rounded-2xl',
          // Desktop: constrained width, centered
          'md:w-full md:max-w-lg md:mx-4',
          // Animation
          'animate-slide-up md:animate-scale-in',
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/7">
          <h2 className="text-base font-medium text-[#F0EDE8]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#888580] hover:text-[#F0EDE8] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content — scrollable if too tall */}
        <div className="p-5 overflow-y-auto max-h-[75vh] md:max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Progress ──────────────────────────────────────────────────────
interface ProgressProps { value: number; max?: number; color?: string; className?: string }
export function Progress({ value, max = 100, color = '#D4AF37', className }: ProgressProps) {
  const pct    = Math.min((value / max) * 100, 100)
  const isOver = value > max
  return (
    <div className={cn('h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden', className ?? '')}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isOver ? '#C94F4F' : color }} />
    </div>
  )
}

// ─── KPI Card ──────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: string; delta?: string; deltaUp?: boolean; accent?: boolean; icon?: ReactNode }
export function KpiCard({ label, value, delta, deltaUp, accent, icon }: KpiCardProps) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <p className="text-[10px] md:text-xs text-[#888580] uppercase tracking-wide leading-tight">{label}</p>
        {icon && <span className="text-[#888580]">{icon}</span>}
      </div>
      <p className={cn('text-xl md:text-2xl font-medium', accent ? 'text-[#D4AF37]' : 'text-[#F0EDE8]')}>{value}</p>
      {delta && (
        <p className={cn('text-[10px] md:text-xs mt-1.5 flex items-center gap-1', deltaUp ? 'text-[#3DAA7A]' : 'text-[#C94F4F]')}>
          <span>{deltaUp ? '↑' : '↓'}</span>{delta}
        </p>
      )}
    </Card>
  )
}

// ─── Empty State ───────────────────────────────────────────────────
interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3 text-[#555250]">{icon}</div>
      <h3 className="text-sm font-medium text-[#F0EDE8] mb-1.5">{title}</h3>
      <p className="text-xs text-[#888580] mb-4 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
