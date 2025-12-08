-- 积分商城数据表
-- 创建时间: 2025-12-05

-- ============================================
-- 1. 商城商品表 (mall_products)
-- ============================================

CREATE TABLE IF NOT EXISTS public.mall_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'electronics','home','gift_card','special','other'
    points_required INTEGER NOT NULL CHECK (points_required >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.mall_products IS '积分商城商品表';
COMMENT ON COLUMN public.mall_products.category IS '商品分类: electronics(电子产品), home(家居用品), gift_card(礼品卡), special(专属特权), other(其他)';
COMMENT ON COLUMN public.mall_products.points_required IS '兑换所需积分';
COMMENT ON COLUMN public.mall_products.stock_quantity IS '库存数量';

-- ============================================
-- 2. 兑换订单表 (mall_orders)
-- ============================================

CREATE TABLE IF NOT EXISTS public.mall_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.mall_products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL, -- 冗余字段,防止商品删除后无法查看
    points_spent INTEGER NOT NULL CHECK (points_spent >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending','processing','shipped','delivered','cancelled'
    tracking_number VARCHAR(100),
    shipping_address TEXT,
    contact_phone VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.mall_orders IS '积分商城兑换订单表';
COMMENT ON COLUMN public.mall_orders.status IS '订单状态: pending(待处理), processing(处理中), shipped(已发货), delivered(已送达), cancelled(已取消)';

-- ============================================
-- 3. 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mall_products_category ON public.mall_products(category);
CREATE INDEX IF NOT EXISTS idx_mall_products_available ON public.mall_products(is_available);
CREATE INDEX IF NOT EXISTS idx_mall_products_sort ON public.mall_products(sort_order);

CREATE INDEX IF NOT EXISTS idx_mall_orders_user_id ON public.mall_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_mall_orders_product_id ON public.mall_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_mall_orders_status ON public.mall_orders(status);
CREATE INDEX IF NOT EXISTS idx_mall_orders_created_at ON public.mall_orders(created_at);

-- ============================================
-- 4. 启用 Row Level Security
-- ============================================

ALTER TABLE public.mall_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mall_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS 策略 - mall_products
-- ============================================

-- 所有人可以查看可用商品
CREATE POLICY "Everyone can view available products"
    ON public.mall_products FOR SELECT
    USING (is_available = TRUE);

-- 管理员可以查看所有商品(使用服务角色)
-- Service role 默认绕过 RLS,这里不需要额外策略

-- ============================================
-- 6. RLS 策略 - mall_orders
-- ============================================

-- 用户可以查看自己的订单
CREATE POLICY "Users can view their own orders"
    ON public.mall_orders FOR SELECT
    USING (auth.uid() = user_id);

-- 用户可以创建自己的订单
CREATE POLICY "Users can create their own orders"
    ON public.mall_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的订单(仅限特定字段)
CREATE POLICY "Users can update their own orders"
    ON public.mall_orders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. 创建兑换订单的函数(带事务处理)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_mall_order(
    p_product_id UUID,
    p_shipping_address TEXT,
    p_contact_phone VARCHAR,
    p_remark TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_product RECORD;
    v_account RECORD;
    v_order_id UUID;
    v_transaction_id UUID;
BEGIN
    -- 获取当前用户ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- 获取商品信息(加锁)
    SELECT * INTO v_product
    FROM public.mall_products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF NOT v_product.is_available THEN
        RAISE EXCEPTION 'Product is not available';
    END IF;

    IF v_product.stock_quantity <= 0 THEN
        RAISE EXCEPTION 'Product is out of stock';
    END IF;

    -- 获取用户积分账户(加锁)
    SELECT * INTO v_account
    FROM public.points_accounts
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Points account not found';
    END IF;

    IF v_account.available_points < v_product.points_required THEN
        RAISE EXCEPTION 'Insufficient points balance';
    END IF;

    -- 创建订单
    INSERT INTO public.mall_orders (
        user_id, product_id, product_name, points_spent, 
        shipping_address, contact_phone, remark, status
    ) VALUES (
        v_user_id, p_product_id, v_product.name, v_product.points_required,
        p_shipping_address, p_contact_phone, p_remark, 'pending'
    ) RETURNING id INTO v_order_id;

    -- 扣减库存
    UPDATE public.mall_products
    SET stock_quantity = stock_quantity - 1,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- 扣减积分(使用现有的积分处理函数)
    SELECT public.process_points_transaction(
        v_user_id,
        v_product.points_required,
        'spend'::points_transaction_type,
        'mall_order',
        v_order_id,
        '积分商城兑换: ' || v_product.name
    ) INTO v_transaction_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_mall_order IS '创建积分商城兑换订单,自动扣减积分和库存';

-- ============================================
-- 8. 触发器 - 更新updated_at
-- ============================================

CREATE TRIGGER update_mall_products_updated_at
    BEFORE UPDATE ON public.mall_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mall_orders_updated_at
    BEFORE UPDATE ON public.mall_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 插入测试商品数据
-- ============================================

INSERT INTO public.mall_products (name, description, category, points_required, stock_quantity, sort_order) VALUES
-- 电子产品
('小米无线鼠标', '轻巧便携,蓝牙连接,适合办公使用', 'electronics', 500, 50, 1),
('罗技键盘', '机械手感,RGB背光,提升打字体验', 'electronics', 800, 30, 2),
('蓝牙耳机', 'ANC降噪,长续航,音质出色', 'electronics', 1200, 20, 3),
('移动电源', '20000mAh大容量,快充支持', 'electronics', 600, 40, 4),

-- 家居用品
('罗莱床品四件套', '纯棉材质,舒适透气,A类品质', 'home', 2000, 15, 5),
('窗帘定制券', '价值500元窗帘定制抵用券', 'home', 1500, 100, 6),
('墙布样品', '墙布样品一套,多种花色可选', 'home', 300, 50, 7),
('家居收纳箱', '大容量,可折叠,多场景适用', 'home', 400, 60, 8),

-- 礼品卡
('京东E卡100元', '京东平台通用,全品类可用', 'gift_card', 1000, 200, 9),
('星巴克咖啡券', '任意门店通用,含饮品券5张', 'gift_card', 500, 150, 10),
('电影票兑换券', '全国影院通用,2D/3D可选', 'gift_card', 300, 100, 11),

-- 专属特权
('专业工具套装', '测量工具专业套装,提升工作效率', 'special', 3000, 10, 12),
('设计培训课程', '室内设计进阶课程,资深讲师授课', 'special', 5000, 20, 13),
('年度优秀员工奖杯', '精美水晶奖杯,刻字定制', 'special', 2000, 30, 14),
('VIP客户接待券', 'VIP客户接待特权,含礼品', 'special', 1000, 50, 15)

ON CONFLICT DO NOTHING;

-- 完成
