
import { CurtainStrategy, CurtainCalcParams } from '../curtain-strategy';

describe('CurtainStrategy', () => {
    let strategy: CurtainStrategy;

    beforeEach(() => {
        strategy = new CurtainStrategy();
    });

    // Case 1: Fixed Height - Normal
    // W_meas=300, H_meas=250, Ratio=2.0, Width=2.8m, Price=50
    // Double Opening (Side loss 10)
    // Wrapped Header (Header loss 20, Bottom 10)
    // Calc:
    // W_finished = 300*2 = 600
    // W_cut = 600 + 10 = 610
    // H_finished = 250 - 0 = 250
    // H_cut = 250 + 20 + 10 = 280
    // FabricWidth = 280 cm.
    // H_cut (280) <= FabricWidth (280)? YES.
    // Usage = W_cut / 100 = 6.1m
    test('Calculate Fixed Height - Exact Match', () => {
        const params: CurtainCalcParams = {
            measuredWidth: 300,
            measuredHeight: 250,
            fabricWidth: 2.8,
            fabricType: 'FIXED_HEIGHT',
            unitPrice: 50,
            foldRatio: 2.0
        };
        const result = strategy.calculate(params);

        expect(result.details.cutHeight).toBe(280);
        expect(result.usage).toBe(6.1);
        expect(result.details.warning).toBeUndefined();
    });

    // Case 2: Fixed Height - Warning
    // H_meas=260 -> H_cut = 260+30 = 290. Fabric=2.8 (280).
    // Diff = 10cm. Should warn "Let header yield".
    test('Calculate Fixed Height - Warning (Header Yield)', () => {
        const params: CurtainCalcParams = {
            measuredWidth: 300,
            measuredHeight: 260,
            fabricWidth: 2.8,
            fabricType: 'FIXED_HEIGHT',
            unitPrice: 50
        };
        const result = strategy.calculate(params);

        expect(result.details.cutHeight).toBe(290);
        expect(result.details.warning).toContain('建议让渡帘头');
    });

    // Case 3: Fixed Width
    // W_meas=100, Ratio=2.0 -> W_fin=200. Side=10 -> W_cut=210.
    // FabricWidth=1.5 (150cm).
    // N = ceil(210 / 150) = 2.
    // H_meas=250 -> H_cut=280.
    // Usage = 2 * 2.8 = 5.6m.
    test('Calculate Fixed Width', () => {
        const params: CurtainCalcParams = {
            measuredWidth: 100,
            measuredHeight: 250,
            fabricWidth: 1.5,
            fabricType: 'FIXED_WIDTH',
            unitPrice: 50,
            foldRatio: 2.0
        };
        const result = strategy.calculate(params);

        expect(result.details.stripCount).toBe(2);
        expect(result.usage).toBe(5.6);
    });

    // Case 4: Single Opening Side Loss
    // W_meas=300, Ratio=2 -> 600.
    // Single Opening -> Loss=5. W_cut=605.
    test('Calculate Single Opening Loss', () => {
        const params: CurtainCalcParams = {
            measuredWidth: 300,
            measuredHeight: 250,
            fabricWidth: 2.8,
            fabricType: 'FIXED_HEIGHT',
            unitPrice: 50,
            openingType: 'SINGLE'
        };
        const result = strategy.calculate(params);

        expect(result.details.cutWidth).toBe(605);
        expect(result.usage).toBe(6.1); // ceil(6.05 * 10)/10 = 6.1
    });
});
