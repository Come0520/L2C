import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { customers } from './customers';
import { productCategoryEnum } from './enums';

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

export type NotificationType = 'SYSTEM' | 'ORDER_STATUS' | 'APPROVAL' | 'ALERT' | 'MENTION' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

// Derive ProductCategory from enum values
export type ProductCategory = (typeof productCategoryEnum.enumValues)[number];
