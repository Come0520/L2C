export interface CurtainCalcInput {
    measuredWidth: number;
    measuredHeight: number;
    foldRatio: number;
    groundClearance: number;
    headerProcessType: 'WRAPPED' | 'ATTACHED' | 'NONE';
    fabricDirection: 'HEIGHT' | 'WIDTH';
    fabricSize: number;
    openingStyle: 'SINGLE' | 'DOUBLE';
    unitPrice: number;
}

export interface CurtainCalcResult {
    finishedWidth: number;
    finishedHeight: number;
    cutWidth: number;
    cutHeight: number;
    quantity: number;
    subtotal: number;
    panelCount?: number;
    warnings: Array<{ type: string; message?: string }>;
}

export interface CurtainCalcSettings {
    sideLoss: number;
    headerLoss: Record<string, number>;
    bottomLoss: number;
    smallBottomThreshold: number;
    headerLossWrapped?: number;
}

export const DEFAULT_CURTAIN_CALC_SETTINGS: CurtainCalcSettings = {
    sideLoss: 5,
    headerLoss: {
        WRAPPED: 20,
        ATTACHED: 7,
        NONE: 0
    },
    bottomLoss: 10,
    smallBottomThreshold: 3
};

export class CurtainQuantityEngine {
    private settings: CurtainCalcSettings;

    constructor(customSettings?: Partial<CurtainCalcSettings>) {
        const baseSettings = {
            sideLoss: 5,
            headerLoss: {
                WRAPPED: 20,
                ATTACHED: 7,
                NONE: 0
            },
            bottomLoss: 10,
            smallBottomThreshold: 3
        };
        
        if (customSettings?.headerLossWrapped !== undefined) {
            baseSettings.headerLoss.WRAPPED = customSettings.headerLossWrapped;
            delete customSettings.headerLossWrapped;
        }
        
        this.settings = {
            ...baseSettings,
            ...customSettings
        };
    }

    calculate(input: CurtainCalcInput): CurtainCalcResult {
        const {
            measuredWidth,
            measuredHeight,
            foldRatio,
            groundClearance,
            headerProcessType,
            fabricDirection,
            fabricSize,
            openingStyle,
            unitPrice
        } = input;

        const warnings: Array<{ type: string; message?: string }> = [];

        const finishedWidth = measuredWidth * foldRatio;
        const finishedHeight = measuredHeight - groundClearance;

        const headerLoss = this.settings.headerLoss[headerProcessType] || 0;
        const sideLossTotal = this.settings.sideLoss * 2 * (openingStyle === 'DOUBLE' ? 2 : 1);

        const cutWidth = finishedWidth + sideLossTotal;
        const cutHeight = finishedHeight + headerLoss + this.settings.bottomLoss;

        const quantity = Math.ceil((cutWidth / 100) * 10) / 10;
        const subtotal = quantity * unitPrice;
        
        let panelCount: number | undefined;
        
        if (fabricDirection === 'WIDTH') {
            panelCount = Math.ceil(cutWidth / fabricSize);
            // For WIDTH direction, quantity is calculated differently
            const quantityInMeters = (panelCount * cutHeight) / 100;
            return {
                finishedWidth,
                finishedHeight,
                cutWidth,
                cutHeight,
                quantity: quantityInMeters,
                subtotal: quantityInMeters * unitPrice,
                panelCount,
                warnings
            };
        }

        if (fabricDirection === 'HEIGHT') {
            const maxFinishedHeight = fabricSize - headerLoss - this.settings.bottomLoss;
            if (finishedHeight > maxFinishedHeight) {
                let hasSolution = false;

                if (headerProcessType === 'WRAPPED') {
                    const attachedMaxHeight = fabricSize - this.settings.headerLoss.ATTACHED - this.settings.bottomLoss;
                    if (finishedHeight <= attachedMaxHeight) {
                        warnings.push({
                            type: 'SUGGEST_ATTACHED',
                            message: `建议使用连体帘头可节省 ${headerLoss - this.settings.headerLoss.ATTACHED}mm`
                        });
                        hasSolution = true;
                    }
                }
                
                // Only suggest bottom loss reduction if we haven't already suggested switching to ATTACHED
                // or if we're already using ATTACHED
                if (!hasSolution) {
                    const potentialBottomLoss = this.settings.smallBottomThreshold;
                    const currentHeaderLoss = headerProcessType === 'WRAPPED' ? this.settings.headerLoss.WRAPPED : this.settings.headerLoss.ATTACHED;
                    const potentialMaxHeight = fabricSize - currentHeaderLoss - potentialBottomLoss;
                    if (finishedHeight <= potentialMaxHeight) {
                        warnings.push({
                            type: 'SUGGEST_BOTTOM_LOSS',
                            message: `建议减小下摆损耗至 ${potentialBottomLoss}mm 可节省 ${this.settings.bottomLoss - potentialBottomLoss}mm`
                        });
                        hasSolution = true;
                    }
                }
                
                // Only add HEIGHT_EXCEED warning if we don't have a solution
                if (!hasSolution) {
                    warnings.push({
                        type: 'HEIGHT_EXCEED',
                        message: `成品高度 ${finishedHeight}mm 超过面料最大可用高度 ${maxFinishedHeight}mm`
                    });
                }
            }
        }

        if (finishedHeight < this.settings.smallBottomThreshold) {
            warnings.push({
                type: 'SMALL_HEIGHT',
                message: `成品高度 ${finishedHeight}mm 小于 ${this.settings.smallBottomThreshold}mm`
            });
        }

        return {
            finishedWidth,
            finishedHeight,
            cutWidth,
            cutHeight,
            quantity,
            subtotal,
            panelCount,
            warnings
        };
    }
}

export class CurtainCalcEngine {
    calculate(params: any) {
        console.log('Mock CurtainCalcEngine.calculate called');
        return { quantity: 1, amount: 0 };
    }
}