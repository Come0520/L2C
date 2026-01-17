# L2C 核心 API 接口定义

本文档定义了 L2C 系统核心模块的 API 接口，涵盖线索、订单、供应链及工作流的关键操作。
接口遵循 RESTful 风格，所有请求需携带 `Tenant-ID` Header。

## 1. 线索模块 (Leads)

### 1.1 创建线索 (Smart Create)
*   **POST** `/api/v1/leads`
*   **描述**: 创建线索并执行智能查重与自动分配。
*   **Body**:
    ```json
    {
      "customer_phone": "13800138000", -- Required, 第一查重键
      "community": "阳光小区",        -- Optional, 第二查重键
      "address": "1栋201",            -- Optional, 第二查重键
      "channel_id": "uuid",
      "decoration_progress": "WATER_ELECTRIC" -- Enum: WATER_ELECTRIC, MUD_WOOD...
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "id": "uuid",
      "lead_no": "LD2026...",
      "is_duplicate": false,
      "assigned_sales_id": "uuid"
    }
    ```

### 1.2 申请免费测量
*   **POST** `/api/v1/leads/{id}/apply-free-measure`
*   **Body**:
    ```json
    {
      "reason": "客户意向高，且为大户型",
      "intention_level": "HIGH"
    }
    ```

### 1.3 预约测量 (Dispatch)
*   **POST** `/api/v1/leads/{id}/dispatch-measure`
*   **描述**: 发起测量任务，支持多种场景。
*   **Body**:
    ```json
    {
      "type": "QUOTE_BASED", -- Enum: QUOTE_BASED, BLIND, SALES_SELF
      "quoteId": "uuid",    -- Required if type == QUOTE_BASED
      "scheduledAt": "2026-02-01T10:00:00Z"
    }
    ```

## 2. 订单模块 (Orders)

### 2.1 创建订单
*   **POST** `/api/v1/orders`
*   **描述**: 报价单转订单，支持多种结算模式。
*   **Body**:
    ```json
    {
      "quote_id": "uuid",
      "settlement_type": "PREPAID", -- Enum: PREPAID, CREDIT, CASH
      "payment_proof": "oss_url",   -- Required
      "related_payment_id": "uuid"  -- Required if PREPAID
    }
    ```

### 2.2 智能拆单 (Smart Split)
*   **POST** `/api/v1/orders/{id}/split`
*   **描述**: 触发/预览拆单结果。
*   **Query**: `?dry_run=true` (预览模式)
*   **Response**:
    ```json
    {
      "preview": [
        { "type": "FINISHED", "supplier_id": "uuid_A", "items": [...] },
        { "type": "FABRIC", "supplier_id": "uuid_B", "items": [...] }
        { "type": "STOCK", "supplier_id": "uuid_Internal", "items": [...] }
      ]
    }
    ```

### 2.3 确认拆单
*   **POST** `/api/v1/orders/{id}/confirm-split`
*   **Body**: (可选，用于人工调整拆单结果)
    ```json
    {
      "adjustments": [
        { "item_id": "uuid", "target_supplier_id": "uuid" }
      ]
    }
    ```

## 3. 供应链模块 (Supply Chain)

### 3.1 确认采购单 (Confirm PO)
*   **POST** `/api/v1/purchase-orders/{id}/confirm`
*   **描述**: 采购员确认下单给供应商。
*   **Body**:
    ```json
    {
      "external_po_no": "Factory_123",
      "supplier_proof": "oss_url"
    }
    ```

### 3.2 面料入库 (Fabric Inbound)
*   **POST** `/api/v1/purchase-orders/{id}/inbound`
*   **描述**: 面料到货入库，自动触发加工单生成。
*   **Body**:
    ```json
    {
      "inbound_items": [
        { "po_item_id": "uuid", "quantity": 50, "location": "Warehouse_A" }
      ]
    }
    ```

### 3.3 加工单完成 (Complete Processing)
*   **POST** `/api/v1/work-orders/{id}/complete`
*   **Body**:
    ```json
    {
      "completed_at": "2026-02-05T10:00:00Z",
      "output_items": [...]
    }
    ```

## 4. 财务模块 (Finance)

### 4.1 触发佣金计算
*   **POST** `/api/v1/finance/commissions/calculate`
*   **描述**: 基于订单回款状态触发佣金计算。
*   **Body**:
    ```json
    { "orderId": "uuid" }
    ```
