# 采购模块架构设计文档

## 1. 模块概述

| 属性         | 说明                                           |
| :----------- | :--------------------------------------------- |
| **模块名称** | 采购模块 (Purchase Order Module)               |
| **核心价值** | 连接销售订单与供应链，管理供应商对接和生产跟进 |
| **目标用户** | 采购员、客服、供应链主管、财务                 |
| **关联模块** | 订单模块、财务模块、供应商模块、库存模块       |
| **设计日期** | 2026-01-15                                     |

## 2. 核心架构决策

### 2.1 物流跟踪自动化策略

**决策：API集成模式**

**说明：**

- 通过集成主流物流公司的API，自动查询物流状态
- 支持物流单号自动识别和匹配
- 定时轮询物流状态，自动更新采购单状态
- 提供物流信息实时查询接口

**优势：**

- 减少人工查询的工作量
- 提高物流信息的实时性和准确性
- 自动触发到货确认，减少漏单
- 提升客户体验，可以实时告知客户物流状态

**实现方式：**

```typescript
// 物流服务接口
interface LogisticsService {
  // 查询物流轨迹
  track(trackingNumber: string, company: string): Promise<LogisticsInfo>;

  // 订阅物流状态变更
  subscribe(trackingNumber: string, callback: (info: LogisticsInfo) => void): void;

  // 取消订阅
  unsubscribe(trackingNumber: string): void;
}

// 物流信息结构
interface LogisticsInfo {
  trackingNumber: string;
  company: string;
  status: 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
  currentLocation?: string;
  estimatedDelivery?: Date;
  timeline: LogisticsEvent[];
}

interface LogisticsEvent {
  time: Date;
  status: string;
  location?: string;
  description: string;
}

// 定时任务轮询物流状态
export const syncLogisticsStatus = cronJob('0 */2 * * *', async () => {
  const shippedPOs = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, 'SHIPPED'));

  for (const po of shippedPOs) {
    if (po.logisticsCompany && po.logisticsNo) {
      try {
        const info = await logisticsService.track(po.logisticsNo, po.logisticsCompany);

        if (info.status === 'DELIVERED') {
          await updatePurchaseOrderStatus(po.id, 'DELIVERED');
          await notifySales(po.orderId, '货物已签收');
        }

        await saveLogisticsHistory(po.id, info);
      } catch (error) {
        console.error(`Failed to track logistics for PO ${po.poNo}:`, error);
      }
    }
  }
});
```

**支持的物流公司：**

- 顺丰速运
- 德邦快递
- 中通快递
- 圆通速递
- 申通快递
- 韵达快递
- 京东物流

### 2.2 成本价可见性控制策略

**决策：基于角色的可见性控制**

**说明：**

- 财务人员：可以看到所有采购单的成本价
- 采购员：只能看到自己负责的采购单的成本价
- 店长：可以看到本店所有采购单的成本价
- 其他角色（销售、客服）：不能看到成本价

**优势：**

- 保护商业机密，避免成本价泄露
- 确保相关人员能够看到必要的成本信息
- 灵活的权限控制，适应不同组织结构
- 便于审计和追溯

**权限矩阵：**

| 角色     | 查看成本价 | 查看范围         |
| :------- | :--------- | :--------------- |
| 财务人员 | ✓          | 所有采购单       |
| 采购员   | ✓          | 自己负责的采购单 |
| 店长     | ✓          | 本店所有采购单   |
| 销售     | ✗          | -                |
| 客服     | ✗          | -                |

**实现方式：**

```typescript
// 权限检查函数
export function canViewCostPrice(user: User, purchaseOrder: PurchaseOrder): boolean {
  const role = user.role;

  // 财务人员可以查看所有成本价
  if (role === 'FINANCE') {
    return true;
  }

  // 采购员只能查看自己负责的采购单
  if (role === 'PURCHASER') {
    return purchaseOrder.createdBy === user.id;
  }

  // 店长可以查看本店所有采购单
  if (role === 'STORE_MANAGER') {
    return purchaseOrder.storeId === user.storeId;
  }

  // 其他角色不能查看成本价
  return false;
}

// API层权限控制
export async function getPurchaseOrderDetail(poId: string, user: User) {
  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).limit(1);

  if (!po[0]) {
    throw new Error('采购单不存在');
  }

  const canViewCost = canViewCostPrice(user, po[0]);

  const result = {
    ...po[0],
    items: await getPurchaseOrderItems(poId),
  };

  // 如果没有权限查看成本价，则隐藏成本相关字段
  if (!canViewCost) {
    result.items = result.items.map((item) => ({
      ...item,
      unitCost: undefined,
      subtotal: undefined,
    }));
    result.totalCost = undefined;
  }

  return result;
}

// 数据库查询层过滤
export async function getPurchaseOrderList(params: { user: User; filters?: any }) {
  const { user, filters } = params;
  const query = db.select().from(purchaseOrders);

  // 根据用户角色过滤可见范围
  if (user.role === 'PURCHASER') {
    query.where(eq(purchaseOrders.createdBy, user.id));
  } else if (user.role === 'STORE_MANAGER') {
    query.where(eq(purchaseOrders.storeId, user.storeId));
  }
  // 财务人员不过滤，可以看到所有

  const result = await query.execute();

  // 检查成本价可见性
  const canViewCost = user.role === 'FINANCE' || user.role === 'STORE_MANAGER';

  if (!canViewCost) {
    return result.map((po) => ({
      ...po,
      totalCost: undefined,
    }));
  }

  return result;
}
```

## 3. 数据库设计

### 3.1 核心表结构

```sql
-- 采购单主表
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_no VARCHAR(50) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id),
  after_sales_id UUID REFERENCES after_sales_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  supplier_name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('FABRIC', 'FINISHED', 'STOCK')),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'STOCKED', 'CANCELLED')),
  total_cost DECIMAL(12, 2) NOT NULL,
  external_po_no VARCHAR(50),
  supplier_quote_img TEXT,
  sent_method VARCHAR(20) CHECK (sent_method IN ('WECHAT', 'EMAIL', 'SYSTEM')),
  sent_at TIMESTAMPTZ,
  produced_at TIMESTAMPTZ,
  logistics_company VARCHAR(50),
  logistics_no VARCHAR(50),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID')),
  remark TEXT,
  store_id UUID REFERENCES stores(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 采购单明细表
CREATE TABLE po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  width DECIMAL(10, 2),
  height DECIMAL(10, 2),
  subtotal DECIMAL(12, 2) NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 物流历史记录表
CREATE TABLE logistics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(50) NOT NULL,
  logistics_company VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_location VARCHAR(200),
  estimated_delivery TIMESTAMPTZ,
  event_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 采购单操作日志表
CREATE TABLE po_operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  operation VARCHAR(50) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  operator_id UUID NOT NULL REFERENCES users(id),
  operator_name VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_purchase_orders_order ON purchase_orders(order_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_logistics ON purchase_orders(logistics_no);
CREATE INDEX idx_po_items_po ON po_items(po_id);
CREATE INDEX idx_po_items_product ON po_items(product_id);
CREATE INDEX idx_logistics_history_po ON logistics_history(po_id);
CREATE INDEX idx_logistics_history_tracking ON logistics_history(tracking_number);
CREATE INDEX idx_po_operation_logs_po ON po_operation_logs(po_id);
```

### 3.2 Drizzle Schema

```typescript
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  text,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    poNo: varchar('po_no', { length: 50 }).notNull().unique(),
    orderId: uuid('order_id').notNull().references('orders.id'),
    afterSalesId: uuid('after_sales_id').references('after_sales_orders.id'),
    supplierId: uuid('supplier_id').notNull().references('suppliers.id'),
    supplierName: varchar('supplier_name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),
    externalPoNo: varchar('external_po_no', { length: 50 }),
    supplierQuoteImg: text('supplier_quote_img'),
    sentMethod: varchar('sent_method', { length: 20 }),
    sentAt: timestamp('sent_at'),
    producedAt: timestamp('produced_at'),
    logisticsCompany: varchar('logistics_company', { length: 50 }),
    logisticsNo: varchar('logistics_no', { length: 50 }),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('PENDING'),
    remark: text('remark'),
    storeId: uuid('store_id').references('stores.id'),
    createdBy: uuid('created_by').notNull().references('users.id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_purchase_orders_order').on(table.orderId),
    supplierIdx: index('idx_purchase_orders_supplier').on(table.supplierId),
    statusIdx: index('idx_purchase_orders_status').on(table.status),
    createdByIdx: index('idx_purchase_orders_created_by').on(table.createdBy),
    logisticsIdx: index('idx_purchase_orders_logistics').on(table.logisticsNo),
  })
);

export const poItems = pgTable(
  'po_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    poId: uuid('po_id').notNull().references('purchase_orders.id', { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').references('order_items.id'),
    productId: uuid('product_id').notNull().references('products.id'),
    productName: varchar('product_name', { length: 200 }).notNull(),
    productSku: varchar('product_sku', { length: 50 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    width: decimal('width', { precision: 10, scale: 2 }),
    height: decimal('height', { precision: 10, scale: 2 }),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    remark: text('remark'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    poIdx: index('idx_po_items_po').on(table.poId),
    productIdx: index('idx_po_items_product').on(table.productId),
  })
);

export const logisticsHistory = pgTable(
  'logistics_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    poId: uuid('po_id').notNull().references('purchase_orders.id', { onDelete: 'cascade' }),
    trackingNumber: varchar('tracking_number', { length: 50 }).notNull(),
    logisticsCompany: varchar('logistics_company', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    currentLocation: varchar('current_location', { length: 200 }),
    estimatedDelivery: timestamp('estimated_delivery'),
    eventTime: timestamp('event_time').notNull(),
    description: text('description'),
    rawData: jsonb('raw_data'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    poIdx: index('idx_logistics_history_po').on(table.poId),
    trackingIdx: index('idx_logistics_history_tracking').on(table.trackingNumber),
  })
);

export const poOperationLogs = pgTable(
  'po_operation_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    poId: uuid('po_id').notNull().references('purchase_orders.id', { onDelete: 'cascade' }),
    operation: varchar('operation', { length: 50 }).notNull(),
    oldStatus: varchar('old_status', { length: 20 }),
    newStatus: varchar('new_status', { length: 20 }),
    operatorId: uuid('operator_id').notNull().references('users.id'),
    operatorName: varchar('operator_name', { length: 100 }).notNull(),
    remark: text('remark'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    poIdx: index('idx_po_operation_logs_po').on(table.poId),
  })
);
```

## 4. 业务逻辑设计

### 4.1 采购单创建

```typescript
export async function createPurchaseOrder(params: {
  orderId: string;
  supplierId: string;
  type: 'FABRIC' | 'FINISHED' | 'STOCK';
  items: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    productSku: string;
    category: string;
    unitCost: number;
    quantity: number;
    width?: number;
    height?: number;
  }>;
  createdBy: string;
}) {
  const poNo = await generatePONo();

  const totalCost = params.items.reduce((sum, item) => {
    return sum + item.unitCost * item.quantity;
  }, 0);

  const po = await db
    .insert(purchaseOrders)
    .values({
      poNo,
      orderId: params.orderId,
      supplierId: params.supplierId,
      supplierName: await getSupplierName(params.supplierId),
      type: params.type,
      totalCost,
      status: 'DRAFT',
      paymentStatus: 'PENDING',
      createdBy: params.createdBy,
    })
    .returning();

  const poItems = await db
    .insert(poItems)
    .values(
      params.items.map((item) => ({
        poId: po[0].id,
        orderItemId: item.orderItemId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        category: item.category,
        unitCost: item.unitCost,
        quantity: item.quantity,
        width: item.width,
        height: item.height,
        subtotal: item.unitCost * item.quantity,
      }))
    )
    .returning();

  await logOperation(po[0].id, 'CREATE', null, 'DRAFT', params.createdBy);

  return { ...po[0], items: poItems };
}

async function generatePONo(): Promise<string> {
  const today = new Date();
  const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const lastPO = await db
    .select()
    .from(purchaseOrders)
    .where(like(purchaseOrders.poNo, `${prefix}%`))
    .orderBy(desc(purchaseOrders.poNo))
    .limit(1);

  let sequence = 1;
  if (lastPO[0]) {
    const lastSequence = parseInt(lastPO[0].poNo.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}
```

### 4.2 采购单状态流转

```typescript
export async function updatePurchaseOrderStatus(params: {
  poId: string;
  newStatus: string;
  operatorId: string;
  remark?: string;
  logisticsInfo?: {
    company: string;
    trackingNumber: string;
  };
}) {
  const po = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, params.poId))
    .limit(1);

  if (!po[0]) {
    throw new Error('采购单不存在');
  }

  const oldStatus = po[0].status;

  // 状态流转验证
  if (!isValidStatusTransition(oldStatus, params.newStatus)) {
    throw new Error(`无效的状态流转: ${oldStatus} -> ${params.newStatus}`);
  }

  // 更新采购单状态
  const updateData: any = {
    status: params.newStatus,
    updatedAt: new Date(),
  };

  // 根据新状态更新相关字段
  if (params.newStatus === 'IN_PRODUCTION') {
    updateData.sentAt = new Date();
  } else if (params.newStatus === 'READY') {
    updateData.producedAt = new Date();
  } else if (params.newStatus === 'SHIPPED' && params.logisticsInfo) {
    updateData.logisticsCompany = params.logisticsInfo.company;
    updateData.logisticsNo = params.logisticsInfo.trackingNumber;
    updateData.shippedAt = new Date();
  } else if (params.newStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  await db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, params.poId));

  // 记录操作日志
  await logOperation(
    params.poId,
    'STATUS_CHANGE',
    oldStatus,
    params.newStatus,
    params.operatorId,
    params.remark
  );

  // 触发下游事件
  await onPOStatusChanged({
    poId: params.poId,
    orderId: po[0].orderId,
    oldStatus,
    newStatus: params.newStatus,
  });

  return { success: true };
}

function isValidStatusTransition(oldStatus: string, newStatus: string): boolean {
  const transitions: Record<string, string[]> = {
    DRAFT: ['IN_PRODUCTION', 'CANCELLED'],
    IN_PRODUCTION: ['READY', 'CANCELLED'],
    READY: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['STOCKED'],
    STOCKED: [],
    CANCELLED: [],
  };

  return transitions[oldStatus]?.includes(newStatus) || false;
}

async function logOperation(
  poId: string,
  operation: string,
  oldStatus: string | null,
  newStatus: string | null,
  operatorId: string,
  remark?: string
) {
  const operator = await getUser(operatorId);

  await db.insert(poOperationLogs).values({
    poId,
    operation,
    oldStatus,
    newStatus,
    operatorId,
    operatorName: operator.name,
    remark,
  });
}
```

### 4.3 物流跟踪

```typescript
export async function trackLogistics(poId: string) {
  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).limit(1);

  if (!po[0] || !po[0].logisticsCompany || !po[0].logisticsNo) {
    throw new Error('采购单物流信息不完整');
  }

  const info = await logisticsService.track(po[0].logisticsNo, po[0].logisticsCompany);

  // 保存物流历史记录
  await db.insert(logisticsHistory).values({
    poId,
    trackingNumber: info.trackingNumber,
    logisticsCompany: info.company,
    status: info.status,
    currentLocation: info.currentLocation,
    estimatedDelivery: info.estimatedDelivery,
    eventTime: info.timeline[info.timeline.length - 1]?.time || new Date(),
    description: info.timeline[info.timeline.length - 1]?.description,
    rawData: info as any,
  });

  // 如果已签收，更新采购单状态
  if (info.status === 'DELIVERED' && po[0].status === 'SHIPPED') {
    await updatePurchaseOrderStatus({
      poId,
      newStatus: 'DELIVERED',
      operatorId: 'SYSTEM',
      remark: '物流API自动确认到货',
    });
  }

  return info;
}

export async function getLogisticsTimeline(poId: string) {
  const history = await db
    .select()
    .from(logisticsHistory)
    .where(eq(logisticsHistory.poId, poId))
    .orderBy(asc(logisticsHistory.eventTime));

  return history.map((h) => ({
    time: h.eventTime,
    status: h.status,
    location: h.currentLocation,
    description: h.description,
  }));
}
```

### 4.4 订单状态联动

```typescript
export async function onPOStatusChanged(params: {
  poId: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
}) {
  const order = await getOrder(params.orderId);
  const allPOs = await getPurchaseOrdersByOrderId(params.orderId);

  // 成品采购单状态联动
  const finishedPOs = allPOs.filter((po) => po.type === 'FINISHED');

  if (params.newStatus === 'IN_PRODUCTION' && finishedPOs.some((po) => po.id === params.poId)) {
    await updateOrderStatus(params.orderId, 'IN_PRODUCTION');
  }

  if (
    params.newStatus === 'READY' &&
    finishedPOs.every(
      (po) => po.status === 'READY' || po.status === 'SHIPPED' || po.status === 'DELIVERED'
    )
  ) {
    await updateOrderStatus(params.orderId, 'READY');
  }

  // 面料采购单状态联动
  const fabricPOs = allPOs.filter((po) => po.type === 'FABRIC');

  if (params.newStatus === 'IN_PRODUCTION' && fabricPOs.some((po) => po.id === params.poId)) {
    await updateOrderStatus(params.orderId, 'FABRIC_PURCHASING');
  }

  if (params.newStatus === 'STOCKED' && fabricPOs.every((po) => po.status === 'STOCKED')) {
    await updateOrderStatus(params.orderId, 'FABRIC_RECEIVED');
  }

  // 所有采购单完成
  if (
    allPOs.every(
      (po) =>
        po.status === 'SHIPPED' ||
        po.status === 'DELIVERED' ||
        po.status === 'STOCKED' ||
        po.status === 'CANCELLED'
    )
  ) {
    await updateOrderStatus(params.orderId, 'SHIPPED');
  }

  if (
    allPOs.every(
      (po) => po.status === 'DELIVERED' || po.status === 'STOCKED' || po.status === 'CANCELLED'
    )
  ) {
    await updateOrderStatus(params.orderId, 'PENDING_INSTALL');
  }
}
```

## 5. API 设计

### 5.1 采购单相关 API

```typescript
// 获取采购单列表
GET /api/purchase-orders
Query Parameters:
  - status?: 'DRAFT' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'STOCKED' | 'CANCELLED'
  - type?: 'FABRIC' | 'FINISHED' | 'STOCK'
  - supplierId?: string
  - orderId?: string
  - startDate?: string
  - endDate?: string
  - page: number
  - pageSize: number

// 获取采购单详情
GET /api/purchase-orders/:id

// 确认下单
POST /api/purchase-orders/:id/confirm-order
Body: {
  supplierQuoteImg?: string;
  sentMethod?: 'WECHAT' | 'EMAIL' | 'SYSTEM';
  remark?: string;
}

// 备货完成
POST /api/purchase-orders/:id/ready
Body: {
  remark?: string;
}

// 填写物流信息
POST /api/purchase-orders/:id/ship
Body: {
  logisticsCompany: string;
  logisticsNo: string;
  remark?: string;
}

// 确认到货
POST /api/purchase-orders/:id/deliver
Body: {
  remark?: string;
}

// 确认入库
POST /api/purchase-orders/:id/stock
Body: {
  remark?: string;
}

// 取消采购单
POST /api/purchase-orders/:id/cancel
Body: {
  reason: string;
}

// 获取物流信息
GET /api/purchase-orders/:id/logistics

// 手动刷新物流信息
POST /api/purchase-orders/:id/logistics/refresh

// 获取操作日志
GET /api/purchase-orders/:id/logs
Query Parameters:
  - page: number
  - pageSize: number
```

### 5.2 权限控制中间件

```typescript
// 检查是否有权限查看成本价
export async function checkCostPricePermission(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const poId = req.params.id;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const po = await getPurchaseOrderById(poId);

  if (!canViewCostPrice(user, po)) {
    // 在响应中过滤掉成本价字段
    req.filterCostPrice = true;
  }

  next();
}

// 检查是否有权限操作采购单
export async function checkPOOperationPermission(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const poId = req.params.id;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const po = await getPurchaseOrderById(poId);

  // 只有采购员和店长可以操作采购单
  if (user.role !== 'PURCHASER' && user.role !== 'STORE_MANAGER') {
    return res.status(403).json({ error: '无权限' });
  }

  // 采购员只能操作自己创建的采购单
  if (user.role === 'PURCHASER' && po.createdBy !== user.id) {
    return res.status(403).json({ error: '无权限' });
  }

  next();
}
```

## 6. UI 设计

### 6.1 采购单列表页

```
┌─────────────────────────────────────────────────────────────┐
│ 采购单管理                                    [新建采购单]    │
├─────────────────────────────────────────────────────────────┤
│ 筛选: [状态▼] [类型▼] [供应商▼] [日期范围] [搜索订单号/采购单号] │
├─────────────────────────────────────────────────────────────┤
│ 采购单号      订单号    供应商    类型    金额    状态    操作  │
│ PO20260101001 ORD001   供应商A   成品    ¥10,000 生产中 [详情]│
│ PO20260101002 ORD001   供应商B   面料    ¥5,000  草稿   [详情]│
│ PO20260101003 ORD002   供应商A   成品    ¥15,000 已发货 [详情]│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 采购单详情页

```
┌─────────────────────────────────────────────────────────────┐
│ 采购单详情 #PO20260101001                                    │
│ [确认下单] [备货完成] [填物流] [确认到货] [取消]              │
├──────────────────────┬──────────────────────────────────────┤
│ 基础信息             │ 状态进度条                           │
│ 采购单号: PO20260101001│ [草稿]→[生产中]→[备货完成]→[已发货]│
│ 关联订单: ORD001     │                                    │
│ 供应商: 供应商A      │                                    │
│ 类型: 成品采购       │                                    │
│ 采购金额: ¥10,000    │                                    │
│ 外部单号: [________] │                                    │
│ 供应商确认截图: [上传]│                                    │
├──────────────────────┴──────────────────────────────────────┤
│ 商品明细                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 商品名称    SKU      规格    成本单价  数量  小计       │  │
│ │ 窗户A       WIN-A    1.5x2.0 ¥500     10    ¥5,000    │  │
│ │ 窗户B       WIN-B    2.0x2.5 ¥500     10    ¥5,000    │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 物流信息 (已发货后显示)                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 物流公司: 顺丰速运                                      │  │
│ │ 物流单号: SF1234567890                                 │  │
│ │ 发货时间: 2026-01-15 10:00                            │  │
│ │ [刷新物流] [查看轨迹]                                  │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 操作日志                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 2026-01-15 10:00 采购员张三  填写物流信息             │  │
│ │ 2026-01-14 15:00 采购员张三  备货完成                 │  │
│ │ 2026-01-13 09:00 采购员张三  确认下单                 │  │
│ │ 2026-01-12 14:00 系统         创建采购单               │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 物流轨迹页面

```
┌─────────────────────────────────────────────────────────────┐
│ 物流轨迹 #PO20260101001                        [刷新] [关闭]  │
├─────────────────────────────────────────────────────────────┤
│ 物流公司: 顺丰速运                                           │
│ 物流单号: SF1234567890                                      │
│ 当前状态: 运输中                                            │
│ 预计送达: 2026-01-18                                        │
├─────────────────────────────────────────────────────────────┤
│ 物流轨迹                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 2026-01-15 14:30  运输中       北京市朝阳区派送中      │  │
│ │ 2026-01-15 08:00  到达北京     北京市顺义区中转场      │  │
│ │ 2026-01-14 20:00  运输中       河北省石家庄市中转场    │  │
│ │ 2026-01-14 10:00  已揽收       河北省保定市网点        │  │
│ │ 2026-01-13 18:00  已下单       顺丰速运                │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 7. 技术实施建议

### 7.1 物流API集成

```typescript
// 物流服务工厂
class LogisticsServiceFactory {
  private static services: Map<string, LogisticsService> = new Map();

  static register(company: string, service: LogisticsService) {
    this.services.set(company, service);
  }

  static getService(company: string): LogisticsService {
    const service = this.services.get(company);
    if (!service) {
      throw new Error(`不支持的物流公司: ${company}`);
    }
    return service;
  }
}

// 顺丰物流服务实现
class SFExpressService implements LogisticsService {
  async track(trackingNumber: string): Promise<LogisticsInfo> {
    const response = await fetch(
      'https://api.sf-express.com/sf-service-mp-waybill-routerservice-web/waybill/query',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waybillNo: trackingNumber,
        }),
      }
    );

    const data = await response.json();
    return this.parseResponse(data);
  }

  private parseResponse(data: any): LogisticsInfo {
    return {
      trackingNumber: data.waybillNo,
      company: 'SF_EXPRESS',
      status: this.mapStatus(data.status),
      currentLocation: data.currentLocation,
      estimatedDelivery: data.estimatedDelivery,
      timeline: data.routes.map((route: any) => ({
        time: route.time,
        status: route.status,
        location: route.location,
        description: route.description,
      })),
    };
  }

  private mapStatus(status: string): LogisticsInfo['status'] {
    const statusMap: Record<string, LogisticsInfo['status']> = {
      PICKED_UP: 'PICKED_UP',
      IN_TRANSIT: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      EXCEPTION: 'EXCEPTION',
    };
    return statusMap[status] || 'IN_TRANSIT';
  }
}

// 注册物流服务
LogisticsServiceFactory.register('SF_EXPRESS', new SFExpressService());
LogisticsServiceFactory.register('DB_EXPRESS', new DBExpressService());
LogisticsServiceFactory.register('ZTO_EXPRESS', new ZTOExpressService());
```

### 7.2 定时任务

```typescript
// 每2小时同步一次物流状态
export const syncLogisticsStatus = cronJob('0 */2 * * *', async () => {
  console.log('开始同步物流状态...');

  const shippedPOs = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, 'SHIPPED'));

  for (const po of shippedPOs) {
    try {
      if (po.logisticsCompany && po.logisticsNo) {
        const service = LogisticsServiceFactory.getService(po.logisticsCompany);
        const info = await service.track(po.logisticsNo);

        await db.insert(logisticsHistory).values({
          poId: po.id,
          trackingNumber: info.trackingNumber,
          logisticsCompany: info.company,
          status: info.status,
          currentLocation: info.currentLocation,
          estimatedDelivery: info.estimatedDelivery,
          eventTime: info.timeline[info.timeline.length - 1]?.time || new Date(),
          description: info.timeline[info.timeline.length - 1]?.description,
          rawData: info as any,
        });

        if (info.status === 'DELIVERED') {
          await updatePurchaseOrderStatus({
            poId: po.id,
            newStatus: 'DELIVERED',
            operatorId: 'SYSTEM',
            remark: '物流API自动确认到货',
          });
        }
      }
    } catch (error) {
      console.error(`同步物流状态失败 PO ${po.poNo}:`, error);
    }
  }

  console.log('物流状态同步完成');
});

// 每天检查生产超时的采购单
export const checkProductionTimeout = cronJob('0 9 * * *', async () => {
  const timeoutPOs = await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.status, 'IN_PRODUCTION'),
        lt(purchaseOrders.sentAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    );

  for (const po of timeoutPOs) {
    await sendNotification({
      type: 'PRODUCTION_TIMEOUT',
      poId: po.id,
      poNo: po.poNo,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      sentAt: po.sentAt,
      recipients: [po.createdBy],
    });
  }
});
```

### 7.3 事件驱动

```typescript
// 采购单状态变更事件
export const onPOStatusChanged = createEvent<{
  poId: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
}>();

// 订阅事件
onPOStatusChanged.subscribe(async (event) => {
  // 更新订单状态
  await updateOrderStatusBasedOnPO(event);

  // 发送通知
  await sendPOStatusNotification(event);

  // 如果进入生产中，生成AP对账单
  if (event.newStatus === 'IN_PRODUCTION') {
    await createAPStatementForPO(event.poId);
  }
});

// 订单拆分事件
export const onOrderSplit = createEvent<{
  orderId: string;
  purchaseOrders: Array<{
    supplierId: string;
    type: 'FABRIC' | 'FINISHED' | 'STOCK';
    items: any[];
  }>;
}>();

onOrderSplit.subscribe(async (event) => {
  for (const poData of event.purchaseOrders) {
    await createPurchaseOrder({
      orderId: event.orderId,
      supplierId: poData.supplierId,
      type: poData.type,
      items: poData.items,
      createdBy: 'SYSTEM',
    });
  }
});
```

## 8. 总结

本架构设计文档详细描述了采购模块的核心架构决策、数据库设计、业务逻辑设计、API 设计和 UI 设计。主要特点包括：

1. **物流跟踪自动化**：通过API集成主流物流公司，自动查询物流状态，减少人工工作量
2. **成本价可见性控制**：基于角色的权限控制，保护商业机密，确保相关人员能够看到必要的成本信息
3. **完整的状态流转**：支持草稿、生产中、备货完成、已发货、已到货、已入库等状态
4. **订单状态联动**：采购单状态变化自动触发订单状态更新
5. **操作日志记录**：完整记录所有操作，便于审计和追溯
6. **灵活的权限控制**：支持不同角色的不同权限，适应不同组织结构

该架构设计能够满足门窗行业的采购需求，具有良好的扩展性和可维护性。
