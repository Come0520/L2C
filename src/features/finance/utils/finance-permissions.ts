export type FinanceRole =
    | 'ADMIN'
    | 'FINANCE'
    | 'FINANCE_BOOKKEEPER'
    | 'FINANCE_REVIEWER'
    | 'FINANCE_SUPERVISOR'
    | 'FINANCE_READONLY'
    | string;

const FULL_ACCESS_ROLES = ['ADMIN', 'FINANCE', 'FINANCE_SUPERVISOR'];

function checkRoles(roles: FinanceRole[], allowedRoles: string[]): boolean {
    return roles.some(role => allowedRoles.includes(role));
}

/**
 * 是否有权限创建或编辑草稿凭证
 */
export function canCreateJournal(roles: FinanceRole[], isSimpleMode: boolean = false): boolean {
    if (isSimpleMode) return true; // 单体户简易模式：默认全员/所有者可记账
    return checkRoles(roles, [...FULL_ACCESS_ROLES, 'FINANCE_BOOKKEEPER']);
}

/**
 * 是否有权限复核/过账凭证
 */
export function canReviewJournal(roles: FinanceRole[], isSimpleMode: boolean = false): boolean {
    if (isSimpleMode) return true;
    return checkRoles(roles, [...FULL_ACCESS_ROLES, 'FINANCE_REVIEWER']);
}

/**
 * 是否有权限执行红字冲销 (高危)
 */
export function canReverseJournal(roles: FinanceRole[], isSimpleMode: boolean = false): boolean {
    if (isSimpleMode) return true;
    return checkRoles(roles, FULL_ACCESS_ROLES);
}

/**
 * 是否有权限进行期末结账/反结账 (高危)
 */
export function canClosePeriod(roles: FinanceRole[], isSimpleMode: boolean = false): boolean {
    if (isSimpleMode) return true;
    return checkRoles(roles, FULL_ACCESS_ROLES);
}

/**
 * 是否有权查阅三大财务报表
 */
export function canViewReports(roles: FinanceRole[], isSimpleMode: boolean = false): boolean {
    if (isSimpleMode) return true;
    return checkRoles(roles, [
        ...FULL_ACCESS_ROLES,
        'FINANCE_BOOKKEEPER',
        'FINANCE_REVIEWER',
        'FINANCE_READONLY'
    ]);
}
