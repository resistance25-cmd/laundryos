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
  title: 'LaundryOS | Laundry Pickup, Care, and Delivery in Indore',
  description:
    'LaundryOS is a modern laundry product for pickup, garment care, subscriptions, live tracking, and business laundry operations in Indore.',
}

const TRUST_STRIPS = ['Pickup in 30 mins', '24-hour turnaround', 'Live order tracking', 'Fabric-safe care']

const PRODUCT_MODULES = [
  {
    title: 'Customer app',
    copy: 'Book pickups, track every order, reorder in seconds, and manage addresses from one clean flow.',
    icon: <Sparkles className="h-5 w-5" />,
    tone: 'product-card--blue',
  },
  {
    title: 'Smart scheduling',
    copy: 'Recurring plans, express options, and time-slot control built for daily routines instead of one-off bookings.',
    icon: <CalendarClock className="h-5 w-5" />,
    tone: 'product-card--gold',
  },
  {
    title: 'Admin control tower',
    copy: 'See order status, rider assignment, support load, and business operations in one operational surface.',
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    tone: 'product-card--mint',
  },
  {
    title: 'Rider dispatch',
    copy: 'Give riders a faster task board with clear pickups, delivery state, and route-first actions.',
    icon: <Truck className="h-5 w-5" />,
    tone: 'product-card--slate',
  },
]

const SERVICE_CARDS = [
  {
    title: 'Wash and fold',
    copy: 'Everyday laundry with sorted cycles, careful drying, and crisp packaging for repeat household use.',
    icon: <Shirt className="h-5 w-5" />,
    note: 'Best for weekly laundry',
  },
  {
    title: 'Steam press',
    copy: 'Sharp finishing for workwear, event outfits, uniforms, and all the pieces that need structure.',
    icon: <BadgeCheck className="h-5 w-5" />,
    note: 'Fast finishing available',
  },
  {
    title: 'Dry clean care',
    copy: 'Premium handling for delicate garments, jackets, occasion wear, sarees, and formal collections.',
    icon: <Sparkles className="h-5 w-5" />,
    note: 'Fabric-specific processing',
  },
  {
    title: 'Subscriptions',
    copy: 'Repeat pickups, family plans, and dependable weekly routines designed for customers who never want to think about laundry again.',
    icon: <TimerReset className="h-5 w-5" />,
    note: 'Recurring by design',
  },
]

const JOURNEY = [
  {
    title: 'Schedule in minutes',
    body: 'Choose pickup time, service type, care notes, and address from a tight app-like booking flow.',
    icon: <Clock3 className="h-5 w-5" />,
  },
  {
    title: 'Tracked pickup',
    body: 'The rider gets assigned, the customer gets visibility, and the admin team sees every handoff live.',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: 'Premium processing',
    body: 'Orders move through sorting, service-specific treatment, quality checks, and careful packaging.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: 'Fresh delivery',
    body: 'Return clean garments on time with clear completion states, support visibility, and delight in the final handoff.',
    icon: <BadgeCheck className="h-5 w-5" />,
  },
]

const BUSINESS_SEGMENTS = [
  { label: 'Airbnb and hostels', icon: <Hotel className="h-4 w-4" /> },
  { label: 'Salons and spas', icon: <Store className="h-4 w-4" /> },
  { label: 'Clinics and uniforms', icon: <Building2 className="h-4 w-4" /> },
]

const STATS = [
  { value: '4.9', label: 'Average rating' },
  { value: '24h', label: 'Typical turnaround' },
  { value: 'B2C + B2B', label: 'Operational model' },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
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
          <span className="brand-mark__badge">
            <WashingMachine className="h-5 w-5" />
          </span>
          <span>
            <strong>LaundryOS</strong>
            <em>Pickup. Care. Delivery.</em>
          </span>
        </Link>

        <div className="marketing-nav__actions">
          <a href="#product">Product</a>
          <a href="#services">Services</a>
          <a href="#experience">Experience</a>
          <a href="#business">Business</a>
          <Link href={primaryHref} className="btn-ghost">
            {session ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link href={secondaryHref} className="btn-primary">
            {session ? 'Book pickup' : 'Get started'}
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero-band">
          <div className="hero-band__content reveal-up">
            <div className="hero-band__eyebrow">
              <span>Minimal on desktop</span>
              <span>App-like on mobile</span>
            </div>
            <h1>
              LaundryOS makes laundry
              <span>feel like a modern product.</span>
            </h1>
            <p>
              A premium pickup and garment-care experience for households, riders, and operations teams.
              Clean on the front. Disciplined underneath.
            </p>

            <div className="hero-band__actions">
              <Link href={secondaryHref} className="btn-primary">
                {session ? 'Book your next pickup' : 'Start with LaundryOS'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#product" className="btn-ghost">
                Explore the product
              </a>
            </div>

            <div className="hero-band__trust">
              {TRUST_STRIPS.map((item) => (
                <span key={item}>
                  <ShieldCheck className="h-4 w-4" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-band__visual reveal-up delay-1">
            <div className="hero-productboard">
              <article className="hero-productboard__panel">
                <span className="eyebrow">One operating system</span>
                <h2>Built for customer flow, dispatch, and garment care.</h2>
                <p>
                  The same platform powers customer ordering, rider task movement, and admin visibility
                  without looking like a bulky dashboard.
                </p>
                <div className="hero-productboard__mini">
                  <span>
                    <MapPin className="h-4 w-4" />
                    Indore zones covered
                  </span>
                  <span>
                    <TimerReset className="h-4 w-4" />
                    Repeat schedules ready
                  </span>
                </div>
              </article>

              <div className="hero-productboard__phone">
                <div className="hero-productboard__phone-top">
                  <span>Today</span>
                  <strong>3 active orders</strong>
                </div>
                <div className="hero-productboard__phone-card">
                  <div>
                    <p>Pickup scheduled</p>
                    <strong>Wash and fold</strong>
                  </div>
                  <span>7:30 PM</span>
                </div>
                <div className="hero-productboard__phone-card">
                  <div>
                    <p>Rider assigned</p>
                    <strong>Tracking live</strong>
                  </div>
                  <span>12 mins away</span>
                </div>
                <div className="hero-productboard__phone-card hero-productboard__phone-card--soft">
                  <div>
                    <p>Ready for delivery</p>
                    <strong>2 orders complete</strong>
                  </div>
                  <span>Fresh packed</span>
                </div>
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

        <section id="product" className="section-shell product-section">
          <div className="section-heading reveal-up">
            <span className="eyebrow">Product layers</span>
            <h2>A laundry business brand on the surface, a full operating system underneath.</h2>
            <p>
              LaundryOS should feel effortless for customers while still giving teams the tools to dispatch,
              assign, support, and scale repeat service.
            </p>
          </div>

          <div className="product-grid">
            {PRODUCT_MODULES.map((module, index) => (
              <article key={module.title} className={`product-card ${module.tone} reveal-up delay-${(index % 3) + 1}`}>
                <div className="product-card__icon">{module.icon}</div>
                <h3>{module.title}</h3>
                <p>{module.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="section-shell">
          <div className="section-heading reveal-up">
            <span className="eyebrow">Core services</span>
            <h2>Product cards down the page, designed like a minimal storefront.</h2>
          </div>

          <div className="product-rail">
            {SERVICE_CARDS.map((card, index) => (
              <article key={card.title} className={`service-card service-card--minimal reveal-up delay-${(index % 3) + 1}`}>
                <div className="service-card__header">
                  <div className="service-card__icon">{card.icon}</div>
                  <span>{card.note}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section-shell section-shell--split">
          <div className="section-heading reveal-up">
            <span className="eyebrow">Operational flow</span>
            <h2>The customer experience feels light because the backend journey is disciplined.</h2>
            <p>
              That is the difference between a laundry website and a laundry product.
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
            <span className="eyebrow">Business accounts</span>
            <h2>Ready for homes today, ready for high-repeat commercial pickup next.</h2>
            <p>
              The best local laundry brands win both household loyalty and recurring operational demand.
            </p>
          </div>
          <div className="coverage-panel__grid">
            {BUSINESS_SEGMENTS.map((segment) => (
              <span key={segment.label}>
                {segment.icon}
                {segment.label}
              </span>
            ))}
          </div>
          <div className="coverage-panel__cta">
            <Link href={businessHref} className="btn-primary">
              {session ? 'Talk to support about business use' : 'Request a business account'}
            </Link>
          </div>
        </section>

        <section className="quote-panel reveal-up">
          <div>
            <span className="eyebrow">Why it works</span>
            <h2>Calm UI, visible operations, clean trust signals, and service cards that sell the product fast.</h2>
          </div>
          <div className="quote-panel__chips">
            <span>
              <Star className="h-4 w-4" />
              Premium presentation
            </span>
            <span>
              <Truck className="h-4 w-4" />
              Doorstep logistics
            </span>
            <span>
              <Sparkles className="h-4 w-4" />
              App-like mobile flow
            </span>
          </div>
        </section>

        <section id="coverage" className="section-shell coverage-panel reveal-up">
          <div className="section-heading">
            <span className="eyebrow">Coverage</span>
            <h2>Serving the neighborhoods where convenience and speed matter most.</h2>
          </div>
          <div className="coverage-panel__grid">
            {['Vijay Nagar', 'Scheme 54', 'Palasia', 'Nipania', 'AB Road', 'Bapat Square'].map((zone) => (
              <span key={zone}>
                <MapPin className="h-4 w-4" />
                {zone}
              </span>
            ))}
          </div>
          <div className="coverage-panel__cta">
            <Link href={secondaryHref} className="btn-primary">
              {session ? 'Book a pickup' : 'Create your account'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
