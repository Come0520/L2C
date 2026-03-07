/**
 * TDD — 款式模板缩略图上传 API Route 测试
 *
 * POST /api/platform/ai-templates/upload
 * - 仅 SUPER_ADMIN 可操作
 * - 接受 multipart/form-data，字段名 file
 * - 返回 { url: string }（公开访问路径）
 * - 文件大小限制 5MB，类型限 jpg / png / webp
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Hoisted Mock 引用（必须最先声明） ----
const { mockAuth, mockWriteFile, mockMkdir } = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
    mockWriteFile: vi.fn().mockResolvedValue(undefined),
    mockMkdir: vi.fn().mockResolvedValue(undefined),
  };
});

// ---- 顶层 vi.mock（hoisted 会提升，保证顺序正确） ----
vi.mock('@/shared/lib/auth', () => ({ auth: mockAuth }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  default: { writeFile: mockWriteFile, mkdir: mockMkdir },
}));

// Route 在 mock 之后 import
const { POST } = await import('../route');

// ---- 工具函数 ----
/** 构造包含文件的 FormData POST 请求 */
function createUploadRequest(content: string, fileName: string, mimeType: string): NextRequest {
  const blob = new Blob([content], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });
  const formData = new FormData();
  formData.append('file', file);
  return new NextRequest('http://localhost/api/platform/ai-templates/upload', {
    method: 'POST',
    body: formData,
  });
}

// ---- 测试套件 ----
describe('POST /api/platform/ai-templates/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
  });

  it('未登录时返回 401', async () => {
    mockAuth.mockResolvedValue(null);
    const req = createUploadRequest('fake', 'test.jpg', 'image/jpeg');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('非 SUPER_ADMIN 返回 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'TENANT_ADMIN' } });
    const req = createUploadRequest('fake', 'test.jpg', 'image/jpeg');
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('没有 file 字段时返回 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'SUPER_ADMIN' } });
    const formData = new FormData();
    const req = new NextRequest('http://localhost/api/platform/ai-templates/upload', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('file');
  });

  it('文件类型不合法时返回 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'SUPER_ADMIN' } });
    const req = createUploadRequest('fake pdf', 'doc.pdf', 'application/pdf');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('格式');
  });

  it('合法 SUPER_ADMIN 上传成功，返回 200 和 url', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'SUPER_ADMIN' } });
    const req = createUploadRequest('fake jpeg', 'style.jpg', 'image/jpeg');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/\/uploads\/templates\//);
    // 写文件应被调用一次
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });
});
