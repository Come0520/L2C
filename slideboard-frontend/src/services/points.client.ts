import { createClient } from '@/lib/supabase/client';
import { 
    PointsAccount, 
    PointsTransaction, 
    PointsRule,
    MallProduct,
    MallOrder,
    MallProductCategory,
    CreateMallOrderParams
} from '@/types/points';

export const pointsService = {
    // 获取用户积分账户信息
    async getAccount(): Promise<PointsAccount | null> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('points_accounts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // 如果账户不存在,可能需要初始化,或者返回null由UI处理
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    // 获取积分交易历史
    async getTransactions(page = 1, pageSize = 20): Promise<{ data: PointsTransaction[], count: number }> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { data: [], count: 0 };

        // 首先获取账户ID
        const { data: account } = await supabase
            .from('points_accounts')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!account) return { data: [], count: 0 };

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
            .from('points_transactions')
            .select('*', { count: 'exact' })
            .eq('account_id', account.id) // 数据库字段是account_id
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: (data || []) as any[], count: count || 0 };
    },

    // 获取积分规则列表
    async getRules(): Promise<PointsRule[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('points_rules')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    // ============================================
    // 积分商城服务
    // ============================================

    // 获取商城商品列表
    async getProducts(category?: MallProductCategory): Promise<MallProduct[]> {
        const supabase = createClient();

        let query = supabase
            .from('mall_products')
            .select('*')
            .eq('is_available', true);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('sort_order', { ascending: true });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    // 根据ID获取商品详情
    async getProductById(id: string): Promise<MallProduct | null> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('mall_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    // 创建兑换订单
    async createOrder(params: CreateMallOrderParams): Promise<MallOrder> {
        const supabase = createClient();

        const { data, error } = await supabase.rpc('create_mall_order', {
            p_product_id: params.product_id,
            p_shipping_address: params.shipping_address,
            p_contact_phone: params.contact_phone,
            p_remark: params.remark || null
        });

        if (error) {
            throw error;
        }

        // 返回创建的订单ID后,查询完整订单信息
        const { data: order, error: orderError } = await supabase
            .from('mall_orders')
            .select('*')
            .eq('id', data)
            .single();

        if (orderError) {
            throw orderError;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return order as any;
    },

    // 获取用户的兑换订单列表
    async getOrders(page = 1, pageSize = 20): Promise<{ data: MallOrder[], count: number }> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { data: [], count: 0 };

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
            .from('mall_orders')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: (data || []) as any[], count: count || 0 };
    },

    // 根据ID获取订单详情
    async getOrderById(id: string): Promise<MallOrder | null> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('mall_orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    }
};
