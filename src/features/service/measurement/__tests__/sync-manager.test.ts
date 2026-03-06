/**
 * SyncManager 单元测试
 *
 * 覆盖:
 * - syncOnlineTasks()：从服务器拉取任务并写入离线存储
 * - syncLocalChanges()：将本地待同步数据提交到服务器
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncManager } from '../lib/sync-manager';

// -------------------------
// Mock 依赖模块
// -------------------------
const mockMeasurementsPut = vi.fn().mockResolvedValue(undefined);
const mockMeasurementsUpdate = vi.fn().mockResolvedValue(undefined);
const mockGetPendingSyncList = vi.fn();

vi.mock('@/shared/lib/offline-store', () => ({
  offlineStore: {
    measurements: {
      put: (...args: unknown[]) => mockMeasurementsPut(...args),
      update: (...args: unknown[]) => mockMeasurementsUpdate(...args),
    },
    getPendingSyncList: () => mockGetPendingSyncList(),
  },
}));

const mockGetMeasureTasks = vi.fn();
vi.mock('@/features/service/measurement/actions/queries', () => ({
  getMeasureTasks: (...args: unknown[]) => mockGetMeasureTasks(...args),
}));

const mockSubmitMeasureData = vi.fn();
vi.mock('@/features/service/measurement/actions/workflows', () => ({
  submitMeasureData: (...args: unknown[]) => mockSubmitMeasureData(...args),
}));

const mockCheckInMeasureTask = vi.fn();
vi.mock('@/features/service/measurement/actions/check-in', () => ({
  checkInMeasureTask: (...args: unknown[]) => mockCheckInMeasureTask(...args),
}));

vi.mock('@/features/service/measurement/schemas', () => ({
  measureSheetSchema: {},
}));

// -------------------------
// SyncManager.syncOnlineTasks()
// -------------------------
describe('SyncManager.syncOnlineTasks()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功从服务器拉取任务并写入本地离线存储，返回任务数量', async () => {
    mockGetMeasureTasks.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'task-1',
          measureNo: 'MNT-001',
          customer: { name: '张三', phone: '138xxxx' },
          lead: { community: '阳光小区', address: '3号楼101' },
          scheduledAt: '2026-03-06T09:00:00Z',
        },
        {
          id: 'task-2',
          measureNo: 'MNT-002',
          customer: { name: '李四', phone: '139xxxx' },
          lead: null,
          address: '直接地址',
          scheduledAt: null,
        },
      ],
    });

    const count = await SyncManager.syncOnlineTasks('worker-1');

    expect(count).toBe(2);
    expect(mockMeasurementsPut).toHaveBeenCalledTimes(2);

    // 验证第一条记录写入的字段
    expect(mockMeasurementsPut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        measureNo: 'MNT-001',
        customerName: '张三',
        customerPhone: '138xxxx',
        address: '阳光小区 3号楼101',
        status: 'pending',
      })
    );
  });

  it('无 lead 信息时使用 task.address 字段', async () => {
    mockGetMeasureTasks.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'task-3',
          measureNo: 'MNT-003',
          customer: null,
          lead: null,
          address: '直接填写的地址',
          scheduledAt: null,
        },
      ],
    });

    await SyncManager.syncOnlineTasks('worker-1');

    expect(mockMeasurementsPut).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Unknown',
        customerPhone: '',
        address: '直接填写的地址',
      })
    );
  });

  it('服务器返回 success=false 时不写入本地存储，返回 0', async () => {
    mockGetMeasureTasks.mockResolvedValue({ success: false, data: null });

    const count = await SyncManager.syncOnlineTasks('worker-1');

    expect(count).toBe(0);
    expect(mockMeasurementsPut).not.toHaveBeenCalled();
  });

  it('服务器返回空任务列表时返回 0', async () => {
    mockGetMeasureTasks.mockResolvedValue({ success: true, data: [] });

    const count = await SyncManager.syncOnlineTasks('worker-1');

    expect(count).toBe(0);
    expect(mockMeasurementsPut).not.toHaveBeenCalled();
  });

  it('网络异常时应向上抛出错误', async () => {
    mockGetMeasureTasks.mockRejectedValue(new Error('Network Error'));

    await expect(SyncManager.syncOnlineTasks('worker-1')).rejects.toThrow('Network Error');
  });
});

// -------------------------
// SyncManager.syncLocalChanges()
// -------------------------
describe('SyncManager.syncLocalChanges()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('本地无待同步任务时返回 0', async () => {
    mockGetPendingSyncList.mockResolvedValue([]);

    const count = await SyncManager.syncLocalChanges();

    expect(count).toBe(0);
    expect(mockSubmitMeasureData).not.toHaveBeenCalled();
  });

  it('成功提交任务数据后更新本地状态为 synced，返回成功数量', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      {
        id: 1,
        taskId: 'task-1',
        data: { round: 1, variant: 'A', items: [], sketchMap: 'sketch-url' },
        images: ['img1.jpg'],
        checkIn: null,
      },
    ]);
    mockSubmitMeasureData.mockResolvedValue({ success: true });

    const count = await SyncManager.syncLocalChanges();

    expect(count).toBe(1);
    expect(mockSubmitMeasureData).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        round: 1,
        variant: 'A',
        sitePhotos: ['img1.jpg'],
        sketchMap: 'sketch-url',
      })
    );
    expect(mockMeasurementsUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ status: 'synced' })
    );
  });

  it('有签到数据时先执行签到再提交测量数据', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      {
        id: 2,
        taskId: 'task-2',
        data: { round: 1, variant: 'B', items: [] },
        images: [],
        checkIn: { lat: 30.5, lng: 114.3, address: '测量地址' },
      },
    ]);
    mockCheckInMeasureTask.mockResolvedValue({ success: true });
    mockSubmitMeasureData.mockResolvedValue({ success: true });

    await SyncManager.syncLocalChanges();

    // 签到在提交数据之前执行（验证两者都被调用）
    expect(mockCheckInMeasureTask).toHaveBeenCalled();

    expect(mockCheckInMeasureTask).toHaveBeenCalledWith({
      taskId: 'task-2',
      latitude: 30.5,
      longitude: 114.3,
      address: '测量地址',
    });
    expect(mockSubmitMeasureData).toHaveBeenCalled();
  });

  it('签到失败时不阻断数据提交（记录警告但继续）', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      {
        id: 3,
        taskId: 'task-3',
        data: { round: 1, variant: 'A', items: [] },
        images: [],
        checkIn: { lat: 30.5, lng: 114.3 },
      },
    ]);
    // 签到失败
    mockCheckInMeasureTask.mockResolvedValue({ success: false, error: '签到超时' });
    mockSubmitMeasureData.mockResolvedValue({ success: true });

    const count = await SyncManager.syncLocalChanges();

    // 签到失败但数据提交成功，依然计数
    expect(count).toBe(1);
    expect(mockSubmitMeasureData).toHaveBeenCalled();
  });

  it('taskId 为空的条目应跳过，不计入成功数', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      {
        id: 10,
        taskId: null, // 无 taskId，应跳过
        data: { round: 1, variant: 'A', items: [] },
        images: [],
      },
    ]);

    const count = await SyncManager.syncLocalChanges();

    expect(count).toBe(0);
    expect(mockSubmitMeasureData).not.toHaveBeenCalled();
  });

  it('提交失败时不更新本地状态，返回 0', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      {
        id: 4,
        taskId: 'task-4',
        data: { round: 1, variant: 'A', items: [] },
        images: [],
      },
    ]);
    mockSubmitMeasureData.mockResolvedValue({ success: false, error: '服务器错误' });

    const count = await SyncManager.syncLocalChanges();

    expect(count).toBe(0);
    expect(mockMeasurementsUpdate).not.toHaveBeenCalled();
  });

  it('多条任务时部分成功部分失败，只计入成功数', async () => {
    mockGetPendingSyncList.mockResolvedValue([
      { id: 5, taskId: 'task-ok', data: { round: 1, variant: 'A', items: [] }, images: [] },
      { id: 6, taskId: 'task-fail', data: { round: 1, variant: 'A', items: [] }, images: [] },
    ]);

    mockSubmitMeasureData
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: '提交失败' });

    const count = await SyncManager.syncLocalChanges();

    expect(count).toBe(1);
    expect(mockMeasurementsUpdate).toHaveBeenCalledTimes(1);
  });

  it('getPendingSyncList 异常时向上抛出错误', async () => {
    mockGetPendingSyncList.mockRejectedValue(new Error('离线存储故障'));

    await expect(SyncManager.syncLocalChanges()).rejects.toThrow('离线存储故障');
  });
});
