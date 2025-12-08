## 修复计划

### 1. 修复 measurement-data-editor/index.tsx 中的错误
- **问题1**：第177行，不能将类型"sm"分配给类型"small" | "medium" | "large" | undefined
  - **解决方案**：将 PaperButton 的 size 属性从 "sm" 改为 "small"

- **问题2-5**：未使用的导入和变量警告
  - **解决方案**：删除未使用的 EditIcon 导入和未使用的 editingRoom、setEditingRoom、showAddRoomModal 变量

### 2. 修复 installation-detail-drawer.tsx 中的错误
- **问题1**：updateInstallationStatus 方法参数不匹配
  - **解决方案**：查看 updateInstallationStatus 方法的定义，修复参数调用

- **问题2**：UpdateInstallationRequest 中不存在 assignmentNotes 属性
  - **解决方案**：删除或重命名 assignmentNotes 属性

- **问题3-4**：PaperDrawer 组件不存在 open 属性
  - **解决方案**：使用 isOpen 属性代替 open 属性

- **问题5-15**：找不到 PaperTab 名称
  - **解决方案**：从 @/components/ui/paper-tabs 中导入 PaperTab 组件

### 3. 修复 installation-schedule.client.ts 中的错误
- **问题1**：类型上不存在 sales_no 属性
  - **解决方案**：添加类型检查或修改属性访问路径

- **问题2**：undefined 不能作为索引类型使用
  - **解决方案**：添加类型检查，确保索引值不为 undefined

- **问题3**：string | undefined 不能分配给 string
  - **解决方案**：添加默认值或类型断言

- **问题4**：参数 schedule 隐式具有 any 类型
  - **解决方案**：为 schedule 参数添加类型定义

- **问题5**：string | undefined 不能分配给 string
  - **解决方案**：添加默认值或类型断言

- **问题6**：类型上不存在 installation_no 属性
  - **解决方案**：添加类型检查或修改属性访问路径

- **问题7**：类型上不存在 id 属性
  - **解决方案**：使用 user.user?.id 代替 user.id

- **问题8-13**：时间相关变量可能为未定义
  - **解决方案**：添加默认值或类型检查

### 4. 修复 other 文件中的错误
- **app/orders/status/[status]/page.tsx**：类型 any[] 上不存在属性 measurer 和 id
  - **解决方案**：修复类型定义或添加类型检查

- **app/orders/measurements/templates/create/page.tsx**：找不到模块和默认导出
  - **解决方案**：修复导入路径和导入方式

- **features/installations/components/form/installation-create-form.tsx**：找不到模块、属性不存在等
  - **解决方案**：修复导入路径、移除不存在的属性

- **features/installations/components/list/installation-table.tsx**：TableColumn 不存在、属性不匹配等
  - **解决方案**：修复导入、修改属性名称

## 修复顺序

1. 先修复 measurement-data-editor/index.tsx 中的错误
2. 然后修复 installation-detail-drawer.tsx 中的错误
3. 接着修复 installation-schedule.client.ts 中的错误
4. 最后修复其他文件中的错误

## 预期效果

- 所有 TypeScript 错误都将被修复
- 代码将更加类型安全
- 运行时错误的风险将降低
- 代码质量将提高

## 注意事项

- 修复时要保持代码的原有功能不变
- 遵循项目的命名规范和代码风格
- 确保修复后的代码通过所有测试
- 对于不确定的类型，使用适当的类型断言或添加类型检查