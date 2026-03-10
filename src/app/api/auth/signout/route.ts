import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function signOutAndRedirect(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const redirectUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(redirectUrl, { status: 303 })
  response.cookies.set('portal_role', '', { path: '/', maxAge: 0 })
  return response
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}