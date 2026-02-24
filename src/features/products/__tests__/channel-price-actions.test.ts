'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库与鉴权
// ---------------------------------------------------------
const { mockInsert, mockUpdate, mockDelete, mockSelect } = vi.hoisted(() => {
    const fnUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([])
            })
        })
    });
    const fnInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([])
        })
    });
    const fnDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
    });
    return {
        mockInsert: fnInsert,
        mockUpdate: fnUpdate,
        mockDelete: fnDelete,
        mockSelect: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
    }
}));

vi.mock('@/shared/api/schema/supply-chain', () => ({
    channelSpecificPrices: {
        id: 'channelSpecificPrices.id',
        productId: 'channelSpecificPrices.productId',
        channelId: 'channelSpecificPrices.channelId',
        specialPrice: 'channelSpecificPrices.specialPrice',
        isActive: 'channelSpecificPrices.isActive',
        createdAt: 'channelSpecificPrices.createdAt',
        tenantId: 'channelSpecificPrices.tenantId',
    }
}));

vi.mock('@/shared/api/schema/catalogs', () => ({
    marketChannels: {
        id: 'marketChannels.id',
        name: 'marketChannels.name',
        code: 'marketChannels.code',
    },
    products: {
        id: 'products.id',
        name: 'products.name',
        sku: 'products.sku',
        retailPrice: 'products.retailPrice',
        channelPrice: 'products.channelPrice',
        channelPriceMode: 'products.channelPriceMode',
        channelDiscountRate: 'products.channelDiscountRate',
        tenantId: 'products.tenantId',
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn()
}));

import {
    getChannelPrices,
    getAllChannelPrices,
    addChannelPrice,
    updateChannelPrice,
    removeChannelPrice,
    getProductPriceForChannel
} from '../actions/channel-price-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockProductId = '880e8400-e29b-41d4-a716-446655440001';
const mockChannelId = '880e8400-e29b-41d4-a716-446655440002';
const mockId = '880e8400-e29b-41d4-a716-446655440003';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
    }
};

describe('Channel Price Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
    });

    const mockSelectChain = (mockData: any[]) => {
        mockSelect.mockReturnValue({
            from: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockResolvedValue(mockData)
                    })
                })
            })
        } as any);
    };

    describe('getChannelPrices', () => {
        it('成功获取专属价列表', async () => {
            const mockData = [{ id: mockId, specialPrice: '100' }];
            mockSelectChain(mockData);

            const result = await getChannelPrices(mockProductId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });

        it('未授权报错', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const result = await getChannelPrices(mockProductId);
            expect(result.success).toBe(false);
            expect(result.error).toContain('获取渠道专属价失败');
        });
    });

    describe('getAllChannelPrices', () => {
        it('成功获取所有专属价', async () => {
            const mockData = [{ id: mockId, specialPrice: '100' }];
            mockSelect.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        leftJoin: vi.fn().mockReturnValue({ // getAll的有两个leftJoin
                            where: vi.fn().mockReturnValue({
                                orderBy: vi.fn().mockResolvedValue(mockData)
                            })
                        })
                    })
                })
            } as any);

            const result = await getAllChannelPrices();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });
    });

    describe('addChannelPrice', () => {
        const input = { channelId: mockChannelId, specialPrice: 120 };

        it('成功添加', async () => {
            // 首先查询不存在
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([])
                })
            } as any);

            mockInsert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: mockId, ...input }])
                })
            } as any);

            const result = await addChannelPrice(mockProductId, input);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockId);
            expect(revalidatePath).toHaveBeenCalledWith(`/products/${mockProductId}`);
        });

        it('渠道已存在专属价时拦截', async () => {
            // 首查存在
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: mockId }])
                })
            } as any);

            const result = await addChannelPrice(mockProductId, input);

            expect(result.success).toBe(false);
            expect(result.error).toContain('该渠道已存在');
        });
    });

    describe('updateChannelPrice', () => {
        it('成功更新', async () => {
            mockUpdate.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockId, specialPrice: '99' }])
                    })
                })
            } as any);

            const result = await updateChannelPrice(mockId, { specialPrice: 99 });

            expect(result.success).toBe(true);
            expect(result.data?.specialPrice).toBe('99');
        });
    });

    describe('removeChannelPrice', () => {
        it('成功删除', async () => {
            const result = await removeChannelPrice(mockId);
            expect(result.success).toBe(true);
            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe('getProductPriceForChannel', () => {
        it('未传channelId时返回零售价', async () => {
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ retailPrice: '150' }])
                })
            } as any);

            const result = await getProductPriceForChannel(mockProductId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ price: 150, priceType: 'RETAIL' });
        });

        it('存在特殊专属价时返回专属价', async () => {
            // 产品查出
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ retailPrice: '150' }])
                })
            } as any);

            // 专属价查出
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ specialPrice: '120' }])
                })
            } as any);

            const result = await getProductPriceForChannel(mockProductId, mockChannelId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ price: 120, priceType: 'SPECIAL' });
        });

        it('无专属价，为 DISCOUNT 模式时计算并返回折扣价', async () => {
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{
                        retailPrice: '100',
                        channelPriceMode: 'DISCOUNT',
                        channelDiscountRate: '0.8'
                    }])
                })
            } as any);

            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([])
                })
            } as any);

            const result = await getProductPriceForChannel(mockProductId, mockChannelId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ price: 80, priceType: 'CHANNEL' });
        });

        it('无专属价，为 FIXED 模式时返回渠道价', async () => {
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{
                        retailPrice: '100',
                        channelPriceMode: 'FIXED',
                        channelPrice: '75'
                    }])
                })
            } as any);

            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([])
                })
            } as any);

            const result = await getProductPriceForChannel(mockProductId, mockChannelId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ price: 75, priceType: 'CHANNEL' });
        });
    });
});
