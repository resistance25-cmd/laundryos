// src/app/rider/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Star, Bike, MapPin, LogOut } from 'lucide-react'
import type { Metadata } from 'next'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Profile' }

export default async function RiderProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/rider/login')

  const { data: riderData } = await supabase
    .from('riders')
    .select('*, zone:zones(name)')
    .eq('id', session.user.id)
    .single()

  if (!riderData) redirect('/rider/login')

  type RiderRow = { id: string; name: string; phone: string; rating: number; total_deliveries: number; vehicle_type: string | null; vehicle_number: string | null; zone: { name: string } | { name: string }[] | null }
  const rider = riderData as unknown as RiderRow
  const zone = first(rider.zone)

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
            {rider.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F0FDF4' }}>{rider.name}</h1>
            <p className="text-sm" style={{ color: '#64748B' }}>{rider.phone}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
              <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
                {rider.rating.toFixed(1)} rating
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Deliveries', value: rider.total_deliveries, color: '#10B981' },
            { label: 'Rating', value: `${rider.rating.toFixed(1)} ⭐`, color: '#F59E0B' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4 text-center"
              style={{ background: '#13202E', border: '1px solid #1E3040' }}>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#13202E', border: '1px solid #1E3040' }}>
          {[
            { icon: <MapPin className="w-4 h-4" />, label: 'Zone', value: zone?.name || 'Not assigned' },
            { icon: <Bike className="w-4 h-4" />, label: 'Vehicle', value: `${rider.vehicle_type ? rider.vehicle_type.charAt(0).toUpperCase() + rider.vehicle_type.slice(1) : 'Bike'}${rider.vehicle_number ? ` · ${rider.vehicle_number}` : ''}` },
          ].map((row, i) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: i < 1 ? '1px solid #1E3040' : 'none' }}>
              <span style={{ color: '#10B981' }}>{row.icon}</span>
              <div>
                <p className="text-xs" style={{ color: '#64748B' }}>{row.label}</p>
                <p className="text-sm font-medium" style={{ color: '#F0FDF4' }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="w-full flex items-center gap-3 rounded-2xl p-4"
            style={{ background: '#13202E', border: '1px solid #1E3040' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <LogOut className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <span className="font-semibold" style={{ color: '#EF4444' }}>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  )
}
