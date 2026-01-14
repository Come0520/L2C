import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { customers } from './customers';

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
