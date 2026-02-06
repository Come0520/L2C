/**
 * 渠道来源 API
 * 
 * GET /api/miniprogram/channels
 * 返回渠道层级树结构，用于新建客户/线索时选择来源
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { channels, channelContacts } from '@/shared/api/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// 辅助函数：获取用户信息
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return {
            id: payload.userId as string,
            tenantId: payload.tenantId as string,
        };
    } catch {
        return null;
    }
}

// Mock 数据（开发模式）
const mockChannels = [
    {
        id: 'cat-1',
        name: '线上渠道',
        level: 1,
        children: [
            {
                id: 'ch-1-1', name: '抖音', level: 2, contacts: [
                    { id: 'ct-1-1-1', name: '抖音自然流量' },
                    { id: 'ct-1-1-2', name: '抖音付费推广' }
                ]
            },
            {
                id: 'ch-1-2', name: '小红书', level: 2, contacts: [
                    { id: 'ct-1-2-1', name: '小红书自然流量' }
                ]
            },
            {
                id: 'ch-1-3', name: '微信', level: 2, contacts: [
                    { id: 'ct-1-3-1', name: '朋友圈广告' },
                    { id: 'ct-1-3-2', name: '公众号' }
                ]
            }
        ]
    },
    {
        id: 'cat-2',
        name: '设计师带单',
        level: 1,
        children: [
            {
                id: 'ch-2-1', name: '张设计师工作室', level: 2, contacts: [
                    { id: 'ct-2-1-1', name: '张设计师' },
                    { id: 'ct-2-1-2', name: '李助理' }
                ]
            },
            {
                id: 'ch-2-2', name: '王设计师', level: 2, contacts: [
                    { id: 'ct-2-2-1', name: '王设计师' }
                ]
            }
        ]
    },
    {
        id: 'cat-3',
        name: '装修公司',
        level: 1,
        children: [
            {
                id: 'ch-3-1', name: '星艺装饰', level: 2, contacts: [
                    { id: 'ct-3-1-1', name: '陈经理' },
                    { id: 'ct-3-1-2', name: '刘设计' }
                ]
            },
            {
                id: 'ch-3-2', name: '业之峰', level: 2, contacts: [
                    { id: 'ct-3-2-1', name: '吴总' }
                ]
            }
        ]
    },
    {
        id: 'cat-4',
        name: '老客户转介绍',
        level: 1,
        children: []
    },
    {
        id: 'cat-5',
        name: '门店自然进店',
        level: 1,
        children: []
    },
    {
        id: 'cat-6',
        name: '其他',
        level: 1,
        children: []
    }
];

/**
 * GET - 获取渠道树
 */
export async function GET(request: NextRequest) {
    try {
        // 开发模式检测
        const authHeader = request.headers.get('authorization');
        if (authHeader?.includes('dev-mock-token-')) {
            return NextResponse.json({ success: true, data: mockChannels });
        }

        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
        }

        // 获取所有一级渠道（parentId 为空）
        const level1Channels = await db.query.channels.findMany({
            where: and(
                eq(channels.tenantId, user.tenantId),
                isNull(channels.parentId),
                eq(channels.status, 'ACTIVE')
            ),
            orderBy: [asc(channels.name)],
            columns: {
                id: true,
                name: true,
                hierarchyLevel: true,
            }
        });

        // 构建树结构
        const result = await Promise.all(level1Channels.map(async (parent) => {
            // 获取子渠道
            const children = await db.query.channels.findMany({
                where: and(
                    eq(channels.tenantId, user.tenantId),
                    eq(channels.parentId, parent.id),
                    eq(channels.status, 'ACTIVE')
                ),
                orderBy: [asc(channels.name)],
                columns: {
                    id: true,
                    name: true,
                    hierarchyLevel: true,
                }
            });

            // 获取每个子渠道的联系人
            const childrenWithContacts = await Promise.all(children.map(async (child) => {
                const contacts = await db.query.channelContacts.findMany({
                    where: eq(channelContacts.channelId, child.id),
                    orderBy: [asc(channelContacts.name)],
                    columns: {
                        id: true,
                        name: true,
                    }
                });
                return {
                    id: child.id,
                    name: child.name,
                    level: child.hierarchyLevel,
                    contacts
                };
            }));

            return {
                id: parent.id,
                name: parent.name,
                level: parent.hierarchyLevel,
                children: childrenWithContacts
            };
        }));

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Get Channels Error:', error);
        return NextResponse.json({ success: false, error: '获取渠道失败' }, { status: 500 });
    }
}
