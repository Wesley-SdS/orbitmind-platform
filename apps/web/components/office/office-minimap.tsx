"use client";

import { useEffect, useRef } from "react";
import type { OfficeScene } from "@/lib/office/iso/office-scene";
import { STATUS_COLORS } from "@/lib/office/iso/palette";

interface OfficeMinimapProps {
  scene: OfficeScene | null;
  onPanTo: (localX: number, localY: number) => void;
}

const W = 164;
const H = 102;

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/** Miniatura estática do escritório + pontos dos agentes + retângulo da câmera. */
export function OfficeMinimap({ scene, onPanTo }: OfficeMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!scene) return;
    const canvas = canvasRef.current;
    const snap = scene.minimap;
    if (!canvas || !snap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const { bounds } = snap;
    const scale = Math.min(W / bounds.w, H / bounds.h);
    const ox = (W - bounds.w * scale) / 2;
    const oy = (H - bounds.h * scale) / 2;
    const toMini = (lx: number, ly: number): [number, number] => [ox + (lx - bounds.x) * scale, oy + (ly - bounds.y) * scale];

    let acc = 0;
    const draw = (): void => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(snap.canvas, ox, oy, bounds.w * scale, bounds.h * scale);
      for (const a of scene.actorLocalPositions()) {
        const [x, y] = toMini(a.x, a.y);
        ctx.beginPath();
        ctx.arc(x, y, a.isUser ? 3 : 2.4, 0, Math.PI * 2);
        ctx.fillStyle = a.isUser ? "#1a1a17" : hex(STATUS_COLORS[a.status]);
        ctx.fill();
        if (a.isUser || a.status === "checkpoint") {
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#f2541b";
          ctx.stroke();
        }
      }
      const v = scene.viewportRect();
      const [vx, vy] = toMini(v.x, v.y);
      // retângulo da câmera, recortado à miniatura (como o quadro laranja do design)
      const x0 = Math.max(2, vx);
      const y0 = Math.max(2, vy);
      const x1 = Math.min(W - 2, vx + v.w * scale);
      const y1 = Math.min(H - 2, vy + v.h * scale);
      if (x1 > x0 && y1 > y0) {
        ctx.strokeStyle = "#f2541b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 3);
        ctx.stroke();
      }
    };
    draw();
    const off = scene.onFrame((dt) => {
      acc += dt;
      if (acc < 0.1) return;
      acc = 0;
      draw();
    });

    const onClick = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      onPanTo(bounds.x + (mx - ox) / scale, bounds.y + (my - oy) / scale);
    };
    canvas.addEventListener("click", onClick);
    return () => { off(); canvas.removeEventListener("click", onClick); };
  }, [scene, onPanTo]);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-10 rounded-xl border border-[#1a1a17]/12 bg-[#fbfaf7]/86 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/86">
      <canvas ref={canvasRef} style={{ width: W, height: H }} className="block cursor-crosshair rounded-md bg-[#e3ddd0] dark:bg-[#2a2824]" aria-label="Minimapa do escritório" />
    </div>
  );
}
