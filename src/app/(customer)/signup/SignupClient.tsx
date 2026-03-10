'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage, isValidEmail, isValidPhone } from '@/lib/utils'
import { ArrowRight, CheckCircle2, Loader2, Shirt, Sparkles, Star, Truck } from 'lucide-react'

const BENEFITS = [
  'Doorstep pickup and delivery across Indore',
  'Subscription-friendly pricing and live tracking',
  'Fast reorders with saved address and profile data',
]

export default function SignupClient() {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [referralCode, setReferralCode] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const supabase = createClient()
  const passwordStrength = useMemo(() => {
    if (password.length === 0) return { label: '', width: '0%' }
    if (password.length < 6) return { label: 'Weak', width: '32%' }
    if (password.length < 8) return { label: 'Fair', width: '58%' }
    if (/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) {
      return { label: 'Strong', width: '100%' }
    }
    return { label: 'Good', width: '78%' }
  }, [password])

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
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone,
            role: 'customer',
            referral_code: referralCode.trim() || undefined,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        window.location.href = '/login?message=Account+created.+Please+sign+in.'
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
    <div className="login-shell signup-shell">
      <div className="login-shell__glow login-shell__glow--a" />
      <div className="login-shell__glow login-shell__glow--b" />
      <div className="login-shell__noise" />

      <div className="login-layout">
        <section className="login-showcase reveal-up">
          <Link href="/" className="brand-mark brand-mark--light">
            <span className="brand-mark__badge"><Shirt className="h-5 w-5" /></span>
            <span>
              <strong>LaundryOS</strong>
              <em>Fresh care for busy households</em>
            </span>
          </Link>

          <div className="login-showcase__copy">
            <span className="eyebrow">Premium laundry subscription</span>
            <h1>Create your account and start booking in under a minute.</h1>
            <p>Built for repeat laundry, faster reorders, cleaner tracking, and a polished delivery experience.</p>
          </div>

          <div className="login-showcase__cards">
            <article className="floating-tile floating-tile--feature">
              <p>Member benefits</p>
              <ul>
                {BENEFITS.map((item) => (
                  <li key={item}><Sparkles className="h-4 w-4" /><span>{item}</span></li>
                ))}
              </ul>
            </article>
            <article className="floating-tile floating-tile--feature delay-2">
              <p>Why people switch</p>
              <ul>
                <li><Truck className="h-4 w-4" /><span>Faster pickups around Indore</span></li>
                <li><Star className="h-4 w-4" /><span>Consistent garment finishing</span></li>
                <li><CheckCircle2 className="h-4 w-4" /><span>Simple plans and cleaner support</span></li>
              </ul>
            </article>
          </div>
        </section>

        <section className="login-panel reveal-up delay-1">
          <div className="login-panel__header">
            <span className="eyebrow eyebrow--dark">Customer onboarding</span>
            <h2>Create your account</h2>
            <p>Customers stay in the customer app. Admins and riders still route automatically from the same sign-in screen.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form signup-form">
            <label className="field-shell">
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="input-base input-base--light"
                autoComplete="name"
                required
              />
            </label>

            <label className="field-shell">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="input-base input-base--light"
                autoComplete="email"
                required
              />
            </label>

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
                  inputMode="numeric"
                  required
                />
              </div>
            </label>

            <label className="field-shell">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input-base input-base--light"
                autoComplete="new-password"
                required
              />
              {password.length > 0 && (
                <div className="strength-bar">
                  <div className="strength-bar__fill" style={{ width: passwordStrength.width }} />
                  <span>{passwordStrength.label}</span>
                </div>
              )}
            </label>

            <label className="field-shell">
              <span>Confirm password</span>
              <div className="password-shell">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-base input-base--light"
                  autoComplete="new-password"
                  required
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <span className="password-shell__status"><CheckCircle2 className="h-4 w-4" /></span>
                )}
              </div>
            </label>

            <label className="field-shell">
              <span>Referral code <em>(optional)</em></span>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="input-base input-base--light"
                maxLength={8}
              />
            </label>

            {error && <div className="form-alert">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary login-panel__submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="login-panel__footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  )
}