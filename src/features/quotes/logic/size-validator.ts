/**
 * 尺寸合理性校验逻辑 (Size Rationality Validation)
 */

export interface SizeValidationResult {
    isValid: boolean;
    messages: string[];
}

export class SizeValidator {
    /**
     * 高度限制校验
     * 若 Height > 400cm，提示确认 "是否为复式/挑高"
     */
    static validateHeight(height: number): string | null {
        if (height > 400) {
            return "当前录入高度超过 400cm，请确认是否为复式或挑高位置？";
        }
        return null;
    }

    /**
     * 宽度限制校验
     * 若 Width > 1000cm，提示确认 "是否需分段"
     */
    static validateWidth(width: number): string | null {
        if (width > 1000) {
            return "当前录入宽度超过 1000cm，请确认是否需要进行分段设计？";
        }
        return null;
    }

    /**
     * 综合校验
     */
    static validate(width: number, height: number): SizeValidationResult {
        const messages: string[] = [];

        const hMsg = this.validateHeight(height);
        if (hMsg) messages.push(hMsg);

        const wMsg = this.validateWidth(width);
        if (wMsg) messages.push(wMsg);

        return {
            isValid: messages.length === 0,
            messages
        };
    }
}
