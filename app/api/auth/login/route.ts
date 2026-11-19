import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, ADMIN_COOKIE, MUSEUM_PASSWORD, isAdminEmail } from '@/lib/auth'

/** Returns true if the email is one of the two allowed accounts. */
function isAllowedEmail(email: string): boolean {
    return isAdminEmail(email)
}

export async function POST(request: NextRequest) {
    const { email, password } = await request.json()

    if (password !== MUSEUM_PASSWORD) {
        return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }

    // Only the two emails in .env are allowed in
    if (!email || !isAllowedEmail(email)) {
        return NextResponse.json({ error: 'This email is not authorized.' }, { status: 403 })
    }

    const response = NextResponse.json({ success: true })

    const cookieOptions = {
        httpOnly: false, // Client-readable so hallway/admin pages can read it
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    }

    // Grant general museum access
    response.cookies.set(AUTH_COOKIE, 'authenticated', cookieOptions)

    // Grant admin access if email matches either admin
    if (isAdminEmail(email)) {
        response.cookies.set(ADMIN_COOKIE, 'admin', cookieOptions)
    }

    return response
}
