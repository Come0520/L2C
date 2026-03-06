/**
 * conflict-detection.ts 单元测试
 * TDD — RED 阶段：覆盖调度硬冲突、软冲突（任务数量预警）及租户隔离
 *
 * 注意：parseTimeSlot / isTimeOverlap 是内部函数，通过 checkSchedulingConflict 行为间接验证
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSchedulingConflict, CONFLICT_CONFIG } from '../conflict-detection';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  calculateHaversineDistance: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      installTasks: {
        findMany: mocks.findMany,
      },
    },
  },
}));

vi.mock('@/shared/lib/gps-utils', () => ({
  calculateHaversineDistance: mocks.calculateHaversineDistance,
}));

// ---- 公共测试数据 ----
const INSTALLER_ID = 'installer-001';
const TENANT_ID = 'tenant-abc';
const DATE = new Date('2026-03-10T00:00:00.000Z');

/** 构造一个仿任务对象 */
function makeTask(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'task-1',
    taskNo: 'T-001',
    installerId: INSTALLER_ID,
    tenantId: TENANT_ID,
    scheduledDate: DATE,
    scheduledTimeSlot: '上午',
    status: 'ASSIGNED',
    address: null,
    ...overrides,
  };
}

describe('CONFLICT_CONFIG', () => {
  it('最大赶场距离应为 50km', () => {
    expect(CONFLICT_CONFIG.MAX_DISTANCE_KM).toBe(50);
  });

  it('最小时间间隔应为 2 小时', () => {
    expect(CONFLICT_CONFIG.MIN_TIME_GAP_HOURS).toBe(2);
  });

  it('每日最大任务数应为 3', () => {
    expect(CONFLICT_CONFIG.MAX_DAILY_TASKS).toBe(3);
  });
});

describe('checkSchedulingConflict — 无冲突场景', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('当天无任何任务时应返回 NONE', async () => {
    mocks.findMany.mockResolvedValue([]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    expect(result.hasConflict).toBe(false);
    expect(result.conflictType).toBe('NONE');
  });

  it('同一师傅同一天有任务但不同时段 → 无硬冲突', async () => {
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '下午', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    expect(result.hasConflict).toBe(false);
    expect(result.conflictType).toBe('NONE');
  });

  it('重叠时段但任务已完成 → 不算硬冲突', async () => {
    mocks.findMany.mockResolvedValue([
      makeTask({ scheduledTimeSlot: '上午', status: 'COMPLETED' }),
    ]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    // 不应触发硬冲突（已完成的忽略）
    // 活跃任务数 = 0，不触发软冲突
    expect(result.conflictType).toBe('NONE');
  });

  it('当前编辑任务 id 应被排除在冲突检查外', async () => {
    // findMany 应通过 not(eq(id, currentTaskId)) 条件过滤，
    // 此处 mock 返回空（模拟数据库已排除自身）
    mocks.findMany.mockResolvedValue([]);

    const result = await checkSchedulingConflict(
      INSTALLER_ID,
      DATE,
      '上午',
      TENANT_ID,
      'current-task-id' // currentTaskId
    );

    expect(result.hasConflict).toBe(false);
    // 验证 findMany 被调用了（含过滤条件），而不是跳过查询
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });
});

describe('checkSchedulingConflict — 硬冲突（HARD）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('同一时段"上午"已有未完成任务 → HARD 冲突', async () => {
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '上午', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe('HARD');
    expect(result.conflictingTaskId).toBe('task-1');
    expect(result.message).toContain('上午');
  });

  it('"下午" 与 "14:00-17:00" 时段存在重叠 → HARD 冲突', async () => {
    // 下午 = 14~17, 自定义 14:00-17:00 = 14~17，完全重叠
    mocks.findMany.mockResolvedValue([
      makeTask({ scheduledTimeSlot: '14:00-17:00', status: 'ASSIGNED' }),
    ]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '下午', TENANT_ID);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe('HARD');
  });

  it('"AM" 与 "上午" 时段重叠（英文别名）→ HARD 冲突', async () => {
    mocks.findMany.mockResolvedValue([
      makeTask({ scheduledTimeSlot: 'AM', status: 'IN_PROGRESS' }),
    ]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe('HARD');
  });

  it('不同时段（上午/下午）不重叠 → 无 HARD 冲突', async () => {
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '下午', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    expect(result.conflictType).not.toBe('HARD');
  });

  it('时段格式无法解析（空字符串）→ 不发生硬冲突', async () => {
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', TENANT_ID);

    // 无法解析的时段不触发硬冲突
    expect(result.conflictType).not.toBe('HARD');
  });
});

describe('checkSchedulingConflict — 软冲突（SOFT）— 任务数量', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`当日活跃任务数 = ${CONFLICT_CONFIG.MAX_DAILY_TASKS} 时触发软冲突`, async () => {
    // 3 个不同时段的活跃任务（不和新任务"晚间"重叠）
    const tasks = [
      makeTask({ id: 't1', scheduledTimeSlot: '上午', status: 'ASSIGNED' }),
      makeTask({ id: 't2', scheduledTimeSlot: '下午', status: 'IN_PROGRESS' }),
      makeTask({ id: 't3', scheduledTimeSlot: '下午', status: 'PENDING' }),
    ];
    mocks.findMany.mockResolvedValue(tasks);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '晚间', TENANT_ID);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictType).toBe('SOFT');
    expect(result.message).toContain(String(CONFLICT_CONFIG.MAX_DAILY_TASKS));
  });

  it('当日活跃任务数 = MAX - 1 时不触发数量软冲突', async () => {
    const tasks = [
      makeTask({ id: 't1', scheduledTimeSlot: '上午', status: 'ASSIGNED' }),
      makeTask({ id: 't2', scheduledTimeSlot: '下午', status: 'IN_PROGRESS' }),
    ];
    mocks.findMany.mockResolvedValue(tasks);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '晚间', TENANT_ID);

    expect(result.conflictType).toBe('NONE');
  });

  it('已完成任务不计入当日活跃数量', async () => {
    // 3 个任务，但全部 COMPLETED → 活跃数 = 0
    const tasks = [
      makeTask({ id: 't1', scheduledTimeSlot: '上午', status: 'COMPLETED' }),
      makeTask({ id: 't2', scheduledTimeSlot: '下午', status: 'COMPLETED' }),
      makeTask({ id: 't3', scheduledTimeSlot: '下午', status: 'COMPLETED' }),
    ];
    mocks.findMany.mockResolvedValue(tasks);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '晚间', TENANT_ID);

    // 无活跃任务，不触发数量软冲突
    expect(result.conflictType).toBe('NONE');
  });
});

describe('checkSchedulingConflict — 租户隔离', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('数据库应使用 tenantId 做过滤（验证 findMany 被调用）', async () => {
    mocks.findMany.mockResolvedValue([]);

    await checkSchedulingConflict(INSTALLER_ID, DATE, '上午', 'tenant-xyz');

    // 验证方法被调用（实际租户过滤由 Drizzle where 条件完成，单元测试层面确认有调用）
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });
});

describe('checkSchedulingConflict — 时段解析边界场景', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('待检查时段无法解析时不触发硬冲突', async () => {
    // 存在已知时段任务，但目标时段无法解析
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '上午', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '未知时段XYZ', TENANT_ID);

    // 解析失败不应触发硬冲突（不影响当日任务数软冲突）
    expect(result.conflictType).not.toBe('HARD');
  });

  it('"晚间" 与 "上午" 时间不重叠 → NONE', async () => {
    mocks.findMany.mockResolvedValue([makeTask({ scheduledTimeSlot: '上午', status: 'ASSIGNED' })]);

    const result = await checkSchedulingConflict(INSTALLER_ID, DATE, '晚间', TENANT_ID);

    expect(result.conflictType).toBe('NONE');
  });
});
