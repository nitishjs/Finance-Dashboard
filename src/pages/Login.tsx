import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabase/client'
import { Button, Input } from '../components/ui'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any
  })

  const onSubmit = async (data: FormData) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      // Give friendly messages for common errors
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Incorrect email or password. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Please confirm your email before signing in. Check your inbox.')
      } else {
        setAuthError(error.message)
      }
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FINGold account">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />
        {authError && (
          <p className="text-xs text-[#C94F4F] bg-[#C94F4F]/10 border border-[#C94F4F]/20 rounded-lg px-3 py-2">
            {authError}
          </p>
        )}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-[#888580] hover:text-[#D4AF37] transition-colors">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="text-center text-xs text-[#888580] mt-6">
        No account?{' '}
        <Link to="/register" className="text-[#D4AF37] hover:underline">Create one free</Link>
      </p>
    </AuthLayout>
  )
}

// ─── Shared AuthLayout ──────────────────────────────────────────────────────
export function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Left decorative panel */}
      <div className="hidden md:flex flex-col justify-between w-80 bg-[#111111] border-r border-white/7 p-8 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4AF37">
              <path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#F0EDE8]">Fin<span className="text-[#D4AF37]">Gold</span></span>
        </Link>

        <div>
          <div className="space-y-4 mb-8">
            {[
              'Track income & expenses',
              'Set savings goals',
              'Budget by category',
              'AI-powered insights',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-[#888580]">
                <span className="text-[#D4AF37] text-base">✦</span>
                {f}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#555250]">Trusted by thousands of users across India</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-sm px-1">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#D4AF37">
                <path d="M8 1L10.5 5.5H14.5L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1.5 5.5H5.5L8 1Z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#F0EDE8]">Fin<span className="text-[#D4AF37]">Gold</span></span>
          </div>
          <h1 className="text-2xl font-medium mb-1">{title}</h1>
          <p className="text-sm text-[#888580] mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
