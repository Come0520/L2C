import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// DELETE /api/slides/[id] - 删除幻灯片
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: '缺少幻灯片ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('slides')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: '删除幻灯片失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '幻灯片删除成功',
      slide_id: id
    });
  } catch (_) {
    return NextResponse.json(
      { error: '删除幻灯片失败' },
      { status: 500 }
    );
  }
}

// GET /api/slides/[id] - 获取单个幻灯片
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: '缺少幻灯片ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: slide, error } = await supabase
      .from('slides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: '获取幻灯片失败' },
        { status: 500 }
      );
    }

    if (!slide) {
      return NextResponse.json(
        { error: '幻灯片不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ slide });
  } catch (_) {
    return NextResponse.json(
      { error: '获取幻灯片失败' },
      { status: 500 }
    );
  }
}

// PUT /api/slides/[id] - 更新幻灯片
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '缺少幻灯片ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'content', 'status', 'is_public', 'thumbnail_url'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: updatedSlide, error } = await supabase
      .from('slides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: '更新幻灯片失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      slide: updatedSlide,
      message: '幻灯片更新成功'
    });
  } catch (_) {
    return NextResponse.json(
      { error: '更新幻灯片失败' },
      { status: 500 }
    );
  }
}
