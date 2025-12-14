## 实现计划

### 1. 安装GSAP依赖
- 安装GSAP核心库：`pnpm add gsap`

### 2. 启用登录方式切换功能
- 取消注释LoginView.tsx中第76-109行的登录方式切换代码
- 该代码已经实现了密码登录和短信登录的切换逻辑

### 3. 实现GSAP Pill Nav效果
- 在LoginView组件中导入GSAP
- 替换现有的framer-motion标签动画为GSAP实现的Pill Nav效果
- 实现选中标签的平滑过渡动画
- 添加悬停效果和交互反馈

### 4. 样式调整
- 调整标签样式，使其符合Pill Nav的设计
- 确保选中状态的视觉效果突出
- 优化响应式设计

### 5. 测试和优化
- 测试登录方式切换功能是否正常
- 优化动画性能和流畅度
- 确保在不同设备上的显示效果一致

## 技术实现细节

- 使用GSAP的`timeline`和`tween`功能实现平滑过渡
- 保留现有的LoginForm和SmsLoginForm组件
- 维持原有的登录逻辑不变
- 仅优化UI交互体验

## 文件修改

- `package.json`：添加GSAP依赖
- `src/features/auth/components/LoginView.tsx`：实现Pill Nav效果

## 预期效果

- 登录页面显示密码登录和短信登录两个Pill Nav标签
- 点击标签时，Pill形状平滑过渡到选中标签
- 标签切换时，表单内容平滑切换
- 增强用户交互体验，使界面更加现代化