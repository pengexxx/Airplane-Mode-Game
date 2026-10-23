import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateKillScore,
  calculateRoomClearScore,
  handlePlayerHit,
  healMotivation,
  normalizeMovement,
  getGameOverTitle,
  getVictoryTitle,
  checkFloorCleared,
  checkIsNewBest,
  ROOM_CONFIGS,
  TOTAL_ROOMS,
} from './rules.ts';

test('ROOM_CONFIGS contains tutorial and 3 stages', () => {
  assert.equal(TOTAL_ROOMS, 4);
  assert.equal(ROOM_CONFIGS.length, 4);
  assert.equal(ROOM_CONFIGS[0].name, 'tutorial');
  assert.equal(ROOM_CONFIGS[0].walkers, 1);
  assert.equal(ROOM_CONFIGS[0].notificationBadge, '1');

  assert.equal(ROOM_CONFIGS[1].name, 'stage 1: bedroom');
  assert.equal(ROOM_CONFIGS[1].notificationBadge, '3');

  assert.equal(ROOM_CONFIGS[2].name, 'stage 2: closet');
  assert.equal(ROOM_CONFIGS[2].notificationBadge, '9');

  assert.equal(ROOM_CONFIGS[3].name, 'stage 3: hallway');
  assert.equal(ROOM_CONFIGS[3].notificationBadge, '99+');
});

test('diagonal movement normalization ensures speed is equal in all directions', () => {
  // Straight up
  const straight = normalizeMovement(false, false, true, false);
  const straightSpeed = Math.hypot(straight.vx, straight.vy);
  assert.equal(straightSpeed, 1.0);

  // Up + Right diagonal
  const diagonal = normalizeMovement(false, true, true, false);
  const diagonalSpeed = Math.hypot(diagonal.vx, diagonal.vy);
  assert.ok(Math.abs(diagonalSpeed - 1.0) < 0.0001);
});

test('matcha restores exactly 2 motivation segments up to max', () => {
  assert.equal(healMotivation(3, 2, 6), 5);
  assert.equal(healMotivation(5, 2, 6), 6);
  assert.equal(healMotivation(6, 2, 6), 6);
});

test('damage removes exactly 1 motivation segment and resets multiplier', () => {
  const result = handlePlayerHit(6, 1);
  assert.equal(result.newMotivation, 5);
  assert.equal(result.newMultiplier, 1.0);
  assert.equal(result.isDead, false);
});

test('kill scoring increments score and streak multiplier', () => {
  const result1 = calculateKillScore(0, 1.0);
  assert.equal(result1.newScore, 100);
  assert.equal(result1.newMultiplier, 1.1);

  const result2 = calculateKillScore(100, 1.1);
  assert.equal(result2.newScore, 210);
  assert.equal(result2.newMultiplier, 1.2);
});

test('end-screen texts are strictly lowercase', () => {
  const gameOver = getGameOverTitle();
  const victory = getVictoryTitle();

  assert.equal(gameOver, 'you opened tiktok.');
  assert.equal(gameOver, gameOver.toLowerCase());

  assert.equal(victory, 'floor 1 cleared');
  assert.equal(victory, victory.toLowerCase());
});

test('floor progression check', () => {
  assert.equal(checkFloorCleared(0), false);
  assert.equal(checkFloorCleared(1), false);
  assert.equal(checkFloorCleared(2), false);
  assert.equal(checkFloorCleared(3), true);
});

test('checkIsNewBest detects high scores, room advances, and streaks', () => {
  assert.equal(checkIsNewBest(500, 400, 1, 1, 1.0, 1.0), true);
  assert.equal(checkIsNewBest(300, 400, 2, 1, 1.0, 1.0), true);
  assert.equal(checkIsNewBest(300, 400, 1, 1, 1.5, 1.2), true);
  assert.equal(checkIsNewBest(300, 400, 1, 1, 1.0, 1.2), false);
});
