// src/app/(customer)/profile/edit/page.tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

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
  }, [])

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

      toast.success('Profile updated!')
      window.location.href = '/profile'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="customer-dark min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} />
      </div>
    )
  }

  return (
    <div className="customer-dark min-h-screen">
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => { window.location.href = '/profile' }}
            className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Edit Profile</h1>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: '#CBD5E1' }}>
              Full name
            </label>
            <input id="name" type="text" value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="input-dark" autoComplete="name" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#CBD5E1' }}>
              Email address
            </label>
            <input id="email" type="email" value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="input-dark" autoComplete="email" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full mt-2 py-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}
