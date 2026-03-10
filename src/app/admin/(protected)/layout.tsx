// src/app/admin/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSideNav from './AdminSideNav'
import AdminMobileNav from './AdminMobileNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin — LaundryOS', template: '%s | Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/admin/login')

  // Full admin role check — not just session
  const { data: adminProfile } = await supabase
    .from('admins')
    .select('id, name, email, is_super_admin')
    .eq('id', session.user.id)
    .single()

  if (!adminProfile) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=unauthorized')
  }

  return (
    <div className="admin-panel min-h-screen flex">
      {/* Sidebar — desktop */}
      <AdminSideNav admin={adminProfile} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile nav */}
        <AdminMobileNav admin={adminProfile} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
