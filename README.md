# 萌兽人格图鉴（棱镜 SRRA）

一个面向年轻用户的「可爱小动物人格原型」测试与结果可视化 Web 应用：完成答题后生成主人格与副人格组合、引力波辐射星图（5 个相关节点）、15 维度光谱解读，并可一键生成 2:3 朋友圈分享小卡。

## 项目结构

- `prisma-web/`：前端 Web 应用（React + Vite + TypeScript + Tailwind）
- `.trae/documents/`：产品与架构文档（PRD、Architecture）

## 主要功能

- **答题与计分**：题库在 `prisma-web/src/data/questions_v2.ts`，使用 Zustand 在本地维护答题记录与分数
- **原型匹配**：将用户的 4 个核心维度坐标与 16 个原型的 centroid 计算距离，输出 Top3 与占比
- **引力波辐射星图**：以主人格为中心，仅展示 5 个相关节点（2 个近、3 个远）并做位置分布与避让
- **15 维度光谱**：将核心维度映射到 15 个扩展维度，输出等级与解释文本
- **朋友圈分享小卡**：生成 1080×1620（2:3）的潮玩小卡风格图片，并支持保存/分享

## 快速开始

进入前端目录安装依赖并启动：

```bash
cd prisma-web
npm install
npm run dev
```

构建：

```bash
cd prisma-web
npm run build
npm run preview
```

## 结果页快速预览（无需答题）

用于调试样式/生成小卡：

- `http://localhost:5173/?demo=type_1`
- `http://localhost:5173/?demo=type_16`

其中 `type_1 ~ type_16` 对应 16 个原型 id。

## 常见问题

- **Windows PowerShell 提示“禁止运行脚本（npm.ps1）”**
  - 可用 `npm.cmd` 替代 `npm`（如 `npm.cmd run dev`）
  - 或使用允许脚本执行的终端/策略（按你的环境规范处理）

