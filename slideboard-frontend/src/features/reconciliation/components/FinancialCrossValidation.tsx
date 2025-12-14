import { RefreshCw, Info, Filter, Search } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperSelect } from '@/components/ui/paper-select';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableCell, PaperTableRow } from '@/components/ui/paper-table';
// 移除不存在的 Input 组件导入
import { CrossValidationResult, CrossValidationType, ValidationStatus, CrossValidationConfig } from '@/lib/reconciliation/crossValidation';
import { ReconciliationStatement } from '@/shared/types/reconciliation';


interface FinancialCrossValidationProps {
  statements?: ReconciliationStatement[];
  selectedStatement?: ReconciliationStatement | null;
  onValidationComplete?: (results: CrossValidationResult[]) => void;
}

const FinancialCrossValidation: React.FC<FinancialCrossValidationProps> = ({
  statements = [],
  selectedStatement,
  onValidationComplete
}) => {
  const [validationResults, setValidationResults] = useState<CrossValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [validationConfig, setValidationConfig] = useState<CrossValidationConfig>({
    tolerance: 0.01,
    enableOrderFinanceValidation: true,
    enableInvoiceReceiptValidation: true,
    enableReconciliationLedgerValidation: true,
    enableFinanceTaxValidation: false,
    enableInventoryFinanceValidation: false,
    batchConcurrency: 5
  });
  
  // 执行勾稽验证
  const handleValidate = async () => {
    if (statements.length === 0 && !selectedStatement) {
      return;
    }
    
    setIsValidating(true);
    try {
      const targetStatements = selectedStatement ? [selectedStatement] : statements;
      // 这里应该调用API执行验证，暂时返回模拟数据
      const results: CrossValidationResult[] = [];
      setValidationResults(results);
      onValidationComplete?.(results);
    } catch (error) {
      console.error('勾稽验证失败:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  // 更新验证配置
  const handleConfigChange = (field: keyof CrossValidationConfig, value: any) => {
    setValidationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 保存验证配置
  const handleSaveConfig = () => {
    setShowConfigModal(false);
  };
  
  // 过滤验证结果
  const filteredResults = validationResults.filter(result => {
    const matchesType = filterType === 'all' || result.type === filterType;
    const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
    return matchesType && matchesStatus;
  });
  
  // 生成验证报告
  // const validationReport = validationService.generateValidationReport(validationResults);
  
  // 格式化状态显示
  const formatStatus = (status: ValidationStatus) => {
    const statusConfig = {
      valid: { text: '通过', variant: 'success' as const },
      invalid: { text: '失败', variant: 'error' as const },
      warning: { text: '警告', variant: 'warning' as const },
      not_applicable: { text: '不适用', variant: 'info' as const }
    };
    return statusConfig[status] || { text: status, variant: 'default' as const };
  };
  
  // 获取勾稽类型名称
  const getRelationTypeName = (type: CrossValidationType) => {
    const typeNames: Record<CrossValidationType, string> = {
      order_finance: '订单表 ↔ 财务表',
      invoice_receipt: '发票表 ↔ 收款表',
      reconciliation_ledger: '对账表 ↔ 总账',
      finance_tax: '财务表 ↔ 税务表',
      inventory_finance: '库存表 ↔ 财务表',
      other: '其他勾稽关系'
    };
    return typeNames[type];
  };
  
  return (
    <div className="space-y-4">
      {/* 验证报告概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">总验证项</p>
            <h3 className="text-2xl font-bold">{validationResults.length}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">验证通过</p>
            <h3 className="text-2xl font-bold text-green-600">{validationResults.filter(r => r.status === 'valid').length}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">验证警告</p>
            <h3 className="text-2xl font-bold text-yellow-600">{validationResults.filter(r => r.status === 'warning').length}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">验证失败</p>
            <h3 className="text-2xl font-bold text-red-600">{validationResults.filter(r => r.status === 'invalid').length}</h3>
          </PaperCardContent>
        </PaperCard>
      </div>
      
      {/* 操作栏 */}
      <PaperCard>
        <PaperCardHeader>
          <div className="flex justify-between items-center">
            <div>
              <PaperCardTitle>财务勾稽关系验证</PaperCardTitle>
              <p className="text-sm text-gray-500">验证不同财务表之间的勾稽关系，确保数据一致性</p>
            </div>
            <div className="flex gap-2">
              <PaperButton 
                variant="outline" 
                onClick={() => setShowConfigModal(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                配置
              </PaperButton>
              <PaperButton 
                onClick={handleValidate}
                disabled={isValidating || (statements.length === 0 && !selectedStatement)}
              >
                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isValidating ? '验证中...' : '执行验证'}
              </PaperButton>
            </div>
          </div>
        </PaperCardHeader>
        <PaperCardContent>
          {/* 筛选和搜索 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <PaperSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">所有勾稽类型</option>
                {Object.values(CrossValidationType).map((type) => (
                  <option key={type} value={type as string}>
                    {getRelationTypeName(type)}
                  </option>
                ))}
              </PaperSelect>
            </div>
            <div className="md:col-span-1">
              <PaperSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">所有状态</option>
                <option value="valid">通过</option>
                <option value="invalid">失败</option>
                <option value="warning">警告</option>
                <option value="not_applicable">不适用</option>
              </PaperSelect>
            </div>
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="border rounded px-3 py-1 w-full"
                  // 这里可以添加搜索逻辑
                />
              </div>
            </div>
          </div>
          
          {/* 验证结果表格 */}
          <div className="overflow-auto">
            <PaperTable>
              <caption className="caption-bottom text-sm text-gray-500 text-center mb-2">共 {filteredResults.length} 条验证结果</caption>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableCell>勾稽类型</PaperTableCell>
                  <PaperTableCell>名称</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>差异</PaperTableCell>
                  <PaperTableCell>百分比差异</PaperTableCell>
                  <PaperTableCell>源表金额</PaperTableCell>
                  <PaperTableCell>目标表金额</PaperTableCell>
                  <PaperTableCell>源表</PaperTableCell>
                  <PaperTableCell>目标表</PaperTableCell>
                  <PaperTableCell>验证时间</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableRow>
              </PaperTableHeader>
              <PaperTableBody>
                {filteredResults.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={11} className="text-center py-8">
                      {isValidating ? '正在执行验证...' : '暂无验证结果，请点击执行验证按钮'}
                    </PaperTableCell>
                  </PaperTableRow>
                ) : (
                  filteredResults.map((result) => {
                    const statusConfig = formatStatus(result.status);
                    return (
                      <PaperTableRow key={result.id}>
                        <PaperTableCell>
                          <PaperBadge variant="outline">
                            {getRelationTypeName(result.type)}
                          </PaperBadge>
                        </PaperTableCell>
                        <PaperTableCell>{result.name}</PaperTableCell>
                        <PaperTableCell>
                          <PaperBadge variant={statusConfig.variant}>
                            {statusConfig.text}
                          </PaperBadge>
                        </PaperTableCell>
                        <PaperTableCell
                          className={
                            result.difference > 0 ? 'text-red-600' :
                            result.difference < 0 ? 'text-green-600' : ''
                          }
                        >
                          {result.difference.toFixed(2)}
                        </PaperTableCell>
                        <PaperTableCell>{result.percentageDifference.toFixed(2)}%</PaperTableCell>
                        <PaperTableCell>{result.sourceAmount.toFixed(2)}</PaperTableCell>
                        <PaperTableCell>{result.targetAmount.toFixed(2)}</PaperTableCell>
                        <PaperTableCell>{result.sourceTable}</PaperTableCell>
                        <PaperTableCell>{result.targetTable}</PaperTableCell>
                        <PaperTableCell>
                          {new Date(result.validatedAt).toLocaleString()}
                        </PaperTableCell>
                        <PaperTableCell>
                          {/* 简化的详情按钮，移除复杂的模态框 */}
                          <PaperButton variant="outline" size="sm">
                            <Info className="mr-2 h-4 w-4" />
                            详情
                          </PaperButton>
                        </PaperTableCell>
                      </PaperTableRow>
                    );
                  })
                )}
              </PaperTableBody>
            </PaperTable>
          </div>
        </PaperCardContent>
      </PaperCard>
      
      {/* 验证配置模态框 */}
      <PaperModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)}>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">勾稽验证配置</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tolerance" className="block text-sm font-medium text-gray-700">金额差异容忍度</label>
                <input
                  id="tolerance"
                  type="number"
                  step="0.01"
                  value={validationConfig.tolerance}
                  onChange={(e) => handleConfigChange('tolerance', parseFloat(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="text-sm text-gray-500 mt-1">
                  当差异小于等于此值时，验证通过
                </p>
              </div>
              <div>
                <label htmlFor="batchConcurrency" className="block text-sm font-medium text-gray-700">批量验证并发数</label>
                <input
                  id="batchConcurrency"
                  type="number"
                  value={validationConfig.batchConcurrency}
                  onChange={(e) => handleConfigChange('batchConcurrency', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="text-sm text-gray-500 mt-1">
                  批量验证时的并发请求数
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">启用的勾稽验证类型</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="orderFinance" className="block text-sm font-medium text-gray-700">订单表 ↔ 财务表</label>
                  <p className="text-sm text-gray-500">
                    验证订单数据与财务数据的一致性
                  </p>
                </div>
                <input
                  id="orderFinance"
                  type="checkbox"
                  checked={validationConfig.enableOrderFinanceValidation}
                  onChange={(e) => handleConfigChange('enableOrderFinanceValidation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="invoiceReceipt" className="block text-sm font-medium text-gray-700">发票表 ↔ 收款表</label>
                  <p className="text-sm text-gray-500">
                    验证发票数据与收款数据的一致性
                  </p>
                </div>
                <input
                  id="invoiceReceipt"
                  type="checkbox"
                  checked={validationConfig.enableInvoiceReceiptValidation}
                  onChange={(e) => handleConfigChange('enableInvoiceReceiptValidation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="reconciliationLedger" className="block text-sm font-medium text-gray-700">对账表 ↔ 总账</label>
                  <p className="text-sm text-gray-500">
                    验证对账数据与总账数据的一致性
                  </p>
                </div>
                <input
                  id="reconciliationLedger"
                  type="checkbox"
                  checked={validationConfig.enableReconciliationLedgerValidation}
                  onChange={(e) => handleConfigChange('enableReconciliationLedgerValidation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="financeTax" className="block text-sm font-medium text-gray-700">财务表 ↔ 税务表</label>
                  <p className="text-sm text-gray-500">
                    验证财务数据与税务数据的一致性
                  </p>
                </div>
                <input
                  id="financeTax"
                  type="checkbox"
                  checked={validationConfig.enableFinanceTaxValidation}
                  onChange={(e) => handleConfigChange('enableFinanceTaxValidation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="inventoryFinance" className="block text-sm font-medium text-gray-700">库存表 ↔ 财务表</label>
                  <p className="text-sm text-gray-500">
                    验证库存数据与财务数据的一致性
                  </p>
                </div>
                <input
                  id="inventoryFinance"
                  type="checkbox"
                  checked={validationConfig.enableInventoryFinanceValidation}
                  onChange={(e) => handleConfigChange('enableInventoryFinanceValidation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <PaperButton variant="outline" onClick={() => setShowConfigModal(false)}>
              取消
            </PaperButton>
            <PaperButton onClick={handleSaveConfig}>
              保存配置
            </PaperButton>
          </div>
        </div>
      </PaperModal>
    </div>
  );
};

export default FinancialCrossValidation;
