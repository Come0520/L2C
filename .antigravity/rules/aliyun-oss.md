---
name: l2c-oss-sts
description: 处理基于阿里云 OSS 的内网访问和 STS 临时授权安全逻辑
---

# OSS 安全规范

1. **访问路径**：
   - 生产环境必须使用内网 Endpoint (`-internal.aliyuncs.com`)。
   - 确保 Bucket 权限为“私有”。

2. **STS 授权流**：
   - 禁止前端直接持有 AccessKey。
   - 必须通过后端 API 请求阿里云 STS 获取临时凭证（有效期建议 5-15 分钟）。
   - 为上传的窗帘图片、报价单生成带有 `Signature` 的临时访问 URL。
