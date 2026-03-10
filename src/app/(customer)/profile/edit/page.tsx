'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

export default function EditProfilePage() {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setName(data.name || '')
        setEmail(data.email || '')
      }
      setLoading(false)
    }
    void load()
  }, [supabase])

  async function handleSave(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { error } = await supabase
        .from('users')
        .update({ name: name.trim(), email: email.trim() || null })
        .eq('id', session.user.id)

      if (error) { toast.error('Failed to update profile'); return }

      toast.success('Profile updated')
      window.location.href = '/profile'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="app-screen app-screen--customer flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--app-primary)' }} /></div>
  }

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone flex items-center gap-3">
          <button onClick={() => { window.location.href = '/profile' }} className="app-icon-wrap" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="app-kicker">Profile edit</span>
            <h1 className="app-title text-2xl">Update your details</h1>
          </div>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        <form onSubmit={handleSave} className="app-panel space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Full name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" autoComplete="name" required />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark" autoComplete="email" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save changes</>}
          </button>
        </form>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}
