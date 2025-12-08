import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * GET /api/leads/[id]/status-history
 * Get lead status history
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: leadId } = await params;

    // Call the RPC function to get status history
    const { data, error } = await supabase.rpc('get_lead_status_history', { p_lead_id: leadId });

    if (error) {
      console.error('Error getting lead status history:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    return new NextResponse(String(err), { status: 500 });
  }
}

/**
 * POST /api/leads/[id]/status-history
 * Create a new status change record
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { from_status, to_status, comment = '' } = body;

    // Validate required fields
    if (!from_status || !to_status) {
      return new NextResponse('From status and to status are required', { status: 400 });
    }

    // Insert the status change record
    const { data, error } = await supabase.from('lead_status_history').insert({
      lead_id: leadId,
      from_status,
      to_status,
      changed_by_id: user.id,
      changed_at: new Date().toISOString(),
      comment
    }).select();

    if (error) {
      console.error('Error creating lead status history:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    // Also update the lead's current status if needed
    await supabase.from('leads').update({
      status: to_status,
      last_status_change_by_id: user.id,
      last_status_change_at: new Date().toISOString()
    }).eq('id', leadId);

    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new NextResponse(String(err), { status: 500 });
  }
}
