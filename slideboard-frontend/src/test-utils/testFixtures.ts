/**
 * 测试数据fixtures
 */

import { generateId, generateEmail, generatePhone, generateISODate } from './testHelpers';

/**
 * 用户测试数据
 */
export const userFixtures = {
  /**
   * 基础用户数据
   */
  baseUser: {
    id: generateId(),
    email: generateEmail(),
    phone: generatePhone(),
    raw_user_meta_data: {
      name: '测试用户',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    created_at: generateISODate(-30),
    updated_at: generateISODate(),
  },

  /**
   * 管理员用户数据
   */
  adminUser: {
    id: generateId(),
    email: generateEmail('admin'),
    phone: generatePhone(),
    raw_user_meta_data: {
      name: '管理员用户',
      role: 'admin',
      avatar_url: 'https://example.com/admin-avatar.jpg',
    },
    created_at: generateISODate(-60),
    updated_at: generateISODate(),
  },

  /**
   * 销售用户数据
   */
  salesUser: {
    id: generateId(),
    email: generateEmail('sales'),
    phone: generatePhone(),
    raw_user_meta_data: {
      name: '销售用户',
      role: 'sales',
      avatar_url: 'https://example.com/sales-avatar.jpg',
    },
    created_at: generateISODate(-45),
    updated_at: generateISODate(),
  },

  /**
   * 技师用户数据
   */
  technicianUser: {
    id: generateId(),
    email: generateEmail('technician'),
    phone: generatePhone(),
    raw_user_meta_data: {
      name: '技师用户',
      role: 'technician',
      avatar_url: 'https://example.com/technician-avatar.jpg',
      skills: ['测量', '安装'],
    },
    created_at: generateISODate(-20),
    updated_at: generateISODate(),
  },
};

/**
 * 团队测试数据
 */
export const teamFixtures = {
  /**
   * 基础团队数据
   */
  baseTeam: {
    id: generateId(),
    name: '测试团队',
    description: '这是一个测试团队',
    created_at: generateISODate(-30),
    updated_at: generateISODate(),
  },

  /**
   * 销售团队数据
   */
  salesTeam: {
    id: generateId(),
    name: '销售团队',
    description: '负责销售业务的团队',
    created_at: generateISODate(-60),
    updated_at: generateISODate(),
  },

  /**
   * 安装团队数据
   */
  installationTeam: {
    id: generateId(),
    name: '安装团队',
    description: '负责安装业务的团队',
    created_at: generateISODate(-45),
    updated_at: generateISODate(),
  },
};

/**
 * 线索测试数据
 */
export const leadFixtures = {
  /**
   * 基础线索数据
   */
  baseLead: {
    id: generateId(),
    customer_name: '测试客户',
    customer_phone: generatePhone(),
    customer_email: generateEmail('customer'),
    customer_address: '北京市朝阳区测试地址',
    requirement_type: '窗帘',
    status: 'new',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-10),
    updated_at: generateISODate(),
  },

  /**
   * 已分配线索数据
   */
  assignedLead: {
    id: generateId(),
    customer_name: '已分配客户',
    customer_phone: generatePhone(),
    customer_email: generateEmail('assigned-customer'),
    customer_address: '北京市海淀区测试地址',
    requirement_type: '窗帘',
    status: 'assigned',
    assigned_to: userFixtures.salesUser.id,
    created_by: userFixtures.adminUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },

  /**
   * 已报价线索数据
   */
  quotedLead: {
    id: generateId(),
    customer_name: '已报价客户',
    customer_phone: generatePhone(),
    customer_email: generateEmail('quoted-customer'),
    customer_address: '北京市西城区测试地址',
    requirement_type: '窗帘',
    status: 'quoted',
    assigned_to: userFixtures.salesUser.id,
    created_by: userFixtures.adminUser.id,
    created_at: generateISODate(-15),
    updated_at: generateISODate(),
  },
};

/**
 * 报价测试数据
 */
export const quoteFixtures = {
  /**
   * 基础报价数据
   */
  baseQuote: {
    id: generateId(),
    lead_id: leadFixtures.assignedLead.id,
    quote_number: `QUOTE-${generateId().toUpperCase()}`,
    total_amount: 5000,
    status: 'draft',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },

  /**
   * 已发送报价数据
   */
  sentQuote: {
    id: generateId(),
    lead_id: leadFixtures.assignedLead.id,
    quote_number: `QUOTE-${generateId().toUpperCase()}`,
    total_amount: 6000,
    status: 'sent',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-10),
    updated_at: generateISODate(),
  },

  /**
   * 已接受报价数据
   */
  acceptedQuote: {
    id: generateId(),
    lead_id: leadFixtures.assignedLead.id,
    quote_number: `QUOTE-${generateId().toUpperCase()}`,
    total_amount: 7000,
    status: 'accepted',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-15),
    updated_at: generateISODate(),
  },
};

/**
 * 订单测试数据
 */
export const orderFixtures = {
  /**
   * 基础订单数据
   */
  baseOrder: {
    id: generateId(),
    quote_id: quoteFixtures.acceptedQuote.id,
    order_number: `ORDER-${generateId().toUpperCase()}`,
    total_amount: 7000,
    status: 'pending_assignment',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },

  /**
   * 已分配订单数据
   */
  assignedOrder: {
    id: generateId(),
    quote_id: quoteFixtures.acceptedQuote.id,
    order_number: `ORDER-${generateId().toUpperCase()}`,
    total_amount: 8000,
    status: 'assigned',
    assigned_to: userFixtures.technicianUser.id,
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-10),
    updated_at: generateISODate(),
  },

  /**
   * 已完成订单数据
   */
  completedOrder: {
    id: generateId(),
    quote_id: quoteFixtures.acceptedQuote.id,
    order_number: `ORDER-${generateId().toUpperCase()}`,
    total_amount: 9000,
    status: 'completed',
    assigned_to: userFixtures.technicianUser.id,
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-20),
    updated_at: generateISODate(),
  },
};

/**
 * 测量测试数据
 */
export const measurementFixtures = {
  /**
   * 基础测量数据
   */
  baseMeasurement: {
    id: generateId(),
    order_id: orderFixtures.assignedOrder.id,
    technician_id: userFixtures.technicianUser.id,
    measurement_date: generateISODate(2),
    status: 'scheduled',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },

  /**
   * 已完成测量数据
   */
  completedMeasurement: {
    id: generateId(),
    order_id: orderFixtures.assignedOrder.id,
    technician_id: userFixtures.technicianUser.id,
    measurement_date: generateISODate(-3),
    status: 'completed',
    measurement_data: {
      width: 300,
      height: 250,
      notes: '测量数据已完成',
    },
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-10),
    updated_at: generateISODate(),
  },
};

/**
 * 安装测试数据
 */
export const installationFixtures = {
  /**
   * 基础安装数据
   */
  baseInstallation: {
    id: generateId(),
    order_id: orderFixtures.assignedOrder.id,
    technician_id: userFixtures.technicianUser.id,
    installation_date: generateISODate(7),
    status: 'scheduled',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-3),
    updated_at: generateISODate(),
  },

  /**
   * 已完成安装数据
   */
  completedInstallation: {
    id: generateId(),
    order_id: orderFixtures.assignedOrder.id,
    technician_id: userFixtures.technicianUser.id,
    installation_date: generateISODate(-1),
    status: 'completed',
    installation_data: {
      notes: '安装已完成，客户满意',
      photos: ['https://example.com/installation1.jpg', 'https://example.com/installation2.jpg'],
    },
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },
};

/**
 * 产品测试数据
 */
export const productFixtures = {
  /**
   * 基础产品数据
   */
  baseProduct: {
    id: generateId(),
    product_code: `PROD-${generateId().toUpperCase()}`,
    product_name: '测试产品',
    category_level1: '窗帘',
    category_level2: '布艺窗帘',
    unit: '米',
    status: 'online',
    prices: {
      costPrice: 100,
      retailPrice: 200,
      settlementPrice: 150,
    },
    created_at: generateISODate(-30),
    updated_at: generateISODate(),
  },

  /**
   * 活动产品数据
   */
  activeProduct: {
    id: generateId(),
    product_code: `PROD-${generateId().toUpperCase()}`,
    product_name: '活动产品',
    category_level1: '窗帘',
    category_level2: '布艺窗帘',
    unit: '米',
    status: 'online',
    prices: {
      costPrice: 80,
      retailPrice: 180,
      settlementPrice: 130,
    },
    tags: {
      activityTags: ['促销'],
    },
    created_at: generateISODate(-20),
    updated_at: generateISODate(),
  },
};

/**
 * 对账测试数据
 */
export const reconciliationFixtures = {
  /**
   * 基础对账数据
   */
  baseStatement: {
    id: generateId(),
    statement_no: `STAT-${generateId().toUpperCase()}`,
    type: 'customer',
    target_id: leadFixtures.assignedLead.id,
    period_start: generateISODate(-30),
    period_end: generateISODate(),
    total_amount: 15000,
    status: 'draft',
    created_by: userFixtures.adminUser.id,
    created_at: generateISODate(-1),
    updated_at: generateISODate(),
  },

  /**
   * 已确认对账数据
   */
  confirmedStatement: {
    id: generateId(),
    statement_no: `STAT-${generateId().toUpperCase()}`,
    type: 'customer',
    target_id: leadFixtures.assignedLead.id,
    period_start: generateISODate(-30),
    period_end: generateISODate(),
    total_amount: 15000,
    status: 'confirmed',
    created_by: userFixtures.adminUser.id,
    created_at: generateISODate(-5),
    updated_at: generateISODate(),
  },
};

/**
 * 审批测试数据
 */
export const approvalFixtures = {
  /**
   * 基础审批数据
   */
  baseApproval: {
    id: generateId(),
    type: 'quote',
    reference_id: quoteFixtures.baseQuote.id,
    approver_id: userFixtures.adminUser.id,
    status: 'pending',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-2),
    updated_at: generateISODate(),
  },

  /**
   * 已批准审批数据
   */
  approvedApproval: {
    id: generateId(),
    type: 'quote',
    reference_id: quoteFixtures.baseQuote.id,
    approver_id: userFixtures.adminUser.id,
    status: 'approved',
    approved_at: generateISODate(-1),
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-3),
    updated_at: generateISODate(),
  },

  /**
   * 已拒绝审批数据
   */
  rejectedApproval: {
    id: generateId(),
    type: 'quote',
    reference_id: quoteFixtures.baseQuote.id,
    approver_id: userFixtures.adminUser.id,
    status: 'rejected',
    rejected_at: generateISODate(-1),
    rejection_reason: '报价过高',
    created_by: userFixtures.salesUser.id,
    created_at: generateISODate(-3),
    updated_at: generateISODate(),
  },
};

/**
 * 配置测试数据
 */
export const configFixtures = {
  /**
   * 基础配置数据
   */
  baseConfig: {
    id: generateId(),
    key: 'test_config',
    value: JSON.stringify({ test: 'value' }),
    description: '测试配置',
    created_at: generateISODate(-10),
    updated_at: generateISODate(),
  },

  /**
   * 系统配置数据
   */
  systemConfig: {
    id: generateId(),
    key: 'system_config',
    value: JSON.stringify({ max_upload_size: 10, default_page_size: 20 }),
    description: '系统配置',
    created_at: generateISODate(-30),
    updated_at: generateISODate(),
  },
};
