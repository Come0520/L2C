import { DimensionLimits } from '@/services/quote-config.service';

/**
 * 尺寸校验结果 (Dimension Validation Result)
 */
export interface DimensionValidationResult {
    /** 是否通过校验 */
    valid: boolean;
    /** 错误类型: 'error' 表示超过硬限制，'warning' 表示超过警告阈值 */
    type: 'error' | 'warning' | null;
    /** 提示消息 */
    message: string | null;
    /** 受影响的字段 */
    field: 'height' | 'width' | null;
}

/**
 * 校验尺寸是否在合理范围内 (Validate Dimension Limits)
 * 
 * @param height - 高度 (cm)
 * @param width - 宽度 (cm)
 * @param limits - 尺寸限制配置
 * @returns 校验结果对象
 */
export function validateDimensions(
    height: number,
    width: number,
    limits: DimensionLimits
): DimensionValidationResult {
    // 如果未启用校验，直接返回通过
    if (!limits.enabled) {
        return { valid: true, type: null, message: null, field: null };
    }

    // 1. 检查硬限制 - 高度
    if (height > limits.heightMax) {
        return {
            valid: false,
            type: 'error',
            message: `高度 ${height}cm 超过系统最大限制 ${limits.heightMax}cm，无法提交`,
            field: 'height'
        };
    }

    // 2. 检查硬限制 - 宽度
    if (width > limits.widthMax) {
        return {
            valid: false,
            type: 'error',
            message: `宽度 ${width}cm 超过系统最大限制 ${limits.widthMax}cm，无法提交`,
            field: 'width'
        };
    }

    // 3. 检查警告阈值 - 高度（复式/挑高场景）
    if (height > limits.heightWarning) {
        return {
            valid: true, // 警告不阻止提交
            type: 'warning',
            message: `高度 ${height}cm 超过 ${limits.heightWarning}cm，请确认是否为复式/挑高空间`,
            field: 'height'
        };
    }

    // 4. 检查警告阈值 - 宽度（需分段场景）
    if (width > limits.widthWarning) {
        return {
            valid: true, // 警告不阻止提交
            type: 'warning',
            message: `宽度 ${width}cm 超过 ${limits.widthWarning}cm，请确认是否需要分段处理`,
            field: 'width'
        };
    }

    // 全部通过
    return { valid: true, type: null, message: null, field: null };
}

/**
 * 获取高度校验状态 (Get Height Validation Status)
 * 用于前端实时校验
 */
export function getHeightStatus(
    height: number,
    limits: DimensionLimits
): { status: 'ok' | 'warning' | 'error'; message: string | null } {
    if (!limits.enabled || height <= 0) {
        return { status: 'ok', message: null };
    }

    if (height > limits.heightMax) {
        return {
            status: 'error',
            message: `超过最大限制 ${limits.heightMax}cm`
        };
    }

    if (height > limits.heightWarning) {
        return {
            status: 'warning',
            message: `是否为复式/挑高空间？`
        };
    }

    return { status: 'ok', message: null };
}

/**
 * 获取宽度校验状态 (Get Width Validation Status)
 * 用于前端实时校验
 */
export function getWidthStatus(
    width: number,
    limits: DimensionLimits
): { status: 'ok' | 'warning' | 'error'; message: string | null } {
    if (!limits.enabled || width <= 0) {
        return { status: 'ok', message: null };
    }

    if (width > limits.widthMax) {
        return {
            status: 'error',
            message: `超过最大限制 ${limits.widthMax}cm`
        };
    }

    if (width > limits.widthWarning) {
        return {
            status: 'warning',
            message: `是否需要分段处理？`
        };
    }

    return { status: 'ok', message: null };
}
