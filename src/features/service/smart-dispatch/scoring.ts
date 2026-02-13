

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
 * 计算两点间距�?(Haversine Formula) - 单位: km
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
 * 计算师傅与任务的匹配分数 (0-100)
 */
export function calculateWorkerScore(worker: Worker, task: TaskContext): number {
    let score = 0;

    // 1. 技能匹�?(Hard Check - usually filtered before scoring, but here we add bonus)
    // 假设已经 filter 过了
    score += 50; // 基础�?
    // 2. 距离评分 (Max 30�?
    if (worker.addressGeo && task.location) {
        const distance = calculateDistance(
            worker.addressGeo.lat, worker.addressGeo.lng,
            task.location.lat, task.location.lng
        );

        if (distance <= 5) score += 30; // 5km�?        else if (distance <= 10) score += 20;
        else if (distance <= 20) score += 10;
        else if (distance <= 50) score += 5;
        // >50km +0
    } else {
        // 无位置信息，给个平均�? 或者不加分
        score += 5;
    }

    // 3. 负荷/评分等其他逻辑 (略，暂给固定�?
    // 实际应根�?activeTasks 动态减�?
    return Math.min(score, 100);
}
