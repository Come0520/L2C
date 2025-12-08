/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers {}
}

// 扩展全局匹配器
declare global {
  namespace Vi {
    interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
    interface AsymmetricMatchersContaining extends TestingLibraryMatchers {}
  }
  
  // 扩展全局断言类型
  namespace jest {
    interface Matchers<R> extends TestingLibraryMatchers<T, R> {}
  }
}