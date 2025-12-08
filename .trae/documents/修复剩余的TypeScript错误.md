## 修复计划

### 1. 修复 app/orders/measurements/templates/create/page.tsx 中的错误

#### 问题1：类型不兼容 - string 不能分配给 RoomType
- **位置**：第61行，`rooms: measurementData.rooms`
- **原因**：`measurementData.rooms` 中的 `type` 属性是 `string` 类型，而 `createTemplate` 方法期望的是 `RoomType` 类型
- **解决方案**：修改 `createTemplate` 调用，将 `type` 转换为 `RoomType` 类型

#### 问题2：组件属性不匹配
- **位置**：第133-134行，`measurementData={measurementData}` 和 `onMeasurementDataChange={setMeasurementData}`
- **原因**：`MeasurementDataEditor` 组件期望 `value` 和 `onChange` 属性，而不是 `measurementData` 和 `onMeasurementDataChange`
- **解决方案**：修改 `MeasurementDataEditor` 组件的属性名，使用 `value` 和 `onChange`

### 2. 修复 features/installations/components/form/installation-create-form.tsx 中的错误

#### 问题1：找不到模块
- **位置**：第9-11行，导入 `paper-date-picker`、`paper-time-picker` 和 `paper-checkbox`
- **原因**：这些模块不存在或路径错误
- **解决方案**：删除不存在的导入，或修复导入路径

#### 问题2：PaperSelectProps 不存在 loading 属性
- **位置**：第203行和第215行
- **原因**：`PaperSelectProps` 类型中没有 `loading` 属性
- **解决方案**：删除 `loading` 属性，或使用其他方式显示加载状态

#### 问题3：多次指定了 onChange
- **位置**：第206行和第218行
- **原因**：同一个组件多次指定了 `onChange` 属性
- **解决方案**：合并 `onChange` 处理逻辑，只保留一个 `onChange` 属性

#### 问题4：PaperInputProps 不存在 multiline 属性
- **位置**：第420行
- **原因**：`PaperInputProps` 类型中没有 `multiline` 属性
- **解决方案**：使用 `textarea` 元素代替，或使用支持多行输入的组件

#### 问题5：ButtonProps 不存在 loading 属性
- **位置**：第440行
- **原因**：`ButtonProps` 类型中没有 `loading` 属性
- **解决方案**：删除 `loading` 属性，或使用其他方式显示加载状态

### 3. 修复 features/installations/components/list/installation-table.tsx 中的错误

#### 问题1：TableColumn 不存在
- **位置**：第6行，导入 `TableColumn`
- **原因**：`@/components/ui/paper-table` 中没有导出 `TableColumn`
- **解决方案**：删除 `TableColumn` 导入，或修复导入路径

#### 问题2：CreateInstallationRequest 中不存在 salesOrderNo
- **位置**：第161行
- **原因**：`CreateInstallationRequest` 类型中没有 `salesOrderNo` 属性
- **解决方案**：使用 `salesOrderId` 代替，或添加 `salesOrderNo` 属性到类型定义

#### 问题3：使用 any 类型索引对象
- **位置**：第260行
- **原因**：使用 `any` 类型的表达式来索引对象
- **解决方案**：添加类型断言，确保索引类型正确

#### 问题4：PaperTableProps 不存在 columns 属性
- **位置**：第384行
- **原因**：`PaperTableProps` 类型中没有 `columns` 属性
- **解决方案**：修改 `PaperTable` 组件的使用方式，使用正确的属性名

#### 问题5：PaperDialog 组件属性不匹配
- **位置**：第398行
- **原因**：`PaperDialog` 组件没有 `onClose`、`onConfirm` 等属性
- **解决方案**：修改 `PaperDialog` 组件的使用方式，使用正确的属性名

### 4. 修复 features/installations/components/calendar/installation-calendar.tsx 中的错误

#### 问题1：string | undefined 不能分配给 string
- **位置**：第331行和第350行
- **原因**：将可能为 `undefined` 的值传递给需要 `string` 类型的参数
- **解决方案**：添加默认值或类型断言，确保值不为 `undefined`

#### 问题2：未使用的变量
- **位置**：第54行，`currentDate` 变量
- **原因**：声明了变量但未使用
- **解决方案**：删除未使用的变量，或使用它

### 5. 修复 services/installation-schedule.client.ts 中的剩余错误

#### 问题1：sales_order_no 属性不存在
- **位置**：第87行
- **原因**：类型中没有 `sales_order_no` 属性
- **解决方案**：使用正确的属性名，或添加类型断言

#### 问题2：undefined 不能作为索引类型
- **位置**：第414行
- **原因**：使用可能为 `undefined` 的值作为索引
- **解决方案**：添加类型检查，确保索引值不为 `undefined`

#### 问题3：string | undefined 不能分配给 string
- **位置**：第419行和第500行
- **原因**：将可能为 `undefined` 的值传递给需要 `string` 类型的参数
- **解决方案**：添加默认值或类型断言

#### 问题4：installation_no 属性不存在
- **位置**：第553行
- **原因**：类型中没有 `installation_no` 属性
- **解决方案**：使用正确的属性名，或添加类型断言

## 修复顺序

1. 先修复 `app/orders/measurements/templates/create/page.tsx` 中的错误
2. 然后修复 `features/installations/components/form/installation-create-form.tsx` 中的错误
3. 接着修复 `features/installations/components/list/installation-table.tsx` 中的错误
4. 然后修复 `features/installations/components/calendar/installation-calendar.tsx` 中的错误
5. 最后修复 `services/installation-schedule.client.ts` 中的剩余错误

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