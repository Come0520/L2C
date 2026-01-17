# 错误处理

> L2C 系统 API 错误码和异常处理

## 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {
      "field": "具体错误信息"
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 固定为 false |
| error.code | string | 错误码 |
| error.message | string | 错误描述 |
| error.details | object | 错误详情（可选） |

## HTTP 状态码

### 2xx 成功

| 状态码 | 说明 |
|--------|------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 204 No Content | 请求成功，无返回内容 |

### 4xx 客户端错误

| 状态码 | 说明 |
|--------|------|
| 400 Bad Request | 请求参数错误 |
| 401 Unauthorized | 未认证 |
| 403 Forbidden | 权限不足 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突 |
| 422 Unprocessable Entity | 业务规则验证失败 |
| 429 Too Many Requests | 请求过于频繁 |

### 5xx 服务端错误

| 状态码 | 说明 |
|--------|------|
| 500 Internal Server Error | 服务器内部错误 |
| 502 Bad Gateway | 网关错误 |
| 503 Service Unavailable | 服务不可用 |
| 504 Gateway Timeout | 网关超时 |

## 错误码分类

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| SUCCESS | 200 | 成功 |
| UNKNOWN_ERROR | 500 | 未知错误 |
| INTERNAL_ERROR | 500 | 内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

### 认证错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| UNAUTHORIZED | 401 | 未认证 |
| TOKEN_EXPIRED | 401 | Token 已过期 |
| TOKEN_INVALID | 401 | Token 无效 |
| TOKEN_MISSING | 401 | Token 缺失 |
| LOGIN_FAILED | 401 | 登录失败 |
| ACCOUNT_DISABLED | 403 | 账户已禁用 |
| PERMISSION_DENIED | 403 | 权限不足 |

### 验证错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| REQUIRED_FIELD_MISSING | 400 | 必填字段缺失 |
| INVALID_FORMAT | 400 | 格式不正确 |
| INVALID_LENGTH | 400 | 长度不正确 |
| INVALID_RANGE | 400 | 范围不正确 |
| INVALID_ENUM | 400 | 枚举值不正确 |

### 资源错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| RESOURCE_ALREADY_EXISTS | 409 | 资源已存在 |
| RESOURCE_LOCKED | 409 | 资源已锁定 |
| RESOURCE_DELETED | 410 | 资源已删除 |
| RESOURCE_CONFLICT | 409 | 资源冲突 |

### 业务错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| BUSINESS_RULE_VIOLATION | 422 | 违反业务规则 |
| INVALID_STATUS_TRANSITION | 422 | 状态转换无效 |
| DUPLICATE_LEAD | 409 | 线索重复 |
| INSUFFICIENT_INVENTORY | 422 | 库存不足 |
| PAYMENT_FAILED | 422 | 支付失败 |
| QUOTE_EXPIRED | 422 | 报价单已过期 |
| ORDER_LOCKED | 409 | 订单已锁定 |

### 限流错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| TENANT_RATE_LIMIT_EXCEEDED | 429 | 租户请求超限 |
| USER_RATE_LIMIT_EXCEEDED | 429 | 用户请求超限 |

### 系统错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| DATABASE_ERROR | 500 | 数据库错误 |
| NETWORK_ERROR | 502 | 网络错误 |
| TIMEOUT_ERROR | 504 | 超时错误 |
| FILE_UPLOAD_ERROR | 500 | 文件上传错误 |
| FILE_DOWNLOAD_ERROR | 500 | 文件下载错误 |

## 模块错误码

### 线索模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| LEAD_DUPLICATE_PHONE | 409 | 手机号重复 |
| LEAD_DUPLICATE_ADDRESS | 409 | 地址重复 |
| LEAD_NOT_FOUND | 404 | 线索不存在 |
| LEAD_ALREADY_ASSIGNED | 409 | 线索已分配 |
| LEAD_INVALID_STATUS | 422 | 线索状态无效 |
| LEAD_CANNOT_DELETE | 422 | 线索不能删除 |

### 客户模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| CUSTOMER_DUPLICATE_PHONE | 409 | 客户手机号重复 |
| CUSTOMER_NOT_FOUND | 404 | 客户不存在 |
| CUSTOMER_MERGE_FAILED | 422 | 客户合并失败 |
| CUSTOMER_INVALID_LEVEL | 422 | 客户等级无效 |

### 报价单模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| QUOTE_NOT_FOUND | 404 | 报价单不存在 |
| QUOTE_EXPIRED | 422 | 报价单已过期 |
| QUOTE_LOCKED | 409 | 报价单已锁定 |
| QUOTE_INVALID_STATUS | 422 | 报价单状态无效 |
| QUOTE_CANNOT_CONVERT | 422 | 报价单不能转订单 |

### 订单模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| ORDER_LOCKED | 409 | 订单已锁定 |
| ORDER_INVALID_STATUS | 422 | 订单状态无效 |
| ORDER_CANNOT_CANCEL | 422 | 订单不能取消 |
| ORDER_SPLIT_FAILED | 422 | 订单拆单失败 |
| ORDER_NO_ITEMS | 422 | 订单无商品 |

### 测量模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| MEASURE_TASK_NOT_FOUND | 404 | 测量任务不存在 |
| MEASURE_TASK_ALREADY_COMPLETED | 409 | 测量任务已完成 |
| MEASURE_TASK_CANNOT_ACCEPT | 422 | 测量任务不能接单 |
| MEASURE_DATA_INVALID | 422 | 测量数据无效 |
| MEASURE_FEE_NOT_PAID | 422 | 测量费用未支付 |

### 安装模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INSTALL_TASK_NOT_FOUND | 404 | 安装任务不存在 |
| INSTALL_TASK_ALREADY_COMPLETED | 409 | 安装任务已完成 |
| INSTALL_TASK_CANNOT_ACCEPT | 422 | 安装任务不能接单 |
| INSTALL_DATA_INVALID | 422 | 安装数据无效 |

### 供应链模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| SUPPLIER_NOT_FOUND | 404 | 供应商不存在 |
| SUPPLIER_ALREADY_EXISTS | 409 | 供应商已存在 |
| PO_NOT_FOUND | 404 | 采购单不存在 |
| PO_INVALID_STATUS | 422 | 采购单状态无效 |
| PO_CANNOT_CONFIRM | 422 | 采购单不能确认 |
| INVENTORY_INSUFFICIENT | 422 | 库存不足 |
| PRODUCT_NOT_FOUND | 404 | 商品不存在 |

### 财务模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| PAYMENT_ORDER_NOT_FOUND | 404 | 收款单不存在 |
| PAYMENT_ORDER_INVALID_STATUS | 422 | 收款单状态无效 |
| PAYMENT_BILL_NOT_FOUND | 404 | 付款单不存在 |
| PAYMENT_BILL_INVALID_STATUS | 422 | 付款单状态无效 |
| ACCOUNT_NOT_FOUND | 404 | 账户不存在 |
| ACCOUNT_INSUFFICIENT_BALANCE | 422 | 账户余额不足 |
| STATEMENT_NOT_FOUND | 404 | 对账单不存在 |
| COMMISSION_CALCULATION_FAILED | 422 | 佣金计算失败 |

### 售后模块

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| AFTER_SALES_NOT_FOUND | 404 | 售后工单不存在 |
| AFTER_SALES_INVALID_STATUS | 422 | 售后工单状态无效 |
| LIABILITY_NOT_FOUND | 404 | 定责单不存在 |
| LIABILITY_INVALID_STATUS | 422 | 定责单状态无效 |

## 错误响应示例

### 认证错误

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未认证，请先登录",
    "details": {
      "hint": "请在请求头中携带有效的 Authorization Token"
    }
  }
}
```

### Token 过期

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token 已过期，请重新登录",
    "details": {
      "expiredAt": "2026-01-15T10:30:00Z"
    }
  }
}
```

### 权限不足

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "权限不足",
    "details": {
      "required_permission": "leads.create",
      "user_roles": ["WORKER"]
    }
  }
}
```

### 参数验证失败

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "fields": [
        {
          "field": "customer_phone",
          "message": "手机号格式不正确",
          "value": "123"
        },
        {
          "field": "community",
          "message": "小区名称不能为空"
        }
      ]
    }
  }
}
```

### 资源不存在

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "资源不存在",
    "details": {
      "resource": "Lead",
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### 资源已存在

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_ALREADY_EXISTS",
    "message": "资源已存在",
    "details": {
      "resource": "Lead",
      "field": "customer_phone",
      "value": "13800138000"
    }
  }
}
```

### 业务规则违反

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "违反业务规则",
    "details": {
      "rule": "订单已锁定，不能修改",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "LOCKED"
    }
  }
}
```

### 状态转换无效

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "状态转换无效",
    "details": {
      "resource": "Order",
      "current_status": "COMPLETED",
      "target_status": "CANCELLED",
      "allowed_transitions": ["PENDING", "IN_PRODUCTION"]
    }
  }
}
```

### 线索重复

```json
{
  "success": false,
  "error": {
    "code": "LEAD_DUPLICATE_PHONE",
    "message": "线索重复",
    "details": {
      "duplicate_reason": "PHONE",
      "existing_lead": {
        "id": "uuid",
        "lead_no": "LD20260115ABC123",
        "customer_phone": "13800138000",
        "status": "FOLLOWING_UP"
      }
    }
  }
}
```

### 库存不足

```json
{
  "success": false,
  "error": {
    "code": "INVENTORY_INSUFFICIENT",
    "message": "库存不足",
    "details": {
      "product_id": "uuid",
      "product_name": "窗帘面料-001",
      "required_quantity": "100.00",
      "available_quantity": "50.00"
    }
  }
}
```

### 请求过于频繁

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 30
    }
  }
}
```

### 服务器内部错误

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "服务器内部错误，请稍后重试",
    "details": {
      "request_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-01-15T10:30:00Z"
    }
  }
}
```

## 错误处理最佳实践

### 客户端处理

1. **检查 success 字段**

```javascript
const response = await fetch('/api/v1/leads', {
  method: 'POST',
  body: JSON.stringify(data)
});

const result = await response.json();

if (!result.success) {
  // 处理错误
  handleError(result.error);
}
```

2. **根据错误码处理**

```javascript
function handleError(error) {
  switch (error.code) {
    case 'UNAUTHORIZED':
      // 跳转到登录页
      redirectToLogin();
      break;
    case 'PERMISSION_DENIED':
      // 显示权限不足提示
      showMessage('权限不足');
      break;
    case 'VALIDATION_ERROR':
      // 显示字段错误
      showValidationErrors(error.details.fields);
      break;
    case 'LEAD_DUPLICATE_PHONE':
      // 显示重复线索
      showDuplicateLead(error.details.existing_lead);
      break;
    default:
      // 显示通用错误
      showMessage(error.message);
  }
}
```

3. **重试机制**

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }

      // 对于限流错误，等待后重试
      if (result.error.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = result.error.details.retryAfter || 5;
        await sleep(retryAfter * 1000);
        continue;
      }

      // 其他错误直接抛出
      throw new Error(result.error.message);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await sleep(1000 * (i + 1)); // 指数退避
    }
  }
}
```

4. **错误日志**

```javascript
function logError(error, context = {}) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    context,
    timestamp: new Date().toISOString()
  });

  // 发送到错误追踪服务
  sendToErrorTracking(error, context);
}
```

### 服务端处理

1. **统一错误处理**

```typescript
export function handleApiError(error: any) {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: {
          fields: error.fields
        }
      }
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: '资源不存在',
        details: {
          resource: error.resource,
          id: error.id
        }
      }
    };
  }

  // 默认错误
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      details: {
        request_id: generateRequestId(),
        timestamp: new Date().toISOString()
      }
    }
  };
}
```

2. **错误日志记录**

```typescript
export function logError(error: any, context: any = {}) {
  logger.error({
    error: {
      code: error.code,
      message: error.message,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  });
}
```

3. **监控告警**

```typescript
export function monitorError(error: any) {
  // 发送到监控系统
  if (error.code === 'INTERNAL_ERROR') {
    alertMonitoringService({
      level: 'critical',
      message: error.message,
      details: error.details
    });
  }

  // 统计错误率
  incrementErrorCounter(error.code);
}
```

## 错误码维护

### 新增错误码

1. 在错误码文档中添加新错误码
2. 更新错误码枚举
3. 添加错误处理逻辑
4. 更新单元测试

### 废弃错误码

1. 在错误码文档中标记为废弃
2. 在响应中添加废弃提示
3. 提供替代错误码
4. 在下个版本中移除

### 错误码版本

错误码版本与 API 版本对应：

- v1.0.0 - 初始错误码
- v1.1.0 - 新增错误码
- v2.0.0 - 废弃旧错误码

## 错误追踪

### 请求 ID

每个请求生成唯一 ID 用于追踪：

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 错误追踪

在错误响应中返回请求 ID：

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "服务器内部错误",
    "details": {
      "request_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### 日志查询

使用请求 ID 查询详细日志：

```
GET /api/admin/logs/{request_id}
```

## 错误通知

### 关键错误通知

对于关键错误发送通知：

- 服务器内部错误
- 数据库错误
- 支付失败
- 库存不足

### 通知渠道

- 邮件
- 短信
- 即时通讯工具
- 监控系统

## 错误恢复

### 自动恢复

部分错误可以自动恢复：

- 网络错误：自动重试
- 超时错误：增加超时时间重试
- 限流错误：等待后重试

### 手动恢复

部分错误需要手动处理：

- 权限不足：联系管理员
- 资源不存在：检查资源 ID
- 业务规则违反：修改业务数据

## 错误统计

### 错误率监控

监控各错误码的发生频率：

```javascript
{
  "UNAUTHORIZED": 100,
  "PERMISSION_DENIED": 50,
  "VALIDATION_ERROR": 200,
  "RESOURCE_NOT_FOUND": 30,
  "INTERNAL_ERROR": 5
}
```

### 错误趋势

分析错误趋势：

```javascript
{
  "date": "2026-01-15",
  "total_errors": 385,
  "error_rate": "0.38%",
  "top_errors": [
    { "code": "VALIDATION_ERROR", "count": 200 },
    { "code": "UNAUTHORIZED", "count": 100 }
  ]
}
```

## 错误文档

### 错误码文档

维护完整的错误码文档，包括：

- 错误码
- HTTP 状态码
- 错误描述
- 可能原因
- 解决方案
- 示例

### 错误码查询

提供错误码查询接口：

```
GET /api/v1/error-codes/{code}
```

响应：

```json
{
  "success": true,
  "data": {
    "code": "LEAD_DUPLICATE_PHONE",
    "http_status": 409,
    "message": "线索重复",
    "description": "创建线索时，手机号已存在",
    "possible_causes": [
      "该手机号已创建过线索",
      "该手机号已注册为客户"
    ],
    "solutions": [
      "查询现有线索",
      "联系客户确认",
      "使用现有线索"
    ],
    "example": {
      "request": { ... },
      "response": { ... }
    }
  }
}
```
