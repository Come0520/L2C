'use server';

import { db } from '@/shared/api/db';
import { landingTestimonials } from '@/shared/api/schema/landing-testimonials';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getTestimonialsList() {
    try {
        const list = await db
            .select()
            .from(landingTestimonials)
            .orderBy(desc(landingTestimonials.createdAt));

        return {
            success: true,
            data: list,
        };
    } catch (error) {
        console.error('获取评论列表失败:', error);
        return { success: false, error: '获取评论列表失败' };
    }
}

export async function toggleTestimonialApproval(id: string, isApproved: boolean) {
    try {
        await db
            .update(landingTestimonials)
            .set({ isApproved, updatedAt: new Date() })
            .where(eq(landingTestimonials.id, id));

        // 清除前端缓存，确保落地页实时更新
        revalidatePath('/', 'page');

        return { success: true };
    } catch (error) {
        console.error('更新审核状态失败:', error);
        return { success: false, error: '更新失败' };
    }
}

export async function deleteTestimonial(id: string) {
    try {
        await db
            .delete(landingTestimonials)
            .where(eq(landingTestimonials.id, id));

        revalidatePath('/', 'page');

        return { success: true };
    } catch (error) {
        console.error('删除评论失败:', error);
        return { success: false, error: '删除失败' };
    }
}
