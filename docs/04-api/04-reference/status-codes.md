# 状态码

> L2C 系统 HTTP 状态码和业务错误码定义

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
| 403 Forbidden | 无权限 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突 |
| 422 Unprocessable Entity | 请求无法处理 |
| 429 Too Many Requests | 请求过于频繁 |

### 5xx 服务器错误

| 状态码 | 说明 |
|--------|------|
| 500 Internal Server Error | 服务器内部错误 |
| 503 Service Unavailable | 服务不可用 |

## 业务错误码

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| SUCCESS | 200 | 成功 |
| UNKNOWN_ERROR | 500 | 未知错误 |
| INTERNAL_ERROR | 500 | 内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |
| INVALID_REQUEST | 400 | 请求无效 |
| INVALID_PARAMETER | 400 | 参数无效 |
| MISSING_PARAMETER | 400 | 缺少参数 |
| INVALID_FORMAT | 400 | 格式无效 |
| INVALID_JSON | 400 | JSON 格式无效 |
| INVALID_DATE | 400 | 日期格式无效 |
| INVALID_EMAIL | 400 | 邮箱格式无效 |
| INVALID_PHONE | 400 | 手机号格式无效 |
| INVALID_UUID | 400 | UUID 格式无效 |
| INVALID_URL | 400 | URL 格式无效 |
| INVALID_ENUM | 400 | 枚举值无效 |
| INVALID_RANGE | 400 | 数值超出范围 |
| INVALID_LENGTH | 400 | 长度超出范围 |
| DUPLICATE_VALUE | 409 | 值重复 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| RESOURCE_ALREADY_EXISTS | 409 | 资源已存在 |
| RESOURCE_LOCKED | 422 | 资源已锁定 |
| RESOURCE_EXPIRED | 422 | 资源已过期 |
| OPERATION_NOT_ALLOWED | 422 | 操作不允许 |
| OPERATION_FAILED | 500 | 操作失败 |

### 认证错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| UNAUTHORIZED | 401 | 未认证 |
| TOKEN_EXPIRED | 401 | Token 已过期 |
| TOKEN_INVALID | 401 | Token 无效 |
| TOKEN_MISSING | 401 | Token 缺失 |
| TOKEN_REVOKED | 401 | Token 已撤销 |
| LOGIN_FAILED | 401 | 登录失败 |
| ACCOUNT_DISABLED | 403 | 账户已禁用 |
| ACCOUNT_LOCKED | 403 | 账户已锁定 |
| ACCOUNT_NOT_FOUND | 404 | 账户不存在 |
| PASSWORD_INCORRECT | 401 | 密码错误 |
| PASSWORD_TOO_WEAK | 400 | 密码过于简单 |
| PASSWORD_SAME_AS_OLD | 400 | 新密码与旧密码相同 |
| VERIFICATION_CODE_INCORRECT | 400 | 验证码错误 |
| VERIFICATION_CODE_EXPIRED | 400 | 验证码已过期 |
| SEND_TOO_FREQUENTLY | 429 | 发送过于频繁 |
| INVALID_ROLE | 403 | 角色无效 |
| INSUFFICIENT_PERMISSIONS | 403 | 权限不足 |

### 客户错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| CUSTOMER_NOT_FOUND | 404 | 客户不存在 |
| CUSTOMER_ALREADY_EXISTS | 409 | 客户已存在 |
| CUSTOMER_DUPLICATE | 409 | 客户重复 |
| CUSTOMER_CANNOT_DELETE | 422 | 客户不能删除 |
| CUSTOMER_CANNOT_MERGE | 422 | 客户不能合并 |
| CUSTOMER_ALREADY_MERGED | 409 | 客户已合并 |
| CUSTOMER_INVALID_LEVEL | 400 | 客户等级无效 |
| CUSTOMER_INVALID_STAGE | 400 | 客户阶段无效 |
| CUSTOMER_INVALID_TYPE | 400 | 客户类型无效 |
| CUSTOMER_ADDRESS_NOT_FOUND | 404 | 客户地址不存在 |
| CUSTOMER_ADDRESS_INVALID | 400 | 客户地址无效 |

### 线索错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| LEAD_NOT_FOUND | 404 | 线索不存在 |
| LEAD_ALREADY_EXISTS | 409 | 线索已存在 |
| LEAD_DUPLICATE | 409 | 线索重复 |
| LEAD_CANNOT_DELETE | 422 | 线索不能删除 |
| LEAD_CANNOT_ASSIGN | 422 | 线索不能分配 |
| LEAD_CANNOT_CONVERT | 422 | 线索不能转化 |
| LEAD_CANNOT_LOSE | 422 | 线索不能流失 |
| LEAD_CANNOT_VOID | 422 | 线索不能作废 |
| LEAD_INVALID_STATUS | 400 | 线索状态无效 |
| LEAD_INVALID_INTENTION | 400 | 意向等级无效 |
| LEAD_INVALID_DECORATION_PROGRESS | 400 | 装修进度无效 |
| LEAD_ACTIVITY_NOT_FOUND | 404 | 跟进记录不存在 |
| LEAD_ACTIVITY_INVALID_TYPE | 400 | 跟进类型无效 |
| LEAD_STATUS_TRANSITION_INVALID | 422 | 线索状态转换无效 |
| LEAD_NO_ASSIGNED_SALES | 422 | 未分配销售人员 |

### 报价单错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| QUOTE_NOT_FOUND | 404 | 报价单不存在 |
| QUOTE_ALREADY_EXISTS | 409 | 报价单已存在 |
| QUOTE_CANNOT_DELETE | 422 | 报价单不能删除 |
| QUOTE_CANNOT_SUBMIT | 422 | 报价单不能提交 |
| QUOTE_CANNOT_ACCEPT | 422 | 报价单不能接受 |
| QUOTE_CANNOT_REJECT | 422 | 报价单不能拒绝 |
| QUOTE_CANNOT_CREATE_VERSION | 422 | 报价单不能创建版本 |
| QUOTE_INVALID_STATUS | 400 | 报价单状态无效 |
| QUOTE_INVALID_VERSION | 400 | 报价单版本无效 |
| QUOTE_EXPIRED | 422 | 报价单已过期 |
| QUOTE_LOCKED | 422 | 报价单已锁定 |
| QUOTE_ROOM_NOT_FOUND | 404 | 报价单房间不存在 |
| QUOTE_ITEM_NOT_FOUND | 404 | 报价单项不存在 |
| QUOTE_ITEM_INVALID | 400 | 报价单项无效 |
| QUOTE_AMOUNT_INVALID | 400 | 报价金额无效 |
| QUOTE_DISCOUNT_INVALID | 400 | 折扣无效 |

### 订单错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| ORDER_ALREADY_EXISTS | 409 | 订单已存在 |
| ORDER_CANNOT_DELETE | 422 | 订单不能删除 |
| ORDER_CANNOT_CANCEL | 422 | 订单不能取消 |
| ORDER_CANNOT_PAY | 422 | 订单不能支付 |
| ORDER_CANNOT_SPLIT | 422 | 订单不能拆单 |
| ORDER_CANNOT_MERGE | 422 | 订单不能合并 |
| ORDER_INVALID_STATUS | 400 | 订单状态无效 |
| ORDER_INVALID_SETTLEMENT_TYPE | 400 | 结算类型无效 |
| ORDER_LOCKED | 422 | 订单已锁定 |
| ORDER_ITEM_NOT_FOUND | 404 | 订单项不存在 |
| ORDER_ITEM_INVALID | 400 | 订单项无效 |
| ORDER_AMOUNT_INVALID | 400 | 订单金额无效 |
| ORDER_PAYMENT_INVALID | 400 | 支付无效 |
| ORDER_PAYMENT_INSUFFICIENT | 422 | 支付金额不足 |
| ORDER_PAYMENT_AMOUNT_INVALID | 400 | 支付金额无效 |
| ORDER_PAYMENT_METHOD_INVALID | 400 | 支付方式无效 |
| ORDER_PAYMENT_PROOF_MISSING | 400 | 缺少支付凭证 |
| ORDER_CONFIRMATION_MISSING | 400 | 缺少确认凭证 |

### 测量任务错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| MEASURE_TASK_NOT_FOUND | 404 | 测量任务不存在 |
| MEASURE_TASK_ALREADY_EXISTS | 409 | 测量任务已存在 |
| MEASURE_TASK_CANNOT_CREATE | 422 | 测量任务不能创建 |
| MEASURE_TASK_CANNOT_DELETE | 422 | 测量任务不能删除 |
| MEASURE_TASK_CANNOT_CANCEL | 422 | 测量任务不能取消 |
| MEASURE_TASK_CANNOT_ASSIGN | 422 | 测量任务不能分配 |
| MEASURE_TASK_CANNOT_ACCEPT | 422 | 测量任务不能接单 |
| MEASURE_TASK_CANNOT_SUBMIT | 422 | 测量任务不能提交 |
| MEASURE_TASK_CANNOT_COMPLETE | 422 | 测量任务不能完成 |
| MEASURE_TASK_INVALID_STATUS | 400 | 测量任务状态无效 |
| MEASURE_TASK_INVALID_TYPE | 400 | 测量任务类型无效 |
| MEASURE_TASK_INVALID_ROUND | 400 | 测量任务轮次无效 |
| MEASURE_TASK_NOT_ASSIGNED | 422 | 测量任务未分配 |
| MEASURE_TASK_ALREADY_COMPLETED | 409 | 测量任务已完成 |
| MEASURE_TASK_ALREADY_CANCELLED | 409 | 测量任务已取消 |
| MEASURE_SHEET_NOT_FOUND | 404 | 测量数据不存在 |
| MEASURE_SHEET_INVALID | 400 | 测量数据无效 |
| MEASURE_SHEET_INVALID_STATUS | 400 | 测量数据状态无效 |
| MEASURE_ITEM_NOT_FOUND | 404 | 测量项不存在 |
| MEASURE_ITEM_INVALID | 400 | 测量项无效 |
| MEASURE_ITEM_INVALID_WINDOW_TYPE | 400 | 窗户类型无效 |
| MEASURE_ITEM_INVALID_INSTALL_TYPE | 400 | 安装类型无效 |
| MEASURE_ITEM_INVALID_WALL_MATERIAL | 400 | 墙面材质无效 |
| CHECK_IN_LOCATION_INVALID | 422 | 打卡位置无效 |
| CHECK_IN_TIME_INVALID | 422 | 打卡时间无效 |
| MEASURE_DATA_INVALID | 422 | 测量数据无效 |

### 安装任务错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| INSTALL_TASK_NOT_FOUND | 404 | 安装任务不存在 |
| INSTALL_TASK_ALREADY_EXISTS | 409 | 安装任务已存在 |
| INSTALL_TASK_CANNOT_CREATE | 422 | 安装任务不能创建 |
| INSTALL_TASK_CANNOT_DELETE | 422 | 安装任务不能删除 |
| INSTALL_TASK_CANNOT_CANCEL | 422 | 安装任务不能取消 |
| INSTALL_TASK_CANNOT_ASSIGN | 422 | 安装任务不能分配 |
| INSTALL_TASK_CANNOT_ACCEPT | 422 | 安装任务不能接单 |
| INSTALL_TASK_CANNOT_SUBMIT | 422 | 安装任务不能提交 |
| INSTALL_TASK_CANNOT_COMPLETE | 422 | 安装任务不能完成 |
| INSTALL_TASK_INVALID_STATUS | 400 | 安装任务状态无效 |
| INSTALL_TASK_NOT_ASSIGNED | 422 | 安装任务未分配 |
| INSTALL_TASK_ALREADY_COMPLETED | 409 | 安装任务已完成 |
| INSTALL_TASK_ALREADY_CANCELLED | 409 | 安装任务已取消 |
| INSTALL_DATA_INVALID | 422 | 安装数据无效 |

### 供应链错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| SUPPLIER_NOT_FOUND | 404 | 供应商不存在 |
| SUPPLIER_ALREADY_EXISTS | 409 | 供应商已存在 |
| SUPPLIER_CANNOT_DELETE | 422 | 供应商不能删除 |
| SUPPLIER_INVALID_TYPE | 400 | 供应商类型无效 |
| SUPPLIER_INVALID_PAYMENT_PERIOD | 400 | 结算周期无效 |
| PURCHASE_ORDER_NOT_FOUND | 404 | 采购单不存在 |
| PURCHASE_ORDER_ALREADY_EXISTS | 409 | 采购单已存在 |
| PURCHASE_ORDER_CANNOT_CREATE | 422 | 采购单不能创建 |
| PURCHASE_ORDER_CANNOT_DELETE | 422 | 采购单不能删除 |
| PURCHASE_ORDER_CANNOT_CONFIRM | 422 | 采购单不能确认 |
| PURCHASE_ORDER_CANNOT_SHIP | 422 | 采购单不能发货 |
| PURCHASE_ORDER_INVALID_STATUS | 400 | 采购单状态无效 |
| PURCHASE_ORDER_INVALID_TYPE | 400 | 采购单类型无效 |
| PURCHASE_ORDER_ITEM_NOT_FOUND | 404 | 采购单项不存在 |
| PURCHASE_ORDER_ITEM_INVALID | 400 | 采购单项无效 |
| WORK_ORDER_NOT_FOUND | 404 | 加工单不存在 |
| WORK_ORDER_ALREADY_EXISTS | 409 | 加工单已存在 |
| WORK_ORDER_CANNOT_CREATE | 422 | 加工单不能创建 |
| WORK_ORDER_CANNOT_DELETE | 422 | 加工单不能删除 |
| WORK_ORDER_CANNOT_START | 422 | 加工单不能开始 |
| WORK_ORDER_CANNOT_COMPLETE | 422 | 加工单不能完成 |
| WORK_ORDER_INVALID_STATUS | 400 | 加工单状态无效 |
| WORK_ORDER_ITEM_NOT_FOUND | 404 | 加工单项不存在 |
| WORK_ORDER_ITEM_INVALID | 400 | 加工单项无效 |

### 财务错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| ACCOUNT_NOT_FOUND | 404 | 账户不存在 |
| ACCOUNT_ALREADY_EXISTS | 409 | 账户已存在 |
| ACCOUNT_CANNOT_DELETE | 422 | 账户不能删除 |
| ACCOUNT_INVALID_TYPE | 400 | 账户类型无效 |
| ACCOUNT_INSUFFICIENT_BALANCE | 422 | 账户余额不足 |
| PAYMENT_ORDER_NOT_FOUND | 404 | 收款单不存在 |
| PAYMENT_ORDER_ALREADY_EXISTS | 409 | 收款单已存在 |
| PAYMENT_ORDER_CANNOT_CREATE | 422 | 收款单不能创建 |
| PAYMENT_ORDER_CANNOT_DELETE | 422 | 收款单不能删除 |
| PAYMENT_ORDER_CANNOT_VERIFY | 422 | 收款单不能审核 |
| PAYMENT_ORDER_CANNOT_USE | 422 | 收款单不能使用 |
| PAYMENT_ORDER_INVALID_STATUS | 400 | 收款单状态无效 |
| PAYMENT_ORDER_INVALID_TYPE | 400 | 收款单类型无效 |
| PAYMENT_ORDER_AMOUNT_INVALID | 400 | 收款单金额无效 |
| PAYMENT_ORDER_PROOF_MISSING | 400 | 缺少收款凭证 |
| PAYMENT_BILL_NOT_FOUND | 404 | 付款单不存在 |
| PAYMENT_BILL_ALREADY_EXISTS | 409 | 付款单已存在 |
| PAYMENT_BILL_CANNOT_CREATE | 422 | 付款单不能创建 |
| PAYMENT_BILL_CANNOT_DELETE | 422 | 付款单不能删除 |
| PAYMENT_BILL_CANNOT_VERIFY | 422 | 付款单不能审核 |
| PAYMENT_BILL_CANNOT_PAY | 422 | 付款单不能支付 |
| PAYMENT_BILL_INVALID_STATUS | 400 | 付款单状态无效 |
| PAYMENT_BILL_INVALID_TYPE | 400 | 付款单类型无效 |
| PAYMENT_BILL_AMOUNT_INVALID | 400 | 付款单金额无效 |
| PAYMENT_BILL_PROOF_MISSING | 400 | 缺少付款凭证 |
| STATEMENT_NOT_FOUND | 404 | 对账单不存在 |
| STATEMENT_ALREADY_EXISTS | 409 | 对账单已存在 |
| STATEMENT_CANNOT_CREATE | 422 | 对账单不能创建 |
| STATEMENT_CANNOT_DELETE | 422 | 对账单不能删除 |
| STATEMENT_CANNOT_RECONCILE | 422 | 对账单不能对账 |
| STATEMENT_CANNOT_INVOICE | 422 | 对账单不能开票 |
| STATEMENT_INVALID_STATUS | 400 | 对账单状态无效 |
| STATEMENT_INVALID_SETTLEMENT_TYPE | 400 | 结算类型无效 |

### 商品错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| PRODUCT_NOT_FOUND | 404 | 商品不存在 |
| PRODUCT_ALREADY_EXISTS | 409 | 商品已存在 |
| PRODUCT_CANNOT_DELETE | 422 | 商品不能删除 |
| PRODUCT_INVALID_CATEGORY | 400 | 商品分类无效 |
| PRODUCT_INVALID_PRICE | 400 | 商品价格无效 |
| PRODUCT_INVALID_UNIT | 400 | 商品单位无效 |
| PRODUCT_SKU_DUPLICATE | 409 | 商品 SKU 重复 |

### 渠道错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| CHANNEL_NOT_FOUND | 404 | 渠道不存在 |
| CHANNEL_ALREADY_EXISTS | 409 | 渠道已存在 |
| CHANNEL_CANNOT_DELETE | 422 | 渠道不能删除 |
| CHANNEL_INVALID_TYPE | 400 | 渠道类型无效 |
| CHANNEL_INVALID_LEVEL | 400 | 渠道等级无效 |
| CHANNEL_INVALID_COMMISSION_TYPE | 400 | 佣金类型无效 |
| CHANNEL_INVALID_COOPERATION_MODE | 400 | 合作模式无效 |
| CHANNEL_INVALID_SETTLEMENT_TYPE | 400 | 结算类型无效 |
| CHANNEL_CONTACT_NOT_FOUND | 404 | 渠道联系人不存在 |
| CHANNEL_CONTACT_INVALID | 400 | 渠道联系人无效 |

### 售后错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| AFTER_SALES_NOT_FOUND | 404 | 售后工单不存在 |
| AFTER_SALES_ALREADY_EXISTS | 409 | 售后工单已存在 |
| AFTER_SALES_CANNOT_CREATE | 422 | 售后工单不能创建 |
| AFTER_SALES_CANNOT_DELETE | 422 | 售后工单不能删除 |
| AFTER_SALES_CANNOT_ASSIGN | 422 | 售后工单不能分配 |
| AFTER_SALES_CANNOT_CLOSE | 422 | 售后工单不能关闭 |
| AFTER_SALES_INVALID_STATUS | 400 | 售后工单状态无效 |
| AFTER_SALES_INVALID_TYPE | 400 | 售后工单类型无效 |
| LIABILITY_NOTICE_NOT_FOUND | 404 | 定责单不存在 |
| LIABILITY_NOTICE_ALREADY_EXISTS | 409 | 定责单已存在 |
| LIABILITY_NOTICE_CANNOT_CREATE | 422 | 定责单不能创建 |
| LIABILITY_NOTICE_CANNOT_DELETE | 422 | 定责单不能删除 |
| LIABILITY_NOTICE_CANNOT_CONFIRM | 422 | 定责单不能确认 |
| LIABILITY_NOTICE_INVALID_STATUS | 400 | 定责单状态无效 |
| LIABILITY_NOTICE_INVALID_PARTY_TYPE | 400 | 责任方类型无效 |
| LIABILITY_NOTICE_INVALID_REASON_CATEGORY | 400 | 原因分类无效 |

### 审批错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| APPROVAL_NOT_FOUND | 404 | 审批不存在 |
| APPROVAL_ALREADY_EXISTS | 409 | 审批已存在 |
| APPROVAL_CANNOT_CREATE | 422 | 审批不能创建 |
| APPROVAL_CANNOT_DELETE | 422 | 审批不能删除 |
| APPROVAL_CANNOT_APPROVE | 422 | 审批不能通过 |
| APPROVAL_CANNOT_REJECT | 422 | 审批不能驳回 |
| APPROVAL_INVALID_STATUS | 400 | 审批状态无效 |
| APPROVAL_INVALID_TYPE | 400 | 审批类型无效 |
| APPROVAL_FLOW_NOT_FOUND | 404 | 审批流程不存在 |
| APPROVAL_FLOW_INVALID | 400 | 审批流程无效 |

### 文件错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| FILE_NOT_FOUND | 404 | 文件不存在 |
| FILE_UPLOAD_FAILED | 500 | 文件上传失败 |
| FILE_DELETE_FAILED | 500 | 文件删除失败 |
| FILE_TOO_LARGE | 413 | 文件过大 |
| FILE_TYPE_INVALID | 400 | 文件类型无效 |
| FILE_SIZE_INVALID | 400 | 文件大小无效 |
| FILE_NAME_INVALID | 400 | 文件名无效 |

### 限流错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| API_RATE_LIMIT_EXCEEDED | 429 | API 请求频率超限 |
| SMS_RATE_LIMIT_EXCEEDED | 429 | 短信发送频率超限 |
| EMAIL_RATE_LIMIT_EXCEEDED | 429 | 邮件发送频率超限 |

## 错误响应格式

### 标准错误响应

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "资源不存在",
    "details": {
      "resource": "customer",
      "id": "uuid"
    },
    "request_id": "req_uuid",
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

### 验证错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "fields": [
        {
          "field": "phone",
          "message": "手机号格式无效"
        },
        {
          "field": "email",
          "message": "邮箱格式无效"
        }
      ]
    },
    "request_id": "req_uuid",
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

### 权限错误响应

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "权限不足",
    "details": {
      "required_permission": "orders.create",
      "user_permissions": ["orders.read"]
    },
    "request_id": "req_uuid",
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

## 错误处理最佳实践

### 客户端错误处理

1. **检查 HTTP 状态码**：首先检查 HTTP 状态码，确定错误类型
2. **解析错误码**：解析业务错误码，确定具体错误原因
3. **显示错误信息**：根据错误码和错误信息，向用户显示友好的错误提示
4. **记录错误日志**：记录错误日志，便于排查问题

### 错误重试策略

1. **5xx 错误**：可以重试，建议使用指数退避策略
2. **429 错误**：等待 Retry-After 头指定的时间后重试
3. **4xx 错误**：一般不建议重试，需要修正请求后重新提交

### 错误监控

1. **错误统计**：统计错误码出现频率
2. **错误告警**：对严重错误进行告警
3. **错误分析**：分析错误原因，优化系统

### 错误码扩展

1. **新增错误码**：新增错误码时，确保错误码唯一
2. **错误码分类**：按模块分类错误码，便于管理
3. **错误码文档**：及时更新错误码文档
