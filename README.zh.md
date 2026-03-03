# Gyro Splat Viewer

[English](./README.md)

一个为**手机端（支持陀螺仪）视差效果**而生的 Gaussian Splat 查看器。

## 技术栈

- [Next.js](https://nextjs.org/) 16 + React 19 + TypeScript
- [gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) — splat 渲染
- [Three.js](https://threejs.org/) — 3D 引擎
- Tailwind CSS v4

## 功能

- 支持 `.ply`、`.splat`、`.ksplat` 格式的 Gaussian Splat 文件
- 移动端陀螺仪视差：相机位置随设备倾斜偏移，观察方向保持固定
- 渐进加载，带简洁的加载界面

## 快速开始

```bash
npm install
npm run dev
```

将 splat 文件放入 `public/3d-model/`，并在 `src/app/page.tsx` 中修改 `src` 属性。

## 背景

这个项目源于玩 Apple [ml-sharp](https://github.com/apple/ml-sharp) 到嗨——一个从图片/视频帧生成 3D Gaussian Splat 场景的工具。这个查看器就是为了展示它的输出而建的。

> **提示：** 如果用 MacBook 的话，可以试试免费的 [Google Colab](https://colab.research.google.com/) 来跑 ml-sharp 的模型。
