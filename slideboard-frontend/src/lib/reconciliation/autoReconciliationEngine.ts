import { ReconciliationItem, ReconciliationStatement, ReconciliationRule, RuleExecutionResult, ReconciliationAnomaly } from '@/shared/types/reconciliation';

import { ReconciliationAnomalyDetector } from './anomalyDetection';

/**
 * 自动对账引擎
 * 负责执行对账规则，检测差异，生成对账结果和异常报告
 */
export class AutoReconciliationEngine {
  private anomalyDetector: ReconciliationAnomalyDetector;
  
  constructor() {
    this.anomalyDetector = new ReconciliationAnomalyDetector();
  }
  
  /**
   * 执行自动对账
   * @param statements 待对账的对账单列表
   * @param rules 对账规则列表
   * @returns 对账结果和异常报告
   */
  async executeAutoReconciliation(
    statements: ReconciliationStatement[],
    rules: ReconciliationRule[]
  ): Promise<{
    executionResults: RuleExecutionResult[];
    anomalies: ReconciliationAnomaly[];
    anomalyReport: ReturnType<ReconciliationAnomalyDetector['generateAnomalyReport']>;
  }> {
    const executionResults: RuleExecutionResult[] = [];
    
    for (const statement of statements) {
      for (const rule of rules) {
        if (rule.status === 'active') {
          const result = await this.executeRule(statement, rule);
          executionResults.push(result);
        }
      }
    }
    
    // 收集所有匹配、未匹配项目和差异
    const allMatchedItems = executionResults.flatMap(result => result.matchedItems);
    const allUnmatchedItems = executionResults.flatMap(result => result.unmatchedItems);
    const allDifferences = executionResults.flatMap(result => result.differences);
    
    // 检测异常
    const anomalies = this.anomalyDetector.detectAnomalies(
      allMatchedItems,
      allUnmatchedItems,
      allDifferences
    );
    
    // 生成异常报告
    const anomalyReport = this.anomalyDetector.generateAnomalyReport(anomalies);
    
    return {
      executionResults,
      anomalies,
      anomalyReport
    };
  }
  
  /**
   * 执行单个对账规则
   * @param statement 待对账的对账单
   * @param rule 对账规则
   * @returns 规则执行结果
   */
  private async executeRule(
    statement: ReconciliationStatement,
    rule: ReconciliationRule
  ): Promise<RuleExecutionResult> {
    try {
      // 1. 验证规则条件
      const isConditionMet = await this.validateRuleConditions(statement, rule);
      
      if (!isConditionMet) {
        return {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          ruleName: rule.name,
          entityId: statement.id,
          entityType: 'reconciliation_statement',
          success: false,
          message: '规则条件不满足',
          matchedItems: [],
          unmatchedItems: [],
          differences: [],
          executedAt: new Date().toISOString(),
          executionTime: 0
        };
      }
      
      // 2. 执行规则动作
      const startTime = Date.now();
      const result = await this.executeRuleAction(statement, rule);
      const executionTime = Date.now() - startTime;
      
      return {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        entityId: statement.id,
        entityType: 'reconciliation_statement',
        success: true,
        message: '规则执行成功',
        matchedItems: result.matchedItems,
        unmatchedItems: result.unmatchedItems,
        differences: result.differences.map(diff => ({
          ...diff,
          severity: diff.type === 'amount' ? 'high' : 'medium' as const
        })),
        executedAt: new Date().toISOString(),
        executionTime
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        entityId: statement.id,
        entityType: 'reconciliation_statement',
        success: false,
        message: error instanceof Error ? error.message : '规则执行失败',
        matchedItems: [],
        unmatchedItems: [],
        differences: [],
        executedAt: new Date().toISOString(),
        executionTime: 0
      };
    }
  }
  
  /**
   * 验证规则条件
   * @param statement 待对账的对账单
   * @param rule 对账规则
   * @returns 条件是否满足
   */
  private async validateRuleConditions(
    statement: ReconciliationStatement,
    rule: ReconciliationRule
  ): Promise<boolean> {
    // 简单实现：如果没有条件，默认满足
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }
    
    // 实现条件验证逻辑
    // 这里可以根据规则条件的类型和操作符进行验证
    // 例如：验证金额范围、日期范围、状态等
    
    return true;
  }
  
  /**
   * 执行规则动作
   * @param statement 待对账的对账单
   * @param rule 对账规则
   * @returns 规则动作执行结果
   */
  private async executeRuleAction(
    statement: ReconciliationStatement,
    rule: ReconciliationRule
  ): Promise<{
    matchedItems: ReconciliationItem[];
    unmatchedItems: ReconciliationItem[];
    differences: Array<{
      id: string;
      type: 'amount' | 'date' | 'status' | 'other';
      source: 'system' | 'external';
      expected: any;
      actual: any;
      amountDifference?: number;
      percentageDifference?: number;
    }>;
  }> {
    const matchedItems: ReconciliationItem[] = [];
    const unmatchedItems: ReconciliationItem[] = [];
    const differences: Array<{
      id: string;
      type: 'amount' | 'date' | 'status' | 'other';
      source: 'system' | 'external';
      expected: any;
      actual: any;
      amountDifference?: number;
      percentageDifference?: number;
    }> = [];
    
    // 1. 获取待对账的项目
    const statementItems = statement.items || [];
    
    // 2. 获取外部数据（例如：银行对账单、第三方支付数据等）
    const externalData = await this.fetchExternalData(statement, rule);
    
    // 3. 执行匹配算法
    for (const item of statementItems) {
      const matched = await this.matchItem(item, externalData, rule);
      
      if (matched) {
        matchedItems.push(item);
        
        // 4. 检测差异
        const itemDifferences = this.detectDifferences(item, matched, rule);
        if (itemDifferences.length > 0) {
          differences.push(...itemDifferences);
        }
      } else {
        unmatchedItems.push(item);
      }
    }
    
    // 5. 处理外部数据中未匹配的项目
    const externalUnmatchedItems = await this.findExternalUnmatchedItems(statementItems, externalData, rule);
    
    return {
      matchedItems,
      unmatchedItems: [...unmatchedItems, ...externalUnmatchedItems],
      differences
    };
  }
  
  /**
   * 获取外部数据
   * @param statement 待对账的对账单
   * @param rule 对账规则
   * @returns 外部数据列表
   */
  private async fetchExternalData(
    statement: ReconciliationStatement,
    rule: ReconciliationRule
  ): Promise<Array<{ id: string; sourceId: string; sourceType: string; amount: number; date: string; status: string; metadata?: any }>> {
    // 模拟获取外部数据
    // 实际实现中，这里应该调用外部系统API或数据库查询
    return [];
  }
  
  /**
   * 匹配对账项目
   * @param item 系统内对账项目
   * @param externalData 外部数据列表
   * @param rule 对账规则
   * @returns 匹配的外部数据项，或null
   */
  private async matchItem(
    item: ReconciliationItem,
    externalData: Array<{ id: string; sourceId: string; sourceType: string; amount: number; date: string; status: string; metadata?: any }>,
    rule: ReconciliationRule
  ): Promise<{ id: string; sourceId: string; sourceType: string; amount: number; date: string; status: string; metadata?: any } | null> {
    // 简单实现：按金额和日期匹配
    const tolerance = rule.tolerance || 0.01;
    const dateTolerance = rule.dateTolerance || 1; // 天数
    
    for (const externalItem of externalData) {
      // 金额匹配
      const amountMatch = Math.abs(item.amount - externalItem.amount) <= tolerance;
      
      // 日期匹配
      const itemDate = new Date(item.date);
      const externalDate = new Date(externalItem.date);
      const dateDiff = Math.abs((itemDate.getTime() - externalDate.getTime()) / (1000 * 60 * 60 * 24));
      const dateMatch = dateDiff <= dateTolerance;
      
      // 源ID匹配
      const sourceIdMatch = item.sourceId === externalItem.sourceId;
      
      // 根据规则类型选择匹配策略
      if (rule.matchStrategy === 'exact') {
        if (amountMatch && dateMatch && sourceIdMatch) {
          return externalItem;
        }
      } else if (rule.matchStrategy === 'amount_date') {
        if (amountMatch && dateMatch) {
          return externalItem;
        }
      } else if (rule.matchStrategy === 'amount_only') {
        if (amountMatch) {
          return externalItem;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 检测差异
   * @param systemItem 系统内对账项目
   * @param externalItem 外部对账项目
   * @param rule 对账规则
   * @returns 差异列表
   */
  private detectDifferences(
    systemItem: ReconciliationItem,
    externalItem: { id: string; sourceId: string; sourceType: string; amount: number; date: string; status: string; metadata?: any },
    rule: ReconciliationRule
  ): Array<{
    id: string;
    type: 'amount' | 'date' | 'status' | 'other';
    source: 'system' | 'external';
    expected: any;
    actual: any;
    amountDifference?: number;
    percentageDifference?: number;
  }> {
    const differences: Array<{
      id: string;
      type: 'amount' | 'date' | 'status' | 'other';
      source: 'system' | 'external';
      expected: any;
      actual: any;
      amountDifference?: number;
      percentageDifference?: number;
    }> = [];
    
    // 1. 检测金额差异
    const amountDifference = externalItem.amount - systemItem.amount;
    const percentageDifference = systemItem.amount !== 0 ? (amountDifference / systemItem.amount) * 100 : 0;
    
    if (Math.abs(amountDifference) > (rule.tolerance || 0.01)) {
      differences.push({
        id: crypto.randomUUID(),
        type: 'amount',
        source: 'external',
        expected: systemItem.amount,
        actual: externalItem.amount,
        amountDifference,
        percentageDifference
      });
    }
    
    // 2. 检测日期差异
    const systemDate = new Date(systemItem.date);
    const externalDate = new Date(externalItem.date);
    const dateDiff = Math.abs((systemDate.getTime() - externalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dateDiff > (rule.dateTolerance || 1)) {
      differences.push({
        id: crypto.randomUUID(),
        type: 'date',
        source: 'external',
        expected: systemItem.date,
        actual: externalItem.date
      });
    }
    
    // 3. 检测状态差异
    // 这里假设系统内项目有status字段
    // if (systemItem.status !== externalItem.status) {
    //   differences.push({
    //     id: crypto.randomUUID(),
    //     type: 'status',
    //     source: 'external',
    //     expected: systemItem.status,
    //     actual: externalItem.status
    //   });
    // }
    
    return differences;
  }
  
  /**
   * 查找外部数据中未匹配的项目
   * @param statementItems 系统内对账项目列表
   * @param externalData 外部数据列表
   * @param rule 对账规则
   * @returns 未匹配的外部数据项列表
   */
  private async findExternalUnmatchedItems(
    statementItems: ReconciliationItem[],
    externalData: Array<{ id: string; sourceId: string; sourceType: string; amount: number; date: string; status: string; metadata?: any }>,
    rule: ReconciliationRule
  ): Promise<ReconciliationItem[]> {
    const unmatched: ReconciliationItem[] = [];
    
    for (const externalItem of externalData) {
      const matched = statementItems.some(item => {
        const tolerance = rule.tolerance || 0.01;
        const dateTolerance = rule.dateTolerance || 1;
        
        const amountMatch = Math.abs(item.amount - externalItem.amount) <= tolerance;
        const itemDate = new Date(item.date);
        const externalDate = new Date(externalItem.date);
        const dateDiff = Math.abs((itemDate.getTime() - externalDate.getTime()) / (1000 * 60 * 60 * 24));
        const dateMatch = dateDiff <= dateTolerance;
        
        return amountMatch && dateMatch;
      });
      
      if (!matched) {
        // 将外部未匹配项转换为系统内未匹配项格式
        unmatched.push({
          id: crypto.randomUUID(),
          statementId: '', // 空表示外部未匹配项
          sourceType: externalItem.sourceType,
          sourceId: externalItem.sourceId,
          sourceNo: '',
          amount: externalItem.amount,
          date: externalItem.date,
          notes: `外部未匹配项 (${externalItem.sourceType})`
        });
      }
    }
    
    return unmatched;
  }
}

/**
 * 差异检测工具
 */
export const differenceDetector = {
  /**
   * 检测金额差异
   * @param expected 期望金额
   * @param actual 实际金额
   * @param tolerance 允许的容差
   * @returns 差异信息
   */
  detectAmountDifference(
    expected: number,
    actual: number,
    tolerance: number = 0.01
  ): {
    hasDifference: boolean;
    amountDifference: number;
    percentageDifference: number;
    withinTolerance: boolean;
  } {
    const amountDifference = actual - expected;
    const percentageDifference = expected !== 0 ? (amountDifference / expected) * 100 : 0;
    const withinTolerance = Math.abs(amountDifference) <= tolerance;
    
    return {
      hasDifference: amountDifference !== 0,
      amountDifference,
      percentageDifference,
      withinTolerance
    };
  },
  
  /**
   * 检测日期差异
   * @param expected 期望日期
   * @param actual 实际日期
   * @param toleranceDays 允许的天数容差
   * @returns 差异信息
   */
  detectDateDifference(
    expected: string | Date,
    actual: string | Date,
    toleranceDays: number = 1
  ): {
    hasDifference: boolean;
    dayDifference: number;
    withinTolerance: boolean;
  } {
    const expectedDate = new Date(expected);
    const actualDate = new Date(actual);
    
    const dayDifference = Math.abs(
      (expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const withinTolerance = dayDifference <= toleranceDays;
    
    return {
      hasDifference: dayDifference > 0,
      dayDifference,
      withinTolerance
    };
  },
  
  /**
   * 分类差异
   * @param differences 差异列表
   * @returns 分类后的差异
   */
  categorizeDifferences(
    differences: Array<{
      type: 'amount' | 'date' | 'status' | 'other';
      amountDifference?: number;
    }>
  ): {
    amountDifferences: typeof differences;
    dateDifferences: typeof differences;
    statusDifferences: typeof differences;
    otherDifferences: typeof differences;
    totalAmountDifference: number;
    significantDifferences: typeof differences;
  } {
    const amountDifferences = differences.filter(d => d.type === 'amount');
    const dateDifferences = differences.filter(d => d.type === 'date');
    const statusDifferences = differences.filter(d => d.type === 'status');
    const otherDifferences = differences.filter(d => d.type === 'other');
    
    const totalAmountDifference = amountDifferences.reduce((sum, d) => sum + (d.amountDifference || 0), 0);
    
    const significantDifferences = differences.filter(d => {
      if (d.type === 'amount') {
        return Math.abs(d.amountDifference || 0) > 0.01;
      }
      if (d.type === 'date') {
        return true;
      }
      return true;
    });
    
    return {
      amountDifferences,
      dateDifferences,
      statusDifferences,
      otherDifferences,
      totalAmountDifference,
      significantDifferences
    };
  }
};

/**
 * 自动对账结果分析工具
 */
export const reconciliationAnalyzer = {
  /**
   * 分析对账结果
   * @param results 对账结果列表
   * @returns 分析结果
   */
  analyzeResults(
    results: RuleExecutionResult[]
  ): {
    totalRules: number;
    successfulRules: number;
    failedRules: number;
    totalItems: number;
    matchedItems: number;
    unmatchedItems: number;
    totalDifferences: number;
    significantDifferences: number;
    reconciliationRate: number;
    differenceSummary: {
      amount: {
        count: number;
        totalDifference: number;
        averageDifference: number;
        maxDifference: number;
        minDifference: number;
      };
      date: {
        count: number;
        averageDifference: number;
        maxDifference: number;
      };
      status: {
        count: number;
      };
      other: {
        count: number;
      };
    };
  } {
    const totalRules = results.length;
    const successfulRules = results.filter(r => r.success).length;
    const failedRules = totalRules - successfulRules;
    
    const totalItems = results.reduce((sum, r) => sum + r.matchedItems.length + r.unmatchedItems.length, 0);
    const matchedItems = results.reduce((sum, r) => sum + r.matchedItems.length, 0);
    const unmatchedItems = results.reduce((sum, r) => sum + r.unmatchedItems.length, 0);
    const totalDifferences = results.reduce((sum, r) => sum + r.differences.length, 0);
    
    const significantDifferences = results.reduce((sum, r) => {
      return sum + r.differences.filter(d => {
        if (d.type === 'amount') {
          return Math.abs(d.amountDifference || 0) > 0.01;
        }
        return true;
      }).length;
    }, 0);
    
    const reconciliationRate = totalItems > 0 ? (matchedItems / totalItems) * 100 : 0;
    
    // 差异汇总
    const amountDifferences = results.flatMap(r => r.differences.filter(d => d.type === 'amount'));
    const dateDifferences = results.flatMap(r => r.differences.filter(d => d.type === 'date'));
    const statusDifferences = results.flatMap(r => r.differences.filter(d => d.type === 'status'));
    const otherDifferences = results.flatMap(r => r.differences.filter(d => d.type === 'other'));
    
    const amountSum = amountDifferences.reduce((sum, d) => sum + (d.amountDifference || 0), 0);
    const amountAverage = amountDifferences.length > 0 ? amountSum / amountDifferences.length : 0;
    const amountMax = Math.max(...amountDifferences.map(d => Math.abs(d.amountDifference || 0)));
    const amountMin = Math.min(...amountDifferences.map(d => Math.abs(d.amountDifference || 0)));
    
    const dateAverage = dateDifferences.length > 0 ? 
      dateDifferences.reduce((sum, d) => {
        const expectedDate = new Date(d.expected);
        const actualDate = new Date(d.actual);
        const diffDays = Math.abs((expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / dateDifferences.length : 0;
    
    const dateMax = Math.max(...dateDifferences.map(d => {
      const expectedDate = new Date(d.expected);
      const actualDate = new Date(d.actual);
      return Math.abs((expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24));
    }));
    
    return {
      totalRules,
      successfulRules,
      failedRules,
      totalItems,
      matchedItems,
      unmatchedItems,
      totalDifferences,
      significantDifferences,
      reconciliationRate,
      differenceSummary: {
        amount: {
          count: amountDifferences.length,
          totalDifference: amountSum,
          averageDifference: amountAverage,
          maxDifference: amountMax,
          minDifference: amountMin
        },
        date: {
          count: dateDifferences.length,
          averageDifference: dateAverage,
          maxDifference: dateMax
        },
        status: {
          count: statusDifferences.length
        },
        other: {
          count: otherDifferences.length
        }
      }
    };
  }
};