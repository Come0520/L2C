# image-preview 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/image-preview.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   1   |
|   🟡 P2 — 规范/a11y（建议改进）   |   2   |
|             **合计**              | **3** |

---

## 🟠 P1 — 应当修复

- [ ] [C6-001] `shared/ui/image-preview.tsx:14-19` — JSDoc 注释（第 14-19 行）中多处文字出现乱码（`样�?`、`件�?`），说明源文件在某次编辑时发生了编码损坏。注释可读性下降，应将注释中所有乱码字符修复为完整中文

## 🟡 P2 — 建议改进

- [ ] [C4-001] `shared/ui/image-preview.tsx:40-45` — 缩略图使用 `next/image fill` 模式但父容器没有设置明确的尺寸（高/宽），依赖 `className` 外部传入，若调用方忘记设置容器尺寸，图片将无法显示；建议在 Props 文档注释中明确说明 `className` 必须包含高度定义，或提供 `width/height` Props 替代 `fill`

- [ ] [C5-001] `shared/ui/image-preview.tsx:34-50` — 触发区域（`DialogTrigger` 包裹的 `<div>`）没有 `role="button"` 和 `tabIndex={0}` + 键盘事件处理，键盘用户无法通过 Enter/Space 触发图片预览；图片放大的 hover 效果（缩放 icon）也无法通过键盘感知

---

## ✅ 表现良好项（无需修复）

- C3: `DialogTitle` 已使用 `className="sr-only"` 提供屏幕阅读器标题，符合 a11y 要求 ✅
- C4: fallback 机制完整，`src` 为空时正确渲染备选内容
- C2: 使用 `next/image` 而非 `<img>`，受益于自动图片优化（WebP、懒加载）
