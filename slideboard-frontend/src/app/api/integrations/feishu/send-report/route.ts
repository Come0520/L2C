import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env'
import type { FeishuReportData, FeishuSendResponse } from '@/shared/types/api'


// Edge Runtime 配置
export const runtime = 'edge'

/**
 * 飞书报表推送 API
 * POST /api/integrations/feishu/send-report
 */
export async function POST(request: NextRequest) {
    try {
        const reportData: FeishuReportData = await request.json()

        // 验证必需字段
        if (!reportData.title || !reportData.content) {
            return NextResponse.json(
                {
                    success: false,
                    error: '报表标题和内容不能为空',
                } as FeishuSendResponse,
                { status: 400 }
            )
        }

        // 从环境变量获取飞书配置
        const webhookUrl = reportData.webhookUrl || env.FEISHU_WEBHOOK_URL

        if (!webhookUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: '飞书 Webhook URL 未配置',
                } as FeishuSendResponse,
                { status: 500 }
            )
        }

        // 构建飞书消息卡片
        const card = buildFeishuCard(reportData)

        // 发送到飞书
        const feishuResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                msg_type: 'interactive',
                card,
            }),
        })

        const result = await feishuResponse.json()

        if (result.code !== 0) {
            throw new Error(result.msg || '飞书消息发送失败')
        }

        return NextResponse.json({
            success: true,
            messageId: result.data?.message_id,
        } as FeishuSendResponse)
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '报表推送失败',
            } as FeishuSendResponse,
            { status: 500 }
        )
    }
}

/**
 * 构建飞书消息卡片
 */
function buildFeishuCard(reportData: FeishuReportData) {
    const { title, content, reportType, data } = reportData

    // 报表类型标签颜色
    const typeColors: Record<string, string> = {
        daily: 'blue',
        weekly: 'green',
        monthly: 'orange',
        custom: 'grey',
    }

    // 报表类型文本
    const typeText: Record<string, string> = {
        daily: '日报',
        weekly: '周报',
        monthly: '月报',
        custom: '自定义报表',
    }

    return {
        elements: [
            {
                tag: 'div',
                text: {
                    content: `**${title}**`,
                    tag: 'lark_md',
                },
            },
            {
                tag: 'div',
                text: {
                    content: content,
                    tag: 'lark_md',
                },
            },
            {
                tag: 'hr',
            },
            // 数据统计部分
            ...Object.entries(data).map(([key, value]) => ({
                tag: 'div',
                fields: [
                    {
                        is_short: true,
                        text: {
                            content: `**${key}**\n${value}`,
                            tag: 'lark_md',
                        },
                    },
                ],
            })),
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: `报表类型: ${typeText[reportType]} | 生成时间: ${new Date().toLocaleString('zh-CN')}`,
                    },
                ],
            },
        ],
        header: {
            template: typeColors[reportType] || 'blue',
            title: {
                content: typeText[reportType],
                tag: 'plain_text',
            },
        },
    }
}
