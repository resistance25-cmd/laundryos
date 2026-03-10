import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type PortalRole = 'admin' | 'rider' | 'customer'

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, session, role: resolvedRole } = await updateSession(request)
  const path = request.nextUrl.pathname
  const cookieRole = request.cookies.get('portal_role')?.value as PortalRole | undefined
  const role = cookieRole ?? resolvedRole

  if (path === '/admin/login' || path === '/rider/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path === '/' && session) {
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

  if (path.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    if (role === 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (role === 'rider') {
      return NextResponse.redirect(new URL('/rider/dashboard', request.url))
    }
  }

  if (path.startsWith('/rider') && !path.startsWith('/rider/auth')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (role === 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const customerProtectedPaths = [
    '/dashboard',
    '/book',
    '/orders',
    '/profile',
    '/subscription',
    '/addresses',
    '/support',
  ]

  const isCustomerProtected = customerProtectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
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

  if (session && (path === '/login' || path === '/signup' || path === '/auth/confirm')) {
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)',
  ],
}