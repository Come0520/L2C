import { z } from 'zod';

// 邮箱正则
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const registerSchema = z
  .object({
    name: z.string().min(2, '姓名长度至少为2位').max(20, '姓名长度不能超过20位'),
    email: z
      .string()
      .min(1, '请输入邮箱')
      .regex(emailRegex, '请输入有效的邮箱'),
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
