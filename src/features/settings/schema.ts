import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

/**
 * 用户创建校验 Schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').describe('姓名'),
  phone: z
    .string()
    .refine((val) => isValidPhoneNumber(val, 'CN'), { message: '请输入有效的电话号码' })
    .describe('手机号码'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')).describe('电子邮件地址'),
  password: z.string().min(8, '密码长度不能少于 8 位').optional().describe('账户密码'),
  role: z.string().min(1, '角色不能为空').describe('账户角色'),
});

/**
 * 用户详情更新校验 Schema (用于基础信息)
 */
export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid('无效的用户 ID').describe('用户的唯一标识ID'),
});

/**
 * 用户管理更新校验 Schema (用于管理员修改用户)
 */
export const updateUserManagementSchema = z.object({
  name: z.string().min(1, '用户名不能为空').describe('姓名'),
  roles: z.array(z.string()).min(1, '角色不能为空').describe('分配的角色列表'),
  isActive: z.boolean().optional().describe('账户是否处于启用状态'),
});

/**
 * 角色创建校验 Schema
 */
export const createRoleSchema = z.object({
  code: z
    .string()
    .min(1, '角色代码不能为空')
    .max(50, '角色代码过长')
    .regex(/^[A-Z_]+$/, '角色代码只能包含大写字母和下划线')
    .describe('角色的唯一系统代码'),
  name: z.string().min(1, '角色名称不能为空').max(100, '角色名称过长').describe('角色显示名称'),
  description: z.string().max(500, '描述过长').optional().describe('角色的功能描述'),
  permissions: z.array(z.string()).optional().describe('该角色下的权限列表'),
});

/**
 * 角色更新校验 Schema
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(100, '角色名称过长').describe('角色显示名称'),
  description: z.string().max(500, '描述过长').optional().describe('角色的功能描述'),
  permissions: z.array(z.string()).optional().describe('该角色下的权限列表'),
});

/**
 * 提醒规则校验 Schema
 */
export const reminderRuleSchema = z.object({
  name: z.string().min(1, '规则名称不能为空').describe('提醒规则的名称'),
  module: z.string().min(1, '模块不能为空').describe('所属的业务模块'),
  triggerType: z.string().min(1, '触发类型不能为空').describe('规则的具体触发类型'),
  days: z.number().int('天数必须为整数').positive('天数必须为正整数').describe('触发的天数阈值'),
  isActive: z.boolean().describe('提醒规则是否启用'),
  createdAt: z.string().optional().describe('创建日期'),
  updatedAt: z.string().optional().describe('更新日期'),
});
