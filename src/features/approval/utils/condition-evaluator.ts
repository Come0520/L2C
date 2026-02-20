export interface Condition {
    field: string;
    operator: string;
    value: string | number | boolean | string[];
}

/**
 * 评估节点条件是否匹配
 *
 * @param conditions - 条件表达式数组
 * @param payload - 包含业务数据的对象
 * @returns 是否所有条件都满足
 */
export function evaluateConditions(conditions: Condition[], payload: Record<string, unknown>): boolean {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

    return conditions.every(cond => {
        const value = payload[cond.field];
        if (value === undefined) return false; // 字段缺失则不匹配

        switch (cond.operator) {
            case 'eq': return value === cond.value;
            case 'ne': return value !== cond.value;
            case 'gt': return Number(value) > Number(cond.value);
            case 'lt': return Number(value) < Number(cond.value);
            case 'in': return Array.isArray(cond.value) && cond.value.includes(value as string);
            default: return true;
        }
    });
}
