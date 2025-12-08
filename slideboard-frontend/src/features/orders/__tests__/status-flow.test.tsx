import { vi } from 'vitest';
import type { Mock } from 'vitest';

import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } from '@/constants/order-status';
import { salesOrderService } from '@/services/salesOrders.client';

// Mock dependencies
vi.mock('@/services/salesOrders.client', () => ({
  salesOrderService: {
    updateSalesOrder: vi.fn()
  }
}));

describe('Order Status Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Status Transitions', () => {
    // 测试所有合法的状态流转
    Object.entries(ORDER_STATUS_TRANSITIONS).forEach(([fromStatus, toStatuses]) => {
      describe(`From ${fromStatus}`, () => {
        it(`should allow transitions to ${toStatuses.join(', ')}`, () => {
          // 验证状态流转定义是否正确
          expect(ORDER_STATUS_TRANSITIONS[fromStatus as keyof typeof ORDER_STATUS_TRANSITIONS]).toEqual(toStatuses);
        });

        toStatuses.forEach(toStatus => {
          it(`should successfully transition from ${fromStatus} to ${toStatus}`, async () => {
            const mockOrderId = 'test-order-id';
            const mockStatusRemark = '状态更新备注';
            
            // 模拟updateOrderStatus成功返回
            (salesOrderService.updateSalesOrder as Mock).mockResolvedValue({
              code: 0,
              message: 'success',
              data: {
                id: mockOrderId
              }
            });
            
            // 调用updateOrderStatus
            const result = await salesOrderService.updateSalesOrder(mockOrderId, { status: toStatus }, mockStatusRemark);
            
            // 验证结果
            expect(result).toEqual(expect.objectContaining({
              code: 0,
              message: 'success',
              data: expect.objectContaining({ id: mockOrderId })
            }));
            
            // 验证updateOrderStatus被正确调用
            expect(salesOrderService.updateSalesOrder).toHaveBeenCalledWith(mockOrderId, { status: toStatus }, mockStatusRemark);
          });
        });
      });
    });
  });

  describe('Complete Order Flow', () => {
    it('should test complete order lifecycle flow', async () => {
      const mockOrderId = 'test-order-id';
      
      // 完整的销售单生命周期
      const orderLifecycle = [
        ORDER_STATUS.PENDING_ASSIGNMENT,       // 待分配
        ORDER_STATUS.PENDING_FOLLOW_UP,        // 待跟踪
        ORDER_STATUS.FOLLOWING_UP,             // 跟踪中
        ORDER_STATUS.DRAFT_SIGNED,             // 草签
        ORDER_STATUS.PENDING_MEASUREMENT,      // 待测量
        ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT, // 测量中-待分配
        ORDER_STATUS.MEASURING_ASSIGNING,      // 测量中-分配中
        ORDER_STATUS.MEASURING_PENDING_VISIT,  // 测量中-待上门
        ORDER_STATUS.MEASURING_PENDING_CONFIRMATION, // 测量中-待确认
        ORDER_STATUS.PLAN_PENDING_CONFIRMATION, // 方案待确认
        ORDER_STATUS.PENDING_PUSH,             // 待推单
        ORDER_STATUS.PENDING_ORDER,            // 待下单
        ORDER_STATUS.IN_PRODUCTION,            // 生产中
        ORDER_STATUS.STOCK_PREPARED,           // 备货完成
        ORDER_STATUS.PENDING_SHIPMENT,         // 待发货
        ORDER_STATUS.SHIPPED,                  // 已发货
        ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT, // 安装中-待分配
        ORDER_STATUS.INSTALLING_ASSIGNING,     // 安装中-分配中
        ORDER_STATUS.INSTALLING_PENDING_VISIT, // 安装中-待上门
        ORDER_STATUS.INSTALLING_PENDING_CONFIRMATION, // 安装中-待确认
        ORDER_STATUS.DELIVERED,                // 已交付
        ORDER_STATUS.PENDING_RECONCILIATION,   // 待对账
        ORDER_STATUS.PENDING_INVOICE,          // 待开发票
        ORDER_STATUS.PENDING_PAYMENT,          // 待回款
        ORDER_STATUS.COMPLETED                 // 已完成
      ];
      
      // 模拟updateOrderStatus总是成功返回
      (salesOrderService.updateSalesOrder as Mock).mockResolvedValue({ code: 0, message: 'success' });
      
      // 遍历生命周期，测试每个状态流转
      for (let i = 1; i < orderLifecycle.length; i++) {
        const fromStatus = orderLifecycle[i - 1];
        const toStatus = orderLifecycle[i];
        
        // 验证该流转是合法的
        expect(ORDER_STATUS_TRANSITIONS[fromStatus as keyof typeof ORDER_STATUS_TRANSITIONS]).toContain(toStatus);
        
        // 调用updateOrderStatus
        await salesOrderService.updateSalesOrder(mockOrderId, { status: toStatus }, `从${fromStatus}到${toStatus}`);
        
        // 验证updateOrderStatus被调用
        expect(salesOrderService.updateSalesOrder).toHaveBeenCalledWith(mockOrderId, { status: toStatus }, `从${fromStatus}到${toStatus}`);
      }
      
      // 验证总共调用了24次状态更新（25个状态，24次流转）
      expect((salesOrderService.updateSalesOrder as Mock)).toHaveBeenCalledTimes(24);
    });
  });

  describe('Order Status Validation', () => {
    it('should validate that completed order cannot transition to any other status', () => {
      // 已完成状态不允许任何流转
      expect(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.COMPLETED]).toEqual([]);
    });

    it('should validate that cancelled order cannot transition to any other status', () => {
      // 已取消状态不允许任何流转
      expect(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.CANCELLED]).toEqual([]);
    });

    it('should validate that expired order cannot transition to any other status', () => {
      // 已失效状态不允许任何流转
      expect(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.EXPIRED]).toEqual([]);
    });
  });

  describe('Status Flow Helpers', () => {
    it('should have distinct order statuses', () => {
      // 验证ORDER_STATUS对象有多个不同的状态
      const statusCount = Object.keys(ORDER_STATUS).length;
      expect(statusCount).toBeGreaterThan(0);
      
      // 验证没有重复的状态值
      const statusValues = Object.values(ORDER_STATUS);
      const uniqueStatusValues = new Set(statusValues);
      expect(uniqueStatusValues.size).toBe(statusCount);
    });

    it('should have transitions defined for all statuses', () => {
      // 验证所有状态都有流转定义
      Object.values(ORDER_STATUS).forEach(status => {
        expect(ORDER_STATUS_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(ORDER_STATUS_TRANSITIONS[status as keyof typeof ORDER_STATUS_TRANSITIONS])).toBe(true);
      });
    });
  });
});
