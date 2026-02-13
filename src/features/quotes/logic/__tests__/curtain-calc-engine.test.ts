
import { describe, it, expect, beforeEach } from 'vitest';
import { CurtainQuantityEngine, CurtainCalcInput } from '../curtain-calc-engine';

describe('CurtainQuantityEngine', () => {
    let engine: CurtainQuantityEngine;

    beforeEach(() => {
        engine = new CurtainQuantityEngine();
    });

    describe('Fixed Height Fabric (定高)', () => {
        // CE-01: Standard Fixed Height
        it('should calculate standard fixed height correctly', () => {
            const input: CurtainCalcInput = {
                measuredWidth: 300,
                measuredHeight: 250,
                foldRatio: 2.0,
                groundClearance: 2,
                headerProcessType: 'WRAPPED', // Loss: 20
                fabricDirection: 'HEIGHT',
                fabricSize: 280,
                openingStyle: 'DOUBLE',
                unitPrice: 100
            };

            const result = engine.calculate(input);

            // Finished Size
            expect(result.finishedWidth).toBe(300 * 2.0); // 600
            expect(result.finishedHeight).toBe(250 - 2); // 248

            // Cut Size
            // Side loss: 5 * 2 * 2 (Double) = 20. CutWidth = 600 + 20 = 620
            expect(result.cutWidth).toBe(620);
            // Height loss: 20 (Header) + 10 (Bottom) = 30. CutHeight = 248 + 30 = 278
            expect(result.cutHeight).toBe(278);

            // Quantity: CutWidth (cm) -> m. 620/100 = 6.2. Ceil to 1 decimal?
            // Code: Math.ceil((cutWidth / 100) * 10) / 10
            // 6.2 -> 6.2
            expect(result.quantity).toBe(6.2);

            // Amount: 6.2 * 100 = 620
            expect(result.subtotal).toBe(620.00);
            expect(result.warnings).toHaveLength(0);
        });

        // CE-02: Height Exceed Warning
        it('should warn when height exceeds fabric size', () => {
            const input: CurtainCalcInput = {
                measuredWidth: 300,
                measuredHeight: 270, // Finished: 268. Cut: 268 + 20 + 10 = 298
                foldRatio: 2.0,
                groundClearance: 2,
                headerProcessType: 'WRAPPED',
                fabricDirection: 'HEIGHT',
                fabricSize: 280, // Max Usable: 280 - 20 - 10 = 250? Wait.
                // Code check: maxFinishedHeight = fabricSize - headerLoss - settings.bottomLoss
                // 280 - 20 - 10 = 250.
                // Finished Height 268 > 250.
                openingStyle: 'DOUBLE',
                unitPrice: 100
            };

            const result = engine.calculate(input);
            expect(result.warnings).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'HEIGHT_EXCEED' })
                ])
            );
        });

        // CE-03: Process Suggestion
        it('should suggest attached header if it saves enough space', () => {
            // Target: Exceed WRAPPED limit but fit in ATTACHED limit.
            // WRAPPED Loss: 20. ATTACHED Loss: 7. Diff: 13.
            // Max Fin (Wrapped): 280 - 20 - 10 = 250.
            // Max Fin (Attached): 280 - 7 - 10 = 263.
            // Finished Height between 251 and 263 should trigger suggestion.
            // Let Finished Height = 260. Measured = 262.

            const input: CurtainCalcInput = {
                measuredWidth: 300,
                measuredHeight: 262, // Fin: 260
                foldRatio: 2.0,
                groundClearance: 2,
                headerProcessType: 'WRAPPED',
                fabricDirection: 'HEIGHT',
                fabricSize: 280,
                openingStyle: 'DOUBLE',
                unitPrice: 100
            };

            const result = engine.calculate(input);
            expect(result.warnings).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'SUGGEST_ATTACHED' })
                ])
            );
        });
    });

    describe('Fixed Width Fabric (定宽)', () => {
        // CE-04: Standard Fixed Width
        it('should calculate standard fixed width correctly', () => {
            const input: CurtainCalcInput = {
                measuredWidth: 300,
                measuredHeight: 250, // Fin: 248
                foldRatio: 2.0,
                groundClearance: 2,
                headerProcessType: 'WRAPPED',
                fabricDirection: 'WIDTH',
                fabricSize: 140,
                openingStyle: 'DOUBLE',
                unitPrice: 100
            };

            const result = engine.calculate(input);

            // Cut Width calculation
            // Base: 300 * 2.0 = 600.
            // Side Loss: 5 * 2 * 2 = 20.
            // Total Cut Width: 620.

            // Panel Count: Ceil(620 / 140) = Ceil(4.42) = 5.
            expect(result.panelCount).toBe(5);

            // Cut Height
            // 248 + 20 + 10 = 278.

            // Quantity = Panels * CutHeight = 5 * 278 = 1390 cm = 13.9 m.
            expect(result.quantity).toBe(13.9);
            expect(result.subtotal).toBe(1390.00);
        });
    });

    describe('Custom Settings', () => {
        it('should respect custom loss values', () => {
            const customEngine = new CurtainQuantityEngine({
                sideLoss: 10,
                bottomLoss: 15,
                headerLossWrapped: 25
            });

            const input: CurtainCalcInput = {
                measuredWidth: 100,
                measuredHeight: 200,
                foldRatio: 2.0,
                groundClearance: 0,
                headerProcessType: 'WRAPPED',
                fabricDirection: 'HEIGHT',
                fabricSize: 280,
                openingStyle: 'LEFT_SINGLE',
                unitPrice: 100
            };

            const result = customEngine.calculate(input);

            // Finished: 100 * 2 = 200 width, 200 height
            // CutWidth: 200 + 10 * 1 (Single) * 2 = 220
            expect(result.cutWidth).toBe(220);
            // CutHeight: 200 + 25 (Header) + 15 (Bottom) = 240
            expect(result.cutHeight).toBe(240);
        });

        it('should respect custom smallBottomThreshold', () => {
            const customEngine = new CurtainQuantityEngine({
                bottomLoss: 10,
                smallBottomThreshold: 2 // Can save up to 10 - 2 = 8cm
            });

            const input: CurtainCalcInput = {
                measuredWidth: 100,
                measuredHeight: 268, // Finished: 268. 
                // Max Fin (Wrapped): 280 - 20 - 10 = 250.
                // Max Fin (Attached): 280 - 7 - 10 = 263.
                // Since 268 > 263, it should suggest SMALL_BOTTOM.
                foldRatio: 2.0,
                groundClearance: 0,
                headerProcessType: 'ATTACHED',
                fabricDirection: 'HEIGHT',
                fabricSize: 280,
                openingStyle: 'LEFT_SINGLE',
                unitPrice: 100
            };

            const result = customEngine.calculate(input);
            expect(result.warnings).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ type: 'SUGGEST_BOTTOM_LOSS' })
                ])
            );
        });
    });
});
