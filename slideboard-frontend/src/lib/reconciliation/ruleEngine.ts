// 对账规则定义

export type RuleType = 'order' | 'customer' | 'time_range';
export type MatchCondition = 'exact' | 'range' | 'percentage' | 'regex';
export type ActionType = 'auto_match' | 'flag_for_review' | 'create_manual_entry';

export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  ruleType: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number; // 规则优先级，数字越小优先级越高
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  id: string;
  field: string; // 对账字段，如 'amount', 'order_no', 'customer_id' 等
  operator: MatchCondition;
  value: any; // 匹配值，根据 operator 类型不同而不同
  tolerance?: number; // 容差值，用于 range 或 percentage 匹配
  required?: boolean; // 该条件是否为必填
}

export interface RuleAction {
  id: string;
  type: ActionType;
  params?: Record<string, any>; // 动作参数
  description?: string; // 动作描述
}

export interface ReconciliationItem {
  id: string;
  source: 'system' | 'external'; // 数据来源
  sourceId: string; // 来源系统的ID
  orderNo?: string; // 订单号
  customerId?: string; // 客户ID
  customerName?: string; // 客户名称
  amount: number; // 金额
  date: string; // 交易日期
  status: 'matched' | 'unmatched' | 'flagged'; // 对账状态
  metadata?: Record<string, any>; // 附加信息
}

export interface ReconciliationResult {
  matchedItems: Array<{ system: ReconciliationItem; external: ReconciliationItem }>;
  unmatchedSystemItems: ReconciliationItem[];
  unmatchedExternalItems: ReconciliationItem[];
  flaggedItems: Array<{ system: ReconciliationItem; external: ReconciliationItem; reason: string }>;
  rulesApplied: string[]; // 应用的规则ID
  reconciliationSummary: {
    totalSystemItems: number;
    totalExternalItems: number;
    matchedCount: number;
    unmatchedSystemCount: number;
    unmatchedExternalCount: number;
    flaggedCount: number;
    totalAmountMatched: number;
    totalAmountUnmatched: number;
  };
}

export class ReconciliationRuleEngine {
  private rules: ReconciliationRule[];

  constructor(rules: ReconciliationRule[]) {
    // 按优先级排序规则
    this.rules = rules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * 执行自动对账
   */
  public executeReconciliation(
    systemItems: ReconciliationItem[],
    externalItems: ReconciliationItem[]
  ): ReconciliationResult {
    // 初始化结果
    const result: ReconciliationResult = {
      matchedItems: [],
      unmatchedSystemItems: [...systemItems],
      unmatchedExternalItems: [...externalItems],
      flaggedItems: [],
      rulesApplied: [],
      reconciliationSummary: {
        totalSystemItems: systemItems.length,
        totalExternalItems: externalItems.length,
        matchedCount: 0,
        unmatchedSystemCount: systemItems.length,
        unmatchedExternalCount: externalItems.length,
        flaggedCount: 0,
        totalAmountMatched: 0,
        totalAmountUnmatched: systemItems.reduce((sum, item) => sum + item.amount, 0)
      }
    };

    // 应用每条规则
    for (const rule of this.rules) {
      this.applyRule(rule, result);
      this.updateSummary(result);
      
      // 如果所有项目都已匹配，提前结束
      if (result.unmatchedSystemItems.length === 0 && result.unmatchedExternalItems.length === 0) {
        break;
      }
    }

    return result;
  }

  /**
   * 应用单条规则
   */
  private applyRule(rule: ReconciliationRule, result: ReconciliationResult): void {
    result.rulesApplied.push(rule.id);

    // 根据规则类型应用不同的匹配逻辑
    switch (rule.ruleType) {
      case 'order':
        this.applyOrderRule(rule, result);
        break;
      case 'customer':
        this.applyCustomerRule(rule, result);
        break;
      case 'time_range':
        this.applyTimeRangeRule(rule, result);
        break;
      default:
        console.warn(`未知的规则类型: ${rule.ruleType}`);
    }
  }

  /**
   * 应用订单匹配规则
   */
  private applyOrderRule(rule: ReconciliationRule, result: ReconciliationResult): void {
    // 按订单号匹配
    const orderNoCondition = rule.conditions.find(c => c.field === 'order_no');
    if (!orderNoCondition) return;

    for (let i = result.unmatchedSystemItems.length - 1; i >= 0; i--) {
      const systemItem = result.unmatchedSystemItems[i];
      
      for (let j = result.unmatchedExternalItems.length - 1; j >= 0; j--) {
        const externalItem = result.unmatchedExternalItems[j];
        
        // 检查订单号匹配
        if (systemItem && externalItem && systemItem.orderNo && externalItem.orderNo && this.matchesCondition(systemItem.orderNo, orderNoCondition, externalItem.orderNo)) {
          // 检查其他条件
          const allConditionsMet = rule.conditions.every(condition => {
            if (condition.field === 'order_no') return true;
            return this.matchesCondition(
              systemItem[condition.field as keyof ReconciliationItem],
              condition,
              externalItem[condition.field as keyof ReconciliationItem]
            );
          });

          if (allConditionsMet) {
            // 应用规则动作
            this.applyActions(rule.actions, systemItem, externalItem, result);
            
            // 从待匹配列表中移除
            result.unmatchedSystemItems.splice(i, 1);
            result.unmatchedExternalItems.splice(j, 1);
            break;
          }
        }
      }
    }
  }

  /**
   * 应用客户匹配规则
   */
  private applyCustomerRule(rule: ReconciliationRule, result: ReconciliationResult): void {
    // 按客户ID匹配
    const customerIdCondition = rule.conditions.find(c => c.field === 'customer_id');
    if (!customerIdCondition) return;

    // 按客户分组
    const systemItemsByCustomer = this.groupItemsByCustomer(result.unmatchedSystemItems);
    const externalItemsByCustomer = this.groupItemsByCustomer(result.unmatchedExternalItems);

    // 对每个客户应用规则
    for (const [customerId, systemItems] of Object.entries(systemItemsByCustomer)) {
      const externalItems = externalItemsByCustomer[customerId] || [];
      if (externalItems.length === 0) continue;

      // 对该客户的所有项目应用规则
      for (let i = systemItems.length - 1; i >= 0; i--) {
        const systemItem = systemItems[i];
        
        for (let j = externalItems.length - 1; j >= 0; j--) {
          const externalItem = externalItems[j];
          
          if (systemItem && externalItem) {
            // 检查所有条件
            const allConditionsMet = rule.conditions.every(condition => {
              return this.matchesCondition(
                systemItem[condition.field as keyof ReconciliationItem],
                condition,
                externalItem[condition.field as keyof ReconciliationItem]
              );
            });

            if (allConditionsMet) {
              // 应用规则动作
              this.applyActions(rule.actions, systemItem, externalItem, result);
            }
          }
        }
      }
    }
  }

  /**
   * 应用时间范围规则
   */
  private applyTimeRangeRule(rule: ReconciliationRule, result: ReconciliationResult): void {
    // 按时间范围匹配
    const timeCondition = rule.conditions.find(c => c.field === 'date');
    if (!timeCondition) return;

    for (let i = result.unmatchedSystemItems.length - 1; i >= 0; i--) {
      const systemItem = result.unmatchedSystemItems[i];
      
      for (let j = result.unmatchedExternalItems.length - 1; j >= 0; j--) {
        const externalItem = result.unmatchedExternalItems[j];
        
        // 检查时间范围匹配
        if (systemItem && externalItem && this.matchesCondition(systemItem.date, timeCondition, externalItem.date)) {
          // 检查其他条件
          const allConditionsMet = rule.conditions.every(condition => {
            if (condition.field === 'date') return true;
            return this.matchesCondition(
              systemItem[condition.field as keyof ReconciliationItem],
              condition,
              externalItem[condition.field as keyof ReconciliationItem]
            );
          });

          if (allConditionsMet) {
            // 应用规则动作
            this.applyActions(rule.actions, systemItem, externalItem, result);
          }
        }
      }
    }
  }

  /**
   * 匹配条件
   */
  private matchesCondition(systemValue: any, condition: RuleCondition, externalValue: any): boolean {
    // 如果条件是必填但值为空，返回 false
    if (condition.required && (!systemValue || !externalValue)) {
      return false;
    }

    // 如果两个值都为空，根据 required 属性决定
    if (!systemValue && !externalValue) {
      return !condition.required;
    }

    // 确保两个值都有值
    if (!systemValue || !externalValue) {
      return false;
    }

    switch (condition.operator) {
      case 'exact':
        return systemValue === externalValue;
        
      case 'range':
        const tolerance = condition.tolerance || 0;
        if (typeof externalValue !== 'number' || typeof systemValue !== 'number') {
          return false;
        }
        const min = externalValue - tolerance;
        const max = externalValue + tolerance;
        return systemValue >= min && systemValue <= max;
        
      case 'percentage':
        const percentage = condition.tolerance || 0;
        if (typeof externalValue !== 'number' || typeof systemValue !== 'number' || externalValue === 0) {
          return false;
        }
        const diff = Math.abs(systemValue - externalValue) / externalValue;
        return diff <= (percentage / 100);
        
      case 'regex':
        if (typeof systemValue !== 'string' || typeof externalValue !== 'string') {
          return false;
        }
        const regex = new RegExp(condition.value);
        return regex.test(systemValue) && regex.test(externalValue);
        
      default:
        return false;
    }
  }

  /**
   * 应用规则动作
   */
  private applyActions(actions: RuleAction[], systemItem: ReconciliationItem, externalItem: ReconciliationItem, result: ReconciliationResult): void {
    for (const action of actions) {
      switch (action.type) {
        case 'auto_match':
          // 自动匹配
          result.matchedItems.push({ system: systemItem, external: externalItem });
          break;
          
        case 'flag_for_review':
          // 标记为需要人工审核
          result.flaggedItems.push({
            system: systemItem,
            external: externalItem,
            reason: action.description || '根据规则标记需要审核'
          });
          break;
          
        case 'create_manual_entry':
          // 创建手动对账记录
          // 这里可以添加创建手动记录的逻辑
          console.log('创建手动对账记录:', systemItem, externalItem, action.params);
          break;
      }
    }
  }

  /**
   * 按客户分组
   */
  private groupItemsByCustomer(items: ReconciliationItem[]): Record<string, ReconciliationItem[]> {
    return items.reduce((groups, item) => {
      const customerId = item.customerId || 'unknown';
      if (!groups[customerId]) {
        groups[customerId] = [];
      }
      groups[customerId].push(item);
      return groups;
    }, {} as Record<string, ReconciliationItem[]>);
  }

  /**
   * 更新对账结果摘要
   */
  private updateSummary(result: ReconciliationResult): void {
    result.reconciliationSummary = {
      totalSystemItems: result.reconciliationSummary.totalSystemItems,
      totalExternalItems: result.reconciliationSummary.totalExternalItems,
      matchedCount: result.matchedItems.length,
      unmatchedSystemCount: result.unmatchedSystemItems.length,
      unmatchedExternalCount: result.unmatchedExternalItems.length,
      flaggedCount: result.flaggedItems.length,
      totalAmountMatched: result.matchedItems.reduce((sum, pair) => sum + pair.system.amount, 0),
      totalAmountUnmatched: result.unmatchedSystemItems.reduce((sum, item) => sum + item.amount, 0)
    };
  }

  /**
   * 添加规则
   */
  public addRule(rule: ReconciliationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新规则
   */
  public updateRule(ruleId: string, updates: Partial<ReconciliationRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      // 使用类型断言确保合并后的对象符合 ReconciliationRule 类型
      const existingRule = this.rules[index];
      const updatedRule = { ...existingRule, ...updates } as ReconciliationRule;
      this.rules[index] = updatedRule;
      this.rules.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * 删除规则
   */
  public deleteRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * 获取所有规则
   */
  public getRules(): ReconciliationRule[] {
    return [...this.rules];
  }
}

// 示例规则
const sampleRules: ReconciliationRule[] = [
  {
    id: 'rule_001',
    name: '订单号完全匹配规则',
    description: '当系统订单号与外部订单号完全匹配，且金额在0.01元容差范围内时自动匹配',
    ruleType: 'order',
    conditions: [
      {
        id: 'cond_001',
        field: 'order_no',
        operator: 'exact',
        value: '',
        required: true
      },
      {
        id: 'cond_002',
        field: 'amount',
        operator: 'range',
        value: 0,
        tolerance: 0.01,
        required: true
      }
    ],
    actions: [
      {
        id: 'action_001',
        type: 'auto_match',
        description: '自动匹配订单'
      }
    ],
    priority: 1,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule_002',
    name: '客户金额百分比匹配规则',
    description: '当客户ID匹配，且金额差异在5%以内时自动匹配',
    ruleType: 'customer',
    conditions: [
      {
        id: 'cond_003',
        field: 'customer_id',
        operator: 'exact',
        value: '',
        required: true
      },
      {
        id: 'cond_004',
        field: 'amount',
        operator: 'percentage',
        value: 0,
        tolerance: 5,
        required: true
      }
    ],
    actions: [
      {
        id: 'action_002',
        type: 'auto_match',
        description: '自动匹配客户订单'
      }
    ],
    priority: 2,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default sampleRules;
