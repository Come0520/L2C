import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
    ...config,
    webServer: undefined, // 禁用内部服务器启动
});
