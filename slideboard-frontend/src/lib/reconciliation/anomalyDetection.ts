import { 
  ReconciliationAnomaly, 
  AnomalyType, 
  AnomalySeverity, 
  ReconciliationItem, 
  ReconciliationDifference 
} from '@/shared/types/reconciliation';

/**
 * 对账异常检测引擎
 * 负责检测各种类型的对账异常，并生成异常报告
 */
export class ReconciliationAnomalyDetector {
  /**
   * 检测对账异常
   * @param matchedItems 匹配的对账项目
   * @param unmatchedItems 未匹配的对账项目
   * @param differences 对账差异
   * @returns 异常列表
   */
  detectAnomalies(
    matchedItems: ReconciliationItem[],
    unmatchedItems: ReconciliationItem[],
    differences: ReconciliationDifference[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    // 1. 检测系统内独有交易
    const systemOnlyAnomalies = this.detectSystemOnlyTransactions(unmatchedItems);
    anomalies.push(...systemOnlyAnomalies);
    
    // 2. 检测外部独有交易
    const externalOnlyAnomalies = this.detectExternalOnlyTransactions(unmatchedItems);
    anomalies.push(...externalOnlyAnomalies);
    
    // 3. 检测金额不匹配
    const amountMismatchAnomalies = this.detectAmountMismatches(differences);
    anomalies.push(...amountMismatchAnomalies);
    
    // 4. 检测日期不匹配
    const dateMismatchAnomalies = this.detectDateMismatches(differences);
    anomalies.push(...dateMismatchAnomalies);
    
    // 5. 检测状态不匹配
    const statusMismatchAnomalies = this.detectStatusMismatches(differences);
    anomalies.push(...statusMismatchAnomalies);
    
    // 6. 检测重复交易
    const duplicateAnomalies = this.detectDuplicateTransactions([...matchedItems, ...unmatchedItems]);
    anomalies.push(...duplicateAnomalies);
    
    // 7. 检测可疑交易
    const suspiciousAnomalies = this.detectSuspiciousTransactions([...matchedItems, ...unmatchedItems]);
    anomalies.push(...suspiciousAnomalies);
    
    // 8. 检测无效数据
    const invalidDataAnomalies = this.detectInvalidData([...matchedItems, ...unmatchedItems]);
    anomalies.push(...invalidDataAnomalies);
    
    // 9. 检测缺失必填字段
    const missingFieldsAnomalies = this.detectMissingRequiredFields([...matchedItems, ...unmatchedItems]);
    anomalies.push(...missingFieldsAnomalies);
    
    return anomalies;
  }
  
  /**
   * 检测系统内独有交易（系统有记录，外部无记录）
   * @param unmatchedItems 未匹配的对账项目
   * @returns 异常列表
   */
  private detectSystemOnlyTransactions(
    unmatchedItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    // 系统内独有交易通常是指statementId不为空的未匹配项目
    const systemOnlyItems = unmatchedItems.filter(item => item.statementId);
    
    for (const item of systemOnlyItems) {
      anomalies.push({
        id: crypto.randomUUID(),
        statementId: item.statementId,
        itemId: item.id,
        type: AnomalyType.SYSTEM_ONLY,
        severity: AnomalySeverity.MEDIUM,
        description: `系统内独有交易：${item.sourceType} ${item.sourceNo}`,
        details: {
          item,
          amount: item.amount,
          date: item.date
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测外部独有交易（外部有记录，系统无记录）
   * @param unmatchedItems 未匹配的对账项目
   * @returns 异常列表
   */
  private detectExternalOnlyTransactions(
    unmatchedItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    // 外部独有交易通常是指statementId为空的未匹配项目
    const externalOnlyItems = unmatchedItems.filter(item => !item.statementId);
    
    for (const item of externalOnlyItems) {
      anomalies.push({
        id: crypto.randomUUID(),
        statementId: item.statementId,
        itemId: item.id,
        type: AnomalyType.EXTERNAL_ONLY,
        severity: AnomalySeverity.HIGH,
        description: `外部独有交易：${item.sourceType}`,
        details: {
          item,
          amount: item.amount,
          date: item.date
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测金额不匹配
   * @param differences 对账差异
   * @returns 异常列表
   */
  private detectAmountMismatches(
    differences: ReconciliationDifference[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    const amountDifferences = differences.filter(d => d.type === 'amount');
    
    for (const diff of amountDifferences) {
      // 根据差异金额确定严重程度
      let severity = AnomalySeverity.LOW;
      const absDiff = Math.abs(diff.amountDifference || 0);
      
      if (absDiff > 1000) {
        severity = AnomalySeverity.CRITICAL;
      } else if (absDiff > 100) {
        severity = AnomalySeverity.HIGH;
      } else if (absDiff > 10) {
        severity = AnomalySeverity.MEDIUM;
      }
      
      anomalies.push({
        id: crypto.randomUUID(),
        statementId: '', // 差异通常关联到具体项目，需要进一步处理
        itemId: diff.id,
        type: AnomalyType.AMOUNT_MISMATCH,
        severity,
        description: `金额不匹配：预期 ${diff.expected}，实际 ${diff.actual}`,
        details: {
          difference: diff,
          amountDifference: diff.amountDifference,
          percentageDifference: diff.percentageDifference
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测日期不匹配
   * @param differences 对账差异
   * @returns 异常列表
   */
  private detectDateMismatches(
    differences: ReconciliationDifference[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    const dateDifferences = differences.filter(d => d.type === 'date');
    
    for (const diff of dateDifferences) {
      // 计算日期差异天数
      const expectedDate = new Date(diff.expected);
      const actualDate = new Date(diff.actual);
      const diffDays = Math.abs(
        (expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // 根据日期差异确定严重程度
      let severity = AnomalySeverity.LOW;
      if (diffDays > 30) {
        severity = AnomalySeverity.HIGH;
      } else if (diffDays > 7) {
        severity = AnomalySeverity.MEDIUM;
      }
      
      anomalies.push({
        id: crypto.randomUUID(),
        statementId: '',
        itemId: diff.id,
        type: AnomalyType.DATE_MISMATCH,
        severity,
        description: `日期不匹配：预期 ${diff.expected}，实际 ${diff.actual}`,
        details: {
          difference: diff,
          daysDifference: diffDays
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测状态不匹配
   * @param differences 对账差异
   * @returns 异常列表
   */
  private detectStatusMismatches(
    differences: ReconciliationDifference[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    const statusDifferences = differences.filter(d => d.type === 'status');
    
    for (const diff of statusDifferences) {
      anomalies.push({
        id: crypto.randomUUID(),
        statementId: '',
        itemId: diff.id,
        type: AnomalyType.STATUS_MISMATCH,
        severity: AnomalySeverity.MEDIUM,
        description: `状态不匹配：预期 ${diff.expected}，实际 ${diff.actual}`,
        details: {
          difference: diff
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测重复交易
   * @param allItems 所有对账项目
   * @returns 异常列表
   */
  private detectDuplicateTransactions(
    allItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    const transactionMap = new Map<string, ReconciliationItem[]>();
    
    // 按金额和日期分组，查找重复项
    for (const item of allItems) {
      const key = `${item.amount}_${item.date.substring(0, 10)}`;
      if (!transactionMap.has(key)) {
        transactionMap.set(key, []);
      }
      transactionMap.get(key)?.push(item);
    }
    
    // 找出重复项
    for (const [key, items] of transactionMap.entries()) {
      if (items.length > 1) {
        // 为每个重复项创建异常记录
        for (let i = 1; i < items.length; i++) {
          const item = items[i];
          anomalies.push({
            id: crypto.randomUUID(),
            statementId: item.statementId,
            itemId: item.id,
            type: AnomalyType.DUPLICATE_TRANSACTION,
            severity: AnomalySeverity.HIGH,
            description: `重复交易：${item.amount} 元，日期 ${item.date}`,
            details: {
              item,
              duplicateCount: items.length,
              duplicateKey: key
            },
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return anomalies;
  }
  
  /**
   * 检测可疑交易
   * @param allItems 所有对账项目
   * @returns 异常列表
   */
  private detectSuspiciousTransactions(
    allItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    for (const item of allItems) {
      // 检测大额交易（示例：大于100000）
      if (item.amount > 100000) {
        anomalies.push({
          id: crypto.randomUUID(),
          statementId: item.statementId,
          itemId: item.id,
          type: AnomalyType.SUSPICIOUS_TRANSACTION,
          severity: AnomalySeverity.HIGH,
          description: `可疑大额交易：${item.amount} 元`,
          details: {
            item
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // 检测特殊金额（示例：以999结尾）
      if (item.amount % 1000 === 999) {
        anomalies.push({
          id: crypto.randomUUID(),
          statementId: item.statementId,
          itemId: item.id,
          type: AnomalyType.SUSPICIOUS_TRANSACTION,
          severity: AnomalySeverity.MEDIUM,
          description: `可疑特殊金额：${item.amount} 元`,
          details: {
            item
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return anomalies;
  }
  
  /**
   * 检测无效数据
   * @param allItems 所有对账项目
   * @returns 异常列表
   */
  private detectInvalidData(
    allItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    for (const item of allItems) {
      // 检测无效金额
      if (item.amount <= 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          statementId: item.statementId,
          itemId: item.id,
          type: AnomalyType.INVALID_DATA,
          severity: AnomalySeverity.HIGH,
          description: `无效金额：${item.amount} 元`,
          details: {
            item
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // 检测无效日期
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) {
        anomalies.push({
          id: crypto.randomUUID(),
          statementId: item.statementId,
          itemId: item.id,
          type: AnomalyType.INVALID_DATA,
          severity: AnomalySeverity.MEDIUM,
          description: `无效日期：${item.date}`,
          details: {
            item
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return anomalies;
  }
  
  /**
   * 检测缺失必填字段
   * @param allItems 所有对账项目
   * @returns 异常列表
   */
  private detectMissingRequiredFields(
    allItems: ReconciliationItem[]
  ): ReconciliationAnomaly[] {
    const anomalies: ReconciliationAnomaly[] = [];
    
    for (const item of allItems) {
      const missingFields: string[] = [];
      
      if (!item.sourceType) missingFields.push('sourceType');
      if (!item.sourceId) missingFields.push('sourceId');
      if (!item.sourceNo) missingFields.push('sourceNo');
      if (!item.date) missingFields.push('date');
      
      if (missingFields.length > 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          statementId: item.statementId,
          itemId: item.id,
          type: AnomalyType.MISSING_REQUIRED_FIELDS,
          severity: AnomalySeverity.MEDIUM,
          description: `缺失必填字段：${missingFields.join(', ')}`,
          details: {
            item,
            missingFields
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return anomalies;
  }
  
  /**
   * 分析异常统计信息
   * @param anomalies 异常列表
   * @returns 异常统计信息
   */
  analyzeAnomalies(
    anomalies: ReconciliationAnomaly[]
  ): {
    totalAnomalies: number;
    byType: Record<AnomalyType, number>;
    bySeverity: Record<AnomalySeverity, number>;
    byStatus: Record<string, number>;
    criticalAnomalies: number;
    highAnomalies: number;
    mediumAnomalies: number;
    lowAnomalies: number;
  } {
    const totalAnomalies = anomalies.length;
    
    // 按类型统计
    const byType = Object.values(AnomalyType).reduce((acc, type) => {
      acc[type as AnomalyType] = anomalies.filter(a => a.type === type).length;
      return acc;
    }, {} as Record<AnomalyType, number>);
    
    // 按严重程度统计
    const bySeverity = Object.values(AnomalySeverity).reduce((acc, severity) => {
      acc[severity as AnomalySeverity] = anomalies.filter(a => a.severity === severity).length;
      return acc;
    }, {} as Record<AnomalySeverity, number>);
    
    // 按状态统计
    const byStatus = anomalies.reduce((acc, anomaly) => {
      acc[anomaly.status] = (acc[anomaly.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalAnomalies,
      byType,
      bySeverity,
      byStatus,
      criticalAnomalies: bySeverity[AnomalySeverity.CRITICAL] || 0,
      highAnomalies: bySeverity[AnomalySeverity.HIGH] || 0,
      mediumAnomalies: bySeverity[AnomalySeverity.MEDIUM] || 0,
      lowAnomalies: bySeverity[AnomalySeverity.LOW] || 0
    };
  }
  
  /**
   * 生成异常报告摘要
   * @param anomalies 异常列表
   * @returns 异常报告摘要
   */
  generateAnomalyReport(
    anomalies: ReconciliationAnomaly[]
  ): {
    summary: string;
    statistics: ReturnType<typeof this.analyzeAnomalies>;
    topIssues: ReconciliationAnomaly[];
  } {
    const stats = this.analyzeAnomalies(anomalies);
    
    // 获取前5个严重问题
    const topIssues = [...anomalies]
      .sort((a, b) => {
        const severityOrder = {
          [AnomalySeverity.CRITICAL]: 4,
          [AnomalySeverity.HIGH]: 3,
          [AnomalySeverity.MEDIUM]: 2,
          [AnomalySeverity.LOW]: 1
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);
    
    const summary = `共检测到 ${stats.totalAnomalies} 个对账异常，其中严重异常 ${stats.criticalAnomalies} 个，高风险异常 ${stats.highAnomalies} 个，中风险异常 ${stats.mediumAnomalies} 个，低风险异常 ${stats.lowAnomalies} 个。`;
    
    return {
      summary,
      statistics: stats,
      topIssues
    };
  }
}

/**
 * 异常处理工具
 */
export const anomalyHandler = {
  /**
   * 计算异常严重程度
   * @param type 异常类型
   * @param details 异常详情
   * @returns 严重程度
   */
  calculateSeverity(
    type: AnomalyType,
    details: any
  ): AnomalySeverity {
    switch (type) {
      case AnomalyType.AMOUNT_MISMATCH:
        const absDiff = Math.abs(details.amountDifference || 0);
        if (absDiff > 1000) return AnomalySeverity.CRITICAL;
        if (absDiff > 100) return AnomalySeverity.HIGH;
        if (absDiff > 10) return AnomalySeverity.MEDIUM;
        return AnomalySeverity.LOW;
        
      case AnomalyType.DATE_MISMATCH:
        if (details.daysDifference > 30) return AnomalySeverity.HIGH;
        if (details.daysDifference > 7) return AnomalySeverity.MEDIUM;
        return AnomalySeverity.LOW;
        
      case AnomalyType.EXTERNAL_ONLY:
      case AnomalyType.DUPLICATE_TRANSACTION:
        return AnomalySeverity.HIGH;
        
      case AnomalyType.SYSTEM_ONLY:
      case AnomalyType.STATUS_MISMATCH:
      case AnomalyType.MISSING_REQUIRED_FIELDS:
        return AnomalySeverity.MEDIUM;
        
      default:
        return AnomalySeverity.LOW;
    }
  },
  
  /**
   * 获取异常类型的显示名称
   * @param type 异常类型
   * @returns 显示名称
   */
  getAnomalyTypeName(type: AnomalyType): string {
    const typeNames: Record<AnomalyType, string> = {
      [AnomalyType.SYSTEM_ONLY]: '系统内独有交易',
      [AnomalyType.EXTERNAL_ONLY]: '外部独有交易',
      [AnomalyType.AMOUNT_MISMATCH]: '金额不匹配',
      [AnomalyType.DATE_MISMATCH]: '日期不匹配',
      [AnomalyType.STATUS_MISMATCH]: '状态不匹配',
      [AnomalyType.DUPLICATE_TRANSACTION]: '重复交易',
      [AnomalyType.SUSPICIOUS_TRANSACTION]: '可疑交易',
      [AnomalyType.INVALID_DATA]: '无效数据',
      [AnomalyType.MISSING_REQUIRED_FIELDS]: '缺失必填字段',
      [AnomalyType.CURRENCY_MISMATCH]: '币种不匹配',
      [AnomalyType.OTHER]: '其他异常'
    };
    
    return typeNames[type] || '未知异常';
  },
  
  /**
   * 获取严重程度的显示名称和颜色
   * @param severity 严重程度
   * @returns 显示信息
   */
  getSeverityInfo(severity: AnomalySeverity): { name: string; color: string } {
    const severityInfo: Record<AnomalySeverity, { name: string; color: string }> = {
      [AnomalySeverity.CRITICAL]: { name: '严重', color: '#ef4444' },
      [AnomalySeverity.HIGH]: { name: '高', color: '#f97316' },
      [AnomalySeverity.MEDIUM]: { name: '中', color: '#eab308' },
      [AnomalySeverity.LOW]: { name: '低', color: '#22c55e' }
    };
    
    return severityInfo[severity] || { name: '未知', color: '#6b7280' };
  },
  
  /**
   * 批量处理异常
   * @param anomalies 异常列表
   * @param action 处理动作
   * @returns 处理后的异常列表
   */
  batchProcessAnomalies(
    anomalies: ReconciliationAnomaly[],
    action: 'resolve' | 'ignore' | 'investigate',
    notes?: string
  ): ReconciliationAnomaly[] {
    return anomalies.map(anomaly => ({
      ...anomaly,
      status: action,
      updatedAt: new Date().toISOString(),
      resolutionNotes: notes,
      ...(action === 'resolve' && {
        resolvedAt: new Date().toISOString()
      })
    }));
  }
};
