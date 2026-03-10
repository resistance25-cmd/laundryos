'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleUserRound, ClipboardList, Home } from 'lucide-react'

const ITEMS = [
  { label: 'Home', href: '/rider/dashboard', icon: Home },
  { label: 'Orders', href: '/rider/orders', icon: ClipboardList },
  { label: 'Profile', href: '/rider/profile', icon: CircleUserRound },
]

export default function RiderBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav mobile-nav--rider">
      <div className="mobile-nav__inner">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav__item ${isActive ? 'is-active' : ''}`}
            >
              <span className="mobile-nav__icon">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mobile-nav__label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


