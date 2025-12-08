## 1. 升级前准备

### 1.1 环境检查
- ✅ 确认Node.js版本（建议v18+）
- ✅ 确认Next.js版本（已安装^15.0.0）
- ✅ 备份当前配置文件：
  - `tailwind.config.js`
  - `postcss.config.js`
  - `package.json`

### 1.2 依赖分析
- 当前Tailwind CSS版本：3.4.18
- 需要升级到：tailwindcss@next
- 需要新增：@tailwindcss/postcss@next

## 2. 升级步骤

### 2.1 清理依赖缓存
```bash
rm -rf node_modules
rm -f package-lock.json
```

### 2.2 安装Tailwind CSS v4依赖
```bash
npm install -D tailwindcss@next @tailwindcss/postcss@next postcss@latest autoprefixer@latest --legacy-peer-deps
```

### 2.3 更新配置文件

#### 2.3.1 修改postcss.config.js
将tailwindcss插件替换为@tailwindcss/postcss：
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

#### 2.3.2 检查tailwind.config.js
确认配置格式兼容v4，主要检查：
- 移除v3特定的配置项（如果有）
- 确保content配置包含所有需要处理的文件
- 确认plugins配置正确

### 2.4 验证依赖版本
```bash
npm list tailwindcss @tailwindcss/postcss
```

## 3. 测试与验证

### 3.1 构建测试
```bash
npm run build
```

### 3.2 开发服务器测试
```bash
npm run dev
```

### 3.3 功能验证
- 创建或修改一个测试页面，使用Tailwind CSS v4特性
- 访问页面确认样式正确应用
- 检查浏览器控制台是否有Tailwind相关错误

### 3.4 兼容性测试
- 测试不同浏览器下的样式表现
- 测试响应式设计是否正常
- 测试暗模式（如果使用）是否正常

## 4. 问题处理

### 4.1 常见问题及解决方案

#### 4.1.1 依赖冲突
**症状**：npm install失败，显示peer dependency冲突
**解决方案**：使用--legacy-peer-deps标志

#### 4.1.2 构建错误：TypeError: (0 , R.compileAst) is not a function
**症状**：构建时出现此错误
**解决方案**：清理根目录node_modules，确保依赖正确安装

#### 4.1.3 ESLint错误
**症状**：构建失败，显示ESLint错误
**解决方案**：检查错误是否与Tailwind CSS升级无关，可暂时禁用ESLint检查

#### 4.1.4 样式不生效
**症状**：页面样式未正确应用
**解决方案**：检查tailwind.config.js的content配置，确保包含所有需要处理的文件

## 5. 回滚方案

### 5.1 恢复依赖
```bash
npm install -D tailwindcss@3.4.18 postcss@latest autoprefixer@latest --legacy-peer-deps
```

### 5.2 恢复配置文件
- 恢复备份的tailwind.config.js
- 恢复备份的postcss.config.js

### 5.3 清理并重新安装
```bash
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps
```

## 6. 升级完成标准

- ✅ 成功安装Tailwind CSS v4和@tailwindcss/postcss
- ✅ 配置文件正确配置
- ✅ npm run build执行成功
- ✅ npm run dev启动正常
- ✅ Tailwind CSS样式正确应用
- ✅ 无Tailwind CSS相关错误

## 7. 后续工作

- 更新项目文档，记录Tailwind CSS v4升级
- 学习Tailwind CSS v4新特性，优化现有代码
- 定期检查Tailwind CSS v4稳定版发布，及时更新

## 预期时间
- 升级准备：10分钟
- 依赖安装：15分钟
- 配置修改：10分钟
- 测试验证：20分钟
- 问题处理：视情况而定

## 风险评估
- 依赖冲突：中等风险，可通过--legacy-peer-deps解决
- 配置错误：低风险，可通过备份恢复
- 功能不兼容：低风险，Tailwind CSS v4保持向后兼容

## 负责人
- 升级实施：开发人员
- 测试验证：开发人员
- 文档更新：开发人员