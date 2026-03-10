import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, CreditCard, Edit, HelpCircle, LogOut, MapPin, Tag, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

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
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone">
          <span className="app-kicker">Account</span>
          <h1 className="app-title">Profile and preferences</h1>
          <p className="app-subtitle">Manage your identity, wallet, saved addresses, plans, and support from one polished customer hub.</p>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        <section className="app-panel app-card--accent">
          <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
            <div className="flex items-center gap-4">
              <div className="app-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <h2 className="m-0 text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{user.name}</h2>
                <p className="app-note mt-1">{user.phone}</p>
                {user.email && <p className="app-note">{user.email}</p>}
              </div>
            </div>
            <Link href="/profile/edit" className="app-icon-wrap" aria-label="Edit profile">
              <Edit className="h-5 w-5" />
            </Link>
          </div>

          <div className="app-grid app-grid--3 mt-5">
            <div className="app-stat">
              <div className="app-meta">Completed orders</div>
              <div className="app-stat__value">{orderCount || 0}</div>
            </div>
            <div className="app-stat">
              <div className="app-meta">Wallet</div>
              <div className="app-stat__value">Rs {user.wallet_balance}</div>
            </div>
            <div className="app-stat">
              <div className="app-meta">Referral code</div>
              <div className="app-stat__value">{user.referral_code || '—'}</div>
            </div>
          </div>
        </section>

        <section className="app-section">
          <div className="app-list">
            {[
              { icon: <MapPin className="h-5 w-5" />, label: 'Saved addresses', href: '/addresses', meta: 'Manage pickup points' },
              { icon: <CreditCard className="h-5 w-5" />, label: 'Plans and subscription', href: '/subscription', meta: 'Upgrade or monitor credits' },
              { icon: <Tag className="h-5 w-5" />, label: 'Referral rewards', href: '/referral', meta: user.referral_code || 'Invite and earn' },
              { icon: <HelpCircle className="h-5 w-5" />, label: 'Support center', href: '/support', meta: 'Need help with an order?' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="app-card block">
                <div className="app-card__row">
                  <div className="flex items-center gap-3">
                    <div className="app-icon-wrap">{item.icon}</div>
                    <div>
                      <div className="font-bold" style={{ color: 'var(--app-text)' }}>{item.label}</div>
                      <div className="app-meta mt-1 text-sm">{item.meta}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--app-text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="app-section">
          <div className="app-card app-card--warm">
            <div className="app-card__row">
              <div className="flex items-center gap-3">
                <div className="app-icon-wrap" style={{ background: 'rgba(221,122,49,0.14)', color: 'var(--app-warm)' }}>
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold" style={{ color: 'var(--app-text)' }}>Designed for repeat laundry</div>
                  <div className="app-meta mt-1 text-sm">Your customer experience now prioritizes quick actions and mobile comfort.</div>
                </div>
              </div>
            </div>
          </div>

          <SignOutButton />
        </section>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}

function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button type="submit" className="app-card block w-full text-left">
        <div className="app-card__row">
          <div className="flex items-center gap-3">
            <div className="app-icon-wrap" style={{ background: 'rgba(239,68,68,0.14)', color: 'var(--app-danger)' }}>
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold" style={{ color: 'var(--app-danger)' }}>Sign out</div>
              <div className="app-meta mt-1 text-sm">Leave the app and return to the shared login.</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--app-text-muted)' }} />
        </div>
      </button>
    </form>
  )
}

