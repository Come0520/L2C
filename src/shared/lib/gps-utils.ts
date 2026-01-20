

/**
 * GPS 距离计算工具
 * 使用 Haversine 公式计算两点之间的距离
 */

// 地球半径（单位：米）
const EARTH_RADIUS_METERS = 6371000;

/**
 * 将角度转换为弧度
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * 使用 Haversine 公式计算两个 GPS 坐标之间的距离
 * 
 * @param lat1 - 第一个点的纬度
 * @param lon1 - 第一个点的经度
 * @param lat2 - 第二个点的纬度
 * @param lon2 - 第二个点的经度
 * @returns 距离（单位：米）
 */
export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

/**
 * GPS 签到校验结果
 */
export interface GpsCheckInResult {
    /** 是否在允许范围内 */
    isWithinRange: boolean;
    /** 实际距离（米） */
    distance: number;
    /** 最大允许距离（米）*/
    maxDistance: number;
    /** 提示消息 */
    message: string;
    /** 警告类型：NONE-无警告，WARNING-超范围警告，ERROR-禁止签到 */
    warningLevel: 'NONE' | 'WARNING' | 'ERROR';
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    /** 允许签到的最大距离（米）- 超过此距离显示警告但允许签到 */
    MAX_DISTANCE_WARNING: 500,
    /** 禁止签到的距离（米）- 超过此距离禁止签到（可选配置）*/
    MAX_DISTANCE_ERROR: Infinity, // 默认不禁止，只警告
};

/**
 * 验证签到位置是否在客户地址范围内
 * 
 * @param checkInLat - 签到位置纬度
 * @param checkInLon - 签到位置经度
 * @param targetLat - 目标位置纬度（客户地址）
 * @param targetLon - 目标位置经度（客户地址）
 * @param config - 可选配置
 * @returns GPS 校验结果
 */
export function validateGpsCheckIn(
    checkInLat: number,
    checkInLon: number,
    targetLat: number,
    targetLon: number,
    config?: {
        maxDistanceWarning?: number;
        maxDistanceError?: number;
    }
): GpsCheckInResult {
    const maxWarning = config?.maxDistanceWarning ?? DEFAULT_CONFIG.MAX_DISTANCE_WARNING;
    const maxError = config?.maxDistanceError ?? DEFAULT_CONFIG.MAX_DISTANCE_ERROR;

    const distance = calculateHaversineDistance(
        checkInLat,
        checkInLon,
        targetLat,
        targetLon
    );

    // 四舍五入到整数米
    const roundedDistance = Math.round(distance);

    if (roundedDistance <= maxWarning) {
        return {
            isWithinRange: true,
            distance: roundedDistance,
            maxDistance: maxWarning,
            message: `签到成功，距离客户地址 ${roundedDistance} 米`,
            warningLevel: 'NONE',
        };
    }

    if (roundedDistance > maxError) {
        return {
            isWithinRange: false,
            distance: roundedDistance,
            maxDistance: maxError,
            message: `签到失败：距离客户地址 ${roundedDistance} 米，超出最大允许距离 ${maxError} 米`,
            warningLevel: 'ERROR',
        };
    }

    // 超过警告距离但未超过禁止距离
    return {
        isWithinRange: true,
        distance: roundedDistance,
        maxDistance: maxWarning,
        message: `注意：距离客户地址较远（${roundedDistance} 米），建议确认位置是否正确`,
        warningLevel: 'WARNING',
    };
}

/**
 * 判断是否为迟到签到
 * 
 * @param scheduledTime - 预约时间
 * @param checkInTime - 实际签到时间
 * @param gracePeriodMinutes - 宽限时间（分钟），默认 15 分钟
 * @returns 迟到分钟数，0 表示未迟到
 */
export function calculateLateMinutes(
    scheduledTime: Date,
    checkInTime: Date,
    gracePeriodMinutes: number = 15
): number {
    const scheduledMs = scheduledTime.getTime();
    const checkInMs = checkInTime.getTime();
    const graceMs = gracePeriodMinutes * 60 * 1000;

    const diff = checkInMs - scheduledMs - graceMs;

    if (diff <= 0) {
        return 0; // 未迟到
    }

    return Math.ceil(diff / (60 * 1000)); // 迟到分钟数
}
