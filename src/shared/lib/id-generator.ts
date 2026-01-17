
/**
 * ID Generator Utility
 * Replaces nanoid dependency with native implementation
 */

export function generateId(prefix: string = ''): string {
    const uuid = crypto.randomUUID().replace(/-/g, '');
    return prefix ? `${prefix}_${uuid}` : uuid;
}

export function generateShortId(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}
