'use client';

import { Loader2, Tag as TagIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { leadService } from '@/services/leads.client'

import { TagSelector } from './TagSelector';

interface Tag {
    id: string;
    name: string;
    tag_category: string;
    color: string;
    is_system: boolean;
    is_auto: boolean;
}

interface LeadTagsInputProps {
    leadId: string;
    currentUserId: string;
    className?: string;
    onTagsChanged?: () => void;
}

export function LeadTagsInput({
    leadId,
    currentUserId,
    className = '',
    onTagsChanged,
}: LeadTagsInputProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const allTags = await leadService.getAvailableLeadTags({ isActive: true });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAvailableTags((allTags || []) as any[]);

            const leadTags = await leadService.getLeadTags(leadId);

            // Map lead tags to Tag objects (leadTags structure might be different based on join)
            const mappedAssignedTags = (leadTags || []).map((item: any) => ({
                id: item.id ?? item.tag_id ?? '',
                name: item.name ?? item.tag_name ?? '',
                tag_category: item.tag_category ?? 'custom',
                color: item.color ?? item.tag_color ?? '#3B82F6',
                is_system: Boolean(item.is_system),
                is_auto: Boolean(item.is_auto),
            }));

            setAssignedTags(mappedAssignedTags);
        } catch (error) {
            console.error('Error fetching tag data:', error);
            toast.error('获取标签数据失败');
        } finally {
            setIsLoading(false);
        }
    }, [leadId]);

    useEffect(() => {
        if (leadId) {
            fetchData();
        }
    }, [fetchData, leadId]);

    const handleTagSelect = async (tag: Tag) => {
        setIsUpdating(true);
        try {
            await leadService.assignTagsToLead(leadId, [tag.id], currentUserId);

            toast.success(`已添加标签: ${tag.name}`);
            // Optimistic update or refetch
            setAssignedTags(prev => [...prev, tag]);
            onTagsChanged?.();
        } catch (error: any) {
            console.error('Error assigning tag:', error);
            toast.error('添加标签失败', { description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTagRemove = async (tagId: string) => {
        const tagToRemove = assignedTags.find(t => t.id === tagId);
        if (tagToRemove?.is_auto) {
            toast.error('无法手动移除系统自动标签');
            return;
        }

        setIsUpdating(true);
        try {
            await leadService.removeTagFromLead(leadId, tagId, currentUserId);

            toast.success(`已移除标签: ${tagToRemove?.name ?? ''}`);
            setAssignedTags(prev => prev.filter(t => t.id !== tagId));
            onTagsChanged?.();
        } catch (error: any) {
            console.error('Error removing tag:', error);
            toast.error('移除标签失败', { description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center p-8 ${className}`} role="status" aria-live="polite">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">加载中</span>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-blue-500" />
                    线索标签
                </h3>
                {isUpdating && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>

            <TagSelector
                availableTags={availableTags}
                selectedTags={assignedTags}
                onTagSelect={handleTagSelect}
                onTagRemove={handleTagRemove}
            />
        </div>
    );
}
