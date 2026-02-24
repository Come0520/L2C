# Pricing (定价建议) 模块

## 模块定位
本模块是系统的“定价军师”，专职提供独立的价格参考和市场竞争分析数据。
**注意**：具体的报价计算逻辑（如折扣计算、阶梯价）位于 `quotes/calc-strategies`，而本模块侧重于“建议”。

## 核心功能
- **多维度价格统计**：聚合产品成本、阶梯底价、历史成交价。
- **市场热度分析**：统计近期报价分布和趋势。
- **品类竞价参考**：提供同品类产品的价格区间对比。
- **毛利预估**：基于建议价格实时预估毛利率。

## 技术架构
- **数据源**：`orders`, `orderItems`, `quotes`, `quoteItems`, `products`。
- **Server Action**：`getPricingHints` 使用 `drizzle-orm` 的 SQL 聚合函数进行高效计算。
- **前端组件**：`PriceReferencePanel` 提供三态加载和可视化趋势图。

## 性能设计
- 使用 `React cache()` 避免同一次渲染请求中的重复查询。
- (规划中) 引入 `unstable_cache` 对高频统计结果进行 Redis/内存级缓存。

## 权限说明
- 需要 `quotes:create` 权限方可查看定价参考。
- 强制执行 `tenantId` 数据隔离。
