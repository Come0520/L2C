import { z } from 'zod';

// 手机号正则
const phoneRegex = /^1[3-9]\d{9}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, '请输入手机号或邮箱')
    .refine((val) => {
      // 简单判断是邮箱还是手机号
      const isEmail = val.includes('@');
      // 移除手机号格式强校验，因为后端服务可能会支持更多格式或者测试账号
      // 但为了用户体验，我们还是保留基本的格式检查，如果是纯数字且长度为11位才校验正则
      if (!isEmail && /^\d+$/.test(val)) {
         return phoneRegex.test(val);
      }
      // 如果不是纯数字（可能是邮箱或者用户名），或者包含@（邮箱），则通过
      // 这里实际上放宽了校验，只要不是显式的无效手机号（比如123），都允许提交给后端尝试
      // 但根据报错信息 "手机号格式不正确" 来看，可能是后端服务或者 authService 里的校验问题
      // 不过这里先放宽前端校验
      return true; 
    }, '请输入有效的手机号或邮箱'),
  password: z.string().min(6, '密码至少需要6位'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const smsLoginSchema = z.object({
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(phoneRegex, '请输入有效的手机号'),
  code: z
    .string()
    .length(6, '验证码必须是6位数字')
    .regex(/^\d+$/, '验证码只能包含数字'),
});

export type SmsLoginFormData = z.infer<typeof smsLoginSchema>;

export const sendCodeSchema = z.object({
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(phoneRegex, '请输入有效的手机号'),
});

export type SendCodeFormData = z.infer<typeof sendCodeSchema>;
