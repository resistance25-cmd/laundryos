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
        const current = riderRes.data
        setRider(current)
        setName(current.name || '')
        setPhone(current.phone || '')
        setZoneId(current.zone_id || '')
        setVehicleType(current.vehicle_type || 'bike')
        setVehicleNumber(current.vehicle_number || '')
        setIsActive(current.is_active)
      }
      setZones(zonesRes.data || [])
      setLoading(false)
    }
    void load()
  }, [riderId, supabase])

  async function handleSave(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/riders/create', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId, name, phone, zoneId: zoneId || null, vehicleType: vehicleType as VehicleType, vehicleNumber: vehicleNumber || null, isActive }),
      })
      if (!res.ok) { toast.error('Failed to update'); return }
      toast.success('Rider updated')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-sky-300" /></div>
  if (!rider) return <div style={{ color: '#f87171' }}>Rider not found</div>

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => { window.location.href = '/admin/riders' }} className="app-icon-wrap" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{rider.name as string}</h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>{rider.total_deliveries as number} deliveries • {Number(rider.rating || 0).toFixed(1)} rating</p>
        </div>
      </div>

      <div className="admin-card rounded-[28px] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="admin-input w-full" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-input w-full" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Zone</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="admin-input w-full">
              <option value="">No zone</option>
              {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Vehicle</label>
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="admin-input w-full">
              <option value="bike">Bike</option>
              <option value="cycle">Cycle</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Vehicle number</label>
            <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="admin-input w-full" />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#cbd5e1' }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-blue-500" />
          Rider is active and can receive assignments
        </label>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
