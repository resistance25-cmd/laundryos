// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, session } = await updateSession(request)
  const path = request.nextUrl.pathname

  // ── ADMIN ROUTES ──────────────────────────────────────────
  // Protect all /admin/* except /admin/login
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    // Full admin role check (admins table lookup) happens inside admin layout
    // Middleware only checks session presence to avoid DB calls on every request
  }

  // ── RIDER ROUTES ──────────────────────────────────────────
  // Protect all /rider/* except /rider/login and /rider/auth
  if (
    path.startsWith('/rider') &&
    !path.startsWith('/rider/login') &&
    !path.startsWith('/rider/auth')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/rider/login', request.url))
    }
    // Full rider role check (riders table + is_active) happens inside rider layout
  }

  // ── CUSTOMER PROTECTED ROUTES ─────────────────────────────
  const customerProtectedPaths = [
    '/dashboard',
    '/book',
    '/orders',
    '/profile',
    '/subscription',
    '/addresses',
    '/support',
  ]

  const isCustomerProtected = customerProtectedPaths.some((p) =>
    path.startsWith(p)
  )

  if (isCustomerProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── REDIRECT LOGGED-IN USERS FROM AUTH PAGES ─────────────
  // Customer: redirect /login or /signup if already logged in
  if (session && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (icons, manifest, sw.js, offline.html)
     * - API routes (handled internally)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)',
  ],
}
