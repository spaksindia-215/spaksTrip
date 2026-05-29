/**
 * TBO Hotel Search Occupancy Validation
 *
 * TBO API Limits:
 * - Max 8 rooms per search request
 * - Max 10 adults per room
 * - Max 6 children per room
 *
 * Note: More rooms/higher occupancy reduces available results because
 * not all supply partners support multi-room searches.
 */

export const OCCUPANCY_LIMITS = {
  MAX_ROOMS: 8,
  MAX_ADULTS_PER_ROOM: 10,
  MAX_CHILDREN_PER_ROOM: 6,
  MAX_TOTAL_OCCUPANCY: 16, // 10 adults + 6 children
} as const;

export type OccupancyValidation = {
  valid: boolean;
  error?: string;
  warning?: string;
};

export function validateRooms(rooms: number): OccupancyValidation {
  if (rooms < 1) {
    return { valid: false, error: "At least 1 room is required" };
  }
  if (rooms > OCCUPANCY_LIMITS.MAX_ROOMS) {
    return {
      valid: false,
      error: `Maximum ${OCCUPANCY_LIMITS.MAX_ROOMS} rooms per search (TBO limit)`,
    };
  }
  return { valid: true };
}

export function validateOccupancy(
  rooms: number,
  adults: number,
  children: number,
): OccupancyValidation {
  // Validate rooms
  const roomsValidation = validateRooms(rooms);
  if (!roomsValidation.valid) return roomsValidation;

  // Validate minimum occupancy
  if (adults < 1) {
    return { valid: false, error: "At least 1 adult is required per room" };
  }

  // Calculate per-room occupancy
  const adultsPerRoom = Math.ceil(adults / rooms);
  const childrenPerRoom = Math.ceil(children / rooms);
  const occupancyPerRoom = adultsPerRoom + childrenPerRoom;

  // Validate adults per room
  if (adultsPerRoom > OCCUPANCY_LIMITS.MAX_ADULTS_PER_ROOM) {
    return {
      valid: false,
      error: `Maximum ${OCCUPANCY_LIMITS.MAX_ADULTS_PER_ROOM} adults per room. For ${adults} adults, use at least ${Math.ceil(adults / OCCUPANCY_LIMITS.MAX_ADULTS_PER_ROOM)} rooms`,
    };
  }

  // Validate children per room
  if (childrenPerRoom > OCCUPANCY_LIMITS.MAX_CHILDREN_PER_ROOM) {
    return {
      valid: false,
      error: `Maximum ${OCCUPANCY_LIMITS.MAX_CHILDREN_PER_ROOM} children per room. For ${children} children, use at least ${Math.ceil(children / OCCUPANCY_LIMITS.MAX_CHILDREN_PER_ROOM)} rooms`,
    };
  }

  // Validate total per room
  if (occupancyPerRoom > OCCUPANCY_LIMITS.MAX_TOTAL_OCCUPANCY) {
    return {
      valid: false,
      error: `Maximum ${OCCUPANCY_LIMITS.MAX_TOTAL_OCCUPANCY} guests per room`,
    };
  }

  // Warn about reduced results for high occupancy (6+ rooms or 14+ guests)
  let warning: string | undefined;
  if (rooms >= 6 || adults + children > 14) {
    warning =
      "High occupancy may reduce available hotels. Not all suppliers support multi-room searches.";
  }

  return { valid: true, warning };
}
