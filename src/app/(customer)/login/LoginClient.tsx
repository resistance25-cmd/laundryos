'use client'
// src/app/(customer)/login/LoginClient.tsx

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isValidPhone, isValidEmail, getErrorMessage } from '@/lib/utils'
import { Loader2, Shirt, Eye, EyeOff } from 'lucide-react'

type LoginMethod = 'email' | 'phone'

export default function LoginClient() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const supabase = createClient()
  const roleCookie = `portal_role=customer; path=/; max-age=2592000; samesite=lax${
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : ''
  }`

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError('')

    if (loginMethod === 'email' && !isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (loginMethod === 'phone' && !isValidPhone(phone)) {
      setError('Please enter a valid 10-digit Indian phone number')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: signInError } = loginMethod === 'email'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithPassword({ phone: '+91' + phone, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Never use router.push() after auth
      document.cookie = roleCookie
      window.location.href = '/auth/confirm'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--primary)' }}>
          <Shirt className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          LaundryOS
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Sign in to manage your laundry
          </p>

          <div className="flex rounded-xl p-1 mb-6 gap-1"
            style={{ background: 'var(--bg-elevated)' }}>
            {(['email', 'phone'] as LoginMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => { setLoginMethod(method); setError('') }}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize"
                style={{
                  background: loginMethod === method ? 'var(--primary)' : 'transparent',
                  color: loginMethod === method ? '#fff' : 'var(--text-muted)',
                }}
              >
                {method}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'email' ? (
              <div>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                  autoComplete="email"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Phone number
                </label>
                <div className="flex gap-2">
                  <span className="input-base w-16 text-center shrink-0 cursor-default"
                    style={{ color: 'var(--text-muted)' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-base flex-1"
                    autoComplete="tel"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link href="/auth/reset-password"
                  className="text-xs font-medium"
                  style={{ color: 'var(--primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold" style={{ color: 'var(--primary)' }}>
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
