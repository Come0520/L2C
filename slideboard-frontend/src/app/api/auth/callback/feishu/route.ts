import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * 飞书扫码登录回调 API
 * 支持 GET (Redirect 模式) 和 POST (AJAX 模式)
 */

async function handleFeishuLogin(code: string, supabase: any) {
  const APP_ID = process.env.NEXT_PUBLIC_FEISHU_APP_ID;
  const APP_SECRET = process.env.FEISHU_APP_SECRET;

  if (!APP_ID || !APP_SECRET) {
    throw new Error('服务端飞书配置缺失');
  }

  // 1. 获取 app_access_token (自建应用)
  const appTokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });

  const appTokenData = await appTokenRes.json();
  if (appTokenData.code !== 0) {
    console.error('Feishu app_access_token error:', appTokenData);
    throw new Error('飞书服务连接失败 (app_token)');
  }
  const appAccessToken = appTokenData.app_access_token;

  // 2. 获取 user_access_token
  const userTokenRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/oidc/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appAccessToken}`
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code
    }),
  });

  const userTokenData = await userTokenRes.json();
  if (userTokenData.code !== 0) {
    console.error('Feishu user_access_token error:', userTokenData);
    throw new Error('飞书登录验证失败 (user_token)');
  }
  const userAccessToken = userTokenData.data.access_token;

  // 3. 获取用户信息
  const userInfoRes = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userAccessToken}`
    }
  });

  const userInfoData = await userInfoRes.json();
  if (userInfoData.code !== 0) {
    console.error('Feishu user_info error:', userInfoData);
    throw new Error('获取用户信息失败');
  }

  const { open_id, union_id, name, avatar_url, mobile, email } = userInfoData.data;
  
  console.log('Feishu User Info:', { name, hasMobile: !!mobile, hasEmail: !!email, open_id });

  // 4. 在 Supabase 中查找用户
  // 逻辑：a. 优先匹配 feishu_open_id b. 其次匹配 mobile c. 再次匹配 email
  
  let matchedUser = null;

  // a. 检查 open_id
  const { data: userByOpenId } = await supabase
    .from('users')
    .select('id, email, phone')
    .eq('feishu_open_id', open_id)
    .single();
    
  if (userByOpenId) {
    matchedUser = userByOpenId;
  } else {
    // b. 检查 mobile
    if (mobile) {
      const { data: userByMobile } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('phone', mobile)
        .single();
      
      if (userByMobile) {
        matchedUser = userByMobile;
        // 自动绑定 open_id
        await supabase.from('users').update({ feishu_open_id: open_id, feishu_union_id: union_id }).eq('id', userByMobile.id);
      }
    }

    // c. 检查 email
    if (!matchedUser && email) {
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('email', email)
        .single();
        
      if (userByEmail) {
        matchedUser = userByEmail;
        // 自动绑定
        await supabase.from('users').update({ feishu_open_id: open_id, feishu_union_id: union_id }).eq('id', userByEmail.id);
      }
    }
  }

  if (!matchedUser) {
    throw new Error('未找到匹配的账户，请联系管理员添加');
  }

  // 5. 为用户创建 Supabase 会话
  const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
    userId: matchedUser.id,
    expiresIn: 60 * 60 * 24 * 7, // 7 天
  });

  if (sessionError) {
    throw new Error('创建会话失败: ' + sessionError.message);
  }

  return session;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    const session = await handleFeishuLogin(code, supabase);
    
    // 设置 Cookie
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    // 登录成功，跳转到 Dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err: any) {
    console.error('Feishu Callback Error:', err);
    // 跳转回登录页并显示错误
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url));
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const code = body.code || body.tmp_code;

    if (!code) {
      return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 });
    }

    const session = await handleFeishuLogin(code, supabase);

    return NextResponse.json({ 
      success: true, 
      session 
    });

  } catch (error: any) {
    console.error('Feishu login error:', error);
    return NextResponse.json({ error: error.message || '登录失败' }, { status: 500 }); // 使用 500 或 403 取决于错误类型，这里统称 500 简化
  }
}
