# prisma-web

「萌兽人格图鉴（棱镜 SRRA）」前端工程（React + Vite + TypeScript + Tailwind）。

根目录有更完整的项目说明与常见问题：请查看 [README.md](file:///d:/%E6%A1%8C%E9%9D%A2/%E6%B8%AF%E5%A4%A7/Trae/%E6%80%A7%E6%A0%BC%E6%B5%8B%E8%AF%95SRRA/%E8%AF%84%E4%BC%B0%E7%90%86%E6%83%B3%E6%80%A7%E6%A0%BC%E6%B5%8B%E8%AF%95%E6%94%B9%E8%BF%9B%E6%96%B9%E6%A1%88/README.md)。

## 开发

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

## 结果页快速预览（无需答题）

```text
http://localhost:5173/?demo=type_1
http://localhost:5173/?demo=type_16
```

## 小卡生成

在结果页点击「生成朋友圈分享小卡」，会生成 1080×1620（2:3）图片并弹出预览。
核心逻辑位于 `src/pages/Result.tsx`。
