/**
 * 移动端/小程序登录速率限制
 * 使用内存 Map 实现
 * 15 分钟内最多 5 次失败尝试，按 account (电话/用户名) 维度限制
 */
const mobileLoginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkMobileLoginRateLimit(account: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = `mobile-login:${account}`;
  const record = mobileLoginAttempts.get(key);

  if (!record || now > record.resetAt) {
    mobileLoginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true };
  }

  if (record.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export function resetMobileLoginRateLimit(account: string) {
  mobileLoginAttempts.delete(`mobile-login:${account}`);
}
