import { type InferSelectModel } from 'drizzle-orm';
import { chartOfAccounts } from '@/shared/api/schema';
import { AccountCategory } from '../constants/account-categories';

export type ChartOfAccount = InferSelectModel<typeof chartOfAccounts>;

export type ChartOfAccountTreeNode = ChartOfAccount & {
    children?: ChartOfAccountTreeNode[];
};
