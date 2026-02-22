import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 允许下划线前缀的参数和变量不使用
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      // 降级 any 类型为警告，允许项目逐步清理
      "@typescript-eslint/no-explicit-any": "warn",
      // 允许 require() 导入（用于工具脚本和测试）
      "@typescript-eslint/no-require-imports": "off",
      // 允许 @ts-ignore 和 @ts-expect-error 注释
      "@typescript-eslint/ban-ts-comment": "off",
      // 禁止生产代码中使用 console.log（允许 warn 和 error）
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // 允许 JSX 中使用未转义的引号
      "react/no-unescaped-entities": "off",
      // 禁用 react-compiler 规则（实验性功能）
      "react-compiler/react-compiler": "off"
    }
  },
  // 测试文件放宽规则 - 测试代码中允许 any / console / 未使用变量
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx", "**/tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
    }
  },
  // 脚本文件放宽规则 - CLI 脚本需要 console 输出
  {
    files: ["src/scripts/**"],
    rules: {
      "no-console": "off",
    }
  },
  // Logger / 审计相关文件允许使用 console（它们就是 console 的封装层）
  {
    files: ["**/logger.ts", "**/logger.tsx", "**/version-logger.tsx", "**/audit-service.ts"],
    rules: {
      "no-console": "off",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".next-test/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    // Project specific ignores:
    "e2e/**",
    "miniprogram/**",
    ".agent/**",
    "alibabacloud-rds-openapi-mcp-server/**",
  ]),
]);

export default eslintConfig;
