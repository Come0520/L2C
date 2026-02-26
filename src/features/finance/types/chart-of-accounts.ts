import { z } from 'zod';
import { accountCategoryEnum } from '@/shared/api/schema/enums';

const AccountCategoryEnumSchema = z.enum(accountCategoryEnum.enumValues);

export const CreateAccountSchema = z.object({
    code: z.string().min(1, '请输入科目编码').max(20),
    name: z.string().min(1, '请输入科目名称').max(100),
    category: AccountCategoryEnumSchema,
    parentId: z.string().uuid().optional(),
    description: z.string().max(500).optional(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = z.object({
    id: z.string().uuid('无效的科目ID'),
    code: z.string().min(1, '请输入科目编码').max(20),
    name: z.string().min(1, '请输入科目名称').max(100),
    description: z.string().max(500).optional(),
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
