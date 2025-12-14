# VanishInput 搜索框组件使用指南

> Aceternity UI 风格搜索输入框

---

## ✨ 组件特性

- 🔄 **Placeholder 轮播** - 多个提示文字自动切换
- 💫 **Vanish 动画** - 提交时消失效果
- 🎨 **完全主题化** - 适配三种主题
- ⌨️ **键盘友好** - 回车提交
- 🧹 **智能清除** - 快速清除输入
- ♿ **无障碍** - 完整 ARIA 支持

---

## 📝 基础用法

```tsx
import { VanishInput } from '@/components/ui/vanish-input';

function SearchDemo() {
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
    // 执行搜索逻辑
  };

  return (
    <VanishInput
      placeholders={[
        "搜索线索...",
        "搜索客户姓名...",
        "搜索订单号..."
      ]}
      onSubmit={handleSearch}
    />
  );
}
```

---

## 🎯 使用场景

### 1. 全局搜索

```tsx
<VanishInput
  placeholders={[
    "搜索任何内容...",
    "试试搜索客户、订单、产品"
  ]}
  onSubmit={handleGlobalSearch}
  autoFocus
/>
```

### 2. 列表筛选

```tsx
const [searchTerm, setSearchTerm] = useState('');

<VanishInput
  placeholders={["搜索客户...", "输入姓名或电话"]}
  value={searchTerm}
  onChange={setSearchTerm}
/>
```

### 3. 实时搜索

```tsx
function LiveSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <VanishInput
      placeholders={["实时搜索..."]}
      value={query}
      onChange={setQuery}
    />
  );
}
```

---

## 🎨 三种主题效果

### warmRicePaper
```
border: 暖棕色
background: 米黄色
text: 墨色
placeholder: 淡墨色
focus: 主品牌色边框
```

### liquidGlass
```
border: 半透明
background: 玻璃模糊
text: 深色
placeholder: 半透明
focus: 主品牌色发光
```

### linear
```
border: 中灰
background: 深黑
text: 白色
placeholder: 浅灰
focus: 主品牌色
```

---

## 📚 Props API

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholders` | `string[]` | - | placeholder 文字数组 |
| `onSubmit` | `(value: string) => void` | - | 提交回调 |
| `onChange` | `(value: string) => void` | - | 输入变化回调 |
| `value` | `string` | - | 受控值 |
| `autoFocus` | `boolean` | `false` | 自动聚焦 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `className` | `string` | - | 自定义类名 |

---

## 🎬 动画说明

### Placeholder 切换

```tsx
initial={{ y: 5, opacity: 0 }}    // 从下方淡入
animate={{ y: 0, opacity: 1 }}    // 到达位置
exit={{ y: -5, opacity: 0 }}      // 向上方淡出
transition={{ duration: 0.3 }}    // 300ms 过渡
```

### Vanish 效果

```tsx
animate={animating ? {
  opacity: 0,          // 淡出
  scale: 0.95,        // 缩小
  filter: 'blur(4px)' // 模糊
} : {
  opacity: 1,
  scale: 1,
  filter: 'blur(0px)'
}}
```

### 清除按钮

```tsx
initial={{ opacity: 0, scale: 0.8 }}  // 缩小淡入
animate={{ opacity: 1, scale: 1 }}     // 正常大小
exit={{ opacity: 0, scale: 0.8 }}      // 缩小淡出
```

---

## 🔧 迁移示例

### 旧代码

```tsx
<input
  type="text"
  placeholder="搜索..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="input"
/>
```

### 新代码

```tsx
<VanishInput
  placeholders={["搜索...", "输入关键词"]}
  value={search}
  onChange={setSearch}
/>
```

---

## ⌨️ 键盘快捷键

- `Enter` - 提交搜索
- `Escape` - 清除输入（可扩展）

---

## 总结

VanishInput 提供了现代化的搜索体验，完美适配三种主题！🎨
