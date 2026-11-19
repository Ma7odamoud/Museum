import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, ADMIN_COOKIE } from '@/lib/auth'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const authCookie = request.cookies.get(AUTH_COOKIE)?.value
    const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value

    // Admin routes require both museum access AND admin cookie
    if (pathname.startsWith('/admin')) {
        if (adminCookie !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // All other protected routes require museum access
    if (authCookie !== 'authenticated') {
        return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/hallway', '/hallway/(.*)', '/room/:path*', '/admin', '/admin/(.*)'],
}
