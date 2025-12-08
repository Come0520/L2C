import { MEASUREMENT_ORDER_STATUS, MEASUREMENT_ORDER_STATUS_CONFIG } from '../measurement-order-status';

describe('MEASUREMENT_ORDER_STATUS', () => {
  it('should have correct status values', () => {
    expect(MEASUREMENT_ORDER_STATUS.PENDING).toBe('pending');
    expect(MEASUREMENT_ORDER_STATUS.SCHEDULED).toBe('scheduled');
    expect(MEASUREMENT_ORDER_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(MEASUREMENT_ORDER_STATUS.COMPLETED).toBe('completed');
    expect(MEASUREMENT_ORDER_STATUS.REJECTED).toBe('rejected');
    expect(MEASUREMENT_ORDER_STATUS.CANCELLED).toBe('cancelled');
  });

  it('should have all status values defined', () => {
    const statusValues = Object.values(MEASUREMENT_ORDER_STATUS);
    expect(statusValues).toHaveLength(6);
    expect(statusValues).toContain('pending');
    expect(statusValues).toContain('completed');
    expect(statusValues).toContain('cancelled');
  });
});

describe('MEASUREMENT_ORDER_STATUS_CONFIG', () => {
  it('should have config for all measurement order statuses', () => {
    const statusValues = Object.values(MEASUREMENT_ORDER_STATUS);
    statusValues.forEach(status => {
      expect(MEASUREMENT_ORDER_STATUS_CONFIG[status]).toBeDefined();
      expect(MEASUREMENT_ORDER_STATUS_CONFIG[status].label).toBeDefined();
      expect(MEASUREMENT_ORDER_STATUS_CONFIG[status].color).toBeDefined();
      expect(MEASUREMENT_ORDER_STATUS_CONFIG[status].bgColor).toBeDefined();
      expect(MEASUREMENT_ORDER_STATUS_CONFIG[status].borderColor).toBeDefined();
    });
  });

  it('should have correct labels for all statuses', () => {
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.PENDING].label).toBe('待安排');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.SCHEDULED].label).toBe('已排期');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.IN_PROGRESS].label).toBe('测量中');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.COMPLETED].label).toBe('已完成');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.REJECTED].label).toBe('已驳回');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.CANCELLED].label).toBe('已取消');
  });

  it('should have correct colors for all statuses', () => {
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.PENDING].color).toBe('#9E9E9E');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.COMPLETED].color).toBe('#4CAF50');
    expect(MEASUREMENT_ORDER_STATUS_CONFIG[MEASUREMENT_ORDER_STATUS.REJECTED].color).toBe('#F44336');
  });
});
