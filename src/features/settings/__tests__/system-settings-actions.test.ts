import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

// Mock DB
vi.mock('@/shared/api/db', () => {
    const mockTx = {
        query: {
            systemSettings: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                onConflictDoNothing: vi.fn().mockResolvedValue({}),
                returning: vi.fn().mockResolvedValue([{ id: 'setting-1' }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })),
    };
    return {
        db: {
            query: {
                systemSettings: {
                    findFirst: vi.fn(),
                    findMany: vi.fn(),
                },
            },
            transaction: vi.fn(async (callback) => await callback(mockTx)),
        },
    };
});

import {
    parseSettingValue,
    validateValueType,
} from '../actions/setting-utils';
import {
    getSettingsByCategory,
    getSettingInternal,
    getSetting,
    initTenantSettings,
    getAllSettings,
} from '../actions/system-settings-actions';
import { db } from '@/shared/api/db';

describe('SystemSettingsActions - Task 1: 纯函数单元测试', () => {
    const mockTenantId = 'tenant-1';
    const mockUserId = 'user-1';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId, role: 'ADMIN' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
    });

    // === parseSettingValue 测试 ===
    describe('parseSettingValue', () => {
        it('应将 "true" 解析为 boolean true', () => {
            expect(parseSettingValue('true', 'BOOLEAN')).toBe(true);
        });
        it('应将 "false" 解析为 boolean false', () => {
            expect(parseSettingValue('false', 'BOOLEAN')).toBe(false);
        });
        it('应将数字字符串解析为 INTEGER', () => {
            expect(parseSettingValue('42', 'INTEGER')).toBe(42);
        });
        it('应将小数字符串解析为 DECIMAL', () => {
            expect(parseSettingValue('3.14', 'DECIMAL')).toBeCloseTo(3.14);
        });
        it('应将 JSON 字符串解析为对象', () => {
            expect(parseSettingValue('{"a":1}', 'JSON')).toEqual({ a: 1 });
        });
        it('应在 JSON 解析失败时返回原始字符串', () => {
            expect(parseSettingValue('not-json', 'JSON')).toBe('not-json');
        });
        it('应将 ENUM 值原样返回', () => {
            expect(parseSettingValue('ROUND_ROBIN', 'ENUM')).toBe('ROUND_ROBIN');
        });
        it('应将未知类型原样返回', () => {
            expect(parseSettingValue('anything', 'UNKNOWN')).toBe('anything');
        });
    });

    // === validateValueType 测试 ===
    describe('validateValueType', () => {
        it('应接受 boolean 类型的 BOOLEAN 值', () => {
            expect(validateValueType(true, 'BOOLEAN')).toBe(true);
        });
        it('应拒绝非 boolean 类型的 BOOLEAN 值', () => {
            expect(validateValueType('true', 'BOOLEAN')).toBe(false);
        });
        it('应接受整数的 INTEGER 值', () => {
            expect(validateValueType(42, 'INTEGER')).toBe(true);
        });
        it('应拒绝小数的 INTEGER 值', () => {
            expect(validateValueType(3.14, 'INTEGER')).toBe(false);
        });
        it('应接受数字的 DECIMAL 值', () => {
            expect(validateValueType(3.14, 'DECIMAL')).toBe(true);
        });
        it('应拒绝非数字的 DECIMAL 值', () => {
            expect(validateValueType('abc', 'DECIMAL')).toBe(false);
        });
        it('应接受对象和字符串的 JSON 值', () => {
            expect(validateValueType({}, 'JSON')).toBe(true);
            expect(validateValueType('str', 'JSON')).toBe(true);
        });
        it('应接受字符串的 ENUM 值', () => {
            expect(validateValueType('OPTION_A', 'ENUM')).toBe(true);
        });
        it('应对未知类型返回 true', () => {
            expect(validateValueType(123, 'UNKNOWN')).toBe(true);
        });
    });

    // === Server Actions 测试准备 ===
    // const mockTenantId = 'tenant-1'; // 已在顶层声明

    // === getSettingsByCategory 测试 ===
    describe('getSettingsByCategory', () => {
        it('应返回按 key 分组的配置', async () => {
            (db.query.systemSettings.findMany as any).mockResolvedValue([
                { key: 'ENABLE_LEAD_AUTO_RECYCLE', value: 'true', valueType: 'BOOLEAN' },
                { key: 'LEAD_DAILY_CLAIM_LIMIT', value: '10', valueType: 'INTEGER' },
            ]);
            const result = await getSettingsByCategory('LEAD');
            expect(result).toEqual({
                ENABLE_LEAD_AUTO_RECYCLE: true,
                LEAD_DAILY_CLAIM_LIMIT: 10,
            });
        });

        it('未授权时应抛出错误', async () => {
            mocks.auth.mockResolvedValue(null);
            await expect(getSettingsByCategory('LEAD')).rejects.toThrow('未授权');
        });
    });

    // === getSettingInternal 测试 ===
    describe('getSettingInternal', () => {
        it('应返回已存在的配置值', async () => {
            (db.query.systemSettings.findFirst as any).mockResolvedValue({
                key: 'ENABLE_LEAD_AUTO_RECYCLE',
                value: 'true',
                valueType: 'BOOLEAN',
            });
            const result = await getSettingInternal('ENABLE_LEAD_AUTO_RECYCLE', mockTenantId);
            expect(result).toBe(true);
        });

        it('配置不存在时应回退到默认值', async () => {
            (db.query.systemSettings.findFirst as any).mockResolvedValue(null);
            const result = await getSettingInternal('ENABLE_LEAD_AUTO_RECYCLE', mockTenantId);
            // 假设默认值是 'true'
            expect(result).toBe(true);
        });
    });

    // === getSetting 测试 ===
    describe('getSetting', () => {
        it('未授权时应抛出错误', async () => {
            mocks.auth.mockResolvedValue({ user: {} }); // 无 tenantId
            await expect(getSetting('ANY_KEY')).rejects.toThrow('未授权访问');
        });
    });

    // === initTenantSettings 测试 ===
    describe('initTenantSettings', () => {
        it('已有配置时应跳过初始化', async () => {
            (db.query.systemSettings.findFirst as any).mockResolvedValue({ id: 'existing' });
            const result = await initTenantSettings(mockTenantId);
            expect(result?.success).toBe(true);
            expect(result?.message).toBe('配置初始化完成');
        });
    });

    // === getAllSettings 测试 ===
    describe('getAllSettings', () => {
        it('应按分类分组返回配置', async () => {
            (db.query.systemSettings.findMany as any).mockResolvedValue([
                { category: 'LEAD', key: 'K1', value: 'true', valueType: 'BOOLEAN' },
                { category: 'LEAD', key: 'K2', value: '10', valueType: 'INTEGER' },
                { category: 'ORDER', key: 'K3', value: 'false', valueType: 'BOOLEAN' },
            ]);
            const result = await getAllSettings();
            expect(result).toEqual({
                LEAD: { K1: true, K2: 10 },
                ORDER: { K3: false },
            });
        });
    });
});
