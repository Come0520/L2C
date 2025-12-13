import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET() {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Workflow Definitions
        const { data: definitions, error: defError } = await supabase
            .from('workflow_definitions')
            .select('*')
            .order('order_index', { ascending: true });

        if (defError) {
            console.error('Error fetching workflow definitions:', defError);
            return NextResponse.json({ error: defError.message }, { status: 500 });
        }

        // 2. Fetch Transition Rules
        const { data: transitions, error: transError } = await supabase
            .from('workflow_transition_rules')
            .select('*');

        if (transError) {
            console.error('Error fetching workflow transitions:', transError);
            return NextResponse.json({ error: transError.message }, { status: 500 });
        }

        // 3. Construct Response
        return NextResponse.json({
            definitions,
            transitions,
        });
    } catch (error) {
        console.error('Unexpected error in workflow config API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
