-- 添加 TRAINING 枚举值到 showroom_item_type
ALTER TYPE showroom_item_type ADD VALUE 'TRAINING';

-- 验证是否添加成功
SELECT enum_range(NULL::showroom_item_type);
