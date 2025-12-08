import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureMessage('Sentry edge runtime test', {
      level: 'info',
      extra: { runtime: 'edge', timestamp: new Date().toISOString() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

