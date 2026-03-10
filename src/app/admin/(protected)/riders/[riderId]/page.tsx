// src/app/admin/riders/[riderId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Zone, VehicleType } from '@/types'

export default function RiderDetailPage({ params }: { params: { riderId: string } }) {
  const { riderId } = params
  const [rider, setRider] = useState<Record<string, unknown> | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<string>('bike')
  const [vehicleNumber, setVehicleNumber] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const [riderRes, zonesRes] = await Promise.all([
        supabase.from('riders').select('*, zone:zones(name)').eq('id', riderId).single(),
        supabase.from('zones').select('*').eq('is_active', true),
      ])

      if (riderRes.data) {
        const r = riderRes.data
        setRider(r)
        setName(r.name || '')
        setPhone(r.phone || '')
        setZoneId(r.zone_id || '')
        setVehicleType(r.vehicle_type || 'bike')
        setVehicleNumber(r.vehicle_number || '')
        setIsActive(r.is_active)
      }
      setZones(zonesRes.data || [])
      setLoading(false)
    }
    void load()
  }, [riderId])

  async function handleSave(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      // Use admin API route for this update
      const res = await fetch('/api/riders/create', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId, name, phone, zoneId: zoneId || null, vehicleType: vehicleType as VehicleType, vehicleNumber: vehicleNumber || null, isActive }),
      })
      if (!res.ok) { toast.error('Failed to update'); return }
      toast.success('Rider updated!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} /></div>
  if (!rider) return <div style={{ color: '#EF4444' }}>Rider not found</div>

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { window.location.href = '/admin/riders' }}
          className="p-2 rounded-lg" style={{ background: '#13151C', color: '#94A3B8' }} aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{rider.name as string}</h1>
          <p className="text-xs" style={{ color: '#64748B' }}>{rider.total_deliveries as number} deliveries · ⭐ {(rider.rating as number).toFixed(1)}</p>
        </div>
      </div>

      <div className="admin-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Name</label>
            <input type="text" value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="admin-input w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Phone</label>
            <input type="tel" value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              className="admin-input w-full" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Zone</label>
          <select value={zoneId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setZoneId(e.target.value)}
            className="admin-input w-full">
            <option value="">No zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Vehicle</label>
            <select value={vehicleType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVehicleType(e.target.value)}
              className="admin-input w-full">
              <option value="bike">Bike</option>
              <option value="cycle">Cycle</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#94A3B8' }}>Vehicle Number</label>
            <input type="text" value={vehicleNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVehicleNumber(e.target.value)}
              className="admin-input w-full" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-indigo-500" />
          <span className="text-sm" style={{ color: '#CBD5E1' }}>Rider is active</span>
        </label>
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
