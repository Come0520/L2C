import { NextResponse, type NextRequest } from 'next/server'

import { MiddlewareChain } from './middleware/base'
import { CorsMiddleware } from './middleware/cors'
import { AuthMiddleware } from './middleware/handlers/auth'
import { RateLimitMiddleware } from './middleware/handlers/rate-limit'
import { SessionRefreshMiddleware } from './middleware/handlers/session-refresh'
import { RequestLoggingMiddleware } from './middleware/logging'
import { SecurityHeadersMiddleware } from './middleware/security'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const chain = new MiddlewareChain()
    .add(new RequestLoggingMiddleware())
    .add(new SecurityHeadersMiddleware())
    .add(new CorsMiddleware())
    .add(new RateLimitMiddleware())
    .add(new SessionRefreshMiddleware())
    .add(new AuthMiddleware())

  return chain.execute(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
