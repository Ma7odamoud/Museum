import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('museum_auth')
    const isAuthenticated = authCookie?.value === 'authenticated'

    // Protect all routes except the gatekeeper and API routes
    const path = request.nextUrl.pathname
    const isProtectedRoute =
        path.startsWith('/hallway') ||
        path.startsWith('/room') ||
        path.startsWith('/admin')

    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/hallway/:path*', '/room/:path*', '/admin/:path*'],
}
