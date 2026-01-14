import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(11, 'Invalid phone number'),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6, 'Password too short').optional(),
    role: z.string().min(1, 'Role is required'),
});

export const updateUserSchema = createUserSchema.partial().extend({
    id: z.string().uuid(),
});

export const reminderRuleSchema = z.object({
    name: z.string().min(1),
    module: z.string(),
    triggerType: z.string(),
    days: z.number().int(),
    isActive: z.boolean(),
});
