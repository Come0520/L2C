import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Users, CheckCircle, Clock, DollarSign } from 'lucide-react';
import React from 'react';

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table';
import { getAllCustomers, getCustomerStats, getCustomerById, Customer } from '@/services/customers.server';

// 动态导入客户详情模态框，支持客户端交互
const CustomerDetailModal = React.lazy(() =>
  import('@/features/customers/components/CustomerDetailModal').then(module => ({ default: module.CustomerDetailModal }))
);

import { CustomerSearch } from './components/customer-search';

export default async function CustomerManagementPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  // 从URL参数获取筛选状态
  const searchTerm = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const currentPage = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const itemsPerPage = 10;
  const detailCustomerId = typeof resolvedSearchParams.detail === 'string' ? resolvedSearchParams.detail : undefined;

  // 获取客户数据和统计信息
  const { customers, total } = await getAllCustomers(currentPage, itemsPerPage, searchTerm);
  const stats = await getCustomerStats();
  const detailCustomer = detailCustomerId ? await getCustomerById(detailCustomerId) : null;

  const totalPages = Math.ceil(total / itemsPerPage);

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
              <CustomerSearch />
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
                  <p className="text-2xl font-bold text-ink-800">{stats.totalCustomers}</p>
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
                  <p className="text-2xl font-bold text-ink-800">{stats.activeCustomers}</p>
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
                  <p className="text-2xl font-bold text-ink-800">{stats.potentialCustomers}</p>
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
                    ¥{stats.totalAmount.toLocaleString()}
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
                {customers.map((customer) => (
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
                          onClick={() => {
                            // 使用URL参数打开详情模态框
                            const params = new URLSearchParams(window.location.search);
                            params.set('detail', customer.id);
                            window.history.pushState({}, '', `?${params.toString()}`);
                          }}
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
              totalPages={Math.ceil(total / itemsPerPage)}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                const params = new URLSearchParams(window.location.search);
                params.set('page', page.toString());
                window.location.search = params.toString();
              }}
            />
          </PaperCardContent>
        </PaperCard>

        {/* 客户详情模态框 */}
        {detailCustomer && (
          <React.Suspense fallback={<div>加载中...</div>}>
            <CustomerDetailModal
              customer={detailCustomer}
              onClose={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete('detail');
                window.history.pushState({}, '', `?${params.toString()}`);
              }}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
}
