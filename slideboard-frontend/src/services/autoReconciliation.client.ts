import { withErrorHandler } from '@/lib/api/error-handler';
import { ReconciliationRuleEngine, ReconciliationItem, ReconciliationResult, ReconciliationRule } from '@/lib/reconciliation/ruleEngine';
import { ApiResponse } from '@/shared/types/integrations';

import { reconciliationRules } from './reconciliationRules.client';

interface AutoReconciliationRequest {
  /**
   * 对账批次ID
   */
  batchId: string;
  /**
   * 系统内交易数据
   */
  systemTransactions: Array<{
    id: string;
    orderNo: string;
    customerId: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    status: string;
  }>;
  /**
   * 外部系统交易数据
   */
  externalTransactions: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    status: string;
    referenceNo?: string;
  }>;
  /**
   * 对账规则ID列表，为空则使用所有启用的规则
   */
  ruleIds?: string[];
  /**
   * 对账选项
   */
  options?: {
    /**
     * 是否启用自动匹配
     */
    autoMatch?: boolean;
    /**
     * 是否标记可疑交易
     */
    flagSuspicious?: boolean;
    /**
     * 金额容差（绝对值）
     */
    amountTolerance?: number;
    /**
     * 金额容差（百分比）
     */
    amountTolerancePercentage?: number;
    /**
     * 日期范围容差（天数）
     */
    dateToleranceDays?: number;
  };
}

export interface AutoReconciliationResult {
  /**
   * 对账结果ID
   */
  reconciliationId: string;
  /**
   * 对账批次ID
   */
  batchId: string;
  /**
   * 对账状态
   */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /**
   * 系统内交易总数
   */
  totalSystemTransactions: number;
  /**
   * 外部系统交易总数
   */
  totalExternalTransactions: number;
  /**
   * 匹配成功的交易对数
   */
  matchedPairsCount: number;
  /**
   * 系统内未匹配的交易数
   */
  unmatchedSystemTransactionsCount: number;
  /**
   * 外部系统未匹配的交易数
   */
  unmatchedExternalTransactionsCount: number;
  /**
   * 标记为可疑的交易对数
   */
  suspiciousPairsCount: number;
  /**
   * 匹配成功的交易对
   */
  matchedPairs: Array<{
    systemTransaction: {
      id: string;
      orderNo: string;
      customerName: string;
      amount: number;
      transactionDate: string;
      paymentMethod: string;
    };
    externalTransaction: {
      id: string;
      orderNo: string;
      customerName: string;
      amount: number;
      transactionDate: string;
      paymentMethod: string;
      referenceNo?: string;
    };
    matchingRule: string;
    matchingScore: number;
  }>;
  /**
   * 系统内未匹配的交易
   */
  unmatchedSystemTransactions: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    potentialMatches?: Array<{
      externalTransactionId: string;
      orderNo: string;
      customerName: string;
      amount: number;
      matchScore: number;
    }>;
  }>;
  /**
   * 外部系统未匹配的交易
   */
  unmatchedExternalTransactions: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    referenceNo?: string;
    potentialMatches?: Array<{
      systemTransactionId: string;
      orderNo: string;
      customerName: string;
      amount: number;
      matchScore: number;
    }>;
  }>;
  /**
   * 标记为可疑的交易对
   */
  suspiciousPairs: Array<{
    systemTransaction: {
      id: string;
      orderNo: string;
      customerName: string;
      amount: number;
      transactionDate: string;
      paymentMethod: string;
    };
    externalTransaction: {
      id: string;
      orderNo: string;
      customerName: string;
      amount: number;
      transactionDate: string;
      paymentMethod: string;
      referenceNo?: string;
    };
    suspiciousReasons: string[];
    matchingScore: number;
  }>;
  /**
   * 对账统计信息
   */
  statistics: {
    /**
     * 总匹配金额
     */
    totalMatchedAmount: number;
    /**
     * 系统内总金额
     */
    totalSystemAmount: number;
    /**
     * 外部系统总金额
     */
    totalExternalAmount: number;
    /**
     * 金额差异
     */
    amountDifference: number;
    /**
     * 匹配率
     */
    matchRate: number;
    /**
     * 对账耗时（毫秒）
     */
    processingTime: number;
    /**
     * 应用的规则
     */
    appliedRules: Array<{
      ruleId: string;
      ruleName: string;
      matchesCount: number;
    }>;
  };
  /**
   * 对账开始时间
   */
  startTime: string;
  /**
   * 对账结束时间
   */
  endTime: string;
}

export interface AutoReconciliationClient {
  /**
   * 执行自动对账
   */
  executeAutoReconciliation(request: AutoReconciliationRequest): Promise<ServiceResponse<AutoReconciliationResult>>;
  
  /**
   * 获取对账结果
   */
  getReconciliationResult(reconciliationId: string): Promise<ServiceResponse<AutoReconciliationResult>>;
  
  /**
   * 手动匹配交易
   */
  manualMatchTransactions(
    reconciliationId: string,
    systemTransactionId: string,
    externalTransactionId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>>;
  
  /**
   * 取消匹配
   */
  unmatchTransactions(
    reconciliationId: string,
    matchedPairId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>>;
  
  /**
   * 标记交易为正常
   */
  markAsNormal(
    reconciliationId: string,
    suspiciousPairId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>>;
  
  /**
   * 导出对账结果
   */
  exportReconciliationResult(
    reconciliationId: string,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<ServiceResponse<{
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  }>>;
  
  /**
   * 获取对账结果历史
   */
  getReconciliationHistory(
    limit?: number,
    offset?: number,
    status?: string
  ): Promise<ServiceResponse<Array<{
    reconciliationId: string;
    batchId: string;
    status: string;
    totalSystemTransactions: number;
    totalExternalTransactions: number;
    matchedPairsCount: number;
    unmatchedSystemTransactionsCount: number;
    unmatchedExternalTransactionsCount: number;
    suspiciousPairsCount: number;
    startTime: string;
    endTime: string;
    processingTime: number;
  }>>>;
}

/**
 * 自动对账服务实现
 */
export const autoReconciliation: AutoReconciliationClient = {
  /**
   * 执行自动对账
   */
  async executeAutoReconciliation(request: AutoReconciliationRequest): Promise<ServiceResponse<AutoReconciliationResult>> {
    return withErrorHandler(async () => {
      const startTime = new Date();
      
      // 转换系统内交易为规则引擎需要的格式
      const systemItems: ReconciliationItem[] = request.systemTransactions.map(tx => ({
        id: tx.id,
        source: 'system',
        sourceId: tx.id,
        orderNo: tx.orderNo,
        customerId: tx.customerId,
        customerName: tx.customerName,
        amount: tx.amount,
        date: tx.transactionDate,
        status: 'unmatched',
        metadata: {
          paymentMethod: tx.paymentMethod,
          status: tx.status
        }
      }));
      
      // 转换外部系统交易为规则引擎需要的格式
      const externalItems: ReconciliationItem[] = request.externalTransactions.map(tx => ({
        id: tx.id,
        source: 'external',
        sourceId: tx.id,
        orderNo: tx.orderNo,
        customerName: tx.customerName,
        amount: tx.amount,
        date: tx.transactionDate,
        status: 'unmatched',
        metadata: {
          paymentMethod: tx.paymentMethod,
          status: tx.status,
          referenceNo: tx.referenceNo
        }
      }));
      
      // 获取对账规则
      let rules: ReconciliationRule[];
      if (request.ruleIds && request.ruleIds.length > 0) {
        // 使用指定的规则
        const allRules = await reconciliationRules.getReconciliationRules().then(res => res.data);
        rules = allRules.filter(rule => request.ruleIds?.includes(rule.id) && rule.enabled);
      } else {
        // 使用所有启用的规则
        rules = await reconciliationRules.getReconciliationRules().then(res => res.data.filter(rule => rule.enabled));
      }
      
      // 创建规则引擎并执行对账
      const ruleEngine = new ReconciliationRuleEngine(rules);
      const result = ruleEngine.executeReconciliation(systemItems, externalItems);
      
      const endTime = new Date();
      const processingTime = endTime.getTime() - startTime.getTime();
      
      // 转换规则引擎结果为对外暴露的格式
      const autoReconciliationResult: AutoReconciliationResult = {
        reconciliationId: `reconciliation_${Date.now()}`,
        batchId: request.batchId,
        status: 'completed',
        totalSystemTransactions: systemItems.length,
        totalExternalTransactions: externalItems.length,
        matchedPairsCount: result.matchedItems.length,
        unmatchedSystemTransactionsCount: result.unmatchedSystemItems.length,
        unmatchedExternalTransactionsCount: result.unmatchedExternalItems.length,
        suspiciousPairsCount: result.flaggedItems.length,
        matchedPairs: result.matchedItems.map(pair => ({
          systemTransaction: {
            id: pair.system.id,
            orderNo: pair.system.orderNo || '',
            customerName: pair.system.customerName || '',
            amount: pair.system.amount,
            transactionDate: pair.system.date,
            paymentMethod: pair.system.metadata?.paymentMethod || ''
          },
          externalTransaction: {
            id: pair.external.id,
            orderNo: pair.external.orderNo || '',
            customerName: pair.external.customerName || '',
            amount: pair.external.amount,
            transactionDate: pair.external.date,
            paymentMethod: pair.external.metadata?.paymentMethod || '',
            referenceNo: pair.external.metadata?.referenceNo
          },
          matchingRule: '', // 需要根据规则引擎的结果添加
          matchingScore: 1.0 // 需要计算匹配分数
        })),
        unmatchedSystemTransactions: result.unmatchedSystemItems.map(item => ({
          id: item.id,
          orderNo: item.orderNo || '',
          customerName: item.customerName || '',
          amount: item.amount,
          transactionDate: item.date,
          paymentMethod: item.metadata?.paymentMethod || '',
          potentialMatches: [] // 需要计算潜在匹配
        })),
        unmatchedExternalTransactions: result.unmatchedExternalItems.map(item => ({
          id: item.id,
          orderNo: item.orderNo || '',
          customerName: item.customerName || '',
          amount: item.amount,
          transactionDate: item.date,
          paymentMethod: item.metadata?.paymentMethod || '',
          referenceNo: item.metadata?.referenceNo,
          potentialMatches: [] // 需要计算潜在匹配
        })),
        suspiciousPairs: result.flaggedItems.map(item => ({
          systemTransaction: {
            id: item.system.id,
            orderNo: item.system.orderNo || '',
            customerName: item.system.customerName || '',
            amount: item.system.amount,
            transactionDate: item.system.date,
            paymentMethod: item.system.metadata?.paymentMethod || ''
          },
          externalTransaction: {
            id: item.external.id,
            orderNo: item.external.orderNo || '',
            customerName: item.external.customerName || '',
            amount: item.external.amount,
            transactionDate: item.external.date,
            paymentMethod: item.external.metadata?.paymentMethod || '',
            referenceNo: item.external.metadata?.referenceNo
          },
          suspiciousReasons: [item.reason],
          matchingScore: 0.5 // 需要计算匹配分数
        })),
        statistics: {
          totalMatchedAmount: result.matchedItems.reduce((sum, pair) => sum + pair.system.amount, 0),
          totalSystemAmount: systemItems.reduce((sum, item) => sum + item.amount, 0),
          totalExternalAmount: externalItems.reduce((sum, item) => sum + item.amount, 0),
          amountDifference: Math.abs(
            systemItems.reduce((sum, item) => sum + item.amount, 0) - 
            externalItems.reduce((sum, item) => sum + item.amount, 0)
          ),
          matchRate: systemItems.length > 0 ? result.matchedItems.length / systemItems.length : 0,
          processingTime: processingTime,
          appliedRules: rules.map(rule => ({
            ruleId: rule.id,
            ruleName: rule.name,
            matchesCount: 0 // 需要计算每个规则的匹配次数
          }))
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
      
      return {
        code: 0,
        message: '自动对账执行成功',
        data: autoReconciliationResult
      };
    });
  },
  
  /**
   * 获取对账结果
   */
  async getReconciliationResult(reconciliationId: string): Promise<ServiceResponse<AutoReconciliationResult>> {
    return withErrorHandler(async () => {
      // 这里应该调用API获取对账结果
      // 暂时返回模拟数据
      return {
        code: 0,
        message: 'success',
        data: {
          reconciliationId,
          batchId: 'batch_001',
          status: 'completed',
          totalSystemTransactions: 100,
          totalExternalTransactions: 98,
          matchedPairsCount: 95,
          unmatchedSystemTransactionsCount: 5,
          unmatchedExternalTransactionsCount: 3,
          suspiciousPairsCount: 2,
          matchedPairs: [],
          unmatchedSystemTransactions: [],
          unmatchedExternalTransactions: [],
          suspiciousPairs: [],
          statistics: {
            totalMatchedAmount: 95000,
            totalSystemAmount: 100000,
            totalExternalAmount: 98000,
            amountDifference: 2000,
            matchRate: 0.95,
            processingTime: 1500,
            appliedRules: []
          },
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        }
      };
    });
  },
  
  /**
   * 手动匹配交易
   */
  async manualMatchTransactions(
    reconciliationId: string,
    systemTransactionId: string,
    externalTransactionId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>> {
    return withErrorHandler(async () => {
      // 这里应该调用API执行手动匹配
      return {
        code: 0,
        message: '手动匹配成功',
        data: {
          success: true,
          message: '交易已成功匹配',
          updatedResult: {
            reconciliationId,
            batchId: 'batch_001',
            status: 'completed',
            totalSystemTransactions: 100,
            totalExternalTransactions: 98,
            matchedPairsCount: 96,
            unmatchedSystemTransactionsCount: 4,
            unmatchedExternalTransactionsCount: 2,
            suspiciousPairsCount: 2,
            matchedPairs: [],
            unmatchedSystemTransactions: [],
            unmatchedExternalTransactions: [],
            suspiciousPairs: [],
            statistics: {
              totalMatchedAmount: 96000,
              totalSystemAmount: 100000,
              totalExternalAmount: 98000,
              amountDifference: 2000,
              matchRate: 0.96,
              processingTime: 1500,
              appliedRules: []
            },
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        }
      };
    });
  },
  
  /**
   * 取消匹配
   */
  async unmatchTransactions(
    reconciliationId: string,
    matchedPairId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>> {
    return withErrorHandler(async () => {
      // 这里应该调用API取消匹配
      return {
        code: 0,
        message: '取消匹配成功',
        data: {
          success: true,
          message: '交易匹配已取消',
          updatedResult: {
            reconciliationId,
            batchId: 'batch_001',
            status: 'completed',
            totalSystemTransactions: 100,
            totalExternalTransactions: 98,
            matchedPairsCount: 95,
            unmatchedSystemTransactionsCount: 5,
            unmatchedExternalTransactionsCount: 3,
            suspiciousPairsCount: 2,
            matchedPairs: [],
            unmatchedSystemTransactions: [],
            unmatchedExternalTransactions: [],
            suspiciousPairs: [],
            statistics: {
              totalMatchedAmount: 95000,
              totalSystemAmount: 100000,
              totalExternalAmount: 98000,
              amountDifference: 2000,
              matchRate: 0.95,
              processingTime: 1500,
              appliedRules: []
            },
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        }
      };
    });
  },
  
  /**
   * 标记交易为正常
   */
  async markAsNormal(
    reconciliationId: string,
    suspiciousPairId: string,
    reason: string
  ): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    updatedResult: AutoReconciliationResult;
  }>> {
    return withErrorHandler(async () => {
      // 这里应该调用API标记为正常
      return {
        code: 0,
        message: '标记成功',
        data: {
          success: true,
          message: '交易已标记为正常',
          updatedResult: {
            reconciliationId,
            batchId: 'batch_001',
            status: 'completed',
            totalSystemTransactions: 100,
            totalExternalTransactions: 98,
            matchedPairsCount: 96,
            unmatchedSystemTransactionsCount: 4,
            unmatchedExternalTransactionsCount: 2,
            suspiciousPairsCount: 1,
            matchedPairs: [],
            unmatchedSystemTransactions: [],
            unmatchedExternalTransactions: [],
            suspiciousPairs: [],
            statistics: {
              totalMatchedAmount: 96000,
              totalSystemAmount: 100000,
              totalExternalAmount: 98000,
              amountDifference: 2000,
              matchRate: 0.96,
              processingTime: 1500,
              appliedRules: []
            },
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        }
      };
    });
  },
  
  /**
   * 导出对账结果
   */
  async exportReconciliationResult(
    reconciliationId: string,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<ServiceResponse<{
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  }>> {
    return withErrorHandler(async () => {
      // 这里应该调用API导出对账结果
      return {
        code: 0,
        message: '导出成功',
        data: {
          downloadUrl: 'https://example.com/download/reconciliation.csv',
          fileName: `reconciliation_${reconciliationId}.${format}`,
          fileSize: 102400 // 100KB
        }
      };
    });
  },
  
  /**
   * 获取对账结果历史
   */
  async getReconciliationHistory(
    limit = 10,
    offset = 0,
    status?: string
  ): Promise<ServiceResponse<Array<{
    reconciliationId: string;
    batchId: string;
    status: string;
    totalSystemTransactions: number;
    totalExternalTransactions: number;
    matchedPairsCount: number;
    unmatchedSystemTransactionsCount: number;
    unmatchedExternalTransactionsCount: number;
    suspiciousPairsCount: number;
    startTime: string;
    endTime: string;
    processingTime: number;
  }>>> {
    return withErrorHandler(async () => {
      // 这里应该调用API获取对账历史
      return {
        code: 0,
        message: 'success',
        data: [
          {
            reconciliationId: 'reconciliation_001',
            batchId: 'batch_001',
            status: 'completed',
            totalSystemTransactions: 100,
            totalExternalTransactions: 98,
            matchedPairsCount: 95,
            unmatchedSystemTransactionsCount: 5,
            unmatchedExternalTransactionsCount: 3,
            suspiciousPairsCount: 2,
            startTime: new Date(Date.now() - 86400000).toISOString(),
            endTime: new Date(Date.now() - 86398500).toISOString(),
            processingTime: 1500
          }
        ]
      };
    });
  }
};
