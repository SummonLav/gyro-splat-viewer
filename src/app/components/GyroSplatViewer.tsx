"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";
import { GyroscopeController } from "@/lib/gyroscope";

const MAX_TILT_ANGLE = 5 * (Math.PI / 180);

interface Props {
  src: string;
  format: "ply" | "splat" | "ksplat";
}

export default function GyroSplatViewer({ src, format }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showGyroBtn, setShowGyroBtn] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const gyroRef = useRef<GyroscopeController | null>(null);

  const handleGyroPermission = useCallback(async () => {
    const gyro = gyroRef.current;
    if (!gyro) return;
    const ok = await gyro.start();
    if (ok) {
      setShowGyroBtn(false);
      setGyroActive(true);
      showToast("Gyroscope enabled");
    } else {
      showToast("Permission denied");
      setTimeout(() => setShowGyroBtn(false), 2000);
    }
  }, [showToast]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null;
    const gyro = new GyroscopeController();
    gyroRef.current = gyro;

    async function init() {
      const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");

      if (disposed) return;

      // Use the built-in self-driven viewer first to let it auto-configure
      // camera based on the scene's bounding box, then layer gyroscope on top.
      viewer = new GaussianSplats3D.Viewer({
        cameraUp: [0, -1, 0],
        initialCameraPosition: [0, -1, 0.5],
        initialCameraLookAt: [0, 0, 4],
        sharedMemoryForWorkers: false,
        gpuAcceleratedSort: false,
        logLevel: GaussianSplats3D.LogLevel.Debug,
        sphericalHarmonicsDegree: 0,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
        rootElement: containerRef.current!,
      });

      const formatMap = {
        ply: GaussianSplats3D.SceneFormat.Ply,
        splat: GaussianSplats3D.SceneFormat.Splat,
        ksplat: GaussianSplats3D.SceneFormat.KSplat,
      } as const;

      setDebugInfo("Loading scene...");

      try {
        await viewer.addSplatScene(src, {
          format: formatMap[format],
          splatAlphaRemovalThreshold: 5,
          showLoadingUI: false,
          progressiveLoad: true,
        });
      } catch (err) {
        setLoadError(String(err));
        setLoading(false);
        return;
      }

      if (disposed) return;

      viewer.start();
      setLoading(false);
      setDebugInfo("Scene loaded.");

      // Disable built-in orbit / touch / zoom controls — gyroscope only
      if (viewer.controls) {
        viewer.controls.enabled = false;
      }

      // Start gyroscope
      if (gyro.isSupported) {
        if (gyro.needsPermission) {
          setShowGyroBtn(true);
        } else {
          const ok = await gyro.start();
          if (ok) {
            setGyroActive(true);
            showToast("Gyroscope enabled");
          }
        }
      }

      // Gyroscope-driven position offset — parallax effect only.
      // Camera look direction stays fixed; only the position shifts,
      // so the model appears to float/tilt without any view rotation.
      if (gyro.isSupported) {
        const lookAt = new THREE.Vector3(0, 0, 4); // matches initialCameraLookAt
        let basePosition: THREE.Vector3 | null = null;
        let maxOffset = 0;

        function gyroFrame() {
          if (disposed) return;
          frameRef.current = requestAnimationFrame(gyroFrame);
          gyro.update();

          const cam = viewer.getCamera?.() ?? viewer.camera;
          if (!cam) return;

          // Capture stable base position on first valid frame and derive
          // the max offset from the actual camera-to-lookAt distance so
          // the parallax angle never exceeds MAX_TILT_ANGLE.
          if (!basePosition) {
            const base = cam.position.clone();
            basePosition = base;
            maxOffset = base.distanceTo(lookAt) * Math.tan(MAX_TILT_ANGLE);
            return;
          }

          if (!gyro.current.active) return;

          cam.position.x = basePosition.x + gyro.current.tiltX * maxOffset;
          cam.position.y = basePosition.y + gyro.current.tiltY * maxOffset;
          // z and look direction stay unchanged — view angle is fixed
        }

        frameRef.current = requestAnimationFrame(gyroFrame);
      }
    }

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameRef.current);
      gyroRef.current?.stop();
      if (viewer && typeof viewer.dispose === "function") {
        try {
          viewer.dispose();
        } catch {
          // ignore disposal errors
        }
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [src, format, showToast]);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0" style={{ touchAction: "none" }} />

      {loading && !loadError && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-zinc-300">Loading Gaussian Splat...</p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
            <p className="text-red-400 text-sm">Failed to load scene</p>
            <p className="text-xs text-zinc-500 font-mono break-all">
              {loadError}
            </p>
          </div>
        </div>
      )}

      {showGyroBtn && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <button
            onClick={handleGyroPermission}
            className="rounded-full bg-white/10 backdrop-blur-md border border-white/20
                       px-5 py-2.5 text-sm font-medium text-white
                       hover:bg-white/20 transition-all active:scale-95"
          >
            Enable Gyroscope
          </button>
        </div>
      )}

      {gyroActive && !loading && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs text-zinc-400 font-mono">Gyro</span>
        </div>
      )}

      {/* Debug info overlay */}
      {debugInfo && (
        <div className="fixed bottom-4 left-4 z-20 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 px-3 py-2 max-w-sm">
          <p className="text-xs text-zinc-400 font-mono">{debugInfo}</p>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 text-xs text-zinc-300 font-mono">
          {toast}
        </div>
      )}
    </>
  );
}
