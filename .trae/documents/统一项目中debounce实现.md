## 统一项目中debounce实现计划

### 问题分析
项目中存在3个不同的debounce实现，分别位于：
1. `src/utils/lib-utils.ts` - 带有clear方法的完整实现
2. `src/utils/event.ts` - 基础实现，无clear方法
3. `src/utils/format.ts` - 基础实现，无clear方法

### 统一方案
1. **保留统一实现**：保留`src/utils/lib-utils.ts`中的debounce实现作为项目唯一的debounce实现，因为它功能更完整（带有clear方法）

2. **删除冗余实现**：删除`src/utils/event.ts`和`src/utils/format.ts`中的debounce实现

3. **更新导入路径**：确保所有使用debounce的地方都从`lib-utils.ts`导入

### 实施步骤
1. 删除`src/utils/event.ts`中的debounce函数
2. 删除`src/utils/format.ts`中的debounce函数
3. 检查并更新所有使用debounce的文件，确保它们从正确的路径导入
4. 运行测试，确保所有功能正常

### 预期结果
- 项目中只有一个debounce实现，减少代码冗余
- 所有debounce调用都使用统一的实现，提高代码一致性
- 统一的实现带有clear方法，提供更完整的功能

### 风险评估
- 低风险：只有少数文件使用了debounce，修改范围较小
- 测试覆盖：已有的测试用例可以确保debounce功能正常

### 后续建议
- 考虑将debounce和throttle等工具函数统一放在一个专门的文件中，如`src/utils/debounce-throttle.ts`
- 为debounce函数添加更多测试用例，确保其在各种场景下的正确性