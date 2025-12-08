import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

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

    const { resourceType, resourceId, expiresInDays = 7, scope = 'read', maxUsage = 100 } = await request.json();

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate secure token using Web Crypto
    const uuid = crypto.randomUUID().replace(/-/g, '');
    const rand = new Uint8Array(32);
    crypto.getRandomValues(rand);
    let randHex = '';
    for (const b of rand) {
      randHex += b.toString(16).padStart(2, '0');
    }
    const plainToken = `${uuid}${randHex}${Date.now().toString(36)}`.slice(0, 128);

    // Hash the token for secure storage (SHA-256)
    const hashedToken = await hashToken(plainToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return plain token to the client, not the hashed one
    return NextResponse.json({ token: { ...data, token: plainToken } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
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

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ token: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
