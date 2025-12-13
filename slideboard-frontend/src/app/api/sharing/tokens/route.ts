import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Validation schema for creating a token
const createTokenSchema = z.object({
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  expiresInDays: z.number().int().min(0).default(7),
  scope: z.enum(['view', 'comment', 'edit']).default('view'),
  maxUsage: z.number().int().min(0).default(100),
});

// Helper to hash token securely
async function hashToken(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * POST /api/sharing/tokens
 * Generate a new share token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const result = createTokenSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { resourceType, resourceId, expiresInDays, scope, maxUsage } = result.data;

    // Generate secure token using Web Crypto
    const uuid = crypto.randomUUID().replace(/-/g, '');
    const rand = new Uint8Array(32);
    crypto.getRandomValues(rand);
    let randHex = '';
    for (const b of rand) {
      randHex += b.toString(16).padStart(2, '0');
    }
    // Create a high-entropy token
    const plainToken = `${uuid}${randHex}${Date.now().toString(36)}`.slice(0, 128);

    // Hash the token for secure storage (SHA-256)
    const hashedToken = await hashToken(plainToken);

    const expiresAt = new Date();
    if (expiresInDays > 0) {
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    } else {
        // If 0, set to a very distant future (e.g., 100 years) or handle as null if DB supports
        // For now, let's say 100 years for "permanent" if DB requires a date, or check logic
        // The original code did: expiresAt.setDate(expiresAt.getDate() + expiresInDays); which is wrong for 0 if it means forever.
        // But the previous code just added 0 days which means expires now.
        // Let's assume 0 means "forever" effectively, so we add 100 years.
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    }

    const { data, error } = await supabase
      .from('share_tokens')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        token: hashedToken,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        scope,
        usage_count: 0,
        max_usage: maxUsage
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create share token' }, { status: 500 });
    }

    // Return plain token to the client, not the hashed one
    // We attach the plain token to the response object so the client can display it once
    const responseData = data ? { ...data, token: plainToken } : null;
    return NextResponse.json({ token: responseData });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/sharing/tokens?resourceType=quote&resourceId=xxx
 * Get active token for a resource
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    // If resource details provided, get specific active token
    if (resourceType && resourceId) {
      const { data, error } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
      }

      return NextResponse.json({ token: data });
    }

    // Otherwise, list all tokens created by the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    return NextResponse.json({ tokens: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
