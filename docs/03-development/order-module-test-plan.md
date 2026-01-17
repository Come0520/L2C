# 订单模块测试计划

**版本**: v1.0  
**创建时间**: 2026-01-16  
**基于文档**: [订单模块整改计划_20260116.md](../02-requirements/modules/订单/订单模块整改计划_20260116.md)  
**目标读者**: QA测试人员、后端开发、前端开发

---

## 📋 目录

1. [测试概述](#1-测试概述)
2. [单元测试](#2-单元测试)
3. [集成测试](#3-集成测试)
4. [E2E测试](#4-e2e测试)
5. [性能测试](#5-性能测试)
6. [安全测试](#6-安全测试)
7. [测试执行计划](#7-测试执行计划)
8. [验收标准](#8-验收标准)

---

## 1. 测试概述

### 1.1 测试目标

确保订单模块整改后的功能完整性、稳定性和性能达到生产级别要求。

### 1.2 测试范围

**功能测试**:
- 订单快照机制
- 变更单流程
- 智能拆单
- 发货与物流
- 叫停机制
- 撤单审批

**非功能测试**:
- 性能测试
- 安全测试
- 兼容性测试

### 1.3 测试环境

| 环境 | 用途 | 数据库 | 应用版本 |
|:---|:---|:---|:---|
| 开发环境 | 开发调试 | PostgreSQL 15 | v1.2.0-dev |
| 测试环境 | 功能测试 | PostgreSQL 15 | v1.2.0-test |
| 预生产环境 | 预演上线 | PostgreSQL 15 | v1.2.0-staging |
| 生产环境 | 正式上线 | PostgreSQL 15 | v1.2.0-prod |

### 1.4 测试工具

**单元测试**:
- Jest - 测试框架
- @testing-library/react - React组件测试
- Vitest - 快速单元测试

**集成测试**:
- Supertest - API测试
- PostgreSQL Testcontainers - 数据库测试

**E2E测试**:
- Playwright - E2E测试框架
- Faker - 测试数据生成

**性能测试**:
- k6 - 负载测试
- Lighthouse - 前端性能测试

---

## 2. 单元测试

### 2.1 OrderService测试

**文件**: `src/services/__tests__/order.service.test.ts`

#### 2.1.1 测试用例

**测试订单创建逻辑**:
```typescript
describe('OrderService.convertFromQuote', () => {
  it('should create order from WON quote', async () => {
    // Arrange
    const quote = createMockQuote({ status: 'WON' });
    const options = {
      paymentAmount: 3000,
      paymentMethod: 'WECHAT',
      paymentProofImg: 'https://oss.example.com/payment-proof.jpg',
    };

    // Act
    const orderId = await orderService.convertFromQuote(quote.id, options);

    // Assert
    expect(orderId).toBeDefined();
    const order = await getOrderById(orderId);
    expect(order.status).toBe('PENDING_PO');
    expect(order.paidAmount).toBe(3000);
    expect(order.settlementType).toBe('PREPAID');
  });

  it('should throw error if quote is not WON', async () => {
    // Arrange
    const quote = createMockQuote({ status: 'DRAFT' });

    // Act & Assert
    await expect(
      orderService.convertFromQuote(quote.id, {})
    ).rejects.toThrow('仅WON状态的报价单可转订单');
  });

  it('should throw error if order already exists for quote', async () => {
    // Arrange
    const quote = createMockQuote({ status: 'WON' });
    await orderService.convertFromQuote(quote.id, {});

    // Act & Assert
    await expect(
      orderService.convertFromQuote(quote.id, {})
    ).rejects.toThrow('该报价单已创建订单');
  });
});
```

**测试快照保存**:
```typescript
describe('OrderService.generateSnapshot', () => {
  it('should generate snapshot with quote and customer data', () => {
    // Arrange
    const quote = createMockQuote();
    const items = createMockQuoteItems(3);

    // Act
    const snapshot = orderService.generateSnapshot(quote, items);

    // Assert
    expect(snapshot.quote).toBeDefined();
    expect(snapshot.quote.id).toBe(quote.id);
    expect(snapshot.quote.items).toHaveLength(3);
    expect(snapshot.customer).toBeDefined();
    expect(snapshot.customer.name).toBe(quote.customerName);
    expect(snapshot.snapshotTime).toBeDefined();
  });

  it('should snapshot data be immutable', () => {
    // Arrange
    const quote = createMockQuote();
    const items = createMockQuoteItems(1);

    // Act
    const snapshot = orderService.generateSnapshot(quote, items);
    const originalSnapshot = JSON.stringify(snapshot);

    // Modify original quote
    quote.totalAmount = 99999;

    // Assert
    const newSnapshot = orderService.generateSnapshot(quote, items);
    expect(JSON.stringify(snapshot)).toBe(originalSnapshot);
  });
});
```

**测试结算方式推断**:
```typescript
describe('OrderService.inferSettlementType', () => {
  it('should return PREPAID when paid >= 30%', () => {
    expect(orderService.inferSettlementType(1000, 300)).toBe('PREPAID');
    expect(orderService.inferSettlementType(1000, 500)).toBe('PREPAID');
    expect(orderService.inferSettlementType(1000, 299.99)).toBe('MONTHLY');
  });

  it('should return MONTHLY when paid < 30%', () => {
    expect(orderService.inferSettlementType(1000, 200)).toBe('MONTHLY');
    expect(orderService.inferSettlementType(1000, 0)).toBe('MONTHLY');
  });

  it('should handle edge cases', () => {
    expect(orderService.inferSettlementType(0, 0)).toBe('MONTHLY');
    expect(orderService.inferSettlementType(1000, 300)).toBe('PREPAID');
  });
});
```

**测试初始状态判断**:
```typescript
describe('OrderService.getInitialStatus', () => {
  it('should return PENDING_CONFIRMATION when hasDeepDesign is true', () => {
    const quote = createMockQuote({ hasDeepDesign: true });
    const status = orderService.getInitialStatus(quote);
    expect(status).toBe('PENDING_CONFIRMATION');
  });

  it('should return PENDING_PO when hasDeepDesign is false', () => {
    const quote = createMockQuote({ hasDeepDesign: false });
    const status = orderService.getInitialStatus(quote);
    expect(status).toBe('PENDING_PO');
  });
});
```

#### 2.1.2 覆盖率要求

- **目标覆盖率**: >= 80%
- **关键方法覆盖率**: 100%
  - `convertFromQuote`
  - `generateSnapshot`
  - `inferSettlementType`
  - `getInitialStatus`

---

### 2.2 ChangeRequestService测试

**文件**: `src/services/__tests__/change-request.service.test.ts`

#### 2.2.1 测试用例

**测试差价计算**:
```typescript
describe('ChangeRequestService.calculatePriceDifference', () => {
  it('should calculate positive difference', () => {
    const originalItems = [
      { subtotal: 100 },
      { subtotal: 200 },
    ];
    const newItems = [
      { subtotal: 150 },
      { subtotal: 250 },
    ];

    const diff = changeRequestService.calculatePriceDifference(
      originalItems,
      newItems
    );

    expect(diff.toNumber()).toBe(100);
  });

  it('should calculate negative difference', () => {
    const originalItems = [
      { subtotal: 200 },
      { subtotal: 300 },
    ];
    const newItems = [
      { subtotal: 100 },
      { subtotal: 150 },
    ];

    const diff = changeRequestService.calculatePriceDifference(
      originalItems,
      newItems
    );

    expect(diff.toNumber()).toBe(-250);
  });

  it('should calculate zero difference', () => {
    const originalItems = [
      { subtotal: 100 },
      { subtotal: 200 },
    ];
    const newItems = [
      { subtotal: 100 },
      { subtotal: 200 },
    ];

    const diff = changeRequestService.calculatePriceDifference(
      originalItems,
      newItems
    );

    expect(diff.toNumber()).toBe(0);
  });
});
```

**测试审批后应用变更**:
```typescript
describe('ChangeRequestService.approve', () => {
  it('should apply change when approved', async () => {
    // Arrange
    const changeRequest = createMockChangeRequest({
      status: 'PENDING',
      changeType: 'MODIFY_ITEM',
      originalItems: [{ id: 'item1', quantity: 1, subtotal: 100 }],
      newItems: [{ id: 'item1', quantity: 2, subtotal: 200 }],
    });

    // Act
    await changeRequestService.approve(changeRequest.id, true, 'user1');

    // Assert
    const updatedRequest = await getChangeRequestById(changeRequest.id);
    expect(updatedRequest.status).toBe('APPROVED');
    expect(updatedRequest.approvedBy).toBe('user1');

    const orderItems = await getOrderItemsByOrderId(changeRequest.orderId);
    const modifiedItem = orderItems.find(item => item.quoteItemId === 'item1');
    expect(modifiedItem?.quantity).toBe(2);
    expect(modifiedItem?.subtotal).toBe(200);
  });

  it('should not apply change when rejected', async () => {
    // Arrange
    const changeRequest = createMockChangeRequest({
      status: 'PENDING',
      changeType: 'MODIFY_ITEM',
    });

    // Act
    await changeRequestService.approve(
      changeRequest.id,
      false,
      'user1',
      '不符合业务规则'
    );

    // Assert
    const updatedRequest = await getChangeRequestById(changeRequest.id);
    expect(updatedRequest.status).toBe('REJECTED');
    expect(updatedRequest.rejectedBy).toBe('user1');
    expect(updatedRequest.rejectionReason).toBe('不符合业务规则');

    // 订单明细不应变更
    const orderItems = await getOrderItemsByOrderId(changeRequest.orderId);
    expect(orderItems).toHaveLength(1);
  });
});
```

**测试变更单创建**:
```typescript
describe('ChangeRequestService.create', () => {
  it('should create change request for PENDING_PO order', async () => {
    // Arrange
    const order = createMockOrder({ status: 'PENDING_PO' });
    const data = {
      changeType: 'MODIFY_ITEM' as const,
      changeReason: '客户要求修改尺寸',
      originalItems: [{ id: 'item1', quantity: 1 }],
      newItems: [{ id: 'item1', quantity: 2 }],
    };

    // Act
    const changeRequestId = await changeRequestService.create(
      order.id,
      data,
      'user1'
    );

    // Assert
    const changeRequest = await getChangeRequestById(changeRequestId);
    expect(changeRequest.orderId).toBe(order.id);
    expect(changeRequest.changeType).toBe('MODIFY_ITEM');
    expect(changeRequest.changeReason).toBe('客户要求修改尺寸');
    expect(changeRequest.status).toBe('PENDING');
  });

  it('should throw error for IN_PRODUCTION order', async () => {
    // Arrange
    const order = createMockOrder({ status: 'IN_PRODUCTION' });
    const data = {
      changeType: 'MODIFY_ITEM' as const,
      changeReason: '客户要求修改尺寸',
      originalItems: [],
      newItems: [],
    };

    // Act & Assert
    await expect(
      changeRequestService.create(order.id, data, 'user1')
    ).rejects.toThrow('当前状态 IN_PRODUCTION 不允许变更');
  });
});
```

#### 2.2.2 覆盖率要求

- **目标覆盖率**: >= 80%
- **关键方法覆盖率**: 100%
  - `create`
  - `approve`
  - `calculatePriceDifference`
  - `applyChange`

---

### 2.3 拆单算法测试

**文件**: `src/features/orders/logic/__tests__/order-split-router.test.ts`

#### 2.3.1 测试用例

**测试供应商匹配**:
```typescript
describe('OrderSplitRouter.matchSuppliers', () => {
  it('should match suppliers based on priority', async () => {
    // Arrange
    const orderItems = [
      { productId: 'product1', quantity: 2, productName: '梦幻帘' },
      { productId: 'product2', quantity: 1, productName: '电机' },
    ];

    // Mock供应商数据
    mockSuppliers([
      {
        productId: 'product1',
        supplierId: 'supplier1',
        stockQuantity: 10,
        unitPrice: 100,
        rating: 4.5,
      },
      {
        productId: 'product1',
        supplierId: 'supplier2',
        stockQuantity: 5,
        unitPrice: 90,
        rating: 4.0,
      },
    ]);

    // Act
    const groups = await orderSplitRouter.matchSuppliers(orderItems);

    // Assert
    expect(groups.size).toBe(2);
    expect(groups.get('supplier1')).toBeDefined();
    expect(groups.get('supplier2')).toBeDefined();
  });

  it('should prioritize supplier with sufficient stock', async () => {
    // Arrange
    const orderItems = [
      { productId: 'product1', quantity: 10, productName: '梦幻帘' },
    ];

    mockSuppliers([
      {
        productId: 'product1',
        supplierId: 'supplier1',
        stockQuantity: 5,
        unitPrice: 80,
        rating: 5.0,
      },
      {
        productId: 'product1',
        supplierId: 'supplier2',
        stockQuantity: 20,
        unitPrice: 100,
        rating: 4.0,
      },
    ]);

    // Act
    const groups = await orderSplitRouter.matchSuppliers(orderItems);

    // Assert
    expect(groups.get('supplier2')).toBeDefined();
    expect(groups.get('supplier1')).toBeUndefined();
  });

  it('should throw error if no supplier found', async () => {
    // Arrange
    const orderItems = [
      { productId: 'product1', quantity: 1, productName: '梦幻帘' },
    ];

    mockSuppliers([]);

    // Act & Assert
    await expect(
      orderSplitRouter.matchSuppliers(orderItems)
    ).rejects.toThrow('商品 梦幻帘 无可用供应商');
  });
});
```

**测试运费分摊**:
```typescript
describe('OrderSplitRouter.allocateShippingFee', () => {
  it('should allocate shipping fee proportionally', async () => {
    // Arrange
    const groups = new Map([
      ['supplier1', [
        { subtotal: 600 },
        { subtotal: 400 },
      ]],
      ['supplier2', [
        { subtotal: 1000 },
      ]],
    ]);

    mockShippingFees({
      supplier1: 100,
      supplier2: 100,
    });

    // Act
    const results = await orderSplitRouter.allocateShippingFee(groups);

    // Assert
    const supplier1Result = results.find(r => r.supplierId === 'supplier1');
    const supplier2Result = results.find(r => r.supplierId === 'supplier2');

    // supplier1: 1000/2000 * 100 = 50
    expect(supplier1Result?.shippingFee.toNumber()).toBe(50);
    // supplier2: 1000/2000 * 100 = 50
    expect(supplier2Result?.shippingFee.toNumber()).toBe(50);
  });

  it('should handle zero total amount', async () => {
    // Arrange
    const groups = new Map([
      ['supplier1', [{ subtotal: 0 }]],
    ]);

    mockShippingFees({ supplier1: 100 });

    // Act
    const results = await orderSplitRouter.allocateShippingFee(groups);

    // Assert
    expect(results[0].shippingFee.toNumber()).toBe(0);
  });
});
```

#### 2.3.2 覆盖率要求

- **目标覆盖率**: >= 80%
- **关键方法覆盖率**: 100%
  - `matchSuppliers`
  - `allocateShippingFee`
  - `findBestSupplier`

---

### 2.4 状态流转测试

**文件**: `src/features/orders/__tests__/state-machine.test.ts`

#### 2.4.1 测试用例

**测试合法状态流转**:
```typescript
describe('OrderStateMachine', () => {
  it('should allow PENDING_PO to PENDING_PRODUCTION', () => {
    const result = orderStateMachine.canTransition(
      'PENDING_PO',
      'PENDING_PRODUCTION'
    );
    expect(result).toBe(true);
  });

  it('should allow PENDING_CONFIRMATION to PENDING_PO', () => {
    const result = orderStateMachine.canTransition(
      'PENDING_CONFIRMATION',
      'PENDING_PO'
    );
    expect(result).toBe(true);
  });

  it('should allow HALTED to previous status', () => {
    const result = orderStateMachine.canTransition(
      'HALTED',
      'PENDING_PRODUCTION'
    );
    expect(result).toBe(true);
  });
});
```

**测试非法状态流转**:
```typescript
describe('OrderStateMachine - Invalid Transitions', () => {
  it('should not allow COMPLETED to PENDING_PO', () => {
    const result = orderStateMachine.canTransition(
      'COMPLETED',
      'PENDING_PO'
    );
    expect(result).toBe(false);
  });

  it('should not allow CANCELLED to PENDING_PO', () => {
    const result = orderStateMachine.canTransition(
      'CANCELLED',
      'PENDING_PO'
    );
    expect(result).toBe(false);
  });

  it('should not allow random status change', () => {
    const result = orderStateMachine.canTransition(
      'PENDING_PO',
      'COMPLETED'
    );
    expect(result).toBe(false);
  });
});
```

#### 2.4.2 覆盖率要求

- **目标覆盖率**: >= 90%
- **所有状态流转**: 100%

---

## 3. 集成测试

### 3.1 API集成测试

**文件**: `tests/integration/orders-api.test.ts`

#### 3.1.1 测试用例

**测试创建订单API**:
```typescript
describe('POST /api/orders', () => {
  it('should create order successfully', async () => {
    // Arrange
    const quote = await createTestQuote({ status: 'WON' });
    const payload = {
      quoteId: quote.id,
      paymentAmount: 3000,
      paymentMethod: 'WECHAT',
      paymentProofImg: 'https://oss.example.com/payment-proof.jpg',
    };

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNo).toMatch(/^OD\d{12}$/);
    expect(response.body.data.status).toBe('PENDING_PO');
  });

  it('should return 400 if quote is not WON', async () => {
    // Arrange
    const quote = await createTestQuote({ status: 'DRAFT' });
    const payload = { quoteId: quote.id };

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('QUOTE_NOT_WON');
  });

  it('should return 401 if not authenticated', async () => {
    // Arrange
    const payload = { quoteId: 'uuid' };

    // Act
    const response = await request(app)
      .post('/api/orders')
      .send(payload);

    // Assert
    expect(response.status).toBe(401);
  });
});
```

**测试拆单API**:
```typescript
describe('POST /api/orders/:id/split/preview', () => {
  it('should return split preview', async () => {
    // Arrange
    const order = await createTestOrder({ status: 'PENDING_PO' });
    await createTestOrderItems(order.id, 3);

    // Act
    const response = await request(app)
      .post(`/api/orders/${order.id}/split/preview`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.purchaseOrders).toBeDefined();
    expect(response.body.data.purchaseOrders.length).toBeGreaterThan(0);
  });

  it('should return 400 if order is not PENDING_PO', async () => {
    // Arrange
    const order = await createTestOrder({ status: 'IN_PRODUCTION' });

    // Act
    const response = await request(app)
      .post(`/api/orders/${order.id}/split/preview`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ORDER_INVALID_STATUS');
  });
});
```

**测试变更单API**:
```typescript
describe('POST /api/orders/:id/change-requests', () => {
  it('should create change request', async () => {
    // Arrange
    const order = await createTestOrder({ status: 'PENDING_PO' });
    const payload = {
      changeType: 'MODIFY_ITEM',
      changeReason: '客户要求修改尺寸',
      originalItems: [{ id: 'item1', quantity: 1 }],
      newItems: [{ id: 'item1', quantity: 2 }],
    };

    // Act
    const response = await request(app)
      .post(`/api/orders/${order.id}/change-requests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.priceDifference).toBeGreaterThan(0);
  });
});
```

---

## 4. E2E测试

### 4.1 完整订单流程测试

**文件**: `tests/e2e/order-lifecycle.spec.ts`

#### 4.1.1 测试场景

```typescript
import { test, expect } from '@playwright/test';

test.describe('订单生命周期', () => {
  test('完整订单流程: 报价转订单 -> 拆单 -> 发货 -> 完成', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('[name="username"]', 'sales');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. 从报价转订单
    await page.goto('/quotes');
    await page.click('text=WON状态的报价单');
    await page.click('text=转订单');
    await page.fill('[name="paymentAmount"]', '3000');
    await page.fill('[name="paymentMethod"]', 'WECHAT');
    await page.setInputFiles('[name="paymentProofImg"]', 'test-data/payment-proof.jpg');
    await page.click('text=确认创建');
    
    // 验证订单创建成功
    await expect(page.locator('text=订单创建成功')).toBeVisible();
    const orderNo = await page.locator('.order-no').textContent();
    expect(orderNo).toMatch(/^OD\d{12}$/);

    // 3. 拆单
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=拆单');
    await expect(page.locator('.split-preview')).toBeVisible();
    await page.click('text=确认拆单');
    
    // 验证拆单成功
    await expect(page.locator('text=拆单成功')).toBeVisible();
    await expect(page.locator('.order-status')).toHaveText('PENDING_PRODUCTION');

    // 4. 发货
    await page.click('text=申请发货');
    await page.fill('[name="deliveryAddress"]', '北京市朝阳区XXX小区');
    await page.click('text=确认申请');
    
    // 验证发货申请成功
    await expect(page.locator('text=发货申请成功')).toBeVisible();
    
    // 5. 确认发货(采购员登录)
    await page.goto('/login');
    await page.fill('[name="username"]', 'purchaser');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=确认发货');
    await page.fill('[name="logisticsCompany"]', 'SF');
    await page.fill('[name="trackingNumber"]', 'SF1234567890');
    await page.click('text=确认发货');
    
    // 验证发货成功
    await expect(page.locator('text=发货成功')).toBeVisible();
    await expect(page.locator('.order-status')).toHaveText('SHIPPED');
  });
});
```

### 4.2 变更单流程测试

**文件**: `tests/e2e/order-change-request.spec.ts`

```typescript
test.describe('变更单流程', () => {
  test('完整变更单流程: 申请 -> 审批 -> 应用', async ({ page }) => {
    // 1. 登录并创建订单
    await login(page, 'sales');
    const orderNo = await createOrderFromQuote(page);

    // 2. 申请变更
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=申请变更');
    await page.selectOption('[name="changeType"]', 'MODIFY_ITEM');
    await page.fill('[name="changeReason"]', '客户要求修改尺寸');
    await page.fill('[name="newQuantity"]', '2');
    await page.click('text=提交变更');
    
    // 验证变更申请成功
    await expect(page.locator('text=变更申请成功')).toBeVisible();

    // 3. 审批变更(店长登录)
    await login(page, 'manager');
    await page.goto('/change-requests');
    await page.click('text=待审批');
    await page.click(`text=${orderNo}`);
    await page.click('text=批准');
    
    // 验证审批成功
    await expect(page.locator('text=审批成功')).toBeVisible();

    // 4. 验证变更已应用
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=变更历史');
    await expect(page.locator('.change-history')).toBeVisible();
    await expect(page.locator('text=已批准')).toBeVisible();
  });
});
```

### 4.3 异常流程测试

**文件**: `tests/e2e/order-exception-flow.spec.ts`

```typescript
test.describe('异常流程', () => {
  test('叫停与恢复流程', async ({ page }) => {
    // 1. 创建订单
    await login(page, 'sales');
    const orderNo = await createOrderFromQuote(page);

    // 2. 叫停订单
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=叫停');
    await page.fill('[name="haltedReason"]', '客户要求暂停');
    await page.click('text=确认叫停');
    
    // 验证叫停成功
    await expect(page.locator('text=叫停成功')).toBeVisible();
    await expect(page.locator('.order-status')).toHaveText('HALTED');

    // 3. 恢复订单
    await page.click('text=恢复');
    await page.fill('[name="resumeReason"]', '客户确认恢复');
    await page.click('text=确认恢复');
    
    // 验证恢复成功
    await expect(page.locator('text=恢复成功')).toBeVisible();
    await expect(page.locator('.order-status')).not.toHaveText('HALTED');
  });

  test('撤单审批流程', async ({ page }) => {
    // 1. 创建订单
    await login(page, 'sales');
    const orderNo = await createOrderFromQuote(page);

    // 2. 申请撤单
    await page.goto(`/orders/${orderNo}`);
    await page.click('text=撤单');
    await page.fill('[name="cancelReason"]', '客户取消订单');
    await page.click('text=提交撤单');
    
    // 验证撤单申请成功
    await expect(page.locator('text=撤单申请成功')).toBeVisible();

    // 3. 审批撤单(店长登录)
    await login(page, 'manager');
    await page.goto('/cancel-requests');
    await page.click(`text=${orderNo}`);
    await page.click('text=批准');
    
    // 验证撤单成功
    await expect(page.locator('text=撤单成功')).toBeVisible();
    await page.goto(`/orders/${orderNo}`);
    await expect(page.locator('.order-status')).toHaveText('CANCELLED');
  });
});
```

---

## 5. 性能测试

### 5.1 API性能测试

**文件**: `tests/performance/api-performance.test.ts`

#### 5.1.1 测试场景

**订单列表查询性能**:
```typescript
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%请求在500ms内完成
    http_req_failed: ['rate<0.01'], // 错误率<1%
  },
};

export default function () {
  // 测试订单列表查询
  const response = http.get('http://localhost:3000/api/orders?page=1&pageSize=10', {
    headers: {
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**拆单算法性能**:
```typescript
export default function () {
  // 测试拆单算法性能(1000 items)
  const orderItems = generateOrderItems(1000);
  
  const startTime = new Date();
  const response = http.post('http://localhost:3000/api/orders/test-order/split/preview', {
    headers: {
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
    body: JSON.stringify({ items: orderItems }),
  });
  const endTime = new Date();
  
  const duration = endTime - startTime;
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'split time < 3000ms': () => duration < 3000,
  });
}
```

#### 5.1.2 性能指标

| 指标 | 目标值 | 说明 |
|:---|:---:|:---|
| 订单列表查询 | < 500ms (P95) | 1000+订单 |
| 订单详情查询 | < 200ms (P95) | 单个订单 |
| 拆单算法 | < 3000ms | 1000 items |
| 变更单创建 | < 300ms (P95) | 单个变更 |
| 发货申请 | < 200ms (P95) | 单个订单 |

---

### 5.2 前端性能测试

**文件**: `tests/performance/frontend-performance.test.ts`

#### 5.2.1 测试场景

**订单列表页性能**:
```typescript
import { test, expect } from '@playwright/test';

test('订单列表页性能', async ({ page }) => {
  // 开始性能监控
  const metrics = await page.evaluate(() => {
    return {
      navigationStart: performance.timing.navigationStart,
      domContentLoaded: performance.timing.domContentLoadedEventEnd,
      loadComplete: performance.timing.loadEventEnd,
    };
  });

  await page.goto('/orders');

  // 等待页面加载完成
  await page.waitForLoadState('networkidle');

  // 验证性能指标
  const fcp = await page.evaluate(() => {
    return performance.getEntriesByType('paint')[0].startTime;
  });

  const lcp = await page.evaluate(() => {
    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries[entries.length - 1].startTime;
  });

  expect(fcp).toBeLessThan(1000); // First Contentful Paint < 1s
  expect(lcp).toBeLessThan(2000); // Largest Contentful Paint < 2s
});
```

**订单详情页性能**:
```typescript
test('订单详情页性能', async ({ page }) => {
  await page.goto('/orders/OD20260116001');
  await page.waitForLoadState('networkidle');

  // 验证首屏加载时间
  const metrics = await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByType('paint')[0].startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint')[0].startTime,
      tti: performance.timing.domInteractive - performance.timing.navigationStart,
    };
  });

  expect(metrics.fcp).toBeLessThan(800); // FCP < 800ms
  expect(metrics.lcp).toBeLessThan(1500); // LCP < 1.5s
  expect(metrics.tti).toBeLessThan(2000); // TTI < 2s
});
```

#### 5.2.2 性能指标

| 指标 | 目标值 | 说明 |
|:---|:---:|:---|
| First Contentful Paint (FCP) | < 1000ms | 首次内容绘制 |
| Largest Contentful Paint (LCP) | < 2000ms | 最大内容绘制 |
| Time to Interactive (TTI) | < 3000ms | 可交互时间 |
| First Input Delay (FID) | < 100ms | 首次输入延迟 |
| Cumulative Layout Shift (CLS) | < 0.1 | 累积布局偏移 |

---

## 6. 安全测试

### 6.1 权限测试

**文件**: `tests/security/permission.test.ts`

#### 6.1.1 测试用例

**测试未授权访问**:
```typescript
describe('权限测试', () => {
  it('should return 401 for unauthenticated request', async () => {
    const response = await request(app)
      .get('/api/orders')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should return 403 for unauthorized user', async () => {
    // 普通用户尝试访问管理员API
    const response = await request(app)
      .post('/api/orders/uuid/halt')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ haltedReason: 'test' });

    expect(response.status).toBe(403);
  });

  it('should allow authorized user', async () => {
    // 管理员访问管理员API
    const response = await request(app)
      .post('/api/orders/uuid/halt')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ haltedReason: 'test' });

    expect(response.status).toBe(200);
  });
});
```

**测试数据隔离**:
```typescript
describe('数据隔离测试', () => {
  it('should not return orders from other tenant', async () => {
    // Tenant A的用户
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${tenantAUserToken}`)
      .send({});

    expect(response.status).toBe(200);
    const orders = response.body.data.items;
    
    // 验证所有订单都属于Tenant A
    orders.forEach(order => {
      expect(order.tenantId).toBe(tenantAId);
    });
  });
});
```

### 6.2 SQL注入测试

**文件**: `tests/security/sql-injection.test.ts`

```typescript
describe('SQL注入测试', () => {
  it('should prevent SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE orders; --";
    
    const response = await request(app)
      .get(`/api/orders?keyword=${encodeURIComponent(maliciousInput)}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // 应该返回400或空结果,而不是500
    expect([200, 400]).toContain(response.status);
    
    // 验证orders表未被删除
    const tableExists = await checkTableExists('orders');
    expect(tableExists).toBe(true);
  });

  it('should prevent SQL injection in order ID', async () => {
    const maliciousId = "uuid'; DROP TABLE orders; --";
    
    const response = await request(app)
      .get(`/api/orders/${maliciousId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect([400, 404]).toContain(response.status);
  });
});
```

### 6.3 XSS测试

**文件**: `tests/security/xss.test.ts`

```typescript
describe('XSS测试', () => {
  it('should escape XSS in order remark', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quoteId: 'uuid',
        remark: xssPayload,
      });

    expect(response.status).toBe(200);
    
    // 验证XSS被转义
    const order = response.body.data;
    expect(order.remark).not.toContain('<script>');
  });
});
```

---

## 7. 测试执行计划

### 7.1 测试阶段

| 阶段 | 时间 | 负责人 | 交付物 |
|:---|:---:|:---|:---|
| 单元测试 | Week 6 Day 1-2 | 后端开发 | 单元测试报告 |
| 集成测试 | Week 6 Day 2-3 | 后端开发+QA | 集成测试报告 |
| E2E测试 | Week 6 Day 3-4 | QA | E2E测试报告 |
| 性能测试 | Week 6 Day 4-5 | QA+运维 | 性能测试报告 |
| 安全测试 | Week 6 Day 5 | QA+安全 | 安全测试报告 |

### 7.2 测试环境准备

**测试数据准备**:
```bash
# 准备测试数据
npm run test:seed

# 验证测试数据
npm run test:verify
```

**测试环境配置**:
```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 运行数据库迁移
npm run db:migrate:test

# 启动应用
npm run start:test
```

### 7.3 测试执行流程

**每日测试流程**:
1. **晨会** (9:00) - 确认当日测试任务
2. **测试执行** (9:30-12:00) - 执行测试用例
3. **Bug记录** (12:00-12:30) - 记录发现的Bug
4. **午餐休息** (12:30-13:30)
5. **Bug验证** (13:30-15:00) - 验证修复的Bug
6. **测试执行** (15:00-17:00) - 继续执行测试
7. **日会** (17:00-17:30) - 汇报测试进度

### 7.4 Bug管理

**Bug优先级**:
- **P0**: 阻塞上线,必须立即修复
- **P1**: 影响核心功能,24小时内修复
- **P2**: 影响次要功能,3天内修复
- **P3**: 优化建议,可延后

**Bug模板**:
```markdown
## Bug描述
- **标题**: [简短描述]
- **优先级**: P0/P1/P2/P3
- **严重程度**: 严重/一般/轻微

## 复现步骤
1. 步骤1
2. 步骤2
3. 步骤3

## 预期结果
- [描述预期结果]

## 实际结果
- [描述实际结果]

## 环境信息
- **浏览器**: Chrome/Edge/Firefox
- **操作系统**: Windows/Mac/Linux
- **应用版本**: v1.2.0

## 附件
- [截图]
- [日志]
```

---

## 8. 验收标准

### 8.1 功能验收

- [ ] 订单快照机制100%可用
- [ ] 变更单流程端到端可执行
- [ ] 智能拆单算法准确率>=95%
- [ ] 发货与物流流程完整
- [ ] 叫停机制可用
- [ ] 撤单审批集成成功
- [ ] 18个核心API全部实现
- [ ] UI/UX无阻塞点

### 8.2 性能验收

- [ ] 1000+订单列表加载时间 <2s
- [ ] 拆单算法响应时间 <3s
- [ ] 订单详情页首屏加载 <1s
- [ ] API P95响应时间 <500ms
- [ ] 错误率 <1%

### 8.3 质量验收

- [ ] 单元测试覆盖率 >=70%
- [ ] E2E测试通过率 100%
- [ ] 无P0/P1 Bug
- [ ] P2 Bug <= 5个
- [ ] 代码Review完成
- [ ] 安全检查通过

### 8.4 文档验收

- [ ] API文档更新
- [ ] 数据库Schema文档更新
- [ ] 使用手册完整
- [ ] 测试报告完整

---

## 9. 附录

### 9.1 测试数据生成

**Mock数据生成器**:
```typescript
// tests/utils/faker.ts
import { faker } from '@faker-js/faker';

export function createMockQuote(overrides = {}) {
  return {
    id: faker.datatype.uuid(),
    quoteNo: `QT${faker.date.recent().toISOString().slice(0,10).replace(/-/g,'')}${String(faker.datatype.number({min:1,max:999})).padStart(3,'0')}`,
    status: 'WON',
    customerId: faker.datatype.uuid(),
    customerName: faker.name.fullName(),
    customerPhone: faker.phone.number('138#########'),
    deliveryAddress: faker.address.fullAddress(),
    totalAmount: faker.datatype.number({ min: 1000, max: 50000 }),
    hasDeepDesign: faker.datatype.boolean(),
    salesId: faker.datatype.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockOrder(overrides = {}) {
  return {
    id: faker.datatype.uuid(),
    orderNo: `OD${faker.date.recent().toISOString().slice(0,10).replace(/-/g,'')}${String(faker.datatype.number({min:1,max:999})).padStart(3,'0')}`,
    status: 'PENDING_PO',
    totalAmount: faker.datatype.number({ min: 1000, max: 50000 }),
    paidAmount: faker.datatype.number({ min: 0, max: 50000 }),
    settlementType: faker.helpers.arrayElement(['PREPAID', 'MONTHLY']),
    ...overrides,
  };
}
```

### 9.2 测试命令

**运行单元测试**:
```bash
# 运行所有单元测试
npm run test:unit

# 运行特定测试文件
npm run test:unit -- order.service.test.ts

# 生成覆盖率报告
npm run test:unit:coverage
```

**运行集成测试**:
```bash
# 运行所有集成测试
npm run test:integration

# 运行特定测试文件
npm run test:integration -- orders-api.test.ts
```

**运行E2E测试**:
```bash
# 运行所有E2E测试
npm run test:e2e

# 运行特定测试文件
npm run test:e2e -- order-lifecycle.spec.ts

# 运行E2E测试并生成报告
npm run test:e2e:report
```

**运行性能测试**:
```bash
# 运行k6性能测试
k6 run tests/performance/api-performance.test.ts

# 运行前端性能测试
npm run test:performance
```

---

**文档结束**
