// 对账异常检测工具

/**
 * 对账异常类型
 */
export enum ReconciliationAnomalyType {
  /**
   * 系统存在，外部不存在
   */
  SYSTEM_ONLY = 'system_only',
  /**
   * 外部存在，系统不存在
   */
  EXTERNAL_ONLY = 'external_only',
  /**
   * 金额不匹配
   */
  AMOUNT_MISMATCH = 'amount_mismatch',
  /**
   * 日期不匹配
   */
  DATE_MISMATCH = 'date_mismatch',
  /**
   * 订单号不匹配
   */
  ORDER_NO_MISMATCH = 'order_no_mismatch',
  /**
   * 重复交易
   */
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  /**
   * 可疑交易
   */
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  /**
   * 状态不匹配
   */
  STATUS_MISMATCH = 'status_mismatch',
  /**
   * 支付方式不匹配
   */
  PAYMENT_METHOD_MISMATCH = 'payment_method_mismatch',
  /**
   * 客户信息不匹配
   */
  CUSTOMER_INFO_MISMATCH = 'customer_info_mismatch'
}

/**
 * 异常严重程度
 */
export enum AnomalySeverity {
  /**
   * 低风险
   */
  LOW = 'low',
  /**
   * 中风险
   */
  MEDIUM = 'medium',
  /**
   * 高风险
   */
  HIGH = 'high',
  /**
   * 严重风险
   */
  CRITICAL = 'critical'
}

/**
 * 对账异常
 */
export interface ReconciliationAnomaly {
  /**
   * 异常ID
   */
  id: string;
  /**
   * 对账批次ID
   */
  batchId: string;
  /**
   * 异常类型
   */
  type: ReconciliationAnomalyType;
  /**
   * 异常严重程度
   */
  severity: AnomalySeverity;
  /**
   * 异常描述
   */
  description: string;
  /**
   * 系统交易ID
   */
  systemTransactionId?: string;
  /**
   * 外部交易ID
   */
  externalTransactionId?: string;
  /**
   * 系统交易信息
   */
  systemTransaction?: {
    id: string;
    orderNo: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    status: string;
  };
  /**
   * 外部交易信息
   */
  externalTransaction?: {
    id: string;
    orderNo: string;
    customerName: string;
    amount: number;
    transactionDate: string;
    paymentMethod: string;
    status: string;
    referenceNo?: string;
  };
  /**
   * 差异金额
   */
  amountDifference?: number;
  /**
   * 差异天数
   */
  dateDifferenceDays?: number;
  /**
   * 检测时间
   */
  detectedAt: string;
  /**
   * 处理状态
   */
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  /**
   * 处理人
   */
  handledBy?: string;
  /**
   * 处理时间
   */
  handledAt?: string;
  /**
   * 处理原因
   */
  handlingReason?: string;
  /**
   * 处理结果
   */
  handlingResult?: string;
  /**
   * 关联的对账结果ID
   */
  reconciliationId: string;
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 异常检测配置
 */
export interface AnomalyDetectionConfig {
  /**
   * 金额容差（绝对值）
   */
  amountTolerance: number;
  /**
   * 金额容差（百分比）
   */
  amountTolerancePercentage: number;
  /**
   * 日期容差（天数）
   */
  dateToleranceDays: number;
  /**
   * 是否检测重复交易
   */
  detectDuplicates: boolean;
  /**
   * 是否检测可疑交易
   */
  detectSuspicious: boolean;
  /**
   * 可疑交易检测阈值
   */
  suspiciousThreshold: number;
}

/**
 * 交易信息
 */
export interface TransactionInfo {
  id: string;
  orderNo: string;
  customerId?: string;
  customerName: string;
  amount: number;
  transactionDate: string;
  paymentMethod: string;
  status: string;
  referenceNo?: string;
}

/**
 * 异常检测结果
 */
export interface AnomalyDetectionResult {
  /**
   * 检测到的异常列表
   */
  anomalies: ReconciliationAnomaly[];
  /**
   * 异常统计
   */
  statistics: {
    totalAnomalies: number;
    byType: Record<ReconciliationAnomalyType, number>;
    bySeverity: Record<AnomalySeverity, number>;
    byStatus: Record<'open' | 'in_progress' | 'resolved' | 'dismissed', number>;
    totalAmountMismatch: number;
    totalTransactionsWithAnomalies: number;
    anomalyRate: number;
  };
  /**
   * 检测配置
   */
  config: AnomalyDetectionConfig;
  /**
   * 检测时间
   */
  detectedAt: string;
}

/**
 * 对账异常检测类
 */
export class ReconciliationAnomalyDetector {
  private config: AnomalyDetectionConfig;
  private batchId: string;
  private reconciliationId: string;

  constructor(
    config: Partial<AnomalyDetectionConfig> = {},
    batchId: string = `batch_${Date.now()}`,
    reconciliationId: string = `reconciliation_${Date.now()}`
  ) {
    // 默认配置
    this.config = {
      amountTolerance: 0.01,
      amountTolerancePercentage: 0.5,
      dateToleranceDays: 1,
      detectDuplicates: true,
      detectSuspicious: true,
      suspiciousThreshold: 0.8,
      ...config
    };
    this.batchId = batchId;
    this.reconciliationId = reconciliationId;
  }

  /**
   * 检测对账异常
   */
  public detectAnomalies(
    systemTransactions: TransactionInfo[],
    externalTransactions: TransactionInfo[]
  ): AnomalyDetectionResult {
    const anomalies: ReconciliationAnomaly[] = [];
    const currentTime = new Date().toISOString();

    // 构建订单号到交易的映射
    const systemOrderMap = new Map<string, TransactionInfo>();
    const externalOrderMap = new Map<string, TransactionInfo>();
    const systemIdMap = new Map<string, TransactionInfo>();
    const externalIdMap = new Map<string, TransactionInfo>();

    // 填充映射
    systemTransactions.forEach(tx => {
      systemOrderMap.set(tx.orderNo, tx);
      systemIdMap.set(tx.id, tx);
    });

    externalTransactions.forEach(tx => {
      externalOrderMap.set(tx.orderNo, tx);
      externalIdMap.set(tx.id, tx);
    });

    // 检测系统存在，外部不存在的交易
    systemTransactions.forEach(tx => {
      if (!externalOrderMap.has(tx.orderNo)) {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.SYSTEM_ONLY,
          severity: AnomalySeverity.MEDIUM,
          description: `系统交易存在，但外部系统不存在，订单号: ${tx.orderNo}`,
          systemTransactionId: tx.id,
          systemTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status
          },
          metadata: { orderNo: tx.orderNo }
        }));
      }
    });

    // 检测外部存在，系统不存在的交易
    externalTransactions.forEach(tx => {
      if (!systemOrderMap.has(tx.orderNo)) {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.EXTERNAL_ONLY,
          severity: AnomalySeverity.MEDIUM,
          description: `外部系统交易存在，但系统不存在，订单号: ${tx.orderNo}`,
          externalTransactionId: tx.id,
          externalTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status,
            referenceNo: tx.referenceNo
          },
          metadata: { orderNo: tx.orderNo }
        }));
      }
    });

    // 检测匹配但有差异的交易
    systemTransactions.forEach(systemTx => {
      const externalTx = externalOrderMap.get(systemTx.orderNo);
      if (externalTx) {
        // 检测金额不匹配
        const amountDiff = Math.abs(systemTx.amount - externalTx.amount);
        const amountDiffPercent = (amountDiff / externalTx.amount) * 100;
        const isAmountMismatch = 
          amountDiff > this.config.amountTolerance && 
          amountDiffPercent > this.config.amountTolerancePercentage;

        if (isAmountMismatch) {
          anomalies.push(this.createAnomaly({
            type: ReconciliationAnomalyType.AMOUNT_MISMATCH,
            severity: this.getAmountMismatchSeverity(amountDiff, amountDiffPercent),
            description: `金额不匹配，系统金额: ${systemTx.amount}，外部金额: ${externalTx.amount}，差异: ${amountDiff} (${amountDiffPercent.toFixed(2)}%)`,
            systemTransactionId: systemTx.id,
            externalTransactionId: externalTx.id,
            systemTransaction: {
              id: systemTx.id,
              orderNo: systemTx.orderNo,
              customerName: systemTx.customerName,
              amount: systemTx.amount,
              transactionDate: systemTx.transactionDate,
              paymentMethod: systemTx.paymentMethod,
              status: systemTx.status
            },
            externalTransaction: {
              id: externalTx.id,
              orderNo: externalTx.orderNo,
              customerName: externalTx.customerName,
              amount: externalTx.amount,
              transactionDate: externalTx.transactionDate,
              paymentMethod: externalTx.paymentMethod,
              status: externalTx.status,
              referenceNo: externalTx.referenceNo
            },
            amountDifference: amountDiff,
            metadata: { orderNo: systemTx.orderNo }
          }));
        }

        // 检测日期不匹配
        const systemDate = new Date(systemTx.transactionDate);
        const externalDate = new Date(externalTx.transactionDate);
        const dateDiffMs = Math.abs(systemDate.getTime() - externalDate.getTime());
        const dateDiffDays = dateDiffMs / (1000 * 60 * 60 * 24);
        
        if (dateDiffDays > this.config.dateToleranceDays) {
          anomalies.push(this.createAnomaly({
            type: ReconciliationAnomalyType.DATE_MISMATCH,
            severity: dateDiffDays > 7 ? AnomalySeverity.MEDIUM : AnomalySeverity.LOW,
            description: `日期不匹配，系统日期: ${systemTx.transactionDate}，外部日期: ${externalTx.transactionDate}，差异: ${dateDiffDays.toFixed(1)}天`,
            systemTransactionId: systemTx.id,
            externalTransactionId: externalTx.id,
            systemTransaction: {
              id: systemTx.id,
              orderNo: systemTx.orderNo,
              customerName: systemTx.customerName,
              amount: systemTx.amount,
              transactionDate: systemTx.transactionDate,
              paymentMethod: systemTx.paymentMethod,
              status: systemTx.status
            },
            externalTransaction: {
              id: externalTx.id,
              orderNo: externalTx.orderNo,
              customerName: externalTx.customerName,
              amount: externalTx.amount,
              transactionDate: externalTx.transactionDate,
              paymentMethod: externalTx.paymentMethod,
              status: externalTx.status,
              referenceNo: externalTx.referenceNo
            },
            dateDifferenceDays: dateDiffDays,
            metadata: { orderNo: systemTx.orderNo }
          }));
        }

        // 检测状态不匹配
        if (systemTx.status !== externalTx.status) {
          anomalies.push(this.createAnomaly({
            type: ReconciliationAnomalyType.STATUS_MISMATCH,
            severity: AnomalySeverity.MEDIUM,
            description: `状态不匹配，系统状态: ${systemTx.status}，外部状态: ${externalTx.status}`,
            systemTransactionId: systemTx.id,
            externalTransactionId: externalTx.id,
            systemTransaction: {
              id: systemTx.id,
              orderNo: systemTx.orderNo,
              customerName: systemTx.customerName,
              amount: systemTx.amount,
              transactionDate: systemTx.transactionDate,
              paymentMethod: systemTx.paymentMethod,
              status: systemTx.status
            },
            externalTransaction: {
              id: externalTx.id,
              orderNo: externalTx.orderNo,
              customerName: externalTx.customerName,
              amount: externalTx.amount,
              transactionDate: externalTx.transactionDate,
              paymentMethod: externalTx.paymentMethod,
              status: externalTx.status,
              referenceNo: externalTx.referenceNo
            },
            metadata: { orderNo: systemTx.orderNo }
          }));
        }

        // 检测支付方式不匹配
        if (systemTx.paymentMethod !== externalTx.paymentMethod) {
          anomalies.push(this.createAnomaly({
            type: ReconciliationAnomalyType.PAYMENT_METHOD_MISMATCH,
            severity: AnomalySeverity.LOW,
            description: `支付方式不匹配，系统支付方式: ${systemTx.paymentMethod}，外部支付方式: ${externalTx.paymentMethod}`,
            systemTransactionId: systemTx.id,
            externalTransactionId: externalTx.id,
            systemTransaction: {
              id: systemTx.id,
              orderNo: systemTx.orderNo,
              customerName: systemTx.customerName,
              amount: systemTx.amount,
              transactionDate: systemTx.transactionDate,
              paymentMethod: systemTx.paymentMethod,
              status: systemTx.status
            },
            externalTransaction: {
              id: externalTx.id,
              orderNo: externalTx.orderNo,
              customerName: externalTx.customerName,
              amount: externalTx.amount,
              transactionDate: externalTx.transactionDate,
              paymentMethod: externalTx.paymentMethod,
              status: externalTx.status,
              referenceNo: externalTx.referenceNo
            },
            metadata: { orderNo: systemTx.orderNo }
          }));
        }

        // 检测客户信息不匹配
        if (systemTx.customerName !== externalTx.customerName) {
          anomalies.push(this.createAnomaly({
            type: ReconciliationAnomalyType.CUSTOMER_INFO_MISMATCH,
            severity: AnomalySeverity.MEDIUM,
            description: `客户信息不匹配，系统客户: ${systemTx.customerName}，外部客户: ${externalTx.customerName}`,
            systemTransactionId: systemTx.id,
            externalTransactionId: externalTx.id,
            systemTransaction: {
              id: systemTx.id,
              orderNo: systemTx.orderNo,
              customerName: systemTx.customerName,
              amount: systemTx.amount,
              transactionDate: systemTx.transactionDate,
              paymentMethod: systemTx.paymentMethod,
              status: systemTx.status
            },
            externalTransaction: {
              id: externalTx.id,
              orderNo: externalTx.orderNo,
              customerName: externalTx.customerName,
              amount: externalTx.amount,
              transactionDate: externalTx.transactionDate,
              paymentMethod: externalTx.paymentMethod,
              status: externalTx.status,
              referenceNo: externalTx.referenceNo
            },
            metadata: { orderNo: systemTx.orderNo }
          }));
        }
      }
    });

    // 检测重复交易
    if (this.config.detectDuplicates) {
      const duplicateSystemTx = this.detectDuplicateTransactions(systemTransactions);
      duplicateSystemTx.forEach(tx => {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.DUPLICATE_TRANSACTION,
          severity: AnomalySeverity.HIGH,
          description: `系统存在重复交易，订单号: ${tx.orderNo}，金额: ${tx.amount}，交易日期: ${tx.transactionDate}`,
          systemTransactionId: tx.id,
          systemTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status
          },
          metadata: { orderNo: tx.orderNo }
        }));
      });

      const duplicateExternalTx = this.detectDuplicateTransactions(externalTransactions);
      duplicateExternalTx.forEach(tx => {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.DUPLICATE_TRANSACTION,
          severity: AnomalySeverity.HIGH,
          description: `外部系统存在重复交易，订单号: ${tx.orderNo}，金额: ${tx.amount}，交易日期: ${tx.transactionDate}`,
          externalTransactionId: tx.id,
          externalTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status,
            referenceNo: tx.referenceNo
          },
          metadata: { orderNo: tx.orderNo }
        }));
      });
    }

    // 检测可疑交易
    if (this.config.detectSuspicious) {
      const suspiciousSystemTx = this.detectSuspiciousTransactions(systemTransactions);
      suspiciousSystemTx.forEach(tx => {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.SUSPICIOUS_TRANSACTION,
          severity: AnomalySeverity.MEDIUM,
          description: `检测到可疑交易，订单号: ${tx.orderNo}，金额: ${tx.amount}，交易日期: ${tx.transactionDate}`,
          systemTransactionId: tx.id,
          systemTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status
          },
          metadata: { orderNo: tx.orderNo, reason: '系统检测到可疑交易模式' }
        }));
      });

      const suspiciousExternalTx = this.detectSuspiciousTransactions(externalTransactions);
      suspiciousExternalTx.forEach(tx => {
        anomalies.push(this.createAnomaly({
          type: ReconciliationAnomalyType.SUSPICIOUS_TRANSACTION,
          severity: AnomalySeverity.MEDIUM,
          description: `外部系统检测到可疑交易，订单号: ${tx.orderNo}，金额: ${tx.amount}，交易日期: ${tx.transactionDate}`,
          externalTransactionId: tx.id,
          externalTransaction: {
            id: tx.id,
            orderNo: tx.orderNo,
            customerName: tx.customerName,
            amount: tx.amount,
            transactionDate: tx.transactionDate,
            paymentMethod: tx.paymentMethod,
            status: tx.status,
            referenceNo: tx.referenceNo
          },
          metadata: { orderNo: tx.orderNo, reason: '外部系统检测到可疑交易模式' }
        }));
      });
    }

    // 生成统计信息
    const statistics = this.generateStatistics(anomalies, systemTransactions.length + externalTransactions.length);

    return {
      anomalies,
      statistics,
      config: this.config,
      detectedAt: currentTime
    };
  }

  /**
   * 创建异常对象
   */
  private createAnomaly(anomaly: Partial<ReconciliationAnomaly>): ReconciliationAnomaly {
    return {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchId: this.batchId,
      reconciliationId: this.reconciliationId,
      detectedAt: new Date().toISOString(),
      status: 'open',
      ...anomaly
    } as ReconciliationAnomaly;
  }

  /**
   * 获取金额不匹配的严重程度
   */
  private getAmountMismatchSeverity(amountDiff: number, amountDiffPercent: number): AnomalySeverity {
    if (amountDiff > 1000 || amountDiffPercent > 10) {
      return AnomalySeverity.CRITICAL;
    } else if (amountDiff > 100 || amountDiffPercent > 5) {
      return AnomalySeverity.HIGH;
    } else if (amountDiff > 10 || amountDiffPercent > 2) {
      return AnomalySeverity.MEDIUM;
    } else {
      return AnomalySeverity.LOW;
    }
  }

  /**
   * 检测重复交易
   */
  private detectDuplicateTransactions(transactions: TransactionInfo[]): TransactionInfo[] {
    const seen = new Map<string, TransactionInfo>();
    const duplicates: TransactionInfo[] = [];

    transactions.forEach(tx => {
      const key = `${tx.orderNo}_${tx.amount}_${tx.transactionDate}`;
      if (seen.has(key)) {
        duplicates.push(tx);
      } else {
        seen.set(key, tx);
      }
    });

    return duplicates;
  }

  /**
   * 检测可疑交易
   */
  private detectSuspiciousTransactions(transactions: TransactionInfo[]): TransactionInfo[] {
    // 简单的可疑交易检测逻辑，实际项目中可以使用更复杂的算法
    const suspicious: TransactionInfo[] = [];
    const avgAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length;
    const stdDev = Math.sqrt(
      transactions.reduce((sum, tx) => sum + Math.pow(tx.amount - avgAmount, 2), 0) / transactions.length
    );

    transactions.forEach(tx => {
      // 金额异常大的交易
      if (tx.amount > avgAmount + 3 * stdDev) {
        suspicious.push(tx);
      }
      // 其他可疑规则可以在这里添加
    });

    return suspicious;
  }

  /**
   * 生成统计信息
   */
  private generateStatistics(anomalies: ReconciliationAnomaly[], totalTransactions: number): AnomalyDetectionResult['statistics'] {
    const byType: Record<ReconciliationAnomalyType, number> = {} as Record<ReconciliationAnomalyType, number>;
    const bySeverity: Record<AnomalySeverity, number> = {} as Record<AnomalySeverity, number>;
    const byStatus: Record<'open' | 'in_progress' | 'resolved' | 'dismissed', number> = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      dismissed: 0
    };

    // 初始化统计数据
    Object.values(ReconciliationAnomalyType).forEach(type => {
      byType[type] = 0;
    });

    Object.values(AnomalySeverity).forEach(severity => {
      bySeverity[severity] = 0;
    });

    // 统计异常
    let totalAmountMismatch = 0;
    anomalies.forEach(anomaly => {
      byType[anomaly.type]++;
      bySeverity[anomaly.severity]++;
      byStatus[anomaly.status]++;

      if (anomaly.amountDifference) {
        totalAmountMismatch += anomaly.amountDifference;
      }
    });

    return {
      totalAnomalies: anomalies.length,
      byType,
      bySeverity,
      byStatus,
      totalAmountMismatch,
      totalTransactionsWithAnomalies: new Set(anomalies.map(a => a.systemTransaction?.orderNo || a.externalTransaction?.orderNo)).size,
      anomalyRate: totalTransactions > 0 ? (anomalies.length / totalTransactions) * 100 : 0
    };
  }
}

/**
 * 获取异常类型的显示名称
 */
export const getAnomalyTypeDisplayName = (type: ReconciliationAnomalyType): string => {
  const displayNames: Record<ReconciliationAnomalyType, string> = {
    [ReconciliationAnomalyType.SYSTEM_ONLY]: '系统单边交易',
    [ReconciliationAnomalyType.EXTERNAL_ONLY]: '外部单边交易',
    [ReconciliationAnomalyType.AMOUNT_MISMATCH]: '金额不匹配',
    [ReconciliationAnomalyType.DATE_MISMATCH]: '日期不匹配',
    [ReconciliationAnomalyType.ORDER_NO_MISMATCH]: '订单号不匹配',
    [ReconciliationAnomalyType.DUPLICATE_TRANSACTION]: '重复交易',
    [ReconciliationAnomalyType.SUSPICIOUS_TRANSACTION]: '可疑交易',
    [ReconciliationAnomalyType.STATUS_MISMATCH]: '状态不匹配',
    [ReconciliationAnomalyType.PAYMENT_METHOD_MISMATCH]: '支付方式不匹配',
    [ReconciliationAnomalyType.CUSTOMER_INFO_MISMATCH]: '客户信息不匹配'
  };
  return displayNames[type] || type;
};

/**
 * 获取异常严重程度的显示名称和样式
 */
export const getAnomalySeverityInfo = (severity: AnomalySeverity): { displayName: string; color: string; bgColor: string } => {
  const severityInfo: Record<AnomalySeverity, { displayName: string; color: string; bgColor: string }> = {
    [AnomalySeverity.LOW]: {
      displayName: '低风险',
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    },
    [AnomalySeverity.MEDIUM]: {
      displayName: '中风险',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    [AnomalySeverity.HIGH]: {
      displayName: '高风险',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100'
    },
    [AnomalySeverity.CRITICAL]: {
      displayName: '严重风险',
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    }
  };
  return severityInfo[severity];
};

/**
 * 获取异常处理状态的显示名称
 */
export const getAnomalyStatusDisplayName = (status: 'open' | 'in_progress' | 'resolved' | 'dismissed'): string => {
  const statusNames: Record<string, string> = {
    open: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
    dismissed: '已忽略'
  };
  return statusNames[status] || status;
};
