// src/app/admin/login/AdminLoginClient.tsx
'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginClient() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const supabase = createClient()

  async function handleLogin(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        toast.error('Invalid credentials')
        return
      }

      // Verify admin role — check admins table
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Session error'); return }

      const { data: adminProfile } = await supabase
        .from('admins')
        .select('id, is_super_admin')
        .eq('id', session.user.id)
        .single()

      if (!adminProfile) {
        await supabase.auth.signOut()
        toast.error('Access denied. Admin accounts only.')
        return
      }

      // CRITICAL: window.location.href — never router.push()
      window.location.href = '/admin'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0F1117', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo — intentionally minimal, no LaundryOS branding shown */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <ShieldCheck className="w-7 h-7" style={{ color: '#6366F1' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>Operations Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Authorized access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="admin@laundreos.in"
              style={{
                background: '#13151C',
                border: '1px solid #1E2130',
                borderRadius: '8px',
                color: '#F1F5F9',
                padding: '10px 12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                width: '100%',
                outline: 'none',
              }}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  background: '#13151C',
                  border: '1px solid #1E2130',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  padding: '10px 40px 10px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%',
                  outline: 'none',
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#64748B' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
