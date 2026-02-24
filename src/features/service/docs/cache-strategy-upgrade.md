# 服务模块缓存策略升级说明

> 版本：v1.0 | 最后更新：2026-02-23

---

## 现有缓存问题

当前 `service` 模块大量使用 `revalidatePath('/service/...')` 进行全页面级别缓存淘汰，存在：
- 任何工单状态变更 → 全部列表页重新渲染
- 多用户同时操作时，不必要的大量 RSC 重渲染

---

## 推荐升级方案：迁移至 revalidateTag

### 第 1 步：定义缓存 Tag 常量

```typescript
// src/features/service/cache-tags.ts
export const SERVICE_CACHE_TAGS = {
  INSTALL_LIST: 'install-task-list',
  INSTALL_DETAIL: (id: string) => `install-task-${id}`,
  MEASURE_LIST: 'measure-task-list',
  MEASURE_DETAIL: (id: string) => `measure-task-${id}`,
};
```

### 第 2 步：只读查询包裹 unstable_cache

```typescript
export const getInstallTasks = unstable_cache(
  async (tenantId: string, filters: {}) => {
    return db.query.installTasks.findMany({ where: ... });
  },
  ['install-tasks'],
  { tags: [SERVICE_CACHE_TAGS.INSTALL_LIST] }
);
```

### 第 3 步：写操作精准淘汰

```typescript
// 安装完成时，只淘汰该工单缓存及列表缓存
revalidateTag(SERVICE_CACHE_TAGS.INSTALL_DETAIL(taskId));
revalidateTag(SERVICE_CACHE_TAGS.INSTALL_LIST);
// 不再需要 revalidatePath('/service/installation')
```

---

## 预期收益

| 指标 | 改造前 | 改造后 |
|:---|:---|:---|
| 单次写操作触发的 RSC 重渲染范围 | 全页面 | 单实体 |
| 高并发下的数据库 QPS | 较高 | 降低 ~60% |
