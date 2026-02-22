/**
 * 智能派单 - 高级匹配算法
 * 扩展功能：距离因子、可用时间因子、批量匹配排序
 */
import { calculateWorkerScore } from './scoring';

// ============================================================
// 类型定义
// ============================================================

/** 地理坐标 */
interface GeoLocation {
    lat: number;
    lng: number;
}

/** 工人档案（扩展版） */
interface WorkerProfile {
    id: string;
    skills: string[];
    activeTaskCount: number;
    avgRating?: number;
    /** 工人当前位置（可选） */
    location?: GeoLocation;
    /** 工人当日已排班时间段（ISO 8601 字符串对）*/
    scheduledSlots?: Array<{ start: string; end: string }>;
}

/** 任务需求（扩展版） */
interface TaskRequirement {
    category: string;
    /** 任务地点（可选） */
    location?: GeoLocation;
    /** 任务计划开始时间（可选，ISO 8601 字符串） */
    scheduledAt?: string;
    /** 预计耗时（分钟，默认 120） */
    durationMinutes?: number;
}

/** 匹配结果 */
export interface MatchResult {
    worker: WorkerProfile;
    /** 综合评分（0-100，越高越优） */
    score: number;
    /** 评分明细 */
    scoreBreakdown: {
        base: number;       // 基础算法分（技能+负载+评价）
        distance: number;   // 距离加权（0-10）
        availability: number; // 可用时间加权（0 或 10）
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
        sinDLat * sinDLat +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

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

    return scheduledSlots.some(slot => {
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
export function getAvailabilityScore(
    worker: WorkerProfile,
    task: TaskRequirement
): number {
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

    // 按综合评分降序排列
    results.sort((a, b) => b.score - a.score);

    return results;
}
