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
    setupFiles: ['./vitest.setup.ts'],
    // 添加测试超时时间设置
    timeout: 10000,
    // 添加测试并行度设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 6,
      },
    },
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
