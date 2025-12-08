import { QUOTE_STATUS, QUOTE_STATUS_CONFIG } from '../quote-status';

describe('QUOTE_STATUS', () => {
  it('should have correct status values', () => {
    expect(QUOTE_STATUS.DRAFT).toBe('draft');
    expect(QUOTE_STATUS.PRELIMINARY).toBe('preliminary');
    expect(QUOTE_STATUS.REVISED).toBe('revised');
    expect(QUOTE_STATUS.CONFIRMED).toBe('confirmed');
    expect(QUOTE_STATUS.EXPIRED).toBe('expired');
    expect(QUOTE_STATUS.CANCELLED).toBe('cancelled');
  });

  it('should have all status values defined', () => {
    const statusValues = Object.values(QUOTE_STATUS);
    expect(statusValues).toHaveLength(6);
    expect(statusValues).toContain('draft');
    expect(statusValues).toContain('confirmed');
    expect(statusValues).toContain('expired');
    expect(statusValues).toContain('cancelled');
  });
});

describe('QUOTE_STATUS_CONFIG', () => {
  it('should have config for all quote statuses', () => {
    const statusValues = Object.values(QUOTE_STATUS);
    statusValues.forEach(status => {
      expect(QUOTE_STATUS_CONFIG[status]).toBeDefined();
      expect(QUOTE_STATUS_CONFIG[status].label).toBeDefined();
      expect(QUOTE_STATUS_CONFIG[status].color).toBeDefined();
      expect(QUOTE_STATUS_CONFIG[status].bgColor).toBeDefined();
      expect(QUOTE_STATUS_CONFIG[status].borderColor).toBeDefined();
    });
  });

  it('should have correct labels for all statuses', () => {
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.DRAFT].label).toBe('草稿');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.PRELIMINARY].label).toBe('初稿');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.REVISED].label).toBe('再稿');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.CONFIRMED].label).toBe('已确认');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.EXPIRED].label).toBe('已过期');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.CANCELLED].label).toBe('已取消');
  });

  it('should have correct colors for all statuses', () => {
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.DRAFT].color).toBe('#9E9E9E');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.CONFIRMED].color).toBe('#4CAF50');
    expect(QUOTE_STATUS_CONFIG[QUOTE_STATUS.EXPIRED].color).toBe('#9E9E9E');
  });
});
