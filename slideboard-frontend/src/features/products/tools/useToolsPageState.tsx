'use client';

import { useState } from 'react';

// 销售道具类型定义
export interface SalesTool {
  id: string;
  sku: string;
  name: string;
  category: 'tool';
  subCategory: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  status: 'active' | 'inactive' | 'low_stock';
  lastUpdated: string;
  store: string;
  imageUrl: string;
}

// 进出库记录类型定义
export interface StockRecord {
  id: string;
  type: 'in' | 'out';
  recordType: 'purchase' | 'transfer_in' | 'return_in' | 'sales' | 'transfer_out' | 'loss_out' | 'gift_out';
  store: string;
  relatedNo: string;
  sku: string;
  productName: string;
  qty: number;
  operator: string;
  time: string;
}

// 库存统计类型定义
export interface StockStats {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  totalValue: number;
  inCount: number;
  outCount: number;
}

export const useToolsPageState = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'inventory' | 'inbound' | 'outbound' | 'stats'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStore, setSelectedStore] = useState('一店');
  const [selectedProduct, setSelectedProduct] = useState<SalesTool | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟门店数据
  const stores = [
    { value: '一店', label: '一店' },
    { value: '二店', label: '二店' },
    { value: '线上店', label: '线上店' },
  ];

  // 模拟销售道具数据
  const salesTools: SalesTool[] = [
    {
      id: '1',
      sku: 'TOOL-001',
      name: '产品展示架',
      category: 'tool',
      subCategory: '展示器材',
      unit: '个',
      price: 200,
      cost: 150,
      stock: 12,
      minStock: 5,
      maxStock: 20,
      status: 'active',
      lastUpdated: '2024-01-15',
      store: '一店',
      imageUrl: 'https://picsum.photos/seed/TOOL-001/80'
    },
    {
      id: '3',
      sku: 'TOOL-002',
      name: '样品册',
      category: 'tool',
      subCategory: '宣传资料',
      unit: '本',
      price: 50,
      cost: 25,
      stock: 3,
      minStock: 10,
      maxStock: 50,
      status: 'low_stock',
      lastUpdated: '2024-01-13',
      store: '一店',
      imageUrl: 'https://picsum.photos/seed/TOOL-002/80'
    },
    {
      id: '5',
      sku: 'TOOL-003',
      name: '测量工具套装',
      category: 'tool',
      subCategory: '实用工具',
      unit: '套',
      price: 150,
      cost: 80,
      stock: 8,
      minStock: 5,
      maxStock: 20,
      status: 'active',
      lastUpdated: '2024-01-12',
      store: '一店',
      imageUrl: 'https://picsum.photos/seed/TOOL-003/80'
    }
  ];

  // 模拟进出库记录
  const stockRecords: StockRecord[] = [
    {
      id: 'IN-001',
      type: 'in',
      recordType: 'purchase',
      store: '一店',
      relatedNo: 'PO-2024-001',
      sku: 'GIFT-001',
      productName: '定制马克杯',
      qty: 100,
      operator: '张三',
      time: '2024-01-14 10:00'
    },
    {
      id: 'OUT-001',
      type: 'out',
      recordType: 'gift_out',
      store: '一店',
      relatedNo: 'ORD-2024-001',
      sku: 'GIFT-001',
      productName: '定制马克杯',
      qty: 15,
      operator: '李四',
      time: '2024-01-15 14:10'
    },
    {
      id: 'IN-002',
      type: 'in',
      recordType: 'transfer_in',
      store: '一店',
      relatedNo: 'TR-2024-001',
      sku: 'TOOL-001',
      productName: '产品展示架',
      qty: 5,
      operator: '张三',
      time: '2024-01-15 09:30'
    },
    {
      id: 'OUT-002',
      type: 'out',
      recordType: 'sales',
      store: '一店',
      relatedNo: 'ORD-2024-002',
      sku: 'TOOL-003',
      productName: '测量工具套装',
      qty: 2,
      operator: '李四',
      time: '2024-01-15 16:20'
    }
  ];

  // 模拟库存统计数据
  const stockStats: StockStats = {
    totalItems: 5,
    totalStock: 228,
    lowStockItems: 1,
    totalValue: 15650,
    inCount: 2,
    outCount: 2
  };

  // 过滤选项
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '正常' },
    { value: 'inactive', label: '停用' },
    { value: 'low_stock', label: '库存不足' }
  ];

  // 过滤数据
  const filteredTools = salesTools.filter(tool => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
    const matchesStore = tool.store === selectedStore;
    
    return matchesSearch && matchesStatus && matchesStore;
  });

  // 分页处理
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTools = filteredTools.slice(startIndex, startIndex + itemsPerPage);

  // 过滤进出库记录
  const filteredRecords = stockRecords.filter(record => {
    const matchesSearch = 
      record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = record.store === selectedStore;
    const matchesType = activeTab === 'inbound' ? record.type === 'in' : record.type === 'out';
    
    return matchesSearch && matchesStore && matchesType;
  });

  // 获取状态文本
  const getStatusText = (status: SalesTool['status']) => {
    switch (status) {
      case 'active': return '正常';
      case 'inactive': return '停用';
      case 'low_stock': return '库存不足';
      default: return '未知';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: SalesTool['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'low_stock': return 'error';
      default: return 'info';
    }
  };

  // 获取记录类型文本
  const getRecordTypeText = (recordType: StockRecord['recordType']) => {
    const typeMap: Record<StockRecord['recordType'], string> = {
      purchase: '采购入库',
      transfer_in: '调拨入库',
      return_in: '退货入库',
      sales: '销售出库',
      transfer_out: '调拨出库',
      loss_out: '报损出库',
      gift_out: '礼品赠送'
    };
    return typeMap[recordType];
  };

  // 获取记录类型徽章
  const getRecordTypeBadge = (recordType: StockRecord['recordType'], type: StockRecord['type']) => {
    const variant = type === 'in' ? 'success' : 'warning';
    return { variant, text: getRecordTypeText(recordType) };
  };

  return {
    // 状态
    activeTab,
    searchTerm,
    statusFilter,
    currentPage,
    selectedStore,
    selectedProduct,
    isLoading,
    
    // 模拟数据
    salesTools,
    stockRecords,
    stockStats,
    stores,
    statusOptions,
    
    // 过滤后的数据
    filteredTools,
    paginatedTools,
    filteredRecords,
    totalPages,
    itemsPerPage,
    
    // 工具函数
    getStatusText,
    getStatusColor,
    getRecordTypeText,
    getRecordTypeBadge,
    
    // 状态更新函数
    setActiveTab,
    setSearchTerm,
    setStatusFilter,
    setCurrentPage,
    setSelectedStore,
    setSelectedProduct,
    setIsLoading
  };
};