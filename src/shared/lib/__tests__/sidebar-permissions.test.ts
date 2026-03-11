/**
 * TDD RED 阶段：超管权限模块访问检查测试
 *
 * 验证行为：
 * 1. PLATFORM_ADMIN 角色可访问所有业务模块
 * 2. SUPER_ADMIN 角色可访问所有业务模块（已有，保持不变）
 * 3. __PLATFORM__ 特殊权限仅 PLATFORM_ADMIN / SUPER_ADMIN 可见
 * 4. 普通角色 (SALES) 不能访问 __PLATFORM__ 模块
 */
import { describe, it, expect } from 'vitest';
import { hasModuleAccess } from '@/shared/lib/sidebar-permissions';

describe('hasModuleAccess - 超管全量权限', () => {
  describe('PLATFORM_ADMIN 角色（当前超管返回的 role）', () => {
    it('PLATFORM_ADMIN 可访问线索模块 lead', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], 'lead')).toBe(true);
    });

    it('PLATFORM_ADMIN 可访问订单模块 order', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], 'order')).toBe(true);
    });

    it('PLATFORM_ADMIN 可访问财务模块 finance', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], 'finance')).toBe(true);
    });

    it('PLATFORM_ADMIN 可访问 admin 模块（系统设置）', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], 'admin')).toBe(true);
    });

    it('PLATFORM_ADMIN 可访问 channel 模块', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], 'channel')).toBe(true);
    });
  });

  describe('SUPER_ADMIN 角色（原有，保持不变）', () => {
    it('SUPER_ADMIN 可访问线索模块 lead', () => {
      expect(hasModuleAccess(['SUPER_ADMIN'], 'lead')).toBe(true);
    });

    it('SUPER_ADMIN 可访问任意模块', () => {
      expect(hasModuleAccess(['SUPER_ADMIN'], 'analytics')).toBe(true);
    });
  });

  describe('__PLATFORM__ 特殊权限仅超管可见', () => {
    it('PLATFORM_ADMIN 可访问 __PLATFORM__ 模块', () => {
      expect(hasModuleAccess(['PLATFORM_ADMIN'], '__PLATFORM__')).toBe(true);
    });

    it('SUPER_ADMIN 可访问 __PLATFORM__ 模块', () => {
      expect(hasModuleAccess(['SUPER_ADMIN'], '__PLATFORM__')).toBe(true);
    });

    it('普通用户 SALES 不能访问 __PLATFORM__ 模块', () => {
      expect(hasModuleAccess(['SALES'], '__PLATFORM__')).toBe(false);
    });

    it('BOSS 不能访问 __PLATFORM__ 模块', () => {
      expect(hasModuleAccess(['BOSS'], '__PLATFORM__')).toBe(false);
    });

    it('ADMIN 不能访问 __PLATFORM__ 模块', () => {
      expect(hasModuleAccess(['ADMIN'], '__PLATFORM__')).toBe(false);
    });
  });

  describe('普通角色访问限制（回归验证，确保正常用户权限不变）', () => {
    it('SALES 不能访问 admin 模块', () => {
      expect(hasModuleAccess(['SALES'], 'admin')).toBe(false);
    });

    it('SALES 可访问 lead 模块（原有权限保持）', () => {
      expect(hasModuleAccess(['SALES'], 'lead')).toBe(true);
    });

    it('BOSS 可访问所有业务模块', () => {
      expect(hasModuleAccess(['BOSS'], 'finance')).toBe(true);
    });
  });
});
