'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Sparkles, ShieldCheck, Bike, Shirt } from 'lucide-react'

type PortalRole = 'admin' | 'rider' | 'customer' | 'unknown'

const ROLE_COPY: Record<PortalRole, { label: string; icon: JSX.Element | null }> = {
  admin: { label: 'Routing you to the operations console...', icon: <ShieldCheck className="h-5 w-5" /> },
  rider: { label: 'Routing you to the rider hub...', icon: <Bike className="h-5 w-5" /> },
  customer: { label: 'Preparing your customer dashboard...', icon: <Shirt className="h-5 w-5" /> },
  unknown: { label: 'Verifying your access...', icon: <Sparkles className="h-5 w-5" /> },
}

function setPortalRole(role: Exclude<PortalRole, 'unknown'>): void {
  const secure = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `portal_role=${role}; path=/; max-age=2592000; samesite=lax${secure}`
}

export default function AuthConfirmPage() {
  const [message, setMessage] = useState<string>(ROLE_COPY.unknown.label)
  const [role, setRole] = useState<PortalRole>('unknown')
  const supabase = createClient()

  useEffect(() => {
    let active = true
    let attempts = 0
    const maxAttempts = 12

    async function resolveRole(userId: string): Promise<PortalRole> {
      const { data: adminProfile } = await supabase.from('admins').select('id').eq('id', userId).maybeSingle()
      if (adminProfile) return 'admin'

      const { data: riderProfile } = await supabase.from('riders').select('id').eq('id', userId).maybeSingle()
      if (riderProfile) return 'rider'

      const { data: customerProfile } = await supabase.from('users').select('id').eq('id', userId).maybeSingle()
      if (customerProfile) return 'customer'

      return 'unknown'
    }

    async function checkSession(): Promise<void> {
      attempts += 1
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (attempts < maxAttempts && active) {
          window.setTimeout(checkSession, 400)
          return
        }

        window.location.href = '/login?error=Session+not+found'
        return
      }

      const nextRole = await resolveRole(session.user.id)
      if (!active) return

      setRole(nextRole)
      setMessage(ROLE_COPY[nextRole].label)

      if (nextRole === 'unknown') {
        await supabase.auth.signOut()
        window.location.href = '/login?error=unauthorized'
        return
      }

      setPortalRole(nextRole)

      const redirectUrl = nextRole === 'admin'
        ? '/admin'
        : nextRole === 'rider'
          ? '/rider/dashboard'
          : '/dashboard'

      window.location.href = redirectUrl
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className="auth-stage">
      <div className="auth-stage__grid" />
      <div className="auth-stage__glow auth-stage__glow--primary" />
      <div className="auth-stage__glow auth-stage__glow--secondary" />

      <div className="auth-stage__panel reveal-up">
        <div className="auth-stage__badge">
          {ROLE_COPY[role].icon}
          <span>Secure sign-in</span>
        </div>
        <div className="auth-stage__spinner">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h1 className="auth-stage__title">One login, smart routing.</h1>
        <p className="auth-stage__text">{message}</p>
      </div>
    </div>
  )
}