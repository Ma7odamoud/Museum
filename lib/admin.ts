import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE } from './auth'

/**
 * Validates that the request has a valid admin cookie.
 * Returns null if authorized, or a NextResponse error if unauthorized.
 */
export async function requireAdmin(request: Request) {
    // Access cookies via the request headers
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...v] = c.trim().split('=')
            return [key, v.join('=')]
        })
    )

    const adminCookieValue = cookies[ADMIN_COOKIE]

    if (adminCookieValue !== 'admin') {
        return NextResponse.json(
            { error: 'Forbidden. Admin access required.' },
            { status: 403 }
        )
    }

    return null // Authorized
}
