import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { cn } from '../utils'

interface ToastItem {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  toasts: ToastItem[]
  toast: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {}
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...item, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
  const colors = {
    success: 'border-[#3DAA7A]/30 text-[#3DAA7A]',
    error: 'border-[#C94F4F]/30 text-[#C94F4F]',
    info: 'border-[#3A7BD5]/30 text-[#3A7BD5]',
    warning: 'border-[#D4AF37]/30 text-[#D4AF37]',
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto bg-[#151515] border rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl min-w-72 max-w-sm',
            colors[t.type]
          )}
        >
          <span className="text-sm mt-0.5 flex-shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F0EDE8]">{t.title}</p>
            {t.description && <p className="text-xs text-[#888580] mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[#555250] hover:text-[#F0EDE8] text-xs flex-shrink-0"
          >✕</button>
        </div>
      ))}
    </div>
  )
}
