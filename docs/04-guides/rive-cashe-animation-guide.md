# 🎭 Rive × Cashe 走入马戏团动画：全流程操作指南

> 本指南面向相公（项目负责人），从零开始一步步教您如何用 Rive 制作 Cashe 的走入帐篷连续动画，并最终集成到 L2C 登录页面。

---

## 📋 总览：您需要做的事（3 大阶段）

| 阶段                                   | 负责人        | 产出                  |
| -------------------------------------- | ------------- | --------------------- |
| **Phase 1**: 准备素材 & 安装工具       | 相公 + 美术   | 分层透明 PNG 切片     |
| **Phase 2**: 在 Rive Editor 中制作动画 | 相公 / 动效师 | `cashe-walk.riv` 文件 |
| **Phase 3**: 前端代码集成              | 我（AI 助手） | React 组件接入        |

---

## Phase 1：准备素材（最关键！）

### Step 1.1：下载并安装 Rive Editor

1. 打开 [rive.app/downloads](https://rive.app/downloads)（您已经打开了！👍）
2. 点击 **WINDOWS > Production** 版本下载
3. 安装后打开，**注册一个免费账号**（个人版完全免费，够用）

### Step 1.2：让美术老师准备 Cashe 的分层切片

> [!IMPORTANT]
> 这是**整个流程的命脉**。Rive 的骨骼动画要求角色的每个可动部件都是独立的透明 PNG 图层。

请将 `cashe_full_body_v6.png` 这张定稿原画拆分成以下**独立的透明底 PNG** 文件：

```
cashe-parts/
├── head.png          # 头部（含折耳、异瞳 L/C 眼睛、表情）
├── body.png          # 躯干（含蓝色大圆肚皮和白色"2"字绒毛）
├── left-arm.png      # 左前爪
├── right-arm.png     # 右前爪
├── left-leg.png      # 左后腿
├── right-leg.png     # 右后腿
├── tail.png          # 尾巴
├── bucket-bag.png    # 水桶包（含露出的图纸/账本）
└── tape-collar.png   # 皮尺项圈
```

**要求**：

- 格式：**PNG，背景全透明**（Alpha 通道）
- 分辨率：建议每片在 **500-1000px** 左右，Rive 内部会自动适配
- 每个部件单独一个文件，**切在自然关节处**（例如手臂从肩膀处切开）

> [!TIP]
> 如果美术老师用的是 **Photoshop / Procreate / Clip Studio**，直接将每个图层分别导出为独立 PNG 即可。
> 如果只有一张合并好的图，可以用 Photoshop 的「套索/钢笔工具」逐个扣出各部件。

### Step 1.3：准备场景背景素材

同样需要以下透明/独立背景图（这些我们大部分已有）：

```
scene-parts/
├── market-bg.jpg         # 集市远景（已有 ✅）
├── tent-frame.png        # 帐篷框架/拱门（透明底，需新画）
└── tent-curtain-left.png # 左侧红帘（透明底，可选，目前用 CSS 替代）
    tent-curtain-right.png# 右侧红帘（透明底，可选）
```

---

## Phase 2：在 Rive Editor 中制作动画

### Step 2.1：创建新项目

1. 打开 Rive Editor
2. 点击 **New File**
3. 设置画板 (Artboard) 尺寸为 **1920 × 1080**（和登录页视口匹配）

### Step 2.2：导入切片素材

1. 将 `cashe-parts/` 文件夹里的所有 PNG **直接拖入** Rive 画布
2. Rive 会自动识别每张图为独立的图层对象
3. 在右侧 Hierarchy 面板中，按照从下到上的顺序排列：
   ```
   ├── tail（最底）
   ├── left-leg
   ├── right-leg
   ├── body
   ├── bucket-bag
   ├── tape-collar
   ├── left-arm
   ├── right-arm
   └── head（最顶）
   ```

### Step 2.3：绑定骨骼 (Bones)

1. 选择 **Bone Tool**（快捷键 `B`）
2. 从身体中心开始，依次向**头部、左臂、右臂、左腿、右腿、尾巴**拉出骨骼链
3. 每根骨骼拉好后，在 Hierarchy 中将对应的 PNG 图层**拖入**骨骼节点下，建立父子绑定关系
4. 测试：拖动骨骼，对应的肢体应该跟着动

> [!TIP]
> Rive 官方有一个 5 分钟视频教程专门讲角色骨骼绑定：
> 搜索 **"Rive bones tutorial"** 或访问 [rive.app/learn](https://rive.app/learn)

### Step 2.4：创建动画时间轴

#### 动画 1：`idle`（待机/慵懒）

- 点击底部的 **Animations** 面板 → **+** → 命名为 `idle`
- 设置为 **Loop** 模式
- 关键帧（非常简单）：
  - 第 0 帧：Cashe 正常站立
  - 第 30 帧：身体微微下沉 2px，尾巴轻轻摆动
  - 第 60 帧：回到初始状态
- 这就是她"慵懒等待"时的呼吸感

#### 动画 2：`walk`（走路）

- 新建动画 → 命名为 `walk`，设置为 **Loop**
- 关键帧（核心！4 拍循环）：
  - 第 0 帧：左脚在前，右脚在后（起步）
  - 第 15 帧：双脚交汇，身体微微升高（重心切换）
  - 第 30 帧：右脚在前，左脚在后
  - 第 45 帧：双脚交汇，身体微微升高
  - 第 60 帧：回到第 0 帧（完成一个完整步态循环）
- **同时**：水桶包在走路时轻微前后晃动，尾巴左右摆

#### 动画 3：`enter`（走入门内 / 冲刺）

- 新建动画 → 命名为 `enter`，设置为 **One Shot**（播一次）
- Cashe 的 `scale` 在1秒内从 1.0 → 0.6（远去的感觉）
- 同时 `opacity` 从 1.0 → 0.0（融入光中消失）

### Step 2.5：创建状态机 (State Machine)

> [!IMPORTANT]
> **状态机是 Rive 的杀手锏**——它让我在前端用 JS 代码直接控制 Cashe 在哪个状态。

1. 切换到 **State Machine** 模式
2. 命名为 `CasheWalk`
3. 添加一个 **Number Input**，命名为 `progress`（范围 0-100）
4. 添加一个 **Boolean Input**，命名为 `isClimax`
5. 搭建状态转换：
   ```
   [Entry] ──→ [idle]
                 │
                 │ 当 progress > 0
                 ▼
               [walk]  ←──→ [idle] （当 progress 回到 0）
                 │
                 │ 当 isClimax = true
                 ▼
               [enter] ──→ [Exit]
   ```

### Step 2.6：导出 .riv 文件

1. 点击左上角 **File → Export → .riv (Runtime)**
2. 保存到项目目录：`public/animations/cashe-walk.riv`

---

## Phase 3：前端代码集成（交给我！）

> 当您完成 Phase 2 并把 `.riv` 文件放到 `public/animations/` 目录后，告诉我一声，我会立刻：

1. **安装依赖**：`pnpm add @rive-app/react-canvas`
2. **重构 InteractiveCircusTent 组件**，将 Layer 3 (Cashe 图层) 从当前的静态 PNG + CSS 动画，切换为 Rive Canvas 渲染
3. **绑定状态机**：将我们现有的 `progress` 和 `isClimax` 状态直接注入到 Rive 的 State Machine Input 中

最终的代码结构会大致如下（仅供参考，实际我会精确实现）：

```tsx
// 伪代码预览
const { RiveComponent, rive } = useRive({
  src: '/animations/cashe-walk.riv',
  stateMachines: 'CasheWalk',
  autoplay: true,
});

const progressInput = useStateMachineInput(rive, 'CasheWalk', 'progress');
const climaxInput = useStateMachineInput(rive, 'CasheWalk', 'isClimax');

useEffect(() => {
  if (progressInput) progressInput.value = progress;
  if (climaxInput) climaxInput.value = isClimax;
}, [progress, isClimax]);

return (
  <div className="absolute inset-0 z-20">
    <RiveComponent className="h-full w-full" />
  </div>
);
```

---

## ⏱️ 时间估算

| 步骤                 | 预计耗时        |
| -------------------- | --------------- |
| 美术切片（拆分 PNG） | 1-2 小时        |
| Rive 骨骼绑定        | 30 分钟         |
| 3 个动画制作         | 1-2 小时        |
| 状态机配置           | 15 分钟         |
| 前端集成（我来做）   | 15 分钟         |
| **总计**             | **约 3-5 小时** |

---

## 🎓 推荐学习资源

1. **Rive 官方教程（强烈推荐花 20 分钟看完）**：[rive.app/learn](https://rive.app/learn)
2. **骨骼绑定视频**：YouTube 搜 "Rive character rigging tutorial"
3. **状态机教程**：YouTube 搜 "Rive state machine tutorial"
4. **Rive 社区模板**：[rive.app/community](https://rive.app/community) → 搜索 "character walk"，可以参考别人做好的走路模板

> [!TIP]
> 如果时间紧张，您可以先在 Rive Community 里找一个现成的"猫走路"模板，先跑通流程体验一下，然后再替换成 Cashe 的素材！
