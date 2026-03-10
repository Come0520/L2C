# 数据库操作安全规约

## 强制规则：多租户 WHERE 过滤

所有 `db.update()` / `db.delete()` 语句的 `.where()` 必须同时包含 `tenantId` 过滤。

✅ 正确：

```typescript
.where(and(eq(table.id, id), eq(table.tenantId, user.tenantId)))
```

❌ 错误（即使上方有 findFirst 验证）：

```typescript
.where(eq(table.id, id))
```

原因：TOCTOU（检查-使用时间差）窗口可被利用进行跨租户数据修改。确保使用数据库层面的严格过滤条件不仅是业务正确性的基础，也是避免租户数据越权（IDOR）的关键。
