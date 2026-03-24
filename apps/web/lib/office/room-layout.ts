export interface FurnitureItem {
  type: "desk" | "computer" | "plant" | "coffee-machine" | "whiteboard" | "bookshelf";
  x: number;
  y: number;
}

export interface DeskPosition {
  x: number;
  y: number;
  direction: "down" | "left" | "right" | "up";
}

export interface RoomDefinition {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  furniture: FurnitureItem[];
  desks: DeskPosition[];
}

export const OFFICE_ROOMS: RoomDefinition[] = [
  {
    id: "research",
    name: "Research Lab",
    icon: "🔍",
    x: 32, y: 32,
    width: 240, height: 180,
    color: 0x3b82f6,
    furniture: [
      { type: "whiteboard", x: 100, y: 8 },
      { type: "plant", x: 8, y: 148 },
    ],
    desks: [
      { x: 48, y: 72, direction: "down" },
      { x: 148, y: 72, direction: "down" },
    ],
  },
  {
    id: "creative",
    name: "Creative Studio",
    icon: "✍️",
    x: 304, y: 32,
    width: 272, height: 180,
    color: 0xa855f7,
    furniture: [
      { type: "bookshelf", x: 224, y: 8 },
      { type: "plant", x: 8, y: 8 },
    ],
    desks: [
      { x: 48, y: 56, direction: "down" },
      { x: 148, y: 56, direction: "down" },
      { x: 48, y: 116, direction: "down" },
    ],
  },
  {
    id: "review",
    name: "Review Room",
    icon: "✅",
    x: 608, y: 32,
    width: 176, height: 180,
    color: 0x22c55e,
    furniture: [
      { type: "whiteboard", x: 40, y: 8 },
    ],
    desks: [
      { x: 72, y: 92, direction: "down" },
    ],
  },
  {
    id: "strategy",
    name: "Strategy Room",
    icon: "📊",
    x: 32, y: 244,
    width: 208, height: 164,
    color: 0x06b6d4,
    furniture: [
      { type: "coffee-machine", x: 8, y: 128 },
    ],
    desks: [
      { x: 72, y: 72, direction: "down" },
      { x: 148, y: 72, direction: "down" },
    ],
  },
  {
    id: "publishing",
    name: "Publishing",
    icon: "📤",
    x: 272, y: 244,
    width: 208, height: 164,
    color: 0xf59e0b,
    furniture: [
      { type: "plant", x: 172, y: 128 },
    ],
    desks: [
      { x: 72, y: 72, direction: "down" },
    ],
  },
  {
    id: "lobby",
    name: "Lobby",
    icon: "☕",
    x: 512, y: 244,
    width: 272, height: 164,
    color: 0x6b7280,
    furniture: [
      { type: "coffee-machine", x: 16, y: 16 },
      { type: "plant", x: 232, y: 16 },
      { type: "bookshelf", x: 108, y: 8 },
    ],
    desks: [
      { x: 48, y: 92, direction: "down" },
      { x: 128, y: 92, direction: "down" },
      { x: 208, y: 92, direction: "down" },
    ],
  },
];

export const AGENT_COLORS: Record<string, { primary: number; hair: number }> = {
  researcher: { primary: 0x3b82f6, hair: 0x8B4513 },
  strategist: { primary: 0x06b6d4, hair: 0x1a1a2e },
  copywriter: { primary: 0xa855f7, hair: 0xf0d58c },
  designer: { primary: 0xec4899, hair: 0xc0392b },
  "seo-analyst": { primary: 0x22c55e, hair: 0xa67c52 },
  reviewer: { primary: 0x10b981, hair: 0xb0b0b0 },
  publisher: { primary: 0xf59e0b, hair: 0x1a1a2e },
  default: { primary: 0x8b5cf6, hair: 0x6b4423 },
};

/** Assign agent to a room based on role */
export function getRoomForRole(role: string): string {
  const lower = role.toLowerCase();
  if (lower.includes("pesquis") || lower.includes("research") || lower.includes("analista") || lower.includes("seo")) return "research";
  if (lower.includes("estrat") || lower.includes("strateg") || lower.includes("planej")) return "strategy";
  if (lower.includes("copy") || lower.includes("conteud") || lower.includes("design") || lower.includes("cri")) return "creative";
  if (lower.includes("revis") || lower.includes("review") || lower.includes("qualid")) return "review";
  if (lower.includes("public") || lower.includes("post") || lower.includes("social") || lower.includes("midia")) return "publishing";
  return "lobby";
}
