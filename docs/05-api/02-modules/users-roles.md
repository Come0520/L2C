# 用户和角色 API

> 用户管理、角色管理、权限管理

## 目录

- [用户管理](#用户管理)
- [角色管理](#角色管理)
- [权限管理](#权限管理)
- [团队管理](#团队管理)

---

## 用户管理

### 获取用户列表

```http
GET /api/v1/users
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| role | string | 否 | 按角色过滤 |
| status | string | 否 | 状态：ACTIVE, INACTIVE |
| search | string | 否 | 搜索姓名/手机号 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "张三",
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "role": "SALES",
        "status": "ACTIVE",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 创建用户

```http
POST /api/v1/users
```

**请求体**

```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "role": "SALES",
  "password": "初始密码"
}
```

### 更新用户

```http
PUT /api/v1/users/{id}
```

### 停用用户

```http
POST /api/v1/users/{id}/deactivate
```

### 重置密码

```http
POST /api/v1/users/{id}/reset-password
```

---

## 角色管理

### 角色枚举

| 角色代码 | 说明 | 默认权限 |
|----------|------|----------|
| ADMIN | 管理员 | 全部权限 |
| MANAGER | 店长 | 门店管理权限 |
| SALES | 销售 | 线索、报价、订单 |
| WORKER | 工人 | 测量、安装 |
| FINANCE | 财务 | 收付款、对账 |
| SUPPLY | 供应链 | 采购、库存 |

### 获取角色列表

```http
GET /api/v1/roles
```

### 获取角色详情

```http
GET /api/v1/roles/{roleCode}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "code": "SALES",
    "name": "销售",
    "permissions": [
      "leads.read",
      "leads.create",
      "quotes.read",
      "quotes.create",
      "orders.read"
    ]
  }
}
```

---

## 权限管理

### 权限结构

权限采用 `模块.操作` 格式：

| 权限代码 | 说明 |
|----------|------|
| `leads.read` | 查看线索 |
| `leads.create` | 创建线索 |
| `leads.update` | 更新线索 |
| `leads.delete` | 删除线索 |
| `quotes.approve` | 审批报价 |
| `orders.read` | 查看订单 |
| `orders.create` | 创建订单 |
| `finance.read` | 查看财务 |
| `finance.manage` | 管理财务 |

### 检查权限

```http
POST /api/v1/auth/check-permission
```

**请求体**

```json
{
  "permission": "quotes.approve"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "allowed": true
  }
}
```

---

## 团队管理

### 获取团队成员

```http
GET /api/v1/team
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "name": "张三",
        "role": "SALES",
        "avatar": "/avatars/user1.jpg"
      }
    ],
    "count": 5
  }
}
```

### 邀请成员

```http
POST /api/v1/team/invite
```

**请求体**

```json
{
  "phone": "13800138001",
  "role": "SALES"
}
```

---

## 通知偏好

### 获取通知偏好

```http
GET /api/v1/users/me/notification-preferences
```

### 更新通知偏好

```http
PUT /api/v1/users/me/notification-preferences
```

**请求体**

```json
{
  "channels": ["IN_APP", "WECHAT"],
  "doNotDisturb": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  }
}
```
