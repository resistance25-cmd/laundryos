import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Clock3,
  Hotel,
  MapPin,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Store,
  TimerReset,
  Truck,
  WashingMachine,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'LaundryOS | Modern Laundry Pickup and Delivery in Indore',
  description: 'Premium laundry pickup, garment care, subscriptions, live tracking, and business laundry services for modern households and local operations in Indore.',
}

const TRUST_STRIPS = ['Pickup in 30 mins', '24-hour turnaround', 'Live order tracking', 'Premium fabric care']

const SERVICE_CARDS = [
  {
    title: 'Wash & Fold',
    copy: 'Everyday laundry done with sorted wash cycles, careful drying, and tidy packaging.',
    tone: 'service-card--blue',
  },
  {
    title: 'Steam Press',
    copy: 'Sharp finishing for workwear, occasion outfits, and weekly rotation staples.',
    tone: 'service-card--gold',
  },
  {
    title: 'Dry Clean',
    copy: 'Delicate garment care for premium fabrics, jackets, sarees, and formal wear.',
    tone: 'service-card--mint',
  },
]

const JOURNEY = [
  {
    title: 'Schedule in minutes',
    body: 'Choose pickup time, service type, and instructions from a clean mobile flow.',
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    title: 'Tracked pickup',
    body: 'Your rider is assigned in real time and every order move is visible in the app.',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: 'Premium processing',
    body: 'Garments go through quality checks, smart sorting, and service-specific finishing.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: 'Fresh delivery',
    body: 'Receive your order neatly packed and ready to wear, typically within 24 hours.',
    icon: <BadgeCheck className="h-5 w-5" />,
  },
]

const MISSING_FEATURES = [
  {
    title: 'Recurring pickup plans',
    body: 'Weekly household routines, subscription-first repeat pickups, and cleaner reordering for busy families.',
    icon: <CalendarClock className="h-5 w-5" />,
  },
  {
    title: 'Business laundry accounts',
    body: 'Airbnb, salons, hostels, gyms, clinics, and small hotels need scheduled commercial pickup with centralized billing.',
    icon: <BriefcaseBusiness className="h-5 w-5" />,
  },
  {
    title: 'Care and priority options',
    body: 'Express turnaround, delicate handling notes, stain treatment preferences, and premium garment handling should be visible upfront.',
    icon: <Sparkles className="h-5 w-5" />,
  },
]

const BUSINESS_SEGMENTS = [
  { label: 'Airbnb and hostels', icon: <Hotel className="h-4 w-4" /> },
  { label: 'Salons and spas', icon: <Store className="h-4 w-4" /> },
  { label: 'Clinics and uniforms', icon: <Building2 className="h-4 w-4" /> },
]

const STATS = [
  { value: '4.9', label: 'Average rating' },
  { value: '10k+', label: 'Garments processed' },
  { value: '24h', label: 'Express turnaround' },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const primaryHref = session ? '/dashboard' : '/login'
  const secondaryHref = session ? '/book' : '/signup'
  const businessHref = session ? '/support' : '/signup'

  return (
    <div className="marketing-page">
      <div className="marketing-page__noise" />
      <div className="marketing-page__glow marketing-page__glow--a" />
      <div className="marketing-page__glow marketing-page__glow--b" />

      <nav className="marketing-nav">
        <Link href="/" className="brand-mark">
          <span className="brand-mark__badge"><WashingMachine className="h-5 w-5" /></span>
          <span>
            <strong>LaundryOS</strong>
            <em>Pickup. Care. Delivery.</em>
          </span>
        </Link>

        <div className="marketing-nav__actions">
          <a href="#services">Services</a>
          <a href="#experience">Experience</a>
          <a href="#business">Business</a>
          <Link href={primaryHref} className="btn-ghost">{session ? 'Dashboard' : 'Sign in'}</Link>
          <Link href={secondaryHref} className="btn-primary">{session ? 'Book pickup' : 'Get started'}</Link>
        </div>
      </nav>

      <main>
        <section className="hero-band">
          <div className="hero-band__content reveal-up">
            <div className="hero-band__eyebrow">
              <span>Modern laundry experience</span>
              <span>Built for busy homes and growing local businesses</span>
            </div>
            <h1>
              A real laundry product,
              <span>not just a pickup website.</span>
            </h1>
            <p>
              LaundryOS combines premium garment care, live order tracking, repeat scheduling,
              subscription savings, and business-ready operations into one cleaner platform.
            </p>

            <div className="hero-band__actions">
              <Link href={secondaryHref} className="btn-primary">
                {session ? 'Book your next pickup' : 'Start with LaundryOS'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#business" className="btn-ghost">See business features</a>
            </div>

            <div className="hero-band__trust">
              {TRUST_STRIPS.map((item) => (
                <span key={item}><ShieldCheck className="h-4 w-4" />{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-band__visual reveal-up delay-1">
            <div className="hero-stack">
              <div className="hero-stack__main">
                <div className="hero-stack__badge">Household + commercial ready</div>
                <h2>From weekly family laundry to recurring hostel and Airbnb runs.</h2>
                <p>Customers get a mobile-first ordering flow while admins and riders coordinate repeat pickups, urgent loads, and service quality behind the scenes.</p>
                <div className="hero-stack__meta">
                  <span><MapPin className="h-4 w-4" /> Vijay Nagar, Palasia, Nipania</span>
                  <span><TimerReset className="h-4 w-4" /> Repeat schedules and express care</span>
                </div>
              </div>
              <div className="hero-stack__float hero-stack__float--top">
                <strong>24h</strong>
                <span>Fast turnaround</span>
              </div>
              <div className="hero-stack__float hero-stack__float--bottom">
                <strong>B2C + B2B</strong>
                <span>Homes, uniforms, hosting</span>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-strip reveal-up delay-2">
          {STATS.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section id="services" className="section-shell">
          <div className="section-heading reveal-up">
            <span className="eyebrow">Services designed for repeat use</span>
            <h2>Premium care, everyday convenience, and a sharper digital experience.</h2>
          </div>

          <div className="services-grid">
            {SERVICE_CARDS.map((card, index) => (
              <article key={card.title} className={`service-card ${card.tone} reveal-up delay-${index + 1}`}>
                <div className="service-card__icon"><Shirt className="h-5 w-5" /></div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
                <span>Doorstep pickup available</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell section-shell--split">
          <div className="section-heading reveal-up">
            <span className="eyebrow">What the product still needs</span>
            <h2>The best laundry businesses do more than pickup and delivery. They support routines, urgency, and commercial demand.</h2>
          </div>
          <div className="services-grid">
            {MISSING_FEATURES.map((feature, index) => (
              <article key={feature.title} className={`service-card reveal-up delay-${(index % 3) + 1}`}>
                <div className="service-card__icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <span>Now part of the direction</span>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section-shell section-shell--split">
          <div className="section-heading reveal-up">
            <span className="eyebrow">Operational flow</span>
            <h2>The customer side feels effortless because the backend journey is disciplined.</h2>
            <p>
              Customers get a polished storefront while admins and riders use dedicated flows behind the scenes.
            </p>
          </div>

          <div className="journey-rail">
            {JOURNEY.map((step, index) => (
              <article key={step.title} className={`journey-step reveal-up delay-${(index % 3) + 1}`}>
                <div className="journey-step__index">0{index + 1}</div>
                <div className="journey-step__icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="business" className="section-shell coverage-panel reveal-up">
          <div className="section-heading">
            <span className="eyebrow">Business and bulk laundry</span>
            <h2>Built for homes first, but ready to expand into recurring business accounts.</h2>
            <p>Local laundry brands that win usually serve both retail households and operational accounts that need dependable pickup, billing, and turnaround.</p>
          </div>
          <div className="coverage-panel__grid">
            {BUSINESS_SEGMENTS.map((segment) => (
              <span key={segment.label}>{segment.icon}{segment.label}</span>
            ))}
          </div>
          <div className="coverage-panel__cta">
            <Link href={businessHref} className="btn-primary">{session ? 'Talk to support about business use' : 'Request a business account'}</Link>
          </div>
        </section>

        <section className="quote-panel reveal-up">
          <div>
            <span className="eyebrow">Built for trust</span>
            <h2>The best laundry products feel calm, fast, premium, and operationally reliable. That is the bar here.</h2>
          </div>
          <div className="quote-panel__chips">
            <span><Star className="h-4 w-4" /> Fabric-safe processing</span>
            <span><Truck className="h-4 w-4" /> Doorstep logistics</span>
            <span><Sparkles className="h-4 w-4" /> Experience-first UI</span>
          </div>
        </section>

        <section id="coverage" className="section-shell coverage-panel reveal-up">
          <div className="section-heading">
            <span className="eyebrow">Coverage</span>
            <h2>Serving the neighborhoods where convenience matters most.</h2>
          </div>
          <div className="coverage-panel__grid">
            {['Vijay Nagar', 'Scheme 54', 'Palasia', 'Nipania', 'AB Road', 'Bapat Square'].map((zone) => (
              <span key={zone}><MapPin className="h-4 w-4" />{zone}</span>
            ))}
          </div>
          <div className="coverage-panel__cta">
            <Link href={secondaryHref} className="btn-primary">{session ? 'Book a pickup' : 'Create your account'}</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
