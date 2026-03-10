// src/app/admin/riders/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Bike, MapPin, Star, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Riders' }

export default async function AdminRidersPage() {
  const adminClient = createAdminClient()
  const { data: riders } = await adminClient
    .from('riders')
    .select('*, zone:zones(name)')
    .order('created_at', { ascending: false })

  type RiderRow = { id: string; name: string; phone: string; is_active: boolean; is_available: boolean; rating: number; total_deliveries: number; zone: { name: string } | { name: string }[] | null }
  const rows = (riders || []) as unknown as RiderRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Riders</h1>
        <Link href="/admin/riders/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          <Plus className="w-4 h-4" /> Add Rider
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total', value: rows.length, color: '#6366F1' },
          { label: 'Active', value: rows.filter((r) => r.is_active).length, color: '#059669' },
          { label: 'Available', value: rows.filter((r) => r.is_available).length, color: '#F59E0B' },
        ].map((stat) => (
          <div key={stat.label} className="admin-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="admin-card rounded-xl p-12 text-center">
          <Bike className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#6366F1' }} />
          <p style={{ color: '#64748B' }}>No riders yet. Add your first rider.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {rows.map((rider) => {
            const zone = first(rider.zone)
            return (
              <Link key={rider.id} href={`/admin/riders/${rider.id}`}>
                <div className="admin-card rounded-xl p-4 cursor-pointer"
                  style={{ borderColor: rider.is_active ? '#1E2130' : '#374151' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                        {rider.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#F1F5F9' }}>{rider.name}</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>{rider.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rider.is_available
                        ? <ToggleRight className="w-6 h-6" style={{ color: '#059669' }} />
                        : <ToggleLeft className="w-6 h-6" style={{ color: '#64748B' }} />
                      }
                      <ChevronRight className="w-4 h-4" style={{ color: '#64748B' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {zone?.name || 'No zone'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                      {rider.rating.toFixed(1)}
                    </div>
                    <span>{rider.total_deliveries} deliveries</span>
                    <span className="px-2 py-0.5 rounded-full"
                      style={{
                        background: rider.is_active ? 'rgba(5,150,105,0.2)' : 'rgba(100,116,139,0.2)',
                        color: rider.is_active ? '#059669' : '#94A3B8',
                      }}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
