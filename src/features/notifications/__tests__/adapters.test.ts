import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LarkAdapter } from '../adapters/lark-adapter';
import { SmsAdapter } from '../adapters/sms-adapter';
import { WeChatAdapter } from '../adapters/wechat-adapter';
import { NotificationPayload } from '../types';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn()
            }
        }
    }
}));

describe('Notification Adapters', () => {
    const mockPayload: NotificationPayload = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: '测试通知',
        content: '这是一条测试通知内容',
        type: 'INFO',
    };

    describe('LarkAdapter', () => {
        let adapter: LarkAdapter;
        const mockFetch = vi.fn();

        beforeEach(() => {
            adapter = new LarkAdapter();
            vi.stubGlobal('fetch', mockFetch);
            process.env.FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/mock';
            process.env.NEXTAUTH_URL = 'http://localhost:3000';
            mockFetch.mockReset();
        });

        it('当未配置 webhook 环境变量时，应直接返回 false', async () => {
            delete process.env.FEISHU_WEBHOOK_URL;
            const result = await adapter.send(mockPayload);
            expect(result).toBe(false);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('当飞书接口响应成功时，应返回 true', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });

            const result = await adapter.send(mockPayload);

            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://open.feishu.cn/open-apis/bot/v2/hook/mock',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        it('当飞书接口响应状态码非 200 时，应捕获异常并返回 false', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error'
            });

            const result = await adapter.send(mockPayload);

            expect(result).toBe(false);
        });

        it('当网络请求彻底失败(如 DNS 错误)时，应捕获异常并返回 false', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await adapter.send(mockPayload);

            expect(result).toBe(false);
        });

        it('当 payload 带有链接时，应正确拼接完整 URL', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            const payloadWithLink = {
                ...mockPayload,
                metadata: { link: '/dashboard' }
            };

            await adapter.send(payloadWithLink);

            const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
            const contentBlocks = requestBody.content.post.zh_cn.content[1];
            expect(contentBlocks[0].href).toBe('http://localhost:3000/dashboard');
        });
    });

    describe('SmsAdapter', () => {
        let adapter: SmsAdapter;

        beforeEach(() => {
            adapter = new SmsAdapter();
        });

        it('目前应默认返回 true 占位', async () => {
            const result = await adapter.send(mockPayload);
            expect(result).toBe(true);
        });
    });

    describe('WeChatAdapter', () => {
        let adapter: WeChatAdapter;

        beforeEach(() => {
            adapter = new WeChatAdapter();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ access_token: 'mock_token', errcode: 0 })
            }));
        });

        it('应成功初始化实例', () => {
            expect(adapter).toBeDefined();
        });

        // 注：这里只做基本的覆盖，详细测试应该在 wechat-adapter.test.ts 里或通过更复杂的 mock，
        // 鉴于目前仅要求 adapter 返回 boolean，我们可以加一个简单的集成验证。
    });
});
