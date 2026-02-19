import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and, not, gte, lte } from 'drizzle-orm';

export type ConflictType = 'HARD' | 'SOFT' | 'NONE';

export interface ConflictResult {
    hasConflict: boolean;
    conflictType: ConflictType;
    message?: string;
    conflictingTaskId?: string;
}

// 时段定义表（可配置）
const TIME_SLOT_DEFINITIONS: Record<string, { start: number; end: number }> = {
    '上午': { start: 9, end: 12 },
    '下午': { start: 14, end: 17 },
    '晚间': { start: 18, end: 20 },
    'AM': { start: 9, end: 12 },
    'PM': { start: 14, end: 17 },
};

// 冲突检测阈值配置
export const CONFLICT_CONFIG = {
    MAX_DISTANCE_KM: 50,      // 最大赶场距离 (km)
    MIN_TIME_GAP_HOURS: 2,    // 最小赶场间隔 (小时)
    MAX_DAILY_TASKS: 3,       // 每日最大任务数
};

/**
 * 解析时段字符串为小时范围
 */
function parseTimeSlot(timeSlot: string): { start: number; end: number } | null {
    // 尝试匹配预定义时段
    const predefined = TIME_SLOT_DEFINITIONS[timeSlot];
    if (predefined) return predefined;

    // 尝试解析 "14:00-16:00" 格式
    const rangeMatch = timeSlot.match(/(\d{1,2}):?\d{0,2}\s*[-~]\s*(\d{1,2}):?\d{0,2}/);
    if (rangeMatch) {
        return { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) };
    }

    return null;
}

/**
 * 判断两个时段是否重叠
 */
function isTimeOverlap(
    slot1: { start: number; end: number },
    slot2: { start: number; end: number }
): boolean {
    return slot1.start < slot2.end && slot2.start < slot1.end;
}

import { calculateHaversineDistance } from '@/shared/lib/gps-utils';

/**
 * 计算两个坐标之间的距离 (km)
 */
function calculateDistance(
    loc1: { latitude: number; longitude: number } | null,
    loc2: { latitude: number; longitude: number } | null
): number | null {
    if (!loc1 || !loc2) return null;

    // shared lib 返回单位是米，我们需要千米
    const distanceMeters = calculateHaversineDistance(
        loc1.latitude,
        loc1.longitude,
        loc2.latitude,
        loc2.longitude
    );

    return distanceMeters / 1000;
}

/**
 * 调度冲突检测
 * - 硬冲突：同一师傅同一时段已有任务（禁止派单）
 * - 软冲突：地理距离 > 50km 且时间间隔 < 2小时 或 当日任务 >= 3 个（警告但允许强制派单）
 * 
 * @param tenantId - 租户 ID（必须从 session 获取）
 */
export async function checkSchedulingConflict(
    installerId: string,
    scheduledDate: Date,
    timeSlot: string,
    tenantId: string,  // 必填：租户隔离参数 - 移至可选参数之前
    currentTaskId?: string,
    targetAddress?: { latitude: number; longitude: number }
): Promise<ConflictResult> {
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 查询师傅当日所有任务（排除当前编辑的任务，限定租户范围）
    const existingTasks = await db.query.installTasks.findMany({
        where: and(
            eq(installTasks.installerId, installerId),
            gte(installTasks.scheduledDate, startOfDay),
            lte(installTasks.scheduledDate, endOfDay),
            currentTaskId ? not(eq(installTasks.id, currentTaskId)) : undefined,
            eq(installTasks.tenantId, tenantId),  // 租户隔离
        )
    });

    const currentSlot = parseTimeSlot(timeSlot);

    // 1. 硬冲突检测：同一时段是否有任务
    if (currentSlot) {
        for (const task of existingTasks) {
            if (!task.scheduledTimeSlot) continue;
            const taskSlot = parseTimeSlot(task.scheduledTimeSlot);
            if (taskSlot && isTimeOverlap(currentSlot, taskSlot)) {
                // 排除已完成的任务
                if (task.status === 'COMPLETED') continue;

                return {
                    hasConflict: true,
                    conflictType: 'HARD',
                    message: `师傅在该时段 (${timeSlot}) 已有任务 ${task.taskNo}`,
                    conflictingTaskId: task.id
                };
            }
        }
    }

    // 2. 软冲突检测：地理距离和时间间隔
    if (currentSlot && targetAddress) {
        // 找到当前时段之前最近的任务
        const previousTasks = existingTasks
            .filter(t => {
                const slot = parseTimeSlot(t.scheduledTimeSlot || '');
                return slot && slot.end <= currentSlot.start;
            })
            .sort((a, b) => {
                const slotA = parseTimeSlot(a.scheduledTimeSlot || '');
                const slotB = parseTimeSlot(b.scheduledTimeSlot || '');
                return (slotB?.end || 0) - (slotA?.end || 0);
            });

        const previousTask = previousTasks[0];
        if (previousTask) {
            const previousSlot = parseTimeSlot(previousTask.scheduledTimeSlot || '');
            const prevLocation = previousTask.address ?
                // 注意：实际项目需通过地址解析服务获取坐标
                null : null;

            // 如果有地理位置数据，计算距离
            if (prevLocation && targetAddress) {
                const distance = calculateDistance(prevLocation, targetAddress);
                const timeGap = previousSlot ? currentSlot.start - previousSlot.end : 999;

                if (distance !== null && distance > CONFLICT_CONFIG.MAX_DISTANCE_KM && timeGap < CONFLICT_CONFIG.MIN_TIME_GAP_HOURS) {
                    return {
                        hasConflict: true,
                        conflictType: 'SOFT',
                        message: `警告：上一个任务距离 ${distance.toFixed(1)}km，间隔仅 ${timeGap} 小时，可能存在赶场风险`,
                    };
                }
            }
        }
    }

    // 3. 软冲突检测：当日任务数量预警
    const activeTasks = existingTasks.filter(t => t.status !== 'COMPLETED');
    if (activeTasks.length >= CONFLICT_CONFIG.MAX_DAILY_TASKS) {
        return {
            hasConflict: true,
            conflictType: 'SOFT',
            message: `师傅当日已有 ${activeTasks.length} 个任务，可能存在赶场风险`,
        };
    }

    return { hasConflict: false, conflictType: 'NONE' };
}

