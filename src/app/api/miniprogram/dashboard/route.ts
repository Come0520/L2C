/**
 * 工作台仪表盘数据 API
 *
 * GET /api/miniprogram/dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { users, quotes, customers } from '@/shared/api/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper: Get User Info from Token
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Fetch full user to get role
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.userId as string),
      columns: { id: true, role: true, tenantId: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user || !user.tenantId) {
      console.log('Dashboard: User not authorized or no tenantId');
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }
    console.log('Dashboard: User authorized', user.role, user.id);

    const data: any = {
      role: user.role,
      stats: [],
      todos: [],
    };

    if (user.role === 'admin' || user.role === 'BOSS') {
      // --- ADMIN VIEW ---

      // 1. Leads (Customers)
      const leadsCount = await db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.tenantId, user.tenantId));

      // 2. Quotes (Total)
      const quotesCount = await db
        .select({ count: count() })
        .from(quotes)
        .where(eq(quotes.tenantId, user.tenantId));

      // 3. Orders (Confirmed Quotes)
      const ordersCount = await db
        .select({ count: count() })
        .from(quotes)
        .where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'CONFIRMED')));

      // 4. Cash (Sum of Confirmed) - Simplified for MVP, assuming finalAmount is numeric-string
      // For now, mockup the sum or use a count * avg if SQL sum is complex with string types in SQLite/Postgres hybrid envs
      // Let's iterate or just mock the value for safety in this demo environment if casting is risky.
      // Actually, let's try to fetch confirmed quotes and sum in JS for reliability.
      const confirmedQuotes = await db.query.quotes.findMany({
        where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'CONFIRMED')),
        columns: { finalAmount: true },
      });

      const totalCash = confirmedQuotes.reduce(
        (sum, q) => sum + (parseFloat(q.finalAmount as string) || 0),
        0
      );

      data.stats = {
        leads: leadsCount[0].count,
        quotes: quotesCount[0].count,
        orders: ordersCount[0].count,
        cash: (totalCash / 1000).toFixed(1), // Return in k unit
      };
    } else if (user.role === 'sales') {
      console.log('Dashboard: Entering SALES view');
      // --- SALES VIEW ---
      console.log('Dashboard: Querying leads...');
      const myLeads = await db
        .select({ count: count() })
        .from(customers)
        .where(and(eq(customers.tenantId, user.tenantId), eq(customers.assignedSalesId, user.id)));
      console.log('Dashboard: Leads queried', myLeads);

      const myQuotesCount = await db
        .select({ count: count() })
        .from(quotes)
        .where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.createdBy, user.id)));

      const myOrders = await db
        .select({ count: count() })
        .from(quotes)
        .where(
          and(
            eq(quotes.tenantId, user.tenantId),
            eq(quotes.createdBy, user.id),
            eq(quotes.status, 'CONFIRMED')
          )
        );

      // Calc my cash
      const myConfirmed = await db.query.quotes.findMany({
        where: and(
          eq(quotes.tenantId, user.tenantId),
          eq(quotes.createdBy, user.id),
          eq(quotes.status, 'CONFIRMED')
        ),
        columns: { finalAmount: true },
      });
      const myCash = myConfirmed.reduce(
        (sum, q) => sum + (parseFloat(q.finalAmount as string) || 0),
        0
      );

      data.stats = {
        leads: myLeads[0].count,
        quotes: myQuotesCount[0].count,
        orders: myOrders[0].count,
        cash: (myCash / 1000).toFixed(1),
      };

      // My Recent Quotes
      const myRecentQuotes = await db.query.quotes.findMany({
        where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.createdBy, user.id)),
        orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
        limit: 5,
        with: { customer: true },
      });

      data.todos = myRecentQuotes.map((q) => ({
        id: q.id,
        title: q.title || q.quoteNo,
        status: q.status,
        desc: `客户: ${q.customer?.name || '未知'}`,
        time: q.createdAt,
      }));
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard Error Stack:', error);
    if (error instanceof Error) {
      console.error('Dashboard Error Message:', error.message);
      console.error('Dashboard Error Name:', error.name);
    }
    return NextResponse.json(
      {
        success: false,
        error: '获取数据失败',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
