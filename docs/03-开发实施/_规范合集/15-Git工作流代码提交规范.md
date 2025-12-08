# 罗莱L2C销售管理系统 - Git工作流与代码提交规范

## 1. 规范目标

### 1.1 核心目标
- **规范化**: 统一团队Git使用规范和工作流程
- **可追溯性**: 确保代码变更历史清晰可追踪
- **协作效率**: 提高团队协作开发效率
- **质量保证**: 通过规范流程保证代码质量
- **风险控制**: 降低代码冲突和部署风险

### 1.2 适用范围
- 所有项目代码仓库
- 前端、后端、移动端开发
- 文档和配置文件管理
- 第三方依赖管理

## 2. Git分支管理策略

### 2.1 分支模型 (Git Flow)

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/user-management (功能分支)
│   ├── feature/product-catalog (功能分支)
│   └── feature/order-system (功能分支)
├── release/v1.2.0 (发布分支)
├── hotfix/critical-bug-fix (热修复分支)
└── support/v1.1.x (支持分支)
```

### 2.2 分支类型定义

#### 2.2.1 主要分支
```bash
# main分支 - 生产环境代码
# - 始终保持可部署状态
# - 只能通过merge request合并代码
# - 每次合并创建release tag

# develop分支 - 开发集成分支
# - 包含下一个版本的最新开发代码
# - 功能分支的合并目标
# - 持续集成的主要分支
```

#### 2.2.2 支持分支
```bash
# feature分支 - 功能开发分支
# 命名格式: feature/{功能模块}-{具体功能}
feature/user-login
feature/product-search
feature/order-payment
feature/inventory-management

# release分支 - 发布准备分支
# 命名格式: release/v{版本号}
release/v1.0.0
release/v1.1.0
release/v2.0.0

# hotfix分支 - 紧急修复分支
# 命名格式: hotfix/{问题描述}
hotfix/payment-gateway-error
hotfix/user-login-failure
hotfix/data-corruption-fix

# support分支 - 长期支持分支
# 命名格式: support/v{主版本号}.{次版本号}.x
support/v1.0.x
support/v1.1.x
```

### 2.3 分支操作流程

#### 2.3.1 功能开发流程
```bash
# 1. 从develop分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-management

# 2. 开发功能并提交
git add .
git commit -m "feat(user): add user registration functionality"

# 3. 推送到远程仓库
git push origin feature/user-management

# 4. 创建Merge Request到develop分支
# 5. 代码审查通过后合并
# 6. 删除功能分支
git branch -d feature/user-management
git push origin --delete feature/user-management
```

#### 2.3.2 发布流程
```bash
# 1. 从develop分支创建release分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 更新版本号和发布说明
# 修改package.json、CHANGELOG.md等文件

# 3. 测试和bug修复
git commit -m "fix(release): fix minor bugs for v1.2.0"

# 4. 合并到main分支
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# 5. 合并回develop分支
git checkout develop
git merge --no-ff release/v1.2.0

# 6. 推送所有更改
git push origin main
git push origin develop
git push origin v1.2.0

# 7. 删除release分支
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

#### 2.3.3 热修复流程
```bash
# 1. 从main分支创建hotfix分支
git checkout main
git pull origin main
git checkout -b hotfix/payment-gateway-error

# 2. 修复问题并提交
git commit -m "fix(payment): resolve gateway timeout issue"

# 3. 合并到main分支
git checkout main
git merge --no-ff hotfix/payment-gateway-error
git tag -a v1.2.1 -m "Hotfix version 1.2.1"

# 4. 合并到develop分支
git checkout develop
git merge --no-ff hotfix/payment-gateway-error

# 5. 推送更改
git push origin main
git push origin develop
git push origin v1.2.1

# 6. 删除hotfix分支
git branch -d hotfix/payment-gateway-error
git push origin --delete hotfix/payment-gateway-error
```

## 3. 提交信息规范

### 3.1 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 3.2 提交类型 (type)
```bash
feat:     新功能 (feature)
fix:      修复bug
docs:     文档更新
style:    代码格式调整 (不影响代码运行)
refactor: 重构 (既不是新增功能，也不是修复bug)
perf:     性能优化
test:     测试相关
chore:    构建过程或辅助工具的变动
ci:       持续集成相关
build:    构建系统或外部依赖的变动
revert:   回滚之前的提交
```

### 3.3 作用域 (scope)
```bash
# 按功能模块划分
user:     用户相关功能
product:  产品相关功能
order:    订单相关功能
payment:  支付相关功能
inventory: 库存相关功能
auth:     认证授权
api:      API接口
ui:       用户界面
db:       数据库
config:   配置相关
```

### 3.4 提交信息示例
```bash
# 新功能
feat(user): add user profile management functionality

Implement user profile CRUD operations including:
- Create user profile with validation
- Update profile information
- Upload and manage profile avatar
- Privacy settings management

Closes #123

# Bug修复
fix(payment): resolve payment gateway timeout issue

Fix timeout error when processing payments over $1000.
Updated retry logic and increased timeout threshold.

Fixes #456

# 文档更新
docs(api): update user authentication API documentation

Add examples for JWT token usage and refresh token flow.
Update error response codes and descriptions.

# 重构
refactor(order): optimize order processing workflow

Simplify order state management and reduce database queries.
No functional changes, performance improvement only.

# 性能优化
perf(product): improve product search query performance

Add database indexes for product search fields.
Reduce query time from 2s to 200ms for large datasets.

# 测试
test(user): add unit tests for user registration

Add comprehensive test coverage for:
- Valid registration scenarios
- Input validation
- Duplicate email handling
- Password strength validation

Coverage increased from 65% to 85%
```

## 4. 代码审查规范

### 4.1 Merge Request规范

#### 4.1.1 MR标题格式
```bash
# 格式: [类型] 简短描述
[Feature] 用户管理模块
[Bugfix] 修复支付网关超时问题
[Refactor] 优化订单处理流程
[Hotfix] 紧急修复数据库连接问题
```

#### 4.1.2 MR描述模板
```markdown
## 变更描述
简要描述本次变更的内容和目的

## 变更类型
- [ ] 新功能 (Feature)
- [ ] Bug修复 (Bugfix)
- [ ] 重构 (Refactor)
- [ ] 文档更新 (Documentation)
- [ ] 性能优化 (Performance)
- [ ] 测试 (Test)

## 测试情况
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成
- [ ] 性能测试已完成 (如适用)

## 影响范围
描述本次变更可能影响的功能模块和系统组件

## 部署说明
如有特殊部署要求，请在此说明

## 相关Issue
Closes #123
Fixes #456
Related to #789

## 截图/演示
如有UI变更，请提供截图或演示视频

## 检查清单
- [ ] 代码符合项目编码规范
- [ ] 已添加必要的注释和文档
- [ ] 已添加或更新相关测试
- [ ] 已验证向后兼容性
- [ ] 已考虑安全性影响
- [ ] 已更新相关文档
```

### 4.2 代码审查检查点

#### 4.2.1 代码质量检查
```bash
# 1. 代码规范
- 遵循项目编码规范
- 命名清晰有意义
- 代码结构合理
- 注释充分且准确

# 2. 功能实现
- 功能实现正确完整
- 边界条件处理
- 错误处理机制
- 性能考虑

# 3. 安全性检查
- 输入验证
- 权限控制
- 敏感信息保护
- SQL注入防护

# 4. 测试覆盖
- 单元测试充分
- 集成测试完整
- 边界测试覆盖
- 异常场景测试
```

#### 4.2.2 审查流程
```bash
# 1. 自动化检查
- 代码格式检查 (ESLint/Prettier)
- 单元测试执行
- 代码覆盖率检查
- 安全漏洞扫描

# 2. 人工审查
- 至少2名开发者审查
- 技术负责人最终审批
- 所有评论必须解决
- 通过所有检查后方可合并

# 3. 合并策略
- 使用 --no-ff 合并
- 保留完整的分支历史
- 自动删除已合并的功能分支
```

## 5. 版本管理规范

### 5.1 版本号规范 (Semantic Versioning)
```bash
# 格式: MAJOR.MINOR.PATCH
# 示例: v1.2.3

MAJOR: 不兼容的API修改
MINOR: 向后兼容的功能性新增
PATCH: 向后兼容的问题修正

# 预发布版本
v1.2.3-alpha.1    # Alpha版本
v1.2.3-beta.2     # Beta版本
v1.2.3-rc.1       # Release Candidate
```

### 5.2 标签管理
```bash
# 创建带注释的标签
git tag -a v1.2.0 -m "Release version 1.2.0

Features:
- User management system
- Product catalog
- Order processing

Bug fixes:
- Fixed payment gateway timeout
- Resolved inventory sync issues"

# 推送标签
git push origin v1.2.0

# 列出所有标签
git tag -l

# 查看标签信息
git show v1.2.0
```

### 5.3 变更日志 (CHANGELOG.md)
```markdown
# 变更日志

## [1.2.0] - 2024-01-15

### 新增
- 用户管理系统
- 产品目录功能
- 订单处理流程
- 移动端支持

### 修改
- 优化数据库查询性能
- 改进用户界面体验
- 更新API文档

### 修复
- 修复支付网关超时问题
- 解决库存同步异常
- 修复用户登录状态丢失

### 移除
- 移除过时的API端点
- 清理无用的依赖包

## [1.1.0] - 2024-01-01

### 新增
- 基础用户认证
- 产品信息管理
- 简单订单功能
```

## 6. 持续集成配置

### 6.1 GitHub Actions配置
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
    
    - name: Build application
      run: npm run build

  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit
    
    - name: Run SAST scan
      uses: github/super-linter@v4
      env:
        DEFAULT_BRANCH: main
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 6.2 代码质量门禁
```bash
# 合并前必须满足的条件
- 所有自动化测试通过
- 代码覆盖率 >= 80%
- 无高危安全漏洞
- 代码规范检查通过
- 至少2名开发者审查通过
- 技术负责人最终审批
```

## 7. Git配置和工具

### 7.1 Git全局配置
```bash
# 用户信息配置
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# 编辑器配置
git config --global core.editor "code --wait"

# 默认分支名
git config --global init.defaultBranch main

# 自动换行配置
git config --global core.autocrlf input  # Linux/Mac
git config --global core.autocrlf true   # Windows

# 推送配置
git config --global push.default simple

# 别名配置
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

### 7.2 .gitignore配置
```bash
# Node.js项目
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 构建输出
dist/
build/
*.tgz
*.tar.gz

# IDE文件
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统文件
.DS_Store
Thumbs.db

# 日志文件
logs/
*.log

# 临时文件
tmp/
temp/
```

### 7.3 Git Hooks配置
```bash
# pre-commit hook
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 运行代码格式检查
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Please fix the issues before committing."
  exit 1
fi

# 运行测试
npm run test
if [ $? -ne 0 ]; then
  echo "Tests failed. Please fix the issues before committing."
  exit 1
fi

echo "Pre-commit checks passed!"
```

## 8. 团队协作最佳实践

### 8.1 分支保护规则
```bash
# main分支保护设置
- 禁止直接推送
- 要求pull request审查
- 要求状态检查通过
- 要求分支为最新状态
- 限制推送权限

# develop分支保护设置
- 要求pull request审查
- 要求状态检查通过
- 允许管理员绕过限制
```

### 8.2 冲突解决策略
```bash
# 1. 预防冲突
- 频繁同步主分支
- 保持功能分支小而专注
- 及时合并已完成的功能

# 2. 解决冲突
git checkout feature/my-feature
git rebase develop

# 解决冲突后
git add .
git rebase --continue

# 3. 强制推送 (谨慎使用)
git push --force-with-lease origin feature/my-feature
```

### 8.3 代码回滚策略
```bash
# 1. 撤销最后一次提交 (未推送)
git reset --soft HEAD~1

# 2. 撤销已推送的提交
git revert <commit-hash>

# 3. 紧急回滚到指定版本
git checkout main
git reset --hard <stable-commit-hash>
git push --force-with-lease origin main
```

## 9. 常见问题与解决方案

### 9.1 常见Git问题
```bash
# 1. 忘记切换分支就开始开发
git stash
git checkout -b feature/correct-branch
git stash pop

# 2. 提交信息写错
git commit --amend -m "correct commit message"

# 3. 推送到错误分支
git push origin :wrong-branch  # 删除远程错误分支
git push origin correct-branch

# 4. 合并了错误的分支
git reset --hard HEAD~1  # 撤销合并
```

### 9.2 性能优化
```bash
# 1. 清理本地仓库
git gc --prune=now
git remote prune origin

# 2. 浅克隆大仓库
git clone --depth 1 <repository-url>

# 3. 部分克隆
git clone --filter=blob:none <repository-url>
```

## 10. 监控和度量

### 10.1 Git统计信息
```bash
# 提交统计
git shortlog -sn

# 代码行数统计
git log --stat

# 分支活跃度
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | sort -k2
```

### 10.2 团队协作指标
- 平均代码审查时间
- 分支生命周期
- 提交频率和质量
- 冲突解决时间
- 代码覆盖率趋势

---

**文档版本**: v1.0  
**最后更新**: 2024-01-15  
**维护人员**: 开发团队