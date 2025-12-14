# UI/UX 开发常见问题 (FAQ)

> L2C 项目主题化开发指南

---

## 基础概念

### Q1: L2C 有哪些主题？

**A**: L2C 实现了**三种主题**：

1. **warmRicePaper**（暖宣纸主题）
   - 米黄色背景 + 墨色文字
   - 纸张纹理效果
   - 适合长时间阅读

2. **liquidGlass**（液态玻璃主题）
   - 半透明玻璃效果
   - 紫-蓝渐变背景
   - 现代化设计感

3. **linear**（精准暗黑主题）
   - 纯黑背景 + 高对比白色文字
   - 零圆角设计
   - 极简技术风

### Q2: 主题是如何工作的？

**A**: 通过 CSS 变量系统实现：

1. `globals.css` 定义每个主题的变量值
2. 组件使用语义化变量（如 `--theme-text-primary`）
3. 切换主题时，`<body>` 的 class 改变（如 `theme-warm`）
4. CSS 变量值自动更新，所有组件跟随变化

---

## 开发规范

### Q3: 什么时候使用 Paper 组件，什么时候直接用 Tailwind？

**A**: 

**优先使用 Paper 组件**：
- `PaperCard`、`PaperButton`、`PaperModal` 等已有组件
- 代码更简洁，自动主题化
- 统一的设计语言

**可以直接用 Tailwind 的情况**：
- 需要高度定制化且 Paper 组件无法满足
- 但**必须**使用主题变量类（`bg-theme-bg-primary` 等）
- **禁止**使用固定颜色类（`bg-white`、`text-gray-900` 等）

**示例**：
```tsx
// ✅ 推荐
<PaperCard padding="md">内容</PaperCard>

// ✅ 可接受（紧急情况且 Paper 组件不适用）
<div className="bg-theme-bg-primary text-theme-text-primary p-6 rounded-xl">

// ❌ 禁止
<div className="bg-white text-gray-900 p-6 rounded-xl">
```

### Q4: 如何为新功能选择合适的颜色？

**A**: 按照功能语义选择：

| 功能类型 | 使用颜色 | 示例 |
|---------|---------|------|
| 功能相关、交互 | `primary-*` | 主按钮、链接 |
| 成功状态 | `success-*` | 成功提示、完成标记 |
| 警告提示 | `warning-*` | 警告信息、待处理 |
| 错误状态 | `error-*` | 错误提示、失败标记 |
| 信息提示 | `info-*` | 一般信息 |
| 中性内容 | `theme-text-*` / `theme-bg-*` | 正文、背景 |

**完整示例**：
```tsx
// 功能按钮
<button className="bg-primary-500 hover:bg-primary-600">提交</button>

// 成功提示
<div className="bg-success-100 text-success-800 border border-success-500">
  操作成功
</div>

// 警告
<div className="bg-warning-100 text-warning-800">
  请注意...
</div>
```

### Q5: 硬编码颜色为什么不好？

**A**: 硬编码颜色的问题：

1. **无法适配主题** - 在暗色主题下白色背景刺眼
2. **维护困难** - 修改设计需要全局查找替换
3. **不一致** - 不同开发者使用不同的灰度值
4. **无法响应用户偏好** - 无法支持高对比模式等无障碍功能

**对比**：
```tsx
// ❌ 硬编码 - 在 linear 主题下惨不忍睹
<div className="bg-white text-gray-900">

// ✅ 主题变量 - 自动适配所有主题
<div className="bg-theme-bg-primary text-theme-text-primary">
```

---

## 主题变量

### Q6: 常用的主题变量有哪些？

**A**: 请参考 [技术栈文档 - 主题变量速查表](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/docs/技术栈.md#L326-L337)

**最常用的**：
- `text-theme-text-primary` - 主要文字
- `text-theme-text-secondary` - 次要文字
- `bg-theme-bg-primary` - 主要背景
- `bg-theme-bg-secondary` - 卡片背景
- `border-theme-border` - 边框

### Q7: 什么时候用 Tailwind 类，什么时候用 `style={{ }}`？

**A**: 

**使用 Tailwind 类**（优先）：
- 静态样式
- 响应式设计
- 常用的设计 token

**使用内联 style**：
- 动态计算的值（如进度条宽度）
- 使用 CSS 变量的特殊场景
- 动画的动态参数

**示例**：
```tsx
// ✅ Tailwind 类（静态样式）
<div className="p-6 bg-theme-bg-primary rounded-xl">

// ✅ 内联 style（动态值）
<div style={{ width: `${percentage}%` }}>

// ✅ 内联 style（CSS 变量）
<div style={{ borderRadius: 'var(--radius-xl)' }}>

// ❌ 不要用内联 style 写静态值
<div style={{ padding: '24px', backgroundColor: 'white' }}>
```

---

## 响应式设计

### Q8: 如何正确实现响应式布局？

**A**: 遵循**移动优先**原则：

1. 默认样式针对移动端
2. 使用 `md:`、`lg:` 等前缀渐进增强
3. 不要使用 `sm:` 覆盖大屏样式

**正确示例**：
```tsx
// ✅ 移动优先
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">

// ❌ 桌面优先（反模式）
<div className="p-8 md:p-6 sm:p-4">
```

**断点说明**：
- `sm: 640px` - 大手机
- `md: 768px` - 平板竖屏
- `lg: 1024px` - 平板横屏/小笔记本
- `xl: 1280px` - 桌面
- `2xl: 1536px` - 大屏桌面

### Q9: 触摸友好设计有什么要求？

**A**: 

- **最小点击区域**：44×44px（Apple 和 Google 的推荐标准）
- **按钮间距**：至少 8px
- **表单输入框**：高度至少 44px

**示例**：
```tsx
// ✅ 触摸友好
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="h-5 w-5" />
</button>

// ❌ 太小
<button className="p-1">
  <Icon className="h-3 w-3" />
</button>
```

---

## 测试与验证

### Q10: 如何测试我的代码在三种主题下都正常？

**A**: 

**方法 1: 手动切换**
1. 运行开发服务器
2. 使用主题切换器在三种主题间切换
3. 检查每个主题下的显示效果

**方法 2: 使用快捷脚本**
```javascript
// 在 Chrome DevTools Console 中运行
const themes = ['theme-warm', 'theme-glass', 'theme-linear'];
let i = 0;

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 't') {
    i = (i + 1) % themes.length;
    document.body.className = themes[i];
    console.log(`切换到: ${themes[i]}`);
  }
});

// 按 Ctrl+T 快速切换主题
```

**方法 3: 截图对比**
- 提 PR 前截取三种主题的截图
- 附在 PR 描述中

### Q11: 如何检查对比度是否符合无障碍标准？

**A**: 

**工具**：
1. **Chrome DevTools** - Elements 面板 > Styles > Color Picker > 对比度指示器
2. **Lighthouse** - DevTools > Lighthouse > Accessibility
3. **在线工具** - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**标准**：
- WCAG AA 正文文字：≥ 4.5:1
- WCAG AA 大文字（18px+）：≥ 3:1

**经验**：
- `text-theme-text-primary` 已保证符合标准
- 自定义颜色需要手动验证

---

## 常见错误

### Q12: 为什么我的自定义颜色在 linear 主题下看不见？

**A**: 

可能原因：
1. 使用了浅色文字 + 黑色背景（或反之）
2. 没有使用主题变量，颜色不会随主题变化

**解决方案**：
```tsx
// ❌ 问题代码
<p className="text-gray-400">次要文字</p>  // 在黑色背景下对比度不足

// ✅ 修复
<p className="text-theme-text-secondary">次要文字</p>
```

### Q13: liquidGlass 主题下我的边框看不清？

**A**: 

玻璃效果 + 半透明背景可能导致边框不明显。

**解决方案**：
```tsx
// ✅ 增加边框对比度
<div className="border-2 border-theme-border">

// ✅ 或使用阴影代替边框
<div className="shadow-md">
```

### Q14: 为什么我的 Markdown 内容颜色不对？

**A**: 

确保使用了 `.markdown-content` 类：

```tsx
import ReactMarkdown from 'react-markdown';

// ✅ 正确
<div className="markdown-content">
  <ReactMarkdown>{content}</ReactMarkdown>
</div>

// ❌ 缺少 markdown-content 类
<ReactMarkdown>{content}</ReactMarkdown>
```

---

## 性能优化

### Q15: 使用主题变量会影响性能吗？

**A**: 

**不会**。CSS 变量是浏览器原生功能，性能开销极小。

**优势**：
- 减少 CSS 文件大小（复用变量）
- 主题切换无需重新加载样式
- GPU 加速的颜色计算

### Q16: 应该避免哪些性能陷阱？

**A**: 

1. **避免深层选择器嵌套**（≤ 3 层）
```css
/* ❌ 太深 */
.parent .child .grandchild .great-grandchild { }

/* ✅ 扁平化 */
.great-grandchild { }
```

2. **动画使用 transform 和 opacity**
```css
/* ✅ GPU 加速 */
.animate {
  transform: translateX(100%);
  transition: transform 0.3s;
}

/* ❌ 触发重排 */
.animate {
  left: 100%;
  transition: left 0.3s;
}
```

---

##团队协作

### Q17: 提PR时需要注意什么？

**A**: 

**UI相关PR检查清单**：
- [ ] 代码使用主题变量（无硬编码颜色）
- [ ] 在三种主题下测试通过
- [ ] 响应式设计正确（移动优先）
- [ ] 无障碍性检查通过
- [ ] 附上三种主题的截图

### Q18: 如何Review UI代码？

**A**: 

**Review要点**：
1. 检查是否使用主题变量
2. 检查响应式断点是否正确
3. 检查是否有无障碍性问题
4. 检查 Paper组件使用是否恰当
5. 检查 `cn()` 工具是否正确使用

---

## 进阶话题

### Q19: 如何创建自定义主题？

**A**: 

在 `globals.css` 中添加新主题类：

```css
.theme-custom {
  --theme-text-primary: #your-color;
  --theme-bg-primary: #your-bg;
  /* ...更多变量 */
  
  background-color: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}
```

### Q20: 我想深入学习，有什么资源？

**A**: 

**内部文档**：
- [技术栈.md - UI/UX最佳实践](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/docs/技术栈.md#L261-L434)
- [globals.css - 主题实现](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/slideboard-frontend/src/app/globals.css)
- [UI代码示例](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/docs/ui-code-examples.md)

**外部资源**：
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [OKLCH 色彩空间](https://oklch.com/)
- [WCAG 无障碍标准](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 需要帮助？

如果以上FAQ未能解答您的问题：

1. 查阅 [技术栈文档](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/docs/技术栈.md)
2. 查看现有Paper组件的实现
3. 咨询前端技术负责人
4. 在团队群中提问

**记住核心原则**：使用主题变量，拥抱Paper组件，移动优先！🎨
