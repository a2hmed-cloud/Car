export interface DriftState {
  speed: number;
  slipAngle: number; // in radians
  isDrifting: boolean;
  score: number;
  combo: number;
  comboTimer: number;
  nitro: number;
}

/**
 * Calculates drift quality multiplier based on angle (in degrees).
 * Ideal drift angle is between 25 and 70 degrees.
 */
export function calculateDriftAngleMultiplier(angleDeg: number): number {
  const absAngle = Math.abs(angleDeg);
  if (absAngle < 15) return 0; // Not enough sideways angle
  if (absAngle > 85) return 0.2; // Over-rotated / spun out
  if (absAngle >= 25 && absAngle <= 65) {
    // Sweet spot
    return 1.0 + (absAngle - 25) / 40 * 0.5; // 1.0 to 1.5
  }
  if (absAngle < 25) {
    return (absAngle - 15) / 10; // 0 to 1.0
  }
  // 65 to 85
  return 1.5 - (absAngle - 65) / 20 * 1.3;
}

/**
 * Calculates drift score gained in one physics step (dt seconds).
 */
export function calculateStepDriftScore(
  speed: number, // in km/h or m/s
  angleDeg: number,
  combo: number,
  dt: number
): number {
  if (speed < 15) return 0; // Car too slow to drift
  const angleMult = calculateDriftAngleMultiplier(angleDeg);
  if (angleMult <= 0) return 0;

  // Points per second based on speed and angle
  const baseRate = speed * 15;
  const score = baseRate * angleMult * combo * dt;
  return Math.round(score);
}

/**
 * Updates combo level based on continuous drift duration.
 */
export function updateCombo(currentCombo: number, driftDuration: number): number {
  if (driftDuration < 1.0) return 1;
  if (driftDuration < 2.5) return 2;
  if (driftDuration < 5.0) return 3;
  if (driftDuration < 8.0) return 4;
  return 5; // Max 5x combo!
}

/**
 * Calculate nitrous recharge and consumption.
 */
export function updateNitro(
  currentNitro: number,
  isBoosting: boolean,
  isDrifting: boolean,
  dt: number
): number {
  if (isBoosting) {
    return Math.max(0, currentNitro - dt * 35);
  }
  if (isDrifting) {
    // Drifting restores nitro faster!
    return Math.min(100, currentNitro + dt * 25);
  }
  // Passive slow recharge
  return Math.min(100, currentNitro + dt * 8);
}
