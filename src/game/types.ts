export interface CarConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  maxSpeed: number; // km/h
  acceleration: number;
  driftSlip: number; // drift sensitivity
  handling: number;
}

export interface WallSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  nx: number;
  nz: number;
}

export interface ControlInputs {
  forward: boolean;
  backward: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
  boost: boolean;
}

export interface VehiclePhysicsState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  forwardSpeed: number;
  lateralSpeed: number;
  slipAngleDeg: number;
  steeringAngle: number;
  isDrifting: boolean;
  isBraking: boolean;
  isHandbraking: boolean;
  isBoosting: boolean;
  isAccelerating: boolean;
  rpmRatio: number;
  wheelRotation: number;
  gear: number;
}
