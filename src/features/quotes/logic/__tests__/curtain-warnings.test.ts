import { describe, it, expect } from 'vitest';
import { CurtainQuantityEngine, DEFAULT_CURTAIN_CALC_SETTINGS, CurtainCalcInput } from '../curtain-calc-engine';

describe('CurtainQuantityEngine - Warnings', () => {
    const engine = new CurtainQuantityEngine(DEFAULT_CURTAIN_CALC_SETTINGS);

    const baseInput: CurtainCalcInput = {
        measuredWidth: 300,
        measuredHeight: 200,
        foldRatio: 2,
        groundClearance: 0, // Simplified for testing finishedHeight
        headerProcessType: 'WRAPPED',
        fabricDirection: 'HEIGHT',
        fabricSize: 280,
        openingStyle: 'DOUBLE',
        unitPrice: 100,
    };

    it('should return no warnings for normal height', () => {
        const input = { ...baseInput, measuredHeight: 240 }; // Finished 240 < 250 (280-20-10)
        const result = engine.calculate(input);
        expect(result.warnings).toHaveLength(0);
    });

    it('should suggest switching to ATTACHED when height exceeds WRAPPED limit but fits ATTACHED', () => {
        // WRAPPED Max: 280 - 20 - 10 = 250
        // ATTACHED Max: 280 - 7 - 10 = 263
        // Input: 260
        const input: CurtainCalcInput = {
            ...baseInput,
            measuredHeight: 260,
            headerProcessType: 'WRAPPED'
        };
        const result = engine.calculate(input);

        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].type).toBe('SUGGEST_ATTACHED');
    });

    it('should suggest SMALL_BOTTOM when height exceeds limit but fits within small bottom saving', () => {
        // ATTACHED Max: 263.
        // Small Bottom Saving: 10 - 3 = 7.
        // Max with Small Bottom: 263 + 7 = 270.
        // Input: 268.
        const input: CurtainCalcInput = {
            ...baseInput,
            measuredHeight: 268,
            headerProcessType: 'ATTACHED' // Use ATTACHED so it doesn't suggest switching first
        };
        const result = engine.calculate(input);

        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].type).toBe('SUGGEST_BOTTOM_LOSS');
    });

    it('should return HEIGHT_EXCEED when height is too high even with optimizations', () => {
        // Max with optimizations: 270.
        // Input: 280.
        const input: CurtainCalcInput = {
            ...baseInput,
            measuredHeight: 280,
            headerProcessType: 'ATTACHED'
        };
        const result = engine.calculate(input);

        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].type).toBe('HEIGHT_EXCEED');
    });
});
