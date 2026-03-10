// src/app/api/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function signOutAndRedirect(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const referer = request.headers.get('referer') || ''

  if (referer.includes('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (referer.includes('/rider')) {
    return NextResponse.redirect(new URL('/rider/login', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}

// Support direct link navigation to avoid 405 errors.
export async function GET(request: NextRequest): Promise<NextResponse> {
  return signOutAndRedirect(request)
}
