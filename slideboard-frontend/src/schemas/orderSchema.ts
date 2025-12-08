import { z } from 'zod'

/**
 * 订单表单验证 Schema
 */
export const orderFormSchema = z.object({
    // 客户基础信息
    leadNumber: z.string().min(1, '线索编号不能为空'),
    customerName: z.string().min(2, '客户姓名至少2个字符').max(50, '客户姓名不能超过50个字符'),
    customerPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号码'),
    projectAddress: z.string().min(1, '项目地址不能为空'),

    // 订单信息
    designer: z.string().optional(),
    salesPerson: z.string().optional(),
    expectedDeliveryTime: z.string().min(1, '请选择期望发货时间'),

    // 金额验证（用于提交时）
    totalAmount: z.number().positive('订单金额必须大于0')
})

// 导出类型
export type OrderFormValues = z.infer<typeof orderFormSchema>

/**
 * 部分字段验证（用于实时验证）
 */
export const customerPhoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号码')
export const expectedDeliveryTimeSchema = z.string().min(1, '请选择期望发货时间')
