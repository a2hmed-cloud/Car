import * as THREE from 'three';

const MAX_SKID_SEGMENTS = 500;

export interface SkidmarkSystem {
  mesh: THREE.Mesh;
  addSkid: (leftPos: THREE.Vector3, rightPos: THREE.Vector3, intensity: number) => void;
  update: (dt: number) => void;
  clear: () => void;
}

export function createSkidmarkSystem(): SkidmarkSystem {
  const geometry = new THREE.BufferGeometry();
  const maxVertices = MAX_SKID_SEGMENTS * 4;
  const maxIndices = MAX_SKID_SEGMENTS * 6;

  const positions = new Float32Array(maxVertices * 3);
  const uvs = new Float32Array(maxVertices * 2);
  const colors = new Float32Array(maxVertices * 4); // RGBA
  const indices = new Uint16Array(maxIndices);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // Skidmark texture
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#111115';
  ctx.fillRect(0, 0, 64, 64);
  // Tire tread streaks
  ctx.fillStyle = '#050508';
  ctx.fillRect(10, 0, 12, 64);
  ctx.fillRect(42, 0, 12, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;

  let segmentCount = 0;
  let writeHead = 0;
  let lastLeft: THREE.Vector3 | null = null;
  let lastRight: THREE.Vector3 | null = null;

  function addSkid(leftPos: THREE.Vector3, rightPos: THREE.Vector3, intensity: number) {
    if (!lastLeft || !lastRight) {
      lastLeft = leftPos.clone();
      lastRight = rightPos.clone();
      return;
    }

    const dist = lastLeft.distanceTo(leftPos);
    if (dist < 0.25) return; // Too close to last segment

    const seg = writeHead;
    const vOffset = seg * 4;
    const iOffset = seg * 6;

    // Y offset slightly above asphalt to prevent Z-fighting
    const yOff = 0.035;

    // Positions (quad from lastLeft, lastRight to current leftPos, rightPos)
    positions[vOffset * 3 + 0] = lastLeft.x;
    positions[vOffset * 3 + 1] = lastLeft.y + yOff;
    positions[vOffset * 3 + 2] = lastLeft.z;

    positions[(vOffset + 1) * 3 + 0] = lastRight.x;
    positions[(vOffset + 1) * 3 + 1] = lastRight.y + yOff;
    positions[(vOffset + 1) * 3 + 2] = lastRight.z;

    positions[(vOffset + 2) * 3 + 0] = leftPos.x;
    positions[(vOffset + 2) * 3 + 1] = leftPos.y + yOff;
    positions[(vOffset + 2) * 3 + 2] = leftPos.z;

    positions[(vOffset + 3) * 3 + 0] = rightPos.x;
    positions[(vOffset + 3) * 3 + 1] = rightPos.y + yOff;
    positions[(vOffset + 3) * 3 + 2] = rightPos.z;

    // Alpha based on intensity
    const alpha = Math.min(0.8, intensity * 0.8);
    for (let i = 0; i < 4; i++) {
      colors[(vOffset + i) * 4 + 0] = 0.05;
      colors[(vOffset + i) * 4 + 1] = 0.05;
      colors[(vOffset + i) * 4 + 2] = 0.07;
      colors[(vOffset + i) * 4 + 3] = alpha;
    }

    // Indices
    indices[iOffset + 0] = vOffset;
    indices[iOffset + 1] = vOffset + 1;
    indices[iOffset + 2] = vOffset + 2;

    indices[iOffset + 3] = vOffset + 1;
    indices[iOffset + 4] = vOffset + 3;
    indices[iOffset + 5] = vOffset + 2;

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.index!.needsUpdate = true;

    writeHead = (writeHead + 1) % MAX_SKID_SEGMENTS;
    if (segmentCount < MAX_SKID_SEGMENTS) segmentCount++;

    lastLeft.copy(leftPos);
    lastRight.copy(rightPos);
  }

  function update(dt: number) {
    // Fade older skid marks slowly
    let needsUpdate = false;
    for (let s = 0; s < segmentCount; s++) {
      const vOffset = s * 4;
      const currentAlpha = colors[vOffset * 4 + 3];
      if (currentAlpha > 0) {
        const newAlpha = Math.max(0, currentAlpha - dt * 0.035);
        for (let i = 0; i < 4; i++) {
          colors[(vOffset + i) * 4 + 3] = newAlpha;
        }
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      geometry.attributes.color.needsUpdate = true;
    }
  }

  function clear() {
    writeHead = 0;
    segmentCount = 0;
    lastLeft = null;
    lastRight = null;
    for (let i = 0; i < maxVertices * 4; i++) colors[i] = 0;
    for (let i = 0; i < maxIndices; i++) indices[i] = 0;
    geometry.attributes.color.needsUpdate = true;
    geometry.index!.needsUpdate = true;
  }

  return {
    mesh,
    addSkid,
    update,
    clear,
  };
}
