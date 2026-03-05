/**
 * TDD RED 阶段 - Bug 修复：云展厅内容清洗函数
 *
 * 问题：isomorphic-dompurify 在 Next.js standalone 构建中动态加载 jsdom，
 * 而 jsdom 依赖 whatwg-url，该模块未被 standalone 打包，导致每次访问
 * 云展厅页面都触发 "Cannot find module 'whatwg-url'" 错误。
 *
 * 修复目标：提取一个 sanitizeContent 纯函数，不依赖任何 DOM/jsdom 模块。
 *
 * 这些测试刻意 **不 mock** isomorphic-dompurify，以验证替换后的函数
 * 在纯 Node.js 环境（无 DOM）中能够正常运行。
 */
import { describe, it, expect } from 'vitest';
import { sanitizeContent } from '../sanitize';

describe('sanitizeContent() - 服务端 HTML 清洗（无 DOM 依赖）', () => {
  it('脚本标签应被完全移除', () => {
    const input = '<script>alert("xss")</script>安全内容';
    const result = sanitizeContent(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('安全内容');
  });

  it('内联事件处理器应被移除', () => {
    const input = '<img src="x" onerror="alert(1)">图片';
    const result = sanitizeContent(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('javascript: 协议应被移除', () => {
    const input = '<a href="javascript:alert(1)">点击</a>';
    const result = sanitizeContent(input);
    expect(result).not.toContain('javascript:');
  });

  it('普通 HTML 标签应被清除，保留文本', () => {
    const input = '<p>这是<strong>加粗</strong>文本</p>';
    const result = sanitizeContent(input);
    expect(result).toBe('这是加粗文本');
  });

  it('空字符串输入应返回空字符串', () => {
    expect(sanitizeContent('')).toBe('');
  });

  it('纯文本内容应原样返回', () => {
    const input = '这是纯文本内容，没有任何 HTML 标签';
    expect(sanitizeContent(input)).toBe(input);
  });

  it('style 标签及内容应被完全移除', () => {
    const input = '<style>.evil { display: none }</style>内容';
    const result = sanitizeContent(input);
    expect(result).not.toContain('<style>');
    expect(result).not.toContain('.evil');
    expect(result).toContain('内容');
  });

  it('嵌套 XSS 攻击向量应被清除', () => {
    const input = '<img/onerror=alert(1)><script>evil()</script>正常文本';
    const result = sanitizeContent(input);
    expect(result).not.toContain('alert');
    expect(result).not.toContain('evil');
    expect(result).toContain('正常文本');
  });
});
