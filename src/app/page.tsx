// src/app/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, WashingMachine, Clock, Shield, Star, MapPin, Phone, Mail, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'LaundryOS — Indore\'s Smartest Laundry Service',
  description: 'Book laundry pickups, track in real-time, save with monthly plans. Serving Vijay Nagar, Scheme 54, Palasia, Nipania, AB Road.',
}

const PLANS = [
  { name: 'Basic', price: 699, wash: 2, press: 2, dry: 0, free_pickup: false, popular: false },
  { name: 'Standard', price: 999, wash: 3, press: 3, dry: 1, free_pickup: false, popular: true },
  { name: 'Premium', price: 1499, wash: 5, press: 5, dry: 2, free_pickup: true, popular: false },
]

const ZONES = ['Vijay Nagar', 'Scheme 54', 'Palasia', 'Nipania', 'AB Road']

const STEPS = [
  { step: '1', title: 'Schedule', desc: 'Pick a date and time slot that works for you', icon: <Clock className="w-6 h-6" /> },
  { step: '2', title: 'Pickup', desc: 'Our rider collects your clothes from your door', icon: <WashingMachine className="w-6 h-6" /> },
  { step: '3', title: 'Deliver', desc: 'Fresh, clean clothes delivered next day', icon: <ArrowRight className="w-6 h-6" /> },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div style={{ background: '#0B0D17', color: '#F0F2FF', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-dark" style={{ borderBottom: '1px solid #1E2340' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <WashingMachine className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold" style={{ color: '#F0F2FF' }}>LaundryOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden sm:block text-sm font-medium" style={{ color: '#94A3B8' }}>Pricing</Link>
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm px-4 py-2">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium" style={{ color: '#94A3B8' }}>Sign In</Link>
                <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 text-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Star className="w-3.5 h-3.5" />
            Serving Indore since 2024
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            Laundry done.{' '}
            <span className="text-gradient">You relax.</span>
          </h1>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#94A3B8' }}>
            Schedule a pickup, we wash &amp; press, deliver next day. Tracked live, every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary px-8 py-4 text-base">
              Book Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="#how-it-works" className="btn-ghost px-8 py-4 text-base">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            As easy as <span className="text-gradient">1-2-3</span>
          </h2>
          <p className="text-center mb-12" style={{ color: '#94A3B8' }}>
            No more waiting at laundromats
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center p-6 rounded-2xl"
                style={{ background: '#10131F', border: '1px solid #1E2340' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  <span className="text-white">{step.icon}</span>
                </div>
                <div className="text-xs font-bold mb-1" style={{ color: '#6366F1' }}>STEP {step.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: '#94A3B8' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 py-20" style={{ background: '#10131F' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <p className="text-center mb-12" style={{ color: '#94A3B8' }}>Save up to 40% with a monthly plan</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#13151C',
                  border: plan.popular ? '2px solid #6366F1' : '1px solid #1E2340',
                }}>
                {plan.popular && (
                  <div className="text-center py-1.5 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  <p className="text-3xl font-black mt-1 mb-4" style={{ color: '#6366F1' }}>
                    ₹{plan.price}<span className="text-sm font-normal" style={{ color: '#64748B' }}>/mo</span>
                  </p>
                  <div className="space-y-2 mb-5 text-sm">
                    {[
                      `${plan.wash} Wash & Fold`,
                      `${plan.press} Steam Press`,
                      ...(plan.dry > 0 ? [`${plan.dry} Dry Clean`] : []),
                      ...(plan.free_pickup ? ['Free Pickup & Delivery'] : []),
                      '30 day validity',
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                        <span style={{ color: '#CBD5E1' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup"
                    className={`block text-center py-3 rounded-full text-sm font-bold ${plan.popular ? 'btn-primary' : 'btn-ghost'}`}>
                    Get {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Why <span className="text-gradient">LaundryOS</span>?</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: <Clock className="w-6 h-6" />, title: 'Next-Day Delivery', desc: 'Order before 2 PM, get same-day pickup and delivery next day', color: '#6366F1' },
              { icon: <Shield className="w-6 h-6" />, title: 'Insured & Tracked', desc: 'Real-time order tracking. Your clothes are insured against damage', color: '#8B5CF6' },
              { icon: <Star className="w-6 h-6" />, title: 'Quality Guaranteed', desc: 'Professional wash, press, and dry-clean by trained partners', color: '#F59E0B' },
              { icon: <WashingMachine className="w-6 h-6" />, title: 'Save with Plans', desc: 'Monthly subscription plans save you up to 40% vs per-item pricing', color: '#059669' },
            ].map((badge) => (
              <div key={badge.title} className="flex gap-4 p-5 rounded-2xl"
                style={{ background: '#10131F', border: '1px solid #1E2340' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${badge.color}20`, color: badge.color }}>
                  {badge.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{badge.title}</h3>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage zones */}
      <section className="px-4 py-16" style={{ background: '#10131F' }}>
        <div className="max-w-lg mx-auto text-center">
          <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: '#6366F1' }} />
          <h2 className="text-xl font-bold text-white mb-2">Currently serving Indore</h2>
          <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>Available in these areas:</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {ZONES.map((zone) => (
              <span key={zone}
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
                {zone}
              </span>
            ))}
          </div>
          <Link href="/signup" className="btn-primary inline-flex px-8 py-4">
            Book Your First Pickup
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-10" style={{ borderTop: '1px solid #1E2340' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                <WashingMachine className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">LaundryOS</span>
            </div>
            <div className="flex items-center gap-5 text-sm" style={{ color: '#64748B' }}>
              <Link href="/pricing">Pricing</Link>
              <Link href="/login">Sign In</Link>
              <a href="tel:+917777777777" className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> +91 77777 77777
              </a>
              <a href="mailto:hello@laundreos.in" className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> hello@laundreos.in
              </a>
            </div>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
            © 2024 LaundryOS. All rights reserved. Indore, Madhya Pradesh.
          </p>
        </div>
      </footer>
    </div>
  )
}
