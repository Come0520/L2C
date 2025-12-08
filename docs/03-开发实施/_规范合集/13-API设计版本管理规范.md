# 罗莱L2C销售管理系统 - API设计与版本管理规范

## 🎯 规范目标

### 主要目标
- **一致性**：确保API设计风格统一，便于理解和使用
- **可维护性**：建立清晰的版本管理策略，支持平滑升级
- **可扩展性**：设计灵活的API架构，支持业务发展需求
- **向后兼容**：保证API版本升级时的向后兼容性
- **开发效率**：提供完善的API文档和开发工具

## 📋 RESTful API 设计规范

### 1. URL设计原则
```javascript
// ✅ 正确的URL设计
GET    /api/v1/customers                    // 获取客户列表
POST   /api/v1/customers                    // 创建新客户
GET    /api/v1/customers/{id}               // 获取指定客户
PUT    /api/v1/customers/{id}               // 更新指定客户
DELETE /api/v1/customers/{id}               // 删除指定客户

// 嵌套资源
GET    /api/v1/customers/{id}/orders        // 获取客户的订单
POST   /api/v1/customers/{id}/orders        // 为客户创建订单
GET    /api/v1/orders/{id}/items            // 获取订单项
POST   /api/v1/orders/{id}/items            // 添加订单项

// 操作性API
POST   /api/v1/customers/{id}/activate      // 激活客户
POST   /api/v1/orders/{id}/confirm          // 确认订单
POST   /api/v1/orders/{id}/cancel           // 取消订单
POST   /api/v1/leads/{id}/convert           // 转化线索

// ❌ 错误的URL设计
GET    /api/v1/getCustomers                 // 不要在URL中使用动词
POST   /api/v1/customer                     // 资源名应使用复数
GET    /api/v1/customers/getById/123        // 不要使用冗余路径
```

### 2. HTTP方法使用规范
```javascript
// HTTP方法语义
const HTTP_METHODS = {
  GET: '获取资源，幂等操作',
  POST: '创建资源，非幂等操作',
  PUT: '完整更新资源，幂等操作',
  PATCH: '部分更新资源，非幂等操作',
  DELETE: '删除资源，幂等操作',
  HEAD: '获取资源头信息',
  OPTIONS: '获取资源支持的方法'
};

// ✅ 正确使用示例
// 获取资源
GET /api/v1/customers?page=1&size=20&status=active

// 创建资源
POST /api/v1/customers
Content-Type: application/json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}

// 完整更新资源
PUT /api/v1/customers/123
Content-Type: application/json
{
  "name": "张三",
  "phone": "13800138001",
  "email": "zhangsan@example.com",
  "address": "上海市浦东新区"
}

// 部分更新资源
PATCH /api/v1/customers/123
Content-Type: application/json
{
  "phone": "13800138001"
}

// 删除资源
DELETE /api/v1/customers/123
```

### 3. 查询参数规范
```javascript
// ✅ 查询参数设计规范

// 分页参数
GET /api/v1/customers?page=1&size=20&sort=createdAt:desc

// 过滤参数
GET /api/v1/customers?status=active&level=vip&region=shanghai

// 搜索参数
GET /api/v1/customers?search=张三&searchFields=name,phone

// 字段选择
GET /api/v1/customers?fields=id,name,phone,email

// 关联查询
GET /api/v1/customers?include=orders,leads&exclude=internalNotes

// 日期范围查询
GET /api/v1/orders?startDate=2024-01-01&endDate=2024-01-31

// 复杂查询示例
GET /api/v1/customers?status=active&level=vip&createdAfter=2024-01-01&sort=lastOrderDate:desc&page=1&size=20&fields=id,name,phone,totalOrders
```

## 🔄 API版本管理策略

### 1. 版本控制方案
```javascript
// 版本控制策略
const VERSION_STRATEGIES = {
  // 方案1：URL路径版本控制（推荐）
  urlPath: {
    example: '/api/v1/customers',
    pros: ['清晰直观', '易于缓存', '支持不同版本并存'],
    cons: ['URL较长']
  },
  
  // 方案2：请求头版本控制
  header: {
    example: 'API-Version: v1',
    pros: ['URL简洁', '灵活性高'],
    cons: ['不够直观', '缓存复杂']
  },
  
  // 方案3：查询参数版本控制
  queryParam: {
    example: '/api/customers?version=v1',
    pros: ['简单易用'],
    cons: ['容易被忽略', '不够规范']
  }
};

// 采用URL路径版本控制
const API_VERSIONS = {
  v1: {
    baseUrl: '/api/v1',
    status: 'stable',
    supportUntil: '2025-12-31',
    features: ['基础CRUD', '简单查询', '基础认证']
  },
  v2: {
    baseUrl: '/api/v2',
    status: 'beta',
    supportUntil: '2026-12-31',
    features: ['增强查询', '批量操作', 'GraphQL支持', '高级认证']
  }
};
```

### 2. 版本兼容性策略
```javascript
// 版本兼容性规则
const COMPATIBILITY_RULES = {
  // 向后兼容的变更（补丁版本）
  backwardCompatible: [
    '新增可选字段',
    '新增API端点',
    '修复bug',
    '性能优化',
    '新增响应字段（不影响现有字段）'
  ],
  
  // 可能破坏兼容性的变更（主版本）
  breakingChanges: [
    '删除API端点',
    '删除请求/响应字段',
    '修改字段类型',
    '修改字段含义',
    '修改HTTP状态码',
    '修改错误码结构'
  ],
  
  // 弃用策略
  deprecation: {
    warningPeriod: '6个月',    // 弃用警告期
    supportPeriod: '12个月',   // 继续支持期
    removalNotice: '3个月'     // 移除通知期
  }
};

// 版本弃用响应头
const deprecationHeaders = {
  'Deprecation': 'true',
  'Sunset': '2024-12-31T23:59:59Z',
  'Link': '</api/v2/customers>; rel="successor-version"'
};
```

### 3. 版本迁移指南
```javascript
// API版本迁移示例
const MIGRATION_GUIDE = {
  'v1_to_v2': {
    // 字段重命名
    fieldRenames: {
      'customer_id': 'customerId',
      'created_time': 'createdAt',
      'updated_time': 'updatedAt'
    },
    
    // 新增必填字段
    newRequiredFields: ['timezone'],
    
    // 删除字段
    removedFields: ['legacy_field'],
    
    // 数据类型变更
    typeChanges: {
      'amount': 'string -> number',
      'date': 'string -> ISO8601'
    },
    
    // 行为变更
    behaviorChanges: [
      '分页默认大小从10改为20',
      '排序默认改为按创建时间倒序',
      '错误响应格式标准化'
    ]
  }
};

// 自动迁移工具
class APIVersionMigrator {
  static migrateV1ToV2(v1Response) {
    return {
      ...v1Response,
      customerId: v1Response.customer_id,
      createdAt: new Date(v1Response.created_time).toISOString(),
      updatedAt: new Date(v1Response.updated_time).toISOString(),
      // 移除旧字段
      customer_id: undefined,
      created_time: undefined,
      updated_time: undefined
    };
  }
}
```

## 📝 请求响应规范

### 1. 请求格式规范
```javascript
// ✅ 标准请求格式

// 创建客户请求
POST /api/v1/customers
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "address": {
    "province": "上海市",
    "city": "上海市",
    "district": "浦东新区",
    "detail": "张江路123号"
  },
  "tags": ["VIP", "重点客户"],
  "source": "ONLINE",
  "assignedTo": "sales001"
}

// 批量操作请求
POST /api/v1/customers/batch
Content-Type: application/json

{
  "operation": "update",
  "items": [
    {
      "id": 123,
      "data": { "status": "active" }
    },
    {
      "id": 124,
      "data": { "status": "inactive" }
    }
  ]
}

// 文件上传请求
POST /api/v1/customers/123/avatar
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

[binary data]
--boundary--
```

### 2. 响应格式规范
```javascript
// ✅ 标准响应格式

// 成功响应（单个资源）
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 120ms

{
  "success": true,
  "data": {
    "id": 123,
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "status": "active",
    "level": "VIP",
    "totalOrders": 15,
    "totalAmount": 50000.00,
    "lastOrderDate": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "version": 3
  },
  "meta": {
    "timestamp": "2024-01-16T10:00:00Z",
    "version": "v1"
  }
}

// 成功响应（列表资源）
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "name": "张三",
        "phone": "13800138000",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "timestamp": "2024-01-16T10:00:00Z",
    "version": "v1"
  }
}

// 创建成功响应
HTTP/1.1 201 Created
Location: /api/v1/customers/123

{
  "success": true,
  "data": {
    "id": 123,
    "name": "张三",
    "phone": "13800138000"
  },
  "message": "客户创建成功"
}

// 错误响应
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求数据验证失败",
    "details": [
      {
        "field": "phone",
        "code": "INVALID_FORMAT",
        "message": "电话号码格式不正确"
      },
      {
        "field": "email",
        "code": "ALREADY_EXISTS",
        "message": "邮箱地址已存在"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-16T10:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 3. HTTP状态码规范
```javascript
// HTTP状态码使用规范
const HTTP_STATUS_CODES = {
  // 2xx 成功
  200: 'OK - 请求成功',
  201: 'Created - 资源创建成功',
  202: 'Accepted - 请求已接受，异步处理中',
  204: 'No Content - 请求成功，无返回内容',
  
  // 3xx 重定向
  301: 'Moved Permanently - 资源永久移动',
  302: 'Found - 资源临时移动',
  304: 'Not Modified - 资源未修改',
  
  // 4xx 客户端错误
  400: 'Bad Request - 请求参数错误',
  401: 'Unauthorized - 未认证',
  403: 'Forbidden - 无权限',
  404: 'Not Found - 资源不存在',
  405: 'Method Not Allowed - 方法不允许',
  409: 'Conflict - 资源冲突',
  422: 'Unprocessable Entity - 数据验证失败',
  429: 'Too Many Requests - 请求频率超限',
  
  // 5xx 服务器错误
  500: 'Internal Server Error - 服务器内部错误',
  502: 'Bad Gateway - 网关错误',
  503: 'Service Unavailable - 服务不可用',
  504: 'Gateway Timeout - 网关超时'
};

// 业务错误码规范
const BUSINESS_ERROR_CODES = {
  // 通用错误 (1000-1999)
  VALIDATION_ERROR: 1001,
  AUTHENTICATION_FAILED: 1002,
  AUTHORIZATION_FAILED: 1003,
  RESOURCE_NOT_FOUND: 1004,
  RESOURCE_CONFLICT: 1005,
  
  // 客户相关错误 (2000-2999)
  CUSTOMER_NOT_FOUND: 2001,
  CUSTOMER_ALREADY_EXISTS: 2002,
  CUSTOMER_INACTIVE: 2003,
  
  // 订单相关错误 (3000-3999)
  ORDER_NOT_FOUND: 3001,
  ORDER_CANNOT_MODIFY: 3002,
  ORDER_ALREADY_CANCELLED: 3003,
  INSUFFICIENT_INVENTORY: 3004,
  
  // 支付相关错误 (4000-4999)
  PAYMENT_FAILED: 4001,
  PAYMENT_TIMEOUT: 4002,
  INSUFFICIENT_BALANCE: 4003
};
```

## 🔐 API安全规范

### 1. 认证授权
```javascript
// JWT Token认证
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: '需要认证令牌'
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌'
      }
    });
  }
};

// API Key认证
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: '无效的API密钥'
      }
    });
  }
  
  next();
};
```

### 2. 权限控制
```javascript
// 基于角色的权限控制
const rbacMiddleware = (requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '权限不足',
          required: requiredPermissions,
          current: userPermissions
        }
      });
    }
    
    next();
  };
};

// 使用示例
app.get('/api/v1/customers',
  authMiddleware,
  rbacMiddleware(['customer:read']),
  getCustomers
);

app.post('/api/v1/customers',
  authMiddleware,
  rbacMiddleware(['customer:create']),
  createCustomer
);

app.delete('/api/v1/customers/:id',
  authMiddleware,
  rbacMiddleware(['customer:delete']),
  deleteCustomer
);
```

### 3. 限流防护
```javascript
// API限流配置
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// 不同级别的限流
const rateLimiters = {
  // 通用API限流
  general: createRateLimiter(
    15 * 60 * 1000, // 15分钟
    1000,           // 1000次请求
    '请求频率过高，请稍后再试'
  ),
  
  // 认证API限流
  auth: createRateLimiter(
    15 * 60 * 1000, // 15分钟
    5,              // 5次尝试
    '登录尝试次数过多，请15分钟后再试'
  ),
  
  // 创建操作限流
  create: createRateLimiter(
    60 * 1000,      // 1分钟
    10,             // 10次创建
    '创建操作过于频繁，请稍后再试'
  )
};

// 应用限流
app.use('/api/v1/auth', rateLimiters.auth);
app.use('/api/v1', rateLimiters.general);
app.post('/api/v1/customers', rateLimiters.create);
```

## 📚 API文档规范

### 1. OpenAPI规范
```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: 罗莱L2C销售管理系统API
  description: 罗莱L2C销售管理系统的RESTful API文档
  version: 1.0.0
  contact:
    name: API支持团队
    email: api-support@l2c.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.l2c.com/v1
    description: 生产环境
  - url: https://api-staging.l2c.com/v1
    description: 预发布环境
  - url: http://localhost:3100/api/v1
    description: 开发环境

paths:
  /customers:
    get:
      summary: 获取客户列表
      description: 分页获取客户列表，支持多种过滤和排序选项
      tags:
        - 客户管理
      parameters:
        - name: page
          in: query
          description: 页码（从1开始）
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: size
          in: query
          description: 每页数量
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: status
          in: query
          description: 客户状态过滤
          required: false
          schema:
            type: string
            enum: [active, inactive, pending]
      responses:
        '200':
          description: 成功获取客户列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustomerListResponse'
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      security:
        - bearerAuth: []

components:
  schemas:
    Customer:
      type: object
      required:
        - name
        - phone
      properties:
        id:
          type: integer
          format: int64
          description: 客户ID
          example: 123
        name:
          type: string
          description: 客户姓名
          example: "张三"
        phone:
          type: string
          description: 电话号码
          example: "13800138000"
        email:
          type: string
          format: email
          description: 邮箱地址
          example: "zhangsan@example.com"
        status:
          type: string
          enum: [active, inactive, pending]
          description: 客户状态
          example: "active"
        createdAt:
          type: string
          format: date-time
          description: 创建时间
          example: "2024-01-01T09:00:00Z"

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### 2. API文档生成
```javascript
// swagger配置
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '罗莱L2C销售管理系统API',
      version: '1.0.0',
      description: 'RESTful API文档'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3100/api/v1',
        description: '开发环境'
      }
    ]
  },
  apis: ['./routes/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

// 文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'L2C API文档'
}));

// JSDoc注释示例
/**
 * @swagger
 * /customers:
 *   get:
 *     summary: 获取客户列表
 *     tags: [客户管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *     responses:
 *       200:
 *         description: 成功获取客户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 */
```

## 🧪 API测试规范

### 1. 单元测试
```javascript
// API单元测试示例
const request = require('supertest');
const app = require('../app');

describe('Customer API', () => {
  describe('GET /api/v1/customers', () => {
    it('应该返回客户列表', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/customers?page=2&size=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.size).toBe(10);
    });

    it('无效token应该返回401', async () => {
      await request(app)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/v1/customers', () => {
    it('应该创建新客户', async () => {
      const customerData = {
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', 'Bearer valid-token')
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(customerData.name);
    });

    it('缺少必填字段应该返回400', async () => {
      const invalidData = {
        name: '测试客户'
        // 缺少phone字段
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 2. 集成测试
```javascript
// API集成测试
describe('Customer Workflow Integration', () => {
  let customerId;
  let authToken;

  beforeAll(async () => {
    // 获取认证token
    const authResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    authToken = authResponse.body.data.accessToken;
  });

  it('完整的客户管理流程', async () => {
    // 1. 创建客户
    const createResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '集成测试客户',
        phone: '13900139000',
        email: 'integration@test.com'
      })
      .expect(201);

    customerId = createResponse.body.data.id;

    // 2. 获取客户详情
    const getResponse = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.data.name).toBe('集成测试客户');

    // 3. 更新客户信息
    await request(app)
      .put(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '更新后的客户',
        phone: '13900139000',
        email: 'updated@test.com'
      })
      .expect(200);

    // 4. 验证更新结果
    const updatedResponse = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(updatedResponse.body.data.name).toBe('更新后的客户');

    // 5. 删除客户
    await request(app)
      .delete(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // 6. 验证删除结果
    await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

## 📊 API监控与分析

### 1. 性能监控
```javascript
// API性能监控中间件
const responseTime = require('response-time');
const prometheus = require('prom-client');

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP请求持续时间',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'HTTP请求总数',
  labelNames: ['method', 'route', 'status_code']
});

// 监控中间件
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

app.use(monitoringMiddleware);

// 指标端点
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### 2. 错误追踪
```javascript
// 错误追踪中间件
const errorTrackingMiddleware = (err, req, res, next) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  // 记录错误日志
  logger.error('API Error', errorInfo);

  // 发送到错误追踪服务
  if (process.env.NODE_ENV === 'production') {
    sendToErrorTracking(errorInfo);
  }

  // 返回错误响应
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message
    }
  });
};

app.use(errorTrackingMiddleware);
```

## 🚀 最佳实践

### 1. API设计最佳实践
```javascript
// ✅ API设计最佳实践

// 1. 使用名词而非动词
GET /api/v1/customers        // ✅ 正确
GET /api/v1/getCustomers     // ❌ 错误

// 2. 使用复数形式
GET /api/v1/customers        // ✅ 正确
GET /api/v1/customer         // ❌ 错误

// 3. 使用嵌套表示关系
GET /api/v1/customers/123/orders  // ✅ 正确
GET /api/v1/customerOrders?customerId=123  // ❌ 错误

// 4. 使用查询参数进行过滤
GET /api/v1/customers?status=active&level=vip  // ✅ 正确

// 5. 提供有意义的HTTP状态码
POST /api/v1/customers  // 201 Created
PUT /api/v1/customers/123  // 200 OK
DELETE /api/v1/customers/123  // 204 No Content

// 6. 支持字段选择
GET /api/v1/customers?fields=id,name,email  // ✅ 正确

// 7. 提供API版本控制
GET /api/v1/customers    // ✅ 正确
GET /api/customers       // ❌ 错误
```

### 2. 性能优化建议
```javascript
// 性能优化策略
const PERFORMANCE_TIPS = {
  // 1. 使用分页
  pagination: {
    defaultSize: 20,
    maxSize: 100,
    implementation: 'cursor-based' // 大数据集使用游标分页
  },
  
  // 2. 实现缓存
  caching: {
    redis: 'GET请求结果缓存',
    etag: 'HTTP ETag支持',
    lastModified: 'Last-Modified头支持'
  },
  
  // 3. 数据库优化
  database: {
    indexing: '为查询字段添加索引',
    connectionPool: '使用连接池',
    queryOptimization: '优化SQL查询'
  },
  
  // 4. 压缩响应
  compression: {
    gzip: '启用gzip压缩',
    brotli: '支持Brotli压缩'
  }
};

// 缓存中间件示例
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `api:${req.originalUrl}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      redis.setex(cacheKey, ttl, JSON.stringify(data));
      originalSend.call(this, data);
    };
    
    next();
  };
};
```

---

**注意事项：**
1. API设计应该保持一致性和可预测性
2. 版本管理策略应该在项目初期确定
3. 文档应该与代码同步更新
4. 安全性考虑应该贯穿整个API生命周期
5. 性能监控和错误追踪是生产环境的必需品