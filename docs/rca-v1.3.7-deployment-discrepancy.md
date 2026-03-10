# Root Cause Analysis: v1.3.7 部署版本不一致故障

## 1. 故障表现
在 v1.3.7 发布流程结束后，用户（相公）发现 ECS 生产环境的 `package.json` 显示为 `1.3.6`，且容器版本信息不匹配。

## 2. 时间线记录 (Event Timeline)
- **14:05**: 执行 `npm version patch`，本地 `package.json` 更新为 `1.3.7`。
- **14:10**: 尝试 `git push` 给远程，发生 HTTP 408 超时错误，代码未真正入库。
- **14:15**: 直接执行 `tar` 打包。**关键失误点**：未执行 `pnpm build` 重建产物，打包了旧的 `1.3.6` 产物。
- **14:20**: ECS 运行 `git fetch`，拉取了远程旧的 `1.3.6` 配置文件。
- **14:25**: 部署完成，导致 ECS 根目录与应用内部均为 `1.3.6`。

## 3. 根因 (Root Causes)
### A. 构建缓存污染 (Stale Build Cache)
Next.js Standalone 模式会将构建时的 `package.json` 拷贝到 `.next/standalone` 目录。如果版本号更新后没有执行 `npm run build`，产物中的版本信息将维持在上一版。

### B. 通讯逻辑缺陷 (Network Fragility)
部署流程依赖 `git push` 成功的反馈。当网络异常导致 Push 失败时，ECS 侧的元数据（通过 Git 获取）无法对齐本地上传的产物版本。

## 4. 纠正措施 (Corrective Actions)
1. **本地紧急对齐**: 强制将 ECS 上的 `package.json` 修改为 `1.3.7`。
2. **容器强制更新**: 重新触发了 ECS 端的无缓存构建。

## 5. 防范措施 (Prevention)
- **脚本拦截**: 在 `deploy.md` 工作流中加入「版本一致性预检步」，对比 root 和 standalone 的版本。
- **构建强绑定**: 将 `npm run build` 标记为打包流程中不可跳过的「原子操作」。
