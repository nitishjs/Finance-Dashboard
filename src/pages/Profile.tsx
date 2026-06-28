import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppShell } from '../components/layout/AppShell'
import { Card, Button, Input, Select } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { profileService } from '../services'
import type { Profile } from '../types'

const CURRENCIES = [
  { value: '₹', label: '₹ Indian Rupee (INR)' },
  { value: '$', label: '$ US Dollar (USD)' },
  { value: '€', label: '€ Euro (EUR)' },
  { value: '£', label: '£ British Pound (GBP)' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'IST — Asia/Kolkata (UTC+5:30)' },
  { value: 'America/New_York', label: 'EST — New York (UTC-5)' },
  { value: 'Europe/London', label: 'GMT — London (UTC+0)' },
  { value: 'Asia/Dubai', label: 'GST — Dubai (UTC+4)' },
  { value: 'Asia/Singapore', label: 'SGT — Singapore (UTC+8)' },
]

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.string().min(1),
  monthly_income: z.coerce.number().min(0, 'Cannot be negative'),
  financial_goal: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().min(1),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: '',
      currency: '₹',
      timezone: 'Asia/Kolkata',
      monthly_income: 0,
      financial_goal: '',
      country: 'India',
    },
  })

  useEffect(() => {
    if (!user) return
    profileService.get(user.id).then(p => {
      if (p) {
        reset({
          full_name: p.full_name || '',
          currency: p.currency || '₹',
          monthly_income: Number(p.monthly_income) || 0,
          financial_goal: p.financial_goal || '',
          country: p.country || 'India',
          timezone: p.timezone || 'Asia/Kolkata',
        })
      } else {
        // Profile not yet created (edge case) — pre-fill from auth metadata
        const meta = user.user_metadata
        reset({
          full_name: meta?.full_name || '',
          currency: '₹',
          monthly_income: 0,
          financial_goal: '',
          country: 'India',
          timezone: 'Asia/Kolkata',
        })
      }
      setLoading(false)
    })
  }, [user, reset])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setSaving(true)
    const { error } = await profileService.upsert({
      user_id: user.id,
      ...data,
      monthly_income: Number(data.monthly_income),
    })
    setSaving(false)
    if (error) {
      toast({ type: 'error', title: 'Failed to save profile', description: error.message })
      return
    }
    toast({ type: 'success', title: 'Profile updated!' })
    reset(data) // reset dirty state
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    || user?.email?.slice(0, 2).toUpperCase()
    || 'U'

  return (
    <AppShell title="Settings" subtitle="Manage your profile and preferences">
      <div className="max-w-2xl space-y-6">

        {/* Avatar + identity */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/7">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-xl font-medium text-[#D4AF37] flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-medium text-[#F0EDE8]">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-sm text-[#888580]">{user?.email}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 mt-1 inline-block">
                Pro Plan
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-[#1C1C1C] rounded-xl" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full name"
                  placeholder="Your name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />
                <Input
                  label="Country"
                  placeholder="e.g. India"
                  {...register('country')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Currency"
                  options={CURRENCIES}
                  error={errors.currency?.message}
                  {...register('currency')}
                />
                <Select
                  label="Timezone"
                  options={TIMEZONES}
                  error={errors.timezone?.message}
                  {...register('timezone')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monthly income (₹)"
                  type="number"
                  step="1000"
                  placeholder="0"
                  error={errors.monthly_income?.message}
                  {...register('monthly_income')}
                />
                <Input
                  label="Primary financial goal"
                  placeholder="e.g. Buy a house"
                  {...register('financial_goal')}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={!isDirty || saving}
                >
                  Save changes
                </Button>
                <Button type="button" variant="ghost" onClick={() => reset()}>
                  Discard
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Account */}
        <Card className="p-6">
          <p className="text-sm font-medium mb-4">Account</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-white/7">
              <div>
                <p className="text-sm">Email address</p>
                <p className="text-xs text-[#888580]">{user?.email}</p>
              </div>
              <span className="text-xs text-[#3DAA7A] bg-[#3DAA7A]/10 px-3 py-1 rounded-lg border border-[#3DAA7A]/20">
                {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/7">
              <div>
                <p className="text-sm">Password</p>
                <p className="text-xs text-[#888580]">Use forgot password to reset</p>
              </div>
              <Button size="sm" variant="secondary" onClick={async () => {
                if (!user?.email) return
                await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                })
                alert('Password reset link sent to your email.')
              }}>
                Reset
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm">Member since</p>
                <p className="text-xs text-[#888580]">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-lg border border-[#D4AF37]/20">Pro</span>
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="p-6 border-[#C94F4F]/20">
          <p className="text-sm font-medium text-[#C94F4F] mb-4">Danger Zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Delete account</p>
              <p className="text-xs text-[#888580]">Permanently delete your account and all data. Cannot be undone.</p>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => alert('To delete your account, please contact support@fingold.app')}
            >
              Delete account
            </Button>
          </div>
        </Card>

      </div>
    </AppShell>
  )
}

// Inline supabase import needed for reset button
import { supabase } from '../supabase/client'
