'use client';

import React, { Suspense } from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table';
import { Skeleton } from '@/components/ui/skeleton';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed-won' | 'closed-lost';
  source: string;
  assignedTo: string;
  createdAt: string;
}

// 模拟数据获取函数
const fetchLeads = async (): Promise<Lead[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 生成模拟数据
  const sources = ['网站', '社交媒体', '推荐', '展会', '电话'] as const;
  const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'closed-won', 'closed-lost'] as const
  return Array.from({ length: 20 }).map((_, index) => ({
    id: `lead-${index + 1}`,
    name: `客户 ${index + 1}`,
    company: `公司 ${index + 1}`,
    email: `customer${index + 1}@example.com`,
    phone: `1380013800${index % 10}`,
    status: statusOptions[index % statusOptions.length] as (typeof statusOptions)[number],
    source: sources[index % sources.length] ?? '网站',
    assignedTo: `销售 ${index % 3 + 1}`,
    createdAt: `2024-01-${Math.floor(Math.random() * 28) + 1}`,
  }));
};

// 线索列表组件
const LeadsList = () => {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    const loadLeads = async () => {
      try {
        const leadsData = await fetchLeads();
        setLeads(leadsData);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border-b border-paper-600">
            <Skeleton width="40px" height="40px" variant="circle" />
            <div className="flex-1 space-y-1">
              <Skeleton height="1rem" width="150px" variant="rounded" />
              <Skeleton height="0.875rem" width="100px" variant="rounded" className="opacity-70" />
            </div>
            <Skeleton width="100px" height="1.5rem" variant="rounded" />
            <Skeleton width="100px" height="1.5rem" variant="rounded" />
            <Skeleton width="100px" height="1.5rem" variant="rounded" />
            <Skeleton width="100px" height="1.5rem" variant="rounded" />
            <div className="flex space-x-2">
              <Skeleton width="60px" height="2rem" variant="rounded" />
              <Skeleton width="60px" height="2rem" variant="rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = leads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <PaperTable>
        <PaperTableHeader>
          <PaperTableCell>客户</PaperTableCell>
          <PaperTableCell>公司</PaperTableCell>
          <PaperTableCell>邮箱</PaperTableCell>
          <PaperTableCell>电话</PaperTableCell>
          <PaperTableCell>状态</PaperTableCell>
          <PaperTableCell>来源</PaperTableCell>
          <PaperTableCell>负责人</PaperTableCell>
          <PaperTableCell>操作</PaperTableCell>
        </PaperTableHeader>
        <PaperTableBody>
          {currentLeads.map((lead) => (
            <PaperTableRow key={lead.id}>
              <PaperTableCell className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {lead.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.company}</div>
                </div>
              </PaperTableCell>
              <PaperTableCell>{lead.company}</PaperTableCell>
              <PaperTableCell>{lead.email}</PaperTableCell>
              <PaperTableCell>{lead.phone}</PaperTableCell>
              <PaperTableCell>
                <PaperBadge variant="success">{lead.status}</PaperBadge>
              </PaperTableCell>
              <PaperTableCell>{lead.source}</PaperTableCell>
              <PaperTableCell>{lead.assignedTo}</PaperTableCell>
              <PaperTableCell>
                <div className="flex space-x-2">
                  <PaperButton size="sm" variant="ghost">
                    查看
                  </PaperButton>
                  <PaperButton size="sm" variant="outline">
                    编辑
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
        totalItems={leads.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

// 带 Suspense 的线索列表容器
const LeadsListWithSuspense = () => {
  return (
    <Suspense fallback={<Skeleton height="600px" variant="rounded" />}>
      <LeadsList />
    </Suspense>
  );
};

export default LeadsListWithSuspense;
