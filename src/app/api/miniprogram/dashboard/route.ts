/**
 * 工作台仪表盘数据 API
 *
 * GET /api/miniprogram/dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, customers, salesTargets } from '@/shared/api/schema';
import { eq, and, count, sum } from 'drizzle-orm';
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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    if (user.role === 'admin' || user.role === 'BOSS') {
      // --- ADMIN VIEW ---

      // 0. Get Team Target (Sum of all sales targets for this month)
      const teamTargetRes = await db
        .select({ total: sum(salesTargets.targetAmount) })
        .from(salesTargets)
        .where(and(
          eq(salesTargets.tenantId, user.tenantId),
          eq(salesTargets.year, currentYear),
          eq(salesTargets.month, currentMonth)
        ));

      const targetAmount = parseFloat(teamTargetRes[0]?.total as string) || 0;

      // 1. Leads Stats
      const leadsStats = await db
        .select({
          status: customers.status,
          count: count()
        })
        .from(customers)
        .where(eq(customers.tenantId, user.tenantId))
        .groupBy(customers.status);

      const totalLeads = leadsStats.reduce((acc, curr) => acc + curr.count, 0);
      const pendingLeads = leadsStats.filter(s => ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
      const followingLeads = leadsStats.filter(s => s.status === 'FOLLOWING_UP').reduce((acc, c) => acc + c.count, 0);
      const wonLeads = leadsStats.filter(s => s.status === 'WON').reduce((acc, c) => acc + c.count, 0);

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

      // 4. Cash
      const confirmedQuotes = await db.query.quotes.findMany({
        where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'CONFIRMED')),
        columns: { finalAmount: true },
      });

      const totalCash = confirmedQuotes.reduce(
        (sum, q) => sum + (parseFloat(q.finalAmount as string) || 0),
        0
      );

      data.target = {
        amount: targetAmount,
        achieved: totalCash,
        percentage: targetAmount > 0 ? Math.min(Math.round((totalCash / targetAmount) * 100), 100) : 0
      };

      data.stats = {
        leads: totalLeads,
        leadsBreakdown: {
          pending: pendingLeads,
          following: followingLeads,
          won: wonLeads
        },
        quotes: quotesCount[0].count,
        orders: ordersCount[0].count,
        cash: (totalCash / 1000).toFixed(1), // k unit
        conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0',
        avgOrderValue: ordersCount[0].count > 0 ? (totalCash / ordersCount[0].count).toFixed(0) : '0'
      };

    } else if (user.role === 'sales') {
      // --- SALES VIEW ---

      // 0. Get My Target
      const myTargetRes = await db.query.salesTargets.findFirst({
        where: and(
          eq(salesTargets.tenantId, user.tenantId),
          eq(salesTargets.userId, user.id),
          eq(salesTargets.year, currentYear),
          eq(salesTargets.month, currentMonth)
        ),
        columns: { targetAmount: true }
      });
      const targetAmount = parseFloat(myTargetRes?.targetAmount as string) || 0;

      // 1. Leads Breakdown
      const myLeadsStats = await db
        .select({
          status: customers.status,
          count: count()
        })
        .from(customers)
        .where(and(eq(customers.tenantId, user.tenantId), eq(customers.assignedSalesId, user.id)))
        .groupBy(customers.status);

      const totalLeads = myLeadsStats.reduce((acc, curr) => acc + curr.count, 0);
      const pendingLeads = myLeadsStats.filter(s => ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
      const followingLeads = myLeadsStats.filter(s => s.status === 'FOLLOWING_UP').reduce((acc, c) => acc + c.count, 0);
      const wonLeads = myLeadsStats.filter(s => s.status === 'WON').reduce((acc, c) => acc + c.count, 0);

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

      data.target = {
        amount: targetAmount,
        achieved: myCash,
        percentage: targetAmount > 0 ? Math.min(Math.round((myCash / targetAmount) * 100), 100) : 0
      };

      data.stats = {
        leads: totalLeads,
        leadsBreakdown: {
          pending: pendingLeads,
          following: followingLeads,
          won: wonLeads
        },
        quotes: myQuotesCount[0].count,
        orders: myOrders[0].count,
        cash: (myCash / 1000).toFixed(1),
        conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0',
        avgOrderValue: myOrders[0].count > 0 ? (myCash / myOrders[0].count).toFixed(0) : '0'
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
        title: q.quoteNo, // Use quoteNo as title
        status: q.status,
        desc: `客户: ${q.customer?.name || '未知'}`,
        time: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
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
