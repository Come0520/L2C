/**
 * 邮箱脱敏处理
 * @param email 原始邮箱地址
 * @returns 脱敏后的邮箱 (如: te***@example.com)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  if (!domain) return email.substring(0, 2) + '***';
  if (local.length <= 2) return local + '***@' + domain;
  return local.substring(0, 2) + '***@' + domain;
}

/**
 * 手机号脱敏处理
 * @param phone 原始手机号
 * @returns 脱敏后的手机号 (如: 138****8888)
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***';
  if (phone.length < 7) return phone.substring(0, 3) + '****';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}
