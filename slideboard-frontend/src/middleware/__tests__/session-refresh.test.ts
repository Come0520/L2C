import { NextResponse } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { SessionRefreshMiddleware } from '../handlers/session-refresh'

// 1. Mock @supabase/ssr
const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

// 2. Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({
      cookies: {
        set: vi.fn(),
      },
    })),
  },
  NextRequest: vi.fn(),
}))

// 3. Mock @/config/env
vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SUPABASE_URL: 'http://mock-url.com',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key',
  },
}))

// Import env after mocking to ensure we get the mocked version
import { env } from '../../config/env'

describe('SessionRefreshMiddleware', () => {
  let middleware: SessionRefreshMiddleware
  let mockRequest: any
  let mockResponse: any
  let next: any

  beforeEach(() => {
    vi.clearAllMocks()
    middleware = new SessionRefreshMiddleware()
    
    // Reset env to default before each test
    // @ts-ignore
    env.NODE_ENV = 'development'
    
    mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    }
    
    mockResponse = {
      cookies: {
        set: vi.fn(),
      },
    }
    
    next = vi.fn()
  })

  it('should call supabase.auth.getUser() in development', async () => {
    // Set environment to development
    // @ts-ignore
    env.NODE_ENV = 'development'

    await middleware.execute(mockRequest, mockResponse, next)
    
    expect(mockGetUser).toHaveBeenCalledTimes(1)
  })

  it('should call supabase.auth.getUser() in production', async () => {
    // Set environment to production
    // @ts-ignore
    env.NODE_ENV = 'production'

    await middleware.execute(mockRequest, mockResponse, next)
    
    expect(mockGetUser).toHaveBeenCalledTimes(1)
  })
})
