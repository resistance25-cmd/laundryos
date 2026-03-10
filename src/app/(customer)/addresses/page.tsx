// src/app/(customer)/addresses/page.tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Trash2, Check, ChevronLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Address, Zone } from '@/types'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [userId, setUserId] = useState<string>('')
  const [showForm, setShowForm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  // Form state
  const [label, setLabel] = useState<string>('Home')
  const [line1, setLine1] = useState<string>('')
  const [line2, setLine2] = useState<string>('')
  const [landmark, setLandmark] = useState<string>('')
  const [area, setArea] = useState<string>('')
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
  }, [])

  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!line1.trim()) { toast.error('Please enter address line 1'); return }
    setSaving(true)

    try {
      // If setting as default, clear other defaults first
      if (isDefault) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
      }

      const { data, error } = await supabase.from('addresses').insert({
        user_id: userId,
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        landmark: landmark.trim() || null,
        area: area.trim() || null,
        zone_id: zoneId || null,
        city: 'Indore',
        pincode: pincode.trim() || null,
        is_default: isDefault,
      }).select().single()

      if (error) { toast.error('Failed to save address'); return }

      setAddresses((prev) => isDefault ? [data, ...prev.map(a => ({...a, is_default: false}))] : [...prev, data])
      toast.success('Address added!')
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
    setLabel('Home'); setLine1(''); setLine2(''); setLandmark('')
    setArea(''); setZoneId(''); setPincode(''); setIsDefault(false)
    setShowForm(false)
  }

  if (loading) {
    return <div className="customer-dark min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} />
    </div>
  }

  return (
    <div className="customer-dark min-h-screen pb-10">
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.href = '/profile' }}
              className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Addresses</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4">
        {/* Address list */}
        {addresses.length === 0 && !showForm && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#6366F1' }} />
            <p className="font-semibold text-white">No saved addresses</p>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Add an address for quick bookings</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-2xl p-4"
              style={{ background: '#10131F', border: `1.5px solid ${addr.is_default ? '#6366F1' : '#1E2340'}` }}>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: addr.is_default ? '#6366F1' : '#64748B' }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm">{addr.label}</p>
                    {addr.is_default && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>Default</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                  </p>
                  {addr.landmark && <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Near {addr.landmark}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!addr.is_default && (
                    <button onClick={() => void handleSetDefault(addr.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: '#1A1E30' }} aria-label="Set as default">
                      <Check className="w-4 h-4" style={{ color: '#64748B' }} />
                    </button>
                  )}
                  <button onClick={() => void handleDelete(addr.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#1A1E30' }} aria-label="Delete address">
                    <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="rounded-2xl p-5 space-y-4"
            style={{ background: '#10131F', border: '1.5px solid #6366F1' }}>
            <h3 className="font-semibold text-white">New Address</h3>

            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map((l) => (
                <button key={l} type="button" onClick={() => setLabel(l)}
                  className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: label === l ? 'rgba(99,102,241,0.2)' : '#1A1E30',
                    color: label === l ? '#818CF8' : '#64748B',
                    border: `1.5px solid ${label === l ? '#6366F1' : 'transparent'}`,
                  }}>
                  {l}
                </button>
              ))}
            </div>

            <input type="text" value={line1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLine1(e.target.value)}
              placeholder="Address line 1 *" className="input-dark" required />
            <input type="text" value={line2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLine2(e.target.value)}
              placeholder="Line 2 (optional)" className="input-dark" />
            <input type="text" value={landmark} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLandmark(e.target.value)}
              placeholder="Landmark (optional)" className="input-dark" />

            <select value={zoneId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneId(e.target.value)}
              className="input-dark">
              <option value="">Select area</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>

            <input type="text" value={pincode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPincode(e.target.value)}
              placeholder="Pincode" className="input-dark" inputMode="numeric" maxLength={6} />

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isDefault}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500" />
              <span className="text-sm" style={{ color: '#CBD5E1' }}>Set as default address</span>
            </label>

            <div className="flex gap-3">
              <button type="button" onClick={resetForm} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
