export const DEFAULT_ROLES = [
  { name: '管理员', code: 'ADMIN', description: '系统全权管理', isSystem: true },
  { name: '经理', code: 'MANAGER', description: '门店/区域管理 (店长)', isSystem: true },
  { name: '销售', code: 'SALES', description: '业务执行', isSystem: true },
  { name: '财务', code: 'FINANCE', description: '财务管理', isSystem: true },
  { name: '供应链', code: 'SUPPLY', description: '采购与库存', isSystem: true },
  { name: '派单员', code: 'DISPATCHER', description: '服务调度', isSystem: true },
  { name: '工人', code: 'WORKER', description: '服务执行 (测量/安装)', isSystem: true },
] as const;
