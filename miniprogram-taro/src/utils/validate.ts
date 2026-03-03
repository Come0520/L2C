/**
 * 前端表单校验工具
 */

/** 校验 11 位中国手机号 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false
    return /^1[3-9]\d{9}$/.test(phone.trim())
}

/** 非空校验（trim 后） */
export function isNotEmpty(value: string | undefined | null): boolean {
    if (value === undefined || value === null) return false
    return value.trim().length > 0
}

/** 长度校验 */
export function isValidLength(value: string | undefined | null, min: number, max: number): boolean {
    if (value === undefined || value === null) return false
    const len = value.trim().length
    return len >= min && len <= max
}

/** 校验邮箱格式 */
export function isValidEmail(email: string | undefined | null): boolean {
    if (email === undefined || email === null) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
