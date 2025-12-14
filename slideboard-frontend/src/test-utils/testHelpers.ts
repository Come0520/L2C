/**
 * 通用测试辅助函数
 */

import { vi } from 'vitest';

/**
 * 生成随机ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * 生成随机邮箱
 */
export const generateEmail = (prefix = 'test'): string => {
  return `${prefix}-${generateId()}@example.com`;
};

/**
 * 生成随机手机号
 */
export const generatePhone = (): string => {
  return `13${Math.floor(Math.random() * 900000000 + 100000000)}`;
};

/**
 * 生成随机日期
 */
export const generateDate = (daysFromNow = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

/**
 * 生成随机ISO日期字符串
 */
export const generateISODate = (daysFromNow = 0): string => {
  return generateDate(daysFromNow).toISOString();
};

/**
 * 等待指定时间
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 模拟API延迟
 */
export const mockApiDelay = async (): Promise<void> => {
  await wait(100 + Math.random() * 200);
};

/**
 * 清理所有mock
 */
export const cleanupMocks = (): void => {
  vi.clearAllMocks();
};

/**
 * 重置所有mock
 */
export const resetMocks = (): void => {
  vi.resetAllMocks();
};

/**
 * 封装异步错误处理，用于测试错误情况
 */
export const expectToThrow = async <T>(fn: () => Promise<T>, errorMessage?: string): Promise<void> => {
  try {
    await fn();
    expect(true).toBe(false); // 如果没有抛出错误，测试失败
  } catch (error) {
    if (errorMessage) {
      const err = error as Error;
      expect(err instanceof Error).toBe(true);
      expect(err.message).toContain(errorMessage);
    }
  }
};

/**
 * 封装同步错误处理，用于测试错误情况
 */
export const expectToThrowSync = <T>(fn: () => T, errorMessage?: string): void => {
  try {
    fn();
    expect(true).toBe(false); // 如果没有抛出错误，测试失败
  } catch (error) {
    if (errorMessage) {
      const err = error as Error;
      expect(err instanceof Error).toBe(true);
      expect(err.message).toContain(errorMessage);
    }
  }
};

/**
 * 检查对象是否包含指定的属性
 */
export const expectObjectToContainProperties = <T extends object>(obj: T, properties: (keyof T)[]): void => {
  expect(obj).toBeDefined();
  properties.forEach(prop => {
    expect(obj).toHaveProperty(String(prop));
  });
};

/**
 * 模拟localStorage
 */
export const mockLocalStorage = (): void => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  vi.stubGlobal('localStorage', localStorageMock);
};

/**
 * 模拟sessionStorage
 */
export const mockSessionStorage = (): void => {
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  vi.stubGlobal('sessionStorage', sessionStorageMock);
};

/**
 * 模拟window对象
 */
export const mockWindow = (): void => {
  vi.stubGlobal('window', {
    location: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
      language: 'zh-CN',
    },
  });
};

/**
 * 模拟fetch API
 */
export const mockFetch = (response: any, status = 200): void => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

/**
 * 模拟fetch API错误
 */
export const mockFetchError = (errorMessage = 'Network error'): void => {
  global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
};

/**
 * 生成分页数据
 */
export const generatePaginationData = <T>(items: T[], page = 1, perPage = 10) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    total: items.length,
    page,
    perPage,
    totalPages: Math.ceil(items.length / perPage),
  };
};

/**
 * 检查分页数据结构
 */
export const expectPaginationStructure = <T>(data: any): void => {
  expect(data).toHaveProperty('items');
  expect(data).toHaveProperty('total');
  expect(data).toHaveProperty('page');
  expect(data).toHaveProperty('perPage');
  expect(data).toHaveProperty('totalPages');
  expect(Array.isArray(data.items)).toBe(true);
  expect(typeof data.total).toBe('number');
  expect(typeof data.page).toBe('number');
  expect(typeof data.perPage).toBe('number');
  expect(typeof data.totalPages).toBe('number');
};

/**
 * 检查错误响应结构
 */
export const expectErrorStructure = (error: any): void => {
  expect(error).toHaveProperty('error');
  expect(error).toHaveProperty('message');
  expect(typeof error.error).toBe('boolean');
  expect(typeof error.message).toBe('string');
};

/**
 * 检查成功响应结构
 */
export const expectSuccessStructure = <T>(response: any): void => {
  expect(response).toHaveProperty('success');
  expect(response.success).toBe(true);
};

/**
 * 检查成功响应带数据结构
 */
export const expectSuccessWithDataStructure = <T>(response: any): void => {
  expect(response).toHaveProperty('success');
  expect(response).toHaveProperty('data');
  expect(response.success).toBe(true);
};
