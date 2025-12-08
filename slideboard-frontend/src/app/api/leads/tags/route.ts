import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';


/**
 * GET /api/leads/tags
 * Get all available lead tags with optional filtering
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');
        const isSystem = searchParams.get('isSystem');

        let query = supabase
            .from('lead_tags')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        // Apply filters
        if (category) {
            query = query.eq('tag_category', category);
        }
        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }
        if (isSystem !== null) {
            query = query.eq('is_system', isSystem === 'true');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching lead tags:', error);
            return NextResponse.json(
                { error: 'Failed to fetch lead tags', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in GET /api/leads/tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/leads/tags
 * Create a new custom lead tag
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const {
            name,
            tag_category = 'custom',
            tag_type,
            color = '#3B82F6',
            description,
            sort_order = 0,
        } = body;

        // Validation
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Tag name is required' },
                { status: 400 }
            );
        }

        // Check if tag name already exists
        const { data: existingTag } = await supabase
            .from('lead_tags')
            .select('id')
            .eq('name', name)
            .single();

        if (existingTag) {
            return NextResponse.json(
                { error: 'Tag with this name already exists' },
                { status: 409 }
            );
        }

        // Create new tag
        const { data, error } = await supabase
            .from('lead_tags')
            .insert({
                name,
                tag_category,
                tag_type,
                color,
                description,
                sort_order,
                is_system: false, // Custom tags are never system tags
                is_auto: false,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating lead tag:', error);
            return NextResponse.json(
                { error: 'Failed to create lead tag', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error in POST /api/leads/tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
