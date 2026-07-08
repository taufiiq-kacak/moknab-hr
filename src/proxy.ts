import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Exclude static assets and api routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return response
  }

  // Handle Root route (Login page)
  if (path === '/') {
    if (user) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('role, active')
        .eq('id', user.id)
        .single()

      if (staffData && staffData.active) {
        if (staffData.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/staff', request.url))
        }
      }
    }
    return response
  }

  // Staff Gated Routes
  if (path.startsWith('/staff')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const { data: staffData } = await supabase
      .from('staff')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!staffData || !staffData.active) {
      const responseRedirect = NextResponse.redirect(new URL('/', request.url))
      responseRedirect.cookies.delete('sb-access-token')
      responseRedirect.cookies.delete('sb-refresh-token')
      return responseRedirect;
    }

    if (staffData.role !== 'staff') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Admin Gated Routes
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const { data: staffData } = await supabase
      .from('staff')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!staffData || !staffData.active) {
      const responseRedirect = NextResponse.redirect(new URL('/', request.url))
      responseRedirect.cookies.delete('sb-access-token')
      responseRedirect.cookies.delete('sb-refresh-token')
      return responseRedirect;
    }

    if (staffData.role !== 'admin') {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
