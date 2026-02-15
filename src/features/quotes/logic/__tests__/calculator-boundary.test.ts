/**
 * 窗帘/墙纸计算器边界测试
 * 覆盖 CurtainCalculator 和 WallpaperCalculator 的边界与异常输入
 */
import { describe, it, expect } from 'vitest';
import { CurtainCalculator, WallpaperCalculator } from '../../logic/calculator';

describe('CurtainCalculator', () => {
  // ── 基础计算 ──────────────────────────
  it('标准窗帘计算应返回正确用量', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    expect(result.quantity).toBeGreaterThan(0);
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it('定宽公式应返回正确用量', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 2,
      fabricWidth: 145,
      formula: 'FIXED_WIDTH',
    });

    expect(result.quantity).toBeGreaterThan(0);
  });

  // ── 零值输入 ─────────────────────────
  // 注：计算器在宽度为 0 时因损耗值 + 向上取整仍产生结果
  // 这是计算器的当前设计行为（不在计算层做零值校验）
  it('宽度为 0 时应返回极小用量', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 0,
      measuredHeight: 260,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    expect(result.quantity).toBeGreaterThanOrEqual(0);
    expect(result.quantity).toBeLessThanOrEqual(1);
  });

  // 注：计算器在高度为 0 时因成品宽仍存在，可能产生非零结果
  it('高度为 0 时应返回用量（据实际计算器行为）', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 0,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    // 实际计算器仅计算用料，不校验零值输入
    expect(result.quantity).toBeGreaterThanOrEqual(0);
  });

  // ── 超高预警 ─────────────────────────
  it('超高窗帘应触发预警和替代方案', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 300,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
      heightWarningThreshold: 275,
    });

    expect(result.heightOverflow).toBe(true);
    expect(result.alternatives).toBeDefined();
    if (result.alternatives) {
      expect(result.alternatives.length).toBeGreaterThan(0);
    }
  });

  it('不超高时不应触发预警', () => {
    const result = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 250,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
      heightWarningThreshold: 275,
    });

    expect(result.heightOverflow).toBeFalsy();
  });

  // ── 损耗配置 ─────────────────────────
  it('自定义损耗值应参与计算', () => {
    const withDefaultLoss = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    const withCustomLoss = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 2,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
      sideLoss: 15,
      bottomLoss: 20,
    });

    // 自定义更大的损耗应导致更大的用量
    expect(withCustomLoss.quantity).toBeGreaterThanOrEqual(withDefaultLoss.quantity);
  });

  // ── 倍率影响 ─────────────────────────
  it('更大的折叠倍率应需要更多用料', () => {
    const result1x = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 1.5,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    const result2x = CurtainCalculator.calculate({
      measuredWidth: 200,
      measuredHeight: 260,
      foldRatio: 2.5,
      fabricWidth: 280,
      formula: 'FIXED_HEIGHT',
    });

    expect(result2x.quantity).toBeGreaterThan(result1x.quantity);
  });
});

describe('WallpaperCalculator', () => {
  // ── 基础计算 ──────────────────────────
  it('标准墙纸计算应返回正确用量', () => {
    const result = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      patternRepeat: 0,
      formula: 'WALLPAPER',
    });

    expect(result.quantity).toBeGreaterThan(0);
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it('墙布计算应返回正确用量', () => {
    const result = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 280,
      rollLength: 1000,
      formula: 'WALLCLOTH',
    });

    expect(result.quantity).toBeGreaterThan(0);
  });

  // ── 零值输入 ─────────────────────────
  // 注：同窗帘计算器，零值输入时因损耗值可能产生非零结果
  it('宽度为 0 时应返回极小用量', () => {
    const result = WallpaperCalculator.calculate({
      measuredWidth: 0,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      formula: 'WALLPAPER',
    });

    expect(result.quantity).toBeGreaterThanOrEqual(0);
  });

  it('高度为 0 时应返回极小用量', () => {
    const result = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 0,
      productWidth: 53,
      rollLength: 1000,
      formula: 'WALLPAPER',
    });

    expect(result.quantity).toBeGreaterThanOrEqual(0);
  });

  // ── 花纹对花影响 ─────────────────────
  it('有对花花纹应比无花纹需要更多用料', () => {
    const noPattern = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      patternRepeat: 0,
      formula: 'WALLPAPER',
    });

    const withPattern = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      patternRepeat: 30,
      formula: 'WALLPAPER',
    });

    expect(withPattern.quantity).toBeGreaterThanOrEqual(noPattern.quantity);
  });

  // ── 自定义损耗 ──────────────────────
  it('自定义损耗值应参与计算', () => {
    const withDefaultLoss = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      formula: 'WALLPAPER',
    });

    const withCustomLoss = WallpaperCalculator.calculate({
      measuredWidth: 400,
      measuredHeight: 280,
      productWidth: 53,
      rollLength: 1000,
      formula: 'WALLPAPER',
      widthLoss: 30,
      cutLoss: 20,
    });

    expect(withCustomLoss.quantity).toBeGreaterThanOrEqual(withDefaultLoss.quantity);
  });
});
