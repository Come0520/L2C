/**
 * 临时调试路由 - 排查展厅详情查询报错
 * ⚠️ 无 auth 保护，用完即删
 */
import { NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { showroomItems } from '@/shared/api/schema/showroom';
import { eq } from 'drizzle-orm';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 步骤1: 获取所有展厅素材 ID（前5条）
  try {
    const allItems = await db.query.showroomItems.findMany({
      columns: { id: true, title: true, productId: true, createdBy: true, tenantId: true },
      limit: 5,
    });
    results.step1_allItems = allItems;
  } catch (e) {
    results.step1_error = e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
  }

  // 步骤2: 对第一条素材做关联查询
  const firstId = (results.step1_allItems as any)?.[0]?.id;
  if (firstId) {
    // 2a: 不含关联
    try {
      const simple = await db.query.showroomItems.findFirst({
        where: eq(showroomItems.id, firstId),
      });
      results.step2a_simple = {
        id: simple?.id,
        title: simple?.title,
        productId: simple?.productId,
        createdBy: simple?.createdBy,
      };
    } catch (e) {
      results.step2a_error =
        e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
    }

    // 2b: 含 product 关联
    try {
      const withProduct = await db.query.showroomItems.findFirst({
        where: eq(showroomItems.id, firstId),
        with: { product: true },
      });
      results.step2b_withProduct = { id: withProduct?.id, hasProduct: !!withProduct?.product };
    } catch (e) {
      results.step2b_error =
        e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e);
    }

    // 2c: 含 creator 关联
    try {
      const withCreator = await db.query.showroomItems.findFirst({
        where: eq(showroomItems.id, firstId),
        with: { creator: true },
      });
      results.step2c_withCreator = { id: withCreator?.id, hasCreator: !!withCreator?.creator };
    } catch (e) {
      results.step2c_error =
        e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e);
    }

    // 2d: 同时含 product + creator
    try {
      const withBoth = await db.query.showroomItems.findFirst({
        where: eq(showroomItems.id, firstId),
        with: { product: true, creator: true },
      });
      results.step2d_withBoth = {
        id: withBoth?.id,
        hasProduct: !!withBoth?.product,
        hasCreator: !!withBoth?.creator,
      };
    } catch (e) {
      results.step2d_error =
        e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e);
    }
  }

  return NextResponse.json(results, { status: 200 });
}
