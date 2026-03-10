// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
type PortalRole = 'admin' | 'rider' | 'customer'
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, session, role: resolvedRole } = await updateSession(request)
  const path = request.nextUrl.pathname
  const cookieRole = request.cookies.get('portal_role')?.value as PortalRole | undefined
  const role = cookieRole ?? resolvedRole
  // Admin routes: protect all /admin/* except /admin/login
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (role === 'rider') {
      return NextResponse.redirect(new URL('/rider/dashboard', request.url))
    }
  }
  // Rider routes: protect all /rider/* except /rider/login and /rider/auth
  if (
    path.startsWith('/rider') &&
    !path.startsWith('/rider/login') &&
    !path.startsWith('/rider/auth')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/rider/login', request.url))
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  // Customer protected routes
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
  if (isCustomerProtected) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'rider') {
      return NextResponse.redirect(new URL('/rider/dashboard', request.url))
    }
  }
  // Role-aware redirects from auth pages
  if (session && (path === '/login' || path === '/signup')) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'rider') {
      return NextResponse.redirect(new URL('/rider/dashboard', request.url))
    }
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  if (session && path === '/admin/login' && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  if (session && path === '/rider/login' && role === 'rider') {
    return NextResponse.redirect(new URL('/rider/dashboard', request.url))
  }
  return response
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)',
  ],
}