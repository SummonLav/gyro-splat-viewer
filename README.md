# Gyro Splat Viewer

[中文](./README.zh.md)

Built just to mess around with gyroscope parallax on mobile — a simple Gaussian Splat viewer.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 + React 19 + TypeScript
- [gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) — splat rendering
- [Three.js](https://threejs.org/) — 3D engine
- Tailwind CSS v4

## Features

- Renders `.ply`, `.splat`, and `.ksplat` Gaussian Splat files
- Gyroscope-driven parallax on mobile (camera position shifts, view direction stays fixed)
- Progressive loading with a minimal loading UI

## Getting Started

```bash
npm install
npm run dev
```

Place your splat file in `public/3d-model/` and update the `src` prop in `src/app/page.tsx`.

## Background

Got way too into Apple's [ml-sharp](https://github.com/apple/ml-sharp) — a tool that turns image sequences into 3D Gaussian Splat scenes — so I built this viewer to actually see the results.

> **Note:** If you're on a MacBook, [Google Colab](https://colab.research.google.com/) is a handy way to run ml-sharp.
