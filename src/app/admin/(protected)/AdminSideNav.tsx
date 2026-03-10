'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bike,
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Map,
  MessageSquare,
  Package,
  Settings,
  Tag,
  Users,
  WashingMachine,
} from 'lucide-react'

interface AdminProfile {
  id: string
  name: string
  email: string
  is_super_admin: boolean
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <Package className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Riders', href: '/admin/riders', icon: <Bike className="w-5 h-5" /> },
  { label: 'Partners', href: '/admin/partners', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: <Tag className="w-5 h-5" /> },
  { label: 'Zones', href: '/admin/zones', icon: <Map className="w-5 h-5" /> },
  { label: 'Pricing', href: '/admin/pricing', icon: <Tag className="w-5 h-5" /> },
  { label: 'Revenue', href: '/admin/revenue', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Support', href: '/admin/support', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
]

export default function AdminSideNav({ admin }: { admin: AdminProfile }) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar-shell hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 flex-col px-4 py-5">
      <div className="app-panel p-5" style={{ background: 'rgba(16,26,45,0.78)' }}>
        <div className="flex items-center gap-3">
          <div className="app-avatar" style={{ width: 48, height: 48, borderRadius: 18 }}>
            <WashingMachine className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">LaundryOS</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Admin control center</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto rounded-[28px] border border-white/10 bg-white/5 p-3">
        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={`admin-nav-link ${active ? 'is-active' : ''}`}>
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {active ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="mt-4 app-panel p-4" style={{ background: 'rgba(16,26,45,0.78)' }}>
        <div className="flex items-center gap-3">
          <div className="app-avatar" style={{ width: 44, height: 44, borderRadius: 16 }}>{admin.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{admin.name}</p>
            <p className="truncate text-sm" style={{ color: '#94A3B8' }}>{admin.is_super_admin ? 'Super admin' : 'Admin'}</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST" className="mt-4">
          <button type="submit" className="admin-nav-link w-full" style={{ color: '#f87171' }}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

