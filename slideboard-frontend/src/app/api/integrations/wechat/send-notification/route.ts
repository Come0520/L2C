import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env'
import type { WechatNotificationData, WechatSendResponse } from '@/shared/types/integrations'

// Edge Runtime 配置
export const runtime = 'edge'

/**
 * 微信通知推送 API
 * POST /api/integrations/wechat/send-notification
 */
export async function POST(request: NextRequest) {
    try {
        const notificationData: WechatNotificationData = await request.json()

        // 验证必需字段
        if (!notificationData.content) {
            return NextResponse.json(
                {
                    success: false,
                    error: '通知内容不能为空',
                } as WechatSendResponse,
                { status: 400 }
            )
        }

        // 从环境变量获取微信配置
        const appId = env.WECHAT_APP_ID
        const appSecret = env.WECHAT_APP_SECRET
        const webhookUrl = env.WECHAT_WEBHOOK_URL

        if (!appId || !appSecret) {
            return NextResponse.json(
                {
                    success: false,
                    error: '微信配置未设置',
                } as WechatSendResponse,
                { status: 500 }
            )
        }

        // 获取 Access Token
        const accessToken = await getWechatAccessToken(appId, appSecret)

        // 根据消息类型发送
        let messageId: string | undefined

        if (notificationData.type === 'template' && notificationData.templateId) {
            // 发送模板消息
            messageId = await sendTemplateMessage(
                accessToken,
                notificationData.templateId,
                notificationData.toUsers || [],
                notificationData.data || {}
            )
        } else if (webhookUrl) {
            // 使用机器人 Webhook 发送（企业微信）
            messageId = await sendWebhookMessage(webhookUrl, notificationData)
        } else {
            // 发送文本消息（需要实现客服消息接口）
            throw new Error('暂不支持此消息类型')
        }

        return NextResponse.json({
            success: true,
            messageId,
        } as WechatSendResponse)
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '通知推送失败',
            } as WechatSendResponse,
            { status: 500 }
        )
    }
}

/**
 * 获取微信 Access Token
 */
async function getWechatAccessToken(appId: string, appSecret: string): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.errcode) {
        throw new Error(`获取 Access Token 失败: ${data.errmsg}`)
    }

    return data.access_token
}

/**
 * 发送模板消息
 */
async function sendTemplateMessage(
    accessToken: string,
    templateId: string,
    toUsers: string[],
    data: Record<string, any>
): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`

    // 转换数据格式为微信模板消息格式
    const templateData: Record<string, { value: string }> = {}
    Object.entries(data).forEach(([key, value]) => {
        templateData[key] = { value: String(value) }
    })

    // 发送给每个用户（批量发送需要逐个调用）
    const results = await Promise.all(
        toUsers.map(async (openid) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    touser: openid,
                    template_id: templateId,
                    data: templateData,
                }),
            })

            const result = await response.json()

            if (result.errcode !== 0) {
                throw new Error(`发送模板消息失败: ${result.errmsg}`)
            }

            return result.msgid
        })
    )

    return results[0] || ''
}

/**
 * 通过 Webhook 发送消息（企业微信）
 */
async function sendWebhookMessage(
    webhookUrl: string,
    notificationData: WechatNotificationData
): Promise<string> {
    const { type, content, title } = notificationData

    let body: any

    if (type === 'markdown') {
        body = {
            msgtype: 'markdown',
            markdown: {
                content: `# ${title || '通知'}\n${content}`,
            },
        }
    } else {
        body = {
            msgtype: 'text',
            text: {
                content: title ? `${title}\n${content}` : content,
            },
        }
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    const result = await response.json()

    if (result.errcode !== 0) {
        throw new Error(`Webhook 发送失败: ${result.errmsg}`)
    }

    return result.msgid || 'webhook-sent'
}
