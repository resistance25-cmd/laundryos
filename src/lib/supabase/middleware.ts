// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

type UserRole = 'admin' | 'rider' | 'customer' | 'unknown'

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse
  session: { user: { id: string } } | null
  role: UserRole
}> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - do not remove this block
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { response: supabaseResponse, session, role: 'unknown' }
  }

  const userId = session.user.id

  const { data: adminProfile } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (adminProfile) {
    return { response: supabaseResponse, session, role: 'admin' }
  }

  const { data: riderProfile } = await supabase
    .from('riders')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (riderProfile) {
    return { response: supabaseResponse, session, role: 'rider' }
  }

  const { data: customerProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (customerProfile) {
    return { response: supabaseResponse, session, role: 'customer' }
  }

  return { response: supabaseResponse, session, role: 'unknown' }
}
