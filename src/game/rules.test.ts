import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDriftAngleMultiplier,
  calculateStepDriftScore,
  updateCombo,
  updateNitro
} from './rules.ts';

test('calculateDriftAngleMultiplier returns 0 for minimal angle', () => {
  assert.equal(calculateDriftAngleMultiplier(10), 0);
  assert.equal(calculateDriftAngleMultiplier(-12), 0);
});

test('calculateDriftAngleMultiplier scales up in sweet spot (25-65 deg)', () => {
  const mult25 = calculateDriftAngleMultiplier(25);
  const mult45 = calculateDriftAngleMultiplier(45);
  assert.equal(mult25, 1.0);
  assert.ok(mult45 > 1.0 && mult45 <= 1.5, 'Multiplier at 45 deg should be between 1.0 and 1.5');
});

test('calculateStepDriftScore returns 0 when car is stationary or very slow', () => {
  assert.equal(calculateStepDriftScore(5, 45, 1, 0.016), 0);
});

test('calculateStepDriftScore awards points when drifting at high speed', () => {
  const score = calculateStepDriftScore(80, 40, 2, 0.1);
  assert.ok(score > 0, `Expected score > 0, got ${score}`);
});

test('updateCombo increases with continuous drift duration', () => {
  assert.equal(updateCombo(1, 0.5), 1);
  assert.equal(updateCombo(1, 1.5), 2);
  assert.equal(updateCombo(2, 3.0), 3);
  assert.equal(updateCombo(3, 6.0), 4);
  assert.equal(updateCombo(4, 9.0), 5);
});

test('updateNitro decreases when boosting and recharges when drifting', () => {
  const depleted = updateNitro(100, true, false, 1.0);
  assert.equal(depleted, 65);

  const recharged = updateNitro(50, false, true, 1.0);
  assert.equal(recharged, 75);
});
