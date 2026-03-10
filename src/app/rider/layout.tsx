import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import RiderBottomNav from '@/components/app/RiderBottomNav'

export const metadata: Metadata = {
  title: { default: 'Rider | LaundryOS', template: '%s | Rider' },
  robots: { index: false, follow: false },
}

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: riderProfile } = await supabase
    .from('riders')
    .select('id, name, is_active, is_available')
    .eq('id', session.user.id)
    .single()

  if (!riderProfile || !riderProfile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=inactive')
  }

  return (
    <div className="rider-panel min-h-screen">
      {children}
      <RiderBottomNav />
    </div>
  )
}

