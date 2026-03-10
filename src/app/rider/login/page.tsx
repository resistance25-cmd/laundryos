// src/app/rider/login/page.tsx
import type { Metadata } from 'next'
import RiderLoginClient from './RiderLoginClient'

export const metadata: Metadata = {
  title: 'Rider Login — LaundryOS',
  robots: { index: false, follow: false },
}

export default function RiderLoginPage() {
  return <RiderLoginClient />
}
