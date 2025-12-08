import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/leads/[id]/tags
 * Assign tags to a lead
 */
export async function POST(
    request: NextRequest,
    { params }: any
) {
    try {
        const supabase = await createClient();
        const leadId = params.id;
        const body = await request.json();

        const { tag_ids, assigned_by_id } = body;

        // Validation
        if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
            return NextResponse.json(
                { error: 'tag_ids must be a non-empty array' },
                { status: 400 }
            );
        }

        if (!assigned_by_id) {
            return NextResponse.json(
                { error: 'assigned_by_id is required' },
                { status: 400 }
            );
        }

        // Check if lead exists
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Use the assign_tag_to_lead function for each tag
        const results = [];
        const errors = [];

        for (const tagId of tag_ids) {
            const { data, error } = await supabase.rpc('assign_tag_to_lead', {
                p_lead_id: leadId,
                p_tag_id: tagId,
                p_assigned_by_id: assigned_by_id,
            });

            if (error) {
                errors.push({ tag_id: tagId, error: error.message });
            } else {
                results.push({ tag_id: tagId, success: data });
            }
        }

        // Return response with both successes and errors
        return NextResponse.json(
            {
                data: results,
                errors: errors.length > 0 ? errors : undefined,
            },
            { status: errors.length === tag_ids.length ? 500 : 200 }
        );
    } catch (error) {
        console.error('Unexpected error in POST /api/leads/[id]/tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/leads/[id]/tags
 * Get all tags assigned to a lead
 */
export async function GET(
    _request: NextRequest,
    { params }: any
) {
    try {
        const supabase = await createClient();
        const leadId = params.id;

        // Use the get_lead_tags function
        const { data, error } = await supabase.rpc('get_lead_tags', {
            p_lead_id: leadId,
        });

        if (error) {
            console.error('Error fetching lead tags:', error);
            return NextResponse.json(
                { error: 'Failed to fetch lead tags', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in GET /api/leads/[id]/tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/leads/[id]/tags/[tagId]
 * Remove a tag from a lead
 */
export async function DELETE(
    request: NextRequest,
    { params }: any
) {
    try {
        const supabase = await createClient();
        const leadId = params.id;
        const { searchParams } = new URL(request.url);
        const tagId = searchParams.get('tagId');
        const removedById = searchParams.get('removedById');

        if (!tagId) {
            return NextResponse.json(
                { error: 'tagId is required' },
                { status: 400 }
            );
        }

        if (!removedById) {
            return NextResponse.json(
                { error: 'removedById is required' },
                { status: 400 }
            );
        }

        // Use the remove_tag_from_lead function
        const { data, error } = await supabase.rpc('remove_tag_from_lead', {
            p_lead_id: leadId,
            p_tag_id: tagId,
            p_removed_by_id: removedById,
        });

        if (error) {
            console.error('Error removing tag from lead:', error);
            return NextResponse.json(
                { error: 'Failed to remove tag', details: error.message },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Cannot remove auto-assigned system tags' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Tag removed successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Unexpected error in DELETE /api/leads/[id]/tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
