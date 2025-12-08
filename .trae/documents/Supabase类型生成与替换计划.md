# Supabase类型生成与替换计划

## 1. 生成Supabase类型
- 运行`npm run supabase:generate-types`命令生成Supabase类型定义文件
- 检查生成的`src/types/supabase.ts`文件是否包含完整的类型定义

## 2. 替换services中的any类型
- 遍历`src/services/`目录下的所有`.ts`文件
- 识别并替换使用`any`类型的地方为生成的Supabase类型
- 重点检查：
  - `auth.client.ts`中的登录相关方法
  - 其他服务文件中的数据库操作返回类型
  - API响应处理中的类型定义

## 3. 添加CI流程检测类型漂移
- 修改CI配置文件（如GitHub Actions workflow）
- 添加类型生成和检查步骤：
  - 运行`npm run supabase:generate-types`
  - 使用git diff检查类型文件是否有变化
  - 如果有变化，CI流程失败，提示类型漂移

## 4. 测试和验证
- 运行`npm run typecheck`确保类型正确
- 运行测试套件`npm test`确保功能正常
- 手动验证关键功能的类型安全性

## 5. 清理和优化
- 删除不必要的类型断言
- 确保所有类型使用符合团队命名规范
- 优化类型导入和使用方式

## 预期结果
- 所有Supabase相关操作都使用强类型
- 消除services目录中的any类型
- CI流程能够自动检测类型漂移
- 提高代码的类型安全性和可维护性