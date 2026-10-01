import type { AvatarLook } from "@/lib/office/types";

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * Avatar em CSS (22 × 30 px) com a mesma construção do design: cabelo,
 * rosto, olhos e camisa. Usado nos painéis e na lista de salas do celular.
 */
export function OfficeAvatar({ look, scale = 1 }: { look: AvatarLook; scale?: number }) {
  const s = scale;
  return (
    <div className="relative shrink-0" style={{ width: 22 * s, height: 30 * s }} aria-hidden="true">
      <div className="absolute" style={{ left: s, top: 0, width: 20 * s, height: 9 * s, borderRadius: `${6 * s}px ${6 * s}px ${2 * s}px ${2 * s}px`, background: hex(look.hair), zIndex: 1 }} />
      <div className="absolute" style={{ left: 2 * s, top: 2 * s, width: 18 * s, height: 16 * s, borderRadius: 5 * s, background: hex(look.skin) }} />
      <div
        className="absolute"
        style={{
          left: 6 * s,
          top: 10 * s,
          width: 10 * s,
          height: 2 * s,
          zIndex: 2,
          background: `linear-gradient(90deg,#2a2521 0 ${2 * s}px,transparent ${2 * s}px ${8 * s}px,#2a2521 ${8 * s}px ${10 * s}px)`,
        }}
      />
      <div className="absolute" style={{ left: 0, top: 17 * s, width: 22 * s, height: 11 * s, borderRadius: `${5 * s}px ${5 * s}px ${3 * s}px ${3 * s}px`, background: hex(look.shirt) }} />
    </div>
  );
}
