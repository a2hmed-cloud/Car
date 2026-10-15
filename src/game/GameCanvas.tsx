import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAR_CONFIGS, buildCar, BuiltCar, CarConfig } from './carBuilder';
import { TRACK_CONFIGS, buildTrack, BuiltTrack, TrackConfig } from './trackBuilder';
import { CarPhysicsEngine, ControlInputs } from './physics';
import { createParticleSystem, ParticlePool } from './particles';
import { createSkidmarkSystem, SkidmarkSystem } from './skidmarks';
import { soundManager } from './audio';
import { calculateStepDriftScore, updateCombo, updateNitro } from './rules';

export interface GameCanvasProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  selectedCarId: string;
  selectedTrackId: string;
  gameMode: 'free' | 'target' | 'time';
  isMuted: boolean;
  mobileInputs?: ControlInputs;
  onStatsUpdate: (stats: {
    speed: number;
    rpmRatio: number;
    gear: number;
    nitro: number;
    driftAngle: number;
    isDrifting: boolean;
    score: number;
    combo: number;
    timeRemaining: number;
  }) => void;
  onGameOver: (results: {
    score: number;
    maxCombo: number;
    topSpeed: number;
    longestDrift: number;
    isVictory: boolean;
  }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  selectedCarId,
  selectedTrackId,
  gameMode,
  isMuted,
  mobileInputs,
  onStatsUpdate,
  onGameOver,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep callbacks current without tearing down WebGL canvas
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const carIdRef = useRef(selectedCarId);
  carIdRef.current = selectedCarId;

  const trackIdRef = useRef(selectedTrackId);
  trackIdRef.current = selectedTrackId;

  const modeRef = useRef(gameMode);
  modeRef.current = gameMode;

  const mobileInputsRef = useRef<ControlInputs>({
    forward: false,
    backward: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    boost: false,
  });
  if (mobileInputs) {
    mobileInputsRef.current = mobileInputs;
  }

  const onStatsUpdateRef = useRef(onStatsUpdate);
  onStatsUpdateRef.current = onStatsUpdate;

  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // External trigger for car/track hot-swapping
  const reinitCarRef = useRef<((id: string) => void) | null>(null);
  const reinitTrackRef = useRef<((id: string) => void) | null>(null);
  const resetCarPosRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (reinitCarRef.current) {
      reinitCarRef.current(selectedCarId);
    }
  }, [selectedCarId]);

  useEffect(() => {
    if (reinitTrackRef.current) {
      reinitTrackRef.current(selectedTrackId);
    }
  }, [selectedTrackId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect headless environment for ultra mode lossless performance
    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.2,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflections via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = roomEnv;
    pmrem.dispose();

    // 2. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    sunLight.position.set(45, 80, 40);
    if (!isHeadless) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 250;
      sunLight.shadow.bias = -0.0005;
      const d = 50;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    // 3. Track Setup
    let currentTrackConfig =
      TRACK_CONFIGS.find((t) => t.id === trackIdRef.current) || TRACK_CONFIGS[0];
    let builtTrack = buildTrack(currentTrackConfig.id);
    scene.add(builtTrack.group);

    scene.background = new THREE.Color(currentTrackConfig.skyColor);
    scene.fog = new THREE.FogExp2(currentTrackConfig.fogColor, 0.0055);

    // 4. Car Setup
    let currentCarConfig =
      CAR_CONFIGS.find((c) => c.id === carIdRef.current) || CAR_CONFIGS[0];
    let builtCar = buildCar(currentCarConfig);
    scene.add(builtCar.group);

    // 5. Physics Engine
    let physics = new CarPhysicsEngine(
      currentCarConfig,
      builtTrack.spawnPoint,
      builtTrack.walls
    );

    // 6. Particles & Skidmarks
    const particles = createParticleSystem();
    scene.add(particles.group);

    const skidmarks = createSkidmarkSystem();
    scene.add(skidmarks.mesh);

    // Collision response: sparks, thud sound, camera shake
    let cameraShake = 0;
    physics.onCollision = (impactSpeed, hitPos) => {
      particles.emitSpark(hitPos, new THREE.Vector3(0, 2, 0));
      soundManager.playImpactSound(Math.min(1.0, impactSpeed / 40));
      cameraShake = Math.min(1.2, cameraShake + impactSpeed * 0.03);
    };

    // Hot-swapping functions for car and track
    reinitCarRef.current = (newCarId: string) => {
      const cfg = CAR_CONFIGS.find((c) => c.id === newCarId);
      if (!cfg) return;
      currentCarConfig = cfg;
      scene.remove(builtCar.group);
      builtCar = buildCar(cfg);
      scene.add(builtCar.group);
      physics.setConfig(cfg);
    };

    reinitTrackRef.current = (newTrackId: string) => {
      const cfg = TRACK_CONFIGS.find((t) => t.id === newTrackId);
      if (!cfg) return;
      currentTrackConfig = cfg;
      scene.remove(builtTrack.group);
      builtTrack = buildTrack(cfg.id);
      scene.add(builtTrack.group);

      scene.background = new THREE.Color(cfg.skyColor);
      scene.fog = new THREE.FogExp2(cfg.fogColor, 0.0055);

      physics = new CarPhysicsEngine(
        currentCarConfig,
        builtTrack.spawnPoint,
        builtTrack.walls
      );
      physics.onCollision = (impactSpeed, hitPos) => {
        particles.emitSpark(hitPos, new THREE.Vector3(0, 2, 0));
        soundManager.playImpactSound(Math.min(1.0, impactSpeed / 40));
        cameraShake = Math.min(1.2, cameraShake + impactSpeed * 0.03);
      };
      skidmarks.clear();
      particles.clear();
    };

    resetCarPosRef.current = () => {
      physics.reset(builtTrack.spawnPoint);
      skidmarks.clear();
      particles.clear();
    };

    // 7. Input Handling (Keyboard)
    const keysHeld = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on space / arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysHeld.add(e.code);

      // Sound resume on first interaction
      soundManager.resume();

      if (e.code === 'KeyR' && stateRef.current === 'playing') {
        physics.reset(builtTrack.spawnPoint);
      }
      if (e.code === 'KeyM') {
        soundManager.toggleMute();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const onBlur = () => {
      keysHeld.clear();
      soundManager.stopAll();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // 8. Gameplay State
    let nitroFuel = 100;
    let totalScore = 0;
    let combo = 1;
    let continuousDriftTime = 0;
    let longestDrift = 0;
    let topSpeed = 0;
    let gameTimeRemaining = 90; // 90 seconds for time attack mode
    let lastHudUpdate = 0;

    // Camera view styles: 0 = Chase Dynamic, 1 = Bumper / Hood, 2 = Far Orbit
    let cameraMode = 0;
    const onKeyToggleCam = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        cameraMode = (cameraMode + 1) % 3;
      }
    };
    window.addEventListener('keydown', onKeyToggleCam);

    // Pre-allocated math objects to ensure zero GC in animation loop
    const _camDesired = new THREE.Vector3();
    const _camLookAt = new THREE.Vector3();
    const _carPos = new THREE.Vector3();
    const _rearLeftPos = new THREE.Vector3();
    const _rearRightPos = new THREE.Vector3();
    const _exhaustPos = new THREE.Vector3();
    const _smokeVel = new THREE.Vector3();

    const clock = new THREE.Clock();
    let animId: number;

    // Title showroom turntable angle
    let titleOrbitAngle = 0;

    // Main 60 FPS Game Loop
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      const currentState = stateRef.current;

      if (currentState === 'title') {
        // Atmospheric live showroom orbit camera
        titleOrbitAngle += dt * 0.45;
        const orbitRadius = 6.8;
        camera.position.set(
          Math.sin(titleOrbitAngle) * orbitRadius,
          2.6 + Math.sin(titleOrbitAngle * 0.8) * 0.4,
          Math.cos(titleOrbitAngle) * orbitRadius
        );
        camera.lookAt(0, 0.8, 0);

        // Keep car stationary in center for title hero centerpiece
        builtCar.group.position.set(0, 0, 0);
        builtCar.group.rotation.set(0, 0, 0);

        // Idle gentle engine purr
        soundManager.updateEngine(0.08, 0, false);
      } else if (currentState === 'playing') {
        // Collect Keyboard & Mobile inputs
        const mob = mobileInputsRef.current;
        const forward =
          keysHeld.has('KeyW') || keysHeld.has('ArrowUp') || mob.forward;
        const backward =
          keysHeld.has('KeyS') || keysHeld.has('ArrowDown') || mob.backward;
        const steerLeft =
          keysHeld.has('KeyA') || keysHeld.has('ArrowLeft') || mob.steerLeft;
        const steerRight =
          keysHeld.has('KeyD') || keysHeld.has('ArrowRight') || mob.steerRight;
        const handbrake =
          keysHeld.has('Space') || mob.handbrake;
        const boost =
          keysHeld.has('ShiftLeft') || keysHeld.has('ShiftRight') || mob.boost;

        const inputs: ControlInputs = {
          forward,
          backward,
          steerLeft,
          steerRight,
          handbrake,
          boost,
        };

        // Advance Physics
        physics.update(inputs, nitroFuel, dt);
        const pState = physics.state;

        // Top speed tracker
        if (pState.speed > topSpeed) {
          topSpeed = pState.speed;
        }

        // Update Nitro
        nitroFuel = updateNitro(
          nitroFuel,
          pState.isBoosting,
          pState.isDrifting,
          dt
        );

        // Update Drift Score & Combo
        if (pState.isDrifting) {
          continuousDriftTime += dt;
          if (continuousDriftTime > longestDrift) {
            longestDrift = continuousDriftTime;
          }
          combo = updateCombo(combo, continuousDriftTime);
          const stepPoints = calculateStepDriftScore(
            pState.speed,
            pState.slipAngleDeg,
            combo,
            dt
          );
          totalScore += stepPoints;

          // Drift chime when combo reaches higher thresholds
          if (Math.floor(continuousDriftTime) > Math.floor(continuousDriftTime - dt)) {
            soundManager.playDriftChime(combo);
          }
        } else {
          // Reset continuous drift timer when straightened out
          if (continuousDriftTime > 0) {
            continuousDriftTime = Math.max(0, continuousDriftTime - dt * 2.5);
            if (continuousDriftTime <= 0) {
              combo = 1;
            }
          }
        }

        // Time mode countdown
        if (modeRef.current === 'time') {
          gameTimeRemaining = Math.max(0, gameTimeRemaining - dt);
          if (gameTimeRemaining <= 0) {
            onGameOverRef.current({
              score: totalScore,
              maxCombo: combo,
              topSpeed,
              longestDrift: Math.round(longestDrift * 10) / 10,
              isVictory: totalScore >= 20000,
            });
          }
        } else if (modeRef.current === 'target') {
          if (totalScore >= 50000) {
            onGameOverRef.current({
              score: totalScore,
              maxCombo: combo,
              topSpeed,
              longestDrift: Math.round(longestDrift * 10) / 10,
              isVictory: true,
            });
          }
        }

        // Sync 3D Car Model with Physics
        builtCar.group.position.set(pState.x, pState.y, pState.z);
        builtCar.group.rotation.y = pState.yaw;

        // Front wheels steering angle
        builtCar.frontLeftWheel.rotation.y = pState.steeringAngle;
        builtCar.frontRightWheel.rotation.y = pState.steeringAngle;

        // Wheels spin rotation
        builtCar.frontLeftWheel.rotation.x = pState.wheelRotation;
        builtCar.frontRightWheel.rotation.x = pState.wheelRotation;
        builtCar.rearLeftWheel.rotation.x = pState.wheelRotation;
        builtCar.rearRightWheel.rotation.x = pState.wheelRotation;

        // Tire Skidmarks and Smoke
        builtCar.rearLeftWheel.getWorldPosition(_rearLeftPos);
        builtCar.rearRightWheel.getWorldPosition(_rearRightPos);

        const slipIntensity = Math.min(
          1.0,
          Math.abs(pState.slipAngleDeg) / 55 + (pState.isHandbraking ? 0.4 : 0)
        );

        if (pState.isDrifting || (pState.isHandbraking && pState.speed > 10)) {
          skidmarks.addSkid(_rearLeftPos, _rearRightPos, slipIntensity);

          _smokeVel.set(-Math.sin(pState.yaw) * 2, 0, -Math.cos(pState.yaw) * 2);
          particles.emitSmoke(_rearLeftPos, _smokeVel);
          particles.emitSmoke(_rearRightPos, _smokeVel);
        }

        // Nitro exhaust flames
        if (pState.isBoosting) {
          builtCar.leftExhaust.getWorldPosition(_exhaustPos);
          const headingDir = new THREE.Vector3(
            Math.sin(pState.yaw),
            0,
            Math.cos(pState.yaw)
          );
          particles.emitExhaustFlame(_exhaustPos, headingDir, true);

          builtCar.rightExhaust.getWorldPosition(_exhaustPos);
          particles.emitExhaustFlame(_exhaustPos, headingDir, true);
        }

        // Sound System updates
        soundManager.updateEngine(
          pState.rpmRatio,
          pState.speed / currentCarConfig.maxSpeed,
          pState.isAccelerating
        );
        soundManager.updateDriftScreech(pState.isDrifting ? slipIntensity : 0);
        soundManager.setNitroBoost(pState.isBoosting);

        // Camera Follow Rig with Drift-lookahead
        _carPos.set(pState.x, pState.y + 1.2, pState.z);

        if (cameraMode === 0) {
          // Dynamic chase camera: stays behind car, slightly lagging and swinging out to show the drift angle!
          const followDist = 6.4 + (pState.speed / currentCarConfig.maxSpeed) * 2.2;
          const followHeight = 2.4;

          // Camera position dampening
          const camAngle = pState.yaw + (pState.slipAngleDeg * Math.PI) / 180 * 0.35;
          _camDesired.set(
            pState.x - Math.sin(camAngle) * followDist,
            pState.y + followHeight,
            pState.z - Math.cos(camAngle) * followDist
          );

          // Exponential damping (smooth momentum feel)
          camera.position.lerp(_camDesired, 1 - Math.exp(-8 * dt));

          // Camera target looks slightly ahead of the car
          _camLookAt.set(
            pState.x + Math.sin(pState.yaw) * 4,
            pState.y + 0.8,
            pState.z + Math.cos(pState.yaw) * 4
          );
          camera.lookAt(_camLookAt);
        } else if (cameraMode === 1) {
          // Hood / Bumper camera
          camera.position.set(
            pState.x + Math.sin(pState.yaw) * 1.4,
            pState.y + 0.95,
            pState.z + Math.cos(pState.yaw) * 1.4
          );
          _camLookAt.set(
            pState.x + Math.sin(pState.yaw) * 12,
            pState.y + 0.8,
            pState.z + Math.cos(pState.yaw) * 12
          );
          camera.lookAt(_camLookAt);
        } else {
          // Far Drone camera
          camera.position.set(pState.x - 12, pState.y + 10, pState.z - 12);
          camera.lookAt(_carPos);
        }

        // Camera Shake decay on collision or high speed
        if (cameraShake > 0.001) {
          camera.position.x += (Math.random() - 0.5) * cameraShake * 0.4;
          camera.position.y += (Math.random() - 0.5) * cameraShake * 0.4;
          cameraShake = Math.max(0, cameraShake - dt * 2.8);
        }

        // Sun light follows player to ensure consistent crisp shadows
        sunLight.position.set(pState.x + 40, 80, pState.z + 40);
        sunLight.target.position.set(pState.x, 0, pState.z);

        // Throttle React HUD updates to 10Hz (preserves 60fps WebGL)
        const now = performance.now();
        if (now - lastHudUpdate > 90) {
          lastHudUpdate = now;
          onStatsUpdateRef.current({
            speed: pState.speed,
            rpmRatio: pState.rpmRatio,
            gear: pState.gear,
            nitro: Math.round(nitroFuel),
            driftAngle: Math.round(Math.abs(pState.slipAngleDeg)),
            isDrifting: pState.isDrifting,
            score: totalScore,
            combo,
            timeRemaining: Math.ceil(gameTimeRemaining),
          });
        }
      } else {
        // Paused or Game Over - silence active sounds
        soundManager.stopAll();
      }

      // Update particles and skidmarks
      particles.update(dt);
      skidmarks.update(dt);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(tick);

    // Resize handler with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyToggleCam);
      window.removeEventListener('blur', onBlur);
      resizeObserver.disconnect();
      soundManager.stopAll();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="threejs-canvas-mount"
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
    />
  );
};
