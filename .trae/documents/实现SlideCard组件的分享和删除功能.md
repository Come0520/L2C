## 实现SlideCard组件的分享和删除功能

### 1. 分享功能实现
- **修改`handleShare`函数**：
  - 使用Web Share API分享幻灯片链接
  - 构建分享内容，包括标题、描述和链接
  - 添加复制链接到剪贴板的fallback方案
  - 添加成功提示

### 2. 删除功能实现
- **修改`handleDelete`函数**：
  - 添加确认对话框，防止误操作
  - 导入Supabase客户端
  - 调用Supabase API删除幻灯片
  - 删除成功后刷新页面或更新状态

### 3. 实现步骤
1. **导入必要依赖**：
   - 从`@/lib/supabase/client`导入`createClient`
   - 考虑添加toast组件用于提示

2. **实现分享功能**：
   ```typescript
   const handleShare = async () => {
     const shareUrl = `${window.location.origin}/present/${slide.id}`;
     try {
       await navigator.share({
         title: slide.title,
         text: slide.description,
         url: shareUrl,
       });
     } catch (error) {
       // 复制链接到剪贴板
       await navigator.clipboard.writeText(shareUrl);
       // 显示复制成功提示
     }
   };
   ```

3. **实现删除功能**：
   ```typescript
   const handleDelete = async () => {
     if (confirm('确定要删除这个幻灯片吗？')) {
       const supabase = createClient();
       const { error } = await supabase
         .from('slides')
         .delete()
         .eq('id', slide.id);
       
       if (error) {
         console.error('删除失败:', error);
       } else {
         // 删除成功，刷新页面或更新状态
         router.refresh();
       }
     }
   };
   ```

### 4. 验证
- 手动测试分享功能：
  - 点击分享按钮，测试Web Share API
  - 在不支持Web Share API的环境下，测试复制链接功能
- 手动测试删除功能：
  - 点击删除按钮，确认对话框是否显示
  - 确认删除后，检查幻灯片是否被成功删除

### 5. 注意事项
- 确保Supabase客户端正确配置
- 处理可能的错误情况
- 确保用户体验流畅，添加适当的反馈
- 遵循项目的命名规范和代码风格