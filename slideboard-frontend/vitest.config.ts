import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['e2e/**/*', 'node_modules/**/*'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      // 添加lcov报告格式
      reporter: ['text', 'json', 'html', 'lcov'],
      // 优化include配置
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      // 优化exclude配置
      exclude: [
        'src/types/**/*',
        'src/test-utils/**/*',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**'
      ],
      // 添加覆盖率阈值配置
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
        statements: 80
      }
    },
  },
});
