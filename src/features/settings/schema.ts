import { z } from 'zod';

/**
 * 用户创建校验 Schema
 */
export const createUserSchema = z.object({
    name: z.string().min(1, '姓名不能为空'),
    phone: z.string().min(11, '手机号格式不正确'),
    email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
    password: z.string().min(8, '密码长度不能少于 8 位').optional(),
    role: z.string().min(1, '角色不能为空'),
});

/**
 * 用户详情更新校验 Schema (用于基础信息)
 */
export const updateUserSchema = createUserSchema.partial().extend({
    id: z.string().uuid('无效的用户 ID'),
});

/**
 * 用户管理更新校验 Schema (用于管理员修改用户)
 */
export const updateUserManagementSchema = z.object({
    name: z.string().min(1, '用户名不能为空'),
    roles: z.array(z.string()).min(1, '角色不能为空'),
    isActive: z.boolean().optional(),
});

/**
 * 角色创建校验 Schema
 */
export const createRoleSchema = z.object({
    code: z.string()
        .min(1, '角色代码不能为空')
        .max(50, '角色代码过长')
        .regex(/^[A-Z_]+$/, '角色代码只能包含大写字母和下划线'),
    name: z.string().min(1, '角色名称不能为空').max(100, '角色名称过长'),
    description: z.string().max(500, '描述过长').optional(),
    permissions: z.array(z.string()).optional(),
});

/**
 * 角色更新校验 Schema
 */
export const updateRoleSchema = z.object({
    name: z.string().min(1, '角色名称不能为空').max(100, '角色名称过长'),
    description: z.string().max(500, '描述过长').optional(),
    permissions: z.array(z.string()).optional(),
});

/**
 * 提醒规则校验 Schema
 */
export const reminderRuleSchema = z.object({
    name: z.string().min(1, '规则名称不能为空'),
    module: z.string().min(1, '模块不能为空'),
    triggerType: z.string().min(1, '触发类型不能为空'),
    days: z.number().int('天数必须为整数').positive('天数必须为正整数'),
    isActive: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
