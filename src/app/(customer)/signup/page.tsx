// src/app/(customer)/signup/page.tsx
import type { Metadata } from 'next'
import SignupClient from './SignupClient'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your LaundryOS account',
}

export default function SignupPage() {
  return <SignupClient />
}
