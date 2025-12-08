import { LeadItem } from '@/types/lead'

// 模拟线索数据
export const mockLeads: LeadItem[] = [
  {
    id: '1',
    leadNumber: 'LD202401010001',
    customerName: '张三',
    projectAddress: '北京市朝阳区望京SOHO',
    phone: '13800138000',
    requirements: ['全屋定制', '现代简约'],
    budgetMin: 300000,
    budgetMax: 500000,
    customerLevel: 'A',
    status: 'FOLLOWING_UP',
    businessTags: ['quoted', 'appointment'],
    appointmentTime: '2024-01-15T14:00:00',
    appointmentReminder: null,
    currentOwner: { name: '销售员A', avatar: '' },
    designer: { name: '设计师张敏', avatar: '' },
    createdAt: '2024-01-10T10:30:00',
    lastFollowUpAt: '2024-01-12T15:20:00',
    source: '微信',
    quoteVersions: 2,
    areaSize: 120,
    quoteDetails: {
      currentVersion: 2,
      versions: [
        {
          version: 1,
          quoteNo: 'Q-LD202401010001-1',
          createdAt: '2024-01-10T14:00:00',
          createdBy: '设计师张敏',
          status: 'cancelled',
          validUntil: '2024-02-10T14:00:00',
          totalAmount: 350000,
          items: [
            { name: '定制衣柜', quantity: 3, unitPrice: 50000, totalPrice: 150000 },
            { name: '定制橱柜', quantity: 1, unitPrice: 100000, totalPrice: 100000 },
            { name: '定制电视柜', quantity: 1, unitPrice: 50000, totalPrice: 50000 },
            { name: '安装费', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
          ]
        },
        {
          version: 2,
          quoteNo: 'Q-LD202401010001-2',
          createdAt: '2024-01-12T10:00:00',
          createdBy: '设计师张敏',
          status: 'confirmed',
          validUntil: '2024-02-12T10:00:00',
          totalAmount: 380000,
          items: [
            { name: '定制衣柜', quantity: 3, unitPrice: 55000, totalPrice: 165000 },
            { name: '定制橱柜', quantity: 1, unitPrice: 110000, totalPrice: 110000 },
            { name: '定制电视柜', quantity: 1, unitPrice: 55000, totalPrice: 55000 },
            { name: '安装费', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
          ]
        }
      ]
    }
  },
  {
    id: '2',
    leadNumber: 'LD202401010002',
    customerName: '李四',
    projectAddress: '上海市浦东新区陆家嘴',
    phone: '13900139000',
    requirements: ['厨房改造', '北欧风格'],
    budgetMin: 100000,
    budgetMax: 150000,
    customerLevel: 'B',
    status: 'PLAN_PENDING_CONFIRMATION',
    businessTags: ['quoted'],
    appointmentTime: '2024-01-16T10:00:00',
    appointmentReminder: '48h',
    currentOwner: { name: '销售员B', avatar: '' },
    designer: { name: '导购李娜', avatar: '' },
    createdAt: '2024-01-11T09:15:00',
    lastFollowUpAt: '2024-01-13T11:30:00',
    source: '官网',
    quoteVersions: 1,
    areaSize: 80,
    quoteDetails: {
      currentVersion: 1,
      versions: [
        {
          version: 1,
          quoteNo: 'Q-LD202401010002-1',
          createdAt: '2024-01-13T14:00:00',
          createdBy: '导购李娜',
          status: 'confirmed',
          validUntil: '2024-02-13T14:00:00',
          totalAmount: 120000,
          items: [
            { name: '定制橱柜', quantity: 1, unitPrice: 80000, totalPrice: 80000 },
            { name: '定制水槽', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
            { name: '安装费', quantity: 1, unitPrice: 30000, totalPrice: 30000 }
          ]
        }
      ]
    }
  },
  {
    id: '3',
    leadNumber: 'LD202401010003',
    customerName: '王五',
    projectAddress: '深圳市南山区科技园',
    phone: '13700137000',
    requirements: ['别墅全屋定制', '欧式风格'],
    budgetMin: 800000,
    budgetMax: 1200000,
    customerLevel: 'A',
    status: 'PLAN_PENDING_CONFIRMATION',
    businessTags: ['measured'],
    appointmentTime: '',
    appointmentReminder: null,
    currentOwner: { name: '销售员C', avatar: '' },
    designer: { name: '设计师王强', avatar: '' },
    createdAt: '2024-01-12T14:20:00',
    lastFollowUpAt: '2024-01-14T16:45:00',
    source: '电话',
    quoteVersions: 3,
    areaSize: 300,
    quoteDetails: {
      currentVersion: 3,
      versions: [
        {
          version: 1,
          quoteNo: 'Q-LD202401010003-1',
          createdAt: '2024-01-12T16:00:00',
          createdBy: '设计师王强',
          status: 'cancelled',
          validUntil: '2024-02-12T16:00:00',
          totalAmount: 900000,
          items: [
            { name: '定制衣柜', quantity: 5, unitPrice: 80000, totalPrice: 400000 },
            { name: '定制橱柜', quantity: 1, unitPrice: 150000, totalPrice: 150000 },
            { name: '定制酒柜', quantity: 1, unitPrice: 100000, totalPrice: 100000 },
            { name: '安装费', quantity: 1, unitPrice: 250000, totalPrice: 250000 }
          ]
        },
        {
          version: 2,
          quoteNo: 'Q-LD202401010003-2',
          createdAt: '2024-01-13T10:00:00',
          createdBy: '设计师王强',
          status: 'cancelled',
          validUntil: '2024-02-13T10:00:00',
          totalAmount: 950000,
          items: [
            { name: '定制衣柜', quantity: 5, unitPrice: 85000, totalPrice: 425000 },
            { name: '定制橱柜', quantity: 1, unitPrice: 160000, totalPrice: 160000 },
            { name: '定制酒柜', quantity: 1, unitPrice: 115000, totalPrice: 115000 },
            { name: '安装费', quantity: 1, unitPrice: 250000, totalPrice: 250000 }
          ]
        },
        {
          version: 3,
          quoteNo: 'Q-LD202401010003-3',
          createdAt: '2024-01-14T09:00:00',
          createdBy: '设计师王强',
          status: 'confirmed',
          validUntil: '2024-02-14T09:00:00',
          totalAmount: 980000,
          items: [
            { name: '定制衣柜', quantity: 5, unitPrice: 88000, totalPrice: 440000 },
            { name: '定制橱柜', quantity: 1, unitPrice: 170000, totalPrice: 170000 },
            { name: '定制酒柜', quantity: 1, unitPrice: 120000, totalPrice: 120000 },
            { name: '安装费', quantity: 1, unitPrice: 250000, totalPrice: 250000 }
          ]
        }
      ]
    }
  },
  {
    id: '4',
    leadNumber: 'LD202401010004',
    customerName: '赵六',
    projectAddress: '广州市天河区珠江新城',
    phone: '13600136000',
    requirements: ['书房定制', '现代风格'],
    budgetMin: 50000,
    budgetMax: 80000,
    customerLevel: 'C',
    status: 'CANCELLED',
    businessTags: [],
    appointmentTime: '',
    appointmentReminder: null,
    currentOwner: { name: '销售员D', avatar: '' },
    createdAt: '2024-01-13T16:10:00',
    lastFollowUpAt: '2024-01-14T09:30:00',
    source: '推荐',
    quoteVersions: 0,
    areaSize: 25
  }
]
