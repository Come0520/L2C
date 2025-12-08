## 目标
- 移除 Prisma，后端仅使用 Supabase 全套能力（Auth、PostgREST/RLS、RPC、Storage、Realtime、Edge Functions、Scheduling）。
- 所有数据访问统一走 Supabase；后端仅保留极少胶水层或直接以 Edge Functions 作为服务层。

## 范围
- 认证登录、权限与用户映射
- 数据模型与迁移治理
- 业务服务与查询/事务改造
- 缓存与性能（替代 Redis）
- 文件存储与访问控制
- Realtime 事件通知
- 部署编排与环境变量
- 测试与验收

## 方案概述
- 客户端与服务端均使用 `@supabase/supabase-js`；复杂逻辑通过 SQL/RPC 与 Edge Functions 实现。
- 数据安全通过 RLS + Policies；后端不再持有数据库直连凭据（仅 Edge Functions 使用 Service Role）。

## 认证与用户
- 启用 Supabase Auth；遵循“不使用邮箱”规则，采用手机号/OTP 登录或自定义 Provider。
- 在应用 `users` 表对齐 `supabase.auth.users`，保留映射字段 `supabase_uid`（`backend/prisma/schema.prisma:21` 参考），通过触发器/存储过程同步关键资料。
- JWT 校验改为 Supabase 的会话校验；移除自研刷新令牌逻辑，统一使用 Supabase 会话与 revoke 机制。

## 数据模型与迁移
- 将 Prisma 模型转为 SQL DDL（含 `@map` 字段映射）并作为 Supabase 迁移文件；后续全部用 Supabase CLI 管理迁移。
- 为关键表编写 RLS 策略与 Policies（按角色/用户归属/门店维度等）。
- 将“数据库缓存”改造成：
  - 物化视图 + 定期刷新（Supabase 任务/Edge Scheduled Functions）；
  - 或普通表带 TTL 字段并用触发器/调度清理；

## 业务服务改造
- 将 `backend/src/config/database.ts:1`（Prisma）、`services/*` 的查询/事务改为：
  - 简单 CRUD：直接 `supabase.from(...).select/insert/update/delete`（PostgREST）
  - 复杂事务与跨表写：SQL 函数 + RPC（`supabase.rpc('fn_name', params)`）
  - 批量/幂等：使用 `ON CONFLICT`、`upsert`、或存储过程包裹
- 积分引擎、订单聚合、统计分析：
  - 迁移到 SQL/RPC + 物化视图；必要时用 Edge Functions 执行业务编排

## 权限与安全
- 编写细粒度 RLS：按用户、角色、数据域（如 `created_by_id`, `assigned_to_id`）
- 后端（若保留）仅作 Supabase 会话验证与转发；敏感操作集中在 Edge Functions 使用 Service Role，避免泄露凭据

## 缓存与性能
- 替代 Redis：
  - 物化视图/汇总表 + 索引优化
  - RPC 统一返回聚合数据
  - 需要 TTL 的热点缓存用表记录 + 触发器/调度清理
- 将 `backend/src/services/cacheManagerService.ts` 改为封装 Supabase 访问；删除本地缓存层或仅保留 L1 内存

## 文件存储
- 使用 Supabase Storage（Buckets）替换本地/第三方存储；
- 通过 Policies 实现私有/公共访问控制；签名 URL 发放下载权限

## Realtime
- 关键表启用 Realtime；前端订阅变更（如订单/积分更新）
- 后端/Edge Functions 触发下游处理（如通知、审计）

## Edge Functions
- 将需要 Service Role 的敏感业务（批量任务、结算、积分确认）迁移到 Edge Functions；
- 对外提供 HTTP 入口，前端携带 Supabase 会话调用；函数内部校验权限

## 部署与环境
- 移除 Prisma 与任何数据库直连配置；
- `.env` 统一为 `SUPABASE_URL`、`SUPABASE_ANON_KEY`（前端）与 `SUPABASE_SERVICE_ROLE_KEY`（Edge Functions/后端最小胶水层）；
- 删除所有自建数据库/缓存容器编排

## 测试与验收
- 生成 Supabase TS 类型（CLI）并替代 Prisma 类型；
- 为 RPC/Edge Functions 编写集成测试（使用 Supabase Test Project 或本地仿真）
- 验收项：
  - 认证登录流（手机号/OTP）
  - RLS 下的按角色/用户数据隔离
  - 复杂事务功能（订单/积分）经 RPC 一次性提交
  - 物化视图/缓存表性能指标
  - Storage 文件上传/访问策略

## 交付物
- Supabase 迁移 SQL（表结构、索引、Policies、触发器、函数）
- Edge Functions 源码与部署配置
- 后端/前端改造后的 Supabase 客户端调用层
- 测试用例与 CI 更新

## 风险与回滚
- 复杂业务从 ORM 到 SQL/RPC 的迁移需要逐步验证；
- 保留小步回滚策略（保留旧服务路径直到新路径通过集成与性能验证）。

请确认以上迁移方案。我将按此计划逐步替换代码与配置、交付迁移文件和函数实现，并完成验证。