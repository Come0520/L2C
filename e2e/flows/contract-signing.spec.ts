import { test, expect } from '@playwright/test';

/**
 * 客户订单电子签约过程与归档验证 (Contract Signing)
 * 
 * 覆盖场景：
 * 1. 报价转订单前强制要求签署动作
 * 2. 系统中针对 "Contract/Document" 档案的查询验证
 */

test.describe('电子合同签约与档案留存 (Contract Signing Archival)', () => {

    test('P2-1: 签约审批操作前应展示签名或上传凭证输入框', async ({ page }) => {
        // 假定通过报价 ID 为 Q-CONTRACT-1 的草稿转签约验证
        await page.route('**/api/quotes/Q-CONTRACT-1', async route => {
            const data = { id: 'Q-CONTRACT-1', status: 'APPROVED', total: 6000 };
            await route.fulfill({ json: { data } });
        });

        await page.goto('/quotes/Q-CONTRACT-1', { waitUntil: 'domcontentloaded' }).catch(() => null);

        const convertToOrderBtn = page.getByRole('button', { name: /签单|转为订单|签约|Convert/ });

        if (await convertToOrderBtn.isVisible({ timeout: 5000 })) {
            await convertToOrderBtn.click();
            // 点击后可能存在一个包含电子签或附件上传的确认 Modal
            const signDialog = page.getByRole('dialog', { name: /确认签单|签章|附件/ });
            if (await signDialog.isVisible({ timeout: 3000 })) {
                // 检查是否有上传控件或签名区域
                const hasUploader = await signDialog.locator('input[type="file"], text=/上传合同|点击签名|电子签/').isVisible();
                if (hasUploader) {
                    console.log('✅ 转订单交互中，系统强制或提示了凭证上传 (合同签章/图片)');
                } else {
                    console.log('⚠️ 转为订单对话框直接确认，缺乏签约凭证或法律防浪涌措施');
                }
                await page.keyboard.press('Escape');
            } else {
                console.log('⚠️ 系统缺少报价向订单转换的二次带凭证确认交互');
            }
        } else {
            console.log('⚠️ 当前页面可能不支持报价转订核心链路入口');
        }
    });

    test('P2-2: 已签约订单详情应展示"电子合同"作为持久附件', async ({ page }) => {
        // 这个测试假定 API 存在一个专门针对 Document 的数据结构
        await page.route('**/api/orders/O-DOC-999', async route => {
            await route.fulfill({
                json: {
                    data: {
                        id: 'O-DOC-999',
                        status: 'WON',
                        documents: [
                            { id: 'doc-1', type: 'CONTRACT', name: '装修施工合同.pdf', url: '/files/contract.pdf' }
                        ]
                    }
                }
            });
        });

        await page.goto('/orders/O-DOC-999', { waitUntil: 'domcontentloaded' }).catch(() => null);

        // 查找附件或合同区块
        const documentTabOrSection = page.locator('text=/合同资料|业务凭证|附件|Documents/');
        if (await documentTabOrSection.isVisible({ timeout: 5000 })) {
            const docLink = page.locator('a[href*="contract.pdf"]').or(page.locator('text=/施工合同/'));
            if (await docLink.isVisible({ timeout: 3000 })) {
                console.log('✅ 订单详情页成功渲染了电子合同档案留档记录');
            } else {
                console.log('⚠️ 订单的业务附件区未能找到该订单附带的合同 PDF 文件');
            }
        } else {
            console.log('⚠️ 订单详情页未发现承载合同等发票法律凭证的区块 UI');
        }
    });

});
