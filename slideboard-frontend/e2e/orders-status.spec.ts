import { test, expect } from '@playwright/test'

test.describe('订单状态页', () => {
  test('测量中-分配中 页面渲染与表头', async ({ page }) => {
    await page.goto('/orders/status/measuring_assigning')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: '测量中-分配中', exact: true })).toBeVisible()
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible()
    await expect(page.getByText('订单号')).toBeVisible()
    await expect(page.getByText(/加载中...|暂无数据/)).toBeVisible()
  })

  test('待推单 页面渲染', async ({ page }) => {
    await page.goto('/orders/status/pending_push')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: '待推单', exact: true })).toBeVisible()
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible()
    await expect(page.getByText(/加载中...|暂无数据/)).toBeVisible()
  })

  test('待下单 页面渲染', async ({ page }) => {
    await page.goto('/orders/status/pending_order')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: '待下单', exact: true })).toBeVisible()
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible()
    await expect(page.getByText(/加载中...|暂无数据/)).toBeVisible()
  })

  test('备货完成 页面渲染与新建入口存在', async ({ page }) => {
    await page.goto('/orders/status/stock_prepared')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: '备货完成', exact: true })).toBeVisible()
    await expect(page.getByText('新建')).toBeVisible()
    await expect(page.getByText('导入')).toBeVisible()
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible()
  })

  test('待发货 页面渲染', async ({ page }) => {
    await page.goto('/orders/status/pending_shipment')
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: '待发货', exact: true })).toBeVisible()
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible()
  })
})
