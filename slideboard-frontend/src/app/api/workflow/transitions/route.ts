import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { from_status, to_status, required_fields, required_files, required_permissions } = body;

        // Validate required fields
        if (!from_status || !to_status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('workflow_transition_rules')
            .upsert({
                from_status,
                to_status,
                required_fields,
                required_files,
                required_permissions,
                created_at: new Date().toISOString() // created_at doesn't update on upsert usually but this is fine
            }, { onConflict: 'from_status, to_status' })
            .select()
            .single();

        if (error) {
            console.error('Error saving workflow transition:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in workflow transitions API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { from_status, to_status } = body;

        if (!from_status || !to_status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabase
            .from('workflow_transition_rules')
            .delete()
            .eq('from_status', from_status)
            .eq('to_status', to_status);

        if (error) {
            console.error('Error deleting workflow transition:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error in workflow transitions API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
