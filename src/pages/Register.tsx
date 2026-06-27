import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabase/client'
import { Button, Input } from '../components/ui'
import { AuthLayout } from './Login'

// ─── Register ──────────────────────────────────────────────────────────────
const registerSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

type RegisterData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema) as any
  })

  const onSubmit = async (data: RegisterData) => {
    setAuthError('')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } }
    })
    if (error) { setAuthError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking your finances for free">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <Input label="Full name" placeholder="Nitish Kumar" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" error={errors.confirm?.message} {...register('confirm')} />
        {authError && <p className="text-xs text-[#C94F4F] bg-[#C94F4F]/10 border border-[#C94F4F]/20 rounded-lg px-3 py-2">{authError}</p>}
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
      <p className="text-center text-xs text-[#888580] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

// ─── Forgot Password ────────────────────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().email('Enter a valid email') })
type ForgotData = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema) as any
  })

  const onSubmit = async (data: ForgotData) => {
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send you a link to reset it">
      {sent ? (
        <div className="text-center">
          <div className="text-4xl mb-4">📬</div>
          <p className="text-sm text-[#888580]">Check your email for a reset link. It expires in 1 hour.</p>
          <Link to="/login" className="text-[#D4AF37] text-sm mt-4 inline-block hover:underline">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          {error && <p className="text-xs text-[#C94F4F]">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>Send reset link</Button>
          <p className="text-center text-xs text-[#888580]">
            <Link to="/login" className="text-[#D4AF37] hover:underline">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
