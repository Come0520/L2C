# API 版本管理机制

> L2C API 版本控制策略和升级指南

## 版本控制策略

### 版本格式

采用 URL 路径版本控制：

```
/api/v1/orders
/api/v2/orders  (未来版本)
```

### 版本生命周期

| 阶段 | 状态 | 说明 |
|------|------|------|
| Current | 活跃 | 当前推荐版本 |
| Deprecated | 弃用 | 仍可用，建议迁移 |
| Sunset | 日落 | 即将下线，6个月通知期 |
| Retired | 退役 | 已下线，返回 410 Gone |

### 当前版本状态

| API 版本 | 状态 | 发布日期 | 弃用日期 |
|----------|------|----------|----------|
| v1 | Current | 2026-01-15 | - |

## 版本变更策略

### 兼容性变更（Minor）

以下变更**不会**导致新版本：

- ✅ 新增可选字段
- ✅ 新增 API 端点
- ✅ 新增枚举值
- ✅ 扩展响应数据

### 破坏性变更（Major）

以下变更**需要**新版本：

- ❌ 删除字段
- ❌ 修改字段类型
- ❌ 移除 API 端点
- ❌ 修改认证方式
- ❌ 修改错误码

## 弃用通知

### 响应头

弃用 API 会在响应头中包含警告：

```
Deprecation: true
Sunset: Sat, 01 Jul 2026 00:00:00 GMT
Link: <https://api.l2c.example.com/docs/migration>; rel="successor-version"
```

### 弃用响应示例

```json
{
  "success": true,
  "data": { ... },
  "_deprecation": {
    "message": "此 API 版本已弃用，请迁移到 v2",
    "sunsetDate": "2026-07-01",
    "migrationGuide": "https://docs.l2c.example.com/migration/v1-to-v2"
  }
}
```

## 迁移指南模板

### v1 → v2 迁移（示例）

```diff
- GET /api/v1/orders?status=PENDING
+ GET /api/v2/orders?status=PENDING

响应变更：
- "total_amount": "10000.00"
+ "totalAmount": "10000.00"
```

## 客户端最佳实践

1. **指定版本**：始终在请求中明确指定版本
2. **监控弃用头**：检查 `Deprecation` 响应头
3. **测试新版本**：新版本发布后尽早测试
4. **计划迁移**：弃用通知后制定迁移计划

---

*更新日期：2026-01-20*
