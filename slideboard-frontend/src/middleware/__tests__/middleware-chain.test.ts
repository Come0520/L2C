import { NextResponse } from 'next/server'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { MiddlewareChain, BaseMiddleware } from '@/middleware/base'
import { AuthMiddleware } from '@/middleware/handlers/auth'
import { PermissionMiddleware } from '@/middleware/handlers/permission'
import { SessionRefreshMiddleware } from '@/middleware/handlers/session-refresh'

vi.mock('@supabase/ssr', () => {
  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
  }
  return { createServerClient: vi.fn(() => client) }
})

let mockUser: any = null
let mockRole: string = 'user'

vi.mock('@/lib/supabase/server', () => {
  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: { role: mockRole } })),
    })),
  }
  return { createClient: async () => client }
})

function createMockRequest(pathname: string) {
  const cookieStore: Map<string, string> = new Map()
  return {
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
    headers: new Headers(),
    cookies: {
      getAll() {
        return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))
      },
      set(name: string, value: string) {
        cookieStore.set(name, value)
      },
      setAll(cookiesToSet: Array<{ name: string; value: string }>) {
        cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value))
      },
    },
  } as any
}

// 创建测试用的 mock 中间件
class MockMiddleware extends BaseMiddleware {
  public executeCount = 0
  public nextCalled = false
  private readonly shouldReturnResponse: boolean
  private readonly shouldThrowError: boolean

  constructor(shouldReturnResponse: boolean = false, shouldThrowError: boolean = false) {
    super()
    this.shouldReturnResponse = shouldReturnResponse
    this.shouldThrowError = shouldThrowError
  }

  async execute(_request: any, _response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void> {
    this.executeCount++
    
    if (this.shouldThrowError) {
      throw new Error('Middleware error')
    }
    
    await next()
    this.nextCalled = true
    
    if (this.shouldReturnResponse) {
      return NextResponse.next({ headers: { 'X-Mock-Middleware': 'true' } })
    }
  }
}

describe('MiddlewareChain Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create an empty middleware chain', () => {
    const chain = new MiddlewareChain()
    expect(chain).toBeInstanceOf(MiddlewareChain)
  })

  it('should add middleware to the chain', () => {
    const chain = new MiddlewareChain()
    const middleware = new MockMiddleware()
    
    const result = chain.add(middleware)
    
    expect(result).toBe(chain) // 支持链式调用
  })

  it('should execute empty middleware chain', async () => {
    const chain = new MiddlewareChain()
    const request = createMockRequest('/test')
    const response = NextResponse.next()
    
    const result = await chain.execute(request, response)
    
    expect(result).toBe(response)
  })

  it('should execute single middleware', async () => {
    const chain = new MiddlewareChain()
    const middleware = new MockMiddleware()
    chain.add(middleware)
    
    const request = createMockRequest('/test')
    const response = NextResponse.next()
    
    const result = await chain.execute(request, response)
    
    expect(middleware.executeCount).toBe(1)
    expect(middleware.nextCalled).toBe(true)
    expect(result).toBe(response)
  })

  it('should execute multiple middlewares in order', async () => {
    const chain = new MiddlewareChain()
    const middleware1 = new MockMiddleware()
    const middleware2 = new MockMiddleware()
    const middleware3 = new MockMiddleware()
    
    chain.add(middleware1).add(middleware2).add(middleware3)
    
    const request = createMockRequest('/test')
    const response = NextResponse.next()
    
    const result = await chain.execute(request, response)
    
    expect(middleware1.executeCount).toBe(1)
    expect(middleware2.executeCount).toBe(1)
    expect(middleware3.executeCount).toBe(1)
    expect(middleware1.nextCalled).toBe(true)
    expect(middleware2.nextCalled).toBe(true)
    expect(middleware3.nextCalled).toBe(true)
    expect(result).toBe(response)
  })

  it('should use response returned by middleware', async () => {
    const chain = new MiddlewareChain()
    const middleware = new MockMiddleware(true) // 返回新的 NextResponse
    chain.add(middleware)
    
    const request = createMockRequest('/test')
    const originalResponse = NextResponse.next()
    
    const result = await chain.execute(request, originalResponse)
    
    expect(middleware.executeCount).toBe(1)
    expect(middleware.nextCalled).toBe(true)
    expect(result).not.toBe(originalResponse)
    expect(result.headers.get('X-Mock-Middleware')).toBe('true')
  })

  it('should throw error when middleware throws', async () => {
    const chain = new MiddlewareChain()
    const middleware = new MockMiddleware(false, true) // 抛出错误
    chain.add(middleware)
    
    const request = createMockRequest('/test')
    const response = NextResponse.next()
    
    await expect(chain.execute(request, response)).rejects.toThrow('Middleware error')
    expect(middleware.executeCount).toBe(1)
    expect(middleware.nextCalled).toBe(false) // next() 不应该被调用
  })

  it('should execute middlewares in sequence and update response', async () => {
    // 创建三个中间件，第二个返回新的响应
    const chain = new MiddlewareChain()
    const middleware1 = new MockMiddleware()
    const middleware2 = new MockMiddleware(true)
    const middleware3 = new MockMiddleware()
    
    chain.add(middleware1).add(middleware2).add(middleware3)
    
    const request = createMockRequest('/test')
    const originalResponse = NextResponse.next()
    
    const result = await chain.execute(request, originalResponse)
    
    // 所有中间件都应该被执行
    expect(middleware1.executeCount).toBe(1)
    expect(middleware2.executeCount).toBe(1)
    expect(middleware3.executeCount).toBe(1)
    
    // 所有中间件的 next() 都应该被调用
    expect(middleware1.nextCalled).toBe(true)
    expect(middleware2.nextCalled).toBe(true)
    expect(middleware3.nextCalled).toBe(true)
    
    // 结果应该是 middleware2 返回的响应
    expect(result).not.toBe(originalResponse)
    expect(result.headers.get('X-Mock-Middleware')).toBe('true')
  })
})

describe('MiddlewareChain Integration', () => {
  beforeEach(() => {
    mockUser = null
    mockRole = 'user'
    vi.clearAllMocks()
  })

  const createChain = () => {
    return new MiddlewareChain()
      .add(new SessionRefreshMiddleware())
      .add(new AuthMiddleware())
      .add(new PermissionMiddleware())
  }

  it('未登录访问受限路由时重定向到登录页', async () => {
    mockUser = null
    const request = createMockRequest('/dashboard')
    const chain = createChain()
    const response = await chain.execute(request, NextResponse.next())

    // 检查是否重定向
    // 注意：NextResponse.redirect 返回 307 Temporary Redirect
    expect(response.status).toBe(307)
    const location = response.headers.get('Location') || ''
    const url = new URL(location)
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('redirectTo')).toBe('/dashboard')
  })

  it('公共路由直接放行', async () => {
    const request = createMockRequest('/login')
    const chain = createChain()
    const response = await chain.execute(request, NextResponse.next())

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('权限不足访问受限路由时重定向到403页', async () => {
    mockUser = { id: 'u1' }
    mockRole = 'SALES_STORE'
    const request = createMockRequest('/system')
    const chain = createChain()
    const response = await chain.execute(request, NextResponse.next())

    expect(response.status).toBe(307)
    const location = response.headers.get('Location') || ''
    const url = new URL(location)
    expect(url.pathname).toBe('/403')
  })

  it('已登录且权限充足时放行', async () => {
    mockUser = { id: 'u1' }
    mockRole = 'SALES_STORE'
    const request = createMockRequest('/dashboard')
    const chain = createChain()
    const response = await chain.execute(request, NextResponse.next())

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})
