-- 为 notification_queue 表添加幂等性 Token 字段
-- 用于防止重复发送通知
ALTER TABLE notification_queue ADD COLUMN idempotency_token VARCHAR(200);

-- 创建唯一索引：同一租户下相同 token 不能重复
CREATE UNIQUE INDEX unq_notif_queue_idempotency ON notification_queue (tenant_id, idempotency_token);
