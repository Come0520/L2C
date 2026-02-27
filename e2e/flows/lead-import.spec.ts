import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

test.describe('Lead Excel Import', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const dir = 'test-results';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const baseName = `${testInfo.project.name}-${testInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            await page.screenshot({ path: path.join(dir, `${baseName}.png`), fullPage: true });
            fs.writeFileSync(path.join(dir, `${baseName}.html`), await page.content());
        }
    });

    // Helper to create an Excel file
    const createExcelFile = (filename: string, data: any[]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        // write to buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        // write to temp file
        const testDir = path.resolve(__dirname, '../../test-temp');
        if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
        const filePath = path.join(testDir, filename);
        fs.writeFileSync(filePath, buffer);
        return filePath;
    };

    test('should import leads from excel file', async ({ page }) => {
        const uniqueId = Math.random().toString(36).substring(7);
        const phone1 = `136${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const phone2 = `136${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        const data = [
            {
                '客户姓名': `ImportTest1_${uniqueId}`,
                '手机号': phone1,
                '微信号': 'wx_test_1',
                '楼盘': 'TestCommunity1',
                '地址': '1-101',
                '预估金额': '10000',
                '备注': 'Import Note 1'
            },
            {
                '客户姓名': `ImportTest2_${uniqueId}`,
                '手机号': phone2,
                '微信号': 'wx_test_2',
                '楼盘': 'TestCommunity2',
                '地址': '2-202',
                '预估金额': '20000',
                '备注': 'Import Note 2'
            }
        ];

        const filePath = createExcelFile(`leads_import_${uniqueId}.xlsx`, data);

        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Click Import Button
        // Assuming button text "导入线索" or looking for upload icon
        // excel-import-dialog.tsx: <Button variant="outline"> <Upload .../> 导入线索 </Button>
        await page.click('button:has-text("导入线索")');

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('批量导入线索')).toBeVisible();

        // Upload file
        // Input type=file is present in the dialog
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);

        // Wait for preview or verification
        await expect(page.getByText(`Preview before 5 lines (Total ${data.length} lines)`).or(page.getByText(`预览前 5 条 (共 ${data.length} 条数据)`))).toBeVisible();

        // Click Confirm Import
        await page.click('button:has-text("确认导入")');

        // Check for success message
        // excel-import-dialog.tsx emits toast: `成功导入 ${count} 条线索`
        await expect(page.locator('.toast-success').or(page.getByText(/成功导入/))).toBeVisible();
        await expect(page.getByText(`${data.length} 条线索`)).toBeVisible();

        // Verify leads in list
        await page.reload();
        await expect(page.getByText(`ImportTest1_${uniqueId}`)).toBeVisible();
        await expect(page.getByText(`ImportTest2_${uniqueId}`)).toBeVisible();

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    test('should handle duplicate leads during import (block duplicates)', async ({ page }) => {
        // First create a lead manually to establish a duplicate base
        const uniqueId = Math.random().toString(36).substring(7);
        const existingPhone = `135${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        await page.goto('/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.getByTestId('create-lead-btn').click();
        await page.getByTestId('lead-name-input').fill(`Existing_${uniqueId}`);
        await page.getByTestId('lead-phone-input').fill(existingPhone);
                await page.getByText('线上').first().click();
                await page.getByText('微信').first().click();
        await page.getByTestId('submit-lead-btn').click();
        await expect(page.getByText(/成功|Success/).first()).toBeVisible();

        // Prepare Import Data with 1 new lead and 1 duplicate lead
        const newPhone = `135${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        const importData = [
            {
                '客户姓名': `NewImport_${uniqueId}`,
                '手机号': newPhone,
                '楼盘': 'TestCommunity',
                '地址': '1-102'
            },
            {
                '客户姓名': `DuplicateImport_${uniqueId}`,
                '手机号': existingPhone, // DUPLICATE
                '楼盘': 'TestCommunity',
                '地址': '1-101'
            }
        ];

        const filePath = createExcelFile(`leads_import_dupe_${uniqueId}.xlsx`, importData);

        await page.reload(); // Refresh to close any previous dialogs if cleanup failed or persistent state
        await page.click('button:has-text("导入线索")');
        await page.locator('input[type="file"]').setInputFiles(filePath);

        await expect(page.getByText(/预览/)).toBeVisible();
        await page.click('button:has-text("确认导入")');

        // Expect Import Complete Alert
        // excel-import-dialog.tsx logic:
        // After import, it sets importResult. 
        // If errors.length > 0, it shows "X 条数据导入失败，请查看详情" warning toast.
        // It also shows Alert in dialog with success count and error count.

        await expect(page.getByText('导入完成')).toBeVisible();
        await expect(page.getByText('成功: 1 条')).toBeVisible();
        await expect(page.getByText('失败: 1 条')).toBeVisible();

        // Verify Error details
        await expect(page.getByText(/重复线索/)).toBeVisible();
        await expect(page.getByText(/第 2 行/)).toBeVisible();

        // Verify only new lead added
        await page.reload();
        await expect(page.getByText(`NewImport_${uniqueId}`)).toBeVisible();
        // The duplicate entry shouldn't have overwritten the old one (name change check)
        // Old name: Existing_{uid}, New csv name: DuplicateImport_{uid}
        // If system blocked it, the name should still be Existing_{uid}
        await expect(page.getByText(`Existing_${uniqueId}`)).toBeVisible();
        await expect(page.getByText(`DuplicateImport_${uniqueId}`)).toBeHidden();

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
});
