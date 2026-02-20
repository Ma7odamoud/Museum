import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('museum_auth')
    const isAuthenticated = authCookie?.value === 'authenticated'

    // Protect all routes except the gatekeeper and API routes
    const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/hallway') ||
        request.nextUrl.pathname.startsWith('/room') ||
        request.nextUrl.pathname.startsWith('/admin')

    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/hallway/:path*', '/room/:path*', '/admin/:path*'],
}
