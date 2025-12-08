# 将项目中所有alert替换为toast

## 修复范围

1. `src/app/profile/settings/page.tsx` - 2个alert
2. `src/app/system/team/page.tsx` - 7个alert
3. `src/app/leads/page.tsx` - 2个alert
4. `src/app/leads/kanban/page.tsx` - 1个alert
5. `src/app/quotes/create/page.tsx` - 1个alert
6. `src/app/quotes/[id]/page.tsx` - 1个alert
7. `src/app/quotes/[id]/edit/page.tsx` - 1个alert
8. `src/app/quotes/collaboration/[id]/page.tsx` - 5个alert
9. `src/app/test/page.tsx` - 1个alert
10. `src/features/orders/components/measuring-pending-assignment-view.tsx` - 1个alert
11. `src/features/orders/components/installing-pending-visit-view.tsx` - 6个alert
12. `src/features/orders/components/survey-pending-confirmation-view.tsx` - 2个alert
13. `src/features/orders/components/installing-assignment-in-progress-view.tsx` - 7个alert
14. `src/features/orders/components/installing-pending-confirmation-view.tsx` - 2个alert
15. `src/features/orders/components/survey-assignment-in-progress-view.tsx` - 1个alert
16. `src/features/orders/components/create-slide-modal.tsx` - 2个alert
17. `src/features/orders/components/survey-pending-assignment-view.tsx` - 3个alert
18. `src/features/orders/components/measuring-pending-confirmation-view.tsx` - 1个alert

## 修复内容

1. 在每个文件中导入toast组件：`import { toast } from '@/components/ui/toast'`
2. 将所有`alert()`调用替换为相应的`toast.success()`, `toast.error()`, `toast.info()`或`toast.warning()`
3. 确保toast的消息内容与原alert一致
4. 确保toast的样式和行为符合项目设计规范

## 修复步骤

1. **第一步**：修复app目录下的文件
2. **第二步**：修复features/orders/components目录下的文件
3. **第三步**：运行lint检查，确保所有修复符合规范
4. **第四步**：运行类型检查，确保所有修复符合类型安全要求

## 预期结果

* 所有alert被替换为toast
* 用户体验得到提升
* 代码更加现代化和一致
* 符合项目设计规范
* 没有引入新的错误
