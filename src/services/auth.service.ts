import { db } from "@/shared/api/db";
import { users } from "@/shared/api/schema/infrastructure";
import { eq } from "drizzle-orm";

export class AuthService {
    /**
     * Retrieves a user by their ID.
     * @param userId The ID of the user to retrieve.
     * @returns The user object or null if not found.
     */
    static async getUserById(userId: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        return user || null;
    }

    /**
     * Validates a user's session.
     * This is a placeholder for actual session validation logic.
     * @param token The session token.
     * @returns True if valid, false otherwise.
     */
    static async validateSession(token: string) {
        // TODO: Implement actual session validation (e.g. JWT verification or DB session check)
        return !!token;
    }

    /**
     * Login or register with WeChat OpenID.
     * If user exists by OpenID, return user.
     * If not, create a new user (or handle binding logic depending on requirements).
     * @param openId The WeChat OpenID.
     * @param tenantId The Tenant ID (required for new user creation).
     */
    static async loginWithWeChat(openId: string, tenantId: string) {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.wechatOpenId, openId),
        });

        if (existingUser) {
            return existingUser;
        }

        // New User Registration flow (Simplified)
        // In production, might require phone binding first.
        // For now, we return null to indicate "Needs Binding" or create a temp user.
        return null;
    }

    /**
     * Bind WeChat OpenID to an existing user.
     * @param userId The User ID.
     * @param openId The WeChat OpenID.
     */
    static async bindWeChat(userId: string, openId: string) {
        await db.update(users)
            .set({ wechatOpenId: openId })
            .where(eq(users.id, userId));
    }
}
