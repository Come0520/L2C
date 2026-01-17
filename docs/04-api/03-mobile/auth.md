# 移动端认证 API

> 移动端登录、登出、Token 刷新

## 模块概述

移动端认证模块负责移动端用户的认证和授权，包括登录、登出、Token 刷新等功能。

### 认证方式

移动端使用简化的认证方式：
- 使用手机号和密码登录
- 返回简化的 Token 格式
- Token 包含用户 ID 和时间戳

### Token 格式

移动端 Token 格式：

```
mk_{user_id}_{timestamp}
```

示例：

```
mk_550e8400-e29b-41d4-a716-446655440000_1642234567890
```

## API 接口

### 1. 登录

使用手机号和密码登录。

#### 接口信息

- **URL**: `POST /api/mobile/auth/login`
- **认证**: 不需要

#### 请求参数

```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| password | string | 是 | 密码 |

#### 响应示例

**成功响应**:

```json
{
  "success": true,
  "data": {
    "token": "mk_550e8400-e29b-41d4-a716-446655440000_1642234567890",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "张三",
      "phone": "13800138000",
      "avatar": "https://oss.example.com/avatar.jpg",
      "tenantId": "tenant_uuid",
      "roles": ["WORKER"]
    }
  }
}
```

**失败响应**:

```json
{
  "success": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "登录失败，手机号或密码错误"
  }
}
```

#### 业务规则

1. **用户验证**：
   - 检查手机号是否存在
   - 验证密码是否正确
   - 检查账户是否激活

2. **角色限制**：
   - 只允许 WORKER 角色登录
   - 其他角色需要使用 Web 端登录

3. **Token 生成**：
   - Token 包含用户 ID 和时间戳
   - Token 有效期 24 小时

### 2. 登出

退出登录。

#### 接口信息

- **URL**: `POST /api/mobile/auth/logout`
- **认证**: 需要

#### 请求参数

不需要请求参数。

#### 响应示例

```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 业务规则

1. **Token 撤销**：
   - 撤销当前 Token
   - 清除用户会话

2. **设备清理**：
   - 清除设备上的缓存数据
   - 清除离线数据

### 3. Token 刷新

刷新 Token。

#### 接口信息

- **URL**: `POST /api/mobile/auth/refresh`
- **认证**: 需要

#### 请求参数

不需要请求参数。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "token": "mk_550e8400-e29b-41d4-a716-446655440000_1642234567890"
  }
}
```

#### 业务规则

1. **Token 验证**：
   - 验证当前 Token 是否有效
   - 检查 Token 是否过期

2. **Token 刷新**：
   - 生成新的 Token
   - 新 Token 有效期 24 小时

3. **刷新限制**：
   - Token 过期前 1 小时可以刷新
   - 过期后需要重新登录

### 4. 修改密码

修改用户密码。

#### 接口信息

- **URL**: `POST /api/mobile/auth/change-password`
- **认证**: 需要

#### 请求参数

```json
{
  "oldPassword": "old_password123",
  "newPassword": "new_password123"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 |

#### 响应示例

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

#### 业务规则

1. **密码验证**：
   - 验证旧密码是否正确
   - 新密码不能与旧密码相同

2. **密码强度**：
   - 密码长度至少 6 位
   - 建议包含字母和数字

3. **Token 撤销**：
   - 修改密码后撤销所有 Token
   - 需要重新登录

### 5. 重置密码

重置密码（通过手机验证码）。

#### 接口信息

- **URL**: `POST /api/mobile/auth/reset-password`
- **认证**: 不需要

#### 请求参数

```json
{
  "phone": "13800138000",
  "verificationCode": "123456",
  "newPassword": "new_password123"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| verificationCode | string | 是 | 验证码 |
| newPassword | string | 是 | 新密码 |

#### 响应示例

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

#### 业务规则

1. **验证码验证**：
   - 验证验证码是否正确
   - 验证码有效期 5 分钟

2. **密码重置**：
   - 重置密码为新密码
   - 撤销所有 Token

### 6. 获取验证码

获取手机验证码。

#### 接口信息

- **URL**: `POST /api/mobile/auth/send-verification-code`
- **认证**: 不需要

#### 请求参数

```json
{
  "phone": "13800138000",
  "type": "RESET_PASSWORD"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| type | string | 是 | 验证码类型：RESET_PASSWORD/REGISTER |

#### 响应示例

```json
{
  "success": true,
  "message": "验证码已发送"
}
```

#### 业务规则

1. **发送频率**：
   - 同一手机号 1 分钟内只能发送 1 次
   - 同一手机号 1 天内最多发送 5 次

2. **验证码有效期**：
   - 验证码有效期 5 分钟

3. **验证码格式**：
   - 6 位数字
   - 随机生成

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| LOGIN_FAILED | 401 | 登录失败 |
| ACCOUNT_DISABLED | 403 | 账户已禁用 |
| INVALID_ROLE | 403 | 角色无效 |
| TOKEN_EXPIRED | 401 | Token 已过期 |
| TOKEN_INVALID | 401 | Token 无效 |
| OLD_PASSWORD_INCORRECT | 400 | 旧密码不正确 |
| VERIFICATION_CODE_INCORRECT | 400 | 验证码不正确 |
| VERIFICATION_CODE_EXPIRED | 400 | 验证码已过期 |
| SEND_TOO_FREQUENTLY | 429 | 发送过于频繁 |

## 最佳实践

1. **Token 存储**
   - 使用安全存储（如 Keychain）
   - 不要在本地存储明文密码

2. **Token 刷新**
   - 在 Token 过期前刷新
   - 避免用户频繁登录

3. **密码安全**
   - 使用强密码
   - 定期修改密码

4. **验证码处理**
   - 限制验证码发送频率
   - 提示验证码有效期
