# 罗莱L2C销售管理系统 - API接口设计文档

## 🌐 API接口规范标准

### RESTful API设计原则

#### 1. URL设计规范
```
基础URL：https://api.l2c.luolai.com/v1
资源命名：使用复数名词，小写字母，单词间用下划线分隔
版本控制：在URL中包含版本号 /v1/
```

#### API路径命名规范
```
✅ 正确示例：
/v1/sales_orders          - 销售订单（复数，下划线）
/v1/customer_leads        - 客户线索（复数，下划线）
/v1/product_categories    - 产品分类（复数，下划线）
/v1/batch_operations      - 批量操作（复数，下划线）
/v1/file_uploads          - 文件上传（复数，下划线）
/v1/notification_settings - 通知设置（复数，下划线）

❌ 错误示例：
/v1/sales-orders          - 使用连字符
/v1/sales_order           - 使用单数
/v1/salesOrders           - 使用驼峰命名
/v1/SalesOrders           - 使用帕斯卡命名
```

#### 查询参数命名规范
```
✅ 正确示例：
?page=1&page_size=20      - 分页参数（下划线）
?start_date=2025-01-01    - 日期参数（下划线）
?customer_id=123          - ID参数（下划线）
?sort_by=created_at       - 排序参数（下划线）
?sort_order=desc          - 排序方向（下划线）

❌ 错误示例：
?pageSize=20              - 使用驼峰命名
?startDate=2025-01-01     - 使用驼峰命名
?customer-id=123          - 使用连字符
```

#### 请求体字段命名规范
```
✅ 正确示例：
{
  "customer_name": "张三",
  "phone_number": "13800138000",
  "created_at": "2025-01-21T10:30:00Z",
  "total_amount": 15800,
  "order_items": [...],
  "shipping_address": {...}
}

❌ 错误示例：
{
  "customerName": "张三",     - 使用驼峰命名
  "phone-number": "13800138000", - 使用连字符
  "CreatedAt": "2025-01-21T10:30:00Z", - 使用帕斯卡命名
}
```

#### 响应字段命名规范
```
✅ 正确示例：
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total_count": 100,
    "page_info": {
      "current_page": 1,
      "page_size": 20,
      "total_pages": 5
    },
    "items": [...]
  },
  "request_id": "req_123456",
  "timestamp": "2025-01-21T10:30:00Z"
}
```

#### 语言使用规范
```
API路径：必须使用英文，如 /sales_orders, /leads, /customers
参数名称：必须使用英文，如 page, page_size, status, created_at
响应字段：必须使用英文，如 id, name, phone, total_amount
错误信息：message字段使用中文，便于前端直接显示给用户
```

#### 2. HTTP方法使用规范
```
GET     - 获取资源（查询）
POST    - 创建资源
PUT     - 更新资源（完整更新）
PATCH   - 更新资源（部分更新）
DELETE  - 删除资源
```

#### 3. 请求格式规范
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {access_token}",
  "X-Request-ID": "unique-request-id",
  "X-Client-Version": "1.0.0"
}
```

#### 4. 响应格式规范
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2025-01-21T10:30:00Z",
  "request_id": "unique-request-id"
}
```

### 认证说明

#### JWT Token认证
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Token包含信息：
- user_id: 用户ID
- username: 用户名
- roles: 用户角色
- permissions: 用户权限
- exp: 过期时间
```

#### 权限验证
```
基于角色的访问控制（RBAC）
- 每个接口定义所需权限
- 中间件自动验证用户权限
- 支持细粒度权限控制
```

### 状态码定义

#### 成功状态码
```
200 OK          - 请求成功
201 Created     - 资源创建成功
204 No Content  - 请求成功，无返回内容
```

#### 客户端错误状态码
```
400 Bad Request         - 请求参数错误
401 Unauthorized        - 未授权
403 Forbidden          - 权限不足
404 Not Found          - 资源不存在
409 Conflict           - 资源冲突
422 Unprocessable Entity - 请求格式正确但语义错误
429 Too Many Requests   - 请求频率超限
```

#### 服务端错误状态码
```
500 Internal Server Error - 服务器内部错误
502 Bad Gateway          - 网关错误
503 Service Unavailable  - 服务不可用
504 Gateway Timeout      - 网关超时
```

## 🔐 认证授权接口

### 用户登录
```
POST /auth/login
```

**请求参数：**
```json
{
  "username": "string",     // 用户名，必填
  "password": "string",     // 密码，必填
  "remember_me": "boolean", // 记住我，可选，默认false
  "captcha": "string",      // 验证码，可选
  "captcha_key": "string"   // 验证码key，可选
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "string",      // 访问令牌
    "refresh_token": "string",     // 刷新令牌
    "expires_in": 7200,           // 过期时间（秒）
    "token_type": "Bearer",       // 令牌类型
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "department": {
        "id": 1,
        "name": "销售部"
      },
      "roles": ["admin", "sales"],
      "permissions": ["user:read", "user:write"]
    }
  }
}
```

**错误码：**
```
40001 - 用户名或密码错误
40002 - 账户已被锁定
40003 - 验证码错误
40004 - 账户已过期
```

### 用户登出
```
POST /auth/logout
```

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

### Token刷新
```
POST /auth/refresh
```

**请求参数：**
```json
{
  "refresh_token": "string"  // 刷新令牌，必填
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 7200,
    "token_type": "Bearer"
  }
}
```

### 获取当前用户信息
```
GET /auth/me
```

**请求头：**
```
Authorization: Bearer {access_token}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "department": {
      "id": 1,
      "name": "销售部"
    },
    "roles": ["admin", "sales"],
    "permissions": ["user:read", "user:write"],
    "last_login_time": "2025-01-21T10:30:00Z",
    "login_count": 100
  }
}
```

### 修改密码
```
PUT /auth/password
```

**请求参数：**
```json
{
  "old_password": "string",  // 旧密码，必填
  "new_password": "string",  // 新密码，必填
  "confirm_password": "string" // 确认密码，必填
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

## 👥 用户管理接口

### 获取用户列表
```
GET /users
```

**查询参数：**
```
page=1              // 页码，默认1
page_size=20        // 每页数量，默认20，最大100
keyword=            // 关键词搜索（姓名、用户名、手机号）
department_id=      // 部门ID
status=             // 状态：active,inactive
role=               // 角色
sort=created_at     // 排序字段
sort_order=desc     // 排序方向：asc,desc
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "avatar": "https://example.com/avatar.jpg",
        "department": {
          "id": 1,
          "name": "销售部"
        },
        "status": "active",
        "roles": ["admin"],
        "last_login_time": "2025-01-21T10:30:00Z",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 创建用户
```
POST /users
```

**请求参数：**
```json
{
  "username": "string",      // 用户名，必填，3-50字符
  "password": "string",      // 密码，必填，6-20字符
  "nickname": "string",      // 姓名，必填，2-50字符
  "email": "string",         // 邮箱，可选
  "phone": "string",         // 手机号，可选
  "department_id": "number", // 部门ID，可选
  "role_ids": ["number"],    // 角色ID数组，可选
  "status": "string"         // 状态，可选，默认active
}
```

**响应参数：**
```json
{
  "code": 201,
  "message": "用户创建成功",
  "data": {
    "id": 1,
    "username": "newuser",
    "nickname": "新用户",
    "email": "newuser@example.com",
    "phone": "13800138001",
    "department": {
      "id": 1,
      "name": "销售部"
    },
    "status": "active",
    "created_at": "2025-01-21T10:30:00Z"
  }
}
```

### 获取用户详情
```
GET /users/{id}
```

**路径参数：**
```
id - 用户ID，必填
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "department": {
      "id": 1,
      "name": "销售部",
      "manager": {
        "id": 2,
        "name": "部门经理"
      }
    },
    "roles": [
      {
        "id": 1,
        "name": "管理员",
        "code": "admin"
      }
    ],
    "permissions": ["user:read", "user:write"],
    "status": "active",
    "last_login_time": "2025-01-21T10:30:00Z",
    "login_count": 100,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-21T10:30:00Z"
  }
}
```

### 更新用户
```
PUT /users/{id}
```

**请求参数：**
```json
{
  "nickname": "string",      // 姓名，可选
  "email": "string",         // 邮箱，可选
  "phone": "string",         // 手机号，可选
  "department_id": "number", // 部门ID，可选
  "role_ids": ["number"],    // 角色ID数组，可选
  "status": "string"         // 状态，可选
}
```

### 删除用户
```
DELETE /users/{id}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "用户删除成功",
  "data": null
}
```

## 📋 线索管理接口

### 获取线索列表
```
GET /leads
```

**查询参数：**
```
page=1                    // 页码
page_size=20             // 每页数量
keyword=                 // 关键词搜索
status=                  // 状态筛选
source=                  // 来源筛选
assigned_to=             // 分配人筛选
intention=               // 意向筛选
city=                    // 城市筛选
created_start=           // 创建开始时间
created_end=             // 创建结束时间
next_follow_start=       // 下次跟进开始时间
next_follow_end=         // 下次跟进结束时间
sort=created_at          // 排序字段
sort_order=desc          // 排序方向
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "lead_no": "L202501210001",
        "customer_name": "张三",
        "customer_phone": "13800138000",
        "customer_address": "上海市浦东新区张江高科技园区",
        "customer_city": "上海",
        "customer_district": "浦东新区",
        "status": "new",
        "status_text": "新线索",
        "source": "wechat",
        "source_text": "微信",
        "intention": "strong",
        "intention_text": "强意向",
        "budget": 50000.00,
        "requirement": "需要定制衣柜",
        "assigned_to": {
          "id": 2,
          "name": "销售员A"
        },
        "created_by": {
          "id": 1,
          "name": "管理员"
        },
        "next_follow_time": "2025-01-22T10:00:00Z",
        "follow_count": 3,
        "last_follow_time": "2025-01-20T15:30:00Z",
        "tags": [
          {
            "id": 1,
            "name": "高端客户",
            "color": "#ff6b6b"
          }
        ],
        "created_at": "2025-01-21T10:30:00Z",
        "updated_at": "2025-01-21T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    },
    "statistics": {
      "total_count": 100,
      "new_count": 20,
      "contacted_count": 30,
      "qualified_count": 25,
      "converted_count": 15,
      "lost_count": 10
    }
  }
}
```

### 创建线索
```
POST /leads
```

**请求参数：**
```json
{
  "customer_name": "string",     // 客户姓名，必填
  "customer_phone": "string",    // 客户手机号，必填
  "customer_address": "string",  // 客户地址，可选
  "customer_city": "string",     // 客户城市，可选
  "customer_district": "string", // 客户区域，可选
  "source": "string",           // 来源，必填
  "intention": "string",        // 意向，可选
  "budget": "number",           // 预算，可选
  "requirement": "string",      // 需求描述，可选
  "assigned_to": "number",      // 分配给，可选
  "next_follow_time": "string", // 下次跟进时间，可选
  "remark": "string",           // 备注，可选
  "tag_ids": ["number"]         // 标签ID数组，可选
}
```

### 获取线索详情
```
GET /leads/{id}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "lead_no": "L202501210001",
    "customer_name": "张三",
    "customer_phone": "13800138000",
    "customer_address": "上海市浦东新区张江高科技园区",
    "customer_city": "上海",
    "customer_district": "浦东新区",
    "status": "contacted",
    "status_text": "已联系",
    "source": "wechat",
    "source_text": "微信",
    "intention": "strong",
    "intention_text": "强意向",
    "budget": 50000.00,
    "requirement": "需要定制衣柜，预算5万左右",
    "assigned_to": {
      "id": 2,
      "name": "销售员A",
      "phone": "13800138001"
    },
    "created_by": {
      "id": 1,
      "name": "管理员"
    },
    "next_follow_time": "2025-01-22T10:00:00Z",
    "follow_count": 3,
    "last_follow_time": "2025-01-20T15:30:00Z",
    "remark": "客户很有诚意，需要尽快安排测量",
    "tags": [
      {
        "id": 1,
        "name": "高端客户",
        "color": "#ff6b6b"
      }
    ],
    "follow_ups": [
      {
        "id": 1,
        "content": "电话联系客户，了解具体需求",
        "type": "phone",
        "type_text": "电话",
        "next_follow_time": "2025-01-22T10:00:00Z",
        "created_by": {
          "id": 2,
          "name": "销售员A"
        },
        "created_at": "2025-01-20T15:30:00Z"
      }
    ],
    "converted_order": null,
    "created_at": "2025-01-21T10:30:00Z",
    "updated_at": "2025-01-21T10:30:00Z"
  }
}
```

### 更新线索
```
PUT /leads/{id}
```

### 删除线索
```
DELETE /leads/{id}
```

### 分配线索
```
POST /leads/{id}/assign
```

**请求参数：**
```json
{
  "assigned_to": "number",  // 分配给的用户ID，必填
  "remark": "string"        // 分配备注，可选
}
```

### 转化线索为订单
```
POST /leads/{id}/convert
```

**请求参数：**
```json
{
  "order_data": {
    "customer_name": "string",
    "customer_phone": "string",
    "customer_address": "string",
    "products": [
      {
        "category": "string",
        "product_name": "string",
        "specifications": "string",
        "quantity": "number",
        "unit_price": "number"
      }
    ],
    "total_amount": "number",
    "expected_install_date": "string",
    "remark": "string"
  }
}
```

## 📦 销售单管理接口

### 获取销售单列表
```
GET /orders
```

**查询参数：**
```
page=1                    // 页码
page_size=20             // 每页数量
keyword=                 // 关键词搜索（销售单号、客户姓名、手机号）
status=                  // 状态筛选
sales_id=                // 销售员筛选
customer_phone=          // 客户手机号筛选
created_start=           // 创建开始时间
created_end=             // 创建结束时间
amount_min=              // 最小金额
amount_max=              // 最大金额
sort=created_at          // 排序字段
sort_order=desc          // 排序方向
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "O202501210001",
        "customer_name": "张三",
        "customer_phone": "13800138000",
        "customer_address": "上海市浦东新区张江高科技园区",
        "status": "CONFIRMED",
        "status_text": "已确认",
        "total_amount": 50000.00,
        "paid_amount": 15000.00,
        "sales": {
          "id": 2,
          "name": "销售员A"
        },
        "measure_provider": {
          "id": 1,
          "name": "测量服务商A"
        },
        "install_provider": {
          "id": 2,
          "name": "安装服务商B"
        },
        "expected_install_date": "2025-02-15",
        "actual_install_date": null,
        "created_at": "2025-01-21T10:30:00Z",
        "updated_at": "2025-01-21T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    },
    "statistics": {
      "total_count": 100,
      "total_amount": 5000000.00,
      "status_counts": {
        "INITIAL": 10,
        "CONFIRMED": 20,
        "MEASURED": 15,
        "PRODUCED": 25,
        "DELIVERED": 20,
        "INSTALLED": 10
      }
    }
  }
}
```

### 创建销售单
```
POST /orders
```

**请求参数：**
```json
{
  "customer_name": "string",     // 客户姓名，必填
  "customer_phone": "string",    // 客户手机号，必填
  "customer_address": "string",  // 客户地址，必填
  "customer_id": "number",       // 客户ID，可选
  "lead_id": "number",          // 关联线索ID，可选
  "products": [                 // 产品列表，必填
    {
      "category": "string",      // 产品类别，必填
      "product_name": "string",  // 产品名称，必填
      "specifications": "string", // 规格，必填
      "quantity": "number",      // 数量，必填
      "unit_price": "number",    // 单价，必填
      "remarks": "string"        // 备注，可选
    }
  ],
  "services": [                 // 服务列表，可选
    {
      "service_type": "string",  // 服务类型：measure,install
      "provider_id": "number",   // 服务商ID，可选
      "scheduled_time": "string", // 预约时间，可选
      "fee": "number"           // 服务费用，可选
    }
  ],
  "total_amount": "number",     // 销售单总金额，必填
  "expected_install_date": "string", // 期望安装日期，可选
  "remark": "string"            // 备注，可选
}
```

### 获取销售单详情
```
GET /orders/{id}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "order_no": "O202501210001",
    "customer_name": "张三",
    "customer_phone": "13800138000",
    "customer_address": "上海市浦东新区张江高科技园区",
    "customer": {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    },
    "lead": {
      "id": 1,
      "lead_no": "L202501210001"
    },
    "status": "CONFIRMED",
    "status_text": "已确认",
    "total_amount": 50000.00,
    "paid_amount": 15000.00,
    "sales": {
      "id": 2,
      "name": "销售员A",
      "phone": "13800138001"
    },
    "products": [
      {
        "id": 1,
        "category": "衣柜",
        "product_name": "定制衣柜",
        "specifications": "2.4m*2.6m*0.6m",
        "quantity": 1,
        "unit_price": 45000.00,
        "total_price": 45000.00,
        "remarks": "白色烤漆"
      }
    ],
    "services": [
      {
        "id": 1,
        "service_type": "measure",
        "service_type_text": "测量",
        "provider": {
          "id": 1,
          "name": "测量服务商A",
          "phone": "13800138002"
        },
        "scheduled_time": "2025-01-25T14:00:00Z",
        "actual_time": null,
        "status": "assigned",
        "status_text": "已分配",
        "fee": 0.00
      }
    ],
    "payments": [
      {
        "id": 1,
        "payment_no": "P202501210001",
        "amount": 15000.00,
        "payment_method": "wechat",
        "payment_method_text": "微信支付",
        "status": "success",
        "status_text": "支付成功",
        "paid_at": "2025-01-21T11:00:00Z"
      }
    ],
    "status_logs": [
      {
        "id": 1,
        "previous_status": null,
        "current_status": "INITIAL",
        "current_status_text": "初始状态",
        "operator": {
          "id": 2,
          "name": "销售员A"
        },
        "remark": "订单创建",
        "created_at": "2025-01-21T10:30:00Z"
      }
    ],
    "expected_install_date": "2025-02-15",
    "actual_install_date": null,
    "remark": "客户要求尽快安装",
    "created_by": {
      "id": 2,
      "name": "销售员A"
    },
    "created_at": "2025-01-21T10:30:00Z",
    "updated_at": "2025-01-21T10:30:00Z"
  }
}
```

### 更新销售单状态
```
PUT /orders/{id}/status
```

**请求参数：**
```json
{
  "status": "string",    // 新状态，必填
  "remark": "string"     // 备注，可选
}
```

### 销售单支付
```
POST /orders/{id}/payments
```

**请求参数：**
```json
{
  "amount": "number",           // 支付金额，必填
  "payment_method": "string",   // 支付方式，必填
  "remark": "string"           // 备注，可选
}
```

## 💰 积分管理接口

### 获取积分流水
```
GET /points/logs
```

**查询参数：**
```
page=1              // 页码
page_size=20        // 每页数量
user_id=            // 用户ID筛选
type=               // 类型筛选：earned,consumed,expired
source=             // 来源筛选
start_date=         // 开始日期
end_date=           // 结束日期
sort=created_at     // 排序字段
sort_order=desc     // 排序方向
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "user": {
          "id": 2,
          "name": "销售员A"
        },
        "points": 100,
        "type": "earned",
        "type_text": "获得",
        "source": "lead_created",
        "source_text": "创建线索",
        "source_description": "创建线索获得积分",
        "balance": 1500,
        "expired_at": "2025-07-21T10:30:00Z",
        "created_at": "2025-01-21T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    },
    "summary": {
      "total_earned": 2000,
      "total_consumed": 500,
      "current_balance": 1500
    }
  }
}
```

### 获取用户积分余额
```
GET /points/balance/{user_id}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "user_id": 2,
    "current_balance": 1500,
    "total_earned": 2000,
    "total_consumed": 500,
    "expired_points": 0,
    "expiring_soon": 200,  // 30天内即将过期的积分
    "last_earned_at": "2025-01-21T10:30:00Z",
    "last_consumed_at": "2025-01-20T15:00:00Z"
  }
}
```

### 积分调整
```
POST /points/adjust
```

**请求参数：**
```json
{
  "user_id": "number",      // 用户ID，必填
  "points": "number",       // 积分数量（正数为增加，负数为扣减），必填
  "reason": "string",       // 调整原因，必填
  "remark": "string"        // 备注，可选
}
```

### 获取积分规则
```
GET /points/rules
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "rule_code": "lead_created",
      "rule_name": "创建线索",
      "points": 10,
      "source_type": "lead",
      "conditions": {
        "min_budget": 1000
      },
      "adjustment_factors": {
        "product_category": {
          "衣柜": 1.2,
          "橱柜": 1.0,
          "书柜": 0.8
        },
        "time_period": {
          "peak": 1.5,
          "normal": 1.0
        }
      },
      "status": "active",
      "valid_from": "2025-01-01T00:00:00Z",
      "valid_to": null
    }
  ]
}
```

## 📊 报表分析接口

### 销售漏斗报表
```
GET /reports/sales-funnel
```

**查询参数：**
```
start_date=2025-01-01   // 开始日期
end_date=2025-01-31     // 结束日期
sales_id=               // 销售员ID筛选
department_id=          // 部门ID筛选
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-31"
    },
    "funnel": {
      "leads": {
        "count": 1000,
        "amount": 50000000.00
      },
      "qualified_leads": {
        "count": 600,
        "amount": 35000000.00,
        "conversion_rate": 0.60
      },
      "orders": {
        "count": 200,
        "amount": 15000000.00,
        "conversion_rate": 0.33
      },
      "completed_orders": {
        "count": 150,
        "amount": 12000000.00,
        "completion_rate": 0.75
      }
    },
    "trend": [
      {
        "date": "2025-01-01",
        "leads": 35,
        "qualified_leads": 20,
        "orders": 8,
        "completed_orders": 6
      }
    ]
  }
}
```

### 业绩统计报表
```
GET /reports/performance
```

**查询参数：**
```
start_date=2025-01-01   // 开始日期
end_date=2025-01-31     // 结束日期
group_by=user           // 分组方式：user,department,date
sales_id=               // 销售员ID筛选
department_id=          // 部门ID筛选
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "summary": {
      "total_leads": 1000,
      "total_orders": 200,
      "total_amount": 15000000.00,
      "avg_order_amount": 75000.00,
      "conversion_rate": 0.20
    },
    "rankings": [
      {
        "user": {
          "id": 2,
          "name": "销售员A"
        },
        "leads_count": 150,
        "orders_count": 45,
        "total_amount": 3375000.00,
        "conversion_rate": 0.30,
        "rank": 1
      }
    ]
  }
}
```

## 🔧 系统配置接口

### 获取系统配置
```
GET /configs
```

**查询参数：**
```
module=             // 配置模块筛选
config_key=         // 配置键筛选
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "config_key": "point.expiry_days",
      "config_value": "180",
      "config_type": "number",
      "module": "point",
      "description": "积分过期天数",
      "is_system": false,
      "editable": true
    }
  ]
}
```

### 更新系统配置
```
PUT /configs/{id}
```

**请求参数：**
```json
{
  "config_value": "string"  // 配置值，必填
}
```

## 📱 微信小程序接口

### 微信登录
```
POST /wechat/login
```

**请求参数：**
```json
{
  "code": "string",         // 微信授权码，必填
  "encrypted_data": "string", // 加密数据，可选
  "iv": "string"            // 初始向量，可选
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "openid": "string",
      "nickname": "微信用户",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "13800138000"
    }
  }
}
```

### 获取施工员日程
```
GET /wechat/schedules
```

**查询参数：**
```
date=2025-01-21     // 日期筛选
provider_id=        // 服务商ID筛选
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "order": {
        "id": 1,
        "order_no": "O202501210001",
        "customer_name": "张三",
        "customer_phone": "13800138000",
        "customer_address": "上海市浦东新区张江高科技园区"
      },
      "service_type": "measure",
      "service_type_text": "测量",
      "scheduled_time": "2025-01-21T14:00:00Z",
      "status": "assigned",
      "status_text": "已分配",
      "provider": {
        "id": 1,
        "name": "测量服务商A"
      }
    }
  ]
}
```

## 🔍 通用查询接口

### 枚举值查询
```
GET /enums/{type}
```

**路径参数：**
```
type - 枚举类型：lead_status,order_status,payment_method等
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "value": "new",
      "label": "新线索",
      "color": "#52c41a",
      "sort": 1
    }
  ]
}
```

### 文件上传
```
POST /upload
```

**请求参数：**
```
Content-Type: multipart/form-data

file: 文件内容
type: 文件类型（avatar,attachment,image等）
```

**响应参数：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/file.jpg",
    "filename": "file.jpg",
    "size": 1024,
    "type": "image/jpeg"
  }
}
```

## 🚨 错误处理

### 统一错误响应格式
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ],
  "timestamp": "2025-01-21T10:30:00Z",
  "request_id": "unique-request-id"
}
```

### 常见错误码
```
40001 - 用户名或密码错误
40002 - 账户已被锁定
40003 - 验证码错误
40004 - Token已过期
40005 - 权限不足
40006 - 资源不存在
40007 - 资源已存在
40008 - 参数验证失败
40009 - 业务规则验证失败
50001 - 服务器内部错误
50002 - 数据库连接错误
50003 - 第三方服务错误
```

## 📏 测量管理接口

### 创建测量任务
```
POST /measurements
```

**请求参数：**
```json
{
  "customer_id": "string",
  "address": "string",
  "contact_person": "string",
  "contact_phone": "string",
  "scheduled_date": "2025-01-21T10:00:00Z",
  "room_type": "bedroom|living_room|kitchen|bathroom",
  "requirements": "string",
  "notes": "string"
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "测量任务创建成功",
  "data": {
    "id": "meas_123456",
    "customer_id": "cust_123",
    "status": "scheduled",
    "scheduled_date": "2025-01-21T10:00:00Z",
    "created_at": "2025-01-21T09:00:00Z"
  }
}
```

### 获取测量任务列表
```
GET /measurements?status=scheduled&page=1&limit=20
```

### 更新测量结果
```
PUT /measurements/{id}/result
```

**请求参数：**
```json
{
  "measurements": [
    {
      "item": "窗户",
      "width": 120.5,
      "height": 150.0,
      "quantity": 2,
      "notes": "客厅窗户"
    }
  ],
  "photos": ["url1", "url2"],
  "completion_notes": "测量完成，客户满意"
}
```

## 🔧 安装管理接口

### 创建安装任务
```
POST /installations
```

**请求参数：**
```json
{
  "order_id": "string",
  "customer_id": "string",
  "products": [
    {
      "product_id": "string",
      "quantity": 2,
      "specifications": "string"
    }
  ],
  "scheduled_date": "2025-01-25T09:00:00Z",
  "installer_id": "string",
  "installation_address": "string",
  "contact_person": "string",
  "contact_phone": "string"
}
```

### 获取安装任务列表
```
GET /installations?status=scheduled&installer_id=inst_123&page=1&limit=20
```

### 更新安装进度
```
PATCH /installations/{id}/progress
```

**请求参数：**
```json
{
  "status": "in_progress|completed|cancelled",
  "progress_notes": "安装进度说明",
  "completion_photos": ["url1", "url2"],
  "customer_signature": "signature_url"
}
```

## 📦 产品管理接口

### 获取产品列表
```
GET /products?category=curtains&brand=luolai&page=1&limit=20
```

### 获取产品详情
```
GET /products/{id}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "prod_123",
    "name": "罗莱经典窗帘",
    "category": "curtains",
    "brand": "luolai",
    "price": 299.00,
    "specifications": {
      "material": "棉麻",
      "color": "米白色",
      "size": "定制"
    },
    "images": ["url1", "url2"],
    "description": "产品描述",
    "stock_quantity": 100,
    "status": "active"
  }
}
```

### 创建产品
```
POST /products
```

### 更新产品信息
```
PUT /products/{id}
```

### 删除产品
```
DELETE /products/{id}
```

## 💰 报价管理接口

### 创建报价单
```
POST /quotes
```

**请求参数：**
```json
{
  "customer_id": "string",
  "lead_id": "string",
  "items": [
    {
      "product_id": "string",
      "quantity": 2,
      "unit_price": 299.00,
      "discount": 0.1,
      "subtotal": 538.20
    }
  ],
  "total_amount": 538.20,
  "discount_amount": 59.80,
  "final_amount": 478.40,
  "valid_until": "2025-02-21T23:59:59Z",
  "notes": "报价说明"
}
```

### 获取报价单列表
```
GET /quotes?customer_id=cust_123&status=pending&page=1&limit=20
```

### 获取报价单详情
```
GET /quotes/{id}
```

### 更新报价单状态
```
PATCH /quotes/{id}/status
```

**请求参数：**
```json
{
  "status": "approved|rejected|expired",
  "notes": "状态变更说明"
}
```

## 🛍️ 积分商城接口

### 获取商城商品列表
```
GET /mall/products?category=gifts&points_range=100-500&page=1&limit=20
```

### 获取商品详情
```
GET /mall/products/{id}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mall_prod_123",
    "name": "罗莱毛巾套装",
    "category": "gifts",
    "points_required": 300,
    "original_price": 89.00,
    "images": ["url1", "url2"],
    "description": "商品描述",
    "stock_quantity": 50,
    "exchange_count": 120,
    "status": "active"
  }
}
```

### 积分兑换
```
POST /mall/exchange
```

**请求参数：**
```json
{
  "product_id": "string",
  "quantity": 1,
  "delivery_address": {
    "recipient": "张三",
    "phone": "13800138000",
    "address": "上海市浦东新区xxx路xxx号"
  }
}
```

### 获取兑换记录
```
GET /mall/exchanges?user_id=user_123&status=pending&page=1&limit=20
```

## 🔄 批量操作接口

### 批量导入线索
```
POST /leads/batch_import
```

**请求参数：**
```
Content-Type: multipart/form-data

file: Excel文件 (.xlsx, .xls)
template_type: 模板类型 (standard|custom)
skip_errors: 是否跳过错误行 (true|false)
```

**Excel模板格式：**
```
客户姓名 | 手机号 | 来源 | 意向 | 城市 | 备注
张三     | 13800138000 | 网络 | 高 | 上海 | 客户备注
```

**响应参数：**
```json
{
  "code": 200,
  "message": "导入完成",
  "data": {
    "total_rows": 100,
    "success_count": 95,
    "error_count": 5,
    "errors": [
      {
        "row": 3,
        "field": "phone",
        "message": "手机号格式不正确"
      }
    ],
    "import_id": "import_123456",
    "created_leads": ["lead_001", "lead_002"]
  }
}
```

### 批量更新线索状态
```
PUT /leads/batch_status
```

**请求参数：**
```json
{
  "lead_ids": ["lead_001", "lead_002", "lead_003"],
  "status": "contacted",
  "remark": "批量更新备注",
  "assigned_to": 123
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "批量更新成功",
  "data": {
    "success_count": 2,
    "error_count": 1,
    "errors": [
      {
        "lead_id": "lead_003",
        "message": "线索不存在或无权限"
      }
    ]
  }
}
```

### 批量分配线索
```
POST /leads/batch_assign
```

**请求参数：**
```json
{
  "lead_ids": ["lead_001", "lead_002"],
  "assigned_to": 123,
  "remark": "批量分配给销售员A"
}
```

### 批量删除线索
```
DELETE /leads/batch_delete
```

**请求参数：**
```json
{
  "lead_ids": ["lead_001", "lead_002"],
  "reason": "重复线索"
}
```

### 批量更新订单状态
```
PUT /orders/batch_status
```

**请求参数：**
```json
{
  "order_ids": ["order_001", "order_002"],
  "status": "confirmed",
  "remark": "批量确认订单"
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "批量更新成功",
  "data": {
    "success_count": 2,
    "error_count": 0,
    "updated_orders": [
      {
        "order_id": "order_001",
        "previous_status": "pending",
        "current_status": "confirmed"
      }
    ]
  }
}
```

### 批量导入客户
```
POST /customers/batch_import
```

**请求参数：**
```
Content-Type: multipart/form-data

file: Excel文件
template_type: 模板类型
merge_strategy: 合并策略 (skip|update|replace)
```

**Excel模板格式：**
```
客户姓名 | 手机号 | 邮箱 | 地址 | 客户等级 | 备注
张三     | 13800138000 | zhang@example.com | 上海市浦东新区 | A | 重要客户
```

### 批量导入产品
```
POST /products/batch_import
```

**请求参数：**
```
Content-Type: multipart/form-data

file: Excel文件
category_id: 产品分类ID
supplier_id: 供应商ID (可选)
```

**Excel模板格式：**
```
产品名称 | 产品编码 | 规格 | 单价 | 库存 | 描述
床上用品套装 | BED001 | 1.8m*2.0m | 299.00 | 100 | 四件套
```

### 批量操作状态查询
```
GET /batch_operations/{operation_id}/status
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "operation_id": "batch_123456",
    "type": "lead_import",
    "status": "processing",
    "progress": {
      "total": 1000,
      "processed": 650,
      "success": 620,
      "errors": 30
    },
    "started_at": "2025-01-21T10:30:00Z",
    "estimated_completion": "2025-01-21T10:35:00Z"
  }
}
```

### 批量操作历史
```
GET /batch_operations/history
```

**查询参数：**
```
page=1
page_size=20
type=lead_import|order_update|customer_import
status=pending|processing|completed|failed
start_date=2025-01-01
end_date=2025-01-31
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "operation_id": "batch_123456",
        "type": "lead_import",
        "type_text": "线索导入",
        "status": "completed",
        "status_text": "已完成",
        "total_count": 1000,
        "success_count": 980,
        "error_count": 20,
        "file_name": "leads_20250121.xlsx",
        "operator": {
          "id": 123,
          "name": "管理员"
        },
        "started_at": "2025-01-21T10:30:00Z",
        "completed_at": "2025-01-21T10:35:00Z"
      }
    ]
  }
}
```

### 下载批量操作模板
```
GET /batch_operations/templates/{type}
```

**路径参数：**
```
type: 模板类型 (lead_import|customer_import|product_import)
```

**响应：**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="lead_import_template.xlsx"

[Excel文件内容]
```

### 下载批量操作错误报告
```
GET /batch_operations/{operation_id}/error_report
```

**响应：**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="error_report_batch_123456.xlsx"

[包含错误详情的Excel文件]
```

## 📁 文件管理接口

### 通用文件上传
```
POST /files/upload
```

**请求参数：**
```
Content-Type: multipart/form-data

file: 文件内容
folder: 文件夹路径 (可选)
tags: 文件标签 (可选)
business_type: 业务类型 (可选)
business_id: 业务ID (可选)
```

**响应示例：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": "file_123456",
    "filename": "document.pdf",
    "original_name": "合同文档.pdf",
    "url": "https://cdn.l2c.luolai.com/files/document.pdf",
    "thumbnail_url": "https://cdn.l2c.luolai.com/thumbnails/document_thumb.jpg",
    "size": 2048576,
    "mime_type": "application/pdf",
    "folder": "/contracts/2025/01",
    "tags": ["contract", "customer"],
    "business_type": "contract",
    "business_id": "contract_123",
    "uploaded_at": "2025-01-21T10:30:00Z"
  }
}
```

### 测量照片上传
```
POST /measurement_orders/{id}/photos
```

**请求参数：**
```
Content-Type: multipart/form-data

photos: 照片文件数组 (支持多文件上传)
photo_type: 照片类型 (room_overview|detail|problem|before|after)
room_name: 房间名称 (可选)
description: 照片描述 (可选)
location: 拍摄位置 (可选)
```

**响应示例：**
```json
{
  "code": 200,
  "message": "照片上传成功",
  "data": {
    "measurement_order_id": "measure_123",
    "uploaded_photos": [
      {
        "id": "photo_001",
        "filename": "room1_overview.jpg",
        "original_name": "客厅全景.jpg",
        "url": "https://cdn.l2c.luolai.com/measurement/room1_overview.jpg",
        "thumbnail_url": "https://cdn.l2c.luolai.com/thumbnails/room1_overview_thumb.jpg",
        "photo_type": "room_overview",
        "room_name": "客厅",
        "description": "客厅整体布局",
        "size": 1024000,
        "dimensions": {
          "width": 1920,
          "height": 1080
        },
        "exif_data": {
          "camera": "iPhone 14 Pro",
          "taken_at": "2025-01-21T14:30:00Z",
          "gps_location": {
            "latitude": 31.2304,
            "longitude": 121.4737
          }
        },
        "uploaded_at": "2025-01-21T14:35:00Z"
      }
    ]
  }
}
```

### 安装照片上传
```
POST /installation_orders/{id}/photos
```

**请求参数：**
```
Content-Type: multipart/form-data

photos: 照片文件数组
photo_type: 照片类型 (before_install|during_install|after_install|problem|completion)
installation_step: 安装步骤 (可选)
product_id: 产品ID (可选)
description: 照片描述 (可选)
```

**响应示例：**
```json
{
  "code": 200,
  "message": "安装照片上传成功",
  "data": {
    "installation_order_id": "install_123",
    "uploaded_photos": [
      {
        "id": "photo_002",
        "filename": "install_before.jpg",
        "url": "https://cdn.l2c.luolai.com/installation/install_before.jpg",
        "thumbnail_url": "https://cdn.l2c.luolai.com/thumbnails/install_before_thumb.jpg",
        "photo_type": "before_install",
        "installation_step": "preparation",
        "product_id": "product_456",
        "description": "安装前现场状况",
        "uploaded_at": "2025-01-21T15:00:00Z"
      }
    ]
  }
}
```

### 客户头像上传
```
POST /customers/{id}/avatar
```

**请求参数：**
```
Content-Type: multipart/form-data

avatar: 头像文件 (jpg, png, 最大2MB)
```

**响应示例：**
```json
{
  "code": 200,
  "message": "头像上传成功",
  "data": {
    "customer_id": "customer_123",
    "avatar_url": "https://cdn.l2c.luolai.com/avatars/customer_123.jpg",
    "thumbnail_url": "https://cdn.l2c.luolai.com/avatars/thumbs/customer_123_thumb.jpg",
    "uploaded_at": "2025-01-21T10:30:00Z"
  }
}
```

### 产品图片上传
```
POST /products/{id}/images
```

**请求参数：**
```
Content-Type: multipart/form-data

images: 产品图片数组
image_type: 图片类型 (main|detail|color_variant|size_chart)
sort_order: 排序顺序 (可选)
color: 颜色标识 (可选)
```

**响应示例：**
```json
{
  "code": 200,
  "message": "产品图片上传成功",
  "data": {
    "product_id": "product_123",
    "uploaded_images": [
      {
        "id": "image_001",
        "filename": "product_main.jpg",
        "url": "https://cdn.l2c.luolai.com/products/product_main.jpg",
        "thumbnail_url": "https://cdn.l2c.luolai.com/products/thumbs/product_main_thumb.jpg",
        "image_type": "main",
        "sort_order": 1,
        "color": "white",
        "size": 512000,
        "dimensions": {
          "width": 800,
          "height": 600
        },
        "uploaded_at": "2025-01-21T10:30:00Z"
      }
    ]
  }
}
```

### 合同文件上传
```
POST /contracts/{id}/documents
```

**请求参数：**
```
Content-Type: multipart/form-data

documents: 合同文件数组
document_type: 文档类型 (contract|attachment|supplement|amendment)
version: 版本号 (可选)
description: 文档描述 (可选)
```

### 报价单附件上传
```
POST /quotes/{id}/attachments
```

**请求参数：**
```
Content-Type: multipart/form-data

attachments: 附件文件数组
attachment_type: 附件类型 (design_drawing|material_list|reference_image)
description: 附件描述 (可选)
```

### 分块上传（大文件）
```
POST /files/chunk_upload/init
```

**初始化分块上传：**
```json
{
  "filename": "large_video.mp4",
  "file_size": 104857600,
  "chunk_size": 1048576,
  "mime_type": "video/mp4",
  "business_type": "training",
  "business_id": "training_123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "分块上传初始化成功",
  "data": {
    "upload_id": "upload_123456",
    "total_chunks": 100,
    "chunk_size": 1048576,
    "upload_urls": [
      "https://api.l2c.luolai.com/files/chunk_upload/upload_123456/1",
    "https://api.l2c.luolai.com/files/chunk_upload/upload_123456/2"
    ]
  }
}
```

### 上传分块
```
PUT /files/chunk_upload/{upload_id}/{chunk_number}
```

**请求参数：**
```
Content-Type: application/octet-stream

[分块数据]
```

### 完成分块上传
```
POST /files/chunk_upload/{upload_id}/complete
```

**请求参数：**
```json
{
  "chunk_etags": [
    {"chunk_number": 1, "etag": "etag1"},
    {"chunk_number": 2, "etag": "etag2"}
  ]
}
```

### 获取上传进度
```
GET /files/upload_progress/{upload_id}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "upload_id": "upload_123456",
    "status": "uploading",
    "progress": {
      "uploaded_chunks": 45,
      "total_chunks": 100,
      "percentage": 45,
      "uploaded_size": 47185920,
      "total_size": 104857600
    },
    "estimated_completion": "2025-01-21T10:35:00Z"
  }
}
```

### 取消上传
```
DELETE /files/upload_progress/{upload_id}
```

### 获取文件列表
```
GET /files?folder=/contracts&tags=contract&page=1&limit=20
```

### 获取文件详情
```
GET /files/{id}
```

### 删除文件
```
DELETE /files/{id}
```

### 批量下载
```
POST /files/batch_download
```

**请求参数：**
```json
{
  "file_ids": ["file_123", "file_456"],
  "archive_name": "documents.zip"
}
```

## 📤 数据导出接口

### 线索数据导出
```
POST /exports/leads
```

**请求参数：**
```json
{
  "export_format": "excel|csv|pdf",
  "filters": {
    "status": ["new", "contacted"],
    "source": ["website", "phone"],
    "assigned_to": [123, 456],
    "city": ["上海", "北京"],
    "created_start": "2025-01-01",
    "created_end": "2025-01-31",
    "intention": ["high", "medium"]
  },
  "fields": [
    "lead_no", "customer_name", "phone", "source", 
    "status", "intention", "assigned_to", "created_at"
  ],
  "sort": {
    "field": "created_at",
    "order": "desc"
  },
  "export_name": "线索数据_20250121",
  "notify_email": "user@example.com"
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "导出任务已创建",
  "data": {
    "export_id": "export_123456",
    "status": "processing",
    "estimated_completion": "2025-01-21T10:35:00Z",
    "download_url": null,
    "expires_at": null
  }
}
```

### 订单数据导出
```
POST /exports/orders
```

**请求参数：**
```json
{
  "export_format": "excel|csv",
  "filters": {
    "status": ["confirmed", "completed"],
    "sales_id": [123, 456],
    "amount_min": 1000,
    "amount_max": 50000,
    "created_start": "2025-01-01",
    "created_end": "2025-01-31"
  },
  "include_details": true,
  "include_payments": true,
  "include_products": true,
  "fields": [
    "order_no", "customer_name", "customer_phone", 
    "total_amount", "status", "sales_person", "created_at"
  ]
}
```

### 客户数据导出
```
POST /exports/customers
```

**请求参数：**
```json
{
  "export_format": "excel|csv",
  "filters": {
    "level": ["A", "B"],
    "status": ["active"],
    "city": ["上海", "北京"],
    "registration_start": "2025-01-01",
    "registration_end": "2025-01-31"
  },
  "include_orders": true,
  "include_interactions": false,
  "fields": [
    "customer_no", "name", "phone", "email", 
    "level", "total_orders", "total_amount", "created_at"
  ]
}
```

### 财务报表导出
```
POST /exports/financial_reports
```

**请求参数：**
```json
{
  "report_type": "sales_summary|payment_details|commission_report|profit_analysis",
  "export_format": "excel|pdf",
  "date_range": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "group_by": "daily|weekly|monthly",
  "filters": {
    "sales_person": [123, 456],
    "region": ["华东", "华北"],
    "product_category": ["床上用品", "窗帘"]
  },
  "include_charts": true,
  "template": "standard|detailed|summary"
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "报表导出任务已创建",
  "data": {
    "export_id": "export_789012",
    "report_type": "sales_summary",
    "status": "processing",
    "progress": 0,
    "estimated_completion": "2025-01-21T10:40:00Z"
  }
}
```

### 库存报表导出
```
POST /exports/inventory_reports
```

**请求参数：**
```json
{
  "report_type": "stock_summary|low_stock_alert|movement_history|stocktake_report",
  "export_format": "excel|csv",
  "filters": {
    "warehouse_id": [1, 2],
    "product_category": ["床上用品"],
    "stock_level": "low|normal|high",
    "date_range": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  },
  "include_images": false
}
```

### 数据备份导出
```
POST /exports/data_backup
```

**请求参数：**
```json
{
  "backup_type": "full|incremental|selective",
  "tables": [
    "leads", "customers", "orders", "products"
  ],
  "export_format": "sql|json|csv",
  "include_files": false,
  "compression": "zip|gzip|none",
  "encryption": {
    "enabled": true,
    "password": "backup_password_123"
  }
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "数据备份任务已创建",
  "data": {
    "backup_id": "backup_345678",
    "backup_type": "full",
    "status": "processing",
    "estimated_size": "2.5GB",
    "estimated_completion": "2025-01-21T11:00:00Z"
  }
}
```

### 导出任务状态查询
```
GET /exports/{export_id}/status
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "export_id": "export_123456",
    "type": "leads",
    "status": "completed",
    "progress": 100,
    "total_records": 1500,
    "processed_records": 1500,
    "file_size": "2.5MB",
    "download_url": "https://cdn.l2c.luolai.com/exports/leads_20250121.xlsx",
    "expires_at": "2025-01-28T10:30:00Z",
    "created_at": "2025-01-21T10:30:00Z",
    "completed_at": "2025-01-21T10:33:00Z"
  }
}
```

### 下载导出文件
```
GET /exports/{export_id}/download
```

**响应：**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="leads_export_20250121.xlsx"
Content-Length: 2621440

[文件内容]
```

### 导出历史记录
```
GET /exports/history
```

**查询参数：**
```
page=1
page_size=20
type=leads|orders|customers|reports|backup
status=pending|processing|completed|failed|expired
start_date=2025-01-01
end_date=2025-01-31
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 25,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "export_id": "export_123456",
        "type": "leads",
        "type_text": "线索数据",
        "export_format": "excel",
        "status": "completed",
        "status_text": "已完成",
        "file_name": "leads_export_20250121.xlsx",
        "file_size": "2.5MB",
        "total_records": 1500,
        "download_count": 3,
        "download_url": "https://cdn.l2c.luolai.com/exports/leads_20250121.xlsx",
        "expires_at": "2025-01-28T10:30:00Z",
        "operator": {
          "id": 123,
          "name": "销售经理"
        },
        "created_at": "2025-01-21T10:30:00Z",
        "completed_at": "2025-01-21T10:33:00Z"
      }
    ]
  }
}
```

### 取消导出任务
```
DELETE /exports/{export_id}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "导出任务已取消",
  "data": {
    "export_id": "export_123456",
    "status": "cancelled"
  }
}
```

### 批量下载导出文件
```
POST /exports/batch_download
```

**请求参数：**
```json
{
  "export_ids": ["export_123", "export_456", "export_789"],
  "archive_name": "batch_exports_20250121.zip"
}
```

**响应参数：**
```json
{
  "code": 200,
  "message": "批量下载任务已创建",
  "data": {
    "download_id": "download_123456",
    "status": "processing",
    "archive_name": "batch_exports_20250121.zip",
    "estimated_completion": "2025-01-21T10:35:00Z"
  }
}
```

### 导出模板管理
```
GET /exports/templates
POST /exports/templates
PUT /exports/templates/{id}
DELETE /exports/templates/{id}
```

**创建导出模板：**
```json
{
  "name": "月度销售报表",
  "type": "orders",
  "description": "每月销售数据导出模板",
  "config": {
    "export_format": "excel",
    "fields": ["order_no", "customer_name", "total_amount", "status"],
    "filters": {
      "status": ["confirmed", "completed"]
    },
    "sort": {
      "field": "created_at",
      "order": "desc"
    }
  },
  "is_public": true,
  "schedule": {
    "enabled": true,
    "cron": "0 9 1 * *",
    "timezone": "Asia/Shanghai"
  }
}
```

### 定时导出任务
```
GET /exports/scheduled_tasks
POST /exports/scheduled_tasks
PUT /exports/scheduled_tasks/{id}
DELETE /exports/scheduled_tasks/{id}
```

**创建定时导出：**
```json
{
  "name": "每日线索导出",
  "template_id": "template_123",
  "schedule": {
    "cron": "0 8 * * *",
    "timezone": "Asia/Shanghai"
  },
  "notification": {
    "email": ["manager@example.com"],
    "webhook": "https://webhook.example.com/export-completed"
  },
  "retention_days": 30,
  "enabled": true
}
```

## 🔔 实时通知接口

### WebSocket 连接
```
WebSocket: wss://api.l2c.luolai.com/ws
```

**连接参数：**
```
Authorization: Bearer {jwt_token}
client_type: web|mobile|desktop
client_version: 1.0.0
user_id: 123
```

**连接建立响应：**
```json
{
  "type": "connection_established",
  "data": {
    "connection_id": "conn_123456",
    "user_id": 123,
    "connected_at": "2025-01-21T10:30:00Z",
    "heartbeat_interval": 30000
  }
}
```

### 心跳机制
**客户端发送：**
```json
{
  "type": "ping",
  "timestamp": "2025-01-21T10:30:00Z"
}
```

**服务端响应：**
```json
{
  "type": "pong",
  "timestamp": "2025-01-21T10:30:00Z",
  "server_time": "2025-01-21T10:30:01Z"
}
```

### 订阅通知类型
```json
{
  "type": "subscribe",
  "data": {
    "channels": [
      "leads.assigned",
      "orders.status_changed",
      "messages.new",
      "system.announcements",
      "tasks.deadline_reminder"
    ]
  }
}
```

**订阅响应：**
```json
{
  "type": "subscription_confirmed",
  "data": {
    "subscribed_channels": [
      "leads.assigned",
      "orders.status_changed",
      "messages.new",
      "system.announcements",
      "tasks.deadline_reminder"
    ],
    "subscription_id": "sub_789012"
  }
}
```

### 线索分配通知
```json
{
  "type": "notification",
  "channel": "leads.assigned",
  "data": {
    "notification_id": "notif_123456",
    "title": "新线索分配",
    "message": "您有一个新的线索需要跟进",
    "lead": {
      "id": 123,
      "lead_no": "LD20250121001",
      "customer_name": "张三",
      "phone": "13800138000",
      "source": "官网咨询",
      "intention": "high",
      "assigned_by": {
        "id": 456,
        "name": "销售主管"
      }
    },
    "action_required": true,
    "actions": [
      {
        "type": "view_detail",
        "text": "查看详情",
        "url": "/leads/123"
      },
      {
        "type": "contact_customer",
        "text": "联系客户",
        "url": "/leads/123/contact"
      }
    ],
    "priority": "high",
    "created_at": "2025-01-21T10:30:00Z",
    "expires_at": "2025-01-21T18:30:00Z"
  }
}
```

### 订单状态变更通知
```json
{
  "type": "notification",
  "channel": "orders.status_changed",
  "data": {
    "notification_id": "notif_234567",
    "title": "订单状态更新",
    "message": "订单 OR20250121001 已确认",
    "order": {
      "id": 456,
      "order_no": "OR20250121001",
      "customer_name": "李四",
      "total_amount": 15800,
      "old_status": "pending",
      "new_status": "confirmed",
      "status_changed_by": {
        "id": 789,
        "name": "订单专员"
      }
    },
    "action_required": false,
    "priority": "medium",
    "created_at": "2025-01-21T10:35:00Z"
  }
}
```

### 新消息通知
```json
{
  "type": "notification",
  "channel": "messages.new",
  "data": {
    "notification_id": "notif_345678",
    "title": "新消息",
    "message": "您收到一条新的客户消息",
    "conversation": {
      "id": 789,
      "customer": {
        "id": 123,
        "name": "王五",
        "avatar": "https://cdn.l2c.luolai.com/avatars/123.jpg"
      },
      "message": {
        "id": 1001,
        "content": "请问这个产品什么时候能到货？",
        "type": "text",
        "sent_at": "2025-01-21T10:32:00Z"
      },
      "unread_count": 3
    },
    "action_required": true,
    "actions": [
      {
        "type": "reply",
        "text": "立即回复",
        "url": "/messages/789"
      }
    ],
    "priority": "high",
    "created_at": "2025-01-21T10:32:00Z"
  }
}
```

### 系统公告通知
```json
{
  "type": "notification",
  "channel": "system.announcements",
  "data": {
    "notification_id": "notif_456789",
    "title": "系统维护通知",
    "message": "系统将于今晚22:00-24:00进行维护升级",
    "announcement": {
      "id": 101,
      "type": "maintenance",
      "content": "为了提供更好的服务体验，系统将于2025年1月21日22:00-24:00进行维护升级，期间可能影响部分功能使用，请提前做好相关准备。",
      "start_time": "2025-01-21T22:00:00Z",
      "end_time": "2025-01-22T00:00:00Z",
      "affected_modules": ["订单管理", "库存管理"]
    },
    "action_required": false,
    "priority": "medium",
    "created_at": "2025-01-21T10:00:00Z"
  }
}
```

### 任务截止提醒
```json
{
  "type": "notification",
  "channel": "tasks.deadline_reminder",
  "data": {
    "notification_id": "notif_567890",
    "title": "任务截止提醒",
    "message": "您有2个任务即将到期",
    "tasks": [
      {
        "id": 201,
        "title": "客户回访",
        "customer_name": "赵六",
        "deadline": "2025-01-21T18:00:00Z",
        "priority": "high",
        "time_remaining": "7小时30分钟"
      },
      {
        "id": 202,
        "title": "报价单制作",
        "customer_name": "孙七",
        "deadline": "2025-01-22T09:00:00Z",
        "priority": "medium",
        "time_remaining": "22小时30分钟"
      }
    ],
    "action_required": true,
    "actions": [
      {
        "type": "view_tasks",
        "text": "查看任务",
        "url": "/tasks"
      }
    ],
    "priority": "high",
    "created_at": "2025-01-21T10:30:00Z"
  }
}
```

### 通知确认
```json
{
  "type": "notification_ack",
  "data": {
    "notification_id": "notif_123456",
    "action": "read|dismissed|completed"
  }
}
```

**服务端响应：**
```json
{
  "type": "notification_ack_response",
  "data": {
    "notification_id": "notif_123456",
    "status": "acknowledged",
    "acknowledged_at": "2025-01-21T10:35:00Z"
  }
}
```

### Server-Sent Events (SSE) 接口
```
GET /notifications/stream
```

**请求头：**
```
Authorization: Bearer {jwt_token}
Accept: text/event-stream
Cache-Control: no-cache
```

**响应格式：**
```
Content-Type: text/event-stream
Connection: keep-alive

event: connection_established
data: {"connection_id":"sse_123456","user_id":123,"connected_at":"2025-01-21T10:30:00Z"}

event: notification
data: {"type":"notification","channel":"leads.assigned","data":{...}}

event: heartbeat
data: {"timestamp":"2025-01-21T10:31:00Z"}
```

### 通知历史查询
```
GET /notifications/history
```

**查询参数：**
```
page=1
page_size=20
channel=leads.assigned|orders.status_changed|messages.new
status=unread|read|dismissed
start_date=2025-01-01
end_date=2025-01-31
priority=high|medium|low
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 50,
    "unread_count": 8,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "notification_id": "notif_123456",
        "channel": "leads.assigned",
        "title": "新线索分配",
        "message": "您有一个新的线索需要跟进",
        "priority": "high",
        "status": "unread",
        "action_required": true,
        "data": {...},
        "created_at": "2025-01-21T10:30:00Z",
        "read_at": null,
        "expires_at": "2025-01-21T18:30:00Z"
      }
    ]
  }
}
```

### 标记通知为已读
```
PUT /notifications/{notification_id}/read
```

**响应参数：**
```json
{
  "code": 200,
  "message": "标记成功",
  "data": {
    "notification_id": "notif_123456",
    "status": "read",
    "read_at": "2025-01-21T10:35:00Z"
  }
}
```

### 批量标记已读
```
PUT /notifications/batch_read
```

**请求参数：**
```json
{
  "notification_ids": ["notif_123", "notif_456", "notif_789"],
  "mark_all": false,
  "channel": "leads.assigned"
}
```

### 通知设置管理
```
GET /notifications/settings
PUT /notifications/settings
```

**获取通知设置：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "channels": {
      "leads.assigned": {
        "enabled": true,
        "push_enabled": true,
        "email_enabled": false,
        "sound_enabled": true,
        "priority_filter": ["high", "medium"]
      },
      "orders.status_changed": {
        "enabled": true,
        "push_enabled": true,
        "email_enabled": true,
        "sound_enabled": false,
        "priority_filter": ["high"]
      },
      "messages.new": {
        "enabled": true,
        "push_enabled": true,
        "email_enabled": false,
        "sound_enabled": true,
        "priority_filter": ["high", "medium", "low"]
      }
    },
    "global_settings": {
      "do_not_disturb": {
        "enabled": false,
        "start_time": "22:00",
        "end_time": "08:00"
      },
      "max_notifications_per_hour": 50,
      "auto_dismiss_after_hours": 24
    }
  }
}
```

**更新通知设置：**
```json
{
  "channels": {
    "leads.assigned": {
      "enabled": true,
      "push_enabled": true,
      "email_enabled": false,
      "sound_enabled": true,
      "priority_filter": ["high", "medium"]
    }
  },
  "global_settings": {
    "do_not_disturb": {
      "enabled": true,
      "start_time": "22:00",
      "end_time": "08:00"
    }
  }
}
```

### 推送通知注册
```
POST /notifications/push/register
```

**请求参数：**
```json
{
  "device_type": "web|ios|android",
  "device_token": "device_token_123456",
  "device_info": {
    "model": "iPhone 13",
    "os_version": "iOS 15.0",
    "app_version": "1.0.0"
  },
  "timezone": "Asia/Shanghai"
}
```

### 发送测试通知
```
POST /notifications/test
```

**请求参数：**
```json
{
  "channel": "system.test",
  "title": "测试通知",
  "message": "这是一条测试通知",
  "priority": "low"
}
```

### 通知统计
```
GET /notifications/stats
```

**查询参数：**
```
date_range=7d|30d|90d
group_by=channel|priority|status
```

**响应参数：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total_sent": 1250,
    "total_read": 980,
    "total_dismissed": 150,
    "read_rate": 78.4,
    "by_channel": {
      "leads.assigned": {
        "sent": 450,
        "read": 380,
        "read_rate": 84.4
      },
      "orders.status_changed": {
        "sent": 320,
        "read": 280,
        "read_rate": 87.5
      }
    },
    "by_priority": {
      "high": {
        "sent": 200,
        "read": 190,
        "read_rate": 95.0
      },
      "medium": {
        "sent": 650,
        "read": 520,
        "read_rate": 80.0
      },
      "low": {
        "sent": 400,
        "read": 270,
        "read_rate": 67.5
      }
    }
  }
}
```

## ✅ 审批流程接口

### 创建审批申请
```
POST /approvals
```

**请求参数：**
```json
{
  "type": "discount|refund|special_order",
  "title": "特殊折扣申请",
  "content": "申请内容描述",
  "related_id": "order_123",
  "related_type": "order",
  "attachments": ["file_123", "file_456"],
  "urgency": "normal|urgent|critical"
}
```

### 获取审批列表
```
GET /approvals?status=pending&type=discount&assignee=user_123&page=1&limit=20
```

### 获取审批详情
```
GET /approvals/{id}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "approval_123",
    "type": "discount",
    "title": "特殊折扣申请",
    "content": "客户要求8折优惠",
    "status": "pending",
    "current_step": 1,
    "total_steps": 2,
    "workflow": [
      {
        "step": 1,
        "approver": "manager_123",
        "status": "pending",
        "assigned_at": "2025-01-21T10:00:00Z"
      }
    ],
    "created_by": "user_123",
    "created_at": "2025-01-21T10:00:00Z"
  }
}
```

### 处理审批
```
POST /approvals/{id}/process
```

**请求参数：**
```json
{
  "action": "approve|reject|return",
  "comments": "审批意见",
  "attachments": ["file_789"]
}
```

### 获取我的待办审批
```
GET /approvals/pending?assignee=current_user
```

## 📊 报表分析接口

### 获取销售报表
```
GET /reports/sales?start_date=2025-01-01&end_date=2025-01-31&group_by=day
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": {
      "total_sales": 150000.00,
      "total_orders": 45,
      "avg_order_value": 3333.33,
      "growth_rate": 0.15
    },
    "details": [
      {
        "date": "2025-01-01",
        "sales": 5000.00,
        "orders": 2,
        "customers": 2
      }
    ]
  }
}
```

### 获取客户分析报表
```
GET /reports/customers?period=month&metrics=acquisition,retention,value
```

### 获取产品销售分析
```
GET /reports/products?category=curtains&sort_by=sales_volume&limit=10
```

### 导出报表
```
POST /reports/export
```

**请求参数：**
```json
{
  "report_type": "sales|customers|products",
  "format": "excel|pdf|csv",
  "filters": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31",
    "category": "curtains"
  }
}
```

## 🔧 系统管理接口

### 获取系统配置
```
GET /system/config?module=notification&key=email_settings
```

### 更新系统配置
```
PUT /system/config
```

**请求参数：**
```json
{
  "module": "notification",
  "key": "email_settings",
  "value": {
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "username": "noreply@luolai.com"
  },
  "description": "邮件服务器配置"
}
```

### 获取操作日志
```
GET /system/logs?module=user&action=login&start_date=2025-01-01&page=1&limit=50
```

### 系统健康检查
```
GET /system/health
```

**响应示例：**
```json
{
  "code": 200,
  "message": "系统运行正常",
  "data": {
    "status": "healthy",
    "database": "connected",
    "redis": "connected",
    "external_services": {
      "payment": "healthy",
      "sms": "healthy",
      "email": "healthy"
    },
    "uptime": "72h 30m 15s",
    "memory_usage": "65%",
    "cpu_usage": "23%"
  }
}
```

### 清理系统缓存
```
POST /system/cache/clear
```

**请求参数：**
```json
{
  "cache_types": ["user_sessions", "product_cache", "report_cache"],
  "force": false
}
```

## 📝 接口版本管理

### 版本策略
```
v1.0 - 初始版本，包含核心功能
v1.1 - 增加积分商城功能
v1.2 - 增加高级报表功能
v1.3 - 增加测量、安装、产品、报价、文件、审批、系统管理功能
```

### 向后兼容
```
- 新增字段不影响现有接口
- 废弃字段保留至少一个版本
- 重大变更通过新版本号发布
```

---
**文档版本**：v1.3  
**最后更新**：2025年1月21日  
**下次评审**：2025年2月21日
