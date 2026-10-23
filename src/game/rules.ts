/**
 * Core game rules, scoring, and state machine logic for Airplane Mode.
 * Fully decoupled from UI and Phaser rendering for deterministic unit testing.
 */

export interface PlayerStats {
  maxMotivation: number;
  currentMotivation: number;
  maxAmmo: number;
  currentAmmo: number;
  isReloading: boolean;
  score: number;
  streakMultiplier: number;
  currentRoom: number;
  isRolling: boolean;
}

export const INITIAL_STATS: PlayerStats = {
  maxMotivation: 6,
  currentMotivation: 6,
  maxAmmo: 8,
  currentAmmo: 8,
  isReloading: false,
  score: 0,
  streakMultiplier: 1.0,
  currentRoom: 0,
  isRolling: false,
};

export const TOTAL_ROOMS = 4; // 0: Tutorial, 1: Bedroom, 2: Closet, 3: Hallway
export const SCORE_PER_KILL = 100;
export const SCORE_PER_ROOM = 1000;
export const MULTIPLIER_STEP = 0.1;
export const MAX_MULTIPLIER = 5.0;

export const HIT_INVINCIBILITY_MS = 1500;
export const ROOM_START_INVINCIBILITY_MS = 2000;

export interface RoomConfig {
  roomIndex: number;
  roomNumber: number;
  name: string;
  displayName: string;
  walkers: number;
  sprinters: number;
  tanks: number;
  tableCount: number;
  notificationBadge: string;
  isTutorial?: boolean;
}

export const ROOM_CONFIGS: RoomConfig[] = [
  {
    roomIndex: 0,
    roomNumber: 0,
    name: 'tutorial',
    displayName: "mind's entry",
    walkers: 1,
    sprinters: 0,
    tanks: 0,
    tableCount: 2,
    notificationBadge: '1',
    isTutorial: true,
  },
  {
    roomIndex: 1,
    roomNumber: 1,
    name: 'stage 1: bedroom',
    displayName: 'the bedroom',
    walkers: 3,
    sprinters: 0,
    tanks: 0,
    tableCount: 2,
    notificationBadge: '3',
  },
  {
    roomIndex: 2,
    roomNumber: 2,
    name: 'stage 2: closet',
    displayName: 'the closet',
    walkers: 5,
    sprinters: 2,
    tanks: 0,
    tableCount: 3,
    notificationBadge: '9',
  },
  {
    roomIndex: 3,
    roomNumber: 3,
    name: 'stage 3: hallway',
    displayName: 'the hallway',
    walkers: 6,
    sprinters: 2,
    tanks: 1,
    tableCount: 4,
    notificationBadge: '99+',
  },
];

/**
 * Calculates score for an enemy defeat taking streak into account.
 */
export function calculateKillScore(
  currentScore: number,
  multiplier: number
): { newScore: number; newMultiplier: number; pointsAwarded: number } {
  const pointsAwarded = Math.round(SCORE_PER_KILL * multiplier);
  const newScore = currentScore + pointsAwarded;
  const newMultiplier = Math.min(MAX_MULTIPLIER, Number((multiplier + MULTIPLIER_STEP).toFixed(1)));
  return { newScore, newMultiplier, pointsAwarded };
}

/**
 * Calculates score for completing a room.
 */
export function calculateRoomClearScore(currentScore: number): number {
  return currentScore + SCORE_PER_ROOM;
}

/**
 * Handles monk taking damage:
 * - Decrements motivation by exactly 1
 * - Resets streak multiplier to 1.0
 */
export function handlePlayerHit(
  currentMotivation: number,
  damageAmount: number = 1
): { newMotivation: number; newMultiplier: number; isDead: boolean } {
  const newMotivation = Math.max(0, currentMotivation - damageAmount);
  return {
    newMotivation,
    newMultiplier: 1.0,
    isDead: newMotivation <= 0,
  };
}

/**
 * Heals monk motivation (e.g. from matcha pickup), capped at max.
 */
export function healMotivation(
  currentMotivation: number,
  amount: number = 2,
  maxMotivation: number = 6
): number {
  return Math.min(maxMotivation, currentMotivation + amount);
}

/**
 * Normalizes 8-directional movement vector so diagonals are never faster.
 */
export function normalizeMovement(
  left: boolean,
  right: boolean,
  up: boolean,
  down: boolean
): { vx: number; vy: number } {
  let vx = 0;
  let vy = 0;
  if (up) vy -= 1;
  if (down) vy += 1;
  if (left) vx -= 1;
  if (right) vx += 1;

  if (vx !== 0 && vy !== 0) {
    const factor = Math.SQRT1_2;
    vx *= factor;
    vy *= factor;
  }
  return { vx, vy };
}

/**
 * Returns formatted end-screen text strictly in lowercase.
 */
export function getGameOverTitle(): string {
  return 'you opened tiktok.';
}

export function getVictoryTitle(): string {
  return 'floor 1 cleared';
}

/**
 * Checks whether all rooms are completed.
 */
export function checkFloorCleared(roomIndex: number): boolean {
  return roomIndex >= TOTAL_ROOMS - 1;
}

/**
 * Determines whether a new personal best was achieved.
 */
export function checkIsNewBest(
  score: number,
  prevBestScore: number,
  roomReached: number,
  prevBestRoom: number,
  streak: number,
  prevBestStreak: number
): boolean {
  return (
    (score > 0 && score > prevBestScore) ||
    roomReached > prevBestRoom ||
    (streak > 1.0 && streak > prevBestStreak)
  );
}
