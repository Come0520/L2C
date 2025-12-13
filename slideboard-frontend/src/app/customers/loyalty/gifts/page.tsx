'use client';

import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Package, 
  BarChart3, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table';

// 礼品类型定义
interface Gift {
  id: string;
  sku: string;
  name: string;
  category: 'gift';
  subCategory: string;
  unit: string;
  tagPrice: number; // 吊牌价
  distributionPrice: number; // 经销价
  vipPrice: number; // VIP价
  costPrice: number; // 成本价
  stock: number;
  minStock: number;
  maxStock: number;
  status: 'active' | 'inactive' | 'low_stock';
  lastUpdated: string;
  store: string;
  imageUrl: string;
}

// 进出库记录类型定义
interface StockRecord {
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
interface StockStats {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  totalValue: number;
  inCount: number;
  outCount: number;
}

export default function GiftsPage() {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'inventory' | 'inbound' | 'outbound' | 'stats'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStore, setSelectedStore] = useState('一店');
  const [selectedProduct, setSelectedProduct] = useState<Gift | null>(null);

  // 模拟门店数据
  const stores = [
    { value: '一店', label: '一店' },
    { value: '二店', label: '二店' },
    { value: '线上店', label: '线上店' },
  ];

  // 模拟礼品数据
  const gifts: Gift[] = [
    {
      id: '2',
      sku: 'GIFT-001',
      name: '定制马克杯',
      category: 'gift',
      subCategory: '办公用品',
      unit: '个',
      tagPrice: 50, // 吊牌价
      distributionPrice: 40, // 经销价
      vipPrice: 35, // VIP价
      costPrice: 15, // 成本价
      stock: 85,
      minStock: 50,
      maxStock: 200,
      status: 'active',
      lastUpdated: '2024-01-14',
      store: '一店',
      imageUrl: 'https://picsum.photos/seed/GIFT-001/80'
    },
    {
      id: '4',
      sku: 'GIFT-002',
      name: '定制笔记本',
      category: 'gift',
      subCategory: '办公用品',
      unit: '本',
      tagPrice: 40, // 吊牌价
      distributionPrice: 30, // 经销价
      vipPrice: 28, // VIP价
      costPrice: 12, // 成本价
      stock: 120,
      minStock: 50,
      maxStock: 200,
      status: 'active',
      lastUpdated: '2024-01-15',
      store: '一店',
      imageUrl: 'https://picsum.photos/seed/GIFT-002/80'
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
    }
  ];

  // 模拟库存统计数据
  const stockStats: StockStats = {
    totalItems: 2,
    totalStock: 205,
    lowStockItems: 0,
    totalValue: 5400,
    inCount: 1,
    outCount: 1
  };

  // 过滤选项
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '正常' },
    { value: 'inactive', label: '停用' },
    { value: 'low_stock', label: '库存不足' }
  ];

  // 过滤数据
  const filteredGifts = gifts.filter(gift => {
    const matchesSearch = 
      gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || gift.status === statusFilter;
    const matchesStore = gift.store === selectedStore;
    
    return matchesSearch && matchesStatus && matchesStore;
  });

  // 分页处理
  const totalPages = Math.ceil(filteredGifts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGifts = filteredGifts.slice(startIndex, startIndex + itemsPerPage);

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
  const getStatusText = (status: Gift['status']) => {
    switch (status) {
      case 'active': return '正常';
      case 'inactive': return '停用';
      case 'low_stock': return '库存不足';
      default: return '未知';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: Gift['status']) => {
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
    return <PaperBadge variant={variant}>{getRecordTypeText(recordType)}</PaperBadge>;
  };

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">礼品管理</h1>
            <p className="text-ink-500 mt-1">各门店独立管理礼品的库存、进出库及统计</p>
          </div>
          <div className="flex items-center space-x-3">
            <PaperSelect 
              label="门店" 
              options={stores} 
              value={selectedStore} 
              onChange={(e) => setSelectedStore(e.target.value)} 
            />
            <PaperButton variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              新增礼品
            </PaperButton>
          </div>
        </div>

        {/* 导航标签 */}
        <PaperCard>
          <PaperCardContent>
            <PaperNav vertical={false}>
              <PaperNavItem 
                href="#" 
                active={activeTab === 'inventory'} 
                onClick={() => setActiveTab('inventory')} 
                icon={<Package className="h-5 w-5" />}
              >
                库存管理
              </PaperNavItem>
              <PaperNavItem 
                href="#" 
                active={activeTab === 'inbound'} 
                onClick={() => setActiveTab('inbound')} 
                icon={<ArrowRight className="h-5 w-5" />}
              >
                入库管理
              </PaperNavItem>
              <PaperNavItem 
                href="#" 
                active={activeTab === 'outbound'} 
                onClick={() => setActiveTab('outbound')} 
                icon={<ArrowLeft className="h-5 w-5" />}
              >
                出库管理
              </PaperNavItem>
              <PaperNavItem 
                href="#" 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')} 
                icon={<BarChart3 className="h-5 w-5" />}
              >
                库存统计
              </PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        {/* 搜索和过滤栏 */}
        <PaperCard>
          <PaperTableToolbar>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <PaperInput 
                  placeholder="搜索礼品名称、SKU..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full" 
                  icon={<Search className="h-4 w-4" />} 
                />
              </div>
              {activeTab === 'inventory' && (
                <div className="w-48">
                  <PaperSelect 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    options={statusOptions} 
                    placeholder="选择状态" 
                  />
                </div>
              )}
              <PaperButton>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </PaperButton>
            </div>
            <div className="text-sm text-ink-500">{selectedStore}</div>
          </PaperTableToolbar>
        </PaperCard>

        {/* 库存管理 */}
        {activeTab === 'inventory' && (
          <PaperCard>
            <PaperCardHeader>
              <div className="flex items-center justify-between">
                <PaperCardTitle>礼品列表</PaperCardTitle>
                <PaperButton variant="outline" size="sm">导出数据</PaperButton>
              </div>
            </PaperCardHeader>
            <PaperCardContent className="p-0">
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>礼品信息</PaperTableCell>
                  <PaperTableCell>分类</PaperTableCell>
                  <PaperTableCell>价格</PaperTableCell>
                  <PaperTableCell>库存</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {paginatedGifts.map((gift) => (
                    <PaperTableRow key={gift.id}>
                      <PaperTableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-paper-600">
                            <Image 
                              src={gift.imageUrl} 
                              alt={gift.name} 
                              width={48} 
                              height={48} 
                              className="object-cover w-full h-full" 
                              unoptimized 
                            />
                          </div>
                          <div>
                            <p className="font-medium text-ink-800">{gift.name}</p>
                            <p className="text-sm text-ink-500">SKU: {gift.sku}</p>
                          </div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-ink-800">礼品</span>
                          <span className="text-xs text-ink-500">{gift.subCategory}</span>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-success-600">¥{gift.tagPrice.toLocaleString()}</div>
                          <div className="text-xs text-ink-500">吊牌价</div>
                          <div className="text-xs text-ink-500">经销价: ¥{gift.distributionPrice.toLocaleString()}</div>
                          <div className="text-xs text-ink-500">VIP价: ¥{gift.vipPrice.toLocaleString()}</div>
                          <div className="text-xs text-ink-500">成本价: ¥{gift.costPrice.toLocaleString()}</div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-ink-800">{gift.stock} {gift.unit}</div>
                          <div className="text-xs text-ink-500">
                            安全库存: {gift.minStock}-{gift.maxStock} {gift.unit}
                          </div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <PaperStatus 
                          status={getStatusColor(gift.status)} 
                          text={getStatusText(gift.status)} 
                        />
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          <PaperButton size="sm" variant="ghost" onClick={() => setSelectedProduct(gift)}>
                            <Eye className="h-3 w-3" />
                          </PaperButton>
                          <PaperButton size="sm" variant="outline" onClick={() => setSelectedProduct(gift)}>
                            <Edit className="h-3 w-3" />
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
              <PaperTablePagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                totalItems={filteredGifts.length} 
                itemsPerPage={itemsPerPage} 
                onPageChange={setCurrentPage} 
              />
            </PaperCardContent>
          </PaperCard>
        )}

        {/* 入库管理 */}
        {activeTab === 'inbound' && (
          <PaperCard>
            <PaperCardHeader>
              <div className="flex items-center justify-between">
                <PaperCardTitle>入库记录</PaperCardTitle>
                <div className="flex space-x-2">
                  <PaperButton variant="outline" size="sm">导入</PaperButton>
                  <PaperButton variant="outline" size="sm">导出</PaperButton>
                  <PaperButton variant="primary" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    新增入库
                  </PaperButton>
                </div>
              </div>
            </PaperCardHeader>
            <PaperCardContent className="p-0">
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>类型</PaperTableCell>
                  <PaperTableCell>关联单号</PaperTableCell>
                  <PaperTableCell>礼品</PaperTableCell>
                  <PaperTableCell>数量</PaperTableCell>
                  <PaperTableCell>操作人</PaperTableCell>
                  <PaperTableCell>时间</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {filteredRecords.map((record) => (
                    <PaperTableRow key={record.id}>
                      <PaperTableCell>{getRecordTypeBadge(record.recordType, record.type)}</PaperTableCell>
                      <PaperTableCell>{record.relatedNo}</PaperTableCell>
                      <PaperTableCell>{record.sku} - {record.productName}</PaperTableCell>
                      <PaperTableCell className="text-success-600">+{record.qty}</PaperTableCell>
                      <PaperTableCell>{record.operator}</PaperTableCell>
                      <PaperTableCell>{record.time}</PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          <PaperButton size="sm" variant="ghost">查看</PaperButton>
                          <PaperButton size="sm" variant="outline">编辑</PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* 出库管理 */}
        {activeTab === 'outbound' && (
          <PaperCard>
            <PaperCardHeader>
              <div className="flex items-center justify-between">
                <PaperCardTitle>出库记录</PaperCardTitle>
                <div className="flex space-x-2">
                  <PaperButton variant="outline" size="sm">导入</PaperButton>
                  <PaperButton variant="outline" size="sm">导出</PaperButton>
                  <PaperButton variant="primary" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    新增出库
                  </PaperButton>
                </div>
              </div>
            </PaperCardHeader>
            <PaperCardContent className="p-0">
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>类型</PaperTableCell>
                  <PaperTableCell>关联单号</PaperTableCell>
                  <PaperTableCell>礼品</PaperTableCell>
                  <PaperTableCell>数量</PaperTableCell>
                  <PaperTableCell>操作人</PaperTableCell>
                  <PaperTableCell>时间</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {filteredRecords.map((record) => (
                    <PaperTableRow key={record.id}>
                      <PaperTableCell>{getRecordTypeBadge(record.recordType, record.type)}</PaperTableCell>
                      <PaperTableCell>{record.relatedNo}</PaperTableCell>
                      <PaperTableCell>{record.sku} - {record.productName}</PaperTableCell>
                      <PaperTableCell className="text-error-600">-{record.qty}</PaperTableCell>
                      <PaperTableCell>{record.operator}</PaperTableCell>
                      <PaperTableCell>{record.time}</PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          <PaperButton size="sm" variant="ghost">查看</PaperButton>
                          <PaperButton size="sm" variant="outline">编辑</PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* 库存统计 */}
        {activeTab === 'stats' && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PaperCard>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ink-800 mb-1">{stockStats.totalItems}</div>
                    <div className="text-sm text-ink-500">礼品总数</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
              <PaperCard>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ink-800 mb-1">{stockStats.totalStock}</div>
                    <div className="text-sm text-ink-500">总库存数量</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
              <PaperCard>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-error-600 mb-1">{stockStats.lowStockItems}</div>
                    <div className="text-sm text-ink-500">库存不足礼品</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
              <PaperCard>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success-600 mb-1">¥{stockStats.totalValue.toLocaleString()}</div>
                    <div className="text-sm text-ink-500">库存总价值</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>

            {/* 进出库统计 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>入库统计</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-success-600 mb-2">{stockStats.inCount}</div>
                    <div className="text-sm text-ink-500">本月入库次数</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>出库统计</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-warning-600 mb-2">{stockStats.outCount}</div>
                    <div className="text-sm text-ink-500">本月出库次数</div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>

            {/* 库存明细 */}
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>库存明细</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent className="p-0">
                <PaperTable>
                  <PaperTableHeader>
                    <PaperTableCell>礼品名称</PaperTableCell>
                    <PaperTableCell>SKU</PaperTableCell>
                    <PaperTableCell>分类</PaperTableCell>
                    <PaperTableCell>当前库存</PaperTableCell>
                    <PaperTableCell>库存状态</PaperTableCell>
                  </PaperTableHeader>
                  <PaperTableBody>
                    {gifts
                      .filter(gift => gift.store === selectedStore)
                      .map((gift) => (
                        <PaperTableRow key={gift.id}>
                          <PaperTableCell>{gift.name}</PaperTableCell>
                          <PaperTableCell>{gift.sku}</PaperTableCell>
                          <PaperTableCell>礼品</PaperTableCell>
                          <PaperTableCell>{gift.stock} {gift.unit}</PaperTableCell>
                          <PaperTableCell>
                            <PaperStatus 
                              status={getStatusColor(gift.status)} 
                              text={getStatusText(gift.status)} 
                            />
                          </PaperTableCell>
                        </PaperTableRow>
                      ))}
                  </PaperTableBody>
                </PaperTable>
              </PaperCardContent>
            </PaperCard>
          </>
        )}

        {/* 礼品详情弹窗 */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-ink-800">礼品详情</h2>
                  <PaperBadge variant={getStatusColor(selectedProduct.status)}>
                    {selectedProduct.sku}
                  </PaperBadge>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="paper-button p-2"
                  aria-label="关闭"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 基本信息 */}
                  <div className="space-y-6">
                    <PaperCard>
                      <PaperCardHeader>
                        <PaperCardTitle>基本信息</PaperCardTitle>
                      </PaperCardHeader>
                      <PaperCardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-paper-600">
                            <Image 
                              src={selectedProduct.imageUrl} 
                              alt={selectedProduct.name} 
                              width={96} 
                              height={96} 
                              className="object-cover w-full h-full" 
                              unoptimized 
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-ink-800">{selectedProduct.name}</h3>
                            <p className="text-sm text-ink-500 mt-1">{selectedProduct.sku}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-ink-500 mb-1">分类</p>
                            <p className="text-sm font-medium text-ink-800">礼品</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">子分类</p>
                            <p className="text-sm font-medium text-ink-800">{selectedProduct.subCategory}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">计量单位</p>
                            <p className="text-sm font-medium text-ink-800">{selectedProduct.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">状态</p>
                            <PaperStatus 
                              status={getStatusColor(selectedProduct.status)} 
                              text={getStatusText(selectedProduct.status)} 
                            />
                          </div>
                        </div>
                      </PaperCardContent>
                    </PaperCard>

                    {/* 价格和库存 */}
                    <PaperCard>
                      <PaperCardHeader>
                        <PaperCardTitle>价格和库存</PaperCardTitle>
                      </PaperCardHeader>
                      <PaperCardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-ink-500 mb-1">吊牌价</p>
                            <p className="text-lg font-semibold text-success-600">¥{selectedProduct.tagPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">经销价</p>
                            <p className="text-lg font-semibold text-ink-800">¥{selectedProduct.distributionPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">VIP价</p>
                            <p className="text-lg font-semibold text-ink-800">¥{selectedProduct.vipPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">成本价</p>
                            <p className="text-lg font-semibold text-ink-800">¥{selectedProduct.costPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">当前库存</p>
                            <p className="text-lg font-semibold text-ink-800">{selectedProduct.stock} {selectedProduct.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-500 mb-1">安全库存范围</p>
                            <p className="text-lg font-semibold text-ink-800">{selectedProduct.minStock}-{selectedProduct.maxStock} {selectedProduct.unit}</p>
                          </div>
                        </div>
                      </PaperCardContent>
                    </PaperCard>
                  </div>
                  
                  {/* 其他信息 */}
                  <div className="space-y-6">
                    <PaperCard>
                      <PaperCardHeader>
                        <PaperCardTitle>库存变动记录</PaperCardTitle>
                      </PaperCardHeader>
                      <PaperCardContent className="space-y-3">
                        {stockRecords
                          .filter(record => record.sku === selectedProduct.sku)
                          .slice(0, 5)
                          .map((record) => (
                            <div key={record.id} className="flex items-center justify-between py-2 border-b border-paper-600 last:border-b-0">
                              <div className="flex items-center space-x-2">
                                {record.type === 'in' ? (
                                  <ArrowRight className="h-4 w-4 text-success-600" />
                                ) : (
                                  <ArrowLeft className="h-4 w-4 text-warning-600" />
                                )}
                                <span className="text-sm text-ink-600">{getRecordTypeText(record.recordType)}</span>
                              </div>
                              <div className="text-sm font-medium">
                                {record.type === 'in' ? '+' : '-'}{record.qty} {selectedProduct.unit}
                              </div>
                              <div className="text-xs text-ink-500">{record.time}</div>
                            </div>
                          ))}
                      </PaperCardContent>
                    </PaperCard>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setSelectedProduct(null)}>
                  关闭
                </PaperButton>
                <PaperButton variant="primary">
                  <Edit className="h-4 w-4 mr-2" />
                  编辑礼品
                </PaperButton>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
