# 🐾 萌兽人格图鉴 (Prisma-SRRA)

“在代码与算法的棱镜中，折射出你内心最真实的萌兽。”

Prisma-SRRA 是一款基于 React 和 TypeScript 构建的沉浸式性格测评与数字资产生成应用。它通过独创的 SRRA 四维模型，将复杂的人格特质具象化为具有独特美感的“萌兽图鉴”。

## 🌟 核心特色

### 1. 🧪 深度定制的 SRRA 评估模型

不同于传统的 MBTI。本项目在 [questions_v2.ts](file:///d:/%E6%A1%8C%E9%9D%A2/%E6%B8%AF%E5%A4%A7/Trae/%E6%80%A7%E6%A0%BC%E6%B5%8B%E8%AF%95SRRA/%E8%AF%84%E4%BC%B0%E7%90%86%E6%83%B3%E6%80%A7%E6%A0%BC%E6%B5%8B%E8%AF%95%E6%94%B9%E8%BF%9B%E6%96%B9%E6%A1%88/prisma-web/src/data/questions_v2.ts) 中构建了一套全新的评估坐标系：

- S (Social)：社交能量倾向（潜水者 vs 控场引擎）
- R (Rational)：理性/逻辑比重（情绪先走 vs 最优解模式）
- R (Rebellious)：规则感与反骨（照做 vs 掀桌重谈）
- A (Ambition)：目标感与驱动力（躺平随缘 vs 强执行复利）

### 2. 🎭 沉浸式叙事题库 (questions_v2.ts)

告别枯燥的心理量表。题库深度结合了当代极客与职场生活场景：

- AI 浪潮：面对新模型迭代时的试错态度。
- DDL 心理：卡点交付时的内耗与执行力。
- 甲方/合租博弈：极端压力下的边界感测试。
- 逻辑优势：采用 2D 权重分配算法（`make5Text_2d`），单道题目可同时影响多个维度，确保结果的细微差异。

### 3. 🖼️ “棱镜玩具卡”生成引擎 (Result.tsx)

结果页不仅是静态展示，而是一套完整的数字资产生成系统：

- 欧氏空间质心对齐（Euclidean Centroid Matching）：通过计算用户得分向量与萌兽原型向量的欧氏距离，实现人格匹配。
- 智能配色方案采样：基于 html2canvas 和 Canvas API，从萌兽立绘中采样主色调，动态渲染卡片背景（Top/Bottom Bg）。
- 一键分享系统：集成二维码生成与移动端原生分享接口（`navigator.share`）。

## 🛠️ 技术架构

### 前端栈

- 核心框架：React + TypeScript（严格类型检查）
- 动效引擎：framer-motion（实现丝滑的转场与交互）
- 图标系统：lucide-react
- 状态管理：zustand（轻量化管理答题进度与得分）

### 渲染与资产

- 海报渲染：html2canvas 离屏渲染技术
- 色彩处理：自研动态色彩采样逻辑，实现 UI 与内容的视觉联动
- 数据库/ORM：Prisma（预留后端扩展性）

## 📂 核心逻辑展示

### 维度评分逻辑

```ts
// 独特的 2D 权重分配方法，捕捉性格的交叉特质
const make5Text_2d = (
  qid: number,
  dim1: CoreOnly,
  dim2: CoreOnly,
  texts: [string, string, string, string, string],
  weights2: [number, number, number, number, number]
) =>
  texts.map((text, idx) => ({
    id: `${qid}${String.fromCharCode(97 + idx)}`,
    text,
    weights: { [dim1]: scale5[idx], [dim2]: weights2[idx] },
  }));
```

### 匹配算法

采用向量距离计算。将用户人格映射在四维欧氏空间中，寻找最接近的“性格质心”：

$$Distance = \sqrt{\sum (Score_{dim} - Centroid_{dim})^2}$$

## 🚀 快速开始

### 克隆项目

```bash
git clone https://github.com/Ocean-hku/Prisma-SRRA.git
```

### 安装依赖

```bash
cd Prisma-SRRA/prisma-web
npm install
```

### 启动开发环境

```bash
npm run dev
```

## 🏗️ 路线图 (Roadmap)

- [x] 重构 V2 核心题库与 4D 评分系统
- [x] 开发 Prisma Toy Card 海报生成引擎
- [ ] 接入 AIGC 工作流：根据用户维度得分动态生成专属萌兽立绘
- [ ] 增加多语言支持（Cantonese & English Code-switching）

Prisma-SRRA 不仅仅是一个测试，它是对数字时代个体心理的一次微型建模。欢迎提出 Issue 或 Pull Request 参与贡献！
