import { db } from "@/shared/api/db";
import { users, roles } from "@/shared/api/schema/infrastructure";
import { eq } from "drizzle-orm";

export class PermissionService {

    /**
     * Checks if a user has a specific permission.
     * @param userId 
     * @param permissionCode e.g., 'view_orders', 'edit_leads'
     */
    static async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                // Assuming there's a relation to roles, but schema defines role as string in users currently.
                // If we switch to role based table, we need join. 
                // Current 'users' table has 'role' field (string) AND 'permissions' (jsonb).
                // Infrastructure schema implies 'role' is a string code like 'USER' or 'ADMIN'.
            }
        });

        if (!user) return false;

        // 1. Check direct permissions on User
        const userPermissions = (user.permissions as string[]) || [];
        if (userPermissions.includes(permissionCode)) return true;

        // 2. Check Role permissions (if we fetch role definition)
        // Since 'role' in user table is just a string code, we might need to fetch the Role definition.
        // However, the schema shows 'roles' table exists. 
        // We should probably look up the role by code if 'user.role' matches 'roles.code'.

        if (user.role) {
            const roleDef = await db.query.roles.findFirst({
                where: eq(roles.code, user.role)
            });
            if (roleDef) {
                const rolePermissions = (roleDef.permissions as string[]) || [];
                if (rolePermissions.includes(permissionCode)) return true;
            }
        }

        return false;
    }

    /**
     * Checks if a user has a specific role.
     */
    static async hasRole(userId: string, roleCode: string): Promise<boolean> {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true }
        });
        return user?.role === roleCode;
    }

    /**
     * Data Masking Logic.
     * Returns a set of fields that should be masked for this user.
     */
    static async getMaskedFields(userId: string): Promise<string[]> {
        // Example logic: Measurers cannot see price fields
        const isMeasurer = await this.hasRole(userId, 'MEASURER');
        if (isMeasurer) {
            return ['amount', 'price', 'total', 'cost'];
        }
        return [];
    }
}
