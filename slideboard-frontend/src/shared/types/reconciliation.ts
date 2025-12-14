import { z } from 'zod';

export type StatementType = 'customer' | 'supplier';
export type StatementStatus = 'draft' | 'confirmed' | 'settled';

export interface StatementItem {
  id: string;
  statementId: string;
  sourceType: 'sales_order' | 'purchase_order';
  sourceId: string; // 销售单ID 或 采购单ID
  sourceNo: string;
  amount: number; // 应收/应付金额
  date: string;
  notes?: string;
}

export interface ReconciliationStatement {
  id: string;
  statementNo: string;
  type: StatementType;
  targetId: string; // 客户ID 或 供应商ID
  targetName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: StatementStatus;
  items: StatementItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const reconciliationSchema = z.object({
  type: z.enum(['customer', 'supplier']),
  targetId: z.string().min(1, '请选择对账对象'),
  targetName: z.string().min(1, '对象名称不能为空'),
  periodStart: z.string().min(1, '请选择开始日期'),
  periodEnd: z.string().min(1, '请选择结束日期'),
  items: z.array(z.string()).min(1, '请选择至少一项进行对账'), // sourceIds
});

export type ReconciliationFormData = z.infer<typeof reconciliationSchema>;

export interface CreateStatementRequest {
    type: StatementType;
    targetId: string;
    periodStart: string;
    periodEnd: string;
    items: {
        sourceType: 'sales_order' | 'purchase_order';
        sourceId: string;
        amount: number;
        date: string;
    }[];
}

// 对账规则类型定义
export type MatchStrategy = 'exact' | 'amount_date' | 'amount_only';
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains' | 'not_contains';

export interface ReconciliationCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logic?: 'AND' | 'OR';
}

export interface ReconciliationRule {
  id: string;
  name: string;
  description?: string;
  type: StatementType;
  status: 'active' | 'inactive';
  matchStrategy: MatchStrategy;
  conditions: ReconciliationCondition[];
  tolerance: number;
  dateTolerance: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RuleExecutionResult {
  id: string;
  ruleId: string;
  ruleName: string;
  entityId: string;
  entityType: string;
  success: boolean;
  message: string;
  matchedItems: ReconciliationItem[];
  unmatchedItems: ReconciliationItem[];
  differences: ReconciliationDifference[];
  executedAt: string;
  executionTime: number;
}

// 对账项目类型定义
export interface ReconciliationItem {
  id: string;
  statementId: string;
  sourceType: string;
  sourceId: string;
  sourceNo: string;
  amount: number;
  date: string;
  notes?: string;
  status?: string;
}

// 对账差异类型定义
export type DifferenceType = 'amount' | 'date' | 'status' | 'other';
export type DifferenceSource = 'system' | 'external';

export interface ReconciliationDifference {
  id: string;
  type: DifferenceType;
  source: DifferenceSource;
  expected: any;
  actual: any;
  amountDifference?: number;
  percentageDifference?: number;
  description?: string;
  severity: 'low' | 'medium' | 'high';
}

// 对账异常类型定义
export enum AnomalyType {
  SYSTEM_ONLY = 'system_only',
  EXTERNAL_ONLY = 'external_only',
  AMOUNT_MISMATCH = 'amount_mismatch',
  DATE_MISMATCH = 'date_mismatch',
  STATUS_MISMATCH = 'status_mismatch',
  DUPLICATE_TRANSACTION = 'duplicate_transaction',
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  INVALID_DATA = 'invalid_data',
  MISSING_REQUIRED_FIELDS = 'missing_required_fields',
  CURRENCY_MISMATCH = 'currency_mismatch',
  OTHER = 'other'
}

// 异常严重程度
export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 对账异常
export interface ReconciliationAnomaly {
  id: string;
  statementId: string;
  itemId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  details: any;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// 对账结果
export interface ReconciliationResult {
  id: string;
  statementId: string;
  executedAt: string;
  executedBy: string;
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  totalDifferences: number;
  totalAnomalies: number;
  reconciliationRate: number;
  status: 'completed' | 'partial' | 'failed';
  anomalies: ReconciliationAnomaly[];
  executionResults: RuleExecutionResult[];
}

// 异常处理请求
export interface AnomalyActionRequest {
  anomalyId: string;
  action: 'resolve' | 'ignore' | 'investigate';
  notes?: string;
  resolutionDetails?: any;
}
