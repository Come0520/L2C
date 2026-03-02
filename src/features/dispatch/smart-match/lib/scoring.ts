/**
 * 工人评分算法模块
 *
 * 提供基于多维度加权的工人匹配评分能力，用于智能派单推荐系统。
 * 评分维度包括：技能匹配（权重 50%）、工作负载（权重 30%）、服务评价（权重 20%）。
 *
 * @module scoring
 */

/**
 * 工人档案接口
 *
 * 包含工人的基本技能信息、当前工作负载和历史服务评价，
 * 用于计算工人与任务的匹配度评分。
 *
 * @property id - 工人的唯一标识 ID
 * @property skills - 工人具备的技能标签列表（如 'CURTAIN'、'TRACK'、'WALLCLOTH'、'ALL'）
 * @property activeTaskCount - 当前正在进行的任务数量（用于负载评估）
 * @property avgRating - 历史平均服务评分（0-5 分制），可选
 */
interface WorkerProfile {
  id: string;
  skills: string[];
  activeTaskCount: number;
  avgRating?: number;
}

/**
 * 任务需求接口
 *
 * 描述待匹配任务的基本需求，用于判断工人技能是否符合。
 *
 * @property category - 任务品类标识（如 'CURTAIN_FABRIC'、'CURTAIN_TRACK'、'WALLCLOTH' 等）
 */
interface TaskRequirement {
  category: string;
}

/**
 * 计算工人与任务的综合匹配得分
 *
 * 采用三维度加权评分算法：
 * 1. **技能匹配**（权重 50 分）：精确匹配 +50，全能工 +40，不匹配直接返回 0
 * 2. **工作负载**（权重 30 分）：空闲 +30，正常(1-2单) +20，忙碌(3-4单) +10，爆单(≥5单) -10
 * 3. **服务评价**（权重 20 分）：按 5 分制线性映射到 0-20 分，无评分给中间分 10
 *
 * 最终得分限制在 0-100 之间。
 *
 * @param worker - 候选工人档案
 * @param task - 待匹配的任务需求
 * @returns 匹配得分（0-100），分数越高表示匹配度越好
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
 * 根据任务品类名称映射到对应的技能标签
 *
 * 映射规则：
 * - 包含 'CURTAIN' → 'CURTAIN'（窗帘类）
 * - 包含 'WALL' → 'WALLCLOTH'（墙布类）
 * - 其他 → 'General'（通用技能）
 *
 * @param category - 任务品类标识字符串
 * @returns 对应的技能标签
 */
function getRequiredSkill(category: string): string {
  if (category.includes('CURTAIN')) return 'CURTAIN';
  if (category.includes('WALL')) return 'WALLCLOTH';
  return 'General';
}
