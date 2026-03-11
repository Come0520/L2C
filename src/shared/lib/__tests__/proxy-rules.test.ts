/**
 * TDD RED 阶段：proxy 路由访问规则纯函数测试
 *
 * 测试 `checkProxyRouteAccess` 函数的以下行为：
 * 1. 超管（isPlatformAdmin=true）访问任何路由 → 'allow'
 * 2. 普通用户访问 /admin/platform 或 /api/admin → 'deny'
 * 3. 普通用户访问普通业务路由 → 'allow'（由 proxy 继续处理）
 */
import { describe, it, expect } from 'vitest';
import { checkProxyRouteAccess } from '@/shared/lib/proxy-rules';

describe('checkProxyRouteAccess - 超管路由隔离重构', () => {
  describe('超管（isPlatformAdmin=true）全量放行', () => {
    it('超管访问业务页面 /leads → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/leads' })).toBe('allow');
    });

    it('超管访问业务 API /api/leads → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/api/leads' })).toBe(
        'allow'
      );
    });

    it('超管访问 /finance → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/finance' })).toBe('allow');
    });

    it('超管访问 /admin/platform → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/admin/platform' })).toBe(
        'allow'
      );
    });

    it('超管访问 /api/admin/tenants → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/api/admin/tenants' })).toBe(
        'allow'
      );
    });

    it('超管访问 /dashboard → allow', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: true, pathname: '/dashboard' })).toBe(
        'allow'
      );
    });
  });

  describe('普通用户不能访问平台管理路由', () => {
    it('普通用户访问 /admin/platform → deny', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/admin/platform' })).toBe(
        'deny'
      );
    });

    it('普通用户访问 /admin/platform/tenants → deny', () => {
      expect(
        checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/admin/platform/tenants' })
      ).toBe('deny');
    });

    it('普通用户访问 /api/admin → deny', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/api/admin' })).toBe(
        'deny'
      );
    });

    it('普通用户访问 /api/admin/users → deny', () => {
      expect(checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/api/admin/users' })).toBe(
        'deny'
      );
    });
  });

  describe('普通用户正常业务路由不受影响', () => {
    it('普通用户访问 /leads → 继续（由 proxy 后续判断）', () => {
      const result = checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/leads' });
      expect(result).not.toBe('deny');
    });

    it('普通用户访问 /orders → 继续', () => {
      const result = checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/orders' });
      expect(result).not.toBe('deny');
    });

    it('普通用户访问 /api/orders → 继续', () => {
      const result = checkProxyRouteAccess({ isPlatformAdmin: false, pathname: '/api/orders' });
      expect(result).not.toBe('deny');
    });
  });
});
