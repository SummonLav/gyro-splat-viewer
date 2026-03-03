"use client";

import GaussianViewer from "@/app/components/GaussianViewer";

export default function HomePage() {
  return (
    <main className="fixed inset-0 bg-black">
      <GaussianViewer src="/3d-model/0332.ply" format="ply" />
    </main>
  );
}
