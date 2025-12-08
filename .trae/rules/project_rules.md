不使用邮箱

## 命名规范强制要求

**所有的命名都必须严格按照 `/Users/laichangcheng/Documents/trae/L2C/需求/03-开发实施/09-命名规范标准.md` 中的命名规范标准执行，不允许任何偏差。**

### 强制执行规则：
1. **变量命名**：必须使用 camelCase 格式
2. **常量命名**：必须使用 SCREAMING_SNAKE_CASE 格式  
3. **函数命名**：必须使用 camelCase 格式，并清晰表达功能
4. **类命名**：必须使用 PascalCase 格式
5. **数据库表名和字段名**：必须使用 snake_case 格式
6. **API路径**：必须使用 kebab-case 格式
7. **文件命名**：组件文件使用 PascalCase，其他文件使用 kebab-case
8. **CSS类名**：必须遵循 BEM 规范

### 禁止使用的命名：
- data, info, temp, obj, arr, str, num, flag 等过于泛化的名称
- 拼音命名
- 不规范的缩写

**违反命名规范的代码将被拒绝合并，必须修改后重新提交。**

技术栈：** Next.js 15+ (Web端) + Supabase (BaaS - Auth, DB, Realtime, Storage)