import { withErrorHandler } from '@/lib/api/error-handler';
import { ReconciliationRule, ReconciliationRuleEngine, ReconciliationItem, ReconciliationResult } from '@/lib/reconciliation/ruleEngine';
import { ApiResponse } from '@/shared/types/api';

interface ReconciliationRequest {
  systemItems: ReconciliationItem[];
  externalItems: ReconciliationItem[];
  rules?: ReconciliationRule[];
  options?: {
    enableAutoMatch?: boolean;
    enableFlagging?: boolean;
    maxItemsPerBatch?: number;
  };
}

interface ReconciliationHistory {
  id: string;
  reconciliationId: string;
  executedAt: string;
  status: 'success' | 'failed' | 'partial';
  totalSystemItems: number;
  totalExternalItems: number;
  matchedCount: number;
  unmatchedSystemCount: number;
  unmatchedExternalCount: number;
  flaggedCount: number;
  rulesApplied: string[];
  executedBy: string;
  error?: string;
}

export interface ReconciliationRulesClient {
  /**
   * 获取所有对账规则
   */
  getReconciliationRules(): Promise<ApiResponse<ReconciliationRule[]>>;
  
  /**
   * 创建对账规则
   */
  createReconciliationRule(rule: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ReconciliationRule>>;
  
  /**
   * 更新对账规则
   */
  updateReconciliationRule(ruleId: string, updates: Partial<ReconciliationRule>): Promise<ApiResponse<ReconciliationRule>>;
  
  /**
   * 删除对账规则
   */
  deleteReconciliationRule(ruleId: string): Promise<ApiResponse<void>>;
  
  /**
   * 执行自动对账
   */
  executeAutoReconciliation(request: ReconciliationRequest): Promise<ApiResponse<ReconciliationResult>>;
  
  /**
   * 获取对账历史
   */
  getReconciliationHistory(reconciliationId?: string, limit?: number, offset?: number): Promise<ApiResponse<ReconciliationHistory[]>>;
  
  /**
   * 获取对账规则统计
   */
  getRuleStatistics(): Promise<ApiResponse<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByType: Record<string, number>;
    ruleUsage: Array<{ ruleId: string; ruleName: string; usageCount: number; successRate: number }>;
  }>>;
}

export const reconciliationRules: ReconciliationRulesClient = {
  /**
   * 获取所有对账规则
   */
  async getReconciliationRules(): Promise<ApiResponse<ReconciliationRule[]>> {
    return withErrorHandler(async () => {
      // 这里应该调用API获取规则，暂时使用模拟数据
      const sampleRules = await import('@/lib/reconciliation/ruleEngine').then(mod => mod.default);
      return {
        success: true,
        message: 'success',
        data: sampleRules
      };
    });
  },
  
  /**
   * 创建对账规则
   */
  async createReconciliationRule(rule: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ReconciliationRule>> {
    return withErrorHandler(async () => {
      // 这里应该调用API创建规则
      const newRule: ReconciliationRule = {
        ...rule,
        id: `rule_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return {
        success: true,
        message: 'success',
        data: newRule
      };
    });
  },
  
  /**
   * 更新对账规则
   */
  async updateReconciliationRule(ruleId: string, updates: Partial<ReconciliationRule>): Promise<ApiResponse<ReconciliationRule>> {
    return withErrorHandler(async () => {
      // 这里应该调用API更新规则
      const sampleRules = await import('@/lib/reconciliation/ruleEngine').then(mod => mod.default);
      const existingRule = sampleRules.find(r => r.id === ruleId);
      if (!existingRule) {
        throw new Error('Rule not found');
      }
      const updatedRule: ReconciliationRule = {
        ...existingRule,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return {
        success: true,
        message: 'success',
        data: updatedRule
      };
    });
  },
  
  /**
   * 删除对账规则
   */
  async deleteReconciliationRule(_ruleId: string): Promise<ApiResponse<void>> {
    return withErrorHandler(async () => {
      // 这里应该调用API删除规则
      return {
        success: true,
        message: 'success',
        data: undefined
      };
    });
  },
  
  /**
   * 执行自动对账
   */
  async executeAutoReconciliation(request: ReconciliationRequest): Promise<ApiResponse<ReconciliationResult>> {
    return withErrorHandler(async () => {
      // 获取规则
      const rules = request.rules || await this.getReconciliationRules().then(res => res.data || []);
      
      // 创建规则引擎实例
      const ruleEngine = new ReconciliationRuleEngine(rules);
      
      // 执行对账
      const result = ruleEngine.executeReconciliation(request.systemItems, request.externalItems);
      
      return {
        success: true,
        message: 'success',
        data: result
      };
    });
  },
  
  /**
   * 获取对账历史
   */
  async getReconciliationHistory(reconciliationId?: string, _limit?: number, _offset?: number): Promise<ApiResponse<ReconciliationHistory[]>> {
    return withErrorHandler(async () => {
      // 这里应该调用API获取历史记录
      const mockHistory: ReconciliationHistory[] = [
        {
          id: 'history_001',
          reconciliationId: reconciliationId || 'reconciliation_001',
          executedAt: new Date().toISOString(),
          status: 'success',
          totalSystemItems: 100,
          totalExternalItems: 98,
          matchedCount: 95,
          unmatchedSystemCount: 5,
          unmatchedExternalCount: 3,
          flaggedCount: 2,
          rulesApplied: ['rule_001', 'rule_002'],
          executedBy: 'system'
        }
      ];
      return {
        success: true,
        message: 'success',
        data: mockHistory
      };
    });
  },
  
  /**
   * 获取对账规则统计
   */
  async getRuleStatistics(): Promise<ApiResponse<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByType: Record<string, number>;
    ruleUsage: Array<{ ruleId: string; ruleName: string; usageCount: number; successRate: number }>;
  }>> {
    return withErrorHandler(async () => {
      // 这里应该调用API获取统计数据
      const sampleRules = await import('@/lib/reconciliation/ruleEngine').then(mod => mod.default);
      return {
        success: true,
        message: 'success',
        data: {
          totalRules: sampleRules.length,
          enabledRules: sampleRules.filter(r => r.enabled).length,
          disabledRules: sampleRules.filter(r => !r.enabled).length,
          rulesByType: {
            order: sampleRules.filter(r => r.ruleType === 'order').length,
            customer: sampleRules.filter(r => r.ruleType === 'customer').length,
            time_range: sampleRules.filter(r => r.ruleType === 'time_range').length
          },
          ruleUsage: sampleRules.map(rule => ({
            ruleId: rule.id,
            ruleName: rule.name,
            usageCount: Math.floor(Math.random() * 100),
            successRate: Math.random() * 0.5 + 0.5 // 50%-100%成功率
          }))
        }
      };
    });
  }
};
