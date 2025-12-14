import { ReconciliationStatement } from '@/shared/types/reconciliation';

/**
 * 财务勾稽类型
 */
export type CrossValidationType = 
  | 'order_finance'      // 订单表 ↔ 财务表
  | 'invoice_receipt'    // 发票表 ↔ 收款表
  | 'reconciliation_ledger' // 对账表 ↔ 总账
  | 'finance_tax'        // 财务表 ↔ 税务表
  | 'inventory_finance'  // 库存表 ↔ 财务表
  | 'other';             // 其他勾稽关系

/**
 * 勾稽验证结果状态
 */
export type ValidationStatus = 'valid' | 'invalid' | 'warning' | 'not_applicable';

/**
 * 勾稽验证结果
 */
export interface CrossValidationResult {
  id: string;
  type: CrossValidationType;
  name: string;
  status: ValidationStatus;
  message: string;
  sourceTable: string;
  targetTable: string;
  sourceAmount: number;
  targetAmount: number;
  difference: number;
  percentageDifference: number;
  tolerance: number;
  withinTolerance: boolean;
  metadata?: Record<string, unknown>;
  validatedAt: string;
  statementId?: string;
  statementNo?: string;
  items?: Array<{
    id: string;
    source: 'source' | 'target';
    description: string;
    amount: number;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * 勾稽验证配置
 */
export interface CrossValidationConfig {
  /** 金额差异容忍度，默认0.01 */
  tolerance: number;
  /** 启用订单-财务勾稽，默认true */
  enableOrderFinanceValidation: boolean;
  /** 启用发票-收款勾稽，默认true */
  enableInvoiceReceiptValidation: boolean;
  /** 启用对账-总账勾稽，默认true */
  enableReconciliationLedgerValidation: boolean;
  /** 启用财务-税务勾稽，默认false */
  enableFinanceTaxValidation: boolean;
  /** 启用库存-财务勾稽，默认false */
  enableInventoryFinanceValidation: boolean;
  /** 批量验证时的并发数，默认5 */
  batchConcurrency: number;
}

/**
 * 财务勾稽验证服务
 * 负责验证不同财务表之间的勾稽关系
 */
export class CrossValidationService {
  private config: CrossValidationConfig;
  
  constructor(config?: Partial<CrossValidationConfig>) {
    this.config = {
      tolerance: 0.01,
      enableOrderFinanceValidation: true,
      enableInvoiceReceiptValidation: true,
      enableReconciliationLedgerValidation: true,
      enableFinanceTaxValidation: false,
      enableInventoryFinanceValidation: false,
      batchConcurrency: 5,
      ...config
    };
  }
  
  /**
   * 执行财务勾稽验证
   * @param statements 待验证的对账单列表
   * @returns 勾稽验证结果列表
   */
  async validateCrossRelations(
    statements: ReconciliationStatement[]
  ): Promise<CrossValidationResult[]> {
    const results: CrossValidationResult[] = [];
    
    for (const statement of statements) {
      // 1. 订单表 ↔ 财务表 勾稽
      if (this.config.enableOrderFinanceValidation) {
        const orderFinanceResult = await this.validateOrderFinanceRelation(statement);
        results.push(orderFinanceResult);
      }
      
      // 2. 发票表 ↔ 收款表 勾稽
      if (this.config.enableInvoiceReceiptValidation) {
        const invoiceReceiptResult = await this.validateInvoiceReceiptRelation(statement);
        results.push(invoiceReceiptResult);
      }
      
      // 3. 对账表 ↔ 总账 勾稽
      if (this.config.enableReconciliationLedgerValidation) {
        const reconciliationLedgerResult = await this.validateReconciliationLedgerRelation(statement);
        results.push(reconciliationLedgerResult);
      }
      
      // 4. 财务表 ↔ 税务表 勾稽（可选）
      if (this.config.enableFinanceTaxValidation) {
        const financeTaxResult = await this.validateFinanceTaxRelation(statement);
        results.push(financeTaxResult);
      }
      
      // 5. 库存表 ↔ 财务表 勾稽（可选）
      if (this.config.enableInventoryFinanceValidation) {
        const inventoryFinanceResult = await this.validateInventoryFinanceRelation(statement);
        results.push(inventoryFinanceResult);
      }
    }
    
    return results;
  }
  
  /**
   * 验证订单表 ↔ 财务表 勾稽关系
   * @param statement 待验证的对账单
   * @returns 勾稽验证结果
   */
  private async validateOrderFinanceRelation(
    statement: ReconciliationStatement
  ): Promise<CrossValidationResult> {
    try {
      // 这里应该调用API获取订单和财务数据
      // 现在返回模拟数据
      
      // 假设从订单表获取的金额
      const orderAmount = statement.totalAmount;
      
      // 假设从财务表获取的金额（模拟数据，实际应该从API获取）
      const financeAmount = orderAmount * 0.99; // 模拟99%匹配
      
      const difference = orderAmount - financeAmount;
      const percentageDifference = orderAmount !== 0 ? (difference / orderAmount) * 100 : 0;
      const withinTolerance = Math.abs(difference) <= this.config.tolerance;
      
      let status: ValidationStatus;
      let message: string;
      
      if (withinTolerance) {
        status = 'valid';
        message = `订单表与财务表勾稽验证通过，差异 ${difference.toFixed(2)} 在容忍范围内`;
      } else if (Math.abs(percentageDifference) < 1) {
        status = 'warning';
        message = `订单表与财务表勾稽验证警告，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 略超出容忍范围`;
      } else {
        status = 'invalid';
        message = `订单表与财务表勾稽验证失败，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 超出容忍范围`;
      }
      
      return {
        id: crypto.randomUUID(),
        type: 'order_finance',
        name: '订单表 ↔ 财务表勾稽验证',
        status,
        message,
        sourceTable: 'orders',
        targetTable: 'finance_records',
        sourceAmount: orderAmount,
        targetAmount: financeAmount,
        difference,
        percentageDifference,
        tolerance: this.config.tolerance,
        withinTolerance,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo,
        items: [
          {
            id: crypto.randomUUID(),
            source: 'source',
            description: '订单总金额',
            amount: orderAmount,
            metadata: {
              source: 'orders',
              statementId: statement.id
            }
          },
          {
            id: crypto.randomUUID(),
            source: 'target',
            description: '财务记录总金额',
            amount: financeAmount,
            metadata: {
              source: 'finance_records',
              statementId: statement.id
            }
          }
        ]
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        type: 'order_finance',
        name: '订单表 ↔ 财务表勾稽验证',
        status: 'not_applicable',
        message: `验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        sourceTable: 'orders',
        targetTable: 'finance_records',
        sourceAmount: 0,
        targetAmount: 0,
        difference: 0,
        percentageDifference: 0,
        tolerance: this.config.tolerance,
        withinTolerance: false,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          error: error instanceof Error ? error.message : '未知错误'
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo
      };
    }
  }
  
  /**
   * 验证发票表 ↔ 收款表 勾稽关系
   * @param statement 待验证的对账单
   * @returns 勾稽验证结果
   */
  private async validateInvoiceReceiptRelation(
    statement: ReconciliationStatement
  ): Promise<CrossValidationResult> {
    try {
      // 这里应该调用API获取发票和收款数据
      // 现在返回模拟数据
      
      // 假设从发票表获取的金额
      const invoiceAmount = statement.totalAmount;
      
      // 假设从收款表获取的金额（模拟数据，实际应该从API获取）
      const receiptAmount = invoiceAmount * 1.005; // 模拟100.5%匹配
      
      const difference = invoiceAmount - receiptAmount;
      const percentageDifference = invoiceAmount !== 0 ? (difference / invoiceAmount) * 100 : 0;
      const withinTolerance = Math.abs(difference) <= this.config.tolerance;
      
      let status: ValidationStatus;
      let message: string;
      
      if (withinTolerance) {
        status = 'valid';
        message = `发票表与收款表勾稽验证通过，差异 ${difference.toFixed(2)} 在容忍范围内`;
      } else if (Math.abs(percentageDifference) < 1) {
        status = 'warning';
        message = `发票表与收款表勾稽验证警告，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 略超出容忍范围`;
      } else {
        status = 'invalid';
        message = `发票表与收款表勾稽验证失败，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 超出容忍范围`;
      }
      
      return {
        id: crypto.randomUUID(),
        type: 'invoice_receipt',
        name: '发票表 ↔ 收款表勾稽验证',
        status,
        message,
        sourceTable: 'invoices',
        targetTable: 'receipts',
        sourceAmount: invoiceAmount,
        targetAmount: receiptAmount,
        difference,
        percentageDifference,
        tolerance: this.config.tolerance,
        withinTolerance,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo,
        items: [
          {
            id: crypto.randomUUID(),
            source: 'source',
            description: '发票总金额',
            amount: invoiceAmount,
            metadata: {
              source: 'invoices',
              statementId: statement.id
            }
          },
          {
            id: crypto.randomUUID(),
            source: 'target',
            description: '收款总金额',
            amount: receiptAmount,
            metadata: {
              source: 'receipts',
              statementId: statement.id
            }
          }
        ]
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        type: 'invoice_receipt',
        name: '发票表 ↔ 收款表勾稽验证',
        status: 'not_applicable',
        message: `验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        sourceTable: 'invoices',
        targetTable: 'receipts',
        sourceAmount: 0,
        targetAmount: 0,
        difference: 0,
        percentageDifference: 0,
        tolerance: this.config.tolerance,
        withinTolerance: false,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          error: error instanceof Error ? error.message : '未知错误'
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo
      };
    }
  }
  
  /**
   * 验证对账表 ↔ 总账 勾稽关系
   * @param statement 待验证的对账单
   * @returns 勾稽验证结果
   */
  private async validateReconciliationLedgerRelation(
    statement: ReconciliationStatement
  ): Promise<CrossValidationResult> {
    try {
      // 这里应该调用API获取对账和总账数据
      // 现在返回模拟数据
      
      // 假设从对账表获取的金额
      const reconciliationAmount = statement.totalAmount;
      
      // 假设从总账获取的金额（模拟数据，实际应该从API获取）
      const ledgerAmount = reconciliationAmount; // 模拟完全匹配
      
      const difference = reconciliationAmount - ledgerAmount;
      const percentageDifference = reconciliationAmount !== 0 ? (difference / reconciliationAmount) * 100 : 0;
      const withinTolerance = Math.abs(difference) <= this.config.tolerance;
      
      let status: ValidationStatus;
      let message: string;
      
      if (withinTolerance) {
        status = 'valid';
        message = `对账表与总账勾稽验证通过，差异 ${difference.toFixed(2)} 在容忍范围内`;
      } else if (Math.abs(percentageDifference) < 1) {
        status = 'warning';
        message = `对账表与总账勾稽验证警告，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 略超出容忍范围`;
      } else {
        status = 'invalid';
        message = `对账表与总账勾稽验证失败，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 超出容忍范围`;
      }
      
      return {
        id: crypto.randomUUID(),
        type: 'reconciliation_ledger',
        name: '对账表 ↔ 总账勾稽验证',
        status,
        message,
        sourceTable: 'reconciliation_statements',
        targetTable: 'general_ledger',
        sourceAmount: reconciliationAmount,
        targetAmount: ledgerAmount,
        difference,
        percentageDifference,
        tolerance: this.config.tolerance,
        withinTolerance,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo,
        items: [
          {
            id: crypto.randomUUID(),
            source: 'source',
            description: '对账单总金额',
            amount: reconciliationAmount,
            metadata: {
              source: 'reconciliation_statements',
              statementId: statement.id
            }
          },
          {
            id: crypto.randomUUID(),
            source: 'target',
            description: '总账金额',
            amount: ledgerAmount,
            metadata: {
              source: 'general_ledger',
              statementId: statement.id
            }
          }
        ]
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        type: 'reconciliation_ledger',
        name: '对账表 ↔ 总账勾稽验证',
        status: 'not_applicable',
        message: `验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        sourceTable: 'reconciliation_statements',
        targetTable: 'general_ledger',
        sourceAmount: 0,
        targetAmount: 0,
        difference: 0,
        percentageDifference: 0,
        tolerance: this.config.tolerance,
        withinTolerance: false,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          error: error instanceof Error ? error.message : '未知错误'
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo
      };
    }
  }
  
  /**
   * 验证财务表 ↔ 税务表 勾稽关系
   * @param statement 待验证的对账单
   * @returns 勾稽验证结果
   */
  private async validateFinanceTaxRelation(
    statement: ReconciliationStatement
  ): Promise<CrossValidationResult> {
    try {
      // 这里应该调用API获取财务和税务数据
      // 现在返回模拟数据
      
      // 假设从财务表获取的金额
      const financeAmount = statement.totalAmount;
      
      // 假设从税务表获取的金额（模拟数据，实际应该从API获取）
      const taxAmount = financeAmount * 0.13; // 模拟13%税率
      
      const difference = financeAmount * 0.13 - taxAmount; // 模拟13%税率差异
      const percentageDifference = financeAmount !== 0 ? (difference / financeAmount) * 100 : 0;
      const withinTolerance = Math.abs(difference) <= this.config.tolerance;
      
      let status: ValidationStatus;
      let message: string;
      
      if (withinTolerance) {
        status = 'valid';
        message = `财务表与税务表勾稽验证通过，差异 ${difference.toFixed(2)} 在容忍范围内`;
      } else if (Math.abs(percentageDifference) < 1) {
        status = 'warning';
        message = `财务表与税务表勾稽验证警告，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 略超出容忍范围`;
      } else {
        status = 'invalid';
        message = `财务表与税务表勾稽验证失败，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 超出容忍范围`;
      }
      
      return {
        id: crypto.randomUUID(),
        type: 'finance_tax',
        name: '财务表 ↔ 税务表勾稽验证',
        status,
        message,
        sourceTable: 'finance_records',
        targetTable: 'tax_records',
        sourceAmount: financeAmount * 0.13,
        targetAmount: taxAmount,
        difference,
        percentageDifference,
        tolerance: this.config.tolerance,
        withinTolerance,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          taxRate: 0.13
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo,
        items: [
          {
            id: crypto.randomUUID(),
            source: 'source',
            description: '财务表应纳税额（13%）',
            amount: financeAmount * 0.13,
            metadata: {
              source: 'finance_records',
              statementId: statement.id,
              taxRate: 0.13
            }
          },
          {
            id: crypto.randomUUID(),
            source: 'target',
            description: '税务表实际税额',
            amount: taxAmount,
            metadata: {
              source: 'tax_records',
              statementId: statement.id
            }
          }
        ]
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        type: 'finance_tax',
        name: '财务表 ↔ 税务表勾稽验证',
        status: 'not_applicable',
        message: `验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        sourceTable: 'finance_records',
        targetTable: 'tax_records',
        sourceAmount: 0,
        targetAmount: 0,
        difference: 0,
        percentageDifference: 0,
        tolerance: this.config.tolerance,
        withinTolerance: false,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          error: error instanceof Error ? error.message : '未知错误'
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo
      };
    }
  }
  
  /**
   * 验证库存表 ↔ 财务表 勾稽关系
   * @param statement 待验证的对账单
   * @returns 勾稽验证结果
   */
  private async validateInventoryFinanceRelation(
    statement: ReconciliationStatement
  ): Promise<CrossValidationResult> {
    try {
      // 这里应该调用API获取库存和财务数据
      // 现在返回模拟数据
      
      // 假设从库存表获取的金额
      const inventoryAmount = statement.totalAmount * 0.8; // 模拟80%库存价值
      
      // 假设从财务表获取的金额（模拟数据，实际应该从API获取）
      const financeAmount = inventoryAmount * 1.002; // 模拟100.2%匹配
      
      const difference = inventoryAmount - financeAmount;
      const percentageDifference = inventoryAmount !== 0 ? (difference / inventoryAmount) * 100 : 0;
      const withinTolerance = Math.abs(difference) <= this.config.tolerance;
      
      let status: ValidationStatus;
      let message: string;
      
      if (withinTolerance) {
        status = 'valid';
        message = `库存表与财务表勾稽验证通过，差异 ${difference.toFixed(2)} 在容忍范围内`;
      } else if (Math.abs(percentageDifference) < 1) {
        status = 'warning';
        message = `库存表与财务表勾稽验证警告，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 略超出容忍范围`;
      } else {
        status = 'invalid';
        message = `库存表与财务表勾稽验证失败，差异 ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) 超出容忍范围`;
      }
      
      return {
        id: crypto.randomUUID(),
        type: 'inventory_finance',
        name: '库存表 ↔ 财务表勾稽验证',
        status,
        message,
        sourceTable: 'inventory',
        targetTable: 'finance_records',
        sourceAmount: inventoryAmount,
        targetAmount: financeAmount,
        difference,
        percentageDifference,
        tolerance: this.config.tolerance,
        withinTolerance,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo,
        items: [
          {
            id: crypto.randomUUID(),
            source: 'source',
            description: '库存总价值',
            amount: inventoryAmount,
            metadata: {
              source: 'inventory',
              statementId: statement.id
            }
          },
          {
            id: crypto.randomUUID(),
            source: 'target',
            description: '财务表库存价值',
            amount: financeAmount,
            metadata: {
              source: 'finance_records',
              statementId: statement.id
            }
          }
        ]
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        type: 'inventory_finance',
        name: '库存表 ↔ 财务表勾稽验证',
        status: 'not_applicable',
        message: `验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        sourceTable: 'inventory',
        targetTable: 'finance_records',
        sourceAmount: 0,
        targetAmount: 0,
        difference: 0,
        percentageDifference: 0,
        tolerance: this.config.tolerance,
        withinTolerance: false,
        metadata: {
          statementId: statement.id,
          statementNo: statement.statementNo,
          error: error instanceof Error ? error.message : '未知错误'
        },
        validatedAt: new Date().toISOString(),
        statementId: statement.id,
        statementNo: statement.statementNo
      };
    }
  }
  
  /**
   * 生成勾稽验证报告
   * @param results 验证结果列表
   * @returns 验证报告
   */
  generateValidationReport(results: CrossValidationResult[]) {
    // 按状态分组
    const byStatus = results.reduce((acc, result) => {
      if (!acc[result.status]) {
        acc[result.status] = [];
      }
      acc[result.status].push(result);
      return acc;
    }, {} as Record<ValidationStatus, CrossValidationResult[]>);
    
    // 按类型分组
    const byType = results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<CrossValidationType, CrossValidationResult[]>);
    
    // 计算总差异
    const totalDifference = results.reduce((sum, result) => sum + Math.abs(result.difference), 0);
    const validResults = results.filter(result => result.status === 'valid');
    const invalidResults = results.filter(result => result.status === 'invalid');
    const warningResults = results.filter(result => result.status === 'warning');
    
    return {
      totalResults: results.length,
      validResults: validResults.length,
      invalidResults: invalidResults.length,
      warningResults: warningResults.length,
      totalDifference,
      byStatus,
      byType,
      successRate: results.length > 0 ? (validResults.length / results.length) * 100 : 0,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 获取勾稽验证建议
   * @param result 验证结果
   * @returns 处理建议
   */
  getValidationSuggestion(result: CrossValidationResult): string {
    switch (result.status) {
      case 'valid':
        return '勾稽验证通过，无需处理';
      case 'warning':
        return '勾稽验证警告，建议进一步检查差异原因，确认是否需要调整';
      case 'invalid':
        switch (result.type) {
          case 'order_finance':
            return '订单与财务数据不一致，建议检查订单状态、财务记录是否完整，确认是否有未入账的订单或重复入账的财务记录';
          case 'invoice_receipt':
            return '发票与收款数据不一致，建议检查发票开具情况、收款记录，确认是否有未收款的发票或重复收款的记录';
          case 'reconciliation_ledger':
            return '对账与总账数据不一致，建议检查对账过程、总账记录，确认是否有未记录的对账调整或总账错误';
          case 'finance_tax':
            return '财务与税务数据不一致，建议检查税率设置、税额计算，确认是否有税务调整或计算错误';
          case 'inventory_finance':
            return '库存与财务数据不一致，建议检查库存盘点、成本核算，确认是否有库存差异或成本计算错误';
          default:
            return '勾稽验证失败，建议检查相关数据，确认差异原因并进行调整';
        }
      case 'not_applicable':
        return '勾稽验证未执行，建议检查数据源或配置是否正确';
      default:
        return '无建议';
    }
  }
}

/**
 * 勾稽验证工具函数
 */
export const crossValidationUtils = {
  /**
   * 计算勾稽差异统计
   * @param results 验证结果列表
   * @returns 差异统计
   */
  calculateDifferenceStats(results: CrossValidationResult[]) {
    const differences = results.map(result => result.difference);
    const absDifferences = differences.map(diff => Math.abs(diff));
    
    return {
      minDifference: Math.min(...differences),
      maxDifference: Math.max(...differences),
      averageDifference: differences.reduce((sum, diff) => sum + diff, 0) / differences.length,
      minAbsDifference: Math.min(...absDifferences),
      maxAbsDifference: Math.max(...absDifferences),
      averageAbsDifference: absDifferences.reduce((sum, diff) => sum + diff, 0) / absDifferences.length,
      medianDifference: this.calculateMedian(differences),
      totalDifference: differences.reduce((sum, diff) => sum + diff, 0)
    };
  },
  
  /**
   * 计算中位数
   * @param numbers 数字数组
   * @returns 中位数
   */
  calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) {
      return 0;
    }
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      const left = sorted[middle - 1] || 0;
      const right = sorted[middle] || 0;
      return (left + right) / 2;
    } else {
      return sorted[middle] || 0;
    }
  },
  
  /**
   * 格式化验证结果状态
   * @param status 验证状态
   * @returns 格式化的状态信息
   */
  formatValidationStatus(status: ValidationStatus) {
    const configs = {
      valid: { text: '通过', color: 'green', icon: '✅' },
      invalid: { text: '失败', color: 'red', icon: '❌' },
      warning: { text: '警告', color: 'yellow', icon: '⚠️' },
      not_applicable: { text: '不适用', color: 'gray', icon: 'ℹ️' }
    };
    
    return configs[status] || { text: status, color: 'gray', icon: 'ℹ️' };
  }
};