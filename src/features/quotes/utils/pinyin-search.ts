import { pinyin } from 'pinyin-pro';

/**
 * 拼音搜索工具函数
 * 支持中文名称的拼音首字母搜索
 */

/**
 * 获取中文字符串的拼音首字母
 * 例如：'棉麻浅灰飘窗垫' -> 'mmqhpcd'
 */
export function getPinyinInitials(text: string): string {
    if (!text) return '';
    return pinyin(text, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '').toLowerCase();
}

/**
 * 获取中文字符串的完整拼音
 * 例如：'棉麻浅灰飘窗垫' -> 'mianmaqianhuipiaochuangdian'
 */
export function getFullPinyin(text: string): string {
    if (!text) return '';
    return pinyin(text, { toneType: 'none' }).replace(/\s/g, '').toLowerCase();
}

/**
 * 检查搜索词是否匹配目标文本
 * 支持：中文匹配、拼音首字母匹配、完整拼音匹配
 */
export function matchesPinyin(text: string, query: string): boolean {
    if (!text || !query) return false;

    const normalizedQuery = query.toLowerCase().trim();
    const normalizedText = text.toLowerCase();

    // 1. 直接文本匹配（包含中文）
    if (normalizedText.includes(normalizedQuery)) {
        return true;
    }

    // 2. 拼音首字母匹配
    const initials = getPinyinInitials(text);
    if (initials.includes(normalizedQuery)) {
        return true;
    }

    // 3. 完整拼音匹配
    const fullPinyin = getFullPinyin(text);
    if (fullPinyin.includes(normalizedQuery)) {
        return true;
    }

    return false;
}

/**
 * 为商品生成搜索索引字符串
 * 包含：名称 + 拼音首字母 + SKU
 */
export function generateSearchIndex(name: string, sku?: string): string {
    const parts = [
        name,
        getPinyinInitials(name),
        getFullPinyin(name),
        sku || ''
    ];
    return parts.join(' ').toLowerCase();
}
