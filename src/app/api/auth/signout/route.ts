// src/app/api/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
async function signOutAndRedirect(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const referer = request.headers.get('referer') || ''
  let redirectUrl = new URL('/login', request.url)
  if (referer.includes('/admin')) {
    redirectUrl = new URL('/admin/login', request.url)
  } else if (referer.includes('/rider')) {
    redirectUrl = new URL('/rider/login', request.url)
  }
  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set('portal_role', '', { path: '/', maxAge: 0 })
  return response
}
export async function POST(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}
// Support direct link navigation to avoid 405 errors.
export async function GET(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}