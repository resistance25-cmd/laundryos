'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Plus, UserRound } from 'lucide-react'

type NavKey = 'home' | 'book' | 'orders' | 'profile'

const ITEMS: Array<{
  key: NavKey
  label: string
  href: string
  icon: typeof Home
}> = [
  { key: 'home', label: 'Home', href: '/dashboard', icon: Home },
  { key: 'book', label: 'Book', href: '/book', icon: Plus },
  { key: 'orders', label: 'Orders', href: '/orders', icon: Package },
  { key: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
]

export default function CustomerBottomNav({ active }: { active?: NavKey }) {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav mobile-nav--customer">
      <div className="mobile-nav__inner">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active
            ? active === item.key
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.key}
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


