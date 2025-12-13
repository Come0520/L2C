// 产品管理模块 - 格式化工具函数

/**
 * 格式化价格，添加千分位分隔符
 * @param price 价格数值
 * @returns 格式化后的价格字符串
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * 格式化价格为元，支持分转元
 * @param price 价格数值（分）
 * @returns 格式化后的价格字符串（元）
 */
export const formatPriceInYuan = (price: number): string => {
  const yuanPrice = price / 100;
  return formatPrice(yuanPrice);
};

/**
 * 将产品状态映射为显示文本
 * @param status 产品状态
 * @returns 状态显示文本
 */
export const mapProductStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    online: '已上架',
    offline: '已下架'
  };

  return statusMap[status] || status;
};

/**
 * 将产品单位映射为显示文本
 * @param unit 产品单位
 * @returns 单位显示文本
 */
export const mapProductUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'm': '米',
    'kg': '千克',
    'pcs': '件',
    'set': '套'
  };

  return unitMap[unit] || unit;
};

/**
 * 格式化产品分类名称
 * @param categoryLevel1 一级分类
 * @param categoryLevel2 二级分类
 * @returns 格式化后的分类名称
 */
export const formatCategoryName = (categoryLevel1: string, categoryLevel2: string): string => {
  if (!categoryLevel2) return categoryLevel1;
  return `${categoryLevel1} - ${categoryLevel2}`;
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 格式化日期时间
 * @param dateTime 日期时间字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateTime: string | Date): string => {
  const d = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
