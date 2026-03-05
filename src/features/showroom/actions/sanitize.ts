/**
 * 服务端安全的 HTML 内容清洗函数
 *
 * 设计原则：
 * - 纯函数，无任何 DOM/jsdom 依赖
 * - 可在 Next.js standalone 构建中安全运行，不依赖 whatwg-url、jsdom 等浏览器模块
 * - 替代 isomorphic-dompurify（后者在 standalone 构建中动态加载 jsdom 导致崩溃）
 *
 * 适用场景：服务端 Server Action 中对用户输入的 HTML 内容进行 XSS 防御。
 * 注意：客户端富文本展示仍推荐使用 DOMPurify（浏览器原生 DOM 解析更安全）。
 */

/**
 * 清洗 HTML 内容，移除潜在的 XSS 攻击向量
 *
 * @param html - 待清洗的 HTML 字符串
 * @returns 清洗后的纯文本（移除所有 HTML 标签和危险属性）
 */
export function sanitizeContent(html: string): string {
  return (
    html
      // 移除 script 标签及其内容
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      // 移除 style 标签及其内容
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // 移除内联事件处理器（如 onerror、onclick 等）
      .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // 移除 javascript: 协议
      .replace(/javascript:/gi, '')
      // 移除所有剩余 HTML 标签
      .replace(/<[^>]+>/g, '')
  );
}
