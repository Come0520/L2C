import pinyinMatch from 'pinyin-match';

import { Lead } from '@/shared/types/lead';

/**
 * 拼音搜索工具函数
 * 
 * 支持三种匹配模式：
 * 1. 精确匹配：直接包含搜索词
 * 2. 拼音全拼匹配：如"张三"可以匹配"zhangsan"
 * 3. 拼音首字母匹配：如"张三"可以匹配"zs"
 * 
 * @param lead - 线索对象
 * @param searchTerm - 搜索关键词
 * @returns 是否匹配
 */
export function matchLeadByPinyin(lead: Lead, searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return true;
    }

    const term = searchTerm.toLowerCase().trim();

    // 1. 精确匹配：姓名、电话、地址
    if (lead.name?.toLowerCase().includes(term)) return true;
    if (lead.phone?.includes(term)) return true;
    if (lead.projectAddress?.toLowerCase().includes(term)) return true;
    if (lead.leadNumber?.toLowerCase().includes(term)) return true;

    // 2. 拼音全拼匹配
    if (lead.name && pinyinMatch.match(lead.name, term)) {
        return true;
    }

    // 3. 拼音首字母匹配
    if (lead.name && pinyinMatch.match(lead.name, term)) {
        return true;
    }

    // 4. 需求关键词匹配
    if (lead.requirements && Array.isArray(lead.requirements)) {
        const requirementsText = lead.requirements.join(' ');
        if (requirementsText.toLowerCase().includes(term)) return true;
        if (pinyinMatch.match(requirementsText, term)) return true;
    }

    return false;
}

/**
 * 批量过滤线索（客户端过滤）
 * 
 * 注意：此函数用于客户端过滤，适合小数据集（<1000条）
 * 对于大数据集，应使用后端 API 过滤
 * 
 * @param leads - 线索列表
 * @param searchTerm - 搜索关键词
 * @returns 过滤后的线索列表
 */
export function filterLeadsBySearch(leads: Lead[], searchTerm: string): Lead[] {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return leads;
    }

    return leads.filter(lead => matchLeadByPinyin(lead, searchTerm));
}

/**
 * 高亮搜索结果
 * 
 * 将匹配的文本用 <mark> 标签包裹，用于 UI 高亮显示
 * 
 * @param text - 原始文本
 * @param searchTerm - 搜索关键词
 * @returns 带高亮标记的 HTML 字符串
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
}
