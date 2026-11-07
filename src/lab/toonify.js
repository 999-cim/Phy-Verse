import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  NoToneMapping,
  PlaneGeometry,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three';

/* ------------------------------------------------------------------ *
 * Reusable "handbook" treatment for Blender GLBs.
 *
 *   toonifyGLB(root)       replace all PBR materials with 4-band toon
 *   addInkOutlines(root)   BackSide shell outlines on the hero parts
 *   applyPaperScene(...)    paper floor / soft oval shadow / flat light
 *
 * The function is intentionally independent of the Boyle experiment so
 * the remaining 14 Blender models can use the same pipeline.
 * ------------------------------------------------------------------ */

const INK = 0x1a1a1a;
const PALETTE = {
  glass: 0xcbe7e3,
  glassEtch: 0xf4f0e4,
  steel: 0x9fb8c6,
  lightMetal: 0xd3d3d3,
  darkMetal: 0x788694,
  brass: 0xd9bd86,
  rubber: 0x59636d,
  ink: 0x3b4650,
};

let gradientMap = null;

export function getHandbookGradientMap() {
  if (gradientMap) return gradientMap;
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ['#565b63', '#9299a2', '#cbd0d6', '#ffffff'].forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i, 0, 1, 1);
  });
  gradientMap = new CanvasTexture(canvas);
  gradientMap.minFilter = NearestFilter;
  gradientMap.magFilter = NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.colorSpace = SRGBColorSpace;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

function ancestorWeightName(mesh) {
  let node = mesh;
  while (node) {
    if (/^Weight_1kg$/.test(node.name)) return '1kg';
    if (/^Weight_500g$/.test(node.name)) return '500g';
    if (/^Weight_200g$/.test(node.name)) return '200g';
    node = node.parent;
  }
  return '';
}

function toonColorFor(mesh, oldMaterialName) {
  const name = mesh.name || '';
  const weight = ancestorWeightName(mesh);

  if (/Glass_Cylinder|Glass|Beaker|Spout|^Cylinder$/i.test(name) || /glass/i.test(oldMaterialName)) {
    return { color: PALETTE.glass, transparent: true, opacity: 0.3, side: DoubleSide, depthWrite: false };
  }
  if (/^Water$/i.test(name) || /water/i.test(oldMaterialName)) {
    return { color: 0x9ccbd6, transparent: true, opacity: 0.36, side: DoubleSide, depthWrite: false };
  }
  if (/copper|coil/i.test(name) || /copper/i.test(oldMaterialName)) {
    return { color: 0xd69b72 };
  }
  if (/lens/i.test(name)) {
    return { color: 0xe8887d };
  }
  if (/darkmetal/i.test(oldMaterialName) || /^Stand$/i.test(name)) {
    return { color: PALETTE.darkMetal };
  }
  if (/glass_etch/i.test(oldMaterialName)) {
    return { color: PALETTE.glassEtch, transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false };
  }
  if (/_plaque$/i.test(name)) {
    return { color: 0xe8d5a8 };
  }
  if (/_label$|_serial$/i.test(name)) {
    return { color: PALETTE.ink };
  }
  if (/^Piston_Head$/i.test(name)) {
    return { color: PALETTE.lightMetal };
  }
  if (/engraving_dark/i.test(oldMaterialName)) {
    return { color: PALETTE.ink };
  }
  if (/brass/i.test(oldMaterialName)) {
    return { color: PALETTE.brass };
  }
  if (/rubber/i.test(oldMaterialName)) {
    return { color: PALETTE.rubber };
  }
  if (/dark_steel/i.test(oldMaterialName)) {
    return { color: weight === '500g' ? 0xc8c8c8 : PALETTE.darkMetal };
  }
  if (weight === '1kg') return { color: 0x8ecae6 };
  if (weight === '500g') return { color: 0xd3d3d3 };
  if (weight === '200g') return { color: 0xb8c9d2 };
  if (/Piston_Head/i.test(name)) return { color: 0xd3d3d3 };
  if (/Piston_Rod|GEO_weight_platform/i.test(name)) return { color: 0xa9c2cf };
  return { color: PALETTE.steel };
}

export function toonifyGLB(root) {
  const gradient = getHandbookGradientMap();
  const cache = new Map();
  const oldMaterials = new Set();

  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const old = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const oldName = old?.name || '';
    if (old) oldMaterials.add(old);

    const spec = toonColorFor(mesh, oldName);
    const key = [
      spec.color, spec.opacity || 1, spec.transparent ? 1 : 0,
      spec.side || 0, spec.depthWrite === false ? 0 : 1,
    ].join(':');
    let mat = cache.get(key);
    if (!mat) {
      mat = new MeshToonMaterial({
        color: spec.color,
        gradientMap: gradient,
        transparent: !!spec.transparent,
        opacity: spec.opacity == null ? 1 : spec.opacity,
        side: spec.side || 0,
        depthWrite: spec.depthWrite !== false,
      });
      mat.name = 'HANDBOOK_TOON';
      mat.toneMapped = false;
      cache.set(key, mat);
    }
    mesh.material = mat;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  // GLB materials and their textures are deliberately discarded.
  oldMaterials.forEach((mat) => {
    for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
      if (mat[key] && typeof mat[key].dispose === 'function') mat[key].dispose();
    }
    mat.dispose?.();
  });

  return { gradientMap: gradient };
}

function addGlassSilhouette(glass) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    uniforms: { uInk: { value: new Color(INK) } },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vN;
      varying vec3 vV;
      uniform vec3 uInk;
      void main() {
        float d = abs(dot(normalize(vN), normalize(vV)));
        float a = (1.0 - smoothstep(0.055, 0.26, d)) * 0.82;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uInk, a);
      }
    `,
  });
  const os = new Mesh(glass.geometry, material);
  os.name = 'Glass_Cylinder_InkSilhouette';
  os.position.copy(glass.position);
  os.quaternion.copy(glass.quaternion);
  os.scale.copy(glass.scale).multiplyScalar(1.002);
  os.renderOrder = 2;
  os.raycast = () => {};
  os.userData.outline = true;
  glass.parent.add(os);
}

export function addInkOutlines(root, options = {}) {
  const defaults = [
    { name: 'GEO_glass_lip_ring', factor: 1.012, glass: true },
    { name: 'GEO_glass_base_ring', factor: 1.012, glass: true },
    { name: 'GEO_glass_base_brass_ring', factor: 1.012, glass: true },
    { name: 'Glass_Cylinder', factor: 1.002, glass: true, shader: true },
    { name: 'Piston_Head', factor: 1.02 },
    { name: 'Piston_Rod', factor: 1.045 },
    { name: 'GEO_weight_platform', factor: 1.018 },
    { name: 'GEO_weight_platform_rim', factor: 1.018 },
    { name: 'Weight_1kg_Body', factor: 1.018 },
    { name: 'Weight_500g_Body', factor: 1.018 },
    { name: 'Weight_200g_Body', factor: 1.018 },
    { name: 'GEO_weight_A_hook', factor: 1.038 },
    { name: 'GEO_weight_B_hook', factor: 1.038 },
    { name: 'GEO_weight_C_hook', factor: 1.038 },
  ];
  const targets = options.targets || defaults;
  const ink = new MeshBasicMaterial({
    color: INK, side: BackSide, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false,
  });
  const glassInk = new MeshBasicMaterial({
    color: INK, side: BackSide, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false,
  });

  const addMesh = (mesh, spec) => {
    if (!mesh || !mesh.isMesh || !mesh.parent) return;
    if (spec.shader) {
      // Hollow / semi-transparent glass gets a silhouette shader instead
      // of a BackSide shell, which would fill the vessel with ink.
      addGlassSilhouette(mesh);
      return;
    }
    const outline = new Mesh(mesh.geometry, spec.glass ? glassInk : ink);
    outline.name = `${mesh.name}_InkOutline`;
    outline.position.copy(mesh.position);
    outline.quaternion.copy(mesh.quaternion);
    outline.scale.copy(mesh.scale).multiplyScalar(spec.factor || 1.02);
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.frustumCulled = mesh.frustumCulled;
    outline.renderOrder = 1;
    outline.raycast = () => {};
    outline.userData.outline = true;
    mesh.parent.add(outline);
  };

  for (const spec of targets) {
    const obj = root.getObjectByName(spec.name);
    if (!obj) continue;
    if (obj.isMesh) {
      addMesh(obj, spec);
    } else {
      obj.traverse((m) => { if (m.isMesh) addMesh(m, spec); });
    }
  }
  return { count: targets.length, ink, glassInk };
}

export function loadHandbookGLB(url, { onLoad, onError, outline } = {}) {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.load(url, (gltf) => {
    const root = gltf.scene;
    toonifyGLB(root);
    addInkOutlines(root, outline || {});
    if (onLoad) onLoad(root, gltf);
  }, undefined, (err) => {
    console.error('[handbook] GLB load failed:', url, err);
    if (onError) onError(err);
  });
}

function makePaperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4ecdd';
  ctx.fillRect(0, 0, 512, 512);
  // very faint ruled / graph-paper rhythm, not a technical grid
  ctx.strokeStyle = 'rgba(143, 126, 102, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(143, 126, 102, 0.055)';
  for (let y = 8; y <= 512; y += 16) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = 4;
  return texture;
}

function makeSoftShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grd = ctx.createRadialGradient(128, 128, 8, 128, 128, 118);
  grd.addColorStop(0, 'rgba(88, 77, 62, 0.24)');
  grd.addColorStop(0.45, 'rgba(88, 77, 62, 0.13)');
  grd.addColorStop(1, 'rgba(88, 77, 62, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function applyPaperScene(scene, root3d, renderer) {
  if (root3d.userData.paperRestore) {
    root3d.userData.paperRestore();
  }

  const previousBackground = scene.background;
  const previousFog = scene.fog;
  const previousShadowEnabled = renderer.shadowMap.enabled;
  const previousShadowType = renderer.shadowMap.type;
  const previousToneMapping = renderer.toneMapping;
  const previousExposure = renderer.toneMappingExposure;

  const lights = [];
  scene.traverse((o) => {
    if (o.isDirectionalLight || o.isHemisphereLight || o.isAmbientLight) {
      lights.push({ light: o, visible: o.visible, intensity: o.intensity, castShadow: o.castShadow });
      o.visible = false;
      if (o.isLight) o.castShadow = false;
    }
  });

  const ground = root3d.getObjectByName('lab-ground');
  const groundVisible = ground ? ground.visible : null;
  if (ground) ground.visible = false;

  scene.background = new Color(0xf3ead9);
  scene.fog = null;
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = NoToneMapping;
  renderer.toneMappingExposure = 1.0;

  const paperTexture = makePaperTexture();
  const paper = new Mesh(
    new PlaneGeometry(80, 80),
    new MeshBasicMaterial({ map: paperTexture, color: 0xffffff, toneMapped: false })
  );
  paper.name = 'PAPER_floor';
  paper.rotation.x = -Math.PI / 2;
  paper.position.y = -0.005;
  paper.receiveShadow = false;
  paper.renderOrder = -2;
  root3d.add(paper);

  const shadowTexture = makeSoftShadowTexture();
  const shadow = new Mesh(
    new PlaneGeometry(8.5, 6.5),
    new MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      toneMapped: false,
    })
  );
  shadow.name = 'PAPER_soft_shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.35, 0.004, 0.1);
  shadow.renderOrder = -1;
  root3d.add(shadow);

  const ambient = new AmbientLight(0xfff7e8, 0.65);
  ambient.name = 'PAPER_ambient';
  const hemi = new HemisphereLight(0xfff5e5, 0xa69783, 2.0);
  hemi.name = 'PAPER_hemi';
  const key = new DirectionalLight(0xfff1d6, 0.9);
  key.name = 'PAPER_key';
  key.position.set(4, 8, 6);
  key.castShadow = false;
  scene.add(ambient, hemi, key);

  const restore = () => {
    if (paper.parent) paper.parent.remove(paper);
    if (shadow.parent) shadow.parent.remove(shadow);
    paper.geometry.dispose();
    paper.material.map?.dispose();
    paper.material.dispose();
    shadow.geometry.dispose();
    shadow.material.map?.dispose();
    shadow.material.dispose();
    scene.remove(ambient, hemi, key);
    for (const entry of lights) {
      entry.light.visible = entry.visible;
      entry.light.intensity = entry.intensity;
      entry.light.castShadow = entry.castShadow;
    }
    if (ground) ground.visible = groundVisible;
    scene.background = previousBackground;
    scene.fog = previousFog;
    renderer.shadowMap.enabled = previousShadowEnabled;
    renderer.shadowMap.type = previousShadowType;
    renderer.toneMapping = previousToneMapping;
    renderer.toneMappingExposure = previousExposure;
    root3d.userData.paperRestore = null;
  };

  root3d.userData.paperRestore = restore;
  return restore;
}
