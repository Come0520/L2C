// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/leads/tags/[id]
 * Get a specific lead tag by ID
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: tagId } = await params;

        const { data, error } = await supabase
            .from('lead_tags')
            .select('*')
            .eq('id', tagId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Tag not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching lead tag:', error);
            return NextResponse.json(
                { error: 'Failed to fetch lead tag', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in GET /api/leads/tags/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/leads/tags/[id]
 * Update a lead tag
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: tagId } = await params;
        const body = await request.json();

        // Check if tag exists and is not a system tag
        const { data: existingTag, error: fetchError } = await supabase
            .from('lead_tags')
            .select('is_system')
            .eq('id', tagId)
            .single();

        if (fetchError || !existingTag) {
            return NextResponse.json(
                { error: 'Tag not found' },
                { status: 404 }
            );
        }

        if (existingTag.is_system) {
            return NextResponse.json(
                { error: 'Cannot modify system tags' },
                { status: 403 }
            );
        }

        // Extract allowed fields for update
        const {
            name,
            tag_category: tagCategory,
            tag_type: tagType,
            color,
            description,
            sort_order: sortOrder,
            is_active: isActive,
        } = body as Record<string, unknown>;

        interface LeadTagUpdateInput {
            name?: string;
            tag_category?: string;
            tag_type?: string;
            color?: string;
            description?: string;
            sort_order?: number;
            is_active?: boolean;
        }
        const updateData: Partial<LeadTagUpdateInput> = {};
        if (name !== undefined) updateData.name = String(name);
        if (tagCategory !== undefined) updateData.tag_category = String(tagCategory);
        if (tagType !== undefined) updateData.tag_type = String(tagType);
        if (color !== undefined) updateData.color = String(color);
        if (description !== undefined) updateData.description = String(description);
        if (sortOrder !== undefined) updateData.sort_order = Number(sortOrder);
        if (isActive !== undefined) updateData.is_active = Boolean(isActive);

        const { data, error } = await supabase
            .from('lead_tags')
            .update(updateData)
            .eq('id', tagId)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead tag:', error);
            return NextResponse.json(
                { error: 'Failed to update lead tag', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in PATCH /api/leads/tags/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/leads/tags/[id]
 * Delete a custom lead tag (soft delete by setting is_active = false)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: tagId } = await params;

        // Check if tag exists and is not a system tag
        const { data: existingTag, error: fetchError } = await supabase
            .from('lead_tags')
            .select('is_system')
            .eq('id', tagId)
            .single();

        if (fetchError || !existingTag) {
            return NextResponse.json(
                { error: 'Tag not found' },
                { status: 404 }
            );
        }

        if (existingTag.is_system) {
            return NextResponse.json(
                { error: 'Cannot delete system tags' },
                { status: 403 }
            );
        }

        // Soft delete by setting is_active = false
        const { data, error } = await supabase
            .from('lead_tags')
            .update({ is_active: false })
            .eq('id', tagId)
            .select()
            .single();

        if (error) {
            console.error('Error deleting lead tag:', error);
            return NextResponse.json(
                { error: 'Failed to delete lead tag', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in DELETE /api/leads/tags/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
