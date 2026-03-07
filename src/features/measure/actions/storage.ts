/**
 * 租户存储配额 Server Action
 *
 * @description 查询租户在 OSS 上实际已用存储量和总配额。
 * 当前实现为固定配额 5GB。由于 measure_media 表尚未创建，
 * 已用量暂时返回 0，待 schema 补充后接入实际查询。
 */

/** 存储配额结果 */
export interface StorageQuotaResult {
  /** 已使用字节数 */
  used: number;
  /** 总配额字节数 */
  total: number;
  /** 已使用 MB（前端展示用）*/
  usedMB: number;
  /** 总配额 MB */
  totalMB: number;
  /** 使用率百分比（0-100）*/
  usagePercent: number;
}

/** 每租户默认总配额：5 GB */
const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;

/**
 * 获取租户存储配额
 *
 * @param tenantId 租户 ID
 *
 * TODO: 当 measure_media 表在 schema 中创建后，改为实际查询：
 * const result = await db.select({ totalSize: sum(measureMedia.fileSize) })
 *   .from(measureMedia).where(eq(measureMedia.tenantId, tenantId));
 */
export async function getTenantStorageQuota(tenantId: string): Promise<StorageQuotaResult> {
  // 暂时返回 0 已用量，待 measure_media 表建立后接入实际查询
  void tenantId; // 避免未使用变量警告
  const used = 0;
  const total = DEFAULT_QUOTA_BYTES;
  const usedMB = Math.round(used / (1024 * 1024));
  const totalMB = Math.round(total / (1024 * 1024));
  const usagePercent = Math.round((used / total) * 100);

  return { used, total, usedMB, totalMB, usagePercent };
}
