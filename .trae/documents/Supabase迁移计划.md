# Supabase迁移计划

## 一、迁移准备阶段

### 1. 安装Supabase CLI
- 安装Supabase CLI工具，用于执行迁移命令
- 配置CLI认证，连接到目标Supabase项目

### 2. 环境变量配置
- **前端配置**：在 `slideboard-frontend/.env` 中设置Supabase连接信息
  - `NEXT_PUBLIC_SUPABASE_URL`：Supabase项目URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase匿名访问密钥

- **后端配置**：在 `slideboard-backend/.env` 中设置Supabase数据库连接
  - `DATABASE_URL`：Supabase数据库连接字符串

- **项目根目录配置**：在 `.env` 中添加Supabase CLI配置
  - `SUPABASE_PROJECT_ID`：Supabase项目ID
  - `SUPABASE_ACCESS_TOKEN`：Supabase访问令牌

## 二、迁移执行阶段

### 1. 初始化Supabase CLI配置
- 执行 `supabase init` 命令，生成Supabase CLI配置文件
- 配置 `supabase/config.toml` 文件，指定项目ID和数据库URL

### 2. 执行迁移命令
- 执行 `supabase migration up` 命令，将迁移文件应用到Supabase数据库
- 验证迁移结果，确保所有表和RLS策略都已正确创建

### 3. 生成TypeScript类型
- 执行 `supabase gen types typescript --linked > slideboard-frontend/src/types/supabase.ts` 命令
- 生成最新的数据库类型定义，用于前端开发

## 三、验证和测试阶段

### 1. 数据库验证
- 登录Supabase控制台，检查数据库表结构
- 验证RLS策略是否正确应用
- 测试数据访问权限，确保不同角色的用户只能访问授权数据

### 2. 前端连接测试
- 启动前端开发服务器
- 测试Supabase客户端连接
- 验证用户认证和数据查询功能

### 3. 后端连接测试
- 启动后端开发服务器
- 测试数据库连接和查询
- 验证API功能是否正常

## 四、优化和完善阶段

### 1. 调整RLS策略
- 根据实际业务需求，调整和完善RLS策略
- 添加更多细粒度的权限控制

### 2. 优化数据库结构
- 根据性能测试结果，优化数据库索引
- 调整表结构，提高查询效率

### 3. 配置监控和日志
- 配置Supabase监控，监控数据库性能
- 设置日志记录，便于调试和问题排查

## 五、迁移完成后的后续工作

### 1. 更新项目文档
- 更新README.md，添加Supabase相关的配置和使用说明
- 记录迁移过程中的问题和解决方案

### 2. 培训开发团队
- 培训开发团队使用Supabase CLI和相关工具
- 分享Supabase最佳实践和开发技巧

### 3. 制定持续迁移策略
- 建立迁移文件管理规范
- 制定持续集成和部署流程，确保迁移文件的正确应用

## 六、风险评估和应对措施

### 1. 数据安全风险
- **风险**：迁移过程中可能出现数据泄露或权限配置错误
- **应对**：严格按照最小权限原则配置RLS策略，迁移前备份数据，迁移后进行安全审计

### 2. 应用兼容性风险
- **风险**：迁移后应用可能出现兼容性问题
- **应对**：在测试环境充分测试，建立回滚机制，确保出现问题时可以快速恢复

### 3. 性能风险
- **风险**：迁移后数据库性能可能下降
- **应对**：优化数据库结构和索引，监控性能指标，及时调整配置

## 七、迁移成功标准

1. 所有迁移文件成功应用到Supabase数据库
2. 数据库表结构和RLS策略正确配置
3. 前端和后端能够正常连接到Supabase数据库
4. 应用功能正常运行，无明显性能问题
5. 数据访问权限控制有效，符合业务需求

## 八、迁移工具和命令清单

| 工具/命令 | 用途 | 执行位置 |
|-----------|------|----------|
| `npm install -g supabase` | 安装Supabase CLI | 全局 |
| `supabase init` | 初始化Supabase CLI配置 | 项目根目录 |
| `supabase migration up` | 执行迁移 | 项目根目录 |
| `supabase gen types typescript` | 生成TypeScript类型 | 项目根目录 |
| `npm run dev` | 启动前端开发服务器 | slideboard-frontend |
| `npm run dev` | 启动后端开发服务器 | slideboard-backend |