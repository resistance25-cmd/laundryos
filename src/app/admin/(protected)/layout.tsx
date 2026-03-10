import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSideNav from './AdminSideNav'
import AdminMobileNav from './AdminMobileNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin | LaundryOS', template: '%s | Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('admins')
    .select('id, name, email, is_super_admin')
    .eq('id', session.user.id)
    .single()

  if (!adminProfile) {
    await supabase.auth.signOut()
    redirect('/login?error=unauthorized')
  }

  return (
    <div className="admin-panel min-h-screen flex">
      <AdminSideNav admin={adminProfile} />
      <div className="flex-1 min-h-screen lg:ml-72">
        <AdminMobileNav admin={adminProfile} />
        <main className="px-4 pb-24 pt-4 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}

