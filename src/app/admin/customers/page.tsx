// src/app/admin/customers/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, ChevronRight, Search } from 'lucide-react'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Customers' }

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const adminClient = createAdminClient()
  const { data: users } = await adminClient
    .from('users')
    .select('id, name, phone, email, wallet_balance, created_at, zone:zones(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  type UserRow = { id: string; name: string; phone: string; email: string | null; wallet_balance: number; created_at: string; zone: { name: string } | { name: string }[] | null }
  const rows = (users || []) as unknown as UserRow[]

  const filtered = searchParams.q
    ? rows.filter((u) =>
        u.name?.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        u.phone?.includes(searchParams.q!) ||
        u.email?.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : rows

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Customers</h1>
        <p className="text-sm" style={{ color: '#64748B' }}>{filtered.length} users</p>
      </div>

      <form method="GET" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
          <input name="q" type="text" defaultValue={searchParams.q}
            placeholder="Search by name, phone, email…" className="admin-input w-full pl-9" />
        </div>
      </form>

      <div className="admin-card rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#64748B', borderBottom: '1px solid #1E2130' }}>
          <span className="col-span-2">Customer</span><span>Zone</span><span>Wallet</span><span>Joined</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#6366F1' }} />
            <p style={{ color: '#64748B' }}>No customers found</p>
          </div>
        ) : (
          filtered.map((user) => {
            const zone = first(user.zone)
            return (
              <Link key={user.id} href={`/admin/customers/${user.id}`}>
                <div className="grid lg:grid-cols-5 gap-2 lg:gap-4 px-4 py-3 hover:bg-white hover:bg-opacity-5 transition-colors"
                  style={{ borderBottom: '1px solid #1E2130' }}>
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: '#64748B' }}>{user.phone}</p>
                    </div>
                  </div>
                  <p className="text-sm self-center" style={{ color: '#CBD5E1' }}>{zone?.name || '—'}</p>
                  <p className="text-sm self-center font-medium" style={{ color: '#F1F5F9' }}>₹{user.wallet_balance}</p>
                  <div className="flex items-center justify-between self-center">
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      {format(new Date(user.created_at), 'd MMM yy')}
                    </p>
                    <ChevronRight className="w-4 h-4 hidden lg:block" style={{ color: '#64748B' }} />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
