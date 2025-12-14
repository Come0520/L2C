import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

// 使用项目中实际存在的组件
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardDescription, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperCheckbox } from '@/components/ui/paper-checkbox';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperSelect } from '@/components/ui/paper-select';
import { PaperTable, PaperTableBody, PaperTableCaption, PaperTableCell, PaperTableHead, PaperTableHeader, PaperTableRow } from '@/components/ui/paper-table';
import { PaperTextarea } from '@/components/ui/paper-textarea';
import { ReconciliationAnomaly, AnomalyType, AnomalySeverity } from '@/shared/types/reconciliation';

interface ReconciliationAnomalyHandlerProps {
  anomalies: ReconciliationAnomaly[];
  isLoading?: boolean;
  onAnomalyAction: (anomalyId: string, action: 'resolve' | 'ignore' | 'investigate', notes?: string) => Promise<void>;
  onBatchAction: (anomalyIds: string[], action: 'resolve' | 'ignore' | 'investigate', notes?: string) => Promise<void>;
}

const ReconciliationAnomalyHandler: React.FC<ReconciliationAnomalyHandlerProps> = ({
  anomalies,
  isLoading = false,
  onAnomalyAction,
  onBatchAction
}) => {
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<ReconciliationAnomaly | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 简化的异常类型名称获取函数
  const getAnomalyTypeName = (type: AnomalyType): string => {
    const typeNames: Record<AnomalyType, string> = {
      [AnomalyType.AMOUNT_MISMATCH]: '金额不匹配',
      [AnomalyType.DATE_MISMATCH]: '日期不匹配',
      [AnomalyType.DUPLICATE_TRANSACTION]: '重复交易',
      [AnomalyType.STATUS_MISMATCH]: '状态不匹配',
      [AnomalyType.SUSPICIOUS_TRANSACTION]: '可疑交易',
      [AnomalyType.INVALID_DATA]: '无效数据',
      [AnomalyType.MISSING_REQUIRED_FIELDS]: '缺少必填字段',
      [AnomalyType.CURRENCY_MISMATCH]: '货币不匹配',
      [AnomalyType.OTHER]: '其他异常'
    };
    return typeNames[type] || '未知类型';
  };

  // 简化的严重程度信息获取函数
  const getSeverityInfo = (severity: AnomalySeverity): { name: string; color: string } => {
    const severityInfo: Record<AnomalySeverity, { name: string; color: string }> = {
      [AnomalySeverity.CRITICAL]: { name: '严重', color: '#dc2626' },
      [AnomalySeverity.HIGH]: { name: '高', color: '#f59e0b' },
      [AnomalySeverity.MEDIUM]: { name: '中', color: '#eab308' },
      [AnomalySeverity.LOW]: { name: '低', color: '#10b981' }
    };
    return severityInfo[severity] || { name: '未知', color: '#6b7280' };
  };

  // 过滤异常
  const filteredAnomalies = anomalies.filter(anomaly => {
    const matchesType = filterType === 'all' || anomaly.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || anomaly.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || anomaly.status === filterStatus;
    const matchesSearch = !searchTerm || 
      anomaly.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomaly.details?.item?.sourceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  // 切换异常选择
  const toggleAnomalySelection = (anomalyId: string) => {
    setSelectedAnomalies(prev => {
      if (prev.includes(anomalyId)) {
        return prev.filter(id => id !== anomalyId);
      } else {
        return [...prev, anomalyId];
      }
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedAnomalies.length === filteredAnomalies.length) {
      setSelectedAnomalies([]);
    } else {
      setSelectedAnomalies(filteredAnomalies.map(anomaly => anomaly.id));
    }
  };

  // 处理单个异常
  const handleAnomalyAction = async (anomaly: ReconciliationAnomaly, action: 'resolve' | 'ignore' | 'investigate') => {
    setIsProcessing(true);
    try {
      await onAnomalyAction(anomaly.id, action, actionNotes);
      setSelectedAnomaly(null);
      setActionNotes('');
    } catch (error) {
      console.error('处理异常失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 批量处理异常
  const handleBatchAction = async (action: 'resolve' | 'ignore' | 'investigate') => {
    if (selectedAnomalies.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBatchAction(selectedAnomalies, action, actionNotes);
      setSelectedAnomalies([]);
      setActionNotes('');
    } catch (error) {
      console.error('批量处理异常失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 异常统计
  const anomalyStats = {
    total: anomalies.length,
    new: anomalies.filter(a => a.status === 'new').length,
    investigating: anomalies.filter(a => a.status === 'investigating').length,
    resolved: anomalies.filter(a => a.status === 'resolved').length,
    ignored: anomalies.filter(a => a.status === 'ignored').length,
    critical: anomalies.filter(a => a.severity === AnomalySeverity.CRITICAL).length,
    high: anomalies.filter(a => a.severity === AnomalySeverity.HIGH).length,
    medium: anomalies.filter(a => a.severity === AnomalySeverity.MEDIUM).length,
    low: anomalies.filter(a => a.severity === AnomalySeverity.LOW).length
  };

  return (
    <div className="space-y-4">
      {/* 异常统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">总异常数</p>
            <h3 className="text-2xl font-bold">{anomalyStats.total}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">待处理</p>
            <h3 className="text-2xl font-bold text-yellow-600">{anomalyStats.new}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">处理中</p>
            <h3 className="text-2xl font-bold text-blue-600">{anomalyStats.investigating}</h3>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500">已解决</p>
            <h3 className="text-2xl font-bold text-green-600">{anomalyStats.resolved}</h3>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 严重程度统计 */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-2 inline-block"></span>
          严重: {anomalyStats.critical}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 inline-block"></span>
          高: {anomalyStats.high}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2 inline-block"></span>
          中: {anomalyStats.medium}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block"></span>
          低: {anomalyStats.low}
        </span>
      </div>

      {/* 筛选和批量操作 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>对账异常管理</PaperCardTitle>
          <PaperCardDescription>查看和处理对账过程中检测到的异常</PaperCardDescription>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-1">
              <PaperSelect
                value={filterType}
                onChange={(value) => setFilterType(value)}
                options={[
                  { value: 'all', label: '所有类型' },
                  ...Object.values(AnomalyType).map(type => ({
                    value: type,
                    label: getAnomalyTypeName(type)
                  }))
                ]}
              />
            </div>
            <div className="md:col-span-1">
              <PaperSelect
                value={filterSeverity}
                onChange={(value) => setFilterSeverity(value)}
                options={[
                  { value: 'all', label: '所有严重程度' },
                  ...Object.values(AnomalySeverity).map(severity => ({
                    value: severity,
                    label: getSeverityInfo(severity).name
                  }))
                ]}
              />
            </div>
            <div className="md:col-span-1">
              <PaperSelect
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                options={[
                  { value: 'all', label: '所有状态' },
                  { value: 'new', label: '待处理' },
                  { value: 'investigating', label: '处理中' },
                  { value: 'resolved', label: '已解决' },
                  { value: 'ignored', label: '已忽略' }
                ]}
              />
            </div>
            <div className="md:col-span-1">
              <PaperInput
                placeholder="搜索异常..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* 批量操作按钮 */}
          {selectedAnomalies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex-1 min-w-[200px]">
                <PaperTextarea
                  placeholder="处理备注（可选）"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="h-20"
                />
              </div>
              <div className="flex gap-2">
                <PaperButton 
                  variant="outline" 
                  onClick={() => handleBatchAction('resolve')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  批量解决
                </PaperButton>
                <PaperButton 
                  variant="outline" 
                  onClick={() => handleBatchAction('ignore')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  批量忽略
                </PaperButton>
                <PaperButton 
                  variant="outline" 
                  onClick={() => handleBatchAction('investigate')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  批量标记处理中
                </PaperButton>
              </div>
            </div>
          )}

          {/* 异常列表 */}
          <div className="overflow-auto">
            <PaperTable>
              <PaperTableCaption>共 {filteredAnomalies.length} 个异常</PaperTableCaption>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableHead className="w-10">
                    <PaperCheckbox
                      checked={selectedAnomalies.length === filteredAnomalies.length && filteredAnomalies.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </PaperTableHead>
                  <PaperTableHead>异常类型</PaperTableHead>
                  <PaperTableHead>严重程度</PaperTableHead>
                  <PaperTableHead>描述</PaperTableHead>
                  <PaperTableHead>单据号</PaperTableHead>
                  <PaperTableHead>金额</PaperTableHead>
                  <PaperTableHead>日期</PaperTableHead>
                  <PaperTableHead>状态</PaperTableHead>
                  <PaperTableHead>操作</PaperTableHead>
                </PaperTableRow>
              </PaperTableHeader>
              <PaperTableBody>
                {filteredAnomalies.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={9} className="text-center py-8">
                      暂无异常数据
                    </PaperTableCell>
                  </PaperTableRow>
                ) : (
                  filteredAnomalies.map((anomaly) => {
                    const severityInfo = getSeverityInfo(anomaly.severity);
                    return (
                      <PaperTableRow key={anomaly.id}>
                        <PaperTableCell>
                          <PaperCheckbox
                            checked={selectedAnomalies.includes(anomaly.id)}
                            onCheckedChange={() => toggleAnomalySelection(anomaly.id)}
                          />
                        </PaperTableCell>
                        <PaperTableCell>
                          <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                            {getAnomalyTypeName(anomaly.type)}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>
                          <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: severityInfo.color }}>
                            {severityInfo.name}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>{anomaly.description}</PaperTableCell>
                        <PaperTableCell>{anomaly.details?.item?.sourceNo}</PaperTableCell>
                        <PaperTableCell>
                          {anomaly.details?.item?.amount ? (
                            <span className="font-medium">
                              ￥{anomaly.details.item.amount.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </PaperTableCell>
                        <PaperTableCell>{anomaly.details?.item?.date?.substring(0, 10)}</PaperTableCell>
                        <PaperTableCell>
                          <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                            {anomaly.status === 'new' ? '待处理' :
                             anomaly.status === 'investigating' ? '处理中' :
                             anomaly.status === 'resolved' ? '已解决' : '已忽略'}
                          </span>
                        </PaperTableCell>
                        <PaperTableCell>
                          <PaperButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAnomaly(anomaly)}
                          >
                            处理
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

      {/* 异常详情模态框 */}
      {selectedAnomaly && (
        <PaperModal
          isOpen={!!selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          title="处理对账异常"
          className="max-w-2xl"
        >
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">异常详情</h4>
              <p>{selectedAnomaly.description}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">严重程度</h4>
              <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: getSeverityInfo(selectedAnomaly.severity).color }}>
                {getSeverityInfo(selectedAnomaly.severity).name}
              </span>
            </div>
            {selectedAnomaly.details?.item && (
              <div>
                <h4 className="font-medium mb-2">关联单据</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">单据类型</p>
                    <p>{selectedAnomaly.details.item.sourceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">单据号</p>
                    <p>{selectedAnomaly.details.item.sourceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">金额</p>
                    <p>￥{selectedAnomaly.details.item.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">日期</p>
                    <p>{selectedAnomaly.details.item.date}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2">处理备注</h4>
              <PaperTextarea
                placeholder="请输入处理备注..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="h-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <PaperButton variant="outline" onClick={() => setSelectedAnomaly(null)}>
                取消
              </PaperButton>
              <PaperButton 
                variant="outline" 
                onClick={() => handleAnomalyAction(selectedAnomaly, 'investigate')}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                标记为处理中
              </PaperButton>
              <PaperButton 
                variant="outline" 
                onClick={() => handleAnomalyAction(selectedAnomaly, 'ignore')}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                忽略
              </PaperButton>
              <PaperButton 
                variant="primary" 
                onClick={() => handleAnomalyAction(selectedAnomaly, 'resolve')}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                解决
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      )}
    </div>
  );
};

export default ReconciliationAnomalyHandler;