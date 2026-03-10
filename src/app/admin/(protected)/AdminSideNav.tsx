// src/app/admin/AdminSideNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Users, Bike, Building2,
  Tag, Map, BarChart3, MessageSquare, Settings,
  WashingMachine, LogOut, ChevronRight
} from 'lucide-react'

interface AdminProfile {
  id: string
  name: string
  email: string
  is_super_admin: boolean
}

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin',               icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders',        href: '/admin/orders',         icon: <Package className="w-5 h-5" /> },
  { label: 'Customers',     href: '/admin/customers',      icon: <Users className="w-5 h-5" /> },
  { label: 'Riders',        href: '/admin/riders',         icon: <Bike className="w-5 h-5" /> },
  { label: 'Partners',      href: '/admin/partners',       icon: <Building2 className="w-5 h-5" /> },
  { label: 'Subscriptions', href: '/admin/subscriptions',  icon: <Tag className="w-5 h-5" /> },
  { label: 'Zones',         href: '/admin/zones',          icon: <Map className="w-5 h-5" /> },
  { label: 'Pricing',       href: '/admin/pricing',        icon: <Tag className="w-5 h-5" /> },
  { label: 'Revenue',       href: '/admin/revenue',        icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Support',       href: '/admin/support',        icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Settings',      href: '/admin/settings',       icon: <Settings className="w-5 h-5" /> },
]

export default function AdminSideNav({ admin }: { admin: AdminProfile }) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30"
      style={{ background: '#13151C', borderRight: '1px solid #1E2130' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid #1E2130' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
        >
          <WashingMachine className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#F1F5F9' }}>LaundryOS</p>
          <p className="text-xs" style={{ color: '#64748B' }}>Operations</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#818CF8' : '#64748B',
              }}
            >
              <span style={{ color: active ? '#6366F1' : '#64748B' }}>{item.icon}</span>
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: '#6366F1' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Admin info + sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #1E2130' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}
          >
            {admin.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>{admin.name}</p>
            <p className="text-xs truncate" style={{ color: '#64748B' }}>
              {admin.is_super_admin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#EF4444' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
