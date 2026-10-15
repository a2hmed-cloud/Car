import * as THREE from 'three';

export interface TrackConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  skyColor: number;
  fogColor: number;
  lightColor: number;
  groundColor: number;
  difficulty: 'سهل' | 'متوسط' | 'محترف' | 'Easy' | 'Medium' | 'Pro';
}

export const TRACK_CONFIGS: TrackConfig[] = [
  {
    id: 'tokyo-docks',
    nameAr: 'ميناء طوكيو الليلي',
    nameEn: 'Tokyo Night Docks',
    descAr: 'حلبة ليلية بين حاويات الشحن وأضواء النيون الساطعة',
    descEn: 'Neon-lit asphalt circuit weaving through shipping containers & docks',
    skyColor: 0x050814,
    fogColor: 0x080e22,
    lightColor: 0x93c5fd,
    groundColor: 0x0f172a,
    difficulty: 'متوسط',
  },
  {
    id: 'desert-pass',
    nameAr: 'طريق الواحة الصحراوي',
    nameEn: 'Desert Oasis Pass',
    descAr: 'منعطفات رملية واسعة وسط جبال الوادي وأشجار النخيل الذهبية',
    descEn: 'Sweeping canyon highway with golden sunset lighting & oasis palms',
    skyColor: 0x451a03,
    fogColor: 0x78350f,
    lightColor: 0xfde047,
    groundColor: 0xd97706,
    difficulty: 'سهل',
  },
  {
    id: 'gymkhana-park',
    nameAr: 'ساحة التدريب والاستعراض',
    nameEn: 'Gymkhana Drift Park',
    descAr: 'ميدان مفتوح مجهز ببراميل الدونات ومسارات السلالوم الحرة',
    descEn: 'Open drift arena with donut donuts, slalom cones & high-speed hairpins',
    skyColor: 0x09090b,
    fogColor: 0x18181b,
    lightColor: 0x38bdf8,
    groundColor: 0x27272a,
    difficulty: 'محترف',
  },
];

export interface TrackPoint {
  x: number;
  z: number;
  width: number;
}

export interface WallSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  nx: number; // normal
  nz: number;
}

export interface BuiltTrack {
  group: THREE.Group;
  walls: WallSegment[];
  waypoints: THREE.Vector3[];
  spawnPoint: { x: number; y: number; z: number; rotationY: number };
  theme: TrackConfig;
}

/**
 * Creates asphalt road texture procedurally using HTML5 Canvas.
 */
function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base with noise grain
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  // Grain noise
  for (let i = 0; i < 4000; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const alpha = Math.random() * 0.12;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Asphalt side edges
  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, 20, 512);
  ctx.fillRect(492, 0, 20, 512);

  // Center dashed yellow/white line
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  ctx.setLineDash([40, 30]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // White outer lane boundary lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(35, 0);
  ctx.lineTo(35, 512);
  ctx.moveTo(477, 0);
  ctx.lineTo(477, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates red/white alternating curb rumble strip texture.
 */
function createCurbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(64, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Build 3D Track environment with full scenery, barrier collision segments, and landmarks.
 */
export function buildTrack(trackId: string): BuiltTrack {
  const group = new THREE.Group();
  const theme = TRACK_CONFIGS.find((t) => t.id === trackId) || TRACK_CONFIGS[0];

  // Base ground terrain
  const groundGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: theme.groundColor,
    roughness: 0.95,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  // Road paths definitions for tracks
  let pathPoints: THREE.Vector3[] = [];
  let roadWidth = 14;

  if (trackId === 'tokyo-docks') {
    // Technical harbor circuit with hairpin, chicane, long straight for high-speed drift
    pathPoints = [
      new THREE.Vector3(0, 0, -80),
      new THREE.Vector3(50, 0, -80),
      new THREE.Vector3(100, 0, -50),
      new THREE.Vector3(120, 0, 10),
      new THREE.Vector3(90, 0, 60),
      new THREE.Vector3(30, 0, 90),
      new THREE.Vector3(-40, 0, 80),
      new THREE.Vector3(-80, 0, 40),
      new THREE.Vector3(-50, 0, 0), // chicane apex
      new THREE.Vector3(-100, 0, -30),
      new THREE.Vector3(-80, 0, -75),
    ];
  } else if (trackId === 'desert-pass') {
    // Flowing sweeping canyon road
    pathPoints = [
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(60, 0, -85),
      new THREE.Vector3(110, 0, -30),
      new THREE.Vector3(95, 0, 45),
      new THREE.Vector3(35, 0, 100),
      new THREE.Vector3(-35, 0, 80),
      new THREE.Vector3(-90, 0, 20),
      new THREE.Vector3(-100, 0, -60),
    ];
    roadWidth = 16;
  } else {
    // Gymkhana freestyle park - figure-8 layout with central donut area
    pathPoints = [
      new THREE.Vector3(0, 0, -70),
      new THREE.Vector3(65, 0, -50),
      new THREE.Vector3(80, 0, 0),
      new THREE.Vector3(35, 0, 30),
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(-75, 0, 0),
      new THREE.Vector3(-60, 0, 50),
      new THREE.Vector3(0, 0, 75),
      new THREE.Vector3(60, 0, 65),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-60, 0, -60),
    ];
    roadWidth = 18;
  }

  // Generate smooth closed spline
  const curve = new THREE.CatmullRomCurve3(pathPoints, true);
  const sampleCount = 200;
  const sampledPoints = curve.getSpacedPoints(sampleCount);

  // Build road ribbon mesh
  const roadTexture = createRoadTexture();
  roadTexture.repeat.set(1, 40);

  const roadVertices: number[] = [];
  const roadIndices: number[] = [];
  const roadUvs: number[] = [];

  const curbTexture = createCurbTexture();
  curbTexture.repeat.set(1, 100);

  const walls: WallSegment[] = [];

  // Generate road ribbon geometry
  for (let i = 0; i <= sampleCount; i++) {
    const pt = sampledPoints[i % sampleCount];
    const nextPt = sampledPoints[(i + 1) % sampleCount];

    // Tangent and normal
    const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const halfW = roadWidth / 2;

    const left = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);
    const right = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);

    roadVertices.push(left.x, 0.03, left.z);
    roadVertices.push(right.x, 0.03, right.z);

    const v = i / sampleCount * 40;
    roadUvs.push(0, v, 1, v);

    if (i < sampleCount) {
      const idx = i * 2;
      roadIndices.push(idx, idx + 1, idx + 2);
      roadIndices.push(idx + 1, idx + 3, idx + 2);

      // Track wall boundaries for collision
      const nextLeft = new THREE.Vector3().copy(nextPt).addScaledVector(normal, halfW + 1.2);
      const nextRight = new THREE.Vector3().copy(nextPt).addScaledVector(normal, -(halfW + 1.2));

      // Outer left barrier
      walls.push({
        x1: left.x + normal.x * 1.2,
        z1: left.z + normal.z * 1.2,
        x2: nextLeft.x,
        z2: nextLeft.z,
        nx: -normal.x,
        nz: -normal.z,
      });

      // Outer right barrier
      walls.push({
        x1: right.x - normal.x * 1.2,
        z1: right.z - normal.z * 1.2,
        x2: nextRight.x,
        z2: nextRight.z,
        nx: normal.x,
        nz: normal.y,
      });
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.85,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // --- Decorative Scenery & Props by Theme ---
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.7,
    roughness: 0.3,
  });

  const barrierWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Guard rails / barriers every few meters along edges
  for (let i = 0; i < sampleCount; i += 3) {
    const pt = sampledPoints[i];
    const nextPt = sampledPoints[(i + 1) % sampleCount];
    const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const isRed = (i / 3) % 2 === 0;
    const mat = isRed ? barrierMat : barrierWhiteMat;

    // Left barrier block
    const bGeo = new THREE.BoxGeometry(0.5, 0.9, 3.6);
    const bLeft = new THREE.Mesh(bGeo, mat);
    bLeft.position.set(pt.x + normal.x * (roadWidth / 2 + 0.8), 0.45, pt.z + normal.z * (roadWidth / 2 + 0.8));
    bLeft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    bLeft.castShadow = true;
    group.add(bLeft);

    // Right barrier block
    const bRight = new THREE.Mesh(bGeo, mat);
    bRight.position.set(pt.x - normal.x * (roadWidth / 2 + 0.8), 0.45, pt.z - normal.z * (roadWidth / 2 + 0.8));
    bRight.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    bRight.castShadow = true;
    group.add(bRight);
  }

  // Thematic props:
  if (trackId === 'tokyo-docks') {
    // Shipping Containers in harbor stacks
    const containerColors = [0x0284c7, 0xd97706, 0xdc2626, 0x16a34a, 0x4f46e5];
    const containerGeo = new THREE.BoxGeometry(3.5, 3.2, 8.5);

    for (let c = 0; c < 24; c++) {
      const angle = (c / 24) * Math.PI * 2;
      const radius = 130 + (c % 3) * 18;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;

      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[c % containerColors.length],
        metalness: 0.6,
        roughness: 0.4,
      });

      const container = new THREE.Mesh(containerGeo, cMat);
      container.position.set(cx, 1.6, cz);
      container.rotation.y = angle + (c % 2 ? 0.3 : -0.2);
      container.castShadow = true;
      container.receiveShadow = true;
      group.add(container);

      // Stacked container on top
      if (c % 2 === 0) {
        const topContainer = container.clone();
        topContainer.position.y = 4.8;
        group.add(topContainer);
      }
    }

    // Street light towers
    for (let l = 0; l < sampleCount; l += 15) {
      const pt = sampledPoints[l];
      const tangent = new THREE.Vector3().subVectors(sampledPoints[(l + 1) % sampleCount], pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      pole.position.set(pt.x + normal.x * (roadWidth / 2 + 3), 5, pt.z + normal.z * (roadWidth / 2 + 3));
      group.add(pole);

      // Neon floodlight head
      const lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 })
      );
      lampHead.position.set(pole.position.x - normal.x * 0.8, 9.8, pole.position.z - normal.z * 0.8);
      group.add(lampHead);
    }
  } else if (trackId === 'desert-pass') {
    // Desert Palm Trees & Canyon Rock Formations
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.95 });

    // Rocks along horizon
    for (let r = 0; r < 20; r++) {
      const angle = (r / 20) * Math.PI * 2;
      const rx = Math.cos(angle) * (140 + (r % 4) * 20);
      const rz = Math.sin(angle) * (140 + (r % 4) * 20);
      const rockGeo = new THREE.DodecahedronGeometry(8 + (r % 5) * 3, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, 4, rz);
      rock.rotation.set(r * 0.5, r * 0.8, 0);
      rock.castShadow = true;
      group.add(rock);
    }

    // Palm trees near track
    for (let p = 0; p < sampleCount; p += 14) {
      const pt = sampledPoints[p];
      const tangent = new THREE.Vector3().subVectors(sampledPoints[(p + 1) % sampleCount], pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = (p / 14) % 2 === 0 ? 1 : -1;

      const px = pt.x + normal.x * (roadWidth / 2 + 4.5) * side;
      const pz = pt.z + normal.z * (roadWidth / 2 + 4.5) * side;

      const palmGroup = new THREE.Group();
      palmGroup.position.set(px, 0, pz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 7, 8), trunkMat);
      trunk.position.y = 3.5;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      palmGroup.add(trunk);

      // Fronds
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 5), palmFrondMat);
        frond.position.set(0, 6.8, 0);
        frond.rotation.x = 1.1;
        frond.rotation.y = (f * Math.PI * 2) / 6;
        palmGroup.add(frond);
      }
      group.add(palmGroup);
    }
  } else {
    // Gymkhana freestyle barrels, cones, drift towers
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

    // Center Donut Tower
    const towerGeo = new THREE.CylinderGeometry(4, 4, 12, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 });
    const centerTower = new THREE.Mesh(towerGeo, towerMat);
    centerTower.position.set(0, 6, 0);
    centerTower.castShadow = true;
    group.add(centerTower);

    // Neon sign on tower
    const ringGeo = new THREE.TorusGeometry(5.2, 0.3, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 3 });
    const neonRing = new THREE.Mesh(ringGeo, ringMat);
    neonRing.position.set(0, 10, 0);
    neonRing.rotation.x = Math.PI / 2;
    group.add(neonRing);

    // Cones and barrels around arena
    for (let b = 0; b < 16; b++) {
      const angle = (b / 16) * Math.PI * 2;
      const bx = Math.cos(angle) * 35;
      const bz = Math.sin(angle) * 35;

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.8, 12), barrelMat);
      barrel.position.set(bx, 0.9, bz);
      barrel.castShadow = true;
      group.add(barrel);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 12), coneMat);
      cone.position.set(bx + 2.5, 0.45, bz + 2.5);
      group.add(cone);
    }
  }

  // Starting Arch / Finish Gantry
  const archGroup = new THREE.Group();
  const startPt = sampledPoints[0];
  const nextPt = sampledPoints[1];
  const startTangent = new THREE.Vector3().subVectors(nextPt, startPt).normalize();
  const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();

  archGroup.position.set(startPt.x, 0, startPt.z);
  archGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);

  const p1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
  );
  p1.position.set(roadWidth / 2 + 1, 3, 0);

  const p2 = p1.clone();
  p2.position.set(-(roadWidth / 2 + 1), 3, 0);

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(roadWidth + 3, 1.2, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
  );
  crossbar.position.set(0, 5.4, 0);

  // Checkerboard banner canvas
  const checkCanvas = document.createElement('canvas');
  checkCanvas.width = 256;
  checkCanvas.height = 64;
  const cctx = checkCanvas.getContext('2d')!;
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 4; y++) {
      cctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
      cctx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  const checkTex = new THREE.CanvasTexture(checkCanvas);
  checkTex.colorSpace = THREE.SRGBColorSpace;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth, 1.0),
    new THREE.MeshBasicMaterial({ map: checkTex })
  );
  banner.position.set(0, 5.4, 0.42);
  archGroup.add(p1, p2, crossbar, banner);
  group.add(archGroup);

  // Initial spawn point: on road, aligned with tangent
  const spawnHeading = Math.atan2(startTangent.x, startTangent.z);

  return {
    group,
    walls,
    waypoints: sampledPoints,
    spawnPoint: {
      x: startPt.x,
      y: 0,
      z: startPt.z,
      rotationY: spawnHeading,
    },
    theme,
  };
}
