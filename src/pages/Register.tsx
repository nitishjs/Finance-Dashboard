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
  const [emailSent, setEmailSent] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema) as any
  })

  const onSubmit = async (data: RegisterData) => {
    setAuthError('')
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        // After email confirmation, redirect back to the app
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    // If email confirmation is required (identities array is empty = already confirmed or
    // session is returned = email confirm disabled in Supabase dashboard)
    if (authData.session) {
      // Email confirmation is OFF in Supabase → user is logged in immediately
      navigate('/dashboard')
    } else {
      // Email confirmation is ON (default) → show check-email screen
      setSentTo(data.email)
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to get started">
        <div className="text-center space-y-4">
          <div className="text-5xl">📬</div>
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 text-left">
            <p className="text-sm text-[#F0EDE8] mb-1 font-medium">Confirmation email sent!</p>
            <p className="text-xs text-[#888580]">
              We sent a confirmation link to <strong className="text-[#D4AF37]">{sentTo}</strong>.
              Click the link in the email to activate your account.
            </p>
          </div>
          <p className="text-xs text-[#888580]">
            Didn't receive it? Check your spam folder, or{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="text-[#D4AF37] hover:underline"
            >
              try again
            </button>
            .
          </p>
          <Link
            to="/login"
            className="block text-center bg-[#D4AF37] text-[#0A0A0A] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#c4a030] transition-colors"
          >
            Go to sign in
          </Link>
          <div className="border-t border-white/7 pt-4">
            <p className="text-xs text-[#555250]">
              💡 <strong>Tip:</strong> To skip email confirmation during development, go to your{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:underline"
              >
                Supabase Dashboard
              </a>
              {' '}→ Authentication → Email → disable "Confirm email".
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking your finances for free">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Nitish Kumar"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        {authError && (
          <p className="text-xs text-[#C94F4F] bg-[#C94F4F]/10 border border-[#C94F4F]/20 rounded-lg px-3 py-2">
            {authError}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
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
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send you a link to reset it">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="text-4xl">📬</div>
          <p className="text-sm text-[#888580]">
            Check your email for a password reset link. It expires in 1 hour.
          </p>
          <Link to="/login" className="text-[#D4AF37] text-sm inline-block hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          {error && <p className="text-xs text-[#C94F4F]">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
          <p className="text-center text-xs text-[#888580]">
            <Link to="/login" className="text-[#D4AF37] hover:underline">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
