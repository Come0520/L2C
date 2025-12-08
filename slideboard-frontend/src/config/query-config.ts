export const QUERY_CONFIG = {
  // 列表数据默认缓存策略
  list: {
    staleTime: 60 * 1000, // 1分钟内数据被认为是新鲜的
    gcTime: 10 * 60 * 1000, // 10分钟后未使用的缓存被回收
  },
  // 详情数据默认缓存策略
  detail: {
    staleTime: 2 * 60 * 1000, // 2分钟
    gcTime: 15 * 60 * 1000, // 15分钟
  },
  // 实时性要求高的数据（几乎不缓存）
  realtime: {
    staleTime: 0,
    gcTime: 60 * 1000,
  },
  // 静态数据/字典数据（长时间缓存）
  static: {
    staleTime: 60 * 60 * 1000, // 1小时
    gcTime: 24 * 60 * 60 * 1000, // 24小时
  }
} as const;
