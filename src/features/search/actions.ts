'use server';

import { db } from '@/shared/api/db';
import {
  customers,
  leads,
  orders,
  quotes,
  products,
  afterSalesTickets,
  channels,
  arStatements,
  roles,
} from '@/shared/api/schema';
import { eq, and, or, ilike, inArray } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';
import { unstable_cache } from 'next/cache';
import { redis } from '@/shared/lib/redis';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 辅助函数：生成高亮文本
 *
 * @param text 待高亮的原始文本
 * @param query 搜索关键词
 * @returns 带有 <mark> 标签的高亮字符串
 */
function highlightText(text: string | null, query: string): string {
  if (!text) return '';
  if (!query) return text;

  // 简单的忽略大小写替换，包裹 <mark> 标签。确保转义正确：包括短横线、问号和各种常用正则字符
  // 使用双反斜杠进行字面转义，因为 new RegExp 内部的 \ 需要它本身转义
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 全局搜索 Schema
 * 限制查询长度和结果数量，防止滥用。
 * 包含对 SQL 通配符的过滤以增强安全性。
 */
const globalSearchSchema = z.object({
  query: z
    .string()
    .max(100, '搜索关键词过长')
    .transform((val) => val.replace(/[%_]/g, '')) // 安全过滤：剔除 SQL 通配符 % 和 _
    .optional()
    .default(''),
  limit: z.number().min(1).max(50).default(5), // 每类数据降低为 5 条
  scope: z.enum(['all', 'customers', 'orders', 'leads']).default('all'),
});

// 在返回结果的 type 中扩展所有支持搜索的模块
/**
 * 搜索结果项接口
 * 用于在 UI 组件中统一展示不同模块的搜索结果
 */
type SearchResultItem = {
  /** 结果类型，决定了 UI 上的图标和跳转链接 */
  type:
    | 'customer'
    | 'lead'
    | 'order'
    | 'quote'
    | 'product'
    | 'ticket'
    | 'channel'
    | 'finance'
    | 'history';
  /** 实体 ID 或历史记录 Key */
  id: string;
  /** 主要显示标题（如客户姓名、单号） */
  label: string | null;
  /** 次要显示描述（如手机号、状态信息） */
  sub: string | null;
  /** 命中关键词的高亮 HTML 字符串 */
  highlight?: {
    label: string;
    sub: string;
  };
};

/**
 * 数据库查询结果基础类型定义
 */
type DbCustomerResult = { id: string; name: string | null; phone: string | null };
type DbLeadResult = { id: string; customerName: string | null; customerPhone: string | null };
type DbOrderResult = { id: string; orderNo: string; status: string | null };
type DbQuoteResult = { id: string; quoteNo: string; status: string | null };
type DbProductResult = { id: string; name: string; sku: string | null };
type DbTicketResult = { id: string; ticketNo: string; status: string | null };
type DbChannelResult = { id: string; name: string };
type DbFinanceResult = { id: string; statementNo: string; status: string | null };

/**
 * 从数据库执行实际搜索，并应用缓存
 * 通过 Promise.all() 并发执行具有权限的请求。
 *
 * @param tenantId 租户 ID，用于数据隔离
 * @param query 搜索关键词（已被 Zod 净化）
 * @param limit 每类结果的最大数量
 * @param scope 搜索范围
 * @param permissions 用户拥有的权限列表
 * @returns 包含各类搜索结果的对象
 */
async function performDbSearch(
  tenantId: string,
  query: string,
  limit: number,
  scope: string,
  permissions: string[]
) {
  const searchPattern = `%${query}%`;
  const doAll = scope === 'all';

  // 提取判断用户是否包含某项权限的能力
  const hasPerm = (perm: string) =>
    permissions.includes(perm) || permissions.includes('**') || permissions.includes('*');

  return unstable_cache(
    async () => {
      const results = {
        customers: [] as DbCustomerResult[],
        leads: [] as DbLeadResult[],
        orders: [] as DbOrderResult[],
        quotes: [] as DbQuoteResult[],
        products: [] as DbProductResult[],
        tickets: [] as DbTicketResult[],
        channels: [] as DbChannelResult[],
        finances: [] as DbFinanceResult[],
      };

      const searchPromises: Promise<void>[] = [];

      // 搜索客户
      if (
        (doAll || scope === 'customers') &&
        (hasPerm(PERMISSIONS.CUSTOMER.ALL_VIEW) || hasPerm(PERMISSIONS.CUSTOMER.OWN_VIEW))
      ) {
        searchPromises.push(
          db.query.customers
            .findMany({
              where: and(
                eq(customers.tenantId, tenantId),
                or(ilike(customers.name, searchPattern), ilike(customers.phone, searchPattern))
              ),
              columns: { id: true, name: true, phone: true },
              limit,
            })
            .then((res) => {
              results.customers = res;
            })
        );
      }

      // 搜索线索
      if (
        (doAll || scope === 'leads') &&
        (hasPerm(PERMISSIONS.LEAD.ALL_VIEW) || hasPerm(PERMISSIONS.LEAD.OWN_VIEW))
      ) {
        searchPromises.push(
          db.query.leads
            .findMany({
              where: and(
                eq(leads.tenantId, tenantId),
                or(
                  ilike(leads.customerName, searchPattern),
                  ilike(leads.customerPhone, searchPattern)
                )
              ),
              columns: { id: true, customerName: true, customerPhone: true },
              limit,
            })
            .then((res) => {
              results.leads = res;
            })
        );
      }

      // 搜索订单
      if (
        (doAll || scope === 'orders') &&
        (hasPerm(PERMISSIONS.ORDER.ALL_VIEW) || hasPerm(PERMISSIONS.ORDER.OWN_VIEW))
      ) {
        searchPromises.push(
          db.query.orders
            .findMany({
              where: and(eq(orders.tenantId, tenantId), ilike(orders.orderNo, searchPattern)),
              columns: { id: true, orderNo: true, status: true },
              limit,
            })
            .then((res) => {
              results.orders = res;
            })
        );
      }

      // ================= 新增额外权限业务搜索 =================
      // 搜索报价
      if (doAll && (hasPerm(PERMISSIONS.QUOTE.ALL_VIEW) || hasPerm(PERMISSIONS.QUOTE.OWN_VIEW))) {
        searchPromises.push(
          db.query.quotes
            .findMany({
              where: and(eq(quotes.tenantId, tenantId), ilike(quotes.quoteNo, searchPattern)),
              columns: { id: true, quoteNo: true, status: true },
              limit,
            })
            .then((res) => {
              results.quotes = res;
            })
        );
      }

      // 搜索产品
      if (doAll && hasPerm(PERMISSIONS.PRODUCTS.VIEW)) {
        searchPromises.push(
          db.query.products
            .findMany({
              where: and(
                eq(products.tenantId, tenantId),
                or(ilike(products.name, searchPattern), ilike(products.sku, searchPattern))
              ),
              columns: { id: true, name: true, sku: true },
              limit,
            })
            .then((res) => {
              results.products = res;
            })
        );
      }

      // 搜索渠道商
      if (doAll && hasPerm(PERMISSIONS.CHANNEL.VIEW)) {
        searchPromises.push(
          db.query.channels
            .findMany({
              where: and(eq(channels.tenantId, tenantId), ilike(channels.name, searchPattern)),
              columns: { id: true, name: true },
              limit,
            })
            .then((res) => {
              results.channels = res;
            })
        );
      }

      // 搜索工单(售后)
      if (
        doAll &&
        (hasPerm(PERMISSIONS.AFTER_SALES.ALL_VIEW) || hasPerm(PERMISSIONS.AFTER_SALES.OWN_VIEW))
      ) {
        searchPromises.push(
          db.query.afterSalesTickets
            .findMany({
              where: and(
                eq(afterSalesTickets.tenantId, tenantId),
                ilike(afterSalesTickets.ticketNo, searchPattern)
              ),
              columns: { id: true, ticketNo: true, status: true },
              limit,
            })
            .then((res) => {
              results.tickets = res;
            })
        );
      }

      // 搜索财务 (应收)
      if (doAll && hasPerm(PERMISSIONS.FINANCE.AR_VIEW)) {
        searchPromises.push(
          db.query.arStatements
            .findMany({
              where: and(
                eq(arStatements.tenantId, tenantId),
                ilike(arStatements.statementNo, searchPattern)
              ),
              columns: { id: true, statementNo: true, status: true },
              limit,
            })
            .then((res) => {
              results.finances = res;
            })
        );
      }

      // 并发执行所有权限允许的查询
      await Promise.allSettled(searchPromises);

      return results;
    },
    [`search-full-${tenantId}`, query, scope, String(limit), permissions.sort().join('_')],
    { revalidate: 60, tags: [`search-${tenantId}`] }
  )();
}

/**
 * 全局搜索 Action
 * 扩展版：支持通过用户权限并行的全量模块搜索检索。
 * 包含搜索历史记录（Redis）和多模块并发查询。
 *
 * @param params 搜索参数，详见 globalSearchSchema
 * @returns 格式化后的按类别分组的搜索结果
 */
const globalSearchActionInternal = createSafeAction(
  globalSearchSchema,
  async ({ query, limit, scope }, { session }) => {
    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const historyKey = `search:history:${tenantId}:${userId}`;

    try {
      if (!query.trim()) {
        let historyResults: SearchResultItem[] = [];
        if (redis) {
          try {
            const history = await redis.lrange(historyKey, 0, 9);
            historyResults = history.map((item) => ({
              type: 'history' as const,
              id: `hist-${item}`,
              label: item,
              sub: '搜索历史',
            }));
          } catch (redisError) {
            logger.warn('全局搜索历史获取(Redis)失败，已静默降级', redisError);
          }
        }
        return {
          customers: [],
          leads: [],
          orders: [],
          quotes: [],
          products: [],
          channels: [],
          tickets: [],
          finances: [],
          history: historyResults,
        };
      }

      if (redis && query.trim()) {
        try {
          await redis.lrem(historyKey, 0, query.trim());
          await redis.lpush(historyKey, query.trim());
          await redis.ltrim(historyKey, 0, 9);
        } catch (redisError) {
          logger.warn('全局搜索记录历史(Redis)失败，已静默降级', redisError);
        }
      }

      const userRoles = session.user.roles || [];
      const roleRecords = await db.query.roles.findMany({
        where: and(inArray(roles.code, userRoles), eq(roles.tenantId, tenantId)),
        columns: { permissions: true },
      });
      const userPerms = [...new Set(roleRecords.flatMap((r) => r.permissions || []))] as string[];
      const results = await performDbSearch(tenantId, query.trim(), limit, scope, userPerms);

      return {
        customers: results.customers.map((c: DbCustomerResult) => ({
          type: 'customer' as const,
          id: c.id,
          label: c.name,
          sub: c.phone,
          highlight: { label: highlightText(c.name, query), sub: highlightText(c.phone, query) },
        })),
        leads: results.leads.map((l: DbLeadResult) => ({
          type: 'lead' as const,
          id: l.id,
          label: l.customerName,
          sub: l.customerPhone,
          highlight: {
            label: highlightText(l.customerName, query),
            sub: highlightText(l.customerPhone, query),
          },
        })),
        orders: results.orders.map((o: DbOrderResult) => ({
          type: 'order' as const,
          id: o.id,
          label: o.orderNo,
          sub: o.status,
          highlight: {
            label: highlightText(o.orderNo, query),
            sub: highlightText(o.status, query),
          },
        })),
        quotes: results.quotes.map((q: DbQuoteResult) => ({
          type: 'quote' as const,
          id: q.id,
          label: q.quoteNo,
          sub: q.status,
          highlight: {
            label: highlightText(q.quoteNo, query),
            sub: highlightText(q.status, query),
          },
        })),
        products: results.products.map((p: DbProductResult) => ({
          type: 'product' as const,
          id: p.id,
          label: p.name,
          sub: p.sku,
          highlight: { label: highlightText(p.name, query), sub: highlightText(p.sku, query) },
        })),
        tickets: results.tickets.map((t: DbTicketResult) => ({
          type: 'ticket' as const,
          id: t.id,
          label: t.ticketNo,
          sub: t.status,
          highlight: {
            label: highlightText(t.ticketNo, query),
            sub: highlightText(t.status, query),
          },
        })),
        channels: results.channels.map((ch: DbChannelResult) => ({
          type: 'channel' as const,
          id: ch.id,
          label: ch.name,
          sub: null,
          highlight: { label: highlightText(ch.name, query), sub: highlightText(null, query) },
        })),
        finances: results.finances.map((f: DbFinanceResult) => ({
          type: 'finance' as const,
          id: f.id,
          label: f.statementNo,
          sub: f.status,
          highlight: {
            label: highlightText(f.statementNo, query),
            sub: highlightText(f.status, query),
          },
        })),
        history: [],
      };
    } catch (error) {
      logger.error('全局搜索失败:', {
        query,
        scope,
        tenantId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

/**
 * 全局搜索外层接口
 *
 * @param params 原始搜索输入
 * @returns 经过校验和权限过滤的搜索结果
 */
export async function globalSearch(params: z.input<typeof globalSearchSchema>) {
  return globalSearchActionInternal(params as z.infer<typeof globalSearchSchema>);
}
