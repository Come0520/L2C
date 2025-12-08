import { RECONCILIATION_ORDER_STATUS, RECONCILIATION_ORDER_STATUS_CONFIG } from '../reconciliation-order-status';

describe('RECONCILIATION_ORDER_STATUS', () => {
  it('should have correct status values', () => {
    expect(RECONCILIATION_ORDER_STATUS.PENDING).toBe('pending');
    expect(RECONCILIATION_ORDER_STATUS.RECONCILING).toBe('reconciling');
    expect(RECONCILIATION_ORDER_STATUS.COMPLETED).toBe('completed');
    expect(RECONCILIATION_ORDER_STATUS.DISCREPANCY).toBe('discrepancy');
    expect(RECONCILIATION_ORDER_STATUS.ADJUSTED).toBe('adjusted');
    expect(RECONCILIATION_ORDER_STATUS.CANCELLED).toBe('cancelled');
  });

  it('should have all status values defined', () => {
    const statusValues = Object.values(RECONCILIATION_ORDER_STATUS);
    expect(statusValues).toHaveLength(6);
    expect(statusValues).toContain('pending');
    expect(statusValues).toContain('reconciling');
    expect(statusValues).toContain('completed');
    expect(statusValues).toContain('cancelled');
  });
});

describe('RECONCILIATION_ORDER_STATUS_CONFIG', () => {
  it('should have config for all reconciliation order statuses', () => {
    const statusValues = Object.values(RECONCILIATION_ORDER_STATUS);
    statusValues.forEach(status => {
      expect(RECONCILIATION_ORDER_STATUS_CONFIG[status]).toBeDefined();
      expect(RECONCILIATION_ORDER_STATUS_CONFIG[status].label).toBeDefined();
      expect(RECONCILIATION_ORDER_STATUS_CONFIG[status].color).toBeDefined();
      expect(RECONCILIATION_ORDER_STATUS_CONFIG[status].bgColor).toBeDefined();
      expect(RECONCILIATION_ORDER_STATUS_CONFIG[status].borderColor).toBeDefined();
    });
  });

  it('should have correct labels for all statuses', () => {
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.PENDING].label).toBe('待对账');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.RECONCILING].label).toBe('对账中');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.COMPLETED].label).toBe('已完成');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.DISCREPANCY].label).toBe('有差异');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.ADJUSTED].label).toBe('已调整');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.CANCELLED].label).toBe('已取消');
  });

  it('should have correct colors for all statuses', () => {
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.PENDING].color).toBe('#9E9E9E');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.COMPLETED].color).toBe('#4CAF50');
    expect(RECONCILIATION_ORDER_STATUS_CONFIG[RECONCILIATION_ORDER_STATUS.DISCREPANCY].color).toBe('#FF9800');
  });
});
