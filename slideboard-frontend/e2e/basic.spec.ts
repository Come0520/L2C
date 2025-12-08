import { test, expect } from '@playwright/test'

test.describe('核心页面可用性', () => {
  test('登录页渲染与切换登录方式', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: 'Slideboard' })).toBeVisible()
    await page.getByRole('button', { name: '验证码登录' }).click()
    await expect(page.getByLabel('验证码')).toBeVisible()
    await expect(page.getByRole('button', { name: /获取验证码|\ds后重发/ })).toBeVisible()
  })

  test.skip('仪表盘页面可渲染', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    await expect(page.getByText('最近订单')).toBeVisible()
  })

  test('首页可渲染', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /欢迎回来！/ })).toBeVisible()
  })

  test('订单管理页渲染', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(2000)
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible()
    await expect(page.getByText('状态快捷入口')).toBeVisible()
  })

  // 线索看板用例暂时跳过，待后端数据接入后补充
})
