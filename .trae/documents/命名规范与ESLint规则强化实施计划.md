# 命名规范与ESLint规则强化实施计划

## 1. 项目现状分析
- **现有ESLint配置**：包含基础规则，但缺少导入顺序、严格命名规范和禁止泛化名称规则
- **配置文件情况**：存在两个ESLint配置文件（`.eslintrc.json`和`.eslintrc.js`），需要合并避免重复
- **依赖情况**：已安装TypeScript ESLint插件和Prettier，但缺少`eslint-plugin-import`

## 2. 实施目标
- 将项目命名规范以Lint规则“可执行化”，在提交前自动校验与修复
- 引入导入顺序与分组规则，统一代码结构与风格
- 禁止使用泛化名称和不规范命名

## 3. 具体实施步骤

### 3.1 依赖安装
- 安装`eslint-plugin-import`依赖

### 3.2 ESLint配置优化
- 合并`.eslintrc.json`和`.eslintrc.js`配置文件，统一到`.eslintrc.json`
- 添加`import`插件到ESLint配置

### 3.3 规则配置

#### 3.3.1 导入顺序规则
```json
{
  "rules": {
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", ["parent", "sibling", "index"]],
        "pathGroups": [{ "pattern": "@/**", "group": "internal" }],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ]
  }
}
```

#### 3.3.2 命名规范规则
```json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      { "selector": "variableLike", "format": ["camelCase"] },
      { "selector": "function", "format": ["camelCase"] },
      { "selector": "class", "format": ["PascalCase"] },
      { "selector": "typeLike", "format": ["PascalCase"] },
      { "selector": "enumMember", "format": ["PascalCase"] },
      { "selector": "variable", "modifiers": ["const", "exported"], "format": ["UPPER_CASE"] },
      { "selector": "property", "format": ["camelCase", "snake_case"] }
    ]
  }
}
```

#### 3.3.3 禁止泛化名称规则
```json
{
  "rules": {
    "id-denylist": [
      "error",
      "data", "info", "temp", "obj", "arr", "str", "num", "flag"
    ],
    "id-length": ["error", { "min": 2, "exceptions": ["i", "j", "k", "x", "y"] }]
  }
}
```

### 3.4 现有代码修复
- 运行`npm run lint -- --fix`自动修复可修复的问题
- 手动修复剩余的命名规范问题

### 3.5 PR模板更新
- 在PR模板中增加命名规范和导入顺序的核对清单

## 4. 验收标准
- 导入语句按“内置/外部/内部/相对路径”分组且字母序一致，空行分隔统一
- 变量/函数均为`camelCase`；类型/类为`PascalCase`；导出的常量为`SCREAMING_SNAKE_CASE`
- 禁用泛化名称通过`id-denylist`拦截；单字母变量受控（常见迭代除外）
- 本地执行`npm run lint`无错误；在提交前由`lint-staged`自动执行校验与修复

## 5. 风险与应对措施
- **与Next.js框架冲突**：避免启用与框架约束相悖的规则
- **历史代码修复工作量大**：先放宽为`warn`，完成批量修复后提升为`error`

## 6. 预期效果
- 代码风格统一，可读性提升
- 团队协作效率提高
- 代码质量在提交前得到自动保障
- 命名规范得到严格执行