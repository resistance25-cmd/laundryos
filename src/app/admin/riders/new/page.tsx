// src/app/admin/riders/new/page.tsx
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { ChevronLeft, Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Zone, VehicleType } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function NewRiderPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike')
  const [vehicleNumber, setVehicleNumber] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const { data } = await supabase.from('zones').select('*').eq('is_active', true)
      setZones(data || [])
    }
    void load()
  }, [])

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (loading) return
    if (!email || !password || !name || !phone) { toast.error('All fields required'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/riders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, zoneId: zoneId || undefined, vehicleType, vehicleNumber: vehicleNumber || undefined }),
      })

      const data = await res.json() as { error?: string; riderId?: string }

      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to create rider')
        return
      }

      toast.success('Rider account created!')
      window.location.href = '/admin/riders'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { window.location.href = '/admin/riders' }}
          className="p-2 rounded-lg" style={{ background: '#13151C', color: '#94A3B8' }} aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>Add New Rider</h1>
      </div>

      <form onSubmit={handleCreate} className="admin-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Full Name *</label>
            <input type="text" value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Rahul Kumar" className="admin-input w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Phone *</label>
            <input type="tel" value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210" className="admin-input w-full" inputMode="numeric" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Email *</label>
          <input type="email" value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="rider@laundreos.in" className="admin-input w-full" required />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Password *</label>
          <input type="password" value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Min. 8 characters" className="admin-input w-full" required minLength={8} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Zone</label>
          <select value={zoneId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneId(e.target.value)}
            className="admin-input w-full">
            <option value="">Select zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Vehicle</label>
            <select value={vehicleType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVehicleType(e.target.value as VehicleType)}
              className="admin-input w-full">
              <option value="bike">Bike</option>
              <option value="cycle">Cycle</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Vehicle Number</label>
            <input type="text" value={vehicleNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="MP09 AB 1234" className="admin-input w-full" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white mt-2"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Rider Account</>}
        </button>
      </form>
    </div>
  )
}
