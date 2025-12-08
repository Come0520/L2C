// 验证相关工具函数

/**
 * 验证手机号格式
 * @param phone - 手机号
 * @returns 是否有效
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

