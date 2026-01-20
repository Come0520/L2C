# 通用规范

> L2C 系统 API 请求/响应格式、分页、排序、过滤等通用规范

## 请求格式

### 请求头

所有 API 请求需要包含以下请求头：

```
Content-Type: application/json
Authorization: Bearer {token}
Tenant-ID: {tenant_id}
```

### 请求体

POST、PUT、PATCH 请求使用 JSON 格式：

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### 文件上传

文件上传使用 multipart/form-data：

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="leads.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[文件内容]
------WebKitFormBoundary--
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "张三"
  }
}
```

### 列表响应

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "uuid1", "name": "张三" },
      { "id": "uuid2", "name": "李四" }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 错误响应

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
          "message": "手机号格式不正确"
        }
      ]
    }
  }
}
```

### 批量操作响应

```json
{
  "success": true,
  "data": {
    "success_count": 8,
    "failed_count": 2,
    "results": [
      { "id": "uuid1", "success": true },
      { "id": "uuid2", "success": false, "error": "数据不存在" }
    ]
  }
}
```

## 分页

### 分页参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码，从 1 开始 |
| pageSize | integer | 否 | 20 | 每页数量，最大 100 |

### 请求示例

```
GET /api/v1/leads?page=2&pageSize=50
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "pageSize": 50,
      "total": 150,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

### 分页字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| page | integer | 当前页码 |
| pageSize | integer | 每页数量 |
| total | integer | 总记录数 |
| totalPages | integer | 总页数 |
| hasNext | boolean | 是否有下一页 |
| hasPrev | boolean | 是否有上一页 |

## 排序

### 排序参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| sortBy | string | 否 | created_at | 排序字段 |
| sortOrder | string | 否 | desc | 排序方向：asc 或 desc |

### 请求示例

```
GET /api/v1/leads?sortBy=created_at&sortOrder=desc
```

### 支持的排序字段

不同模块支持不同的排序字段，常见字段：

- created_at - 创建时间
- updated_at - 更新时间
- name - 名称
- amount - 金额
- status - 状态

### 多字段排序

部分接口支持多字段排序：

```
GET /api/v1/leads?sortBy=status,created_at&sortOrder=asc,desc
```

## 过滤

### 基础过滤

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 状态过滤 |
| keyword | string | 关键词搜索 |
| startDate | string | 开始日期（ISO 8601） |
| endDate | string | 结束日期（ISO 8601） |

### 请求示例

```
GET /api/v1/leads?status=FOLLOWING_UP&startDate=2026-01-01&endDate=2026-01-31
```

### 高级过滤

部分接口支持高级过滤：

```
GET /api/v1/leads?filter={"status":"FOLLOWING_UP","intention_level":["HIGH","MEDIUM"]}
```

### 字段过滤

部分接口支持指定返回字段：

```
GET /api/v1/leads?fields=id,name,phone,status
```

### 关联过滤

支持按关联对象过滤：

```
GET /api/v1/leads?assigned_sales_id={user_id}
GET /api/v1/orders?customer_id={customer_id}
```

## 搜索

### 全文搜索

```
GET /api/v1/leads?search=张三
```

### 搜索字段

部分接口支持指定搜索字段：

```
GET /api/v1/leads?search=张三&searchFields=name,phone,community
```

### 搜索模式

| 模式 | 说明 | 示例 |
|------|------|------|
| exact | 精确匹配 | search=张三&searchMode=exact |
| contains | 包含匹配（默认） | search=张三&searchMode=contains |
| startsWith | 前缀匹配 | search=张&searchMode=startsWith |

## 聚合

### 统计接口

```
GET /api/v1/leads/statistics
```

响应：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "PENDING_ASSIGNMENT": 10,
      "FOLLOWING_UP": 50,
      "WON": 30,
      "INVALID": 10
    },
    "byIntentionLevel": {
      "HIGH": 30,
      "MEDIUM": 50,
      "LOW": 20
    }
  }
}
```

### 分组统计

```
GET /api/v1/leads/groupBy=status
```

响应：

```json
{
  "success": true,
  "data": [
    {
      "group": "PENDING_ASSIGNMENT",
      "count": 10,
      "amount": "100000.00"
    },
    {
      "group": "FOLLOWING_UP",
      "count": 50,
      "amount": "500000.00"
    }
  ]
}
```

## 批量操作

### 批量创建

```
POST /api/v1/leads/batch
Content-Type: application/json

{
  "items": [
    { "customer_phone": "13800138000", "customer_name": "张三" },
    { "customer_phone": "13800138001", "customer_name": "李四" }
  ]
}
```

### 批量更新

```
PATCH /api/v1/leads/batch
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2"],
  "updates": {
    "status": "FOLLOWING_UP"
  }
}
```

### 批量删除

```
DELETE /api/v1/leads/batch
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2"]
}
```

## 导入导出

### 数据导出

```
GET /api/v1/leads/export?format=excel
```

支持的格式：
- excel - Excel 文件
- csv - CSV 文件
- pdf - PDF 文件

### 数据导入

```
POST /api/v1/leads/import
Content-Type: multipart/form-data

file: leads.xlsx
```

响应：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "error": "手机号格式不正确"
      }
    ]
  }
}
```

## 版本控制

### API 版本

API 路径包含版本号：

```
/api/v1/leads
/api/v2/leads
```

### 版本协商

客户端可以通过请求头指定版本：

```
Accept: application/vnd.l2c.v1+json
```

### 版本弃用

弃用的 API 会在响应头中提示：

```
X-API-Deprecated: true
X-API-Deprecation-Date: 2026-06-01
X-API-Sunset: 2026-12-31
Link: </api/v2/leads>; rel="successor-version"
```

## 限流

### 限流规则

| 类型 | 限制 |
|------|------|
| 每个租户 | 1000 请求/分钟 |
| 每个用户 | 100 请求/分钟 |
| 单个 IP | 200 请求/分钟 |

### 限流响应头

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### 超限响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## 缓存

### 缓存控制

服务端返回缓存控制头：

```
Cache-Control: max-age=3600, private
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### 条件请求

客户端可以使用 ETag 进行条件请求：

```
GET /api/v1/leads/{id}
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

响应：

- 304 Not Modified - 数据未修改
- 200 OK - 返回最新数据

## 压缩

支持响应压缩：

```
Accept-Encoding: gzip, deflate, br
```

响应：

```
Content-Encoding: gzip
```

## 时间戳

### 请求时间戳

部分接口需要请求时间戳：

```
GET /api/v1/leads?timestamp=1642234567890
```

### 响应时间戳

所有响应包含时间戳：

```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1642234567890
}
```

## 请求 ID

### 客户端生成请求 ID

客户端可以生成请求 ID 用于追踪：

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 服务端返回请求 ID

服务端在响应中返回请求 ID：

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

## 幂等性

### 幂等键

部分接口支持幂等性保证：

```
POST /api/v1/leads
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

### 幂等响应

相同幂等键的重复请求返回相同响应：

```json
{
  "success": true,
  "data": { ... },
  "idempotent": true
}
```

## 字段命名

### 驼峰命名

JSON 字段使用驼峰命名：

```json
{
  "customerName": "张三",
  "customerPhone": "13800138000",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### 数据库字段映射

数据库字段使用下划线命名，自动转换为驼峰：

```json
{
  "customer_name": "张三"  // 数据库
}
// 转换为
{
  "customerName": "张三"  // API
}
```

## 数据类型

### 字符串

```json
{
  "name": "张三",
  "phone": "13800138000"
}
```

### 数字

```json
{
  "quantity": 10,
  "width": 100.5
}
```

### 布尔值

```json
{
  "isActive": true,
  "isLocked": false
}
```

### 日期时间

```json
{
  "createdAt": "2026-01-15T10:30:00Z",
  "scheduledAt": "2026-02-01T14:00:00+08:00"
}
```

### 金额

金额使用字符串类型：

```json
{
  "totalAmount": "12345.67",
  "unitPrice": "99.99"
}
```

### 数组

```json
{
  "tags": ["VIP", "老客户"],
  "items": [
    { "id": "1", "name": "商品1" },
    { "id": "2", "name": "商品2" }
  ]
}
```

### 对象

```json
{
  "customer": {
    "id": "uuid",
    "name": "张三",
    "phone": "13800138000"
  }
}
```

### 空值

```json
{
  "completedAt": null,
  "deletedAt": null
}
```

## 可选字段

### null 表示未设置

```json
{
  "completedAt": null
}
```

### 省略表示不返回

```json
{
  "id": "uuid",
  "name": "张三"
  // completedAt 未返回
}
```

## 默认值

部分字段有默认值：

```json
{
  "status": "PENDING_ASSIGNMENT",  // 默认值
  "isActive": true,                // 默认值
  "createdAt": "2026-01-15T10:30:00Z"  // 自动生成
}
```

## 只读字段

部分字段为只读，创建或更新时忽略：

```json
{
  "id": "uuid",              // 只读
  "createdAt": "...",        // 只读
  "updatedAt": "...",        // 只读
  "createdBy": "uuid"        // 只读
}
```

## 验证规则

### 必填字段

```json
{
  "customer_phone": "13800138000"  // 必填
}
```

### 字段格式

```json
{
  "customer_phone": "13800138000",  // 手机号格式
  "email": "user@example.com",      // 邮箱格式
  "amount": "12345.67"             // 金额格式
}
```

### 字段长度

```json
{
  "name": "张三",           // 最大 50 字符
  "phone": "13800138000",   // 最大 20 字符
  "notes": "备注信息"        // 最大 1000 字符
}
```

### 字段范围

```json
{
  "quantity": 10,           // 最小 1，最大 1000
  "discountRate": "0.9500"  // 0.0000 - 1.0000
}
```

## 错误处理

详见 [错误处理](./error-handling.md) 文档。

## 最佳实践

1. **使用 HTTPS**
   - 所有 API 请求使用 HTTPS 协议
   - 验证 SSL 证书

2. **处理错误**
   - 检查响应的 success 字段
   - 根据错误码处理不同错误
   - 显示友好的错误提示

3. **限流处理**
   - 监控限流响应头
   - 超限时等待重试
   - 实现指数退避

4. **缓存使用**
   - 使用 ETag 减少数据传输
   - 合理设置缓存时间
   - 及时更新过期数据

5. **批量操作**
   - 使用批量接口提高效率
   - 控制批量操作数量
   - 处理部分失败情况

6. **幂等性**
   - 对关键操作使用幂等键
   - 避免重复提交
   - 处理并发冲突
