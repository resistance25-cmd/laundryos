// src/app/(customer)/auth/confirm/page.tsx
// Polls for session and verifies user is in users table
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Shirt } from 'lucide-react'

export default function AuthConfirmPage() {
  const [message, setMessage] = useState<string>('Verifying your account...')
  const supabase = createClient()

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    async function checkSession(): Promise<void> {
      attempts++

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (attempts < maxAttempts) {
          setTimeout(checkSession, 500)
          return
        }
        window.location.href = '/login?error=Session+not+found'
        return
      }

      // Verify this user exists in the users table (customer role check)
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setMessage('Welcome to LaundryOS!')
        window.location.href = '/dashboard'
      } else {
        // User not in users table — could be an admin/rider trying customer login
        await supabase.auth.signOut()
        window.location.href = '/login?error=unauthorized'
      }
    }

    checkSession()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
        style={{ background: 'var(--primary)' }}>
        <Shirt className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
        <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
    </div>
  )
}
