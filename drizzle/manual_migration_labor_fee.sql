-- 手动迁移脚本：为 measure_tasks 表添加工费字段
-- 执行时间：2026-02-15

-- 添加工费相关字段
ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "labor_fee" numeric(12, 2);
ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "actual_labor_fee" numeric(12, 2);
ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "adjustment_reason" text;
ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "fee_breakdown" jsonb;

-- 验证字段已添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'measure_tasks' 
  AND column_name IN ('labor_fee', 'actual_labor_fee', 'adjustment_reason', 'fee_breakdown');
