import * as THREE from 'three';

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

export const CAR_CONFIGS: CarConfig[] = [
  {
    id: 'falcon-r34',
    nameAr: 'صقر الصحراء R34',
    nameEn: 'Falcon R34',
    taglineAr: 'متوازن وقوي - المفضل لمحترفي الدريفت',
    taglineEn: 'Balanced & Agile - Pro Drifter Legend',
    primaryColor: 0x1e3a8a, // Midnight Blue
    secondaryColor: 0x0f172a, // Deep Charcoal
    accentColor: 0xf59e0b, // Amber Gold
    maxSpeed: 215,
    acceleration: 28,
    driftSlip: 1.15,
    handling: 1.1,
  },
  {
    id: 'viper-gt',
    nameAr: 'الأفعى التوربو GT',
    nameEn: 'Viper GT Turbo',
    taglineAr: 'وحش العضلات ذو القوة الحصانية الهائلة',
    taglineEn: 'Pure Muscle - High Torque Beast',
    primaryColor: 0xdc2626, // Crimson Red
    secondaryColor: 0x111827, // Jet Black
    accentColor: 0xffffff, // White Racing Stripes
    maxSpeed: 240,
    acceleration: 32,
    driftSlip: 1.35,
    handling: 0.95,
  },
  {
    id: 'cyber-phantom',
    nameAr: 'الشبح النيوني RX',
    nameEn: 'Cyber Phantom RX',
    taglineAr: 'سرعة البرق مع نظام انزلاق جانبي متطور',
    taglineEn: 'Hyper Agility - Neon Drift Rocket',
    primaryColor: 0x09090b, // Matte Carbon Black
    secondaryColor: 0x0284c7, // Neon Cyan
    accentColor: 0x06b6d4, // Electric Cyan Glow
    maxSpeed: 230,
    acceleration: 30,
    driftSlip: 1.45,
    handling: 1.25,
  },
];

export interface BuiltCar {
  group: THREE.Group;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  leftExhaust: THREE.Object3D;
  rightExhaust: THREE.Object3D;
  headlightL: THREE.SpotLight;
  headlightR: THREE.SpotLight;
  taillightMesh: THREE.Mesh;
}

/**
 * Builds a procedural high-quality 3D sports drift car.
 * Follows the 3-12 composite part rule:
 * 1. Primary silhouette (aerodynamic body, flared fenders, front bumper, rear diffuser)
 * 2. Secondary read (glass canopy, cockpit, high-downforce GT rear wing)
 * 3. Accent detail (LED headlights, neon taillights, dual exhaust tips, 4 detailed wheels with calipers & discs)
 * 4. Grounded radial contact shadow disc underneath.
 */
export function buildCar(config: CarConfig): BuiltCar {
  const root = new THREE.Group();

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: config.primaryColor,
    metalness: 0.7,
    roughness: 0.22,
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: config.secondaryColor,
    metalness: 0.85,
    roughness: 0.35,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    metalness: 0.3,
    roughness: 0.55,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x222225,
    roughness: 0.9,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: config.accentColor === 0xffffff ? 0xc0c0c0 : config.accentColor,
    metalness: 0.9,
    roughness: 0.18,
  });

  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red performance brakes
    metalness: 0.4,
    roughness: 0.3,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xecfeff,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  // --- 1. Chassis & Bodywork ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.42; // Above ground height

  // Lower chassis base
  const lowerBaseGeo = new THREE.BoxGeometry(1.82, 0.32, 4.3);
  const lowerBase = new THREE.Mesh(lowerBaseGeo, bodyMaterial);
  lowerBase.position.y = 0.08;
  lowerBase.castShadow = true;
  lowerBase.receiveShadow = true;
  bodyGroup.add(lowerBase);

  // Front wedge hood
  const hoodGeo = new THREE.BoxGeometry(1.76, 0.22, 1.4);
  const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
  hood.position.set(0, 0.24, 1.35);
  hood.rotation.x = -0.06;
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Front aero splitter / carbon lip
  const splitterGeo = new THREE.BoxGeometry(1.88, 0.06, 0.45);
  const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitter.position.set(0, -0.08, 2.2);
  splitter.castShadow = true;
  bodyGroup.add(splitter);

  // Rear diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.84, 0.12, 0.35);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuser.position.set(0, -0.04, -2.18);
  diffuser.castShadow = true;
  bodyGroup.add(diffuser);

  // Side skirts
  const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 2.3), carbonMaterial);
  leftSkirt.position.set(0.93, -0.06, 0);
  const rightSkirt = leftSkirt.clone();
  rightSkirt.position.set(-0.93, -0.06, 0);
  bodyGroup.add(leftSkirt, rightSkirt);

  // Flared wheel arches (fenders)
  const archGeo = new THREE.BoxGeometry(0.12, 0.24, 0.85);
  const archFL = new THREE.Mesh(archGeo, bodyMaterial);
  archFL.position.set(0.92, 0.06, 1.4);
  const archFR = archFL.clone();
  archFR.position.set(-0.92, 0.06, 1.4);
  const archRL = archFL.clone();
  archRL.position.set(0.92, 0.06, -1.35);
  const archRR = archFL.clone();
  archRR.position.set(-0.92, 0.06, -1.35);
  bodyGroup.add(archFL, archFR, archRL, archRR);

  // --- 2. Cockpit Canopy & Windows ---
  const cabinGeo = new THREE.BoxGeometry(1.48, 0.46, 1.85);
  const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
  cabin.position.set(0, 0.48, -0.15);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.42, 0.06, 1.25);
  const roof = new THREE.Mesh(roofGeo, trimMaterial);
  roof.position.set(0, 0.72, -0.22);
  roof.castShadow = true;
  bodyGroup.add(roof);

  // Windshield frame / pillars
  const pillarGeo = new THREE.BoxGeometry(0.06, 0.45, 0.06);
  const pA1 = new THREE.Mesh(pillarGeo, trimMaterial);
  pA1.position.set(0.72, 0.48, 0.65);
  pA1.rotation.x = 0.55;
  const pA2 = pA1.clone();
  pA2.position.set(-0.72, 0.48, 0.65);
  bodyGroup.add(pA1, pA2);

  // --- 3. Rear GT Racing Wing (Spoiler) ---
  const wingBladeGeo = new THREE.BoxGeometry(1.95, 0.04, 0.42);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMaterial);
  wingBlade.position.set(0, 0.78, -2.05);
  wingBlade.castShadow = true;

  // Wing uprights / mounts
  const mountGeo = new THREE.BoxGeometry(0.04, 0.48, 0.18);
  const mountL = new THREE.Mesh(mountGeo, trimMaterial);
  mountL.position.set(0.55, 0.54, -1.98);
  mountL.rotation.x = -0.15;
  const mountR = mountL.clone();
  mountR.position.set(-0.55, 0.54, -1.98);

  // Wing endplates
  const endplateGeo = new THREE.BoxGeometry(0.03, 0.18, 0.46);
  const epL = new THREE.Mesh(endplateGeo, carbonMaterial);
  epL.position.set(0.98, 0.78, -2.05);
  const epR = epL.clone();
  epR.position.set(-0.98, 0.78, -2.05);
  bodyGroup.add(wingBlade, mountL, mountR, epL, epR);

  // --- 4. Headlights & Taillights ---
  // Front LED Headlights
  const headGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
  const headL = new THREE.Mesh(headGeo, headlightMaterial);
  headL.position.set(0.64, 0.16, 2.15);
  const headR = headL.clone();
  headR.position.set(-0.64, 0.16, 2.15);
  bodyGroup.add(headL, headR);

  // Spotlights pointing forward for night driving feel
  const spotL = new THREE.SpotLight(0xf8fafc, 2.5, 45, Math.PI / 6, 0.4, 1.2);
  spotL.position.set(0.64, 0.6, 2.2);
  spotL.target.position.set(0.64, 0.1, 15);
  root.add(spotL.target);

  const spotR = new THREE.SpotLight(0xf8fafc, 2.5, 45, Math.PI / 6, 0.4, 1.2);
  spotR.position.set(-0.64, 0.6, 2.2);
  spotR.target.position.set(-0.64, 0.1, 15);
  root.add(spotR.target);
  root.add(spotL, spotR);

  // Rear Continuous LED Taillight Bar
  const tailGeo = new THREE.BoxGeometry(1.68, 0.1, 0.08);
  const tailBar = new THREE.Mesh(tailGeo, taillightMaterial);
  tailBar.position.set(0, 0.22, -2.15);
  bodyGroup.add(tailBar);

  // Dual Exhaust Tips
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.35, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exL = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exL.position.set(0.48, -0.06, -2.2);
  const exR = exL.clone();
  exR.position.set(-0.48, -0.06, -2.2);
  bodyGroup.add(exL, exR);

  // Points where nitro flames and smoke puff from
  const leftExhaustAnchor = new THREE.Object3D();
  leftExhaustAnchor.position.set(0.48, 0.36, -2.4);
  const rightExhaustAnchor = new THREE.Object3D();
  rightExhaustAnchor.position.set(-0.48, 0.36, -2.4);
  root.add(leftExhaustAnchor, rightExhaustAnchor);

  root.add(bodyGroup);

  // --- 5. Detailed 3D Wheels ---
  const wheelRadius = 0.36;
  const wheelWidth = 0.28;

  function createWheel(): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Rubber Tire with rim bevel
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMaterial);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Inner Rim / Wheel Face
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.02, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMaterial);
    wheelGroup.add(rim);

    // Wheel Spokes (Star / 5-spoke sport rim)
    for (let i = 0; i < 5; i++) {
      const spokeGeo = new THREE.BoxGeometry(wheelWidth * 1.04, wheelRadius * 0.65, 0.05);
      const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
      spoke.rotation.x = (i * Math.PI * 2) / 5;
      wheelGroup.add(spoke);
    }

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, 0.04, 16);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, chromeMaterial);
    wheelGroup.add(disc);

    // Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
    caliper.position.set(0, wheelRadius * 0.35, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  const frontLeftWheel = createWheel();
  frontLeftWheel.position.set(0.96, wheelRadius, 1.4);

  const frontRightWheel = createWheel();
  frontRightWheel.position.set(-0.96, wheelRadius, 1.4);

  const rearLeftWheel = createWheel();
  rearLeftWheel.position.set(0.96, wheelRadius, -1.35);

  const rearRightWheel = createWheel();
  rearRightWheel.position.set(-0.96, wheelRadius, -1.35);

  root.add(frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel);

  // --- 6. Contact Shadow Disc ---
  // Soft grounded shadow beneath car to ensure zero floating look
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const gradient = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = gradient;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(2.6, 5.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02; // Just above ground
  root.add(shadowMesh);

  return {
    group: root,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    leftExhaust: leftExhaustAnchor,
    rightExhaust: rightExhaustAnchor,
    headlightL: spotL,
    headlightR: spotR,
    taillightMesh: tailBar,
  };
}
