'use client';

import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  User,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table';

interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  level: 'A' | 'B' | 'C' | 'D';
  status: 'active' | 'inactive' | 'potential';
  totalAmount: number;
  orderCount: number;
  lastOrderDate: string;
  createdAt: string;
}

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-800">客户详情</h2>
          <button
            onClick={onClose}
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
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-paper-300 rounded-full">
                      <User className="h-6 w-6 text-ink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-ink-800">{customer.name}</p>
                      <p className="text-sm text-ink-500">{customer.company}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.address}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 pt-3 border-t border-paper-600">
                    <div>
                      <p className="text-xs text-ink-500">客户等级</p>
                      <PaperBadge variant={
                        customer.level === 'A' ? 'success' :
                        customer.level === 'B' ? 'info' :
                        customer.level === 'C' ? 'warning' : 'error'
                      }>
                        {customer.level}级客户
                      </PaperBadge>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">状态</p>
                      <PaperStatus 
                        status={customer.status === 'active' ? 'active' : 
                               customer.status === 'potential' ? 'info' : 'inactive'}
                        text={
                          customer.status === 'active' ? '活跃客户' :
                          customer.status === 'potential' ? '潜在客户' : '非活跃'
                        }
                      />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
            
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>业务统计</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-paper-300 rounded-lg">
                      <DollarSign className="h-8 w-8 text-success-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ink-800">
                        ¥{customer.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-ink-500">累计交易额</p>
                    </div>
                    <div className="text-center p-4 bg-paper-300 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-info-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ink-800">
                        {customer.orderCount}
                      </p>
                      <p className="text-sm text-ink-500">订单数量</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ink-600">最后交易时间</span>
                      <span className="text-sm text-ink-800">{customer.lastOrderDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ink-600">注册时间</span>
                      <span className="text-sm text-ink-800">{customer.createdAt}</span>
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-end space-x-3">
          <PaperButton variant="outline" onClick={onClose}>
            关闭
          </PaperButton>
          <PaperButton variant="primary">
            <Edit className="h-4 w-4 mr-2" />
            编辑客户
          </PaperButton>
        </div>
      </div>
    </div>
  );
};

export default function CustomerManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  // 模拟客户数据
  const customers: Customer[] = [
    {
      id: '1',
      name: '张总',
      company: '张总装修公司',
      phone: '13800138000',
      email: 'zhang@example.com',
      address: '北京市朝阳区建国门外大街1号',
      level: 'A',
      status: 'active',
      totalAmount: 1250000,
      orderCount: 15,
      lastOrderDate: '2024-01-15',
      createdAt: '2023-06-15'
    },
    {
      id: '2',
      name: '李经理',
      company: '李经理设计工作室',
      phone: '13900139000',
      email: 'li@example.com',
      address: '上海市浦东新区陆家嘴环路2号',
      level: 'B',
      status: 'active',
      totalAmount: 850000,
      orderCount: 12,
      lastOrderDate: '2024-01-14',
      createdAt: '2023-08-20'
    },
    {
      id: '3',
      name: '王总',
      company: '王总建筑工程公司',
      phone: '13700137000',
      email: 'wang@example.com',
      address: '广州市天河区珠江新城3号',
      level: 'A',
      status: 'potential',
      totalAmount: 0,
      orderCount: 0,
      lastOrderDate: '-',
      createdAt: '2024-01-10'
    },
    {
      id: '4',
      name: '赵总',
      company: '赵总装饰集团',
      phone: '13600136000',
      email: 'zhao@example.com',
      address: '深圳市南山区科技园4号',
      level: 'C',
      status: 'inactive',
      totalAmount: 320000,
      orderCount: 5,
      lastOrderDate: '2023-12-20',
      createdAt: '2023-03-10'
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'potential': return 'info';
      case 'inactive': return 'error';
      default: return 'info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'potential': return '潜在';
      case 'inactive': return '非活跃';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-paper-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">客户经营</h1>
            <p className="text-ink-500 mt-1">管理您的装修企业合作伙伴</p>
          </div>
          <div className="flex space-x-3">
            <PaperButton variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </PaperButton>
            <PaperButton variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              新增客户
            </PaperButton>
          </div>
        </div>

        {/* 搜索栏 */}
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <PaperInput
                  placeholder="搜索客户名称、公司或手机号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <PaperButton>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </PaperButton>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500">总客户数</p>
                  <p className="text-2xl font-bold text-ink-800">{customers.length}</p>
                </div>
                <div className="p-3 bg-info-100 rounded-full">
                  <Users className="h-6 w-6 text-info-600" />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
          
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500">活跃客户</p>
                  <p className="text-2xl font-bold text-ink-800">
                    {customers.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-success-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
          
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500">潜在客户</p>
                  <p className="text-2xl font-bold text-ink-800">
                    {customers.filter(c => c.status === 'potential').length}
                  </p>
                </div>
                <div className="p-3 bg-warning-100 rounded-full">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
          
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500">总交易额</p>
                  <p className="text-2xl font-bold text-ink-800">
                    ¥{customers.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-error-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>

        {/* 客户列表 */}
        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <PaperCardTitle>客户列表</PaperCardTitle>
              <PaperButton variant="outline" size="sm">
                导出数据
              </PaperButton>
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>客户信息</PaperTableCell>
                <PaperTableCell>联系方式</PaperTableCell>
                <PaperTableCell>等级</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
                <PaperTableCell>交易额</PaperTableCell>
                <PaperTableCell>订单数</PaperTableCell>
                <PaperTableCell>最后交易</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {paginatedCustomers.map((customer) => (
                  <PaperTableRow key={customer.id}>
                    <PaperTableCell>
                      <div>
                        <p className="font-medium text-ink-800">{customer.name}</p>
                        <p className="text-sm text-ink-500">{customer.company}</p>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-ink-600">{customer.phone}</p>
                        <p className="text-sm text-ink-500">{customer.email}</p>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperBadge variant={getLevelColor(customer.level)}>
                        {customer.level}级
                      </PaperBadge>
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperStatus 
                        status={getStatusColor(customer.status)}
                        text={getStatusText(customer.status)}
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <span className="font-medium text-ink-800">
                        ¥{customer.totalAmount.toLocaleString()}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <span className="text-ink-600">{customer.orderCount}</span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <span className="text-sm text-ink-600">{customer.lastOrderDate}</span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className="h-3 w-3" />
                        </PaperButton>
                        <PaperButton
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-3 w-3" />
                        </PaperButton>
                        <PaperButton
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="h-3 w-3" />
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
              totalItems={filteredCustomers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </PaperCardContent>
        </PaperCard>

        {/* 客户详情模态框 */}
        {selectedCustomer && (
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </div>
  );
}
