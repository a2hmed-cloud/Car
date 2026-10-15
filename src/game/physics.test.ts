import test from 'node:test';
import assert from 'node:assert/strict';
import { CarPhysicsEngine } from './physics.ts';
import type { CarConfig } from './types.ts';

const testCar: CarConfig = {
  id: 'test-car',
  nameAr: 'سيارة تجريبية',
  nameEn: 'Test Car',
  taglineAr: 'اختبار',
  taglineEn: 'Test',
  primaryColor: 0x1e3a8a,
  secondaryColor: 0x0f172a,
  accentColor: 0xf59e0b,
  maxSpeed: 215,
  acceleration: 28,
  driftSlip: 1.15,
  handling: 1.1,
};

test('CarPhysicsEngine initializes at spawn location', () => {
  const spawn = { x: 10, y: 0, z: -20, rotationY: Math.PI / 4 };
  const engine = new CarPhysicsEngine(testCar, spawn, []);

  assert.equal(engine.state.x, 10);
  assert.equal(engine.state.z, -20);
  assert.equal(engine.state.yaw, Math.PI / 4);
  assert.equal(engine.state.speed, 0);
});

test('Car accelerates forward when forward input is pressed', () => {
  const spawn = { x: 0, y: 0, z: 0, rotationY: 0 };
  const engine = new CarPhysicsEngine(testCar, spawn, []);

  const inputs = {
    forward: true,
    backward: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    boost: false,
  };

  for (let i = 0; i < 10; i++) {
    engine.update(inputs, 100, 0.05);
  }

  assert.ok(engine.state.speed > 5, `Expected speed > 5 km/h, got ${engine.state.speed}`);
  assert.ok(engine.state.forwardSpeed > 1, 'Forward speed should increase');
});

test('Handbrake triggers drift slip condition at speed', () => {
  const spawn = { x: 0, y: 0, z: 0, rotationY: 0 };
  const engine = new CarPhysicsEngine(testCar, spawn, []);

  for (let i = 0; i < 20; i++) {
    engine.update({
      forward: true,
      backward: false,
      steerLeft: false,
      steerRight: false,
      handbrake: false,
      boost: false,
    }, 100, 0.05);
  }

  for (let i = 0; i < 15; i++) {
    engine.update({
      forward: true,
      backward: false,
      steerLeft: true,
      steerRight: false,
      handbrake: true,
      boost: false,
    }, 100, 0.05);
  }

  assert.ok(Math.abs(engine.state.slipAngleDeg) > 5, 'Car should show slip angle during handbrake turn');
});
