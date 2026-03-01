'use client';

import { zodResolver } from '@hookform/resolvers/zod';

/**
 * 类型安全的 zodResolver 包装器
 *
 * 解决 react-hook-form v7 与 @hookform/resolvers/zod 之间的泛型签名不兼容问题。
 * 将唯一的 `as any` 集中在此工具层，避免在每个表单组件中散落类型断言。
 *
 * @param schema - Zod 校验 Schema
 * @returns 兼容 useForm resolver 的解析器
 *
 * @example
 * ```tsx
 * const form = useForm<FormValues>({
 *   resolver: typedResolver(myZodSchema),
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typedResolver(schema: any): any {
  return zodResolver(schema);
}
