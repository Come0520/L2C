# address-input 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/address-input.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   2   |
|   🟡 P2 — 规范/a11y（建议改进）   |   2   |
|             **合计**              | **4** |

---

## 🟠 P1 — 应当修复

- [x] ✅ [C2-001] `shared/ui/address-input.tsx:9-11` — `provinces`、`cities`、`areas` 三个 JSON 文件在模块顶层全量导入，数据量较大（全国约 34 省、344 市、3019 区县）。每次组件渲染的父页面加载时都会将这些 JSON 一并打包进 bundle，增加初始加载体积。应改为动态懒加载（`import(...)`），或使用 Next.js RSC 在服务端预处理，仅传递当前省份相关的精简数据到客户端

- [x] ✅ [C4-001] `shared/ui/address-input.tsx:205-210` — 详细地址 `<Input>` 缺少最大长度（`maxLength`）限制和输入验证，用户可以输入任意长度的字符串；地址字段在数据库中通常有 `VARCHAR(255)` 限制，若输入超长内容提交后会在服务端报错而非前端提示

## 🟡 P2 — 建议改进

- [x] ✅ [C4-002] `shared/ui/address-input.tsx:55` — `internalValue` 状态通过 `useState(parseValue(value))` 初始化，但此后不完整地同步外部 `value` 变化（第 97-101 行仅同步字符串类型）：当外部以 `AddressValue` 对象形式更新 `value` 时，内部状态不会同步，导致 UI 与受控表单状态不一致

- [x] ✅ [C5-001] `shared/ui/address-input.tsx:144-201` — 省市区三个 `Select` 组件缺少 `aria-label`（仅有 `placeholder`），在省份未选择时城市/区县 Select 处于 disabled 状态但没有 `aria-disabled="true"` 和 `title` 属性，键盘用户无法感知到依赖关系

---

## ✅ 表现良好项（无需修复）

- C2: 使用 `useMemo` 缓存 `currentCities` 和 `currentAreas` 列表计算，避免重复过滤 ✅
- C3: 无安全风险，均为展示和 onChange 逻辑
- C4: 省份变化时自动清空市/区级联数据，数据一致性良好
