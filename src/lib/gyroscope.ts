/**
 * Manages DeviceOrientation-based gyroscope input for subtle camera tilt.
 * On iOS 13+, requires explicit user permission via a click handler.
 */

export interface GyroState {
    tiltX: number; // left-right, normalized [-1, 1]
    tiltY: number; // front-back, normalized [-1, 1]
    active: boolean;
  }

  interface DeviceOrientationEvtConstructor {
    requestPermission?: () => Promise<"granted" | "denied" | "default">;
  }

  const SMOOTHING = 0.08;

  export class GyroscopeController {
    private state: GyroState = { tiltX: 0, tiltY: 0, active: false };
    private rawX = 0;
    private rawY = 0;
    private baselineBeta: number | null = null;
    private baselineGamma: number | null = null;
    private calibrationSamples = 0;
    private readonly CALIBRATION_COUNT = 10;

    get current(): Readonly<GyroState> {
      return this.state;
    }

    get needsPermission(): boolean {
      return (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (
          DeviceOrientationEvent as unknown as DeviceOrientationEvtConstructor
        ).requestPermission === "function"
      );
    }

    get isSupported(): boolean {
      return (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof window !== "undefined" &&
        "ontouchstart" in window
      );
    }

    async start(): Promise<boolean> {
      if (!this.isSupported) return false;

      if (this.needsPermission) {
        try {
          const perm = await (
            DeviceOrientationEvent as unknown as DeviceOrientationEvtConstructor
          ).requestPermission!();
          if (perm !== "granted") return false;
        } catch (err) {
          console.error("[GyroscopeController] requestPermission failed:", err);
          return false;
        }
      }

      window.addEventListener("deviceorientation", this.handleOrientation, {
        passive: true,
      });
      this.state.active = true;
      return true;
    }

    stop(): void {
      window.removeEventListener("deviceorientation", this.handleOrientation);
      this.state = { tiltX: 0, tiltY: 0, active: false };
      this.baselineBeta = null;
      this.baselineGamma = null;
      this.calibrationSamples = 0;
    }

    update(): void {
      this.state.tiltX += (this.rawX - this.state.tiltX) * SMOOTHING;
      this.state.tiltY += (this.rawY - this.state.tiltY) * SMOOTHING;
    }

    private handleOrientation = (e: DeviceOrientationEvent): void => {
      if (e.beta === null || e.gamma === null) return;

      if (this.calibrationSamples < this.CALIBRATION_COUNT) {
        if (this.baselineBeta === null) {
          this.baselineBeta = e.beta;
          this.baselineGamma = e.gamma;
        } else {
          this.baselineBeta += (e.beta - this.baselineBeta) * 0.3;
          this.baselineGamma! += (e.gamma - this.baselineGamma!) * 0.3;
        }
        this.calibrationSamples++;
        return;
      }

      const beta = e.beta - this.baselineBeta!;
      const gamma = e.gamma - this.baselineGamma!;

      const clamp = (v: number, max: number) =>
        Math.max(-1, Math.min(1, v / max));
      this.rawX = clamp(gamma, 30);
      this.rawY = clamp(beta, 30);
    };
  }
