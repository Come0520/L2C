import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * DELETE /api/sharing/tokens/[id]
 * Revoke a share token
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params
    const { error } = await supabase
      .from('share_tokens')
      .update({ is_active: false })
      .eq('id', id)
      .eq('created_by', user.id); // Only allow revoking own tokens

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/sharing/tokens/[id]
 * Update a share token's properties
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await request.json();

    // Validate update data - only allow updating certain properties
    const allowedFields = ['scope', 'max_usage', 'is_active'] as const;
    const validUpdateData: { scope?: string; max_usage?: number; is_active?: boolean } = {};

    for (const key in updateData as Record<string, unknown>) {
      if (allowedFields.includes(key as typeof allowedFields[number])) {
        const value = (updateData as Record<string, unknown>)[key];
        if (key === 'scope' && typeof value === 'string') validUpdateData.scope = value;
        if (key === 'max_usage' && typeof value === 'number') validUpdateData.max_usage = value;
        if (key === 'is_active' && typeof value === 'boolean') validUpdateData.is_active = value;
      }
    }

    // Ensure we have at least one field to update
    if (Object.keys(validUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the token
    const { data: updatedToken, error } = await supabase
      .from('share_tokens')
      .update(validUpdateData)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json(updatedToken, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
