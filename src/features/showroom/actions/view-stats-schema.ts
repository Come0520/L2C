/**
 * 展厅浏览统计 Zod Schema（纯数据定义，不需要 'use server'）
 */

import { z } from 'zod';

/**
 * 展厅浏览统计 Zod Schema
 */

/** 上报素材停留时间参数 */
export const reportViewStatsSchema = z.object({
  shareId: z.string().uuid().describe('分享记录 ID'),
  visitorUserId: z.string().uuid().describe('访客系统用户 ID'),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid().describe('素材 ID'),
        durationSeconds: z.number().int().min(0).max(86400).describe('停留秒数（上限 24 小时）'),
      })
    )
    .min(1, '至少上报一个素材的停留时间')
    .describe('素材停留时间列表'),
});

/** 查询浏览报告参数 */
export const getViewStatsReportSchema = z.object({
  shareId: z.string().uuid().describe('分享记录 ID'),
  limit: z.number().int().min(1).max(50).default(10).describe('返回 Top N 素材'),
});
