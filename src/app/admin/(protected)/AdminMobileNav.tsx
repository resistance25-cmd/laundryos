// src/app/admin/AdminMobileNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, WashingMachine, LayoutDashboard, Package, Users, Bike, BarChart3, MessageSquare } from 'lucide-react'

interface AdminProfile { id: string; name: string; is_super_admin: boolean }

const MOBILE_NAV = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Orders',    href: '/admin/orders', icon: <Package className="w-5 h-5" /> },
  { label: 'Riders',    href: '/admin/riders', icon: <Bike className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Revenue',   href: '/admin/revenue', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Support',   href: '/admin/support', icon: <MessageSquare className="w-5 h-5" /> },
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
      {/* Mobile topbar */}
      <header
        className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 safe-top"
        style={{ background: '#13151C', borderBottom: '1px solid #1E2130' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
            <WashingMachine className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#F1F5F9' }}>Operations</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setOpen(false)} />
          <div
            className="relative w-64 flex flex-col h-full z-50"
            style={{ background: '#13151C', borderRight: '1px solid #1E2130' }}
          >
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #1E2130' }}>
              <span className="font-bold" style={{ color: '#F1F5F9' }}>Menu</span>
              <button onClick={() => setOpen(false)} style={{ color: '#64748B' }} aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {MOBILE_NAV.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
                    style={{
                      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: active ? '#818CF8' : '#94A3B8',
                    }}>
                    <span style={{ color: active ? '#6366F1' : '#64748B' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-4 py-4" style={{ borderTop: '1px solid #1E2130' }}>
              <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{admin.name}</p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {admin.is_super_admin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 safe-bottom z-20"
        style={{ background: '#13151C', borderTop: '1px solid #1E2130' }}
      >
        <div className="flex items-center justify-around h-14">
          {MOBILE_NAV.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
                style={{ color: active ? '#6366F1' : '#64748B' }}>
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
