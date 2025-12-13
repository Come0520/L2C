import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { code, name, category, order_index, color, description } = body;

        // Validate required fields
        if (!code || !name || !category || !color) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('workflow_definitions')
            .upsert({
                code,
                name,
                category,
                order_index,
                color,
                description,
                is_system: false, // User-created statuses are not system
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving workflow definition:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in workflow definitions API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
        }

        // Check if system status
        const { data: existing } = await supabase
            .from('workflow_definitions')
            .select('is_system')
            .eq('code', code)
            .single();

        if (existing?.is_system) {
            return NextResponse.json({ error: 'Cannot delete system status' }, { status: 403 });
        }

        const { error } = await supabase
            .from('workflow_definitions')
            .delete()
            .eq('code', code);

        if (error) {
            console.error('Error deleting workflow definition:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error in workflow definitions API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
