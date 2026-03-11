/**
 * proxy 路由访问规则纯函数
 * 从 Edge Runtime proxy.ts 提取出来，使其能够被单元测试覆盖。
 */

/** checkProxyRouteAccess 的返回值类型 */
export type ProxyRouteDecision = 'allow' | 'deny' | 'continue';

/** 路由访问检查参数 */
export interface ProxyRouteCheckParams {
  /** 是否为平台超管 */
  isPlatformAdmin: boolean;
  /** 当前请求路径（如 /leads, /api/admin） */
  pathname: string;
}

/**
 * 检查请求路径在超管权限重构后的访问决策
 *
 * @returns
 *  - 'allow'：直接放行（超管全量访问）
 *  - 'deny'：直接拒绝（普通用户访问平台管理路由）
 *  - 'continue'：继续由 proxy 的后续逻辑处理（普通用户访问普通业务路由）
 */
export function checkProxyRouteAccess(params: ProxyRouteCheckParams): ProxyRouteDecision {
  const { isPlatformAdmin, pathname } = params;

  // 超管：全量放行所有路由（业务页/业务 API/平台管理均可访问）
  if (isPlatformAdmin) {
    return 'allow';
  }

  // 普通用户：不能访问平台管理路由
  if (pathname.startsWith('/admin/platform') || pathname.startsWith('/api/admin')) {
    return 'deny';
  }

  // 普通用户访问普通业务路由：交由 proxy 后续逻辑继续判断
  return 'continue';
}
