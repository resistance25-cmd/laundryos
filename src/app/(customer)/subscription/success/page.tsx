// src/app/(customer)/subscription/success/page.tsx
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  return (
    <div className="customer-dark min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(99,102,241,0.2)' }}>
        <Sparkles className="w-10 h-10" style={{ color: '#6366F1' }} />
      </div>
      <h1 className="text-2xl font-bold text-white">You&apos;re subscribed!</h1>
      <p className="text-sm mt-3 max-w-xs" style={{ color: '#94A3B8' }}>
        Your plan is now active. Start booking laundry pickups using your credits.
      </p>
      <div className="flex gap-3 mt-8">
        <Link href="/book" className="btn-primary">Book a Pickup</Link>
        <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>
    </div>
  )
}
