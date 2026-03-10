// src/app/admin/login/page.tsx
import type { Metadata } from 'next'
import AdminLoginClient from './AdminLoginClient'

export const metadata: Metadata = {
  title: 'Admin — LaundryOS Operations',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return <AdminLoginClient />
}
