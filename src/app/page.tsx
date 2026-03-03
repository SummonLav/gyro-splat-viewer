"use client";

import GyroSplatViewer from "@/app/components/GyroSplatViewer";

export default function HomePage() {
  return (
    <main className="fixed inset-0 bg-black">
      <GyroSplatViewer src="/3d-model/0332.ply" format="ply" />
    </main>
  );
}
