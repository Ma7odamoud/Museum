import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CORRECT_PASSWORD = '220810'
const AUTH_COOKIE_NAME = 'museum_auth'

export async function POST(request: Request) {
    try {
        const { password } = await request.json()

        if (password === CORRECT_PASSWORD) {
            // Set authentication cookie (not httpOnly so client can read it)
            cookies().set(AUTH_COOKIE_NAME, 'authenticated', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid password' },
            { status: 401 }
        )
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    const cookieStore = cookies()
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME)

    return NextResponse.json({
        authenticated: authCookie?.value === 'authenticated',
    })
}
