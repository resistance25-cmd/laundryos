import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bike, LogOut, MapPin, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Profile' }

export default async function RiderProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: riderData } = await supabase
    .from('riders')
    .select('*, zone:zones(name)')
    .eq('id', session.user.id)
    .single()

  if (!riderData) redirect('/login')

  type RiderRow = { id: string; name: string; phone: string; rating: number; total_deliveries: number; vehicle_type: string | null; vehicle_number: string | null; zone: { name: string } | { name: string }[] | null }
  const rider = riderData as unknown as RiderRow
  const zone = first(rider.zone)

  return (
    <div className="app-screen app-screen--rider">
      <header className="app-topbar safe-top" style={{ background: 'rgba(8,19,29,0.72)', borderBottomColor: 'rgba(148,163,184,0.12)' }}>
        <div className="app-topbar__inner app-topbar__inner--phone">
          <span className="app-kicker">Rider account</span>
          <h1 className="app-title text-white">Profile and rider stats</h1>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        <section className="rider-surface rounded-[30px] p-6">
          <div className="flex items-center gap-4">
            <div className="app-avatar" style={{ width: 64, height: 64 }}>{rider.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{rider.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{rider.phone}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300">
                <Star className="h-4 w-4" /> {rider.rating.toFixed(1)} rating
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Total deliveries</div>
              <div className="mt-2 text-3xl font-extrabold text-white">{rider.total_deliveries}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">Current vehicle</div>
              <div className="mt-2 text-base font-semibold text-white">{`${rider.vehicle_type ? rider.vehicle_type.charAt(0).toUpperCase() + rider.vehicle_type.slice(1) : 'Bike'}${rider.vehicle_number ? ` • ${rider.vehicle_number}` : ''}`}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-4">
          <div className="rider-surface rounded-[28px] p-5">
            <div className="flex items-center gap-3 text-white"><MapPin className="h-4 w-4 text-emerald-300" /> Zone</div>
            <div className="mt-2 text-sm text-slate-400">{zone?.name || 'Not assigned'}</div>
          </div>
          <div className="rider-surface rounded-[28px] p-5">
            <div className="flex items-center gap-3 text-white"><Bike className="h-4 w-4 text-sky-300" /> Equipment</div>
            <div className="mt-2 text-sm text-slate-400">Keep your listed vehicle and route readiness updated with ops if anything changes.</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full rounded-[28px] border border-red-400/20 bg-red-500/10 p-5 text-left text-red-300 transition hover:bg-red-500/15">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <div>
                  <div className="font-bold">Sign out</div>
                  <div className="mt-1 text-sm text-red-200/80">Return to the shared login screen.</div>
                </div>
              </div>
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
