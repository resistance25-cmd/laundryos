// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LaundryOS - Indore\'s Smartest Laundry Service',
    template: '%s | LaundryOS',
  },
  description: 'Book laundry pickups, track orders, and manage subscriptions. Serving Indore.',
  keywords: ['laundry', 'Indore', 'laundry service', 'pickup', 'delivery', 'dry clean'],
  authors: [{ name: 'LaundryOS' }],
  creator: 'LaundryOS',
  publisher: 'LaundryOS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LaundryOS',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://laundreos.vercel.app',
    title: 'LaundryOS - Indore\'s Smartest Laundry Service',
    description: 'Book laundry pickups, track orders in real-time, and save with monthly plans.',
    siteName: 'LaundryOS',
  },
  twitter: {
    card: 'summary',
    title: 'LaundryOS',
    description: 'Indore\'s smartest laundry service',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#2f6fed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <meta name="application-name" content="LaundryOS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LaundryOS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2f6fed" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${plusJakartaSans.className} antialiased`}>
        {children}

        <Toaster
          position="top-center"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(16, 26, 45, 0.92)',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: '18px',
              fontSize: '14px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: '600',
              padding: '12px 16px',
              maxWidth: '380px',
              backdropFilter: 'blur(18px)',
            },
            success: {
              iconTheme: {
                primary: '#16a34a',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[LaundryOS] SW registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[LaundryOS] SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

