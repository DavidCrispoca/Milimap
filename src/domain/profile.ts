/**
 * Routing cost profile.
 *
 * Kept in its own module so both the router and the instruction builder can use
 * it without importing each other (which would create a cycle).
 *
 * Costs are expressed in "meter equivalents" so every penalty stays in one unit.
 */

export interface RoutingProfile {
  /** Average walking speed, used to convert the elevator wait into meters. */
  walkSpeedMps: number
  /** Stairs cost more than flat walking (effort, not distance). */
  stairPenalty: number
  /** Elevator rides cost slightly more than flat walking. */
  elevatorPenalty: number
  /** Average wait for an elevator, in seconds. */
  elevatorWaitSeconds: number
  /** Floor-to-floor height, used when a transition has no explicit distance. */
  floorHeightMeters: number
}

/**
 * Defaults are calibrated for a university building, not measured. They are
 * deliberately conservative and easy to tune after walking the real campus.
 *
 * Consequence worth knowing: for a one-floor change, stairs win because the
 * elevator wait (~21 m equivalent) outweighs the stair effort penalty. That is
 * what people actually do. `avoidStairs` is what forces an accessible route.
 */
export const DEFAULT_PROFILE: RoutingProfile = {
  walkSpeedMps: 1.4,
  stairPenalty: 1.4,
  elevatorPenalty: 1.2,
  elevatorWaitSeconds: 15,
  floorHeightMeters: 4,
}
