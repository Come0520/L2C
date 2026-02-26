/**
 * 结构化日志工具
 */
export const logger = {
    info(tag, message, data) {
        console.log(`[${tag}] ${message}`, data || '');
    },
    warn(tag, message, data) {
        console.warn(`[${tag}] ${message}`, data || '');
    },
    error(tag, message, error) {
        console.error(`[${tag}] ${message}`, error || '');
    }
};
