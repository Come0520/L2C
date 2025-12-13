'use client';

import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  balance: number;
  relatedOrder?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  pendingIncome: number;
  pendingExpense: number;
  monthlyAverage: number;
  thisMonth: number;
  lastMonth: number;
  growthRate: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  tax: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type: 'sales' | 'purchase';
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'invoices' | 'reports'>('overview');
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const financialSummary: FinancialSummary = {
    totalIncome: 1256800,
    totalExpense: 892400,
    netProfit: 364400,
    pendingIncome: 156000,
    pendingExpense: 89000,
    monthlyAverage: 98750,
    thisMonth: 145600,
    lastMonth: 123400,
    growthRate: 18.0
  };

  const financialRecords: FinancialRecord[] = [
    {
      id: 'REC001',
      date: '2024-01-15',
      type: 'income',
      category: '项目收入',
      description: '装修项目A阶段收款 - 客户：现代家居公司',
      amount: 85000,
      balance: 456200,
      relatedOrder: 'ORD20240115001',
      status: 'confirmed'
    },
    {
      id: 'REC002',
      date: '2024-01-14',
      type: 'expense',
      category: '材料采购',
      description: '瓷砖采购 - 供应商：金牌建材',
      amount: -23000,
      balance: 371200,
      relatedOrder: 'PUR20240114002',
      status: 'confirmed'
    },
    {
      id: 'REC003',
      date: '2024-01-13',
      type: 'income',
      category: '服务收入',
      description: '设计服务费 - 客户：张总别墅项目',
      amount: 15000,
      balance: 394200,
      relatedOrder: 'DES20240113003',
      status: 'confirmed'
    },
    {
      id: 'REC004',
      date: '2024-01-12',
      type: 'expense',
      category: '人工成本',
      description: '施工队工资结算',
      amount: -45000,
      balance: 379200,
      status: 'confirmed'
    },
    {
      id: 'REC005',
      date: '2024-01-11',
      type: 'income',
      category: '项目收入',
      description: '装修项目B阶段收款 - 客户：科技公司',
      amount: 120000,
      balance: 424200,
      relatedOrder: 'ORD20240111005',
      status: 'pending'
    }
  ];

  const invoices: Invoice[] = [
    {
      id: 'INV001',
      invoiceNumber: 'FP20240115001',
      customerName: '现代家居有限公司',
      amount: 85000,
      tax: 11050,
      totalAmount: 96050,
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'paid',
      type: 'sales'
    },
    {
      id: 'INV002',
      invoiceNumber: 'FP20240114002',
      customerName: '金牌建材供应商',
      amount: 23000,
      tax: 2990,
      totalAmount: 25990,
      issueDate: '2024-01-14',
      dueDate: '2024-02-14',
      status: 'sent',
      type: 'purchase'
    },
    {
      id: 'INV003',
      invoiceNumber: 'FP20240111003',
      customerName: '创新科技有限公司',
      amount: 120000,
      tax: 15600,
      totalAmount: 135600,
      issueDate: '2024-01-11',
      dueDate: '2024-02-11',
      status: 'sent',
      type: 'sales'
    },
    {
      id: 'INV004',
      invoiceNumber: 'FP20240110004',
      customerName: '精工装修团队',
      amount: 45000,
      tax: 5850,
      totalAmount: 50850,
      issueDate: '2024-01-10',
      dueDate: '2024-01-25',
      status: 'overdue',
      type: 'purchase'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'text-paper-success';
      case 'pending':
      case 'sent':
        return 'text-paper-warning';
      case 'cancelled':
      case 'overdue':
        return 'text-paper-error';
      case 'draft':
        return 'text-paper-ink-secondary';
      default:
        return 'text-paper-ink';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: 'bg-paper-success-light text-paper-success',
      paid: 'bg-paper-success-light text-paper-success',
      pending: 'bg-paper-warning-light text-paper-warning',
      sent: 'bg-paper-warning-light text-paper-warning',
      cancelled: 'bg-paper-error-light text-paper-error',
      overdue: 'bg-paper-error-light text-paper-error',
      draft: 'bg-paper-ink-light text-paper-ink-secondary'
    };
    return colors[status as keyof typeof colors] || 'bg-paper-ink-light text-paper-ink';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount);
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-paper-ink">财务与报表</h1>
            <p className="text-paper-ink-secondary mt-1">管理财务收支，生成各类财务报表</p>
          </div>
          <div className="flex gap-3">
            <PaperButton variant="primary">
              新增收支记录
            </PaperButton>
            <PaperButton variant="secondary">
              开具发票
            </PaperButton>
            <PaperButton variant="outline">
              导出报表
            </PaperButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <PaperCard>
          <PaperCardContent className="p-0">
            <div className="border-b border-paper-border">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  财务概览
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'records'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  收支记录
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'invoices'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  发票管理
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'reports'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  财务报表
                </button>
              </nav>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4">
          <PaperInput
            type="date"
            placeholder="开始日期"
            className="w-40"
          />
          <span className="text-paper-ink-secondary">至</span>
          <PaperInput
            type="date"
            placeholder="结束日期"
            className="w-40"
          />
          <PaperButton variant="outline" size="sm">
            查询
          </PaperButton>
          <PaperButton variant="ghost" size="sm">
            重置
          </PaperButton>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>总收入</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent>
                  <div className="text-3xl font-bold text-paper-success">
                    {formatCurrency(financialSummary.totalIncome)}
                  </div>
                  <div className="text-sm text-paper-ink-secondary mt-2">
                    待确认收入: {formatCurrency(financialSummary.pendingIncome)}
                  </div>
                </PaperCardContent>
              </PaperCard>

              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>总支出</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent>
                  <div className="text-3xl font-bold text-paper-error">
                    {formatCurrency(financialSummary.totalExpense)}
                  </div>
                  <div className="text-sm text-paper-ink-secondary mt-2">
                    待确认支出: {formatCurrency(financialSummary.pendingExpense)}
                  </div>
                </PaperCardContent>
              </PaperCard>

              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>净利润</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent>
                  <div className="text-3xl font-bold text-paper-primary">
                    {formatCurrency(financialSummary.netProfit)}
                  </div>
                  <div className="text-sm text-paper-ink-secondary mt-2">
                    利润率: {((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)}%
                  </div>
                </PaperCardContent>
              </PaperCard>

              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>月度对比</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent>
                  <div className="text-3xl font-bold text-paper-warning">
                    {formatCurrency(financialSummary.thisMonth)}
                  </div>
                  <div className="text-sm text-paper-ink-secondary mt-2">
                    <span className={financialSummary.growthRate >= 0 ? 'text-paper-success' : 'text-paper-error'}>
                      {financialSummary.growthRate >= 0 ? '+' : ''}{financialSummary.growthRate}%
                    </span>
                    {' '}较上月
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>

            {/* Monthly Trend */}
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>月度收支趋势</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="h-64 flex items-center justify-center bg-paper-background rounded-lg">
                  <div className="text-paper-ink-secondary text-center">
                    <div className="text-lg mb-2">📊</div>
                    <div>月度收支趋势图表</div>
                    <div className="text-sm mt-1">显示最近12个月的数据</div>
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>
          </>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>收支记录</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <PaperTable>
                <PaperTableHeader>
                  <tr>
                    <th className="text-left">日期</th>
                    <th className="text-left">类型</th>
                    <th className="text-left">分类</th>
                    <th className="text-left">描述</th>
                    <th className="text-left">金额</th>
                    <th className="text-left">余额</th>
                    <th className="text-left">状态</th>
                    <th className="text-left">操作</th>
                  </tr>
                </PaperTableHeader>
                <PaperTableBody>
                  {financialRecords.map((record) => (
                    <PaperTableRow key={record.id}>
                      <PaperTableCell>
                        <div className="text-sm">{record.date}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.type === 'income' ? 'bg-paper-success-light text-paper-success' : 'bg-paper-error-light text-paper-error'
                        }`}>
                          {record.type === 'income' ? '收入' : '支出'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{record.category}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm text-paper-ink">{record.description}</div>
                        {record.relatedOrder && (
                          <div className="text-xs text-paper-ink-secondary mt-1">
                            关联订单: {record.relatedOrder}
                          </div>
                        )}
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`font-medium ${
                          record.type === 'income' ? 'text-paper-success' : 'text-paper-error'
                        }`}>
                          {record.type === 'income' ? '+' : ''}{formatCurrency(record.amount)}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="font-medium">{formatCurrency(record.balance)}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusBadge(record.status)
                        }`}>
                          {record.status === 'confirmed' ? '已确认' :
                           record.status === 'pending' ? '待确认' : '已取消'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex gap-2">
                          <PaperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowRecordModal(true);
                            }}
                          >
                            详情
                          </PaperButton>
                          <PaperButton variant="ghost" size="sm">
                            编辑
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>发票管理</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <PaperTable>
                <PaperTableHeader>
                  <tr>
                    <th className="text-left">发票编号</th>
                    <th className="text-left">客户/供应商</th>
                    <th className="text-left">类型</th>
                    <th className="text-left">金额</th>
                    <th className="text-left">税额</th>
                    <th className="text-left">总金额</th>
                    <th className="text-left">开票日期</th>
                    <th className="text-left">到期日期</th>
                    <th className="text-left">状态</th>
                    <th className="text-left">操作</th>
                  </tr>
                </PaperTableHeader>
                <PaperTableBody>
                  {invoices.map((invoice) => (
                    <PaperTableRow key={invoice.id}>
                      <PaperTableCell>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{invoice.customerName}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.type === 'sales' ? 'bg-paper-primary-light text-paper-primary' : 'bg-paper-info-light text-paper-info'
                        }`}>
                          {invoice.type === 'sales' ? '销售' : '采购'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{formatCurrency(invoice.tax)}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="font-bold">{formatCurrency(invoice.totalAmount)}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{invoice.issueDate}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{invoice.dueDate}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusBadge(invoice.status)
                        }`}>
                          {invoice.status === 'draft' ? '草稿' :
                           invoice.status === 'sent' ? '已发送' :
                           invoice.status === 'paid' ? '已付款' :
                           invoice.status === 'overdue' ? '逾期' : '已取消'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex gap-2">
                          <PaperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}
                          >
                            详情
                          </PaperButton>
                          <PaperButton variant="ghost" size="sm">
                            下载
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>收入分类报表</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="h-64 flex items-center justify-center bg-paper-background rounded-lg">
                  <div className="text-paper-ink-secondary text-center">
                    <div className="text-lg mb-2">📈</div>
                    <div>收入分类饼图</div>
                    <div className="text-sm mt-1">按项目类型分类</div>
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>支出分类报表</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="h-64 flex items-center justify-center bg-paper-background rounded-lg">
                  <div className="text-paper-ink-secondary text-center">
                    <div className="text-lg mb-2">📊</div>
                    <div>支出分类柱状图</div>
                    <div className="text-sm mt-1">按费用类型分类</div>
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>现金流量表</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-paper-success-light rounded-lg">
                    <span className="text-paper-success font-medium">经营活动现金流</span>
                    <span className="text-paper-success font-bold">+{formatCurrency(285000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-paper-error-light rounded-lg">
                    <span className="text-paper-error font-medium">投资活动现金流</span>
                    <span className="text-paper-error font-bold">-{formatCurrency(45000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-paper-info-light rounded-lg">
                    <span className="text-paper-info font-medium">筹资活动现金流</span>
                    <span className="text-paper-info font-bold">-{formatCurrency(25000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-paper-background border-t-2 border-paper-border">
                    <span className="font-bold text-paper-ink">净现金流</span>
                    <span className="font-bold text-paper-primary">+{formatCurrency(215000)}</span>
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>利润表</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-paper-ink-secondary">营业收入</span>
                    <span className="font-medium">{formatCurrency(1256800)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-paper-ink-secondary">营业成本</span>
                    <span className="font-medium text-paper-error">-{formatCurrency(892400)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-paper-border pt-2">
                    <span className="font-medium">营业利润</span>
                    <span className="font-medium">{formatCurrency(364400)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-paper-ink-secondary">营业费用</span>
                    <span className="font-medium text-paper-error">-{formatCurrency(85600)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-paper-border pt-2">
                    <span className="font-bold text-paper-ink">净利润</span>
                    <span className="font-bold text-paper-primary">{formatCurrency(278800)}</span>
                  </div>
                </div>
              </PaperCardContent>
            </PaperCard>
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {showRecordModal && selectedRecord && (
        <PaperModal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          title="收支记录详情"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-paper-ink mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">记录编号：</span>{selectedRecord.id}</div>
                  <div><span className="text-paper-ink-secondary">日期：</span>{selectedRecord.date}</div>
                  <div><span className="text-paper-ink-secondary">类型：</span>{selectedRecord.type === 'income' ? '收入' : '支出'}</div>
                  <div><span className="text-paper-ink-secondary">分类：</span>{selectedRecord.category}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-paper-ink mb-2">金额信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">金额：</span><span className={selectedRecord.type === 'income' ? 'text-paper-success' : 'text-paper-error'}>{formatCurrency(selectedRecord.amount)}</span></div>
                  <div><span className="text-paper-ink-secondary">余额：</span><span className="font-medium">{formatCurrency(selectedRecord.balance)}</span></div>
                  <div><span className="text-paper-ink-secondary">状态：</span><span className={getStatusColor(selectedRecord.status)}>{selectedRecord.status === 'confirmed' ? '已确认' : selectedRecord.status === 'pending' ? '待确认' : '已取消'}</span></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-paper-ink mb-2">描述</h4>
              <div className="text-sm bg-paper-background p-3 rounded-lg">{selectedRecord.description}</div>
            </div>
            {selectedRecord.relatedOrder && (
              <div>
                <h4 className="font-medium text-paper-ink mb-2">关联订单</h4>
                <div className="text-sm">{selectedRecord.relatedOrder}</div>
              </div>
            )}
          </div>
        </PaperModal>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <PaperModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title="发票详情"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-paper-ink mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">发票编号：</span>{selectedInvoice.invoiceNumber}</div>
                  <div><span className="text-paper-ink-secondary">客户/供应商：</span>{selectedInvoice.customerName}</div>
                  <div><span className="text-paper-ink-secondary">类型：</span>{selectedInvoice.type === 'sales' ? '销售发票' : '采购发票'}</div>
                  <div><span className="text-paper-ink-secondary">状态：</span><span className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status === 'paid' ? '已付款' : selectedInvoice.status === 'sent' ? '已发送' : selectedInvoice.status === 'overdue' ? '逾期' : '草稿'}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-paper-ink mb-2">日期信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">开票日期：</span>{selectedInvoice.issueDate}</div>
                  <div><span className="text-paper-ink-secondary">到期日期：</span>{selectedInvoice.dueDate}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-paper-ink mb-2">金额明细</h4>
              <div className="bg-paper-background p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-paper-ink-secondary">金额：</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-paper-ink-secondary">税额：</span>
                  <span>{formatCurrency(selectedInvoice.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-paper-border pt-2 font-bold">
                  <span>总金额：</span>
                  <span className="text-paper-primary">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </PaperModal>
      )}
    </>
  );
}
