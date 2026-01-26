# 贡献指南 (Contributing Guide)

感谢您对本项目的贡献！请遵循以下规范以保持代码库的一致性和可维护性。

---

## 提交规范 (Commit Conventions)

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>
```

### 类型 (type)

| 类型       | 说明                   | 示例                                     |
| ---------- | ---------------------- | ---------------------------------------- |
| `feat`     | 新功能                 | `feat(quote): add side loss calculation` |
| `fix`      | Bug 修复               | `fix(auth): resolve login timeout`       |
| `docs`     | 文档更新               | `docs: update README`                    |
| `style`    | 代码格式（不影响逻辑） | `style: format with prettier`            |
| `refactor` | 重构（不改变功能）     | `refactor(products): simplify filter`    |
| `perf`     | 性能优化               | `perf(list): add pagination`             |
| `test`     | 测试相关               | `test: add unit tests`                   |
| `chore`    | 构建/工具/依赖         | `chore: update dependencies`             |
| `ci`       | CI/CD 配置             | `ci: fix deployment workflow`            |
| `hotfix`   | 紧急修复               | `hotfix(auth): fix session expiry`       |

### 作用域 (scope) 参考

- `quote` - 报价模块
- `showroom` - 云展厅
- `products` - 商品管理
- `auth` - 认证授权
- `ui` - 通用 UI 组件

---

## 分支规范

| 分支类型    | 命名              | 用途         |
| ----------- | ----------------- | ------------ |
| `main`      | 固定              | 生产环境代码 |
| `feature/*` | `feature/功能名`  | 新功能开发   |
| `hotfix/*`  | `hotfix/问题描述` | 紧急修复     |

### 工作流程

```bash
# 1. 创建功能分支
git checkout -b feature/my-feature

# 2. 开发并提交
git commit -m "feat(scope): add new feature"

# 3. 推送并创建 PR（如需要）
git push origin feature/my-feature

# 4. 合并到 main
git checkout main
git merge feature/my-feature
git push
```

---

## 版本标签

使用语义化版本：`v主版本.次版本.修订号`

```bash
# 创建标签
git tag -a v1.0.0 -m "Release v1.0.0 - 版本说明"

# 推送标签
git push origin v1.0.0
```

---

## 代码规范

- 运行 `npm run lint` 检查代码
- 运行 `npm run typecheck` 检查类型
- 提交前确保无报错

---

## 敏感信息

> ⚠️ **重要**：永远不要提交包含密钥、密码、AccessKey 的文件！

使用 `.env` 文件存储敏感信息，参考 `env.production.template`。
