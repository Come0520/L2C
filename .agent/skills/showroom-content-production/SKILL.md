---
name: showroom-content-production
description: Use when batch-producing showroom content for cloud showroom module - product listings, case studies, knowledge articles, or internal training materials
---

# 展厅素材批量生产指南

## 概述

标准化的展厅素材生产流程，用于为 L2C 云展厅批量创建四种类型的内容：商品、案例、知识、内部培训。
所有素材使用 Markdown 格式，通过 `createShowroomItem` Server Action 写入数据库。

## 何时使用

- 需要批量创建展厅素材时
- 为新产品线批量生成配套内容时
- 定期更新知识库或培训资料时
- 将线下素材数字化导入系统时

## 内容类型速查

| 类型 | 枚举值 | 场景 | 可见范围 | 必填字段 |
|------|--------|------|----------|----------|
| 商品 | `PRODUCT` | 产品详情与卖点 | 对内+对外 | title, images, productId |
| 案例 | `CASE` | 安装案例与效果展示 | 对内+对外 | title, images, content |
| 知识 | `KNOWLEDGE` | 选购指南、搭配建议 | 对内+对外 | title, content |
| 培训 | `TRAINING` | 话术、流程、规范 | 仅对内 | title, content |

> **注意**：`TRAINING` 类型在分享给客户时会被自动过滤，仅供内部查看。

## 生产流程

```
1. 确定素材类型和批量数量
2. 加载对应模板 (templates/ 目录)
3. 填充 YAML frontmatter 中的元数据
4. 编写 Markdown 正文
5. 准备图片资源 (上传至 OSS 获取 URL)
6. 调用 createShowroomItem 写入数据库
```

## 图片规范

| 用途 | 尺寸建议 | 格式 | 数量 |
|------|----------|------|------|
| 封面图 | 800×600px | JPG/WebP | 1张 |
| 详情图 | 1200×900px | JPG/WebP | 3-9张 |
| 流程图/示意图 | 宽度≥800px | PNG/SVG | 按需 |

## 视频规范

视频以外链形式嵌入 content 字段中，格式：

```markdown
![视频标题](https://your-oss-bucket.com/videos/xxx.mp4)
```

推荐：时长 1-5 分钟，分辨率 1080p，MP4 格式。

## 标签规范

标签用于检索和推荐，遵循以下规则：
- 每个素材 3-8 个标签
- 使用中文，2-6 字
- 分类标签 + 风格标签 + 材质标签

示例：`["遮光布", "现代简约", "卧室", "高精密", "奶咖色"]`

## 评分机制

系统自动计算完整度评分 (0-100)：
- 基础分：20 分
- 有图片 (+20)
- 内容超过 50 字 (+20)
- 关联商品 (+20)
- 有标签 (+20)

**目标：所有素材评分 ≥ 80 分**

## 模板文件

每种类型的详细模板和示例见 `templates/` 目录：
- `PRODUCT-template.md` - 商品素材模板
- `CASE-template.md` - 案例素材模板
- `KNOWLEDGE-template.md` - 知识素材模板
- `TRAINING-template.md` - 内部培训模板

## Server Action 接口

```typescript
// 创建素材
import { createShowroomItem } from '@/features/showroom/actions';

await createShowroomItem({
  type: 'PRODUCT' | 'CASE' | 'KNOWLEDGE' | 'TRAINING',
  title: '标题',
  content: 'Markdown 正文内容',
  images: ['https://oss-url/img1.jpg', 'https://oss-url/img2.jpg'],
  tags: ['标签1', '标签2'],
  productId: 'uuid-of-linked-product', // 仅 PRODUCT 类型必填
  status: 'PUBLISHED' | 'DRAFT',
});
```

## 常见错误

| 错误 | 修正 |
|------|------|
| 商品类型缺少 productId | PRODUCT 类型必须关联已有商品 |
| 图片使用本地路径 | 必须上传至 OSS 获取公网 URL |
| 内容过短 (< 50字) | 评分扣分，建议 200+ 字  |
| 标签过多或过少 | 保持 3-8 个标签 |
| 培训内容标记为 PUBLISHED | 培训内容默认应为 DRAFT 或设置对内可见 |
