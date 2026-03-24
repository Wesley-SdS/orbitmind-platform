import type { RoomDefinition } from "./room-layout";
import { OFFICE_ROOMS } from "./room-layout";

export function findPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): Array<{ x: number; y: number }> {
  const fromRoom = findRoomAt(from);
  const toRoom = findRoomAt(to);

  if (!fromRoom || !toRoom || fromRoom.id === toRoom.id) return [to];

  // Waypoints: center of from room → exit → midpoint → entrance → destination
  const waypoints: Array<{ x: number; y: number }> = [];

  waypoints.push({
    x: fromRoom.x + fromRoom.width / 2,
    y: fromRoom.y + fromRoom.height - 8,
  });

  const midX = (fromRoom.x + fromRoom.width / 2 + toRoom.x + toRoom.width / 2) / 2;
  const corridorY = Math.max(fromRoom.y + fromRoom.height, toRoom.y + toRoom.height) + 12;
  waypoints.push({ x: midX, y: Math.min(corridorY, 440) });

  waypoints.push({
    x: toRoom.x + toRoom.width / 2,
    y: toRoom.y + toRoom.height - 8,
  });

  waypoints.push(to);

  return waypoints;
}

function findRoomAt(pos: { x: number; y: number }): RoomDefinition | null {
  for (const room of OFFICE_ROOMS) {
    if (
      pos.x >= room.x && pos.x <= room.x + room.width &&
      pos.y >= room.y && pos.y <= room.y + room.height
    ) {
      return room;
    }
  }
  // Find nearest room
  let closest: RoomDefinition | null = null;
  let minDist = Infinity;
  for (const room of OFFICE_ROOMS) {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;
    const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
    if (dist < minDist) { minDist = dist; closest = room; }
  }
  return closest;
}
