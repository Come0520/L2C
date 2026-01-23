'use server';

import { db } from '@/shared/api/db';
import { workerSkills, quoteItems, quotes, installTasks, measureTasks } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';

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
 * 根据报价单分析品类，生成拆分建议
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
        const categoryGroups = new Map<string, typeof items>();
        for (const item of items) {
            const category = item.product?.category || 'OTHER';
            const skillCategory = CATEGORY_SKILL_MAP[category] || 'OTHER';

            if (!categoryGroups.has(skillCategory)) {
                categoryGroups.set(skillCategory, []);
            }
            categoryGroups.get(skillCategory)!.push(item);
        }

        // 3. 生成拆分建议
        const suggestions: SplitSuggestion[] = [];

        for (const [category, categoryItems] of categoryGroups) {
            // 查询该品类有多少师傅可接单
            const matchingSkills = await db.query.workerSkills.findMany({
                where: and(
                    eq(workerSkills.tenantId, session.user.tenantId),
                    eq(workerSkills.skillType, `INSTALL_${category}` as any)
                ),
            });

            suggestions.push({
                category,
                categoryLabel: getCategoryLabel(category),
                itemCount: categoryItems.length,
                recommendedSkill: `INSTALL_${category}`,
                matchingWorkerCount: matchingSkills.length,
            });
        }

        return { success: true, data: suggestions };
    } catch (error) {
        console.error('分析拆分建议失败:', error);
        return { success: false, error: '分析拆分建议失败' };
    }
}

/**
 * 获取可接单的师傅列表（按技能筛选）
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
        const skills = await db.query.workerSkills.findMany({
            where: and(
                eq(workerSkills.tenantId, session.user.tenantId),
                eq(workerSkills.skillType, skillType as any)
            ),
            with: {
                worker: true,
            },
        });

        const workers = skills.map(s => ({
            id: s.workerId,
            name: s.worker?.name || null,
        }));

        return { success: true, data: workers };
    } catch (error) {
        console.error('获取师傅列表失败:', error);
        return { success: false, error: '获取师傅列表失败' };
    }
}

/**
 * 获取或更新师傅技能
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
        console.error('获取师傅技能失败:', error);
        return { success: false, error: '获取师傅技能失败' };
    }
}

/**
 * 更新师傅技能（批量替换）
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
                    skillType: skill as any,
                }))
            );
        }

        return { success: true };
    } catch (error) {
        console.error('更新师傅技能失败:', error);
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
