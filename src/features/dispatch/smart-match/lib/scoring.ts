
/**
 * 工人评分算法
 * 用于智能派单推荐
 */

interface WorkerProfile {
    id: string;
    skills: string[]; // ['CURTAIN', 'TRACK', 'WALLCLOTH']
    activeTaskCount: number;
    avgRating?: number; // 0-5
}

interface TaskRequirement {
    category: string; // 'CURTAIN_FABRIC' | 'CURTAIN_TRACK' ...
}

/**
 * 计算工人的匹配得分(0-100)
 */
export function calculateWorkerScore(worker: WorkerProfile, task: TaskRequirement): number {
    let score = 0;

    // 1. 技能匹配(权重 50) - 使用 Set 优化查找 O(1)
    // 根据任务分类映射到技能标签
    const requiredSkill = getRequiredSkill(task.category);
    const workerSkills = new Set(worker.skills);
    if (workerSkills.has(requiredSkill)) {
        score += 50;
    } else if (workerSkills.has('ALL')) {
        score += 40; // 全能工稍低优先度，留给专人专做
    } else {
        return 0; // 技能不匹配直接 0 分
    }

    // 2. 负载情况 (权重 30)
    // 理想负载 0-2 单，超 5 单负载过重
    if (worker.activeTaskCount === 0) {
        score += 30; // 空闲
    } else if (worker.activeTaskCount < 3) {
        score += 20; // 正常
    } else if (worker.activeTaskCount < 5) {
        score += 10; // 忙碌
    } else {
        score -= 10; // 爆单 (扣分)
    }

    // 3. 服务评分 (权重 20)
    // 5 分 → 20, 4 分 → 16, 以此类推
    if (worker.avgRating) {
        score += (worker.avgRating / 5) * 20;
    } else {
        score += 10; // 无评分默认给中间分
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * 根据任务品类映射到技能标签
 */
function getRequiredSkill(category: string): string {
    if (category.includes('CURTAIN')) return 'CURTAIN';
    if (category.includes('WALL')) return 'WALLCLOTH';
    return 'General';
}

