/**
 * 脱敏工具函数单元测试
 *
 * 覆盖范围：
 * - maskEmail：常规邮箱、短用户名、缺域名、null/undefined
 * - maskPhone：标准号码、短号码、null/undefined
 *
 * @since v1.2.5
 */
import { describe, it, expect } from 'vitest';
import { maskEmail, maskPhone } from '../mask-utils';

describe('maskEmail', () => {
  it('常规邮箱应保留前两字符并隐藏其余', () => {
    expect(maskEmail('testuser@example.com')).toBe('te***@example.com');
  });

  it('短用户名（≤2字符）应完整保留并追加掩码', () => {
    expect(maskEmail('ab@example.com')).toBe('ab***@example.com');
  });

  it('单字符用户名应完整保留', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  it('无域名分隔符时应截取前两字符加掩码', () => {
    expect(maskEmail('nodomain')).toBe('no***');
  });

  it('null 输入返回 "***"', () => {
    expect(maskEmail(null)).toBe('***');
  });

  it('undefined 输入返回 "***"', () => {
    expect(maskEmail(undefined)).toBe('***');
  });

  it('空字符串输入返回 "***"', () => {
    expect(maskEmail('')).toBe('***');
  });
});

describe('maskPhone', () => {
  it('标准 11 位手机号应保留前 3 后 4 位', () => {
    expect(maskPhone('13812345678')).toBe('138****5678');
  });

  it('短号码（<7位）应保留前 3 位加掩码', () => {
    expect(maskPhone('12345')).toBe('123****');
  });

  it('7 位号码应保留前 3 后 4 位', () => {
    expect(maskPhone('1234567')).toBe('123****4567');
  });

  it('null 输入返回 "***"', () => {
    expect(maskPhone(null)).toBe('***');
  });

  it('undefined 输入返回 "***"', () => {
    expect(maskPhone(undefined)).toBe('***');
  });

  it('空字符串输入返回 "***"', () => {
    expect(maskPhone('')).toBe('***');
  });
});
