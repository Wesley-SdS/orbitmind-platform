"use client";

import { RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeViewControlsProps {
  soundOn: boolean;
  onToggleSound: () => void;
  onRotate: (delta: 1 | -1) => void;
  /** Distância do pé do palco (sobe quando o minimapa está aberto). */
  bottom: number;
}

const BTN = "flex h-8 w-8 items-center justify-center rounded-lg text-[#1a1a17] transition-colors hover:bg-[#1a1a17]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2541b] dark:text-[#f4f2ec] dark:hover:bg-white/10";

/**
 * Câmera e som, no mesmo vidro fosco do HUD, encostados no minimapa:
 * girar 90° para cada lado (Q / E) e ligar o som ambiente (M).
 */
export function OfficeViewControls({ soundOn, onToggleSound, onRotate, bottom }: OfficeViewControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Câmera e som"
      className="pointer-events-auto absolute right-4 z-10 flex items-center gap-0.5 rounded-xl border border-[#1a1a17]/12 bg-[#fbfaf7]/86 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/86"
      style={{ bottom }}
    >
      <button type="button" className={BTN} onClick={() => onRotate(-1)} aria-label="Girar a câmera para a esquerda" title="Girar para a esquerda (Q)">
        <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button type="button" className={BTN} onClick={() => onRotate(1)} aria-label="Girar a câmera para a direita" title="Girar para a direita (E)">
        <RotateCw className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <span className="mx-0.5 h-5 w-px bg-[#1a1a17]/12 dark:bg-white/15" />
      <button
        type="button"
        className={cn(BTN, soundOn && "bg-[#1a1a17] text-[#f7f5f0] hover:bg-[#1a1a17] dark:bg-[#f4f2ec] dark:text-[#1a1a17]")}
        onClick={onToggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Desligar som ambiente" : "Ligar som ambiente"}
        title={soundOn ? "Som ambiente ligado (M)" : "Som ambiente desligado (M)"}
      >
        {soundOn ? <Volume2 className="h-4 w-4" strokeWidth={1.75} /> : <VolumeX className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
