import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Bike, MapPin, Plus, Star } from 'lucide-react'
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
    <div className="mx-auto max-w-7xl">
      <section className="admin-card rounded-[28px] p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="app-kicker">Fleet</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Rider operations</h1>
            <p className="mt-2 text-sm" style={{ color: '#94A3B8' }}>Monitor availability, activity, and service quality in one cleaner fleet view.</p>
          </div>
          <Link href="/admin/riders/new" className="btn-primary"><Plus className="h-4 w-4" /> Add rider</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total riders', value: rows.length },
            { label: 'Active riders', value: rows.filter((r) => r.is_active).length },
            { label: 'Available now', value: rows.filter((r) => r.is_available).length },
          ].map((stat) => (
            <div key={stat.label} className="admin-card rounded-[22px] p-5">
              <div className="text-3xl font-extrabold tracking-tight text-white">{stat.value}</div>
              <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.length === 0 ? (
          <div className="admin-card rounded-[28px] p-12 text-center lg:col-span-2">
            <Bike className="mx-auto h-12 w-12 text-sky-300/70" />
            <p className="mt-3 text-sm" style={{ color: '#94A3B8' }}>No riders yet. Add your first rider to start dispatching jobs.</p>
          </div>
        ) : rows.map((rider) => {
          const zone = first(rider.zone)
          return (
            <Link key={rider.id} href={`/admin/riders/${rider.id}`} className="admin-card rounded-[28px] p-5 transition hover:bg-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="app-avatar" style={{ width: 48, height: 48, borderRadius: 18 }}>{rider.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="font-bold text-white">{rider.name}</div>
                    <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{rider.phone}</div>
                  </div>
                </div>
                <span className="status-pill" style={{ background: rider.is_available ? 'rgba(22,163,74,0.18)' : 'rgba(148,163,184,0.14)', color: rider.is_available ? '#86EFAC' : '#CBD5E1' }}>
                  {rider.is_available ? 'Available' : 'Offline'}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm" style={{ color: '#94A3B8' }}>
                  <div className="flex items-center gap-2 text-white"><MapPin className="h-4 w-4 text-sky-300" /> {zone?.name || 'No zone'}</div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm" style={{ color: '#94A3B8' }}>
                  <div className="flex items-center gap-2 text-white"><Star className="h-4 w-4 text-amber-300" /> {rider.rating.toFixed(1)} rating</div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm" style={{ color: '#94A3B8' }}>
                  <div className="text-white">{rider.total_deliveries} deliveries</div>
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
