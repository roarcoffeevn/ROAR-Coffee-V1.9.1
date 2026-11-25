import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ARENA_BACKDROPS,
  CUBE_SKINS,
  DIR_VECTORS,
  LIGHTING_MOODS,
  type ArenaBackdropId,
  type CubeBlock,
  type CubeDir,
  type CubeSkinId,
  type LightingMoodId,
} from '../../lib/cubeAwayData';
import { gameSound } from './RoarGamesSound';

export interface CubeAway3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusBlock: (blockId: string) => void;
}

export interface CubeAnimEvent {
  nonce: number;
  type: 'fly' | 'blocked' | 'smash' | 'shuffle';
  blockId?: string;
  block?: CubeBlock;
  blockingSteps?: number;
}

interface CubeAway3DCanvasProps {
  blocks: CubeBlock[];
  skinId: CubeSkinId;
  backdropId: ArenaBackdropId;
  moodId?: LightingMoodId;
  chillMode?: boolean;
  hintBlockId: string | null;
  hammerMode: boolean;
  autoRotate: boolean;
  animEvent: CubeAnimEvent | null;
  onTapBlock: (blockId: string) => void;
}

// Pre-allocated scratch math helpers (zero GC in animation loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _xAxis = new THREE.Vector3(1, 0, 0);
const _camRight = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _quatDelta = new THREE.Quaternion();
const _quatStep = new THREE.Quaternion();
const _identityQuat = new THREE.Quaternion();
const _pointerNdc = new THREE.Vector2();
const _moteDummy = new THREE.Object3D();
const _shardDummy = new THREE.Object3D();
const _galaxyColorTmp = new THREE.Color();
const _tangentA = new THREE.Vector3();
const _tangentB = new THREE.Vector3();
const _shockQuat = new THREE.Quaternion();
const _zAxis = new THREE.Vector3(0, 0, 1);

const GALAXY_ACCENT_HEX = ['#A855F7', '#38BDF8', '#FDE047', '#F472B6', '#C084FC'];

function createGalaxyStarTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.28, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.6, 'rgba(186,230,253,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle 4-point star flare
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(cx - 1.2, 6, 2.4, size - 12);
    ctx.fillRect(6, cx - 1.2, size - 12, 2.4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const rendererStr = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return true;
  }
}

function getDirQuaternion(dir: CubeDir): THREE.Quaternion {
  const [vx, vy, vz] = DIR_VECTORS[dir];
  const target = new THREE.Vector3(vx, vy, vz);
  const q = new THREE.Quaternion();
  if (vy === -1 && vx === 0 && vz === 0) {
    q.setFromAxisAngle(_xAxis, Math.PI);
  } else {
    q.setFromUnitVectors(_upVec, target);
  }
  return q;
}

function createRoundedCubeGeometry(size = 0.84, radius = 0.11): THREE.BufferGeometry {
  const half = size / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -half - radius);
  shape.lineTo(half, -half - radius);
  shape.quadraticCurveTo(half + radius, -half - radius, half + radius, -half);
  shape.lineTo(half + radius, half);
  shape.quadraticCurveTo(half + radius, half + radius, half, half + radius);
  shape.lineTo(-half, half + radius);
  shape.quadraticCurveTo(-half - radius, half + radius, -half - radius, half);
  shape.lineTo(-half - radius, -half);
  shape.quadraticCurveTo(-half - radius, -half - radius, -half, -half - radius);

  const extrudeDepth = size - radius * 2;
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius,
    bevelSegments: 3,
    curveSegments: 4,
  });
  geom.center();
  return geom;
}

function createChevronArrowGeometry(): THREE.BufferGeometry {
  // Bold upward-pointing chevron + stem in XY plane (centered around 0,0)
  const s = new THREE.Shape();
  s.moveTo(0, 0.22);
  s.lineTo(0.19, 0.01);
  s.lineTo(0.08, 0.01);
  s.lineTo(0.08, -0.2);
  s.lineTo(-0.08, -0.2);
  s.lineTo(-0.08, 0.01);
  s.lineTo(-0.19, 0.01);
  s.closePath();

  const geom = new THREE.ExtrudeGeometry(s, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geom.center();
  return geom;
}

function createExitCapGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.14, 0, Math.PI * 2, false);
  const geom = new THREE.ExtrudeGeometry(s, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geom.center();
  return geom;
}

interface FlyingItem {
  group: THREE.Group;
  dirVec: THREE.Vector3;
  age: number;
  maxAge: number;
  speed: number;
  hex: string;
  shattered: boolean;
  trailTick: number;
}

interface GalaxyShardSlot {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
  age: number;
  maxAge: number;
  baseScale: number;
}

interface GalaxyStarSlot {
  active: boolean;
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  swirlX: number;
  swirlY: number;
  swirlZ: number;
  r: number;
  g: number;
  b: number;
  age: number;
  maxAge: number;
}

interface ShockwaveSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  maxAge: number;
}

interface BounceAnim {
  blockId: string;
  dirVec: THREE.Vector3;
  age: number;
  duration: number;
}

export const CubeAway3DCanvas = forwardRef<CubeAway3DHandle, CubeAway3DCanvasProps>(
  ({ blocks, skinId, backdropId, moodId = 'default', chillMode = false, hintBlockId, hammerMode, autoRotate, animEvent, onTapBlock }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    // Keep latest props in refs so WebGL mount survives React updates
    const onTapBlockRef = useRef(onTapBlock);
    onTapBlockRef.current = onTapBlock;
    const hintBlockIdRef = useRef(hintBlockId);
    hintBlockIdRef.current = hintBlockId;
    const hammerModeRef = useRef(hammerMode);
    hammerModeRef.current = hammerMode;
    const autoRotateRef = useRef(autoRotate);
    autoRotateRef.current = autoRotate;
    const chillModeRef = useRef(chillMode);
    chillModeRef.current = chillMode;

    const sceneCtrlRef = useRef<{
      syncBlocks: (nextBlocks: CubeBlock[], skin: CubeSkinId) => void;
      applyTheme: (skin: CubeSkinId, backdrop: ArenaBackdropId, mood: LightingMoodId) => void;
      triggerEvent: (evt: CubeAnimEvent, skin: CubeSkinId) => void;
      zoomBy: (factor: number) => void;
      resetView: () => void;
      focusBlock: (blockId: string) => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      zoomIn: () => sceneCtrlRef.current?.zoomBy(0.84),
      zoomOut: () => sceneCtrlRef.current?.zoomBy(1.18),
      resetView: () => sceneCtrlRef.current?.resetView(),
      focusBlock: (id: string) => sceneCtrlRef.current?.focusBlock(id),
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const width = Math.max(260, container.clientWidth || 360);
      const height = Math.max(260, container.clientHeight || 360);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.touchAction = 'none';

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      const scene = new THREE.Scene();
      const initialBackdrop = ARENA_BACKDROPS.find((b) => b.id === backdropId) || ARENA_BACKDROPS[0];
      scene.background = new THREE.Color(initialBackdrop.bgHex);
      scene.fog = new THREE.FogExp2(initialBackdrop.fogHex, 0.035);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(4.8, 3.8, 6.2);
      camera.lookAt(0, 0.05, 0);
      const initialCameraDistance = camera.position.length();
      let cameraDistance = initialCameraDistance;
      let targetCameraDistance = initialCameraDistance;
      const MIN_DIST = 4.2;
      const MAX_DIST = 16.5;
      const baseCameraDir = camera.position.clone().normalize();

      // 3-Point Studio Lighting Rig
      const hemiLight = new THREE.HemisphereLight(initialBackdrop.fillLightHex, '#090D16', 0.85);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(initialBackdrop.keyLightHex, 2.2);
      keyLight.position.set(6, 9, 6);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 26;
      keyLight.shadow.camera.left = -5;
      keyLight.shadow.camera.right = 5;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(initialBackdrop.rimLightHex, 1.35);
      rimLight.position.set(-6, 4, -6);
      scene.add(rimLight);

      // Pure floating 3D Rubik/Cube cluster — no pedestal base per user request

      // Shared geometries for zero-leak memory efficiency
      const cubeBodyGeo = createRoundedCubeGeometry(0.84, 0.1);
      const arrowGeo = createChevronArrowGeometry();
      const capGeo = createExitCapGeometry();
      const collarGeo = new THREE.BoxGeometry(0.87, 0.09, 0.87);
      const hintRingGeo = new THREE.TorusGeometry(0.62, 0.045, 12, 32);

      const puzzlePivot = new THREE.Group();
      puzzlePivot.position.set(0, 0.15, 0);
      scene.add(puzzlePivot);

      // Floating ambient golden/coffee dust motes (InstancedMesh)
      const MOTE_COUNT = 42;
      const moteGeo = new THREE.OctahedronGeometry(0.042, 0);
      const moteMat = new THREE.MeshBasicMaterial({
        color: initialBackdrop.ringHex,
        transparent: true,
        opacity: 0.42,
      });
      const moteMesh = new THREE.InstancedMesh(moteGeo, moteMat, MOTE_COUNT);
      moteMesh.frustumCulled = false;
      const moteSeeds = Array.from({ length: MOTE_COUNT }, (_, idx) => ({
        angle: (idx / MOTE_COUNT) * Math.PI * 2 + (idx % 3) * 0.4,
        radius: 2.6 + (idx % 7) * 0.55,
        baseY: -2.4 + (idx % 11) * 0.52,
        speed: 0.12 + (idx % 5) * 0.045,
        phase: idx * 0.73,
        scale: 0.65 + (idx % 4) * 0.25,
      }));
      moteSeeds.forEach((m, idx) => {
        _moteDummy.position.set(Math.cos(m.angle) * m.radius, m.baseY, Math.sin(m.angle) * m.radius);
        _moteDummy.scale.setScalar(m.scale);
        _moteDummy.updateMatrix();
        moteMesh.setMatrixAt(idx, _moteDummy.matrix);
      });
      moteMesh.instanceMatrix.needsUpdate = true;
      moteMesh.computeBoundingSphere();
      scene.add(moteMesh);

      const hintHaloMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.9,
      });
      const hintHalo = new THREE.Mesh(hintRingGeo, hintHaloMat);
      hintHalo.visible = false;
      puzzlePivot.add(hintHalo);

      const clusterGroup = new THREE.Group();
      puzzlePivot.add(clusterGroup);

      const fxGroup = new THREE.Group();
      puzzlePivot.add(fxGroup);

      // Galaxy Shatter FX Pools (1 draw call for shards + 1 draw call for starlight dust + pooled rings)
      const MAX_GALAXY_SHARDS = 192;
      const galaxyShardGeo = new THREE.OctahedronGeometry(0.115, 0);
      const galaxyShardMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.2,
        metalness: 0.65,
        emissive: '#312E81',
        emissiveIntensity: 0.35,
      });
      const galaxyShardMesh = new THREE.InstancedMesh(galaxyShardGeo, galaxyShardMat, MAX_GALAXY_SHARDS);
      galaxyShardMesh.frustumCulled = false;
      galaxyShardMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(MAX_GALAXY_SHARDS * 3),
        3
      );
      const galaxyShards: GalaxyShardSlot[] = Array.from({ length: MAX_GALAXY_SHARDS }, (_, i) => {
        _shardDummy.position.set(0, 0, 0);
        _shardDummy.scale.setScalar(0);
        _shardDummy.updateMatrix();
        galaxyShardMesh.setMatrixAt(i, _shardDummy.matrix);
        galaxyShardMesh.setColorAt(i, _galaxyColorTmp.setHex(0xffffff));
        return {
          active: false,
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          rot: new THREE.Euler(),
          rotVel: new THREE.Vector3(),
          age: 0,
          maxAge: 0.8,
          baseScale: 1,
        };
      });
      galaxyShardMesh.instanceMatrix.needsUpdate = true;
      galaxyShardMesh.instanceColor.needsUpdate = true;
      galaxyShardMesh.computeBoundingSphere();
      fxGroup.add(galaxyShardMesh);
      let shardCursor = 0;

      const MAX_GALAXY_STARS = 540;
      const galaxyStarPos = new Float32Array(MAX_GALAXY_STARS * 3);
      const galaxyStarCol = new Float32Array(MAX_GALAXY_STARS * 3);
      for (let i = 0; i < MAX_GALAXY_STARS; i++) {
        galaxyStarPos[i * 3 + 1] = 9999; // hide inactive offscreen
      }
      const galaxyStarGeo = new THREE.BufferGeometry();
      const galaxyStarPosAttr = new THREE.BufferAttribute(galaxyStarPos, 3);
      const galaxyStarColAttr = new THREE.BufferAttribute(galaxyStarCol, 3);
      galaxyStarGeo.setAttribute('position', galaxyStarPosAttr);
      galaxyStarGeo.setAttribute('color', galaxyStarColAttr);
      const galaxyStarTex = createGalaxyStarTexture();
      const galaxyStarMat = new THREE.PointsMaterial({
        size: 0.34,
        map: galaxyStarTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const galaxyStarsPoints = new THREE.Points(galaxyStarGeo, galaxyStarMat);
      galaxyStarsPoints.frustumCulled = false;
      fxGroup.add(galaxyStarsPoints);

      const galaxyStars: GalaxyStarSlot[] = Array.from({ length: MAX_GALAXY_STARS }, () => ({
        active: false,
        px: 0,
        py: 9999,
        pz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        swirlX: 0,
        swirlY: 0,
        swirlZ: 0,
        r: 1,
        g: 1,
        b: 1,
        age: 0,
        maxAge: 0.9,
      }));
      let starCursor = 0;

      const shockRingGeo = new THREE.TorusGeometry(0.45, 0.032, 10, 36);
      const shockwaves: ShockwaveSlot[] = Array.from({ length: 8 }, () => {
        const mat = new THREE.MeshBasicMaterial({
          color: '#A855F7',
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(shockRingGeo, mat);
        mesh.visible = false;
        fxGroup.add(mesh);
        return { mesh, mat, active: false, age: 0, maxAge: 0.55 };
      });
      let shockCursor = 0;

      // Material pools by skin + colorIndex
      let activeMaterials: THREE.Material[] = [];
      let bodyMaterials: THREE.MeshPhysicalMaterial[] = [];
      let arrowMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, metalness: 0.35 });
      let collarMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65, metalness: 0.6 });

      const buildSkinMaterials = (sId: CubeSkinId) => {
        activeMaterials.forEach((m) => m.dispose());
        activeMaterials = [];
        const skin = CUBE_SKINS.find((s) => s.id === sId) || CUBE_SKINS[0];

        arrowMat = new THREE.MeshStandardMaterial({
          color: skin.arrowColor,
          emissive: skin.id === 'cyber_neon' ? '#38BDF8' : skin.arrowColor,
          emissiveIntensity: skin.id === 'cyber_neon' ? 0.38 : 0.12,
          roughness: 0.2,
          metalness: 0.3,
        });
        collarMat = new THREE.MeshStandardMaterial({
          color: skin.rimColor,
          roughness: Math.min(0.92, skin.roughness + 0.35),
          metalness: skin.id === 'roar_gold' ? 0.78 : 0.45,
        });
        activeMaterials.push(arrowMat, collarMat);

        bodyMaterials = skin.palette.map((hex) => {
          const mat = new THREE.MeshPhysicalMaterial({
            color: hex,
            metalness: skin.metalness,
            roughness: skin.roughness,
            clearcoat: skin.clearcoat,
            clearcoatRoughness: 0.16,
            transparent: Boolean(skin.translucent),
            opacity: skin.translucent ? 0.86 : 1,
          });
          activeMaterials.push(mat);
          return mat;
        });
      };

      const blockMeshMap = new Map<
        string,
        {
          root: THREE.Group;
          visual: THREE.Group;
          body: THREE.Mesh;
          basePos: THREE.Vector3;
          block: CubeBlock;
        }
      >();
      const clickableMeshes: THREE.Mesh[] = [];
      const flyingItems: FlyingItem[] = [];
      let activeBounce: BounceAnim | null = null;
      let clusterCenter = new THREE.Vector3(0, 0, 0);
      let hoveredBlockId: string | null = null;
      let currentSkinId: CubeSkinId = skinId;
      let targetPivotQuat: THREE.Quaternion | null = null;

      const createCompositeCube = (b: CubeBlock): THREE.Group => {
        const root = new THREE.Group();
        const visual = new THREE.Group();
        visual.quaternion.copy(getDirQuaternion(b.dir));

        // Part 1: Beveled Core Body (cloned material per block so hover/blocked emissive flash is independent)
        const baseMat = bodyMaterials[b.colorIndex % bodyMaterials.length];
        const bodyMat = baseMat.clone();
        const bodyMesh = new THREE.Mesh(cubeBodyGeo, bodyMat);
        bodyMesh.castShadow = !isSoftwareGl;
        bodyMesh.receiveShadow = !isSoftwareGl;
        bodyMesh.userData.blockId = b.id;
        visual.add(bodyMesh);

        // Part 2: Accent Trim Collar near exit nose
        const collarMesh = new THREE.Mesh(collarGeo, collarMat);
        collarMesh.position.set(0, 0.25, 0);
        collarMesh.userData.blockId = b.id;
        visual.add(collarMesh);

        // Part 3: 4 Lateral Directional Chevrons + Top Exit Cap
        const faceOffsets: Array<{ pos: [number, number, number]; rotY: number }> = [
          { pos: [0, 0, 0.43], rotY: 0 },
          { pos: [0, 0, -0.43], rotY: Math.PI },
          { pos: [0.43, 0, 0], rotY: Math.PI / 2 },
          { pos: [-0.43, 0, 0], rotY: -Math.PI / 2 },
        ];
        for (const fo of faceOffsets) {
          const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
          arrowMesh.position.set(fo.pos[0], fo.pos[1], fo.pos[2]);
          arrowMesh.rotation.y = fo.rotY;
          arrowMesh.userData.blockId = b.id;
          visual.add(arrowMesh);
        }

        const exitCap = new THREE.Mesh(capGeo, arrowMat);
        exitCap.rotation.x = Math.PI / 2;
        exitCap.position.set(0, 0.43, 0);
        exitCap.userData.blockId = b.id;
        visual.add(exitCap);

        root.add(visual);
        return root;
      };

      const spawnLaunchTrail = (worldPos: THREE.Vector3, hex: string, count = 4) => {
        for (let i = 0; i < count; i++) {
          const slot = galaxyStars[starCursor];
          starCursor = (starCursor + 1) % MAX_GALAXY_STARS;
          slot.active = true;
          slot.px = worldPos.x + (Math.random() - 0.5) * 0.42;
          slot.py = worldPos.y + (Math.random() - 0.5) * 0.42;
          slot.pz = worldPos.z + (Math.random() - 0.5) * 0.42;
          slot.vx = (Math.random() - 0.5) * 1.4;
          slot.vy = (Math.random() - 0.5) * 1.4;
          slot.vz = (Math.random() - 0.5) * 1.4;
          slot.swirlX = 0;
          slot.swirlY = 0;
          slot.swirlZ = 0;
          _galaxyColorTmp.set(i % 2 === 0 ? hex : '#FDE047');
          slot.r = _galaxyColorTmp.r;
          slot.g = _galaxyColorTmp.g;
          slot.b = _galaxyColorTmp.b;
          slot.age = 0;
          slot.maxAge = 0.42 + Math.random() * 0.2;
        }
      };

      const spawnGalaxyShatter = (
        worldPos: THREE.Vector3,
        hex: string,
        dirVec?: THREE.Vector3,
        shardCount = 16,
        starCount = 38
      ) => {
        // Compute perpendicular orbital plane for galaxy spiral swirl
        const axis = dirVec && dirVec.lengthSq() > 0.01 ? _vec3B.copy(dirVec).normalize() : _vec3B.set(0, 1, 0);
        if (Math.abs(axis.y) < 0.9) {
          _tangentA.crossVectors(axis, _upVec).normalize();
        } else {
          _tangentA.crossVectors(axis, _xAxis).normalize();
        }
        _tangentB.crossVectors(axis, _tangentA).normalize();

        // 1. Expanding nebula shockwave ring
        const sw = shockwaves[shockCursor];
        shockCursor = (shockCursor + 1) % shockwaves.length;
        sw.active = true;
        sw.age = 0;
        sw.maxAge = 0.58;
        sw.mesh.position.copy(worldPos);
        _shockQuat.setFromUnitVectors(_zAxis, axis);
        sw.mesh.quaternion.copy(_shockQuat);
        sw.mesh.scale.setScalar(0.35);
        sw.mat.color.set(Math.random() > 0.35 ? '#A855F7' : hex);
        sw.mat.opacity = 0.92;
        sw.mesh.visible = true;

        // 2. Faceted cosmic crystal shards bursting in 3D + slight spiral twist
        for (let i = 0; i < shardCount; i++) {
          const idx = shardCursor;
          shardCursor = (shardCursor + 1) % MAX_GALAXY_SHARDS;
          const s = galaxyShards[idx];
          s.active = true;
          s.age = 0;
          s.maxAge = 0.72 + Math.random() * 0.38;
          s.baseScale = 0.6 + Math.random() * 0.75;
          s.pos.set(
            worldPos.x + (Math.random() - 0.5) * 0.38,
            worldPos.y + (Math.random() - 0.5) * 0.38,
            worldPos.z + (Math.random() - 0.5) * 0.38
          );
          const ang = (i / shardCount) * Math.PI * 2 + Math.random() * 0.5;
          const radialSpd = 2.6 + Math.random() * 3.8;
          const forwardSpd = dirVec ? 1.5 + Math.random() * 2.5 : (Math.random() - 0.5) * 4;
          s.vel
            .set(0, 0, 0)
            .addScaledVector(_tangentA, Math.cos(ang) * radialSpd)
            .addScaledVector(_tangentB, Math.sin(ang) * radialSpd)
            .addScaledVector(axis, forwardSpd);
          s.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          s.rotVel.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);

          const tintHex = i % 3 === 0 ? hex : GALAXY_ACCENT_HEX[i % GALAXY_ACCENT_HEX.length];
          _galaxyColorTmp.set(tintHex);
          galaxyShardMesh.setColorAt(idx, _galaxyColorTmp);
        }
        if (galaxyShardMesh.instanceColor) {
          galaxyShardMesh.instanceColor.needsUpdate = true;
        }

        // 3. Swirling galaxy nebula stardust cloud
        for (let i = 0; i < starCount; i++) {
          const slot = galaxyStars[starCursor];
          starCursor = (starCursor + 1) % MAX_GALAXY_STARS;
          slot.active = true;
          slot.age = 0;
          slot.maxAge = 0.65 + Math.random() * 0.55;
          slot.px = worldPos.x + (Math.random() - 0.5) * 0.45;
          slot.py = worldPos.y + (Math.random() - 0.5) * 0.45;
          slot.pz = worldPos.z + (Math.random() - 0.5) * 0.45;

          const ang = (i / starCount) * Math.PI * 4 + Math.random() * 0.6;
          const radialSpd = 1.6 + Math.random() * 4.4;
          const swirlSpd = 2.2 + Math.random() * 2.8;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);

          slot.vx =
            _tangentA.x * cosA * radialSpd +
            _tangentB.x * sinA * radialSpd +
            axis.x * (Math.random() - 0.15) * 2.4;
          slot.vy =
            _tangentA.y * cosA * radialSpd +
            _tangentB.y * sinA * radialSpd +
            axis.y * (Math.random() - 0.15) * 2.4;
          slot.vz =
            _tangentA.z * cosA * radialSpd +
            _tangentB.z * sinA * radialSpd +
            axis.z * (Math.random() - 0.15) * 2.4;

          slot.swirlX = (-_tangentA.x * sinA + _tangentB.x * cosA) * swirlSpd;
          slot.swirlY = (-_tangentA.y * sinA + _tangentB.y * cosA) * swirlSpd;
          slot.swirlZ = (-_tangentA.z * sinA + _tangentB.z * cosA) * swirlSpd;

          const starHex = i % 4 === 0 ? hex : GALAXY_ACCENT_HEX[i % GALAXY_ACCENT_HEX.length];
          _galaxyColorTmp.set(starHex);
          slot.r = _galaxyColorTmp.r;
          slot.g = _galaxyColorTmp.g;
          slot.b = _galaxyColorTmp.b;
        }
      };

      const syncBlocksToScene = (nextBlocks: CubeBlock[], sId: CubeSkinId) => {
        if (currentSkinId !== sId || bodyMaterials.length === 0) {
          currentSkinId = sId;
          buildSkinMaterials(sId);
        }

        // Compute bounding center of cluster
        if (nextBlocks.length > 0) {
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          let minZ = Infinity, maxZ = -Infinity;
          for (const b of nextBlocks) {
            minX = Math.min(minX, b.x);
            maxX = Math.max(maxX, b.x);
            minY = Math.min(minY, b.y);
            maxY = Math.max(maxY, b.y);
            minZ = Math.min(minZ, b.z);
            maxZ = Math.max(maxZ, b.z);
          }
          clusterCenter.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        }

        const nextMap = new Map(nextBlocks.map((b) => [b.id, b]));
        for (const [id, entry] of blockMeshMap.entries()) {
          if (!nextMap.has(id)) {
            clusterGroup.remove(entry.root);
            (entry.body.material as THREE.Material).dispose();
            blockMeshMap.delete(id);
          }
        }

        clickableMeshes.length = 0;

        for (const b of nextBlocks) {
          const targetPos = new THREE.Vector3(
            b.x - clusterCenter.x,
            b.y - clusterCenter.y,
            b.z - clusterCenter.z
          );
          const existing = blockMeshMap.get(b.id);
          if (existing) {
            existing.basePos.copy(targetPos);
            existing.root.position.copy(targetPos);
            if (existing.block.dir !== b.dir) {
              existing.visual.quaternion.copy(getDirQuaternion(b.dir));
            }
            existing.block = b;
            clickableMeshes.push(existing.body);
          } else {
            const root = createCompositeCube(b);
            root.position.copy(targetPos);
            const visual = root.children[0] as THREE.Group;
            const body = visual.children[0] as THREE.Mesh;
            clusterGroup.add(root);
            blockMeshMap.set(b.id, {
              root,
              visual,
              body,
              basePos: targetPos,
              block: b,
            });
            clickableMeshes.push(body);
          }
        }
      };

      const applyThemeToScene = (sId: CubeSkinId, bId: ArenaBackdropId, mId: LightingMoodId = 'default') => {
        const bd = ARENA_BACKDROPS.find((x) => x.id === bId) || ARENA_BACKDROPS[0];
        const mood = LIGHTING_MOODS.find((m) => m.id === mId) || LIGHTING_MOODS[0];

        const bgHex = mood.bgHex || bd.bgHex;
        const ringHex = mood.ringHex || bd.ringHex;
        const keyHex = mood.keyLightHex || bd.keyLightHex;
        const fillHex = mood.fillLightHex || bd.fillLightHex;
        const rimHex = mood.rimLightHex || bd.rimLightHex;

        scene.background = new THREE.Color(bgHex);
        scene.fog = new THREE.FogExp2(bgHex, 0.035);
        moteMat.color.set(ringHex);
        keyLight.color.set(keyHex);
        hemiLight.color.set(fillHex);
        rimLight.color.set(rimHex);

        if (currentSkinId !== sId) {
          currentSkinId = sId;
          buildSkinMaterials(sId);
          for (const [, entry] of blockMeshMap.entries()) {
            const newMat = bodyMaterials[entry.block.colorIndex % bodyMaterials.length].clone();
            (entry.body.material as THREE.Material).dispose();
            entry.body.material = newMat;
          }
        }
      };

      buildSkinMaterials(skinId);
      applyThemeToScene(skinId, backdropId, moodId);
      syncBlocksToScene(blocks, skinId);

      sceneCtrlRef.current = {
        syncBlocks: (nextBlocks, sId) => {
          syncBlocksToScene(nextBlocks, sId);
        },
        applyTheme: (sId, bId, mId) => {
          applyThemeToScene(sId, bId, mId);
        },
        triggerEvent: (evt, sId) => {
          const skin = CUBE_SKINS.find((s) => s.id === sId) || CUBE_SKINS[0];
          const isChill = chillModeRef.current;
          if (evt.type === 'fly' && evt.block) {
            const b = evt.block;
            const hex = skin.palette[b.colorIndex % skin.palette.length];
            const ghost = createCompositeCube(b);
            ghost.position.set(b.x - clusterCenter.x, b.y - clusterCenter.y, b.z - clusterCenter.z);
            fxGroup.add(ghost);
            const [vx, vy, vz] = DIR_VECTORS[b.dir];
            flyingItems.push({
              group: ghost,
              dirVec: new THREE.Vector3(vx, vy, vz),
              age: 0,
              maxAge: isChill ? 0.68 : 0.48,
              speed: isChill ? 7.2 : 11.5,
              hex,
              shattered: false,
              trailTick: 0,
            });
            spawnLaunchTrail(ghost.position, hex, isChill ? 4 : 6);
          } else if (evt.type === 'smash' && evt.block) {
            const b = evt.block;
            const hex = skin.palette[b.colorIndex % skin.palette.length];
            _vec3A.set(b.x - clusterCenter.x, b.y - clusterCenter.y, b.z - clusterCenter.z);
            spawnGalaxyShatter(_vec3A, hex, undefined, 22, 46);
          } else if (evt.type === 'blocked' && evt.blockId) {
            const entry = blockMeshMap.get(evt.blockId);
            if (entry) {
              const [vx, vy, vz] = DIR_VECTORS[entry.block.dir];
              activeBounce = {
                blockId: evt.blockId,
                dirVec: new THREE.Vector3(vx, vy, vz),
                age: 0,
                duration: 0.28,
              };
            }
          }
        },
        zoomBy: (factor) => {
          targetCameraDistance = THREE.MathUtils.clamp(targetCameraDistance * factor, MIN_DIST, MAX_DIST);
        },
        resetView: () => {
          targetPivotQuat = _identityQuat.clone();
          targetCameraDistance = initialCameraDistance;
        },
        focusBlock: (id: string) => {
          const entry = blockMeshMap.get(id);
          if (!entry) return;
          const [vx, vy, vz] = DIR_VECTORS[entry.block.dir];
          const localDir = new THREE.Vector3(
            entry.basePos.x + vx * 0.65,
            entry.basePos.y + vy * 0.65,
            entry.basePos.z + vz * 0.65
          );
          if (localDir.lengthSq() < 0.01) {
            localDir.set(vx, vy, vz);
          }
          localDir.normalize();
          targetPivotQuat = new THREE.Quaternion().setFromUnitVectors(localDir, baseCameraDir);
        },
      };

      // Unrestricted 360-degree screen-space quaternion rotation + pinch zoom + raycast tap
      const raycaster = new THREE.Raycaster();
      const activePointers = new Map<number, { x: number; y: number }>();
      let primaryPointerId: number | null = null;
      let downX = 0;
      let downY = 0;
      let lastX = 0;
      let lastY = 0;
      let velYaw = 0;
      let velPitch = 0;
      let lastMoveTime = 0;
      let lastPinchDist = 0;
      let hadMultiTouch = false;
      let lastHoverCheck = 0;

      const updatePointerNdc = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const applyScreenRotation = (dx: number, dy: number) => {
        if (dx === 0 && dy === 0) return;
        const speed = 0.0085;
        camera.updateMatrixWorld();
        _camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
        _camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

        _quatDelta.setFromAxisAngle(_camUp, dx * speed);
        _quatStep.setFromAxisAngle(_camRight, dy * speed);
        _quatDelta.multiply(_quatStep);

        puzzlePivot.quaternion.premultiply(_quatDelta).normalize();
      };

      const onPointerDown = (e: PointerEvent) => {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointers.size === 1) {
          primaryPointerId = e.pointerId;
          downX = e.clientX;
          downY = e.clientY;
          lastX = e.clientX;
          lastY = e.clientY;
          velYaw = 0;
          velPitch = 0;
          lastMoveTime = performance.now();
          hadMultiTouch = false;
          targetPivotQuat = null;
          renderer.domElement.style.cursor = 'grabbing';
        } else if (activePointers.size === 2) {
          hadMultiTouch = true;
          const pts = Array.from(activePointers.values());
          lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (activePointers.has(e.pointerId)) {
          activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

          if (activePointers.size >= 2) {
            const pts = Array.from(activePointers.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (lastPinchDist > 0 && dist > 0) {
              const scale = lastPinchDist / dist;
              targetCameraDistance = THREE.MathUtils.clamp(targetCameraDistance * scale, MIN_DIST, MAX_DIST);
            }
            lastPinchDist = dist;
            return;
          }

          if (e.pointerId === primaryPointerId) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            applyScreenRotation(dx, dy);
            velYaw = dx * 0.42;
            velPitch = dy * 0.42;
            lastMoveTime = performance.now();
            return;
          }
        }

        if (activePointers.size === 0 && !isSoftwareGl) {
          const now = performance.now();
          if (now - lastHoverCheck < 45) return;
          lastHoverCheck = now;
          updatePointerNdc(e.clientX, e.clientY);
          raycaster.setFromCamera(_pointerNdc, camera);
          const hits = raycaster.intersectObjects(clickableMeshes, false);
          const hitId = hits.length > 0 ? String(hits[0].object.userData.blockId || '') : null;
          if (hitId && hitId !== hoveredBlockId) {
            gameSound.cubeHover();
          }
          hoveredBlockId = hitId || null;
          renderer.domElement.style.cursor = hoveredBlockId ? (hammerModeRef.current ? 'crosshair' : 'pointer') : 'grab';
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.delete(e.pointerId);

        if (e.pointerId === primaryPointerId && !hadMultiTouch) {
          const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
          if (dist <= 7) {
            velYaw = 0;
            velPitch = 0;
            updatePointerNdc(e.clientX, e.clientY);
            raycaster.setFromCamera(_pointerNdc, camera);
            const hits = raycaster.intersectObjects(clickableMeshes, false);
            if (hits.length > 0) {
              const blockId = String(hits[0].object.userData.blockId || '');
              if (blockId) {
                onTapBlockRef.current(blockId);
              }
            }
          } else if (performance.now() - lastMoveTime > 90) {
            velYaw = 0;
            velPitch = 0;
          }
        }

        if (activePointers.size === 0) {
          primaryPointerId = null;
          lastPinchDist = 0;
          renderer.domElement.style.cursor = 'grab';
        }
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.09 : 0.91;
        targetCameraDistance = THREE.MathUtils.clamp(targetCameraDistance * factor, MIN_DIST, MAX_DIST);
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

      // Resize observer for crisp container responsiveness
      const resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        const w = Math.max(240, container.clientWidth);
        const h = Math.max(240, container.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Animation loop with software WebGL pacing
      const clock = new THREE.Clock();
      let frameId = 0;
      let disposed = false;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      function tick() {
        if (disposed) return;
        const dt = Math.min(0.05, clock.getDelta());
        const elapsed = clock.elapsedTime;

        // Smooth camera zoom damping
        cameraDistance = THREE.MathUtils.damp(cameraDistance, targetCameraDistance, 10, dt);
        _camDir.copy(baseCameraDir).multiplyScalar(cameraDistance);
        camera.position.copy(_camDir);
        camera.lookAt(0, 0.05, 0);

        // Gentle studio breathing float
        const isChillNow = chillModeRef.current;
        puzzlePivot.position.y = 0.1 + Math.sin(elapsed * 1.4) * (isChillNow ? 0.095 : 0.045);

        // Ambient floating particles update
        if (!isSoftwareGl) {
          for (let i = 0; i < MOTE_COUNT; i++) {
            const m = moteSeeds[i];
            const driftY = ((m.baseY + elapsed * m.speed + 2.6) % 5.4) - 2.6;
            const orbitAng = m.angle + elapsed * (isChillNow ? 0.07 : 0.11);
            _moteDummy.position.set(
              Math.cos(orbitAng) * m.radius,
              driftY + Math.sin(elapsed * 1.3 + m.phase) * 0.12,
              Math.sin(orbitAng) * m.radius
            );
            _moteDummy.rotation.set(elapsed * 0.6 + m.phase, elapsed * 0.8, 0);
            _moteDummy.scale.setScalar(m.scale * (0.85 + Math.sin(elapsed * 2 + m.phase) * 0.2));
            _moteDummy.updateMatrix();
            moteMesh.setMatrixAt(i, _moteDummy.matrix);
          }
          moteMesh.instanceMatrix.needsUpdate = true;
        }

        // Unrestricted 360-degree inertial spin / focus slerp / auto-rotate
        if (targetPivotQuat) {
          const slerpT = 1 - Math.exp(-8 * dt);
          puzzlePivot.quaternion.slerp(targetPivotQuat, slerpT);
          if (puzzlePivot.quaternion.angleTo(targetPivotQuat) < 0.015) {
            puzzlePivot.quaternion.copy(targetPivotQuat);
            targetPivotQuat = null;
          }
        } else if (activePointers.size === 0) {
          if (Math.abs(velYaw) > 0.02 || Math.abs(velPitch) > 0.02) {
            applyScreenRotation(velYaw, velPitch);
            const damp = Math.exp(-7.5 * dt);
            velYaw *= damp;
            velPitch *= damp;
          } else if (!isSoftwareGl && autoRotateRef.current) {
            _quatDelta.setFromAxisAngle(_upVec, (isChillNow ? 0.28 : 0.48) * dt);
            puzzlePivot.quaternion.premultiply(_quatDelta).normalize();
          }
        }

        // Subtle hover pop & Hint spotlight
        const hId = hintBlockIdRef.current;
        let hintedEntry: typeof blockMeshMap extends Map<string, infer V> ? V | undefined : undefined;

        for (const [id, entry] of blockMeshMap.entries()) {
          const isHovered = id === hoveredBlockId;
          const targetScale = isHovered ? 1.09 : 1;
          const nextScale = THREE.MathUtils.damp(entry.root.scale.x, targetScale, 16, dt);
          entry.root.scale.setScalar(nextScale);

          // Tactile hover wiggle/shake animation (rung lắc khi rê chuột)
          if (isHovered) {
            entry.root.rotation.z = Math.sin(elapsed * 34) * 0.075;
            entry.root.rotation.x = Math.cos(elapsed * 29) * 0.055;
          } else {
            entry.root.rotation.z = THREE.MathUtils.damp(entry.root.rotation.z, 0, 18, dt);
            entry.root.rotation.x = THREE.MathUtils.damp(entry.root.rotation.x, 0, 18, dt);
          }

          const mat = entry.body.material as THREE.MeshPhysicalMaterial;
          if (id === hId) {
            hintedEntry = entry;
            mat.emissive.setHex(0xfacc15);
            mat.emissiveIntensity = 0.25 + Math.sin(elapsed * 7) * 0.15;
          } else if (activeBounce && activeBounce.blockId === id) {
            mat.emissive.setHex(0xef4444);
            mat.emissiveIntensity = 0.55;
          } else {
            mat.emissive.setHex(isHovered ? 0xfde68a : 0x000000);
            mat.emissiveIntensity = isHovered ? 0.22 : 0;
          }
        }

        if (hintedEntry) {
          hintHalo.visible = true;
          hintHalo.position.copy(hintedEntry.root.position);
          hintHalo.lookAt(
            puzzlePivot.worldToLocal(_vec3A.copy(camera.position))
          );
          hintHalo.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.08);
        } else {
          hintHalo.visible = false;
        }

        // Blocked bounce animation
        if (activeBounce) {
          activeBounce.age += dt;
          const entry = blockMeshMap.get(activeBounce.blockId);
          const p = Math.min(1, activeBounce.age / activeBounce.duration);
          if (entry) {
            const offsetAmt = Math.sin(p * Math.PI) * 0.34;
            _vec3B.copy(activeBounce.dirVec).multiplyScalar(offsetAmt);
            entry.root.position.copy(entry.basePos).add(_vec3B);
          }
          if (p >= 1) {
            if (entry) entry.root.position.copy(entry.basePos);
            activeBounce = null;
          }
        }

        // Flying cleared cubes -> launch trail then mid-flight Galaxy Shatter detonation
        for (let i = flyingItems.length - 1; i >= 0; i--) {
          const f = flyingItems[i];
          f.age += dt;
          f.speed += 34 * dt;
          _vec3A.copy(f.dirVec).multiplyScalar(f.speed * dt);
          f.group.position.add(_vec3A);
          f.group.rotation.x += dt * 2.8;
          f.group.rotation.y += dt * 3.4;
          f.trailTick += dt;
          if (!f.shattered && f.trailTick >= 0.045) {
            f.trailTick = 0;
            spawnLaunchTrail(f.group.position, f.hex, 2);
          }

          if (!f.shattered && f.age >= f.maxAge * 0.42) {
            f.shattered = true;
            spawnGalaxyShatter(
              f.group.position,
              f.hex,
              f.dirVec,
              isChillNow ? 12 : 16,
              isChillNow ? 30 : 42
            );
            fxGroup.remove(f.group);
            f.group.traverse((obj) => {
              if ((obj as THREE.Mesh).isMesh) {
                const mat = (obj as THREE.Mesh).material;
                if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
              }
            });
            flyingItems.splice(i, 1);
          }
        }

        // Update instanced cosmic crystal shards (zero GC)
        let shardsDirty = false;
        for (let i = 0; i < MAX_GALAXY_SHARDS; i++) {
          const s = galaxyShards[i];
          if (!s.active) continue;
          shardsDirty = true;
          s.age += dt;
          if (s.age >= s.maxAge) {
            s.active = false;
            _shardDummy.position.set(0, 0, 0);
            _shardDummy.scale.setScalar(0);
            _shardDummy.updateMatrix();
            galaxyShardMesh.setMatrixAt(i, _shardDummy.matrix);
            continue;
          }
          const drag = Math.exp(-2.1 * dt);
          s.vel.multiplyScalar(drag);
          s.pos.addScaledVector(s.vel, dt);
          s.rot.x += s.rotVel.x * dt;
          s.rot.y += s.rotVel.y * dt;
          s.rot.z += s.rotVel.z * dt;
          const lifeFrac = 1 - s.age / s.maxAge;
          _shardDummy.position.copy(s.pos);
          _shardDummy.rotation.copy(s.rot);
          _shardDummy.scale.setScalar(Math.max(0.01, s.baseScale * lifeFrac));
          _shardDummy.updateMatrix();
          galaxyShardMesh.setMatrixAt(i, _shardDummy.matrix);
        }
        if (shardsDirty) {
          galaxyShardMesh.instanceMatrix.needsUpdate = true;
        }

        // Update galaxy nebula starlight particles (zero GC)
        let starsDirty = false;
        for (let i = 0; i < MAX_GALAXY_STARS; i++) {
          const st = galaxyStars[i];
          if (!st.active) continue;
          starsDirty = true;
          st.age += dt;
          if (st.age >= st.maxAge) {
            st.active = false;
            galaxyStarPos[i * 3] = 0;
            galaxyStarPos[i * 3 + 1] = 9999;
            galaxyStarPos[i * 3 + 2] = 0;
            continue;
          }
          const drag = Math.exp(-2.4 * dt);
          st.vx *= drag;
          st.vy *= drag;
          st.vz *= drag;
          st.px += (st.vx + st.swirlX * 0.45) * dt;
          st.py += (st.vy + st.swirlY * 0.45) * dt;
          st.pz += (st.vz + st.swirlZ * 0.45) * dt;

          const fade = Math.max(0, 1 - st.age / st.maxAge);
          const twinkle = 0.72 + 0.28 * Math.sin(elapsed * 18 + i);
          galaxyStarPos[i * 3] = st.px;
          galaxyStarPos[i * 3 + 1] = st.py;
          galaxyStarPos[i * 3 + 2] = st.pz;
          galaxyStarCol[i * 3] = st.r * fade * twinkle;
          galaxyStarCol[i * 3 + 1] = st.g * fade * twinkle;
          galaxyStarCol[i * 3 + 2] = st.b * fade * twinkle;
        }
        if (starsDirty) {
          galaxyStarPosAttr.needsUpdate = true;
          galaxyStarColAttr.needsUpdate = true;
        }

        // Update cosmic shockwave rings
        for (let i = 0; i < shockwaves.length; i++) {
          const sw = shockwaves[i];
          if (!sw.active) continue;
          sw.age += dt;
          const p = Math.min(1, sw.age / sw.maxAge);
          if (p >= 1) {
            sw.active = false;
            sw.mesh.visible = false;
            continue;
          }
          const easeOut = 1 - Math.pow(1 - p, 3);
          sw.mesh.scale.setScalar(0.35 + easeOut * 2.25);
          sw.mat.opacity = 0.85 * (1 - p);
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = window.requestAnimationFrame(tick);
        }
      }

      tick();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

        cubeBodyGeo.dispose();
        arrowGeo.dispose();
        capGeo.dispose();
        collarGeo.dispose();
        hintRingGeo.dispose();
        hintHaloMat.dispose();
        moteGeo.dispose();
        moteMat.dispose();
        galaxyShardGeo.dispose();
        galaxyShardMat.dispose();
        galaxyStarGeo.dispose();
        galaxyStarMat.dispose();
        galaxyStarTex.dispose();
        shockRingGeo.dispose();
        shockwaves.forEach((sw) => sw.mat.dispose());
        envTex.dispose();
        activeMaterials.forEach((m) => m.dispose());
        for (const [, entry] of blockMeshMap.entries()) {
          (entry.body.material as THREE.Material).dispose();
        }
        renderer.dispose();
      };
    }, []);

    // Sync blocks and skin updates without tearing down WebGL canvas
    useEffect(() => {
      sceneCtrlRef.current?.syncBlocks(blocks, skinId);
    }, [blocks, skinId]);

    useEffect(() => {
      sceneCtrlRef.current?.applyTheme(skinId, backdropId, moodId);
    }, [skinId, backdropId, moodId]);

    useEffect(() => {
      if (animEvent) {
        sceneCtrlRef.current?.triggerEvent(animEvent, skinId);
      }
    }, [animEvent, skinId]);

    return (
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full" />
        {contextLost && (
          <div className="absolute inset-0 bg-[#0F172A]/95 flex flex-col items-center justify-center p-4 text-center text-white">
            <p className="text-sm font-bold mb-1">WebGL Context Suspended</p>
            <p className="text-xs text-white/70">Đang khôi phục khung hình 3D...</p>
          </div>
        )}
      </div>
    );
  }
);

CubeAway3DCanvas.displayName = 'CubeAway3DCanvas';
