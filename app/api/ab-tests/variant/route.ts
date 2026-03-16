import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { auth } from '@/lib/auth'
import { getVariant } from '@/lib/ab-testing'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const ANON_COOKIE = 'ab_anon_id'

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const testName = req.nextUrl.searchParams.get('test')
    if (!testName) {
      return NextResponse.json({ error: 'test parameter required' }, { status: 400 })
    }

    // Use session user ID or anonymous cookie
    const session = await auth()
    let userId = session?.user?.id

    if (!userId) {
      const cookieStore = await cookies()
      let anonId = cookieStore.get(ANON_COOKIE)?.value
      if (!anonId) {
        anonId = crypto.randomUUID()
      }
      userId = `anon_${anonId}`

      const result = await getVariant(testName, userId)
      const response = NextResponse.json({ variant: result })
      response.cookies.set(ANON_COOKIE, anonId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
      return response
    }

    const result = await getVariant(testName, userId)
    return NextResponse.json({ variant: result })
  })
}
