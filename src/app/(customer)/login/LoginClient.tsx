'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage, isValidEmail, isValidPhone } from '@/lib/utils'
import {
  ArrowRight,
  Bike,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Shirt,
  Sparkles,
  TimerReset,
  Truck,
} from 'lucide-react'

type LoginMethod = 'email' | 'phone'

const HERO_POINTS = [
  { icon: <Truck className="h-4 w-4" />, label: 'Doorstep pickup in minutes' },
  { icon: <TimerReset className="h-4 w-4" />, label: 'Real-time order tracking' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Premium wash-care finish' },
]

const ROLE_HINTS = [
  { icon: <Shirt className="h-4 w-4" />, label: 'Customers land on their dashboard' },
  { icon: <ShieldCheck className="h-4 w-4" />, label: 'Admins route into the control center' },
  { icon: <Bike className="h-4 w-4" />, label: 'Riders jump straight to active jobs' },
]

export default function LoginClient() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const supabase = createClient()
  const subtitle = useMemo(() => (
    loginMethod === 'email'
      ? 'Use the same sign-in screen for customer, admin, and rider access.'
      : 'Phone login is perfect for customers who want quick repeat bookings.'
  ), [loginMethod])

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
        ? await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
        : await supabase.auth.signInWithPassword({ phone: `+91${phone}`, password })

      if (signInError) {
        setError(signInError.message)
        return
      }

      window.location.href = '/auth/confirm'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-shell__glow login-shell__glow--a" />
      <div className="login-shell__glow login-shell__glow--b" />
      <div className="login-shell__noise" />

      <div className="login-layout">
        <section className="login-showcase reveal-up">
          <Link href="/" className="brand-mark brand-mark--light">
            <span className="brand-mark__badge"><Shirt className="h-5 w-5" /></span>
            <span>
              <strong>LaundryOS</strong>
              <em>Fast pickup. Premium care.</em>
            </span>
          </Link>

          <div className="login-showcase__copy">
            <span className="eyebrow">Inspired by premium laundry brands</span>
            <h1>Modern laundry, one sign-in, every role routed automatically.</h1>
            <p>{subtitle}</p>
          </div>

          <div className="login-showcase__metrics">
            <div>
              <strong>10k+</strong>
              <span>garments processed</span>
            </div>
            <div>
              <strong>4.9/5</strong>
              <span>customer rating</span>
            </div>
            <div>
              <strong>24 hrs</strong>
              <span>express turnaround</span>
            </div>
          </div>

          <div className="login-showcase__cards">
            <article className="floating-tile floating-tile--feature">
              <p>What you get</p>
              <ul>
                {HERO_POINTS.map((item) => (
                  <li key={item.label}>{item.icon}<span>{item.label}</span></li>
                ))}
              </ul>
            </article>
            <article className="floating-tile floating-tile--feature delay-2">
              <p>Role-smart routing</p>
              <ul>
                {ROLE_HINTS.map((item) => (
                  <li key={item.label}>{item.icon}<span>{item.label}</span></li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="login-panel reveal-up delay-1">
          <div className="login-panel__header">
            <span className="eyebrow eyebrow--dark">Secure access</span>
            <h2>Sign in to continue</h2>
            <p>Use your existing credentials. We will send you to the right portal after verification.</p>
          </div>

          <div className="login-methods">
            {(['email', 'phone'] as LoginMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setLoginMethod(method)
                  setError('')
                }}
                className={loginMethod === method ? 'is-active' : ''}
              >
                {method === 'email' ? 'Email access' : 'Phone access'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {loginMethod === 'email' ? (
              <label className="field-shell">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base input-base--light"
                  autoComplete="email"
                  required
                />
              </label>
            ) : (
              <label className="field-shell">
                <span>Phone number</span>
                <div className="phone-shell">
                  <span className="phone-shell__prefix">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-base input-base--light"
                    autoComplete="tel"
                    inputMode="numeric"
                    required
                  />
                </div>
              </label>
            )}

            <label className="field-shell">
              <span>Password</span>
              <div className="password-shell">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-base input-base--light"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-shell__toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="login-panel__actions">
              <Link href="/auth/reset-password">Forgot password?</Link>
              <span>Protected by Supabase Auth</span>
            </div>

            {error && <div className="form-alert">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary login-panel__submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Verifying account...' : 'Continue to your portal'}
            </button>
          </form>

          <p className="login-panel__footer">
            New here? <Link href="/signup">Create your account</Link>
          </p>
        </section>
      </div>
    </div>
  )
}