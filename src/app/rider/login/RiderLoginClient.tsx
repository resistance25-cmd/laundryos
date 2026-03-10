// src/app/rider/login/RiderLoginClient.tsx
'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Bike } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RiderLoginClient() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const supabase = createClient()
  const roleCookie = `portal_role=rider; path=/; max-age=2592000; samesite=lax${
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : ''
  }`

  async function handleLogin(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) { toast.error('Invalid credentials'); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Session error'); return }

      const { data: rider } = await supabase
        .from('riders')
        .select('id, is_active')
        .eq('id', session.user.id)
        .single()

      if (!rider) {
        await supabase.auth.signOut()
        toast.error('No rider account found')
        return
      }
      if (!rider.is_active) {
        await supabase.auth.signOut()
        toast.error('Your account is inactive. Contact admin.')
        return
      }

      document.cookie = roleCookie
      window.location.href = '/rider/dashboard'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <Bike className="w-7 h-7" style={{ color: '#10B981' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#F0FDF4' }}>Rider Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>LaundryOS Delivery Team</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>Email</label>
            <input id="email" type="email" value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter email"
              style={{
                background: '#13202E',
                border: '1px solid #1E3040',
                borderRadius: '8px',
                color: '#F0FDF4',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                width: '100%',
                outline: 'none',
              }}
              autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  background: '#13202E',
                  border: '1px solid #1E3040',
                  borderRadius: '8px',
                  color: '#F0FDF4',
                  padding: '10px 40px 10px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  outline: 'none',
                }}
                autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#64748B' }} aria-label="Toggle password">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
