import 'dotenv/config';
import { describe, it, expect, vi } from 'vitest';
import { db } from '..';
import { users, tenantMembers } from '../schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';

describe('E2E Auth Reproduction', () => {
  it('should find the E2E user in the database', async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.phone, '13800000001'),
    });
    expect(user).toBeDefined();
    expect(user?.phone).toBe('13800000001');
    expect(user?.isActive).toBe(true);
  });

  it('should have a valid password hash and match "123456"', async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.phone, '13800000001'),
    });
    expect(user?.passwordHash).toBeDefined();
    const isMatch = await compare('123456', user!.passwordHash!);
    expect(isMatch).toBe(true);
  });

  it('should have at least one active membership for the user', async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.phone, '13800000001'),
    });

    const memberships = await db.query.tenantMembers.findMany({
      where: and(eq(tenantMembers.userId, user!.id), eq(tenantMembers.isActive, true)),
    });

    expect(memberships.length).toBeGreaterThan(0);
  });

  it('should have AUTH_SECRET and AUTH_URL defined in process.env', () => {
    expect(process.env.AUTH_SECRET).toBeDefined();
    expect(process.env.AUTH_SECRET?.length).toBeGreaterThan(16);
    expect(process.env.AUTH_URL).toBe('http://localhost:3000');
  });
});
