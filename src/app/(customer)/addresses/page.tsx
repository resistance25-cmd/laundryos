'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Address, Zone } from '@/types'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [userId, setUserId] = useState<string>('')
  const [showForm, setShowForm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [label, setLabel] = useState<string>('Home')
  const [line1, setLine1] = useState<string>('')
  const [line2, setLine2] = useState<string>('')
  const [landmark, setLandmark] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [pincode, setPincode] = useState<string>('')
  const [isDefault, setIsDefault] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUserId(session.user.id)

      const [addrsRes, zonesRes] = await Promise.all([
        supabase.from('addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false }),
        supabase.from('zones').select('*').eq('is_active', true),
      ])
      setAddresses(addrsRes.data || [])
      setZones(zonesRes.data || [])
      setLoading(false)
    }
    void load()
  }, [supabase])

  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!line1.trim()) { toast.error('Please enter address line 1'); return }
    setSaving(true)

    try {
      if (isDefault) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
      }

      const { data, error } = await supabase.from('addresses').insert({
        user_id: userId,
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        landmark: landmark.trim() || null,
        zone_id: zoneId || null,
        city: 'Indore',
        pincode: pincode.trim() || null,
        is_default: isDefault,
      }).select().single()

      if (error) { toast.error('Failed to save address'); return }

      setAddresses((prev) => isDefault ? [data, ...prev.map((a) => ({ ...a, is_default: false }))] : [...prev, data])
      toast.success('Address added')
      resetForm()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    const { error } = await supabase.from('addresses').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    toast.success('Address removed')
  }

  async function handleSetDefault(id: string): Promise<void> {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
    toast.success('Default address updated')
  }

  function resetForm() {
    setLabel('Home')
    setLine1('')
    setLine2('')
    setLandmark('')
    setZoneId('')
    setPincode('')
    setIsDefault(false)
    setShowForm(false)
  }

  if (loading) {
    return <div className="app-screen app-screen--customer flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--app-primary)' }} /></div>
  }

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.href = '/profile' }} className="app-icon-wrap" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="app-kicker">Customer addresses</span>
              <h1 className="app-title text-2xl">Saved pickup locations</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        {addresses.length === 0 && !showForm ? (
          <div className="app-card app-empty">
            <MapPin className="h-12 w-12" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>No saved addresses yet</h2>
            <p className="app-note mt-2">Add home, office, or a backup pickup point so booking stays fast on mobile.</p>
          </div>
        ) : null}

        <div className="app-list">
          {addresses.map((addr) => (
            <div key={addr.id} className="app-card block">
              <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
                <div className="flex items-start gap-3">
                  <div className="app-icon-wrap"><MapPin className="h-5 w-5" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold" style={{ color: 'var(--app-text)' }}>{addr.label}</p>
                      {addr.is_default ? <span className="status-pill" style={{ background: 'var(--app-primary-soft)', color: 'var(--app-primary)' }}>Default</span> : null}
                    </div>
                    <p className="app-note mt-2">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    {addr.landmark ? <p className="app-meta mt-1 text-sm">Near {addr.landmark}</p> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!addr.is_default ? (
                    <button onClick={() => void handleSetDefault(addr.id)} className="app-icon-wrap" aria-label="Set as default">
                      <Check className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button onClick={() => void handleDelete(addr.id)} className="app-icon-wrap" style={{ background: 'rgba(239,68,68,0.14)', color: 'var(--app-danger)' }} aria-label="Delete address">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm ? (
          <form onSubmit={handleAdd} className="app-panel mt-5 space-y-4">
            <div>
              <span className="app-kicker">Add address</span>
              <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--app-text)' }}>New pickup point</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['Home', 'Office', 'Other'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLabel(option)}
                  className="rounded-full px-3 py-2 text-sm font-semibold"
                  style={{
                    background: label === option ? 'var(--app-primary-soft)' : 'var(--app-surface-muted)',
                    color: label === option ? 'var(--app-primary)' : 'var(--app-text-muted)',
                    border: `1px solid ${label === option ? 'var(--app-primary)' : 'var(--app-border)'}`,
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <input type="text" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="input-dark" required />
            <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Address line 2" className="input-dark" />
            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark" className="input-dark" />
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="input-dark">
              <option value="">Select area</option>
              {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
            </select>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" className="input-dark" inputMode="numeric" maxLength={6} />

            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--app-text-muted)' }}>
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 accent-blue-600" />
              Set as default pickup address
            </label>

            <div className="flex gap-3">
              <button type="button" onClick={resetForm} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save address'}
              </button>
            </div>
          </form>
        ) : null}
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}
