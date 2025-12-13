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
