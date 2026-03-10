'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bike, LayoutDashboard, Menu, MessageSquare, Package, Users, WashingMachine, X } from 'lucide-react'

interface AdminProfile { id: string; name: string; is_super_admin: boolean }

const MOBILE_NAV = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <Package className="w-5 h-5" /> },
  { label: 'Riders', href: '/admin/riders', icon: <Bike className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Revenue', href: '/admin/revenue', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Support', href: '/admin/support', icon: <MessageSquare className="w-5 h-5" /> },
]

export default function AdminMobileNav({ admin }: { admin: AdminProfile }) {
  const [open, setOpen] = useState<boolean>(false)
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="app-avatar" style={{ width: 42, height: 42, borderRadius: 16 }}>
              <WashingMachine className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Admin center</div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>{admin.name}</div>
            </div>
          </div>
          <button onClick={() => setOpen(true)} className="app-icon-wrap" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-label="Close drawer" />
          <div className="relative ml-auto h-full w-72 bg-slate-950/95 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white">Operations</div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>{admin.is_super_admin ? 'Super admin' : 'Admin'}</div>
              </div>
              <button onClick={() => setOpen(false)} className="app-icon-wrap" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 space-y-2">
              {MOBILE_NAV.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`admin-nav-link ${active ? 'is-active' : ''}`}>
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

