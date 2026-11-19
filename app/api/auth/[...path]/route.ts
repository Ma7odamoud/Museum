import { NextResponse } from 'next/server'

// Auth is now handled via /api/auth/login
// This catch-all route is kept to avoid 404s from any lingering references
export async function GET() {
    return NextResponse.json({ message: 'Auth endpoint deprecated. Use /api/auth/login' }, { status: 410 })
}

export async function POST() {
    return NextResponse.json({ message: 'Auth endpoint deprecated. Use /api/auth/login' }, { status: 410 })
}
