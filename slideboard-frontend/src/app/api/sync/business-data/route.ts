import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env'
import { dataSyncService } from '@/services/dataSync'

// 配置为Edge Function
export const runtime = 'edge';

// GET请求：手动触发数据同步
export async function GET(request: NextRequest) {
  try {
    // 从查询参数获取配置
    const searchParams = request.nextUrl.searchParams
    const feishuAppToken = searchParams.get('appToken') || env.FEISHU_BUSINESS_DATA_APP_TOKEN
    const feishuTableId = searchParams.get('tableId') || env.FEISHU_BUSINESS_DATA_TABLE_ID
    const date = searchParams.get('date')
    
    // 验证配置
    if (!feishuAppToken || !feishuTableId) {
      return NextResponse.json(
        { success: false, message: '缺少飞书应用配置' },
        { status: 400 }
      )
    }
    
    // 执行数据同步
    const result = await dataSyncService.syncBusinessDataToFeishu(
      feishuAppToken, 
      feishuTableId, 
      date || undefined
    )
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// POST请求：配置数据同步
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feishuAppToken, feishuTableId, date } = body
    
    // 验证配置
    if (!feishuAppToken || !feishuTableId) {
      return NextResponse.json(
        { success: false, message: '缺少飞书应用配置' },
        { status: 400 }
      )
    }
    
    // 执行数据同步
    const result = await dataSyncService.syncBusinessDataToFeishu(
      feishuAppToken, 
      feishuTableId, 
      date
    )
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// 定时任务配置示例（使用Vercel Cron Jobs）
// 在vercel.json中配置：
// {
//   "crons": [
//     {
//       "path": "/api/sync/business-data",
//       "schedule": "0 8 * * *" // 每天早上8点执行
//     }
//   ]
// }
