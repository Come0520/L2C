import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_TRANSITIONS, MEASUREMENT_STATUS_CONFIG, MEASUREMENT_STATUS_PERMISSIONS } from '../measurement-status';

describe('MEASUREMENT_STATUS', () => {
  it('should have correct status values', () => {
    expect(MEASUREMENT_STATUS.PENDING_MEASUREMENT).toBe('pending_measurement');
    expect(MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT).toBe('measuring_pending_assignment');
    expect(MEASUREMENT_STATUS.MEASURING_ASSIGNING).toBe('measuring_assigning');
    expect(MEASUREMENT_STATUS.MEASURING_PENDING_VISIT).toBe('measuring_pending_visit');
    expect(MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION).toBe('measuring_pending_confirmation');
    expect(MEASUREMENT_STATUS.COMPLETED).toBe('completed');
    expect(MEASUREMENT_STATUS.CANCELLED).toBe('cancelled');
  });

  it('should have all status values defined', () => {
    const statusValues = Object.values(MEASUREMENT_STATUS);
    expect(statusValues).toHaveLength(7);
    expect(statusValues).toContain('pending_measurement');
    expect(statusValues).toContain('completed');
    expect(statusValues).toContain('cancelled');
  });
});

describe('MEASUREMENT_STATUS_CONFIG', () => {
  it('should have config for all measurement statuses', () => {
    const statusValues = Object.values(MEASUREMENT_STATUS);
    statusValues.forEach(status => {
      expect(MEASUREMENT_STATUS_CONFIG[status]).toBeDefined();
      expect(MEASUREMENT_STATUS_CONFIG[status].label).toBeDefined();
      expect(MEASUREMENT_STATUS_CONFIG[status].color).toBeDefined();
      expect(MEASUREMENT_STATUS_CONFIG[status].bgColor).toBeDefined();
      expect(MEASUREMENT_STATUS_CONFIG[status].borderColor).toBeDefined();
      expect(MEASUREMENT_STATUS_CONFIG[status].order).toBeDefined();
    });
  });

  it('should have correct labels for all statuses', () => {
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.PENDING_MEASUREMENT].label).toBe('待测量');
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].label).toBe('测量中-待上门');
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.COMPLETED].label).toBe('已完成');
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.CANCELLED].label).toBe('已取消');
  });

  it('should have correct order for all statuses', () => {
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.PENDING_MEASUREMENT].order).toBe(1);
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT].order).toBe(2);
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.COMPLETED].order).toBe(6);
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.CANCELLED].order).toBe(7);
  });

  it('should have timeLimit and reminderTime for specific statuses', () => {
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].timeLimit).toBeDefined();
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].reminderTime).toBeDefined();
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].timeLimit).toBeDefined();
    expect(MEASUREMENT_STATUS_CONFIG[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].reminderTime).toBeDefined();
  });
});

describe('MEASUREMENT_STATUS_TRANSITIONS', () => {
  it('should allow valid transitions from pending_measurement', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.PENDING_MEASUREMENT];
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT);
    expect(transitions).toContain(MEASUREMENT_STATUS.COMPLETED);
    expect(transitions).toContain(MEASUREMENT_STATUS.CANCELLED);
    expect(transitions).not.toContain(MEASUREMENT_STATUS.MEASURING_ASSIGNING);
    expect(transitions).not.toContain(MEASUREMENT_STATUS.MEASURING_PENDING_VISIT);
  });

  it('should allow valid transitions from measuring_pending_assignment', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT];
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_ASSIGNING);
    expect(transitions).toContain(MEASUREMENT_STATUS.CANCELLED);
    expect(transitions).not.toContain(MEASUREMENT_STATUS.COMPLETED);
  });

  it('should allow valid transitions from measuring_assigning', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.MEASURING_ASSIGNING];
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_PENDING_VISIT);
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT);
    expect(transitions).toContain(MEASUREMENT_STATUS.CANCELLED);
    expect(transitions).not.toContain(MEASUREMENT_STATUS.COMPLETED);
  });

  it('should allow valid transitions from measuring_pending_visit', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT];
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION);
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_ASSIGNING);
    expect(transitions).toContain(MEASUREMENT_STATUS.CANCELLED);
    expect(transitions).not.toContain(MEASUREMENT_STATUS.COMPLETED);
  });

  it('should allow valid transitions from measuring_pending_confirmation', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION];
    expect(transitions).toContain(MEASUREMENT_STATUS.COMPLETED);
    expect(transitions).toContain(MEASUREMENT_STATUS.MEASURING_PENDING_VISIT);
    expect(transitions).toContain(MEASUREMENT_STATUS.CANCELLED);
  });

  it('should not allow any transitions from completed', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.COMPLETED];
    expect(transitions).toEqual([]);
  });

  it('should not allow any transitions from cancelled', () => {
    const transitions = MEASUREMENT_STATUS_TRANSITIONS[MEASUREMENT_STATUS.CANCELLED];
    expect(transitions).toEqual([]);
  });

  it('should have transitions defined for all statuses', () => {
    const statusValues = Object.values(MEASUREMENT_STATUS);
    statusValues.forEach(status => {
      expect(MEASUREMENT_STATUS_TRANSITIONS[status]).toBeDefined();
    });
  });
});

describe('MEASUREMENT_STATUS_PERMISSIONS', () => {
  it('should have permissions for measuring_pending_visit', () => {
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT]).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].canComplete).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].canUpdateStatus).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].canView).toBeDefined();
  });

  it('should have permissions for measuring_pending_confirmation', () => {
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION]).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canConfirm).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canReject).toBeDefined();
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canView).toBeDefined();
  });

  it('should have correct roles defined for permissions', () => {
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_VISIT].canComplete).toContain('SERVICE_MEASURE');
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canConfirm).toContain('SALES_STORE');
    expect(MEASUREMENT_STATUS_PERMISSIONS[MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION].canReject).toContain('SALES_REMOTE');
  });
});
