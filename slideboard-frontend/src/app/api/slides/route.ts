import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// GET /api/slides - 获取用户幻灯片列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');
    const search = searchParams.get('search') || '';

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('slides')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add pagination
    const startIndex = (page - 1) * pageSize;
    query = query.range(startIndex, startIndex + pageSize - 1);

    const { data: slides, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: '获取幻灯片列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slides: slides || [],
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize),
    });
  } catch (_) {
    return NextResponse.json(
      { error: '获取幻灯片列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/slides - 创建新幻灯片
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, template_id, user_id, content } = body;

    if (!title || !user_id) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const slideData = {
      user_id,
      title,
      description: description || '',
      status: 'draft',
      is_public: false,
      content: content || (template_id ? { template_id } : {}),
    };

    const { data: newSlide, error } = await supabase
      .from('slides')
      .insert(slideData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: '创建幻灯片失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slide: newSlide,
      message: '幻灯片创建成功',
    });
  } catch (_) {
    return NextResponse.json(
      { error: '创建幻灯片失败' },
      { status: 500 }
    );
  }
}
