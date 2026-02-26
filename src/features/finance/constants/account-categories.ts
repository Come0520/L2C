export const ACCOUNT_CATEGORIES = {
  ASSET: '资产',
  LIABILITY: '负债',
  EQUITY: '权益',
  INCOME: '收入',
  EXPENSE: '费用',
} as const;

export type AccountCategory = keyof typeof ACCOUNT_CATEGORIES;
