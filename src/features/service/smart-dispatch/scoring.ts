
interface Worker {
    id: string;
    skills: string[]; // JSONB - array of skill strings
    addressGeo?: { lat: number; lng: number } | null;
    // ... other fields
}

interface TaskContext {
    category: string; // 'CURTAIN', 'WALLPAPER'
    location?: { lat: number; lng: number } | null;
}

/**
 * 计算两点间距离 (Haversine Formula) - 单位: km
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 计算师傅与任务的匹配分数
 * 
 * 评分维度：
 * 1. 基础分 (50分)：表示具备基本的行业准入资格。
 * 2. 距离评分 (最高30分)：基于 Haversine 公式计算地理距离。
 *    - ≤ 5km: 30分
 *    - ≤ 10km: 20分
 *    - ≤ 20km: 10分
 *    - ≤ 50km: 5分
 * 3. 兜底策略：无位置信息时给予 5 分鼓励分。
 * 
 * @param {Worker} worker - 师傅信息，包含技能及地理位置
 * @param {TaskContext} task - 任务上下文，包含类别及送货地址坐标
 * @returns {number} 最终匹配得分 (0-100)
 */
export function calculateWorkerScore(worker: Worker, task: TaskContext): number {
    let score = 0;

    // 1. 技能匹配 (Hard Check - usually filtered before scoring, but here we add bonus)
    // 假设已经 filter 过了
    score += 50; // 基础分

    // 2. 距离评分 (Max 30分)
    if (worker.addressGeo && task.location) {
        const distance = calculateDistance(
            worker.addressGeo.lat, worker.addressGeo.lng,
            task.location.lat, task.location.lng
        );

        if (distance <= 5) score += 30; // 5km以内
        else if (distance <= 10) score += 20;
        else if (distance <= 20) score += 10;
        else if (distance <= 50) score += 5;
        // >50km +0
    } else {
        // 无位置信息，给个平均分，或者不加分
        score += 5;
    }

    // 3. 负荷/评分等其他逻辑 (略，暂给固定值)
    // 实际应根据 activeTasks 动态减分
    return Math.min(score, 100);
}
