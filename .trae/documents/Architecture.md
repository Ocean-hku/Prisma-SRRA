# 【棱镜 Prisma】技术架构文档

## 1. 技术栈选择
**1.1 核心框架 (Framework)**
*   **前端**：**React 18** (Vite + TypeScript) - 由于产品为复杂的交互式应用（包含状态流转和动效），React 提供了最稳健的开发体验和庞大的动效库生态。

**1.2 状态管理 (State Management)**
*   **Zustand** - 轻量级，非常适合管理测试过程中的答题进度、当前分数、最终结果数据的跨组件共享。

**1.3 样式与动效 (Styling & Animation)**
*   **Tailwind CSS** - 快速构建基础响应式布局，保证开发效率。
*   **Framer Motion** - 处理页面间的平滑过渡、卡片的进入/离开动效、结果页中复杂的数字递增与元素展开。
*   **Three.js / React Three Fiber** (可选，MVP 中可用 Canvas 粒子效果或高级 CSS 动效替代) - 用于在结果页构建 3D 星云坐标。为保证 MVP 开发速度，初期可采用基于 DOM/Canvas 的 2.5D 散点星图实现（使用 `framer-motion` 配合带有高斯模糊的多个径向渐变圆点）。

**1.4 UI 与设计组件 (UI Components)**
*   **Lucide Icons** - 简约美观的图标库。
*   **自定义实现**：为了达到“深邃科技感”的极高审美标准（如玻璃拟物、噪点纹理），核心组件（按钮、卡片、背景）均不依赖第三方 UI 库，而是手写 Tailwind 配合自定义 CSS（包含 `backdrop-filter`, 动画 SVG 等）。

## 2. 项目结构规划 (Directory Structure)
```
src/
├── assets/           # 静态资源 (字体、SVG 纹理、噪音图片等)
├── components/       # 通用组件
│   ├── ui/           # 基础 UI 元素 (Button, Card)
│   ├── effects/      # 视觉特效组件 (BackgroundNoise, GlowingOrb)
│   └── ...
├── data/             # 数据配置
│   ├── questions.ts  # 测试题目数据 (包含情境变量与维度权重)
│   └── results.ts    # 结果类型数据 (包含存在的处方与坐标范围)
├── hooks/            # 自定义 Hook (如使用媒体查询、防抖等)
├── pages/            # 核心视图页面
│   ├── Home.tsx      # 首页 (Landing)
│   ├── Test.tsx      # 测验页 (Assessment)
│   └── Result.tsx    # 结果页 (Diagnosis & Map)
├── store/            # Zustand 状态管理
│   └── useQuizStore.ts
├── utils/            # 工具函数 (如距离计算、欧氏距离算法)
│   └── math.ts       
├── App.tsx
└── main.tsx
```

## 3. 核心功能实现方案

### 3.1 测试逻辑与评分引擎 (Assessment Engine)
*   题目数据结构 (`questions.ts`) 将包含：
    *   `id`, `text` (题目描述)
    *   `options`: 选项数组，每个选项携带一个或多个维度的权重得分（如：`{ text: "选择A", weights: { introversion: 2, rational: -1 } }`）。
*   在 `Test.tsx` 中，使用 Framer Motion 实现题目的水平或垂直滑动切换 (`AnimatePresence` + `motion.div`)。
*   用户答完最后一题后，`useQuizStore` 汇总各维度的总分，并调用计算工具。

### 3.2 柔性边界与坐标计算 (Soft Margin Calculation)
*   **坐标系**：定义几个核心维度（如：理性/感性，保守/激进，顺从/叛逆）。用户的得分将映射为一个高维坐标点（为方便展示，降维至 2D/3D）。
*   **欧氏距离**：在 `utils/math.ts` 中，使用公式 `Math.sqrt((x2 - x1)^2 + (y2 - y1)^2)` 计算用户坐标与几个预设“主星云（质心）”的距离。
*   找出距离最近的星云作为“主类型”，并找出第二近的作为“邻近类型”，从而生成诊断文本（如：“距离主类型 1.2，距离邻近类型 2.5”）。

### 3.3 视觉特效实现 (Aesthetic Execution)
*   **深邃噪点背景 (Grain Texture)**：通过一个全屏、`pointer-events-none`、`mix-blend-mode: overlay` 的 `div`，加载一个 SVG noise 滤镜，为整个应用增加胶片/暗网般的粗糙高级感。
*   **玻璃拟物 (Glassmorphism)**：使用 Tailwind 的 `bg-white/5 backdrop-blur-md border border-white/10` 组合实现卡片。
*   **结果星图 (Star Map)**：
    *   在 MVP 阶段，通过一个相对定位的容器，放置代表不同类型的发光圆点 (`box-shadow: 0 0 40px var(--color)`)。
    *   用户的坐标通过绝对定位 (`left: X%, top: Y%`) 渲染一个闪烁的核心节点，并通过 `svg` 画线（或简单的虚线 `div`）连接最近的质心，以此直观展现“柔性边界”。

## 4. 部署方案
*   项目将在本地由 Vite 构建 (`npm run build`)，产出静态 HTML/CSS/JS。
*   最终产物可以轻松托管在 Vercel, Netlify 或 GitHub Pages 等静态站点托管服务上。