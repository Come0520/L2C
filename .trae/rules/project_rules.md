先试用邮箱进行用户管理，后面再考虑是否引入其他认证方式。

## 命名规范强制要求

**所有的命名都必须严格按照 `/Users/laichangcheng/Documents/trae/L2C/需求/03-开发实施/09-命名规范标准.md` 中的命名规范标准执行，不允许任何偏差。**

### 强制执行规则：
1. **变量命名**：必须使用 camelCase 格式
2. **常量命名**：必须使用 SCREAMING_SNAKE_CASE 格式  
3. **函数命名**：必须使用 camelCase 格式，并清晰表达功能
4. **类/组件命名**：必须使用 PascalCase 格式
5. **数据库表名和字段名**：必须使用 snake_case 格式
6. **API路径**：必须使用 kebab-case 格式
7. **文件命名**：**全项目统一使用 kebab-case 格式**（例如：`user-profile.tsx`, `order-list.tsx`）。禁止使用 PascalCase 命名文件，以避免大小写敏感的文件系统问题。
8. **CSS类名**：优先使用 Tailwind CSS 类名。自定义 CSS 必须遵循 BEM 规范。
9. **接口与类型**：使用 PascalCase 格式，**不要**添加 `I` 前缀（例如：使用 `UserData` 而不是 `IUserData`）。

### 禁止使用的命名：
- data, info, temp, obj, arr, str, num, flag 等过于泛化的名称
- 拼音命名
- 不规范的缩写

**违反命名规范的代码将被拒绝合并，必须修改后重新提交。**

技术栈：** Next.js 16+ (Web端) + Supabase (BaaS - Auth, DB, Realtime, Storage)