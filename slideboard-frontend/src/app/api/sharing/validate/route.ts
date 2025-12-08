import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Define database row types
interface ShareTokenRow {
  id: string;
  token: string;
  resource_type: 'quote' | 'order';
  resource_id: string;
  is_active: boolean;
  expires_at: string;
  usage_count: number;
  max_usage: number;
}

interface QuoteVersionItem {
  id: string;
  [key: string]: any;
}

interface QuoteVersion {
  id: string;
  items: QuoteVersionItem[];
  [key: string]: any;
}

interface QuoteRow {
  id: string;
  versions: QuoteVersion[];
  [key: string]: any;
}

interface SalesOrderRow {
  id: string;
  [key: string]: any;
}

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
 * GET /api/sharing/validate?token=xxx
 * Validate a share token and return the resource
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabase = await createClient();

    // Validate token by comparing SHA-256 hash
    const hashed = await hashToken(token);
    const { data: tokenData, error: tokenError } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('token', hashed)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<ShareTokenRow>();
    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (!tokenData.is_active) {
      return NextResponse.json({ error: 'Token is inactive' }, { status: 403 });
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 403 });
    }

    // Check usage count limit
    if (tokenData.usage_count >= tokenData.max_usage) {
      return NextResponse.json({ error: 'Token usage limit exceeded' }, { status: 403 });
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from('share_tokens')
      .update({ usage_count: tokenData.usage_count + 1 })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Failed to update token usage count:', updateError);
      // Continue with request even if usage count update fails
    }

    // Fetch the resource
    let resource: QuoteRow | SalesOrderRow;
    const resourceType = tokenData.resource_type;
    const resourceId = tokenData.resource_id;

    if (resourceType === 'quote') {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
                    *,
                    versions:quote_versions(
                        *,
                        items:quote_items(*)
                    )
                `)
        .eq('id', resourceId)
        .single<QuoteRow>();

      if (error || !data) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      resource = data;
    } else if (resourceType === 'order') {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', resourceId)
        .single<SalesOrderRow>();

      if (error || !data) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      resource = data;
    } else {
      return NextResponse.json({ error: 'Unknown resource type' }, { status: 400 });
    }

    return NextResponse.json({
      resourceType,
      resource
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
