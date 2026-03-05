/**
 * 智能派单 - 高级匹配算法模块
 *
 * 在基础评分算法之上，扩展距离因子、可用时间因子和批量匹配排序功能。
 * 提供完整的多维度工人匹配推荐能力。
 *
 * @module matching
 */
import { calculateWorkerScore } from './scoring';
import { logger } from '@/shared/lib/logger';

// ============================================================
// 类型定义
// ============================================================

/**
 * 地理坐标接口
 *
 * 用于描述工人或任务的地理位置，在距离因子计算中使用。
 *
 * @property lat - 纬度（WGS84 坐标系）
 * @property lng - 经度（WGS84 坐标系）
 */
interface GeoLocation {
  /** 纬度值（WGS84 坐标系，范围 -90 ~ 90） */
  lat: number;
  /** 经度值（WGS84 坐标系，范围 -180 ~ 180） */
  lng: number;
}

/**
 * 工人档案接口（扩展版）
 *
 * 在基础 scoring 模块的 WorkerProfile 基础上，扩展了位置和排班信息，
 * 用于多维度匹配算法的综合评分计算。
 *
 * @property id - 工人的唯一标识 ID
 * @property skills - 工人具备的技能标签列表
 * @property activeTaskCount - 当前正在进行的任务数量
 * @property avgRating - 历史平均服务评分（0-5 分制），可选
 * @property location - 工人当前地理位置坐标（可选，用于距离因子计算）
 * @property scheduledSlots - 工人当日已排班的时间段列表（ISO 8601 字符串对，用于可用时间因子计算）
 */
interface WorkerProfile {
  id: string;
  /** 工人具备的技能标签列表 */
  skills: string[];
  /** 当前正在进行的任务数量 */
  activeTaskCount: number;
  /** 历史平均服务评分（0-5 分制） */
  avgRating?: number;
  /** 工人当前地理位置坐标（用于距离因子计算） */
  location?: GeoLocation;
  /** 工人当日已排班的时间段列表（ISO 8601 字符串对） */
  scheduledSlots?: Array<{ start: string; end: string }>;
}

/**
 * 任务需求接口（扩展版）
 *
 * 在基础 scoring 模块的 TaskRequirement 基础上，扩展了位置和时间信息，
 * 用于距离因子和可用时间因子的综合匹配计算。
 *
 * @property category - 任务品类标识（如 'CURTAIN_FABRIC'、'WALLCLOTH' 等）
 * @property location - 任务目的地地理坐标（可选，用于距离因子计算）
 * @property scheduledAt - 任务计划开始时间（可选，ISO 8601 格式字符串）
 * @property durationMinutes - 任务预计耗时，单位为分钟（默认 120 分钟）
 */
interface TaskRequirement {
  /** 任务品类标识 */
  category: string;
  /** 任务目的地地理坐标（用于距离因子计算） */
  location?: GeoLocation;
  /** 任务计划开始时间（ISO 8601 格式字符串） */
  scheduledAt?: string;
  /** 任务预计耗时（分钟，默认 120） */
  durationMinutes?: number;
}

/**
 * 匹配结果接口
 *
 * 描述单个工人与任务匹配计算后的完整结果，包含工人信息、综合评分和评分明细。
 * 由 matchWorkersForTask 函数生成，按分数降序排列。
 *
 * @property worker - 匹配到的工人档案信息
 * @property score - 综合评分（0-100，越高越优）
 * @property scoreBreakdown - 评分明细拆分（基础分 + 距离加分 + 可用时间加分）
 */
export interface MatchResult {
  /** 匹配到的工人档案 */
  worker: WorkerProfile;
  /** 综合评分（0-100，越高表示匹配度越好） */
  score: number;
  /** 评分明细拆分 */
  scoreBreakdown: {
    /** 基础算法分（技能匹配 + 负载均衡 + 服务评价，0-100） */
    base: number;
    /** 距离加权分（0-10，近距离得分更高） */
    distance: number;
    /** 可用时间加权分（0 = 时间冲突，5 = 中性，10 = 时间可用） */
    availability: number;
  };
}

// ============================================================
// T2: 距离因子
// ============================================================

/**
 * 计算两点之间的直线距离（Haversine 公式，单位：公里）
 * @param a - 坐标点 A
 * @param b - 坐标点 B
 * @returns 距离（公里）
 */
export function calculateDistance(a: GeoLocation, b: GeoLocation): number {
  const R = 6371; // 地球半径（公里）
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const a2 =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
}

/**
 * 根据距离计算距离加分（0-10）
 * - 0-5 km  → 10 分
 * - 5-20 km → 5 分
 * - >20 km  → 0 分
 * - 无位置信息 → 5 分（中性）
 *
 * @remarks 实际距离 API（如百度地图路况）可替换 calculateDistance 函数
 *
 * @param workerLocation - 工人位置
 * @param taskLocation - 任务位置
 * @returns 距离加分
 */
export function getDistanceScore(
  workerLocation: GeoLocation | undefined,
  taskLocation: GeoLocation | undefined
): number {
  // 若缺少任一位置信息，给中性分
  if (!workerLocation || !taskLocation) return 5;

  const distanceKm = calculateDistance(workerLocation, taskLocation);

  if (distanceKm <= 5) return 10;
  if (distanceKm <= 20) return 5;
  return 0;
}

// ============================================================
// T2: 可用时间因子
// ============================================================

/**
 * 检查工人在指定时间段是否有时间冲突
 * @param scheduledSlots - 工人已排班时间段列表
 * @param scheduledAt - 任务计划开始时间
 * @param durationMinutes - 任务预计耗时（分钟）
 * @returns true = 有冲突，false = 无冲突
 */
export function hasScheduleConflict(
  scheduledSlots: Array<{ start: string; end: string }> | undefined,
  scheduledAt: string,
  durationMinutes: number = 120
): boolean {
  if (!scheduledSlots || scheduledSlots.length === 0) return false;

  const taskStart = new Date(scheduledAt).getTime();
  const taskEnd = taskStart + durationMinutes * 60 * 1000;

  return scheduledSlots.some((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    // 时间段重叠判断：任务开始 < 排班结束 AND 任务结束 > 排班开始
    return taskStart < slotEnd && taskEnd > slotStart;
  });
}

/**
 * 根据可用时间计算加分
 * - 无计划时间（未指定）→ 5 分（中性）
 * - 时间可用 → 10 分
 * - 时间冲突 → 0 分（但不完全排除，由调用方决定）
 *
 * @param worker - 工人档案
 * @param task - 任务需求
 * @returns 时间可用性加分
 */
export function getAvailabilityScore(worker: WorkerProfile, task: TaskRequirement): number {
  if (!task.scheduledAt) return 5; // 未指定时间，中性分

  const conflict = hasScheduleConflict(
    worker.scheduledSlots,
    task.scheduledAt,
    task.durationMinutes ?? 120
  );

  return conflict ? 0 : 10;
}

// ============================================================
// T2: 批量匹配主函数
// ============================================================

/**
 * 为任务从工人列表中筛选并排序最优工人
 *
 * 综合评分算法：
 * - 基础分（技能+负载+评价）：0-100，占主要权重
 * - 距离加分：0-10
 * - 可用时间加分：0-10
 * - 时间冲突的工人分数设为 0（排在末尾或由调用方过滤）
 *
 * @param task - 任务需求
 * @param workers - 候选工人列表
 * @param options - 配置项
 * @param options.excludeConflicts - 是否完全排除有时间冲突的工人（默认 true）
 * @returns 排序后的匹配结果列表（分高者先）
 */
export function matchWorkersForTask(
  task: TaskRequirement,
  workers: WorkerProfile[],
  options: { excludeConflicts?: boolean } = {}
): MatchResult[] {
  const { excludeConflicts = true } = options;

  logger.info('[Dispatch] 开始为任务匹配最优工人', {
    category: task.category,
    workerCount: workers.length,
    hasLocation: !!task.location,
    scheduledAt: task.scheduledAt,
  });

  const results: MatchResult[] = [];

  for (const worker of workers) {
    // 计算基础算法分
    const base = calculateWorkerScore(worker, task);

    // 技能不匹配（得 0 分）直接跳过
    if (base === 0) continue;

    // 计算距离加分
    const distance = getDistanceScore(worker.location, task.location);

    // 计算可用时间加分
    const availability = getAvailabilityScore(worker, task);

    // 处理时间冲突
    if (excludeConflicts && availability === 0 && task.scheduledAt) {
      continue; // 排除冲突工人
    }

    const totalScore = Math.min(100, base + distance + availability);

    results.push({
      worker,
      score: totalScore,
      scoreBreakdown: { base, distance, availability },
    });
  }

  // 按综合评分降序排列（使用不可变 .toSorted()，不修改 results 数组）
  const sorted = results.toSorted((a, b) => b.score - a.score);

  logger.info('[Dispatch] 任务匹配完成', {
    matchCount: sorted.length,
    topScore: sorted[0]?.score,
  });

  return sorted;
}
