/**
 * finance-permissions.ts 单元测试
 * TDD — 纯函数逻辑，无需 mock，测试 RBAC 权限边界
 *
 * 覆盖：
 *   - 标准角色（ADMIN/FINANCE）的各操作权限
 *   - 普通角色（SALES/TECH）无权访问场景
 *   - isSimpleMode=true 时全员放行
 *   - 空角色数组边界
 */
import { describe, it, expect } from 'vitest';
import {
  canCreateJournal,
  canReviewJournal,
  canReverseJournal,
  canClosePeriod,
  canViewReports,
} from '../utils/finance-permissions';

// ---- 角色常量 ----
const ADMIN = ['ADMIN'];
const FINANCE = ['FINANCE'];
const SALES = ['SALES'];
const TECH = ['TECH'];
const MULTI = ['SALES', 'FINANCE']; // 多角色中含 FINANCE
const EMPTY: string[] = [];

// ============================================================
// canCreateJournal — 创建/编辑草稿凭证
// ============================================================
describe('canCreateJournal', () => {
  it('ADMIN 可以创建凭证', () => expect(canCreateJournal(ADMIN)).toBe(true));
  it('FINANCE 可以创建凭证', () => expect(canCreateJournal(FINANCE)).toBe(true));
  it('SALES 不可创建凭证', () => expect(canCreateJournal(SALES)).toBe(false));
  it('TECH 不可创建凭证', () => expect(canCreateJournal(TECH)).toBe(false));
  it('空角色不可创建凭证', () => expect(canCreateJournal(EMPTY)).toBe(false));
  it('多角色含 FINANCE 可创建凭证', () => expect(canCreateJournal(MULTI)).toBe(true));

  it('简易模式下任意角色均可创建（SALES）', () => expect(canCreateJournal(SALES, true)).toBe(true));
  it('简易模式下空角色也可创建', () => expect(canCreateJournal(EMPTY, true)).toBe(true));
});

// ============================================================
// canReviewJournal — 复核/过账凭证
// ============================================================
describe('canReviewJournal', () => {
  it('ADMIN 可以过账', () => expect(canReviewJournal(ADMIN)).toBe(true));
  it('FINANCE 可以过账', () => expect(canReviewJournal(FINANCE)).toBe(true));
  it('SALES 不可过账', () => expect(canReviewJournal(SALES)).toBe(false));
  it('简易模式 SALES 可过账', () => expect(canReviewJournal(SALES, true)).toBe(true));
});

// ============================================================
// canReverseJournal — 红字冲销（高危）
// ============================================================
describe('canReverseJournal', () => {
  it('ADMIN 可冲销', () => expect(canReverseJournal(ADMIN)).toBe(true));
  it('FINANCE 可冲销', () => expect(canReverseJournal(FINANCE)).toBe(true));
  it('SALES 不可冲销', () => expect(canReverseJournal(SALES)).toBe(false));
  it('TECH 不可冲销', () => expect(canReverseJournal(TECH)).toBe(false));
  it('简易模式 TECH 可冲销', () => expect(canReverseJournal(TECH, true)).toBe(true));
});

// ============================================================
// canClosePeriod — 期末结账（高危）
// ============================================================
describe('canClosePeriod', () => {
  it('ADMIN 可关账', () => expect(canClosePeriod(ADMIN)).toBe(true));
  it('FINANCE 可关账', () => expect(canClosePeriod(FINANCE)).toBe(true));
  it('SALES 不可关账', () => expect(canClosePeriod(SALES)).toBe(false));
  it('空角色不可关账', () => expect(canClosePeriod(EMPTY)).toBe(false));
  it('简易模式任意角色可关账', () => expect(canClosePeriod(SALES, true)).toBe(true));
});

// ============================================================
// canViewReports — 三大财务报表查看
// ============================================================
describe('canViewReports', () => {
  it('ADMIN 可查报表', () => expect(canViewReports(ADMIN)).toBe(true));
  it('FINANCE 可查报表', () => expect(canViewReports(FINANCE)).toBe(true));
  it('SALES 不可查报表', () => expect(canViewReports(SALES)).toBe(false));
  it('多角色 [SALES, FINANCE] 可查报表', () => expect(canViewReports(MULTI)).toBe(true));
  it('简易模式 SALES 可查报表', () => expect(canViewReports(SALES, true)).toBe(true));
});

// ============================================================
// 综合场景：权限矩阵验证
// ============================================================
describe('权限矩阵 — ADMIN 全权', () => {
  const ops = [
    canCreateJournal,
    canReviewJournal,
    canReverseJournal,
    canClosePeriod,
    canViewReports,
  ];
  it('ADMIN 应拥有所有财务权限', () => {
    ops.forEach((fn) => expect(fn(ADMIN)).toBe(true));
  });
});

describe('权限矩阵 — 普通角色全无权', () => {
  const ops = [
    canCreateJournal,
    canReviewJournal,
    canReverseJournal,
    canClosePeriod,
    canViewReports,
  ];
  it('TECH 不应拥有任何财务权限', () => {
    ops.forEach((fn) => expect(fn(TECH)).toBe(false));
  });
});
