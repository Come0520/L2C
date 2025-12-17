export interface Permission {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    user_count: number;
    created_at: string;
    updated_at: string;
}

import { ROLE_PERMISSIONS, ROLE_LABELS } from '@/shared/types/user'

class PermissionsService {
    async getRolesAndPermissions(): Promise<{ roles: Role[]; permissions: Permission[] }> {
        const now = new Date().toISOString()
        const roleEntries = Object.entries(ROLE_LABELS)
        const roles: Role[] = roleEntries.map(([roleKey, roleLabel]) => ({
            id: roleKey,
            name: roleLabel,
            description: roleLabel,
            permissions: (ROLE_PERMISSIONS as any)[roleKey] || [],
            user_count: 0,
            created_at: now,
            updated_at: now,
        }))
        const permSet = new Set<string>()
        roles.forEach(r => r.permissions.forEach(p => permSet.add(p)))
        const permissions: Permission[] = Array.from(permSet).map(p => ({
            id: p,
            name: p,
            description: p,
            created_at: now,
            updated_at: now,
        }))
        return { roles, permissions }
    }

    /**
     * Get all roles
     */
    async getRoles(): Promise<Role[]> {
        const data = await this.getRolesAndPermissions();
        return data.roles;
    }

    /**
     * Get all permissions
     */
    async getPermissions(): Promise<Permission[]> {
        const data = await this.getRolesAndPermissions();
        return data.permissions;
    }

    async createRole(name: string, description: string, permissions: string[]): Promise<Role> {
        const now = new Date().toISOString()
        return {
            id: name,
            name,
            description,
            permissions,
            user_count: 0,
            created_at: now,
            updated_at: now,
        }
    }
}

export const permissionsService = new PermissionsService();
