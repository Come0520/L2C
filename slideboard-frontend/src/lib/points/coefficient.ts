import { createClient } from '@/lib/supabase/client';

/**
 * 获取适用的积分系数
 * 根据订单信息查询最匹配的系数规则
 */
export async function getApplicableCoefficient(params: {
  productCategory: string;
  productModel?: string;
  regionCode: string;
  storeId?: string;
  orderTime: Date;
}): Promise<number> {
  const supabase = createClient();

  // 查询匹配的规则
  let query = supabase
    .from('points_coefficient_rules')
    .select('*')
    .eq('status', 'active')
    .lte('start_time', params.orderTime.toISOString())
    .gte('end_time', params.orderTime.toISOString());

  // 优先匹配最精确的规则
  // 1. 产品品类匹配
  if (params.productCategory) {
    query = query.eq('product_category', params.productCategory);
  }

  // 2. 地区匹配
  if (params.regionCode) {
    query = query.eq('region_code', params.regionCode);
  }

  // 按最终系数降序排序,取最优惠的
  query = query.order('final_coefficient', { ascending: false }).limit(1);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get coefficient:', error);
    return getDefaultCoefficient(params.productCategory);
  }

  if (data && data.length > 0 && data[0] && data[0].final_coefficient !== undefined) {
      return data[0].final_coefficient;
    }

  // 没有特殊规则,使用默认系数
  return getDefaultCoefficient(params.productCategory);
}

/**
 * 获取默认系数
 * 根据产品品类返回基础系数
 */
function getDefaultCoefficient(category: string): number {
  const defaultCoefficients: Record<string, number> = {
    curtain: 0.008,      // 窗帘 0.8%
    wallpaper: 0.008,    // 墙纸 0.8%
    wallcard: 0.008,     // 墙咔 0.8%
  };

  return defaultCoefficients[category] || 0.008;
}

/**
 * 计算订单应得积分
 */
export function calculateOrderPoints(amount: number, coefficient: number): number {
  return Math.floor(amount * coefficient);
}

/**
 * 订单积分流转
 * 订单确认时调用,积分进入在途状态
 */
export async function processOrderPoints(params: {
  userId: string;
  orderId: string;
  orderAmount: number;
  productCategory: string;
  productModel?: string;
  regionCode: string;
  storeId?: string;
}): Promise<{ points: number; coefficient: number }> {
  const supabase = createClient();

  // 1. 获取适用系数
  const coefficient = await getApplicableCoefficient({
    productCategory: params.productCategory,
    productModel: params.productModel,
    regionCode: params.regionCode,
    storeId: params.storeId,
    orderTime: new Date()
  });

  // 2. 计算积分
  const points = calculateOrderPoints(params.orderAmount, coefficient);

  // 3. 积分转入在途
  const { error } = await supabase.rpc('points_to_pending', {
    p_user_id: params.userId,
    p_amount: points,
    p_source_id: params.orderId,
    p_description: `订单确认,应得${points}积分(系数${(coefficient * 100).toFixed(2)}%)`
  });

  if (error) {
    throw new Error(`积分入账失败: ${error.message}`);
  }

  return { points, coefficient };
}

/**
 * 订单验收积分确认
 * 订单验收时调用,在途积分转为可用
 */
export async function confirmOrderPoints(params: {
  userId: string;
  orderId: string;
  points: number;
}): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('confirm_pending_points', {
    p_user_id: params.userId,
    p_amount: params.points,
    p_source_id: params.orderId,
    p_description: `订单验收,${params.points}积分转为可用`
  });

  if (error) {
    throw new Error(`积分确认失败: ${error.message}`);
  }
}
