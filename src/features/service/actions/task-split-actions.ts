'use server';

import { db } from '@/shared/api/db';
import { workerSkills, quoteItems } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';

/**
 * 任务拆分推荐逻辑
 * 根据报价单品类自动生成拆分建议
 */

// 品类到技能的映射
const CATEGORY_SKILL_MAP: Record<string, string> = {
    'CURTAIN': 'CURTAIN',
    'CURTAIN_FABRIC': 'CURTAIN',
    'CURTAIN_SHEER': 'CURTAIN',
    'CURTAIN_TRACK': 'CURTAIN',
    'WALLCLOTH': 'WALLCLOTH',
    'WALLPAPER': 'WALLCLOTH', // 墙纸归入墙布技能
    'WALLPANEL': 'WALLPANEL',
};

export interface SplitSuggestion {
    category: string;
    categoryLabel: string;
    itemCount: number;
    recommendedSkill: string;
    matchingWorkerCount?: number;
}

export interface SplitPlan {
    category: string;
    itemIds: string[];
    workerId?: string;
}

/**
 * 根据报价单分析商品品类，自动生成该报价所需的拆分任务与分配建议
 * @param quoteId - 定价或报价单实体的唯一主键
 * @returns 包含各子任务分解类目以及推荐相应安装技能的封装结果
 */
export async function suggestTaskSplit(quoteId: string): Promise<{
    success: boolean;
    data?: SplitSuggestion[];
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        // 1. 获取报价单项目
        const items = await db.query.quoteItems.findMany({
            where: and(
                eq(quoteItems.quoteId, quoteId),
                eq(quoteItems.tenantId, session.user.tenantId)
            ),
            with: {
                product: true,
            },
        });

        if (items.length === 0) {
            return { success: true, data: [] };
        }

        // 2. 按品类分组
        const validItems = items.filter(item => { if (item.quantity === undefined) return true; return (Number(item.quantity) || 0) > 0; }); if (validItems.length === 0) return { success: false, error: "可拆分的商品数量已被耗尽或原始数量异常" }; const categoryGroups = new Map<string, typeof items>();
        for (const item of items.filter(i => i.quantity === undefined || (Number(i.quantity) || 0) > 0)) {
            const category = item.product?.category || 'OTHER';
            const skillCategory = CATEGORY_SKILL_MAP[category] || 'OTHER';

            if (!categoryGroups.has(skillCategory)) {
                categoryGroups.set(skillCategory, []);
            }
            categoryGroups.get(skillCategory)!.push(item);
        }

        // 3. 生成拆分建议 (优化 N+1)
        const categories = Array.from(categoryGroups.keys());
        const skillTypesToSearch = categories.map(c => `INSTALL_${c}` as typeof workerSkills.$inferSelect['skillType']);

        let allMatchingSkills: typeof workerSkills.$inferSelect[] = [];
        if (skillTypesToSearch.length > 0) {
            allMatchingSkills = await db.query.workerSkills.findMany({
                where: and(
                    eq(workerSkills.tenantId, session.user.tenantId),
                    inArray(workerSkills.skillType, skillTypesToSearch)
                ),
            });
        }

        const suggestions: SplitSuggestion[] = categories.map((category) => {
            const categoryItems = categoryGroups.get(category)!;
            const targetSkill = `INSTALL_${category}`;
            const matchingCount = allMatchingSkills.filter(s => s.skillType === targetSkill).length;

            return {
                category,
                categoryLabel: getCategoryLabel(category),
                itemCount: categoryItems.length,
                recommendedSkill: targetSkill,
                matchingWorkerCount: matchingCount,
            };
        });

        return { success: true, data: suggestions };
    } catch (error) {
        logger.error('分析拆分建议失败:', error);
        return { success: false, error: '分析拆分建议失败' };
    }
}


const getCachedAvailableWorkers = unstable_cache(
    async (tenantId: string, skillType: string) => {
        const skills = await db.query.workerSkills.findMany({
            where: and(
                eq(workerSkills.tenantId, tenantId),
                eq(workerSkills.skillType, skillType as typeof workerSkills.$inferSelect['skillType'])
            ),
            with: {
                worker: true,
            },
        });

        return skills.map(s => ({
            id: s.workerId,
            name: s.worker?.name || null,
        }));
    },
    ['available-workers-by-skill'],
    { tags: ['worker-skills'] } // 标签设为静态，tenantId/skillType 是函数参数不可在此处引用
);

/**
 * 根据具体的技能类型要求获取所有支持的且当前可供派单的可用施工人员
 * 结果含有缓存时间控制，适用于大规模的自动排单运算
 * @param skillType - 标准化的技能类型标识符常量（例: 'INSTALL_CURTAIN' 等）
 * @returns 支持具有对应技能的安装或施工人员的用户列表数据对象
 */
export async function getAvailableWorkers(skillType: string): Promise<{
    success: boolean;
    data?: Array<{ id: string; name: string | null }>;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        const workers = await getCachedAvailableWorkers(session.user.tenantId, skillType);
        return { success: true, data: workers };
    } catch (error) {
        logger.error('获取师傅列表失败:', error);
        return { success: false, error: '获取师傅列表失败' };
    }
}

/**
 * 获取某个特定安装师/施工人员目前拥有的所有技能资格认定数据
 * @param workerId - 特定员工或施工师傅的用户 ID
 * @returns 包含当前工作人员所有的被认可技能标识字段列表响应
 */
export async function getWorkerSkills(workerId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        const skills = await db.query.workerSkills.findMany({
            where: and(
                eq(workerSkills.tenantId, session.user.tenantId),
                eq(workerSkills.workerId, workerId)
            ),
        });

        return { success: true, data: skills.map(s => s.skillType) };
    } catch (error) {
        logger.error('获取师傅技能失败:', error);
        return { success: false, error: '获取师傅技能失败' };
    }
}

/**
 * 批量更新或覆写某施工人员的技能池数据（先清空后全量替换模式）
 * 如果提供的技能数组为空，它将不抛出异常并默认清除全量原有技能
 * @param workerId - 施工人员或员工的目标 ID
 * @param skillTypes - 一组被更新为有效资格识别标识符的全新字符串数组
 * @returns 操作更新后表示是否完成或遇到问题的状态
 */
export async function updateWorkerSkills(workerId: string, skillTypes: string[]) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        // 1. 删除现有技能
        await db.delete(workerSkills)
            .where(and(
                eq(workerSkills.tenantId, session.user.tenantId),
                eq(workerSkills.workerId, workerId)
            ));

        // 2. 插入新技能
        if (skillTypes.length > 0) {
            await db.insert(workerSkills).values(
                skillTypes.map(skill => ({
                    tenantId: session.user.tenantId,
                    workerId,
                    skillType: skill as typeof workerSkills.$inferInsert['skillType'],
                }))
            );
        }

        return { success: true };
    } catch (error) {
        logger.error('更新师傅技能失败:', error);
        return { success: false, error: '更新师傅技能失败' };
    }
}

// 辅助函数
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        'CURTAIN': '窗帘',
        'WALLCLOTH': '墙布/墙纸',
        'WALLPANEL': '墙咔',
        'OTHER': '其他',
    };
    return labels[category] || category;
}
