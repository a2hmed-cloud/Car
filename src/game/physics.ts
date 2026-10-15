import * as THREE from 'three';
import type { CarConfig, WallSegment, VehiclePhysicsState, ControlInputs } from './types.ts';

export type { VehiclePhysicsState, ControlInputs };

export class CarPhysicsEngine {
  public state: VehiclePhysicsState;
  private config: CarConfig;
  private walls: WallSegment[];

  // Internal dynamics
  private vx = 0;
  private vz = 0;
  private angularVelocity = 0;

  // Collision callback
  public onCollision?: (impactSpeed: number, hitPos: THREE.Vector3) => void;

  constructor(config: CarConfig, spawn: { x: number; y: number; z: number; rotationY: number }, walls: WallSegment[]) {
    this.config = config;
    this.walls = walls;
    this.state = {
      x: spawn.x,
      y: 0,
      z: spawn.z,
      yaw: spawn.rotationY,
      speed: 0,
      forwardSpeed: 0,
      lateralSpeed: 0,
      slipAngleDeg: 0,
      steeringAngle: 0,
      isDrifting: false,
      isBraking: false,
      isHandbraking: false,
      isBoosting: false,
      isAccelerating: false,
      rpmRatio: 0,
      wheelRotation: 0,
      gear: 1,
    };
  }

  public setConfig(config: CarConfig) {
    this.config = config;
  }

  public reset(spawn: { x: number; y: number; z: number; rotationY: number }) {
    this.state.x = spawn.x;
    this.state.y = 0;
    this.state.z = spawn.z;
    this.state.yaw = spawn.rotationY;
    this.vx = 0;
    this.vz = 0;
    this.angularVelocity = 0;
    this.state.speed = 0;
    this.state.forwardSpeed = 0;
    this.state.lateralSpeed = 0;
    this.state.slipAngleDeg = 0;
    this.state.steeringAngle = 0;
    this.state.isDrifting = false;
    this.state.isBoosting = false;
    this.state.rpmRatio = 0;
  }

  public update(inputs: ControlInputs, nitroFuel: number, dt: number) {
    // Clamp frame dt
    const clampedDt = Math.min(dt, 0.05);

    // 1. Steering Handling
    const maxSteer = 0.58; // ~33 degrees max wheel lock
    const steerSpeed = 4.5 * this.config.handling;

    if (inputs.steerLeft) {
      this.state.steeringAngle = Math.min(maxSteer, this.state.steeringAngle + steerSpeed * clampedDt);
    } else if (inputs.steerRight) {
      this.state.steeringAngle = Math.max(-maxSteer, this.state.steeringAngle - steerSpeed * clampedDt);
    } else {
      // Natural centering
      if (this.state.steeringAngle > 0) {
        this.state.steeringAngle = Math.max(0, this.state.steeringAngle - steerSpeed * 1.5 * clampedDt);
      } else if (this.state.steeringAngle < 0) {
        this.state.steeringAngle = Math.min(0, this.state.steeringAngle + steerSpeed * 1.5 * clampedDt);
      }
    }

    // 2. Headings
    const headingX = Math.sin(this.state.yaw);
    const headingZ = Math.cos(this.state.yaw);

    const normalX = -headingZ;
    const normalZ = headingX;

    // Resolve current velocity along car heading
    const currentForwardSpeed = this.vx * headingX + this.vz * headingZ;
    const currentLateralSpeed = this.vx * normalX + this.vz * normalZ;

    // 3. Engine Throttle & Braking
    const canBoost = inputs.boost && nitroFuel > 2;
    this.state.isBoosting = canBoost;
    this.state.isHandbraking = inputs.handbrake;

    const baseAccel = (this.config.acceleration * (canBoost ? 1.6 : 1.0));
    const maxVelocity = (this.config.maxSpeed / 3.6) * (canBoost ? 1.25 : 1.0);

    let driveForce = 0;
    this.state.isAccelerating = false;
    this.state.isBraking = false;

    if (inputs.forward) {
      this.state.isAccelerating = true;
      if (currentForwardSpeed < maxVelocity) {
        // Power curve falls slightly near top speed
        const powerRatio = 1 - Math.max(0, currentForwardSpeed / maxVelocity);
        driveForce = baseAccel * (0.35 + 0.65 * powerRatio);
      }
    } else if (inputs.backward) {
      if (currentForwardSpeed > 1.5) {
        // Foot brake
        this.state.isBraking = true;
        driveForce = -baseAccel * 1.4;
      } else {
        // Reverse
        driveForce = -baseAccel * 0.55;
      }
    } else {
      // Engine rolling friction
      driveForce = -Math.sign(currentForwardSpeed) * Math.min(Math.abs(currentForwardSpeed), 4.5);
    }

    // 4. Turning & Drift Dynamics
    const absForwardSpeed = Math.abs(currentForwardSpeed);
    const speedRatio = Math.min(1.0, absForwardSpeed / 12);

    // Turning rate proportional to speed and steering angle
    const targetTurnRate = (this.state.steeringAngle * (absForwardSpeed / 2.6)) * Math.sign(currentForwardSpeed || 1);

    // Handbrake initiates drift immediately
    let lateralGrip = 7.5; // High static grip
    if (inputs.handbrake) {
      lateralGrip = 0.9 * this.config.driftSlip; // Drastic grip drop
      driveForce *= 0.5; // Handbrake slows drive
    } else if (Math.abs(this.angularVelocity) > 1.2 || Math.abs(currentLateralSpeed) > 4.5) {
      // In dynamic drift
      lateralGrip = 2.2 * this.config.driftSlip;
    }

    // Lateral friction opposes sideways slide
    const lateralFriction = -currentLateralSpeed * lateralGrip;

    // Apply forces into heading and normal
    const accelX = headingX * driveForce + normalX * lateralFriction;
    const accelZ = headingZ * driveForce + normalZ * lateralFriction;

    this.vx += accelX * clampedDt;
    this.vz += accelZ * clampedDt;

    // Rotational inertia & yaw update
    const yawTorque = (targetTurnRate - this.angularVelocity) * 6.0;
    this.angularVelocity += yawTorque * clampedDt;

    // Air drag on rotation
    this.angularVelocity *= Math.exp(-2.5 * clampedDt);
    this.state.yaw += this.angularVelocity * clampedDt;

    // 5. Position update
    this.state.x += this.vx * clampedDt;
    this.state.z += this.vz * clampedDt;

    // 6. Metrics and Slip calculation
    const currentSpeedMS = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    this.state.speed = Math.round(currentSpeedMS * 3.6);
    this.state.forwardSpeed = currentForwardSpeed;
    this.state.lateralSpeed = currentLateralSpeed;

    // Slip angle in degrees
    if (currentSpeedMS > 3) {
      const velAngle = Math.atan2(this.vx, this.vz);
      let diff = this.state.yaw - velAngle;
      // Normalize to -PI .. PI
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.state.slipAngleDeg = (diff * 180) / Math.PI;
    } else {
      this.state.slipAngleDeg = 0;
    }

    // Car is drifting when sideways angle is substantial at speed
    this.state.isDrifting = Math.abs(this.state.slipAngleDeg) > 18 && this.state.speed > 20;

    // Wheel spin rotation
    this.state.wheelRotation += (currentForwardSpeed / 0.36) * clampedDt;

    // RPM & Gear calculation for audio and tachometer
    const maxKmh = this.config.maxSpeed;
    const gearRatios = [0.25, 0.45, 0.7, 0.9, 1.0];
    let g = 1;
    for (let i = 0; i < gearRatios.length; i++) {
      if (this.state.speed > maxKmh * gearRatios[i]) g = i + 2;
    }
    this.state.gear = Math.min(6, g);

    const prevThreshold = (g > 1 ? maxKmh * gearRatios[g - 2] : 0);
    const nextThreshold = maxKmh * (gearRatios[g - 1] || 1.0);
    const speedInGear = (this.state.speed - prevThreshold) / (nextThreshold - prevThreshold || 1);
    this.state.rpmRatio = Math.min(1.0, Math.max(0.15, speedInGear));

    // 7. Track Barrier Collisions
    this.checkWallCollisions();
  }

  private checkWallCollisions() {
    const carRadius = 1.35;

    for (const wall of this.walls) {
      // Distance from car (x, z) to segment (x1, z1) -> (x2, z2)
      const dx = wall.x2 - wall.x1;
      const dz = wall.z2 - wall.z1;
      const segLenSq = dx * dx + dz * dz;
      if (segLenSq === 0) continue;

      let t = ((this.state.x - wall.x1) * dx + (this.state.z - wall.z1) * dz) / segLenSq;
      t = Math.max(0, Math.min(1, t));

      const nearestX = wall.x1 + t * dx;
      const nearestZ = wall.z1 + t * dz;

      const distX = this.state.x - nearestX;
      const distZ = this.state.z - nearestZ;
      const dist = Math.sqrt(distX * distX + distZ * distZ);

      if (dist < carRadius) {
        // Penetration detected!
        const overlap = carRadius - dist;
        const normX = dist > 0.001 ? distX / dist : wall.nx;
        const normZ = dist > 0.001 ? distZ / dist : wall.nz;

        // Push car back
        this.state.x += normX * overlap * 1.05;
        this.state.z += normZ * overlap * 1.05;

        // Velocity along collision normal
        const velDotNorm = this.vx * normX + this.vz * normZ;
        if (velDotNorm < 0) {
          // Bounce with restitution
          const restitution = 0.35;
          this.vx -= (1 + restitution) * velDotNorm * normX;
          this.vz -= (1 + restitution) * velDotNorm * normZ;

          // Friction along tangent
          this.vx *= 0.85;
          this.vz *= 0.85;

          const impactSpeed = Math.abs(velDotNorm) * 3.6;
          if (this.onCollision && impactSpeed > 8) {
            this.onCollision(impactSpeed, new THREE.Vector3(nearestX, 0.4, nearestZ));
          }
        }
      }
    }
  }
}
