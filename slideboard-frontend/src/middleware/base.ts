import { NextRequest, NextResponse } from 'next/server';

/**
 * 中间件接口
 */
export interface Middleware {
  /**
   * 执行中间件逻辑
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   * @returns 可选的响应对象。如果返回响应对象，将替换当前的响应对象。
   */
  execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void>;
}

/**
 * 中间件链管理器
 * 用于管理和执行中间件链
 */
export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  /**
   * 添加中间件到链中
   * @param middleware 中间件实例
   * @returns 中间件链实例（支持链式调用）
   */
  add(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 执行中间件链
   * @param request 请求对象
   * @param response 响应对象
   * @returns 处理后的响应对象
   */
  async execute(request: NextRequest, response: NextResponse): Promise<NextResponse> {
    let currentIndex = 0;
    let currentResponse = response;

    const next = async (): Promise<void> => {
      if (currentIndex < this.middlewares.length) {
        const middleware = this.middlewares[currentIndex++];
        if (middleware) {
          const result = await middleware.execute(request, currentResponse, next);
          if (result instanceof NextResponse) {
            currentResponse = result;
          }
        }
      }
    };

    await next();
    return currentResponse;
  }
}

/**
 * 基础中间件类
 * 提供中间件的基础实现
 */
export abstract class BaseMiddleware implements Middleware {
  /**
   * 执行中间件逻辑
   * @param request 请求对象
   * @param response 响应对象
   * @param next 下一个中间件函数
   */
  abstract execute(request: NextRequest, response: NextResponse, next: () => Promise<void>): Promise<NextResponse | void>;
}
