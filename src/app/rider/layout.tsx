import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

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
    <div
      className="min-h-screen"
      style={{
        background: '#0F172A',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        color: '#F0FDF4',
      }}
    >
      {children}

      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom z-10"
        style={{ background: '#13202E', borderTop: '1px solid #1E3040' }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {[
            { label: 'Home', href: '/rider/dashboard', icon: 'Home' },
            { label: 'Orders', href: '/rider/orders', icon: 'Jobs' },
            { label: 'Profile', href: '/rider/profile', icon: 'Me' },
          ].map((item) => (
            <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-6 py-2">
              <span className="text-sm font-semibold">{item.icon}</span>
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}