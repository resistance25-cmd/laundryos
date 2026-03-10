// src/app/(customer)/layout.tsx
// Route group layout — shared wrapper for all customer pages
// Provides Plus Jakarta Sans font and base customer styling
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'LaundryOS', template: '%s | LaundryOS' },
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
