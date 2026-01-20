export const APPROVAL_CONSTANTS = {
    // Special fee threshold ratio (120% of standard fee)
    SPECIAL_FEE_THRESHOLD_RATIO: 1.2,

    // Bad debt threshold days (90 days)
    BAD_DEBT_THRESHOLD_DAYS: 90,

    // Role Mapping: ApproverRole -> UserRole
    ROLE_MAP: {
        'STORE_MANAGER': 'MANAGER',
        'ADMIN': 'ADMIN',
        'FINANCE': 'FINANCE',
        'PURCHASING': 'SUPPLY',
        'DISPATCHER': 'WORKER'
    } as Record<string, string>
} as const;
