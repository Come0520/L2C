import { Page } from '@playwright/test';

export async function gotoPage(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
}

export async function clickWhenVisible(page: Page, selector: string) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible' });
    await element.click();
}

export async function waitForResponse(page: Page, urlPart: string) {
    return page.waitForResponse(response => response.url().includes(urlPart));
}

export async function fillFormField(page: Page, selector: string, value: string) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible' });
    await element.fill(value);
}

export async function selectDropdownOption(page: Page, selector: string, value: string) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible' });
    await element.selectOption(value);
}
