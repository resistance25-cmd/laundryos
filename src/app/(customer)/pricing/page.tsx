// src/app/(customer)/pricing/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, WashingMachine, Shirt, Wind } from 'lucide-react'
import type { ServiceType, PricingItem } from '@/types'

export const metadata: Metadata = { title: 'Pricing' }

const SERVICE_CONFIG: Record<ServiceType, { label: string; icon: React.ReactNode; color: string }> = {
  wash_fold:   { label: 'Wash & Fold', icon: <WashingMachine className="w-5 h-5" />, color: '#6366F1' },
  steam_press: { label: 'Steam Press', icon: <Shirt className="w-5 h-5" />, color: '#8B5CF6' },
  dry_clean:   { label: 'Dry Clean',   icon: <Wind className="w-5 h-5" />, color: '#059669' },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: pricing } = await supabase
    .from('pricing')
    .select('*')
    .eq('is_active', true)
    .order('service_type')
    .order('unit_price')

  const grouped = (pricing as PricingItem[] || []).reduce<Record<ServiceType, PricingItem[]>>((acc, item) => {
    const key = item.service_type as ServiceType
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<ServiceType, PricingItem[]>)

  return (
    <div className="customer-dark min-h-screen pb-10">
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Pricing</h1>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4 space-y-5">
        <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
          Transparent pricing, no hidden fees
        </p>

        {(Object.keys(SERVICE_CONFIG) as ServiceType[]).map((serviceType) => {
          const config = SERVICE_CONFIG[serviceType]
          const items = grouped[serviceType] || []
          if (items.length === 0) return null
          return (
            <div key={serviceType} className="rounded-2xl overflow-hidden"
              style={{ background: '#10131F', border: '1px solid #1E2340' }}>
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid #1E2340', background: `${config.color}15` }}>
                <span style={{ color: config.color }}>{config.icon}</span>
                <h3 className="font-semibold text-white">{config.label}</h3>
              </div>
              {items.map((item, index) => (
                <div key={item.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: index < items.length - 1 ? '1px solid #1E2340' : 'none' }}>
                  <span className="text-sm text-white">{item.item_name}</span>
                  <span className="text-sm font-bold" style={{ color: config.color }}>₹{item.unit_price}</span>
                </div>
              ))}
            </div>
          )
        })}

        <div className="text-center pt-4">
          <Link href="/book" className="btn-primary inline-flex">Book a Pickup</Link>
        </div>
      </div>
    </div>
  )
}
