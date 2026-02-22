/**
 * PC 端登录速率限制
 * 使用内存 Map 实现（与移动端 withRateLimit 类似机制）
 * 5 分钟内最多 10 次失败尝试，按 username 维度限制
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(username: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = `pc-login:${username}`;
    const record = loginAttempts.get(key);

    if (!record || now > record.resetAt) {
        loginAttempts.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
        return { allowed: true };
    }

    if (record.count >= 10) {
        return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
    }

    record.count++;
    return { allowed: true };
}

export function resetLoginRateLimit(username: string) {
    loginAttempts.delete(`pc-login:${username}`);
}
