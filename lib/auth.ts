/**
 * Simple cookie-based auth helpers.
 * The app uses two cookies:
 *   - `museum_auth`  = "authenticated" → grants access to /hallway
 *   - `admin_auth`   = "admin"         → grants access to /admin panel
 *
 * Two admins: set ADMIN_EMAIL and ADMIN_EMAIL_2 in .env
 */

export const AUTH_COOKIE = 'museum_auth'
export const ADMIN_COOKIE = 'admin_auth'
export const MUSEUM_PASSWORD = process.env.ADMIN_PASSWORD || '220810'

/**
 * Returns true if the given email matches either admin email (case-insensitive).
 * Add your girlfriend's email as ADMIN_EMAIL_2 in .env
 */
export function isAdminEmail(email: string): boolean {
    const normalized = email.toLowerCase().trim()
    const admin1 = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
    const admin2 = (process.env.ADMIN_EMAIL_2 || '').toLowerCase().trim()
    return normalized === admin1 || (admin2 !== '' && normalized === admin2)
}

