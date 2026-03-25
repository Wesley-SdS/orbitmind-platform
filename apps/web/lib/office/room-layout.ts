export interface FurnitureItem {
  type: string;
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
  floorType: string;
  furniture: FurnitureItem[];
  desks: DeskPosition[];
}

/**
 * Office layout — Gather.town inspired, spacious.
 *
 * TS = 48px per tile. Rooms measured in tiles then converted.
 * 2-tile corridors between rooms, 1-tile margin at edges.
 *
 * Layout:
 * ┌──────────────┐  ┌─────────────────┐  ┌────────────┐
 * │ Research Lab  │  │ Creative Studio  │  │ Review Room│
 * │  6×5 tiles    │  │  7×5 tiles       │  │  5×5 tiles │
 * └──────────────┘  └─────────────────┘  └────────────┘
 *        ~~~~~~~~~~~~~~~ corridor (2 tiles) ~~~~~~~~~~~~~~~~
 * ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
 * │ Strategy Room│  │ Publishing   │  │    Lobby        │
 * │  6×5 tiles    │  │  5×5 tiles   │  │  7×5 tiles     │
 * └──────────────┘  └──────────────┘  └────────────────┘
 */

const T = 48; // tile size
const GAP = T * 2; // corridor width (2 tiles)
const MARGIN = T; // edge margin (1 tile)

// Room sizes in tiles
const R1W = 6, R2W = 7, R3W = 5; // row 1 widths
const R4W = 6, R5W = 5, R6W = 7; // row 2 widths
const RH = 5; // all rooms 5 tiles tall

// Row 1 X positions
const R1X = MARGIN;
const R2X = R1X + R1W * T + GAP;
const R3X = R2X + R2W * T + GAP;

// Y positions
const ROW1Y = MARGIN;
const ROW2Y = ROW1Y + RH * T + GAP;

// Row 2 X positions
const R4X = MARGIN;
const R5X = R4X + R4W * T + GAP;
const R6X = R5X + R5W * T + GAP;

export const OFFICE_ROOMS: RoomDefinition[] = [
  // === ROW 1 ===
  {
    id: "research",
    name: "Research Lab",
    icon: "🔍",
    x: R1X, y: ROW1Y,
    width: R1W * T, height: RH * T,
    color: 0x3b82f6,
    floorType: "lightWood",
    furniture: [
      { type: "whiteboard", x: 120, y: 8 },
      { type: "plant-tree", x: 8, y: 148 },
      { type: "lamp", x: 248, y: 8 },
      { type: "bookshelf", x: 8, y: 8 },
      { type: "microscope", x: 200, y: 148 },
    ],
    desks: [
      { x: 96, y: 100, direction: "down" },
      { x: 200, y: 100, direction: "down" },
    ],
  },
  {
    id: "creative",
    name: "Creative Studio",
    icon: "✍️",
    x: R2X, y: ROW1Y,
    width: R2W * T, height: RH * T,
    color: 0xa855f7,
    floorType: "carpet",
    furniture: [
      { type: "plant-flower", x: 8, y: 8 },
      { type: "plant-small", x: 280, y: 148 },
      { type: "bookshelf", x: 280, y: 8 },
      { type: "old-tv", x: 8, y: 148 },
      { type: "lamp", x: 148, y: 8 },
    ],
    desks: [
      { x: 72, y: 88, direction: "down" },
      { x: 172, y: 88, direction: "down" },
      { x: 72, y: 168, direction: "down" },
    ],
  },
  {
    id: "review",
    name: "Review Room",
    icon: "✅",
    x: R3X, y: ROW1Y,
    width: R3W * T, height: RH * T,
    color: 0x22c55e,
    floorType: "beige",
    furniture: [
      { type: "whiteboard", x: 60, y: 8 },
      { type: "plant-small", x: 192, y: 148 },
      { type: "chair-desk", x: 8, y: 100 },
      { type: "lamp", x: 192, y: 8 },
    ],
    desks: [
      { x: 120, y: 120, direction: "down" },
    ],
  },

  // === ROW 2 ===
  {
    id: "strategy",
    name: "Strategy Room",
    icon: "📊",
    x: R4X, y: ROW2Y,
    width: R4W * T, height: RH * T,
    color: 0x06b6d4,
    floorType: "darkWood",
    furniture: [
      { type: "whiteboard", x: 100, y: 8 },
      { type: "plant-palm", x: 8, y: 148 },
      { type: "glass-cabinet", x: 240, y: 8 },
      { type: "pendulum-clock", x: 8, y: 8 },
    ],
    desks: [
      { x: 96, y: 120, direction: "down" },
      { x: 200, y: 120, direction: "down" },
    ],
  },
  {
    id: "publishing",
    name: "Publishing",
    icon: "📤",
    x: R5X, y: ROW2Y,
    width: R5W * T, height: RH * T,
    color: 0xf59e0b,
    floorType: "parquet",
    furniture: [
      { type: "plant-flower", x: 192, y: 148 },
      { type: "shelf", x: 8, y: 8 },
      { type: "cabinet", x: 8, y: 148 },
      { type: "lamp", x: 192, y: 8 },
    ],
    desks: [
      { x: 120, y: 100, direction: "down" },
    ],
  },
  {
    id: "lobby",
    name: "Lobby",
    icon: "☕",
    x: R6X, y: ROW2Y,
    width: R6W * T, height: RH * T,
    color: 0x6b7280,
    floorType: "stone",
    furniture: [
      // Seating area
      { type: "sofa", x: 56, y: 48 },
      { type: "armchair", x: 8, y: 100 },
      { type: "armchair", x: 148, y: 100 },
      // Coffee corner
      { type: "coffee", x: 280, y: 8 },
      // Plants & decor
      { type: "plant-palm", x: 8, y: 8 },
      { type: "plant-tree", x: 280, y: 148 },
      { type: "plant-flower", x: 200, y: 148 },
      // Extras
      { type: "bookshelf", x: 200, y: 8 },
      { type: "fish-tank", x: 8, y: 170 },
      { type: "cat", x: 148, y: 170 },
    ],
    desks: [
      { x: 250, y: 100, direction: "down" },
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
