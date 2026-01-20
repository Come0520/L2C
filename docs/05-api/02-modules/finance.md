# 财务模块 API

> 财务模块提供应收应付管理、财务账户管理、对账管理等功能，支持完整的财务管理流程。

## 概述

财务模块是 L2C 系统的核心模块之一，负责管理所有财务相关信息。系统支持应收管理（AR）、应付管理（AP）、财务账户管理、对账管理、佣金计算等功能。

### 核心功能

- 应收管理（应收对账单、收款单、佣金计算）
- 应付管理（供应商对账单、付款单、劳务结算）
- 财务账户管理（账户创建、账户流水）
- 对账管理（对账单创建、对账明细）
- 财务统计分析

---

## 应收管理（AR）

### 1. 查询应收对账单列表

查询当前租户的所有应收对账单。

### 接口信息
- **URL**: `GET /api/v1/finance/ar/statements`
- **认证**: 需要
- **权限**: `finance.ar.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 对账单状态：PENDING_RECON/RECONCILED/INVOICED/PARTIAL/PAID/COMPLETED |
| customerId | string | 否 | 客户 ID |
| orderId | string | 否 | 订单 ID |
| channelId | string | 否 | 渠道 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "statementNo": "AR2026011500001",
      "orderId": "uuid",
      "orderNo": "ORD2026011500001",
      "customerId": "uuid",
      "customerName": "张三",
      "settlementType": "PREPAID",
      "totalAmount": "5000.00",
      "receivedAmount": "3000.00",
      "pendingAmount": "2000.00",
      "status": "PARTIAL",
      "invoiceNo": "INV2026011500001",
      "invoicedAt": "2026-01-15T10:00:00Z",
      "taxRate": "0.13",
      "taxAmount": "650.00",
      "isTaxInclusive": false,
      "salesId": "uuid",
      "salesName": "李四",
      "channelId": "uuid",
      "channelName": "渠道A",
      "commissionRate": "0.10",
      "commissionAmount": "500.00",
      "commissionStatus": "CALCULATED",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 2. 查询应收对账单详情

根据对账单 ID 查询应收对账单详细信息。

### 接口信息
- **URL**: `GET /api/v1/finance/ar/statements/{id}`
- **认证**: 需要
- **权限**: `finance.ar.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 对账单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "statementNo": "AR2026011500001",
    "orderId": "uuid",
    "orderNo": "ORD2026011500001",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "settlementType": "PREPAID",
    "totalAmount": "5000.00",
    "receivedAmount": "3000.00",
    "pendingAmount": "2000.00",
    "status": "PARTIAL",
    "invoiceNo": "INV2026011500001",
    "invoicedAt": "2026-01-15T10:00:00Z",
    "taxRate": "0.13",
    "taxAmount": "650.00",
    "isTaxInclusive": false,
    "salesId": "uuid",
    "salesName": "李四",
    "channelId": "uuid",
    "channelName": "渠道A",
    "commissionRate": "0.10",
    "commissionAmount": "500.00",
    "commissionStatus": "CALCULATED",
    "createdAt": "2026-01-15T10:00:00Z",
    "order": {
      "id": "uuid",
      "orderNo": "ORD2026011500001",
      "totalAmount": "5000.00",
      "status": "CONFIRMED"
    },
    "customer": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000"
    },
    "channel": {
      "id": "uuid",
      "name": "渠道A",
      "cooperationMode": "REBATE",
      "commissionRate": "0.10"
    },
    "commissionRecords": [
      {
        "id": "uuid",
        "commissionNo": "COMM2026011500001",
        "orderAmount": "5000.00",
        "commissionRate": "0.10",
        "commissionAmount": "500.00",
        "status": "CALCULATED",
        "calculatedAt": "2026-01-15T11:00:00Z"
      }
    ]
  }
}
```

---

### 3. 创建收款单

创建新的收款单。

### 接口信息
- **URL**: `POST /api/v1/finance/ar/payment-orders`
- **认证**: 需要
- **权限**: `finance.ar.create`

### 请求参数

```json
{
  "customerId": "uuid",
  "customerName": "张三",
  "customerPhone": "13800138000",
  "totalAmount": "3000",
  "type": "NORMAL",
  "paymentMethod": "BANK_TRANSFER",
  "accountId": "uuid",
  "proofUrl": "https://oss.example.com/payment-proof.jpg",
  "receivedAt": "2026-01-15T10:00:00Z",
  "remark": "客户转账",
  "items": [
    {
      "orderId": "uuid",
      "amount": 3000
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customerId | string | 否 | 客户 ID |
| customerName | string | 是 | 客户姓名 |
| customerPhone | string | 是 | 客户电话 |
| totalAmount | string | 是 | 收款金额 |
| type | string | 是 | 收款类型：PREPAID/NORMAL |
| paymentMethod | string | 是 | 收款方式：BANK_TRANSFER/WECHAT/ALIPAY/CASH |
| accountId | string | 否 | 账户 ID |
| proofUrl | string | 是 | 收款凭证 URL |
| receivedAt | string | 是 | 收款时间 |
| remark | string | 否 | 备注 |
| items | array | 否 | 关联订单明细 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 订单 ID |
| amount | number | 是 | 金额 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "paymentNo": "PAY-1705296000000",
    "customerId": "uuid",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "totalAmount": "3000.00",
    "usedAmount": "0",
    "remainingAmount": "3000.00",
    "type": "NORMAL",
    "status": "PENDING",
    "paymentMethod": "BANK_TRANSFER",
    "accountId": "uuid",
    "proofUrl": "https://oss.example.com/payment-proof.jpg",
    "receivedAt": "2026-01-15T10:00:00Z",
    "remark": "客户转账",
    "createdBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **收款编号**：系统自动生成收款编号（格式：PAY + 时间戳）
2. **初始状态**：新收款单默认为待审核状态
3. **余额管理**：初始可用余额为收款金额
4. **订单关联**：可以关联多个订单

---

### 4. 审核收款单

审核收款单，通过后更新账户余额和应收对账单。

### 接口信息
- **URL**: `PUT /api/v1/finance/ar/payment-orders/{id}/verify`
- **认证**: 需要
- **权限**: `finance.ar.verify`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 收款单 ID |

### 请求参数

```json
{
  "status": "VERIFIED",
  "remark": "审核通过"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 审核状态：VERIFIED/REJECTED |
| remark | string | 否 | 审核备注 |

### 响应示例

```json
{
  "success": true,
  "message": "收款单审核成功"
}
```

### 业务规则

1. **状态限制**：只有待审核状态的收款单可以审核
2. **审核通过**：
   - 更新收款单状态为已审核
   - 更新账户余额
   - 记录账户流水
   - 更新应收对账单的已收金额和状态
   - 如果对账单已付清，自动计算佣金
3. **审核拒绝**：
   - 更新收款单状态为已拒绝
   - 不更新账户余额和对账单

---

### 5. 生成应收计划

根据订单生成应收计划（付款计划）。

### 接口信息
- **URL**: `POST /api/v1/finance/ar/generate-schedules`
- **认证**: 需要
- **权限**: `finance.ar.create`

### 请求参数

```json
{
  "orderId": "uuid",
  "totalAmount": "5000",
  "ratios": [0.6, 0.4]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderId | string | 是 | 订单 ID |
| totalAmount | string | 是 | 订单总金额 |
| ratios | array | 否 | 付款比例数组，默认 [0.6, 0.4] |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "name": "预付款/Deposit",
      "amount": "3000.00",
      "status": "PENDING",
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "orderId": "uuid",
      "name": "尾款/Balance",
      "amount": "2000.00",
      "status": "PENDING",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### 业务规则

1. **比例验证**：付款比例总和必须为 1
2. **金额计算**：自动计算每个阶段的金额
3. **金额调整**：最后一个阶段的金额自动调整以处理四舍五入误差
4. **阶段命名**：第一个阶段为"预付款"，最后一个阶段为"尾款"，中间阶段为"阶段款 N"

---

## 应付管理（AP）

### 6. 查询供应商对账单列表

查询当前租户的所有供应商对账单。

### 接口信息
- **URL**: `GET /api/v1/finance/ap/supplier-statements`
- **认证**: 需要
- **权限**: `finance.ap.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 对账单状态：PENDING/RECONCILED/INVOICED/PARTIAL/PAID/COMPLETED |
| supplierId | string | 否 | 供应商 ID |
| purchaseOrderId | string | 否 | 采购单 ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "statementNo": "AP-SUP-2026011500001",
      "purchaseOrderId": "uuid",
      "purchaseOrderNo": "PO2026011500001",
      "supplierId": "uuid",
      "supplierName": "供应商A",
      "totalAmount": "10000.00",
      "paidAmount": "5000.00",
      "pendingAmount": "5000.00",
      "status": "PARTIAL",
      "invoiceNo": "INV-SUP-2026011500001",
      "invoicedAt": "2026-01-15T10:00:00Z",
      "taxRate": "0.13",
      "taxAmount": "1300.00",
      "isTaxInclusive": false,
      "purchaserId": "uuid",
      "purchaserName": "李四",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 7. 查询劳务结算单列表

查询当前租户的所有劳务结算单。

### 接口信息
- **URL**: `GET /api/v1/finance/ap/labor-statements`
- **认证**: 需要
- **权限**: `finance.ap.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 结算单状态：PENDING/CALCULATED/VERIFIED/PARTIAL/PAID/COMPLETED |
| workerId | string | 否 | 师傅 ID |
| settlementPeriod | string | 否 | 结算周期（YYYY-MM） |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "statementNo": "LAB-202601-abc1",
      "workerId": "uuid",
      "workerName": "李四",
      "workerPhone": "13800138001",
      "settlementPeriod": "2026-01",
      "totalAmount": "5000.00",
      "paidAmount": "0",
      "pendingAmount": "5000.00",
      "status": "CALCULATED",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 8. 查询劳务结算单详情

根据结算单 ID 查询劳务结算单详细信息。

### 接口信息
- **URL**: `GET /api/v1/finance/ap/labor-statements/{id}`
- **认证**: 需要
- **权限**: `finance.ap.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 结算单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "statementNo": "LAB-202601-abc1",
    "workerId": "uuid",
    "workerName": "李四",
    "workerPhone": "13800138001",
    "settlementPeriod": "2026-01",
    "totalAmount": "5000.00",
    "paidAmount": "0",
    "pendingAmount": "5000.00",
    "status": "CALCULATED",
    "createdAt": "2026-01-15T10:00:00Z",
    "worker": {
      "id": "uuid",
      "name": "李四",
      "phone": "13800138001"
    },
    "feeDetails": [
      {
        "id": "uuid",
        "installTaskId": "uuid",
        "installTaskNo": "INS-1705296000000",
        "feeType": "BASE",
        "description": "安装标单费用",
        "calculation": "实发: 500.00",
        "amount": "500.00",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 9. 创建付款单

创建新的付款单。

### 接口信息
- **URL**: `POST /api/v1/finance/ap/payment-bills`
- **认证**: 需要
- **权限**: `finance.ap.create`

### 请求参数

```json
{
  "type": "SUPPLIER",
  "payeeType": "SUPPLIER",
  "payeeId": "uuid",
  "payeeName": "供应商A",
  "amount": "5000",
  "paymentMethod": "BANK_TRANSFER",
  "accountId": "uuid",
  "proofUrl": "https://oss.example.com/payment-proof.jpg",
  "remark": "供应商付款",
  "items": [
    {
      "statementType": "AP_SUPPLIER",
      "statementId": "uuid",
      "amount": 5000
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 付款类型：SUPPLIER/LABOR |
| payeeType | string | 是 | 收款方类型：SUPPLIER/WORKER |
| payeeId | string | 是 | 收款方 ID |
| payeeName | string | 是 | 收款方名称 |
| amount | string | 是 | 付款金额 |
| paymentMethod | string | 是 | 付款方式：BANK_TRANSFER/WECHAT/ALIPAY/CASH |
| accountId | string | 否 | 账户 ID |
| proofUrl | string | 是 | 付款凭证 URL |
| remark | string | 否 | 备注 |
| items | array | 否 | 关联对账单明细 |

### items 对象

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| statementType | string | 是 | 对账单类型：AP_SUPPLIER/AP_LABOR |
| statementId | string | 是 | 对账单 ID |
| amount | number | 是 | 金额 |

### 响应示例

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "paymentNo": "BILL-1705296000000",
    "type": "SUPPLIER",
    "payeeType": "SUPPLIER",
    "payeeId": "uuid",
    "payeeName": "供应商A",
    "amount": "5000.00",
    "status": "PENDING",
    "paymentMethod": "BANK_TRANSFER",
    "accountId": "uuid",
    "proofUrl": "https://oss.example.com/payment-proof.jpg",
    "remark": "供应商付款",
    "recordedBy": "uuid",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### 业务规则

1. **付款编号**：系统自动生成付款编号（格式：BILL + 时间戳）
2. **初始状态**：新付款单默认为待审核状态
3. **对账单关联**：可以关联多个对账单

---

### 10. 审核付款单

审核付款单，通过后扣除账户余额并更新对账单。

### 接口信息
- **URL**: `PUT /api/v1/finance/ap/payment-bills/{id}/verify`
- **认证**: 需要
- **权限**: `finance.ap.verify`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 付款单 ID |

### 请求参数

```json
{
  "status": "VERIFIED",
  "remark": "审核通过"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 审核状态：VERIFIED/REJECTED |
| remark | string | 否 | 审核备注 |

### 响应示例

```json
{
  "success": true,
  "message": "付款单审核成功"
}
```

### 业务规则

1. **状态限制**：只有待审核状态的付款单可以审核
2. **审核通过**：
   - 更新付款单状态为已付款
   - 扣除账户余额
   - 记录账户流水
   - 更新对账单的已付金额和状态
3. **审核拒绝**：
   - 更新付款单状态为已拒绝
   - 不扣除账户余额

---

### 11. 自动生成劳务结算单

扫描已完成且未结算的安装任务，自动生成劳务结算单。

### 接口信息
- **URL**: `POST /api/v1/finance/ap/labor-statements/generate`
- **认证**: 需要
- **权限**: `finance.ap.create`

### 响应示例

```json
{
  "success": true,
  "data": {
    "count": 2
  }
}
```

### 业务规则

1. **扫描范围**：扫描状态为已完成且未结算的安装任务
2. **按师傅分组**：按师傅分组生成结算单
3. **金额计算**：汇总每个师傅的劳务费用
4. **结算周期**：结算周期为当前月份（YYYY-MM）
5. **初始状态**：新结算单状态为已计算

---

## 财务账户管理

### 12. 查询财务账户列表

查询当前租户的所有财务账户。

### 接口信息
- **URL**: `GET /api/v1/finance/accounts`
- **认证**: 需要
- **权限**: `finance.account.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountType | string | 否 | 账户类型：BANK/WECHAT/ALIPAY/CASH |
| isActive | boolean | 否 | 是否启用 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountNo": "ACC001",
      "accountName": "工商银行账户",
      "accountType": "BANK",
      "accountNumber": "6222021234567890",
      "bankName": "工商银行",
      "branchName": "深圳南山支行",
      "holderName": "张三",
      "balance": "100000.00",
      "isActive": true,
      "isDefault": true,
      "remark": "主账户",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 13. 查询账户流水列表

查询指定账户的流水记录。

### 接口信息
- **URL**: `GET /api/v1/finance/accounts/{id}/transactions`
- **认证**: 需要
- **权限**: `finance.account.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 账户 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| transactionType | string | 否 | 交易类型：INCOME/EXPENSE |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transactionNo": "TX-1705296000000",
      "accountId": "uuid",
      "accountName": "工商银行账户",
      "transactionType": "INCOME",
      "amount": "3000.00",
      "balanceBefore": "97000.00",
      "balanceAfter": "100000.00",
      "relatedType": "PAYMENT_ORDER",
      "relatedId": "uuid",
      "remark": "收款单审核通过: PAY-1705296000000",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 对账管理

### 14. 查询对账单列表

查询当前租户的所有对账单。

### 接口信息
- **URL**: `GET /api/v1/finance/reconciliations`
- **认证**: 需要
- **权限**: `finance.reconciliation.read`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reconciliationType | string | 否 | 对账类型：CUSTOMER/SUPPLIER/CHANNEL/INTERNAL |
| status | string | 否 | 对账单状态：PENDING/RECONCILING/MATCHED/UNMATCHED/CONFIRMED/COMPLETED |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reconciliationNo": "RECON-2026011500001",
      "reconciliationType": "CUSTOMER",
      "targetType": "CUSTOMER",
      "targetId": "uuid",
      "targetName": "张三",
      "totalAmount": "5000.00",
      "matchedAmount": "5000.00",
      "unmatchedAmount": "0",
      "status": "MATCHED",
      "reconciledAt": "2026-01-15T10:00:00Z",
      "confirmedBy": "uuid",
      "confirmedAt": "2026-01-15T11:00:00Z",
      "completedAt": "2026-01-15T12:00:00Z",
      "remark": "客户对账",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 15. 查询对账单详情

根据对账单 ID 查询对账单详细信息。

### 接口信息
- **URL**: `GET /api/v1/finance/reconciliations/{id}`
- **认证**: 需要
- **权限**: `finance.reconciliation.read`

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | 是 | 对账单 ID |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reconciliationNo": "RECON-2026011500001",
    "reconciliationType": "CUSTOMER",
    "targetType": "CUSTOMER",
    "targetId": "uuid",
    "targetName": "张三",
    "totalAmount": "5000.00",
    "matchedAmount": "5000.00",
    "unmatchedAmount": "0",
    "status": "MATCHED",
    "reconciledAt": "2026-01-15T10:00:00Z",
    "confirmedBy": "uuid",
    "confirmedAt": "2026-01-15T11:00:00Z",
    "completedAt": "2026-01-15T12:00:00Z",
    "remark": "客户对账",
    "createdAt": "2026-01-15T10:00:00Z",
    "details": [
      {
        "id": "uuid",
        "documentType": "AR_STATEMENT",
        "documentId": "uuid",
        "documentNo": "AR2026011500001",
        "documentAmount": "5000.00",
        "reconciliationAmount": "5000.00",
        "difference": "0",
        "status": "MATCHED",
        "remark": "对账匹配",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| FINANCE_AR_STATEMENT_NOT_FOUND | 404 | 应收对账单不存在 |
| FINANCE_PAYMENT_ORDER_NOT_FOUND | 404 | 收款单不存在 |
| FINANCE_PAYMENT_ORDER_INVALID_STATUS | 400 | 收款单状态无效 |
| FINANCE_PAYMENT_ORDER_INVALID_AMOUNT | 400 | 收款金额无效 |
| FINANCE_AP_STATEMENT_NOT_FOUND | 404 | 应付对账单不存在 |
| FINANCE_PAYMENT_BILL_NOT_FOUND | 404 | 付款单不存在 |
| FINANCE_PAYMENT_BILL_INVALID_STATUS | 400 | 付款单状态无效 |
| FINANCE_PAYMENT_BILL_INVALID_AMOUNT | 400 | 付款金额无效 |
| FINANCE_ACCOUNT_NOT_FOUND | 404 | 财务账户不存在 |
| FINANCE_ACCOUNT_INSUFFICIENT_BALANCE | 400 | 账户余额不足 |
| FINANCE_RECONCILIATION_NOT_FOUND | 404 | 对账单不存在 |
| FINANCE_COMMISSION_CALCULATION_FAILED | 500 | 佣金计算失败 |

---

## 数据模型

### ARStatement

```typescript
interface ARStatement {
  id: string;
  tenantId: string;
  statementNo: string;
  orderId: string;
  customerId: string;
  customerName: string;
  settlementType: 'PREPAID' | 'CREDIT' | 'CASH';
  totalAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  status: 'PENDING_RECON' | 'RECONCILED' | 'INVOICED' | 'PARTIAL' | 'PAID' | 'PENDING_DELIVER' | 'COMPLETED' | 'BAD_DEBT';
  invoiceNo?: string;
  invoicedAt?: Date;
  taxRate?: string;
  taxAmount?: string;
  isTaxInclusive: boolean;
  completedAt?: Date;
  salesId: string;
  channelId?: string;
  commissionRate?: string;
  commissionAmount?: string;
  commissionStatus?: 'PENDING' | 'CALCULATED' | 'PAID';
  createdAt: Date;
}
```

### PaymentOrder

```typescript
interface PaymentOrder {
  id: string;
  tenantId: string;
  paymentNo: string;
  type: 'PREPAID' | 'NORMAL';
  customerId?: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  usedAmount: string;
  remainingAmount: string;
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PARTIAL_USED' | 'FULLY_USED';
  paymentMethod: string;
  accountId?: string;
  proofUrl: string;
  receivedAt: Date;
  remark?: string;
  createdBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### PaymentBill

```typescript
interface PaymentBill {
  id: string;
  tenantId: string;
  paymentNo: string;
  type: 'SUPPLIER' | 'LABOR';
  payeeType: 'SUPPLIER' | 'WORKER';
  payeeId: string;
  payeeName: string;
  amount: string;
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAID';
  paymentMethod: string;
  accountId?: string;
  proofUrl: string;
  paidAt?: Date;
  recordedBy: string;
  remark?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### FinanceAccount

```typescript
interface FinanceAccount {
  id: string;
  tenantId: string;
  accountNo: string;
  accountName: string;
  accountType: 'BANK' | 'WECHAT' | 'ALIPAY' | 'CASH';
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  holderName: string;
  balance: string;
  isActive: boolean;
  isDefault: boolean;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AccountTransaction

```typescript
interface AccountTransaction {
  id: string;
  tenantId: string;
  transactionNo: string;
  accountId: string;
  transactionType: 'INCOME' | 'EXPENSE';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  relatedType: string;
  relatedId: string;
  remark?: string;
  createdAt: Date;
}
```
