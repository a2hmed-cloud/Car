import * as THREE from 'three';

const MAX_SMOKE = 200;
const MAX_SPARKS = 100;
const MAX_FLAMES = 40;

export interface ParticlePool {
  group: THREE.Group;
  emitSmoke: (pos: THREE.Vector3, vel: THREE.Vector3) => void;
  emitSpark: (pos: THREE.Vector3, vel: THREE.Vector3) => void;
  emitExhaustFlame: (pos: THREE.Vector3, dir: THREE.Vector3, isNitro: boolean) => void;
  update: (dt: number) => void;
  clear: () => void;
}

export function createParticleSystem(): ParticlePool {
  const group = new THREE.Group();

  // 1. Tire Smoke (InstancedMesh of low-poly dodecahedrons / sphere puffs)
  const smokeGeo = new THREE.DodecahedronGeometry(0.35, 1);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, MAX_SMOKE);
  smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(smokeMesh);

  interface SmokeItem {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    scale: number;
    growth: number;
    life: number;
    maxLife: number;
  }

  const smokePool: SmokeItem[] = Array.from({ length: MAX_SMOKE }, () => ({
    x: 0,
    y: -999,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    scale: 0.1,
    growth: 1.2,
    life: 0,
    maxLife: 1.0,
  }));
  let smokeIdx = 0;

  // 2. Collision Sparks
  const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.25);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
  });
  const sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, MAX_SPARKS);
  sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(sparkMesh);

  interface SparkItem {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }

  const sparkPool: SparkItem[] = Array.from({ length: MAX_SPARKS }, () => ({
    x: 0,
    y: -999,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.4,
  }));
  let sparkIdx = 0;

  // 3. Exhaust Flame Cones
  const flameGeo = new THREE.ConeGeometry(0.12, 0.6, 8);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });
  const flameMesh = new THREE.InstancedMesh(flameGeo, flameMat, MAX_FLAMES);
  flameMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(flameMesh);

  interface FlameItem {
    x: number;
    y: number;
    z: number;
    dirX: number;
    dirZ: number;
    scale: number;
    life: number;
    isNitro: boolean;
  }

  const flamePool: FlameItem[] = Array.from({ length: MAX_FLAMES }, () => ({
    x: 0,
    y: -999,
    z: 0,
    dirX: 0,
    dirZ: 0,
    scale: 1,
    life: 0,
    isNitro: false,
  }));
  let flameIdx = 0;

  // Reusable matrix and helpers to prevent GC
  const _matrix = new THREE.Matrix4();
  const _pos = new THREE.Vector3();
  const _scale = new THREE.Vector3();
  const _quat = new THREE.Quaternion();

  function emitSmoke(pos: THREE.Vector3, vel: THREE.Vector3) {
    const item = smokePool[smokeIdx];
    item.x = pos.x + (Math.random() - 0.5) * 0.3;
    item.y = pos.y + 0.1;
    item.z = pos.z + (Math.random() - 0.5) * 0.3;
    item.vx = vel.x * 0.2 + (Math.random() - 0.5) * 0.5;
    item.vy = 0.8 + Math.random() * 0.6;
    item.vz = vel.z * 0.2 + (Math.random() - 0.5) * 0.5;
    item.scale = 0.25;
    item.growth = 1.4 + Math.random() * 0.8;
    item.life = 0.8 + Math.random() * 0.4;
    item.maxLife = item.life;
    smokeIdx = (smokeIdx + 1) % MAX_SMOKE;
  }

  function emitSpark(pos: THREE.Vector3, vel: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const item = sparkPool[sparkIdx];
      item.x = pos.x;
      item.y = pos.y;
      item.z = pos.z;
      item.vx = vel.x * 0.4 + (Math.random() - 0.5) * 8;
      item.vy = 2.0 + Math.random() * 4;
      item.vz = vel.z * 0.4 + (Math.random() - 0.5) * 8;
      item.life = 0.2 + Math.random() * 0.25;
      item.maxLife = item.life;
      sparkIdx = (sparkIdx + 1) % MAX_SPARKS;
    }
  }

  function emitExhaustFlame(pos: THREE.Vector3, dir: THREE.Vector3, isNitro: boolean) {
    const item = flamePool[flameIdx];
    item.x = pos.x;
    item.y = pos.y;
    item.z = pos.z;
    item.dirX = dir.x;
    item.dirZ = dir.z;
    item.scale = isNitro ? 1.6 : 0.8;
    item.life = 0.08;
    item.isNitro = isNitro;
    flameIdx = (flameIdx + 1) % MAX_FLAMES;
  }

  function update(dt: number) {
    // 1. Update Smoke
    for (let i = 0; i < MAX_SMOKE; i++) {
      const s = smokePool[i];
      if (s.life > 0) {
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.scale += s.growth * dt;
        const progress = 1 - s.life / s.maxLife;

        _pos.set(s.x, s.y, s.z);
        _scale.setScalar(s.scale * (1 - progress * 0.3));
        _quat.identity();
        _matrix.compose(_pos, _quat, _scale);
        smokeMesh.setMatrixAt(i, _matrix);
      } else {
        _pos.set(0, -999, 0);
        _scale.setScalar(0.001);
        _matrix.compose(_pos, _quat, _scale);
        smokeMesh.setMatrixAt(i, _matrix);
      }
    }
    smokeMesh.instanceMatrix.needsUpdate = true;

    // 2. Update Sparks
    for (let i = 0; i < MAX_SPARKS; i++) {
      const sp = sparkPool[i];
      if (sp.life > 0) {
        sp.life -= dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.z += sp.vz * dt;
        sp.vy -= 9.8 * dt; // gravity

        _pos.set(sp.x, sp.y, sp.z);
        _scale.setScalar(Math.max(0.1, sp.life / sp.maxLife));
        _quat.identity();
        _matrix.compose(_pos, _quat, _scale);
        sparkMesh.setMatrixAt(i, _matrix);
      } else {
        _pos.set(0, -999, 0);
        _matrix.compose(_pos, _quat, _scale);
        sparkMesh.setMatrixAt(i, _matrix);
      }
    }
    sparkMesh.instanceMatrix.needsUpdate = true;

    // 3. Update Exhaust Flames
    for (let i = 0; i < MAX_FLAMES; i++) {
      const fl = flamePool[i];
      if (fl.life > 0) {
        fl.life -= dt;
        _pos.set(fl.x, fl.y, fl.z);
        _scale.setScalar(fl.scale * (0.8 + Math.random() * 0.4));
        const rotY = Math.atan2(fl.dirX, fl.dirZ) + Math.PI;
        _quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        _matrix.compose(_pos, _quat, _scale);
        flameMesh.setMatrixAt(i, _matrix);
      } else {
        _pos.set(0, -999, 0);
        _matrix.compose(_pos, _quat, _scale);
        flameMesh.setMatrixAt(i, _matrix);
      }
    }
    flameMesh.instanceMatrix.needsUpdate = true;
  }

  function clear() {
    for (const s of smokePool) s.life = 0;
    for (const sp of sparkPool) sp.life = 0;
    for (const fl of flamePool) fl.life = 0;
  }

  return {
    group,
    emitSmoke,
    emitSpark,
    emitExhaustFlame,
    update,
    clear,
  };
}
