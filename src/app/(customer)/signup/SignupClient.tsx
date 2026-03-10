'use client'
// src/app/(customer)/signup/SignupClient.tsx

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isValidPhone, isValidEmail, getErrorMessage } from '@/lib/utils'
import { Loader2, Shirt, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignupClient() {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [referralCode, setReferralCode] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const supabase = createClient()
  const roleCookie = `portal_role=customer; path=/; max-age=2592000; samesite=lax${
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : ''
  }`

  function validateForm(): string | null {
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (!isValidEmail(email)) return 'Please enter a valid email address'
    if (!isValidPhone(phone)) return 'Please enter a valid 10-digit Indian phone number'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone,
            role: 'customer',
            referral_code: referralCode.trim() || undefined,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        window.location.href = '/login?message=Account+created.+Please+sign+in.'
        return
      }

      document.cookie = roleCookie
      window.location.href = '/auth/confirm'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: 'transparent', width: '0%' }
    if (password.length < 6) return { label: 'Weak', color: '#EF4444', width: '25%' }
    if (password.length < 8) return { label: 'Fair', color: '#F59E0B', width: '50%' }
    if (/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) {
      return { label: 'Strong', color: '#059669', width: '100%' }
    }
    return { label: 'Good', color: '#6366F1', width: '75%' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--primary)' }}>
          <Shirt className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>LaundryOS</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Join Indore&apos;s smartest laundry service</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full name</label>
              <input type="text" value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Rahul Sharma" className="input-base" autoComplete="name" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email address</label>
              <input type="email" value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="rahul@example.com" className="input-base" autoComplete="email" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone number</label>
              <div className="flex gap-2">
                <span className="input-base w-16 text-center shrink-0 cursor-default" style={{ color: 'var(--text-muted)' }}>+91</span>
                <input type="tel" value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210" className="input-base flex-1" inputMode="numeric" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" className="input-base pr-10" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, background: strength.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              <div className="relative">
                <input type="password" value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" className="input-base pr-10" autoComplete="new-password" required />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                      : <span className="text-xs" style={{ color: 'var(--error)' }}>✗</span>}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Referral code <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <input type="text" value={referralCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234" className="input-base uppercase tracking-wider" maxLength={8} />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
