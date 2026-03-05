-- 清理孤儿表 billing_payment_records 及其关联的 billing_payment_status 枚举
-- 该表的 Drizzle Schema 定义已被移除，但数据库中仍存在
-- 注意：payment_provider 枚举仍被 subscriptions 表使用，不做删除

DROP TABLE IF EXISTS "billing_payment_records";-->statement-breakpoint
DROP TYPE IF EXISTS "public"."billing_payment_status";