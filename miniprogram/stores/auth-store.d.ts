/**
 * Auth Store (Observer Pattern)
 * Manages User, Role, Tenant state and notifies listeners (Custom TabBar, etc.)
 */
export type UserRole = 'admin' | 'sales' | 'installer' | 'customer' | 'guest';
export interface UserInfo {
    id: string;
    name: string;
    avatarUrl?: string;
    role: UserRole;
    tenantId?: string;
    tenantName?: string;
    phone?: string;
    tenantStatus?: string;
}
declare class AuthStore {
    private _userInfo;
    private _token;
    private _listeners;
    constructor();
    get userInfo(): UserInfo | null;
    get token(): string;
    get isLoggedIn(): boolean;
    get currentRole(): UserRole;
    setLogin(token: string, userInfo: UserInfo): void;
    logout(): void;
    updateRole(role: UserRole): void;
    subscribe(listener: Function): () => void;
    private notify;
}
export declare const authStore: AuthStore;
export {};
