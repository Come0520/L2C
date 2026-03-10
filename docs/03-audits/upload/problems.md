# upload 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/upload

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 1 |
| **合计** | **3** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions/upload.ts:174-186` — 上传文件存储至 **`public/uploads/{tenantId}/` 本地文件系统**（即 `process.cwd()/public/uploads`），该目录通过 Next.js 静态资源直接可访问。这意味着：① 生产环境多实例部署时文件会丢失（Pod 无状态）；② 上传的文件 URL 无需认证即可公开访问（没有权限保护）；③ 磁盘空间耗尽可导致服务中断。应改为通过 `fileService.uploadFile()` 上传至 OSS，并使用签名 URL 控制访问权限

---

## 🟠 P1 — 应当修复

- [x] [D2-P1-2] `actions/upload.ts:214-235` — `deleteUploadedFileAction` 函数**只记录了审计日志，未执行任何实际的文件删除操作**（无 `fs.unlink` 或 OSS 删除调用）。注释「模拟逻辑，用于凑齐 3 处 AuditService」清楚表明这是占位骨架实现，生产环境调用此接口文件不会被真正删除

---

## 🟡 P2 — 建议改进

- [x] [D7-P2-1] `actions/upload.ts:48-52` — MIME 类型校验依赖前端上传的 `file.type` 字段，前端可伪造将恶意文件（如 PHP/JSP 脚本）声明为 `image/png` 上传。应额外在服务端使用 File Magic Bytes 检测（读文件头字节判断真实类型），如使用 `file-type` npm 包

---

## ✅ 表现良好项（无需修复）

- **D7 MIME 白名单**：`ALLOWED_MIME_TYPES` 限定了 10 种允许类型，拒绝所有可执行类型
- **D7 文件大小限制**：10MB 上限通过 Zod 校验
- **D7 文件名路径遍历防护**：`safeName = file.name.replace(/[^\w.\-]/g, '_')` 过滤路径遍历字符
- **D3 tenantId 目录隔离**：本地存储按 `tenantId` 分目录隔离（虽然 P0 问题但隔离设计正确）
- **D8 上传成功/失败/拒绝 三维审计**：有完整的 AuditService 覆盖
