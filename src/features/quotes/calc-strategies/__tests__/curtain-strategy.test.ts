import { CurtainStrategy, CurtainCalcParams } from '../curtain-strategy';

describe('CurtainStrategy', () => {
  let strategy: CurtainStrategy;

  beforeEach(() => {
    strategy = new CurtainStrategy();
  });

  // Case 1: 定高 - 双开（默认）
  // W_meas=300, H_meas=250, Ratio=2.0, 幅宽=2.8m, 单价=50
  // 双开: 单边损耗5 × 2侧边 × 2片 = 20
  // 包布带: 帘头损耗20, 底边损耗10
  // 计算:
  // W_finished = 300*2 = 600
  // W_cut = 600 + 20 = 620
  // H_finished = 250 - 0 = 250
  // H_cut = 250 + 20 + 10 = 280
  // 幅宽 = 280cm
  // H_cut (280) <= 幅宽 (280)? 是
  // 用量 = W_cut / 100 = 6.2m
  test('定高双开 - 正常计算', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 300,
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      foldRatio: 2.0,
    };
    const result = strategy.calculate(params);

    expect(result.details.cutHeight).toBe(280);
    expect(result.details.cutWidth).toBe(620);
    expect(result.usage).toBe(6.2);
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
      unitPrice: 50,
    };
    const result = strategy.calculate(params);

    expect(result.details.cutHeight).toBe(290);
    expect(result.details.warning).toContain('建议让渡帘头');
  });

  // Case 3: 定宽 - 双开
  // W_meas=100, Ratio=2.0 -> W_fin=200. 双开损耗=20 -> W_cut=220.
  // 幅宽=1.5m (150cm).
  // N = ceil(220 / 150) = 2.
  // H_meas=250 -> H_cut=280.
  // 用量 = 2 * 280 / 100 = 5.6m.
  test('定宽双开 - 幅数计算', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 100,
      measuredHeight: 250,
      fabricWidth: 1.5,
      fabricType: 'FIXED_WIDTH',
      unitPrice: 50,
      foldRatio: 2.0,
    };
    const result = strategy.calculate(params);

    expect(result.details.cutWidth).toBe(220);
    expect(result.details.stripCount).toBe(2);
    expect(result.usage).toBe(5.6);
  });

  // Case 4: 定高 - 单开
  // W_meas=300, Ratio=2 -> 600.
  // 单开: 单边损耗5 × 2侧边 × 1片 = 10. W_cut=610.
  test('定高单开 - 侧边损耗计算', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 300,
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      openingType: 'SINGLE',
    };
    const result = strategy.calculate(params);

    expect(result.details.cutWidth).toBe(610);
    expect(result.usage).toBe(6.1); // ceil(6.10 * 10)/10 = 6.1
  });

  // ─── 自定义片数测试 ───

  // Case 5: 自定义 3 片定高
  // panels=[180, 190, 200], foldRatio=2, sideLoss=5 (默认)
  // 第1片: 180×2 + 10 = 370
  // 第2片: 190×2 + 10 = 390
  // 第3片: 200×2 + 10 = 410
  // 总裁切宽度 = 1170cm
  // usage = ceil(11.70 * 10)/10 = 11.7
  test('自定义3片定高 - 累加计算', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 570, // 总宽（参考用，自定义模式不直接使用）
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      customPanels: [{ width: 180 }, { width: 190 }, { width: 200 }],
    };
    const result = strategy.calculate(params);

    expect(result.details.cutWidth).toBe(1170);
    expect(result.usage).toBe(11.7);
    expect(result.details.panelDetails).toHaveLength(3);
    expect(result.details.panelDetails![0]).toEqual({ width: 180, cutWidth: 370 });
    expect(result.details.panelDetails![1]).toEqual({ width: 190, cutWidth: 390 });
    expect(result.details.panelDetails![2]).toEqual({ width: 200, cutWidth: 410 });
  });

  // Case 6: 自定义 2 片不等大小（大小片双开）
  // panels=[180, 120], foldRatio=2, sideLoss=5
  // 第1片: 180×2+10=370, 第2片: 120×2+10=250
  // 总裁切 = 620, usage = 6.2
  test('自定义2片不等宽 - 大小片双开', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 300,
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      customPanels: [{ width: 180 }, { width: 120 }],
    };
    const result = strategy.calculate(params);

    expect(result.details.cutWidth).toBe(620);
    expect(result.usage).toBe(6.2);
    expect(result.details.panelDetails).toHaveLength(2);
  });

  // Case 7: 自定义 1 片
  // panels=[300], foldRatio=2, sideLoss=5
  // 裁切 = 300×2+10 = 610, usage = 6.1
  test('自定义1片 - 等效单开', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 300,
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      customPanels: [{ width: 300 }],
    };
    const result = strategy.calculate(params);

    expect(result.details.cutWidth).toBe(610);
    expect(result.usage).toBe(6.1);
    expect(result.details.panelDetails).toHaveLength(1);
  });

  // Case 8: 无 customPanels 走原有 DOUBLE 逻辑（回归验证）
  test('无customPanels回归 - 走标准双开逻辑', () => {
    const params: CurtainCalcParams = {
      measuredWidth: 300,
      measuredHeight: 250,
      fabricWidth: 2.8,
      fabricType: 'FIXED_HEIGHT',
      unitPrice: 50,
      foldRatio: 2.0,
      customPanels: undefined,
    };
    const result = strategy.calculate(params);

    // 标准双开: 5×2×2=20, cutWidth = 600+20 = 620
    expect(result.details.cutWidth).toBe(620);
    expect(result.usage).toBe(6.2);
    expect(result.details.panelDetails).toBeUndefined();
  });
});
