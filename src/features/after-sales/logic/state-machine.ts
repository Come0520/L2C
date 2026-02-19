/**
 * 售后工单状态机 (After-Sales State Machine)
 * 定义所有合法的状态转换路径
 */
export const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
    'PENDING': ['INVESTIGATING', 'PROCESSING', 'REJECTED'],
    'INVESTIGATING': ['PROCESSING', 'PENDING_VISIT', 'PENDING_CALLBACK', 'REJECTED'],
    'PROCESSING': ['PENDING_VERIFY', 'CLOSED'],
    'PENDING_VISIT': ['PROCESSING'],
    'PENDING_CALLBACK': ['PROCESSING'],
    'PENDING_VERIFY': ['CLOSED', 'PROCESSING'],
    'REJECTED': [], // 终态
    'CLOSED': [],   // 终态
};

/**
 * 校验状态转换是否合法
 * @param from 当前状态
 * @param to 目标状态
 */
export function isValidTransition(from: string, to: string): boolean {
    return VALID_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 获取状态的所有可转换目标
 * @param state 当前状态
 */
export function getAvailableTransitions(state: string): string[] {
    return VALID_STATE_TRANSITIONS[state] || [];
}

/**
 * 检查是否为终态 (Terminal State)
 */
export function isTerminalState(state: string): boolean {
    return getAvailableTransitions(state).length === 0;
}
