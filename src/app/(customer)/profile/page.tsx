// src/app/(customer)/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, LogOut, Edit, MapPin, CreditCard, HelpCircle, Tag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, phone, wallet_balance, referral_code, created_at')
    .eq('id', session.user.id)
    .single()

  if (!user) redirect('/login?error=unauthorized')

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('status', 'delivered')

  return (
    <div className="customer-dark min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-6 safe-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white' }}
              >
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <p className="text-sm" style={{ color: '#94A3B8' }}>{user.phone}</p>
                {user.email && (
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{user.email}</p>
                )}
              </div>
            </div>
            <Link href="/profile/edit"
              className="p-2 rounded-full"
              style={{ background: '#1A1E30' }}
              aria-label="Edit profile">
              <Edit className="w-5 h-5" style={{ color: '#6366F1' }} />
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Orders', value: orderCount || 0 },
              { label: 'Wallet', value: `₹${user.wallet_balance}` },
              { label: 'Referrals', value: '—' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 text-center"
                style={{ background: '#10131F', border: '1px solid #1E2340' }}>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto space-y-3">
        {/* Menu */}
        {[
          { icon: <MapPin className="w-5 h-5" />, label: 'Saved Addresses', href: '/addresses', color: '#6366F1' },
          { icon: <CreditCard className="w-5 h-5" />, label: 'Subscription & Plans', href: '/subscription', color: '#8B5CF6' },
          { icon: <Tag className="w-5 h-5" />, label: 'My Referral Code', href: '/referral', color: '#F59E0B', meta: user.referral_code },
          { icon: <HelpCircle className="w-5 h-5" />, label: 'Support', href: '/support', color: '#10B981' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-4 rounded-2xl p-4"
              style={{ background: '#10131F', border: '1px solid #1E2340' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}20`, color: item.color }}>
                {item.icon}
              </div>
              <span className="flex-1 font-medium text-white">{item.label}</span>
              {item.meta && (
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#1A1E30', color: '#94A3B8' }}>
                  {item.meta}
                </span>
              )}
              <ChevronRight className="w-5 h-5" style={{ color: '#64748B' }} />
            </div>
          </Link>
        ))}

        {/* Sign out */}
        <SignOutButton />
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 safe-bottom glass-dark border-t" style={{ borderColor: '#1E2340' }}>
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {[
            { label: 'Home', href: '/dashboard', icon: '🏠' },
            { label: 'Book', href: '/book', icon: '➕' },
            { label: 'Orders', href: '/orders', icon: '📦' },
            { label: 'Profile', href: '/profile', icon: '👤', active: true },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2"
              style={{ color: item.active ? '#6366F1' : '#64748B' }}>
              <span>{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button type="submit"
        className="w-full flex items-center gap-4 rounded-2xl p-4 text-left"
        style={{ background: '#10131F', border: '1px solid #1E2340' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
          <LogOut className="w-5 h-5" />
        </div>
        <span className="font-medium" style={{ color: '#EF4444' }}>Sign Out</span>
      </button>
    </form>
  )
}
