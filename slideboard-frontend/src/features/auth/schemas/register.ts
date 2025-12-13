import { z } from 'zod';

// 手机号正则
const phoneRegex = /^1[3-9]\d{9}$/;

export const registerSchema = z
  .object({
    name: z.string().min(2, '姓名长度至少为2位').max(20, '姓名长度不能超过20位'),
    phone: z
      .string()
      .min(1, '请输入手机号')
      .regex(phoneRegex, '请输入有效的手机号'),
    password: z.string().min(6, '密码长度至少为6位'),
    confirmPassword: z.string().min(6, '密码长度至少为6位'),
    terms: z.boolean().refine((val) => val === true, {
      message: '请同意服务条款和隐私政策',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
