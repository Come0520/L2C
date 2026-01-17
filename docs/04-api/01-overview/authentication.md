# 认证机制

> L2C 系统 API 认证和权限管理

## 认证方式

### Bearer Token 认证

所有 API 请求需要在请求头中携带认证令牌：

```
Authorization: Bearer {token}
Tenant-ID: {tenant_id}
```

### Token 获取

#### Web 端登录

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000",
      "email": "user@example.com",
      "avatar": "https://...",
      "tenant_id": "tenant_uuid",
      "roles": ["SALES", "MANAGER"]
    }
  }
}
```

#### 移动端登录

```
POST /api/mobile/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "password"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "token": "mk_user_uuid_1234567890",
    "user": {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000",
      "avatar": "https://...",
      "tenantId": "tenant_uuid"
    }
  }
}
```

### Token 刷新

Token 有效期默认为 24 小时，过期后需要刷新：

```
POST /api/auth/refresh
Authorization: Bearer {old_token}
```

响应：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 登出

```
POST /api/auth/logout
Authorization: Bearer {token}
```

响应：

```json
{
  "success": true,
  "message": "登出成功"
}
```

## 权限模型

### 角色定义

系统预定义以下角色：

| 角色 | 代码 | 说明 |
|------|------|------|
| 管理员 | ADMIN | 系统管理员，拥有所有权限 |
| 销售人员 | SALES | 销售人员，管理线索、客户、报价单 |
| 经理 | MANAGER | 部门经理，审批、查看报表 |
| 工人 | WORKER | 测量师、安装师，处理任务 |
| 财务 | FINANCE | 财务人员，处理收款、付款、对账 |
| 供应链 | SUPPLY | 采购员，管理供应商、采购单 |

### 权限矩阵

#### 线索模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看线索 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 创建线索 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑线索 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 删除线索 | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| 分配线索 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 申请免费测量 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 预约测量 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

#### 客户模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看客户 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| 创建客户 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑客户 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 合并客户 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 查看客户统计 | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |

#### 报价单模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看报价单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 创建报价单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑报价单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 锁定报价单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 转订单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

#### 订单模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看订单 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 创建订单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑订单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 锁定订单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 拆单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| 确认拆单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| 申请发货 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |

#### 测量模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看测量任务 | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| 派单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 接单 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| 提交测量数据 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| 确认测量数据 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 拒绝测量数据 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

#### 安装模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看安装任务 | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| 派单 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 接单 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| 提交安装数据 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| 验收 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

#### 供应链模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看供应商 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| 管理供应商 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 创建采购单 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 确认采购单 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 面料入库 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 管理库存 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |

#### 财务模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看收款单 | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| 创建收款单 | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| 审核收款单 | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| 查看付款单 | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| 创建付款单 | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| 审核付款单 | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| 对账 | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| 佣金计算 | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |

#### 商品模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看商品 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 管理商品 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 管理价格 | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |

#### 渠道模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看渠道 | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| 管理渠道 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| 管理渠道佣金 | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |

#### 售后模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看售后工单 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 创建售后工单 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 处理售后工单 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 定责 | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

#### 审批模块

| 操作 | ADMIN | SALES | MANAGER | WORKER | FINANCE | SUPPLY |
|------|-------|-------|---------|--------|---------|--------|
| 查看审批流程 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 提交审批 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 审批 | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |

## 租户隔离

### Tenant-ID 请求头

所有 API 请求必须携带租户 ID：

```
Tenant-ID: {tenant_id}
```

### 数据隔离规则

- 所有数据查询自动过滤当前租户数据
- 跨租户数据访问被禁止
- 租户 ID 在用户登录后从用户信息中获取

### 示例

```javascript
// 登录后获取租户 ID
const { user } = await login(username, password);
const tenantId = user.tenant_id;

// 后续请求携带租户 ID
const response = await fetch('/api/v1/leads', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Tenant-ID': tenantId
  }
});
```

## 权限验证

### 服务端验证

服务端在处理每个请求时验证：
1. Token 有效性
2. Token 是否过期
3. 用户角色
4. 操作权限
5. 租户数据访问权限

### 权限不足响应

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "权限不足",
    "details": {
      "required_permission": "leads.create",
      "user_roles": ["SALES"]
    }
  }
}
```

## 特殊权限

### 数据所有权

某些操作只能由数据所有者执行：

- 只能编辑自己创建的线索
- 只能查看分配给自己的任务
- 经理可以查看部门内所有数据

### 跨部门访问

经理角色可以访问部门内所有数据：

```javascript
// 经理查看部门内所有线索
GET /api/v1/leads?department_id={department_id}
```

### 敏感操作

敏感操作需要二次验证：

```javascript
POST /api/v1/orders/{id}/cancel
{
  "reason": "客户取消",
  "verification_code": "123456"
}
```

## Token 安全

### Token 存储

- Web 端：存储在 HttpOnly Cookie 或 LocalStorage
- 移动端：存储在安全存储（如 Keychain）

### Token 传输

- 使用 HTTPS 协议
- Token 不在 URL 中传输
- 使用 Authorization 请求头

### Token 过期

- Token 有效期：24 小时
- Refresh Token 有效期：7 天
- 过期后需要重新登录或刷新 Token

### Token 撤销

- 用户登出时撤销 Token
- 管理员可以撤销用户 Token
- 密码修改后撤销所有 Token

## API Key 认证

部分外部集成使用 API Key 认证：

```
X-API-Key: {api_key}
```

API Key 用于：
- Webhook 回调验证
- 第三方系统集成
- 自动化脚本访问

## OAuth 2.0

支持 OAuth 2.0 认证流程：

### 授权码模式

```
GET /oauth/authorize?
  response_type=code&
  client_id={client_id}&
  redirect_uri={redirect_uri}&
  scope=leads.read,orders.write
```

### 获取访问令牌

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={code}&
redirect_uri={redirect_uri}&
client_id={client_id}&
client_secret={client_secret}
```

## 审计日志

所有认证和权限相关操作都会记录审计日志：

- 登录/登出
- Token 刷新
- 权限变更
- 敏感操作访问

## 最佳实践

1. **Token 管理**
   - 不要在客户端存储敏感信息
   - 定期刷新 Token
   - 登出时清除 Token

2. **权限设计**
   - 遵循最小权限原则
   - 定期审查用户权限
   - 及时回收离职人员权限

3. **安全审计**
   - 定期检查异常登录
   - 监控敏感操作
   - 记录所有权限变更
