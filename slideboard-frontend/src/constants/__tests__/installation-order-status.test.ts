import { INSTALLATION_STATUS, INSTALLATION_STATUS_CONFIG, installationTypeMap, acceptanceStatusMap, INSTALLATION_STATUS_TRANSITIONS } from '../installation-order-status';

describe('INSTALLATION_STATUS', () => {
  it('should have correct status values', () => {
    expect(INSTALLATION_STATUS.PENDING).toBe('pending');
    expect(INSTALLATION_STATUS.ASSIGNING).toBe('assigning');
    expect(INSTALLATION_STATUS.WAITING).toBe('waiting');
    expect(INSTALLATION_STATUS.INSTALLING).toBe('installing');
    expect(INSTALLATION_STATUS.CONFIRMING).toBe('confirming');
    expect(INSTALLATION_STATUS.COMPLETED).toBe('completed');
    expect(INSTALLATION_STATUS.CANCELLED).toBe('cancelled');
    expect(INSTALLATION_STATUS.REWORK).toBe('rework');
  });

  it('should have all status values defined', () => {
    const statusValues = Object.values(INSTALLATION_STATUS);
    expect(statusValues).toHaveLength(8);
  });
});

describe('INSTALLATION_STATUS_CONFIG', () => {
  it('should have config for all installation statuses', () => {
    const statusValues = Object.values(INSTALLATION_STATUS);
    statusValues.forEach(status => {
      expect(INSTALLATION_STATUS_CONFIG[status]).toBeDefined();
      expect(INSTALLATION_STATUS_CONFIG[status].label).toBeDefined();
      expect(INSTALLATION_STATUS_CONFIG[status].bgColor).toBeDefined();
      expect(INSTALLATION_STATUS_CONFIG[status].textColor).toBeDefined();
      expect(INSTALLATION_STATUS_CONFIG[status].borderColor).toBeDefined();
    });
  });

  it('should have correct labels for all statuses', () => {
    expect(INSTALLATION_STATUS_CONFIG[INSTALLATION_STATUS.PENDING].label).toBe('待安排');
    expect(INSTALLATION_STATUS_CONFIG[INSTALLATION_STATUS.COMPLETED].label).toBe('已完成');
    expect(INSTALLATION_STATUS_CONFIG[INSTALLATION_STATUS.CANCELLED].label).toBe('已取消');
  });
});

describe('installationTypeMap', () => {
  it('should have correct mappings for all installation types', () => {
    expect(installationTypeMap.standard).toBe('标准安装');
    expect(installationTypeMap.complex).toBe('复杂安装');
    expect(installationTypeMap.supplement).toBe('补装');
    expect(installationTypeMap.repair).toBe('维修安装');
    expect(installationTypeMap.modification).toBe('改装');
  });

  it('should have all installation types defined', () => {
    const typeKeys = Object.keys(installationTypeMap);
    expect(typeKeys).toHaveLength(5);
  });
});

describe('acceptanceStatusMap', () => {
  it('should have correct mappings for all acceptance statuses', () => {
    expect(acceptanceStatusMap.pending.label).toBe('待验收');
    expect(acceptanceStatusMap.passed.label).toBe('验收通过');
    expect(acceptanceStatusMap.failed.label).toBe('验收失败');
    expect(acceptanceStatusMap.partial.label).toBe('部分通过');
  });

  it('should have all acceptance statuses defined', () => {
    const statusKeys = Object.keys(acceptanceStatusMap);
    expect(statusKeys).toHaveLength(4);
  });
});

describe('INSTALLATION_STATUS_TRANSITIONS', () => {
  it('should allow valid transitions from pending', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.PENDING];
    expect(transitions).toContain(INSTALLATION_STATUS.ASSIGNING);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.COMPLETED);
  });

  it('should allow valid transitions from assigning', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.ASSIGNING];
    expect(transitions).toContain(INSTALLATION_STATUS.WAITING);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.PENDING);
  });

  it('should allow valid transitions from waiting', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.WAITING];
    expect(transitions).toContain(INSTALLATION_STATUS.INSTALLING);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.COMPLETED);
  });

  it('should allow valid transitions from installing', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.INSTALLING];
    expect(transitions).toContain(INSTALLATION_STATUS.CONFIRMING);
    expect(transitions).toContain(INSTALLATION_STATUS.REWORK);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.WAITING);
  });

  it('should allow valid transitions from confirming', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.CONFIRMING];
    expect(transitions).toContain(INSTALLATION_STATUS.COMPLETED);
    expect(transitions).toContain(INSTALLATION_STATUS.REWORK);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.INSTALLING);
  });

  it('should allow valid transitions from rework', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.REWORK];
    expect(transitions).toContain(INSTALLATION_STATUS.INSTALLING);
    expect(transitions).toContain(INSTALLATION_STATUS.CANCELLED);
    expect(transitions).not.toContain(INSTALLATION_STATUS.CONFIRMING);
  });

  it('should not allow any transitions from completed', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.COMPLETED];
    expect(transitions).toEqual([]);
  });

  it('should not allow any transitions from cancelled', () => {
    const transitions = INSTALLATION_STATUS_TRANSITIONS[INSTALLATION_STATUS.CANCELLED];
    expect(transitions).toEqual([]);
  });

  it('should have transitions defined for all statuses', () => {
    const statusValues = Object.values(INSTALLATION_STATUS);
    statusValues.forEach(status => {
      expect(INSTALLATION_STATUS_TRANSITIONS[status]).toBeDefined();
    });
  });
});
