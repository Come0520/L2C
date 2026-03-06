/**
 * offline-signature.ts 单元测试
 * TDD — 离线签名存储服务（localStorage mock、上传重试、同步逻辑）
 *
 * 注意：此文件带 'use client' 标注，所以运行在 jsdom 环境
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPendingSignatures,
  cacheSignatureOffline,
  removeSignature,
  updateSignatureStatus,
  isOnline,
  uploadSignature,
  syncPendingSignatures,
  getPendingCount,
  clearAllPending,
  blobToBase64,
  base64ToBlob,
} from '../offline-signature';

// ---- localStorage Mock ----
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ---- 每次重置存储 ----
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ============================================================
// getPendingSignatures
// ============================================================
describe('getPendingSignatures', () => {
  it('localStorage 为空时返回空数组', () => {
    expect(getPendingSignatures()).toEqual([]);
  });

  it('返回已存储的签名列表', () => {
    const sigs = [
      {
        id: 'sig_001',
        taskId: 't1',
        signatureData: 'base64...',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending' as const,
      },
    ];
    localStorage.setItem('offline_signatures', JSON.stringify(sigs));
    expect(getPendingSignatures()).toHaveLength(1);
  });

  it('localStorage 内容无效时返回空数组（容错）', () => {
    localStorage.setItem('offline_signatures', '{ INVALID JSON }');
    expect(getPendingSignatures()).toEqual([]);
  });
});

// ============================================================
// cacheSignatureOffline
// ============================================================
describe('cacheSignatureOffline', () => {
  it('将签名保存到 localStorage 并返回 ID', async () => {
    const blob = new Blob(['fake-signature'], { type: 'image/png' });
    const id = await cacheSignatureOffline('task-001', blob);

    expect(id).toMatch(/^sig_/);
    const stored = getPendingSignatures();
    expect(stored).toHaveLength(1);
    expect(stored[0].taskId).toBe('task-001');
    expect(stored[0].status).toBe('pending');
    expect(stored[0].retryCount).toBe(0);
  });

  it('多次缓存时列表累积', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    await cacheSignatureOffline('task-001', blob);
    await cacheSignatureOffline('task-002', blob);

    expect(getPendingSignatures()).toHaveLength(2);
  });
});

// ============================================================
// removeSignature
// ============================================================
describe('removeSignature', () => {
  it('移除指定 ID 的签名', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    const id = await cacheSignatureOffline('task-001', blob);

    removeSignature(id);

    expect(getPendingSignatures()).toHaveLength(0);
  });

  it('移除不存在的 ID 不报错', () => {
    expect(() => removeSignature('non-existent-id')).not.toThrow();
  });
});

// ============================================================
// updateSignatureStatus
// ============================================================
describe('updateSignatureStatus', () => {
  it('更新指定签名的状态', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    const id = await cacheSignatureOffline('task-001', blob);

    updateSignatureStatus(id, 'uploading');

    const sig = getPendingSignatures().find((s) => s.id === id);
    expect(sig?.status).toBe('uploading');
    expect(sig?.lastAttempt).toBeDefined();
  });

  it('同时更新 retryCount', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    const id = await cacheSignatureOffline('task-001', blob);

    updateSignatureStatus(id, 'failed', 3);

    const sig = getPendingSignatures().find((s) => s.id === id);
    expect(sig?.retryCount).toBe(3);
    expect(sig?.status).toBe('failed');
  });

  it('ID 不存在时静默跳过', () => {
    expect(() => updateSignatureStatus('non-existent', 'failed')).not.toThrow();
  });
});

// ============================================================
// isOnline
// ============================================================
describe('isOnline', () => {
  it('navigator.onLine=true → 返回 true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    expect(isOnline()).toBe(true);
  });

  it('navigator.onLine=false → 返回 false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    expect(isOnline()).toBe(false);
    // 恢复
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });
});

// ============================================================
// uploadSignature
// ============================================================
describe('uploadSignature', () => {
  const baseSig = {
    id: 'sig_001',
    taskId: 'task-001',
    signatureData: 'data:image/png;base64,aGVsbG8=',
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending' as const,
  };

  beforeEach(() => {
    localStorage.setItem('offline_signatures', JSON.stringify([baseSig]));
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  it('网络离线时跳过上传并返回 false', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const uploadFn = vi.fn();

    const result = await uploadSignature(baseSig, uploadFn);

    expect(result).toBe(false);
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it('上传成功时从 localStorage 删除并返回 true', async () => {
    const uploadFn = vi.fn().mockResolvedValue({ success: true });

    const result = await uploadSignature(baseSig, uploadFn);

    expect(result).toBe(true);
    expect(getPendingSignatures()).toHaveLength(0); // 已移除
    expect(uploadFn).toHaveBeenCalledWith('task-001', expect.any(Blob));
  });

  it('上传失败时增加 retryCount 并返回 false', async () => {
    const uploadFn = vi.fn().mockResolvedValue({ success: false, error: '网络错误' });

    const result = await uploadSignature(baseSig, uploadFn);

    expect(result).toBe(false);
    const sig = getPendingSignatures()[0];
    expect(sig?.retryCount).toBe(1);
    expect(sig?.status).toBe('failed');
  });

  it('上传抛出异常时也返回 false 并 retryCount++', async () => {
    const uploadFn = vi.fn().mockRejectedValue(new Error('timeout'));

    const result = await uploadSignature(baseSig, uploadFn);

    expect(result).toBe(false);
    const sig = getPendingSignatures()[0];
    expect(sig?.retryCount).toBe(1);
  });
});

// ============================================================
// syncPendingSignatures
// ============================================================
describe('syncPendingSignatures', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  it('无待上传签名时返回 { total:0, success:0, failed:0 }', async () => {
    const result = await syncPendingSignatures(vi.fn());
    expect(result).toEqual({ total: 0, success: 0, failed: 0 });
  });

  it('网络离线时返回 { total:N, success:0, failed:0 }', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    localStorage.setItem(
      'offline_signatures',
      JSON.stringify([
        {
          id: 'sig_1',
          taskId: 't1',
          signatureData: 'data:image/png;base64,aGVsbG8=',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          status: 'pending',
        },
      ])
    );

    const result = await syncPendingSignatures(vi.fn());
    expect(result.total).toBe(1);
    expect(result.success).toBe(0);
  });

  it('超过最大重试次数(5)的签名被跳过', async () => {
    localStorage.setItem(
      'offline_signatures',
      JSON.stringify([
        {
          id: 'sig_max',
          taskId: 't1',
          signatureData: 'data:image/png;base64,aGVsbG8=',
          createdAt: new Date().toISOString(),
          retryCount: 5,
          status: 'failed',
        },
      ])
    );
    const uploadFn = vi.fn().mockResolvedValue({ success: true });

    const result = await syncPendingSignatures(uploadFn);

    expect(uploadFn).not.toHaveBeenCalled(); // retryCount=5 被过滤掉
    expect(result.success).toBe(0);
  }, 10000);
});

// ============================================================
// getPendingCount / clearAllPending
// ============================================================
describe('getPendingCount', () => {
  it('返回待上传签名数量', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    await cacheSignatureOffline('t1', blob);
    await cacheSignatureOffline('t2', blob);
    expect(getPendingCount()).toBe(2);
  });
});

describe('clearAllPending', () => {
  it('清空所有待上传签名', async () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    await cacheSignatureOffline('t1', blob);
    clearAllPending();
    expect(getPendingSignatures()).toHaveLength(0);
  });
});

// ============================================================
// base64ToBlob / blobToBase64（工具函数）
// ============================================================
describe('base64ToBlob', () => {
  it('正确还原 Blob 类型', () => {
    const b64 = 'data:image/png;base64,aGVsbG8='; // "hello"
    const blob = base64ToBlob(b64);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});
