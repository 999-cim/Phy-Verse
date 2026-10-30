import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import '../core/bridge.js';
import { marksKey } from '../core/storage.js';

/**
 * PHY-EXP shared 3D engine, scene graph, materials, HUD/graph and experiment
 * lifecycle. Experiment definitions live in ./experiments/*.js.
 */
    const I18N = {
      en: {
        back:'Back', pause:'Pause', play:'Play', rec:'Record', clear:'Clear',
        points:'Points', loadFail:'Could not load the 3D engine. Check internet connection.',
        equipment:'Equipment', variables:'Variables', data:'Readouts', hint:'Hint',
        power:'Power supply', voltage:'Supply voltage',
        view3d:'3D', viewFront:'Front', viewVector:'Vectors',
        catGas:'Gas Laws', catHeat:'Heat & Temperature', catMech:'Mechanics', catElec:'Electricity',
        catOptics:'Optics', catWaves:'Waves', catMisc:'Reasoning',
        slope:'slope'
      },
      tc: {
        back:'返回', pause:'暫停', play:'播放', rec:'記錄', clear:'清除',
        points:'資料點', loadFail:'無法載入 3D 引擎。請檢查網路連線。',
        equipment:'實驗器材', variables:'實驗變數', data:'讀數', hint:'提示',
        power:'電源供應器', voltage:'供應電壓',
        view3d:'3D', viewFront:'正視圖', viewVector:'向量',
        catGas:'氣體定律', catHeat:'熱與溫度', catMech:'力學', catElec:'電學',
        catOptics:'光學', catWaves:'波動', catMisc:'推理',
        slope:'斜率'
      },
      sc: {
        back:'返回', pause:'暂停', play:'播放', rec:'记录', clear:'清除',
        points:'数据点', loadFail:'无法加载 3D 引擎。请检查网络连接。',
        equipment:'实验器材', variables:'实验变量', data:'读数', hint:'提示',
        power:'电源供应器', voltage:'供应电压',
        view3d:'3D', viewFront:'正视图', viewVector:'向量',
        catGas:'气体定律', catHeat:'热与温度', catMech:'力学', catElec:'电学',
        catOptics:'光学', catWaves:'波动', catMisc:'推理',
        slope:'斜率'
      }
    };

    let lang = (window.PhyVerse && window.PhyVerse.lang === 'en') ? 'en' : 'tc';
    const t = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
    const T = (obj, fallback='') => (typeof obj === 'string' ? obj : (obj && (obj[lang] || obj.tc || obj.en)) || fallback);

    /* ---------- HUD / 圖表標籤本地化（不改動 15 個實驗的數學模型） ---------- */
    const HUD_I18N = {
      'Supply':      { tc:'供應',   sc:'供应' },
      'Phase':       { tc:'狀態',   sc:'状态' },
      'Ice melted':  { tc:'已熔化', sc:'已熔化' },
      'L_f est.':    { tc:'L_f 估算', sc:'L_f 估算' },
      'T at hot end':{ tc:'熱端溫度', sc:'热端温度' },
      'T at mid':    { tc:'中段溫度', sc:'中段温度' },
      'T at far end':{ tc:'遠端溫度', sc:'远端温度' },
      'Power':       { tc:'功率',   sc:'功率' },
      'Flow':        { tc:'流向',   sc:'流向' },
      'T black':     { tc:'黑色表面溫度', sc:'黑色表面温度' },
      'T shiny':     { tc:'光亮表面溫度', sc:'光亮表面温度' },
      'T inside':    { tc:'箱內溫度', sc:'箱内温度' },
      'T outside':   { tc:'箱外溫度', sc:'箱外温度' },
      'Formula':     { tc:'公式',   sc:'公式' },
      'Verdict':     { tc:'判定',   sc:'判定' }
    };
    const HUD_VALUE_I18N = {
      'solid':     { tc:'固態',   sc:'固态' },
      'melting':   { tc:'熔化中', sc:'熔化中' },
      'liquid':    { tc:'液態',   sc:'液态' },
      'Static':    { tc:'靜止',   sc:'静止' },
      'Rising left, sinking right': { tc:'左升右沉', sc:'左升右沉' },
      '✓ consistent':     { tc:'✓ 一致',   sc:'✓ 一致' },
      '✗ NOT consistent': { tc:'✗ 不一致', sc:'✗ 不一致' }
    };
    const AXIS_I18N = {
      'Time (s)':      { tc:'時間 (s)',       sc:'时间 (s)' },
      'Angle (°)':     { tc:'角度 (°)',       sc:'角度 (°)' },
      'Position (cm)': { tc:'位置 (cm)',      sc:'位置 (cm)' },
      'Range (m)':     { tc:'射程 (m)',       sc:'射程 (m)' },
      'Speed (arb.)':  { tc:'速度 (任意單位)', sc:'速度 (任意单位)' }
    };
    function trLabel(map, key) {
      if (lang === 'en' || key == null) return key;
      const entry = map[key];
      return entry ? (entry[lang] || entry.tc) : key;
    }

    const EXPS = [];
    let currentExp = null;
    const root = document.documentElement;

    /* ---------- 動態掛載容器與 Three.js 物件 ---------- */
    let activeContainer = null;
    let vp = null, canvas3 = null, gCanvas = null, gCtx = null, ptCountEl = null, gInfoEl = null;
    let renderer = null, scene = null, camera = null, controls = null;
    let hemiLight = null, keyLight = null, rimLight = null, fillLight = null, root3d = null;
    let resizeObs = null;

    let viewMode = '3d';
    let camAnim = null;
    let trail = [];
    let marks = [];
    let yMaxSmooth = 100;

    function ensureThreeEngine() {
      if (renderer || !THREE) return;
      canvas3 = document.createElement('canvas');
      canvas3.id = 'three-canvas';

      renderer = new THREE.WebGLRenderer({ canvas: canvas3, antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(1, 1, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
      /* 以程序化 RoomEnvironment 產生 PMREM 反射貼圖（無外部 HDR） */
      try {
        if (RoomEnvironment && THREE.PMREMGenerator) {
          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const envScene = new RoomEnvironment();
          const envRT = pmrem.fromScene(envScene, 0.045, 0.1, 120);
          scene.environment = envRT.texture;
          if (typeof envScene.dispose === 'function') envScene.dispose();
          pmrem.dispose();
        }
      } catch (e) {
        console.warn('[PHY-EXP] PMREM environment failed:', e);
      }

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 3;
      controls.maxDistance = 60;
      controls.maxPolarAngle = Math.PI * 0.94;

      hemiLight = new THREE.HemisphereLight(0xcfe0f5, 0x151c26, 1.35);
      scene.add(hemiLight);

      keyLight = new THREE.DirectionalLight(0xfff6ea, 2.6);
      keyLight.position.set(9, 16, 11);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1536, 1536);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 22;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0006;
      scene.add(keyLight);

      rimLight = new THREE.DirectionalLight(0x8fc2ff, 1.15);
      rimLight.position.set(-10, 6, -9);
      scene.add(rimLight);

      fillLight = new THREE.DirectionalLight(0xffffff, 0.55);
      fillLight.position.set(0, 4, -12);
      scene.add(fillLight);

      root3d = new THREE.Group();
      scene.add(root3d);

      applyTheme();
    }

    function clearRoot() {
      if (!root3d) return;
      while (root3d.children.length) {
        const o = root3d.children[0];
        root3d.remove(o);
        o.traverse?.(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            const ms = Array.isArray(c.material) ? c.material : [c.material];
            ms.forEach(m => {
              for (const key of ['map', 'lightMap', 'aoMap', 'emissiveMap',
                                 'bumpMap', 'normalMap', 'displacementMap',
                                 'roughnessMap', 'metalnessMap', 'alphaMap',
                                 'envMap', 'specularMap']) {
                if (m[key]) m[key].dispose();
              }
              m.dispose();
            });
          }
          if (c.isArrowHelper) {
            if (c.line) { c.line.geometry.dispose(); c.line.material.dispose(); }
            if (c.cone) { c.cone.geometry.dispose(); c.cone.material.dispose(); }
          }
        });
      }
    }

    /* ============================================================
       PBR 材質庫（ACES + PMREM 環境下）
       ============================================================ */
    const MAT = {
      metal: () => new THREE.MeshPhysicalMaterial({
        color: 0xc9d3de, metalness: 0.94, roughness: 0.22,
        clearcoat: 0.25, clearcoatRoughness: 0.28, envMapIntensity: 1.15
      }),
      steel: () => new THREE.MeshPhysicalMaterial({
        color: 0xb8c2cd, metalness: 0.96, roughness: 0.18,
        envMapIntensity: 1.2
      }),
      aluminium: () => new THREE.MeshPhysicalMaterial({
        color: 0xd5dbe2, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.1
      }),
      brass: () => new THREE.MeshPhysicalMaterial({
        color: 0xc9a24a, metalness: 0.95, roughness: 0.2,
        clearcoat: 0.2, envMapIntensity: 1.25
      }),
      copper: () => new THREE.MeshPhysicalMaterial({
        color: 0xb4693c, metalness: 0.93, roughness: 0.24, envMapIntensity: 1.2
      }),
      dark: () => new THREE.MeshPhysicalMaterial({
        color: 0x39424e, metalness: 0.72, roughness: 0.4, envMapIntensity: 0.9
      }),
      ring: () => new THREE.MeshPhysicalMaterial({
        color: 0x8a99aa, metalness: 0.92, roughness: 0.24, envMapIntensity: 1.1
      }),
      rubber: () => new THREE.MeshStandardMaterial({
        color: 0x141a20, metalness: 0.0, roughness: 0.88
      }),
      ceramic: () => new THREE.MeshPhysicalMaterial({
        color: 0xe3d2b4, metalness: 0.0, roughness: 0.5, clearcoat: 0.4, envMapIntensity: 0.7
      }),
      cream: () => new THREE.MeshPhysicalMaterial({
        color: 0xe6e4dc, metalness: 0.05, roughness: 0.42,
        clearcoat: 0.45, clearcoatRoughness: 0.35, envMapIntensity: 0.9
      }),
      white: () => new THREE.MeshPhysicalMaterial({
        color: 0xf4f6f8, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.7
      }),
      black: () => new THREE.MeshPhysicalMaterial({
        color: 0x11161c, metalness: 0.25, roughness: 0.5, envMapIntensity: 0.8
      }),
      red: () => new THREE.MeshPhysicalMaterial({
        color: 0xb83228, metalness: 0.15, roughness: 0.34, clearcoat: 0.5
      }),
      glass: () => new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe, transparent: true, opacity: 0.32,
        roughness: 0.05, metalness: 0.0, transmission: 0.65,
        ior: 1.5, thickness: 0.25, side: THREE.DoubleSide,
        depthWrite: false, envMapIntensity: 1.3
      }),
      glassThin: () => new THREE.MeshPhysicalMaterial({
        color: 0xe4f2ff, transparent: true, opacity: 0.24,
        roughness: 0.06, metalness: 0.0, transmission: 0.5,
        ior: 1.48, thickness: 0.12, side: THREE.DoubleSide,
        depthWrite: false, envMapIntensity: 1.2
      }),
      water: () => new THREE.MeshPhysicalMaterial({
        color: 0x2d7fd3, transparent: true, opacity: 0.35,
        roughness: 0.08, metalness: 0.0, transmission: 0.45,
        ior: 1.33, thickness: 0.3, side: THREE.DoubleSide,
        depthWrite: false, envMapIntensity: 1.1
      }),
      pcb: () => new THREE.MeshPhysicalMaterial({
        color: 0x0d3a31, metalness: 0.15, roughness: 0.48,
        clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8
      }),
      emissive: (color) => new THREE.MeshBasicMaterial({ color })
    };

    /* ---------- 幾何小工具 ---------- */
    function rbox(w, h, d, radius, material, segments = 3) {
      const safeR = Math.max(0.002, Math.min(radius, Math.min(w, h, d) * 0.42));
      let geo;
      if (typeof RoundedBoxGeometry === 'function') {
        geo = new RoundedBoxGeometry(w, h, d, segments, safeR);
      } else {
        geo = new THREE.BoxGeometry(w, h, d);
      }
      const m = new THREE.Mesh(geo, material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    function lathe(points, material, segments = 48) {
      const pts = points.map(p => new THREE.Vector2(p[0], p[1]));
      const geo = new THREE.LatheGeometry(pts, segments);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    function barBetween(a, b, radius, material, radial = 10) {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = Math.max(0.001, dir.length());
      const geo = new THREE.CylinderGeometry(radius, radius, len, radial, 1, false);
      const m = new THREE.Mesh(geo, material);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      m.castShadow = true;
      return m;
    }

    function makeCanvas(w, h, draw) {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      draw(ctx, w, h);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return { canvas: cv, ctx, tex };
    }

    /* ---------- 開槽砝碼（C 形，帶倒角與中心孔） ---------- */
    function slottedMassMesh(R, H, color = 0x9ba6b2, gap = 0.34) {
      const shape = new THREE.Shape();
      const steps = 40;
      const inner = R * 0.24;
      for (let i = 0; i <= steps; i++) {
        const a = gap / 2 + (Math.PI * 2 - gap) * i / steps;
        const x = Math.cos(a) * R, y = Math.sin(a) * R;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      for (let i = steps; i >= 0; i--) {
        const a = gap / 2 + (Math.PI * 2 - gap) * i / steps;
        shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: H, bevelEnabled: true, bevelThickness: H * 0.10,
        bevelSize: R * 0.035, bevelSegments: 2, curveSegments: 2, steps: 1
      });
      geo.center();
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshPhysicalMaterial({
        color, metalness: 0.92, roughness: 0.24,
        clearcoat: 0.3, clearcoatRoughness: 0.25, envMapIntensity: 1.15
      });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true; m.receiveShadow = true;
      return m;
    }

    function createMassStack(opts = {}) {
      const count = opts.count || 6;
      const R = opts.R || 0.68;
      const H = opts.H || 0.18;
      const spacing = opts.spacing || 0.2;
      const taper = opts.taper || 0;
      const colors = opts.colors || [0x99a4b4, 0x8a94a6, 0xb0a07a, 0x7fa3b8, 0xa8a0b8, 0x93a0b0];
      const group = new THREE.Group();
      const discs = [];
      for (let i = 0; i < count; i++) {
        const d = slottedMassMesh(Math.max(0.12, R - i * taper), H, colors[i % colors.length]);
        d.position.y = i * spacing;
        group.add(d);
        discs.push(d);
      }
      let cap = null;
      if (opts.cap !== false) {
        cap = rbox(Math.max(0.2, R * 0.62), Math.max(0.08, H * 0.55), Math.max(0.2, R * 0.62), 0.03, MAT.dark());
        cap.position.y = count * spacing + H * 0.3;
        group.add(cap);
      }
      return { group, discs, cap };
    }

    /* ---------- 玻璃量筒 / 燒杯 ---------- */
    function addGraduation(group, R, H, count = 18) {
      const tickGeo = new THREE.BoxGeometry(0.008, 0.020, 0.008);
      const majorGeo = new THREE.BoxGeometry(0.014, 0.030, 0.008);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf2f7fc });
      for (let i = 1; i <= count; i++) {
        const frac = i / (count + 1);
        const a = -1.18 + 2.36 * frac;
        const y = H * (0.1 + 0.82 * frac);
        const tick = new THREE.Mesh(i % 4 === 0 ? majorGeo : tickGeo, mat);
        tick.position.set(Math.sin(a) * (R + 0.012), y, Math.cos(a) * (R + 0.012));
        tick.rotation.y = a;
        group.add(tick);
      }
      /* 外壁印刷刻度：透明貼圖，包含白線與數字 */
      const scaleTex = makeCanvas(256, 1024, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        c.strokeStyle = 'rgba(245,250,255,0.95)';
        c.fillStyle = 'rgba(245,250,255,0.95)';
        c.lineWidth = 3;
        c.font = 'bold 22px Inter, system-ui, sans-serif';
        c.textAlign = 'left';
        for (let i = 0; i <= 40; i++) {
          const y = 24 + i * (h - 60) / 40;
          const major = i % 5 === 0;
          c.beginPath();
          c.moveTo(16, y);
          c.lineTo(major ? 86 : 52, y);
          c.stroke();
          if (major) c.fillText(String(50 - i), 96, y + 8);
        }
        c.font = 'bold 26px Inter, system-ui, sans-serif';
        c.fillText('mL', 16, 44);
      });
      const scalePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, H * 0.80),
        new THREE.MeshBasicMaterial({ map: scaleTex.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
      );
      scalePlane.position.set(0, H * 0.50, R + 0.016);
      group.add(scalePlane);

      /* 前側小標籤 */
      const lab = makeCanvas(256, 128, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        c.fillStyle = 'rgba(255,255,255,0.92)';
        c.font = 'bold 34px Inter, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('PYREX', w / 2, 54);
        c.font = '24px Inter, system-ui, sans-serif';
        c.fillText('mL', w / 2, 92);
      });
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.17),
        new THREE.MeshBasicMaterial({ map: lab.tex, transparent: true, depthWrite: false })
      );
      label.position.set(0, H * 0.62, R + 0.012);
      group.add(label);
    }

    function createGraduatedCylinder(opts = {}) {
      const R = opts.R || 1.2;
      const H = opts.H || 6;
      const marks = opts.marks !== false;
      const spout = !!opts.spout;
      const group = new THREE.Group();
      const glassMat = opts.material || MAT.glass();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true), glassMat);
      wall.position.y = H / 2;
      wall.castShadow = false;
      group.add(wall);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.025, R * 1.04, 0.14, 64), glassMat);
      base.position.y = 0.07;
      group.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 10, 64), MAT.glassThin());
      rim.rotation.x = Math.PI / 2;
      rim.position.y = H;
      group.add(rim);
      if (marks) addGraduation(group, R, H, opts.ticks || 18);
      if (spout) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, H - 0.02, R * 0.88),
          new THREE.Vector3(0, H + 0.07, R * 1.08),
          new THREE.Vector3(0, H + 0.02, R * 1.22)
        ]);
        const sp = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.055, 8, false), glassMat);
        group.add(sp);
      }
      return { group, wall, R, H };
    }

    /* ---------- 活塞 / O-ring ---------- */
    function createPiston(R, thickness, rodR, rodH) {
      const group = new THREE.Group();
      const profile = [
        [0, -thickness / 2], [R * 0.86, -thickness / 2], [R, -thickness * 0.30],
        [R, thickness * 0.30], [R * 0.86, thickness / 2], [0, thickness / 2]
      ];
      const body = lathe(profile, MAT.metal(), 64);
      group.add(body);
      for (const s of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, thickness * 0.11, 10, 64), MAT.rubber());
        ring.rotation.x = Math.PI / 2;
        ring.position.y = s * thickness * 0.29;
        group.add(ring);
      }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, rodH, 24), MAT.steel());
      rod.position.y = thickness / 2 + rodH / 2;
      rod.castShadow = true;
      group.add(rod);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(rodR * 1.5, rodR * 1.2, 0.08, 24), MAT.dark());
      cap.position.y = thickness / 2 + rodH + 0.02;
      cap.castShadow = true;
      group.add(cap);
      return { group, body, rod };
    }

    /* ---------- 數位電源 / 電錶 ---------- */
    function createPSU(opts = {}) {
      const w = opts.w || 1.4, h = opts.h || 1.0, d = opts.d || 0.9;
      const group = new THREE.Group();
      const body = rbox(w, h, d, Math.min(w, h, d) * 0.055, MAT.cream(), 4);
      body.position.y = h / 2;
      group.add(body);
      const panel = rbox(w * 0.92, h * 0.86, 0.035, 0.018, MAT.dark(), 3);
      panel.position.set(0, h * 0.50, d / 2 + 0.017);
      group.add(panel);
      const bezel = rbox(w * 0.66, h * 0.38, 0.028, 0.014, MAT.black(), 3);
      bezel.position.set(0, h * 0.68, d / 2 + 0.035);
      group.add(bezel);
      const screen = makeCanvas(256, 128, (c, cw, ch) => {
        c.fillStyle = '#04130d'; c.fillRect(0, 0, cw, ch);
        c.fillStyle = '#0b2a1e'; c.font = 'bold 18px ui-monospace, monospace';
        c.fillText('DC SUPPLY', 16, 28);
      });
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.60, h * 0.32),
        new THREE.MeshBasicMaterial({ map: screen.tex })
      );
      screenMesh.position.set(0, h * 0.68, d / 2 + 0.050);
      group.add(screenMesh);
      /* 旋鈕 */
      const knobCount = opts.knobs || 3;
      for (let i = 0; i < knobCount; i++) {
        const x = (i - (knobCount - 1) / 2) * w * 0.26;
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.085, h * 0.095, 0.07, 24), MAT.aluminium());
        knob.rotation.x = Math.PI / 2;
        knob.position.set(x, h * 0.28, d / 2 + 0.055);
        knob.castShadow = true;
        group.add(knob);
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.018), MAT.black());
        mark.position.set(x, h * 0.28 + h * 0.055, d / 2 + 0.090);
        group.add(mark);
      }
      /* 紅黑接線柱 */
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.10, 20), MAT.dark());
        post.rotation.x = Math.PI / 2;
        post.position.set(s * w * 0.26, h * 0.12, d / 2 + 0.055);
        group.add(post);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.035, 20), s < 0 ? MAT.red() : MAT.black());
        cap.rotation.x = Math.PI / 2;
        cap.position.set(s * w * 0.26, h * 0.12, d / 2 + 0.095);
        group.add(cap);
      }
      /* 散熱孔與把手 */
      for (let i = 0; i < 5; i++) {
        const vent = rbox(0.012, h * 0.34, 0.02, 0.006, MAT.black(), 2);
        vent.position.set(-w / 2 - 0.004, h * 0.50, d * 0.30 - i * d * 0.13);
        group.add(vent);
      }
      const handle = rbox(w * 0.36, 0.035, 0.07, 0.02, MAT.dark(), 3);
      handle.position.set(0, h + 0.018, 0);
      group.add(handle);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 12), MAT.rubber());
        foot.position.set(sx * w * 0.38, 0.017, sz * d * 0.34);
        group.add(foot);
      }
      return { group, body, screen: screenMesh, canvas: screen.canvas, ctx: screen.ctx, tex: screen.tex };
    }

    function createMeter(label, opts = {}) {
      const w = opts.w || 1.0, h = opts.h || 0.7, d = opts.d || 0.6;
      const group = new THREE.Group();
      const body = rbox(w, h, d, 0.035, MAT.dark(), 3);
      body.position.y = h / 2;
      group.add(body);
      const face = rbox(w * 0.88, h * 0.72, 0.04, 0.02, MAT.black(), 3);
      face.position.set(0, h * 0.48, d / 2 + 0.012);
      group.add(face);
      const screen = makeCanvas(256, 128, (c, cw, ch) => {
        c.fillStyle = '#03130c'; c.fillRect(0, 0, cw, ch);
        c.fillStyle = '#276b4a'; c.font = 'bold 18px ui-monospace, monospace';
        c.fillText(label, 16, 28);
      });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.58, h * 0.36), new THREE.MeshBasicMaterial({ map: screen.tex }));
      sm.position.set(0, h * 0.50, d / 2 + 0.038);
      group.add(sm);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), MAT.red());
      post.rotation.x = Math.PI / 2;
      post.position.set(-w * 0.28, h * 0.18, d / 2 + 0.04);
      group.add(post);
      const post2 = post.clone(); post2.material = MAT.black(); post2.position.x = w * 0.28; group.add(post2);
      return { group, screen: sm, canvas: screen.canvas, ctx: screen.ctx, tex: screen.tex };
    }

    /* ---------- 色環電阻 + PCB ---------- */
    function createResistor(opts = {}) {
      const L = opts.L || 0.9;
      const R = opts.R || 0.20;
      const group = new THREE.Group();
      const profile = [
        [0, -L / 2], [R * 0.62, -L / 2], [R * 0.62, -L * 0.16],
        [R * 1.22, -L * 0.05], [R * 1.22, L * 0.05], [R * 0.62, L * 0.16],
        [R * 0.62, L / 2], [0, L / 2]
      ];
      const body = lathe(profile, MAT.ceramic(), 36);
      body.rotation.z = Math.PI / 2;
      group.add(body);
      const bands = [
        { x: -L * 0.27, c: 0x5a3218, w: L * 0.08 },
        { x: -L * 0.15, c: 0xb83228, w: L * 0.08 },
        { x: -L * 0.03, c: 0x141414, w: L * 0.08 },
        { x: L * 0.20, c: 0xc9a24a, w: L * 0.05 }
      ];
      for (const b of bands) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.25, R * 1.25, b.w, 36), new THREE.MeshPhysicalMaterial({
          color: b.c, metalness: 0.25, roughness: 0.45, clearcoat: 0.4
        }));
        band.rotation.z = Math.PI / 2;
        band.position.x = b.x;
        group.add(band);
      }
      for (const s of [-1, 1]) {
        const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, L * 0.22, 12), MAT.steel());
        lead.rotation.z = Math.PI / 2;
        lead.position.x = s * (L * 0.61);
        group.add(lead);
      }
      const socket = rbox(L * 0.7, 0.10, 0.28, 0.02, MAT.dark(), 2);
      socket.position.y = -0.12;
      group.add(socket);
      return { group, body, bands };
    }

    function createPCB(w = 6, d = 4) {
      const group = new THREE.Group();
      const board = rbox(w, 0.16, d, 0.03, MAT.pcb(), 3);
      board.position.y = 0.08;
      group.add(board);
      /* 銅箔走線 */
      const traceMat = new THREE.MeshPhysicalMaterial({ color: 0xb8732d, metalness: 0.9, roughness: 0.25 });
      const tracePts = [
        new THREE.Vector3(-w * 0.42, 0.17, -d * 0.32), new THREE.Vector3(-w * 0.15, 0.17, -d * 0.32),
        new THREE.Vector3(-w * 0.15, 0.17, d * 0.20), new THREE.Vector3(w * 0.30, 0.17, d * 0.20)
      ];
      const trace = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tracePts), 40, 0.022, 6, false), traceMat);
      group.add(trace);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.04, 16), MAT.brass());
        pad.position.set(sx * w * 0.40, 0.19, sz * d * 0.35);
        group.add(pad);
      }
      return { group, board, trace };
    }

    /* ---------- 鐵架台 / 十字夾 / 彈簧 ---------- */
    function createRetortStand(opts = {}) {
      const baseW = opts.baseW || 1.3;
      const baseD = opts.baseD || 0.9;
      const rodH = opts.rodH || 6;
      const rodR = opts.rodR || 0.065;
      const group = new THREE.Group();
      const base = rbox(baseW, 0.16, baseD, 0.05, MAT.dark(), 3);
      base.position.y = 0.08;
      group.add(base);
      const baseRim = rbox(baseW * 1.01, 0.04, baseD * 1.01, 0.03, MAT.aluminium(), 2);
      baseRim.position.y = 0.17;
      group.add(baseRim);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, rodH, 24), MAT.steel());
      rod.position.y = rodH / 2 + 0.18;
      rod.castShadow = true;
      group.add(rod);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(rodR * 1.9, rodR * 1.9, 0.10, 24), MAT.aluminium());
      collar.position.y = 0.21;
      group.add(collar);
      /* 十字夾 */
      const clampY = opts.clampY || rodH * 0.72 + 0.18;
      const boss = new THREE.Group();
      boss.position.set(0, clampY, 0);
      const block = rbox(rodR * 5.2, rodR * 4.2, rodR * 4.0, 0.02, MAT.aluminium(), 3);
      boss.add(block);
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(rodR * 0.55, rodR * 0.55, rodR * 2.2, 12), MAT.brass());
      screw.rotation.z = Math.PI / 2;
      screw.position.set(rodR * 3.3, 0, 0);
      boss.add(screw);
      const wing = new THREE.Mesh(new THREE.TorusGeometry(rodR * 1.25, rodR * 0.22, 8, 20), MAT.brass());
      wing.position.set(rodR * 4.5, 0, 0);
      wing.rotation.y = Math.PI / 2;
      boss.add(wing);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(rodR * 0.55, rodR * 0.55, 1.2, 16), MAT.steel());
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.6, 0, 0);
      boss.add(arm);
      group.add(boss);
      return { group, base, rod, boss, clampY };
    }

    function helixPoints(R, turns, topY, bottomY, ptsPerTurn = 22) {
      const pts = [];
      const n = Math.max(24, Math.round(turns * ptsPerTurn));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = t * turns * Math.PI * 2;
        const y = topY + (bottomY - topY) * t;
        pts.push(new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R));
      }
      return pts;
    }

    function createHelicalSpring(R, turns, tubeR, topY, bottomY) {
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints(R, turns, topY, bottomY)), turns * 22, tubeR, 7, false);
      const m = new THREE.Mesh(geo, MAT.steel());
      m.castShadow = true;
      m.userData = { R, turns, tubeR, topY, bottomY };
      return m;
    }

    function updateHelicalSpring(mesh, topY, bottomY) {
      if (!mesh || !mesh.userData) return;
      const d = Math.abs((mesh.userData.bottomY || 0) - bottomY);
      if (d < 0.0025 && mesh.geometry) return;
      const u = mesh.userData;
      /* 幾何重建限制在 ~30 fps，減少 CPU 頂點配置 */
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (d < 0.02 && u._lastBuild && now - u._lastBuild < 30) return;
      u._lastBuild = now;
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPoints(u.R, u.turns, topY, bottomY)), u.turns * 22, u.tubeR, 7, false);
      mesh.geometry.dispose();
      mesh.geometry = geo;
      u.bottomY = bottomY;
    }

    /* ---------- 雷射 / 量角轉盤 / 拋射台 ---------- */
    function makeProtractorTexture() {
      return makeCanvas(512, 512, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        c.fillStyle = '#f7f8fa'; c.beginPath(); c.arc(256, 256, 250, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#28313c'; c.lineWidth = 3;
        c.beginPath(); c.arc(256, 256, 244, 0, Math.PI * 2); c.stroke();
        for (let deg = 0; deg < 360; deg += 5) {
          const a = (deg - 90) * Math.PI / 180;
          const major = deg % 30 === 0, mid = deg % 10 === 0;
          const r1 = major ? 218 : (mid ? 228 : 236);
          c.strokeStyle = major ? '#1b2430' : '#5b6675';
          c.lineWidth = major ? 4 : (mid ? 2.4 : 1.2);
          c.beginPath();
          c.moveTo(256 + Math.cos(a) * 244, 256 + Math.sin(a) * 244);
          c.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1);
          c.stroke();
          if (major) {
            c.save();
            c.translate(256 + Math.cos(a) * 192, 256 + Math.sin(a) * 192);
            c.rotate(a + Math.PI / 2);
            c.fillStyle = '#1b2430'; c.font = 'bold 22px Inter, system-ui, sans-serif';
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(String(deg), 0, 0);
            c.restore();
          }
        }
        c.fillStyle = '#28313c'; c.font = 'bold 20px Inter, system-ui, sans-serif';
        c.textAlign = 'center'; c.fillText('PROTRACTOR', 256, 256);
      });
    }

    function createLaserBench() {
      const group = new THREE.Group();
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 96), MAT.white());
      table.position.y = 0.03;
      table.receiveShadow = true;
      group.add(table);
      const pt = makeProtractorTexture();
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.92, 96), new THREE.MeshBasicMaterial({ map: pt.tex, transparent: true }));
      face.rotation.x = -Math.PI / 2;
      face.position.y = 0.062;
      group.add(face);
      return { group, table, face, texture: pt };
    }

    function createLaserSource() {
      const group = new THREE.Group();
      const body = rbox(1.1, 0.30, 0.32, 0.06, MAT.dark(), 3);
      body.position.y = 0.15;
      group.add(body);
      for (let i = 0; i < 5; i++) {
        const fin = rbox(0.018, 0.34, 0.30, 0.008, MAT.aluminium(), 2);
        fin.position.set(-0.38 + i * 0.10, 0.15, 0);
        group.add(fin);
      }
      const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.10, 24), MAT.steel());
      nose.rotation.z = Math.PI / 2;
      nose.position.x = 0.58; nose.position.y = 0.15;
      group.add(nose);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), lensMat);
      lens.position.set(0.635, 0.15, 0);
      lens.rotation.y = Math.PI / 2;
      group.add(lens);
      return { group, body, lens };
    }

    function createLauncher() {
      const group = new THREE.Group();
      const base = rbox(0.95, 0.18, 0.72, 0.06, MAT.dark(), 4);
      base.position.y = 0.09;
      group.add(base);
      const plate = rbox(0.80, 0.04, 0.60, 0.02, MAT.aluminium(), 2);
      plate.position.y = 0.19;
      group.add(plate);
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.36, 20), MAT.steel());
      column.position.y = 0.38;
      group.add(column);
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.56, 0);
      group.add(pivot);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.85, 28), MAT.steel());
      barrel.rotation.z = -Math.PI / 2;
      barrel.position.x = 0.36;
      barrel.castShadow = true;
      pivot.add(barrel);
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.145, 0.10, 28), MAT.brass());
      muzzle.rotation.z = -Math.PI / 2;
      muzzle.position.x = 0.80;
      pivot.add(muzzle);
      const breech = rbox(0.20, 0.26, 0.26, 0.04, MAT.dark(), 3);
      breech.position.x = -0.05;
      pivot.add(breech);
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12, 1, true), MAT.steel());
      spring.rotation.z = -Math.PI / 2;
      spring.position.x = -0.14;
      pivot.add(spring);
      /* 角度尺 */
      const quad = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.50, 32, 1, 0, Math.PI / 2), MAT.white());
      quad.position.set(0, 0.56, 0.37);
      group.add(quad);
      for (let i = 0; i <= 6; i++) {
        const a = i / 6 * Math.PI / 2;
        const tick = rbox(0.025, 0.006, 0.006, 0.002, MAT.black(), 1);
        tick.position.set(Math.cos(a) * 0.42, 0.56 + Math.sin(a) * 0.42, 0.385);
        tick.rotation.z = a;
        group.add(tick);
      }
      return { group, base, pivot, barrel, muzzle };
    }

    /* ---------- 加熱燈 / 溫室 ---------- */
    /* 真實實驗室 IR 加熱燈：底座 → 後彎鵝頸 → 後方轉軸 → 可俯仰燈頭。
       本地座標：+X = 燈頭後方，-X = 燈頭前方；head 會自動對準 targetVec3。 */
    function createIRHeatLamp(posX, posZ, targetVec3, opts = {}) {
      const root = new THREE.Group();
      root.position.set(posX, 0, posZ);

      const baseMat = new THREE.MeshPhysicalMaterial({
        color: 0x1b232c, metalness: 0.76, roughness: 0.34,
        clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.95
      });
      const chromeMat = new THREE.MeshPhysicalMaterial({
        color: 0xd7dde5, metalness: 0.95, roughness: 0.16, envMapIntensity: 1.3
      });

      /* 1. 加重底座：橡膠防滑環 + 階梯鑄鐵盤 + 頂部套環 */
      const rubberRing = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.56, 0.035, 48), MAT.rubber());
      rubberRing.position.y = 0.0175;
      rubberRing.receiveShadow = true;
      root.add(rubberRing);
      const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.12, 48), baseMat);
      baseDisc.position.y = 0.095;
      baseDisc.castShadow = true; baseDisc.receiveShadow = true;
      root.add(baseDisc);
      const baseStep = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.36, 0.08, 32), chromeMat);
      baseStep.position.y = 0.195;
      baseStep.castShadow = true;
      root.add(baseStep);
      const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.16, 24), chromeMat);
      baseCollar.position.y = 0.275;
      root.add(baseCollar);

      /* 2. 鵝頸：從底座中心往 +X（後方）微彎，再回到燈頭後方轉軸 */
      const pivot = new THREE.Vector3(0.22, 3.05, 0);
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.00, 0.34, 0),
        new THREE.Vector3(0.14, 1.15, 0),
        new THREE.Vector3(0.36, 2.22, 0),
        new THREE.Vector3(0.30, 2.86, 0),
        new THREE.Vector3(0.22, 3.05, 0)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 48, 0.045, 12, false), chromeMat);
      arm.castShadow = true;
      root.add(arm);

      /* 頂端球型轉軸：只接觸燈頭後方，不會穿進反光罩 */
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), baseMat);
      joint.position.copy(pivot);
      joint.castShadow = true;
      root.add(joint);

      /* 3. 可俯仰燈頭，對準目標 */
      const head = new THREE.Group();
      head.position.copy(pivot);
      const worldPivot = new THREE.Vector3(posX, 0, posZ).add(pivot);
      const toTarget = targetVec3.clone().sub(worldPivot);
      const horizontal = Math.max(0.12, Math.hypot(toTarget.x, toTarget.z));
      head.rotation.order = 'XYZ';
      head.rotation.y = Math.atan2(toTarget.z, -toTarget.x);
      head.rotation.z = THREE.MathUtils.clamp(Math.atan2(-toTarget.y, horizontal), 0.08, 1.15);
      root.add(head);

      /* 4. 後方陶瓷/金屬燈座（+X），有散熱鰭片 */
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.50, 28), baseMat);
      socket.rotation.z = Math.PI / 2;
      socket.position.set(0.30, 0, 0);
      socket.castShadow = true;
      head.add(socket);
      for (let i = 0; i < 3; i++) {
        const fin = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.014, 6, 28), chromeMat);
        fin.rotation.y = Math.PI / 2;
        fin.position.set(0.15 + i * 0.12, 0, 0);
        head.add(fin);
      }
      const ceramicCap = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.145, 0.09, 24), MAT.ceramic());
      ceramicCap.rotation.z = Math.PI / 2;
      ceramicCap.position.set(0.565, 0, 0);
      head.add(ceramicCap);

      /* 5. 拋物面反光罩：窄口接燈座，開口朝 -X；外深色、內亮銀 */
      const profile = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        profile.push([0.11 + t * 0.48, t * 0.64]);
      }
      const shadeGeo = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), 48);
      const shadeOuterMat = new THREE.MeshPhysicalMaterial({
        color: 0x2b3542, metalness: 0.92, roughness: 0.26,
        side: THREE.FrontSide, envMapIntensity: 1.15
      });
      const shadeInnerMat = new THREE.MeshPhysicalMaterial({
        color: 0xf2f5f9, metalness: 0.98, roughness: 0.07,
        side: THREE.BackSide, envMapIntensity: 1.5
      });
      const shade = new THREE.Mesh(shadeGeo, shadeOuterMat);
      shade.rotation.z = Math.PI / 2;
      shade.position.x = 0.07;
      shade.castShadow = true;
      head.add(shade);
      const shadeInner = new THREE.Mesh(shadeGeo, shadeInnerMat);
      shadeInner.rotation.z = Math.PI / 2;
      shadeInner.position.x = 0.07;
      shadeInner.scale.setScalar(0.992);
      head.add(shadeInner);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.018, 8, 48), chromeMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.x = -0.57;
      head.add(rim);

      /* 6. IR 燈泡：完全縮在反光罩內，前方無遮蔽 */
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff8a1e, toneMapped: false, transparent: true, opacity: 0.96 });
      const bulbCore = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), bulbMat);
      bulbCore.position.set(-0.30, 0, 0);
      head.add(bulbCore);
      const bulbGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 24, 18),
        new THREE.MeshPhysicalMaterial({
          color: 0xffb060, transparent: true, opacity: 0.22,
          roughness: 0.08, metalness: 0.0, transmission: 0.4,
          depthWrite: false, envMapIntensity: 1.2
        })
      );
      bulbGlass.position.copy(bulbCore.position);
      head.add(bulbGlass);
      const lampLight = new THREE.PointLight(0xff8a3a, 3.0, 5.5, 2);
      lampLight.position.set(-0.26, 0, 0);
      head.add(lampLight);

      /* 7. 與燈頭同軸的光錐：尖端在燈泡前，底面朝目標展開 */
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffd080, transparent: true, opacity: 0.09,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        depthWrite: false, toneMapped: false
      });
      const beam = new THREE.Mesh(new THREE.ConeGeometry(1.45, 3.8, 32, 1, true), beamMat);
      /* 尖端在 -X 方向：Cone 的 +Y 尖端經 -90° Z 旋轉後朝 +X，故整體中心放負 X */
      beam.rotation.z = -Math.PI / 2;
      /* 光錐尖端在前 rim（x≈-0.60），不包住燈泡或穿入燈座 */
      beam.position.set(-2.50, 0, 0);
      beam.renderOrder = 4;
      head.add(beam);

      return {
        group: root, head, socket, shade, shadeInner, bulb: bulbCore, bulbGlass,
        beam, light: lampLight, arm, base: baseDisc, pivot
      };
    }

    function makeAluFrameBar(a, b, r = 0.028) {
      return barBetween(a, b, r, MAT.aluminium(), 8);
    }

    function createGreenhouse(w = 2.0, h = 1.6, d = 2.0, roofH = 0.8) {
      const group = new THREE.Group();
      const glassMat = MAT.glassThin();
      const walls = rbox(w, h, d, 0.03, glassMat, 3);
      walls.position.y = h / 2;
      group.add(walls);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2, roofH, 4), glassMat);
      roof.position.y = h + roofH / 2;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      /* 鋁合金框架 */
      const y0 = 0.04, y1 = h, apex = new THREE.Vector3(0, h + roofH, 0);
      const corners = [
        new THREE.Vector3(-w / 2, y0, -d / 2), new THREE.Vector3(w / 2, y0, -d / 2),
        new THREE.Vector3(w / 2, y0, d / 2), new THREE.Vector3(-w / 2, y0, d / 2)
      ];
      for (const c of corners) {
        group.add(makeAluFrameBar(c, new THREE.Vector3(c.x, y1, c.z)));
        group.add(makeAluFrameBar(c, apex, 0.024));
      }
      for (let i = 0; i < 4; i++) {
        const a = corners[i], b = corners[(i + 1) % 4];
        group.add(makeAluFrameBar(new THREE.Vector3(a.x, y1, a.z), new THREE.Vector3(b.x, y1, b.z)));
        group.add(makeAluFrameBar(new THREE.Vector3(a.x, y0, a.z), new THREE.Vector3(b.x, y0, b.z)));
      }
      /* 門框 */
      const door = new THREE.Group();
      const doorW = w * 0.32, doorH = h * 0.78;
      const dz = d / 2 + 0.02;
      const d1 = new THREE.Vector3(-doorW / 2, 0.02, dz), d2 = new THREE.Vector3(doorW / 2, 0.02, dz);
      const d3 = new THREE.Vector3(doorW / 2, doorH, dz), d4 = new THREE.Vector3(-doorW / 2, doorH, dz);
      door.add(makeAluFrameBar(d1, d2, 0.022), makeAluFrameBar(d2, d3, 0.022), makeAluFrameBar(d3, d4, 0.022), makeAluFrameBar(d4, d1, 0.022));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), MAT.brass());
      knob.position.set(doorW * 0.36, doorH * 0.48, dz + 0.035);
      door.add(knob);
      group.add(door);
      /* 基座 */
      const plinth = rbox(w + 0.14, 0.08, d + 0.14, 0.03, MAT.dark(), 3);
      plinth.position.y = 0.04;
      group.add(plinth);
      return { group, walls, roof, door };
    }

    /* ---------- 線材 / 導線 ---------- */
    function createWire(points, color, radius = 0.035) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
      const mat = new THREE.MeshPhysicalMaterial({
        color, metalness: 0.05, roughness: 0.48, clearcoat: 0.35
      });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 54, radius, 8, false), mat);
      mesh.castShadow = true;
      return mesh;
    }

    function createBeamMesh(color, radius = 0.035) {
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.28,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      });
      const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 8, 1, true), mat);
      m.renderOrder = 6;
      return m;
    }

    function setBeamMesh(mesh, start, end) {
      if (!mesh) return;
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = Math.max(0.001, dir.length());
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      mesh.scale.set(1, len, 1);
    }

    /* ---------- 實驗桌 ---------- */
    function addGround() {
      const light = root.dataset.theme === 'light';
      const group = new THREE.Group();
      group.name = 'lab-ground';
      const topMat = new THREE.MeshPhysicalMaterial({
        color: light ? 0x2f3945 : 0x0d141b,
        metalness: 0.12, roughness: 0.52,
        clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.8
      });
      const bench = rbox(26, 0.55, 18, 0.14, topMat, 4);
      bench.position.y = -0.625;
      bench.receiveShadow = true;
      group.add(bench);
      /* 桌下暗色地面，讓桌面邊緣不會浮在背景中 */
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 90),
        new THREE.MeshPhysicalMaterial({
          color: light ? 0x1a2430 : 0x06090d,
          roughness: 0.82, metalness: 0.05, envMapIntensity: 0.5
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.05;
      floor.receiveShadow = true;
      group.add(floor);
      /* 細刻度網格 */
      const grid = new THREE.GridHelper(25, 50, light ? 0x8a9aac : 0x5f7085, light ? 0xb6c2cf : 0x2a3644);
      grid.position.y = -0.342;
      grid.material.transparent = true;
      grid.material.opacity = light ? 0.22 : 0.18;
      group.add(grid);
      group.userData.grid = grid;
      group.userData.topMat = topMat;
      group.userData.floorMat = floor.material;
      root3d.add(group);
      return group;
    }

    /* 共用 3D 實驗室溫度計建構與動態更新工具（含透明玻璃管、背板刻度、防穿模液柱） */
    function createLabThermometer(x, y, z, liquidColor = 0xff3b30, height = 1.8) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);

      /* 底部感溫液泡 (Bulb) */
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 20, 16),
        new THREE.MeshStandardMaterial({ color: liquidColor, metalness: 0.2, roughness: 0.25 })
      );
      bulb.position.y = 0;
      bulb.castShadow = true;
      grp.add(bulb);

      /* 連結頸部 */
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.06, 0.12, 16),
        new THREE.MeshBasicMaterial({ color: liquidColor })
      );
      neck.position.y = 0.08;
      grp.add(neck);

      /* 內部酒精/水銀液柱 (基礎高度 1.0，完全包覆於玻璃管中心) */
      const merc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 1.0, 16),
        new THREE.MeshBasicMaterial({ color: liquidColor })
      );
      merc.scale.y = 0.1;
      merc.position.y = 0.1 + 0.05;
      grp.add(merc);

      /* 半透明玻璃毛細管外殼 */
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xf2f8ff,
        metalness: 0.0,
        roughness: 0.06,
        transparent: true,
        opacity: 0.34,
        transmission: 0.18,
        ior: 1.5,
        thickness: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        envMapIntensity: 1.2
      });
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.062, height, 20),
        glassMat
      );
      tube.position.y = height / 2 + 0.05;
      grp.add(tube);

      /* 頂部圓頭玻璃封口 */
      const topCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.062, 16, 12),
        glassMat
      );
      topCap.position.y = height + 0.05;
      grp.add(topCap);
      /* 黃銅頂帽與底部金屬箍 */
      const brassCap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.08, 16), MAT.brass());
      brassCap.position.y = height + 0.09;
      grp.add(brassCap);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 20), MAT.brass());
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.10;
      grp.add(collar);

      /* 白色刻度背板與刻度線 */
      const backPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, height - 0.16, 0.012),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
      );
      backPlate.position.set(0, height / 2 + 0.05, -0.022);
      grp.add(backPlate);

      const tickMatRed = new THREE.MeshBasicMaterial({ color: 0xd92d20 });
      const tickMatDark = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const numTicks = 15;
      for (let i = 0; i <= numTicks; i++) {
        const isMajor = (i % 5 === 0);
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(isMajor ? 0.055 : 0.032, 0.01, 0.015),
          isMajor ? tickMatRed : tickMatDark
        );
        const ty = 0.18 + (i / numTicks) * (height - 0.28);
        tick.position.set(0.015, ty, 0.048);
        grp.add(tick);
      }

      return { group: grp, mercury: merc, maxH: height - 0.22 };
    }

    function updateLabThermometer(th, T_kelvin, minK = 273, maxK = 373) {
      if (!th || !th.mercury) return;
      const frac = Math.max(0.04, Math.min(0.98, (T_kelvin - minK) / Math.max(1, maxK - minK)));
      const maxH = th.maxH || 1.58;
      const h = frac * maxH;
      th.mercury.scale.y = h;
      th.mercury.position.y = 0.08 + h / 2;
    }

    function mountSimulatorDOM(container) {
      ensureThreeEngine();
      activeContainer = container;
      container.innerHTML = `
        <section id="sim" class="on">
          <div id="sim-layout">
            <aside id="sidebar"></aside>
            <div id="stage">
              <div id="viewport">
                <div id="view-switch" class="overlay">
                  <button data-view="3d" class="on" data-i18n="view3d">${t('view3d')}</button>
                  <button data-view="front" data-i18n="viewFront">${t('viewFront')}</button>
                  <button data-view="vector" data-i18n="viewVector">${t('viewVector')}</button>
                </div>
                <div id="hud" class="overlay"></div>
                <div id="legend" class="overlay"></div>
                <div id="hint" class="overlay" data-i18n="hint">${t('hint')}</div>
                <div id="fallback" class="overlay" data-i18n="loadFail" style="display:${THREE ? 'none' : 'grid'}">${t('loadFail')}</div>
              </div>
              <div id="graph-panel">
                <div id="graph-bar">
                  <button class="btn primary" id="play-btn" type="button">⏸ <span data-i18n="pause">${t('pause')}</span></button>
                  <button class="btn rec" id="rec-btn" type="button">● <span data-i18n="rec">${t('rec')}</span></button>
                  <button class="btn" id="clear-btn" type="button" data-i18n="clear">${t('clear')}</button>
                  <div class="vsep"></div>
                  <select id="speed-sel">
                    <option value="0.25">0.25×</option>
                    <option value="0.5">0.5×</option>
                    <option value="1" selected>1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                  </select>
                  <select id="gtype-sel"></select>
                  <div class="spacer" style="flex:1"></div>
                  <span id="graph-info"></span>
                  <span id="ptcount"></span>
                </div>
                <div id="graph-wrap"><canvas id="graph-canvas"></canvas></div>
              </div>
            </div>
          </div>
        </section>
      `;

      vp = container.querySelector('#viewport');
      if (canvas3 && vp) {
        vp.insertBefore(canvas3, vp.firstChild);
      }
      gCanvas = container.querySelector('#graph-canvas');
      gCtx = gCanvas ? gCanvas.getContext('2d') : null;
      ptCountEl = container.querySelector('#ptcount');
      gInfoEl = container.querySelector('#graph-info');

      container.querySelector('#view-switch').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (b) setViewMode(b.dataset.view);
      });

      container.querySelector('#play-btn').addEventListener('click', () => {
        if (!currentExp) return;
        currentExp.playing = !currentExp.playing;
        refreshPlayBtn();
      });

      container.querySelector('#rec-btn').addEventListener('click', () => {
        if (!currentExp) return;
        const gcfg = typeof currentExp.graph === 'function' ? currentExp.graph.call(currentExp) : currentExp.graph;
        if (!gcfg || !gcfg.types) return;
        const type = gcfg.types[gcfg.activeType || 0];
        if (!type.current) return;
        const c = type.current.call(currentExp);
        if (c && isFinite(c.x) && isFinite(c.y)) {
          marks.push({ x: c.x, y: c.y });
          try {
            localStorage.setItem(marksKey(currentExp.id), JSON.stringify(marks.slice(-50)));
          } catch (err) {}
          updatePtCount();
        }
      });

      container.querySelector('#clear-btn').addEventListener('click', () => {
        marks = [];
        trail = [];
        if (currentExp) {
          try { localStorage.removeItem(marksKey(currentExp.id)); } catch (err) {}
        }
        updatePtCount();
      });

      container.querySelector('#gtype-sel').addEventListener('change', e => {
        if (!currentExp) return;
        const gcfg = typeof currentExp.graph === 'function' ? currentExp.graph.call(currentExp) : currentExp.graph;
        if (!gcfg) return;
        gcfg.activeType = parseInt(e.target.value, 10) || 0;
        trail = [];
        marks = [];
        updatePtCount();
        drawGraph();
      });

      container.querySelector('#sidebar').addEventListener('click', e => {
        const btn = e.target.closest('[data-lock]');
        if (!btn || !currentExp) return;
        const id = btn.dataset.lock;
        if (!currentExp._locks) currentExp._locks = {};
        const def = currentExp.variables.find(v => v.id === id);
        const currentLock = currentExp._locks[id] !== undefined
          ? currentExp._locks[id]
          : !!(def && def.locked);
        currentExp._locks[id] = !currentLock;
        renderSidebar();
      });

      if (resizeObs) resizeObs.disconnect();
      resizeObs = new ResizeObserver(resizeCanvas);
      resizeObs.observe(vp);
    }

    function resizeCanvas() {
      if (!vp || !renderer || !camera) return;
      const w = vp.clientWidth, h = vp.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const gWrap = activeContainer ? activeContainer.querySelector('#graph-wrap') : null;
      if (gWrap && gCanvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        gCanvas.width = Math.round(gWrap.clientWidth * dpr);
        gCanvas.height = Math.round(gWrap.clientHeight * dpr);
        gCanvas.style.width = gWrap.clientWidth + 'px';
        gCanvas.style.height = gWrap.clientHeight + 'px';
      }
      drawGraph();
    }
    window.addEventListener('resize', resizeCanvas);

    function setViewMode(mode) {
      viewMode = mode;
      if (!activeContainer) return;
      activeContainer.querySelectorAll('#view-switch button').forEach(b =>
        b.classList.toggle('on', b.dataset.view === mode));
      if (!currentExp || !controls || !camera) return;
      if (mode === 'front' && currentExp.camFront) {
        controls.enableRotate = false;
        camAnim = {
          fromPos: camera.position.clone(),
          toPos: new THREE.Vector3(...currentExp.camFront.pos),
          fromTgt: controls.target.clone(),
          toTgt: new THREE.Vector3(...currentExp.camFront.tgt),
          t: 0
        };
      } else {
        controls.enableRotate = true;
      }
      const leg = activeContainer.querySelector('#legend');
      if (leg) {
        if (mode === 'vector' && currentExp.vectorLegend && currentExp.vectorLegend.length) {
          leg.innerHTML = currentExp.vectorLegend.map(v =>
            `<div class="leg-row"><div class="leg-dot" style="background:${v[1]}"></div>${T(v[0])}</div>`
          ).join('');
          leg.classList.add('show');
        } else {
          leg.classList.remove('show');
        }
      }
    }

    function setCamera3D(pos, tgt) {
      if (!camera || !controls) return;
      camera.position.set(...pos);
      controls.target.set(...tgt);
      controls.update();
    }

    /* ---------- Shared Sidebar Helpers ---------- */
    function sliderHTML(id, label, min, max, step, val, unit, locked) {
      const v = typeof val === 'number' ? +val.toFixed(4) : val;
      const hasLock = locked !== undefined;
      let isLocked = false;
      if (hasLock) {
        const locks = currentExp && currentExp._locks;
        isLocked = (locks && locks[id] !== undefined) ? locks[id] : !!locked;
      }
      const lockBtn = hasLock
        ? ` <button class="lock-btn ${isLocked ? 'on' : ''}" data-lock="${id}" type="button" title="Lock / unlock">${isLocked ? '🔒' : '🔓'}</button>`
        : '';
      return `<div class="slider-row">
        <div class="slider-head">
          <span class="slider-label">${label}${lockBtn}</span>
          <span class="slider-val" id="sv-${id}">${v}${unit||''}</span>
        </div>
        <input type="range" id="sl-${id}" min="${min}" max="${max}" step="${step}" value="${v}" ${isLocked?'disabled':''}>
      </div>`;
    }

    function bindSliders(el, defs, state, onChange) {
      defs.forEach(v => {
        const inp = el.querySelector('#sl-'+v.id);
        if (!inp) return;
        inp.addEventListener('input', e => {
          const val = parseFloat(e.target.value);
          state[v.id] = val;
          const lab = el.querySelector('#sv-'+v.id);
          if (lab) lab.textContent = +val.toFixed(4) + (v.unit || '');
          if (onChange) onChange(v.id, val);
        });
      });
    }

    function chkHTML(id, label, on) {
      const saved = currentExp && currentExp.equip ? currentExp.equip[id] : undefined;
      const isOn = saved === undefined ? !!on : (saved !== false);
      return `<div class="chk-item ${isOn?'on':''}" data-eq="${id}"><div class="chk-box">✓</div><span>${label}</span></div>`;
    }

    function bindChks(el, defs, state, onToggle) {
      defs.forEach(v => {
        const item = el.querySelector(`[data-eq="${v.id}"]`);
        if (!item) return;
        item.addEventListener('click', () => {
          const nowOn = !item.classList.contains('on');
          item.classList.toggle('on', nowOn);
          state[v.id] = nowOn;
          if (onToggle) onToggle(v.id, nowOn);
        });
      });
    }

    function renderSidebar() {
      if (!currentExp || !activeContainer) return;
      const sb = activeContainer.querySelector('#sidebar');
      if (!sb) return;
      const html = typeof currentExp.sidebar === 'function' ? currentExp.sidebar.call(currentExp) : '';
      sb.innerHTML = html;
      if (typeof currentExp.bindSidebar === 'function') currentExp.bindSidebar.call(currentExp, sb);
    }

    function renderHUD() {
      if (!currentExp || !activeContainer) return;
      const hud = activeContainer.querySelector('#hud');
      if (!hud) return;
      const rows = typeof currentExp.hud === 'function' ? currentExp.hud.call(currentExp) : [];
      hud.innerHTML = rows.map(r => r[0] === ''
        ? '<div class="hud-sep"></div>'
        : `<div class="hud-row"><span>${trLabel(HUD_I18N, r[0])}</span><span${r[2]?' class="hud-big"':''}>${trLabel(HUD_VALUE_I18N, r[1])}</span></div>`
      ).join('');
    }

    function updatePtCount() {
      if (ptCountEl) ptCountEl.innerHTML = `${t('points')}: <b>${marks.length}</b>`;
    }

    function refreshPlayBtn() {
      if (!activeContainer || !currentExp) return;
      const btn = activeContainer.querySelector('#play-btn');
      if (!btn) return;
      btn.innerHTML = currentExp.playing
        ? `⏸ <span>${t('pause')}</span>`
        : `▶ <span>${t('play')}</span>`;
      btn.classList.toggle('primary', currentExp.playing);
    }

    function populateGraphSelect() {
      if (!activeContainer) return;
      const sel = activeContainer.querySelector('#gtype-sel');
      if (!sel) return;
      sel.innerHTML = '';
      if (!currentExp) return;
      const gcfg = typeof currentExp.graph === 'function' ? currentExp.graph.call(currentExp) : currentExp.graph;
      if (!gcfg || !gcfg.types) return;
      gcfg.types.forEach((tp, i) => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = T(tp.label);
        if (i === (gcfg.activeType || 0)) o.selected = true;
        sel.appendChild(o);
      });
    }

    function drawGraph() {
      if (!currentExp || !activeContainer || !gCanvas || !gCtx) return;
      const gPanel = activeContainer.querySelector('#graph-panel');
      const gcfg = typeof currentExp.graph === 'function' ? currentExp.graph.call(currentExp) : currentExp.graph;
      if (!gcfg || !gcfg.types) {
        if (gPanel) gPanel.classList.add('hide');
        return;
      }
      if (gPanel) gPanel.classList.remove('hide');

      const type = gcfg.types[gcfg.activeType || 0];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = gCanvas.width / dpr;
      const H = gCanvas.height / dpr;
      if (!W || !H) return;
      gCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gCtx.clearRect(0, 0, W, H);

      const pad = { l: 62, r: 20, t: 16, b: 34 };
      const pw = W - pad.l - pad.r;
      const ph = H - pad.t - pad.b;
      if (pw < 20 || ph < 20) return;

      const xMax = type.xMax || 10;
      const yTarget = gcfg.yMax ? gcfg.yMax.call(currentExp) : 100;
      yMaxSmooth += (yTarget - yMaxSmooth) * 0.1;
      const yMax = Math.max(1, yMaxSmooth);

      const X = v => pad.l + Math.max(0, Math.min(1, v / xMax)) * pw;
      const Y = v => pad.t + ph - Math.max(0, Math.min(1, v / yMax)) * ph;

      const themeLight = root.dataset.theme === 'light';
      gCtx.strokeStyle = themeLight ? 'rgba(120,140,170,.22)' : 'rgba(140,160,190,.15)';
      gCtx.lineWidth = 1;
      gCtx.font = '10px Inter, system-ui, sans-serif';
      gCtx.fillStyle = themeLight ? '#5d6b7c' : 'rgba(140,160,190,.75)';
      for (let i = 0; i <= 5; i++) {
        const x = pad.l + (i / 5) * pw;
        gCtx.beginPath(); gCtx.moveTo(x, pad.t); gCtx.lineTo(x, pad.t + ph); gCtx.stroke();
        gCtx.textAlign = 'center'; gCtx.textBaseline = 'top';
        gCtx.fillText((xMax * i / 5).toFixed(type.xFmt ?? 1), x, pad.t + ph + 7);
      }
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + ph - (i / 4) * ph;
        gCtx.beginPath(); gCtx.moveTo(pad.l, y); gCtx.lineTo(pad.l + pw, y); gCtx.stroke();
        gCtx.textAlign = 'right'; gCtx.textBaseline = 'middle';
        gCtx.fillText((yMax * i / 4).toFixed(type.yFmt ?? 0), pad.l - 8, y);
      }

      gCtx.strokeStyle = themeLight ? '#c0cddc' : 'rgba(140,160,190,.55)';
      gCtx.lineWidth = 1.4;
      gCtx.beginPath();
      gCtx.moveTo(pad.l, pad.t); gCtx.lineTo(pad.l, pad.t + ph); gCtx.lineTo(pad.l + pw, pad.t + ph);
      gCtx.stroke();

      gCtx.fillStyle = themeLight ? '#16202c' : 'rgba(180,200,225,.9)';
      gCtx.font = '11px Inter, system-ui, sans-serif';
      gCtx.textAlign = 'center'; gCtx.textBaseline = 'bottom';
      gCtx.fillText(trLabel(AXIS_I18N, type.xLabel), pad.l + pw / 2, H - 4);
      gCtx.save();
      gCtx.translate(14, pad.t + ph / 2); gCtx.rotate(-Math.PI / 2);
      gCtx.textBaseline = 'top';
      gCtx.fillText(trLabel(AXIS_I18N, type.yLabel), 0, 0);
      gCtx.restore();

      if (trail.length > 1) {
        gCtx.strokeStyle = '#4da3ff';
        gCtx.lineWidth = 2;
        gCtx.lineJoin = 'round';
        gCtx.beginPath();
        let started = false;
        for (const d of trail) {
          if (d.x > xMax || d.y > yMax || !isFinite(d.x) || !isFinite(d.y)) { started = false; continue; }
          const px = X(d.x), py = Y(d.y);
          if (!started) { gCtx.moveTo(px, py); started = true; }
          else gCtx.lineTo(px, py);
        }
        gCtx.stroke();
      }

      for (const m of marks) {
        if (m.x > xMax || m.y > yMax || !isFinite(m.x) || !isFinite(m.y)) continue;
        gCtx.beginPath();
        gCtx.arc(X(m.x), Y(m.y), 4.5, 0, Math.PI * 2);
        gCtx.fillStyle = '#2ec4a6';
        gCtx.fill();
        gCtx.lineWidth = 1.8;
        gCtx.strokeStyle = themeLight ? '#ffffff' : '#0f1620';
        gCtx.stroke();
      }

      if (marks.length >= 2) {
        let sx=0, sy=0, sxx=0, sxy=0;
        const n = marks.length;
        for (const m of marks) { sx += m.x; sy += m.y; sxx += m.x*m.x; sxy += m.x*m.y; }
        const denom = n*sxx - sx*sx;
        if (Math.abs(denom) > 1e-6) {
          const slope = (n*sxy - sx*sy) / denom;
          const intercept = (sy - slope*sx) / n;
          const x0 = 0, x1 = xMax;
          const y0 = slope*x0 + intercept, y1 = slope*x1 + intercept;
          if (y0 > -yMax && y1 > -yMax) {
            gCtx.strokeStyle = 'rgba(167,139,250,.75)';
            gCtx.lineWidth = 1.5;
            gCtx.setLineDash([6, 5]);
            gCtx.beginPath();
            gCtx.moveTo(X(x0), Y(Math.max(0,y0)));
            gCtx.lineTo(X(x1), Y(Math.max(0,y1)));
            gCtx.stroke();
            gCtx.setLineDash([]);
          }
          const unit = type.slopeUnit || '';
          if (gInfoEl) gInfoEl.innerHTML = `${t('slope')}: <b>${slope.toFixed(3)}</b> ${unit}`;
        }
      } else if (gInfoEl) {
        gInfoEl.textContent = '';
      }

      if (type.current) {
        const c = type.current.call(currentExp);
        if (c && c.x <= xMax && c.y <= yMax && isFinite(c.x) && isFinite(c.y)) {
          gCtx.beginPath();
          gCtx.arc(X(c.x), Y(c.y), 6, 0, Math.PI * 2);
          gCtx.fillStyle = '#4da3ff';
          gCtx.fill();
          gCtx.lineWidth = 2.5;
          gCtx.strokeStyle = themeLight ? '#ffffff' : '#0f1620';
          gCtx.stroke();
        }
      }
    }

    function applyTheme() {
      if (!scene || !hemiLight || !keyLight) return;
      const light = root.dataset.theme === 'light';
      scene.background = new THREE.Color(light ? 0xe4ebf4 : 0x0f1620);
      hemiLight.intensity = light ? 1.5 : 1.15;
      keyLight.intensity = light ? 2.6 : 2.2;
      /* 實驗桌與刻度網格跟隨主題（場景是後建的，不能只在 addGround 時決定） */
      if (root3d) {
        const ground = root3d.children.find(o => o.name === 'lab-ground');
        if (ground) {
          const tm = ground.userData.topMat;
          if (tm && tm.color) { tm.color.setHex(light ? 0x2f3945 : 0x0d141b); tm.needsUpdate = true; }
          const grid = ground.userData.grid;
          if (grid && grid.material) { grid.material.opacity = light ? 0.22 : 0.18; }
          const fm = ground.userData.floorMat;
          if (fm && fm.color) { fm.color.setHex(light ? 0x1a2430 : 0x06090d); fm.needsUpdate = true; }
        }
      }
      if (currentExp && typeof currentExp.refreshTheme === 'function') {
        currentExp.refreshTheme.call(currentExp);
      }
      drawGraph();
    }

    function setLang(newLang) {
      lang = (newLang === 'en') ? 'en' : 'tc';
      if (!activeContainer) return;
      activeContainer.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
      });
      if (currentExp) {
        renderSidebar();
        renderHUD();
        refreshPlayBtn();
        setViewMode(viewMode);
        populateGraphSelect();
        if (typeof currentExp._drawPlate === 'function') currentExp._drawPlate();
      }
      updatePtCount();
    }

    if (window.PhyVerse) {
      window.PhyVerse.onThemeChange(v => {
        document.documentElement.setAttribute('data-theme', v);
        applyTheme();
      });
      window.PhyVerse.onLangChange(v => {
        setLang(v === 'en' ? 'en' : 'tc');
      });
    }

    /* ---------- Drag-to-orbit + Drag-draggables ---------- */
    const raycaster = THREE ? new THREE.Raycaster() : null;
    const ndc = THREE ? new THREE.Vector2() : null;
    let draggingObj = false;
    let dragStartY = 0;
    let dragPointerId = null;

    function pointerToNDC(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }

    document.addEventListener('pointerdown', e => {
      if (!currentExp || !renderer || !raycaster) return;
      if (e.target !== renderer.domElement) return;
      if (e.button !== 0) return;
      const draggables = typeof currentExp.draggables === 'function' ? currentExp.draggables.call(currentExp) : [];
      if (!draggables || !draggables.length) return;
      pointerToNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(draggables, true);
      if (hits.length) {
        draggingObj = true;
        dragPointerId = e.pointerId;
        dragStartY = e.clientY;
        controls.enabled = false;
        if (typeof currentExp.onDragStart === 'function') currentExp.onDragStart.call(currentExp);
        renderer.domElement.style.cursor = 'grabbing';
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    window.addEventListener('pointermove', e => {
      if (!currentExp || !renderer || !raycaster) return;
      if (draggingObj && e.pointerId === dragPointerId) {
        const dy = e.clientY - dragStartY;
        if (typeof currentExp.onDragMove === 'function') currentExp.onDragMove.call(currentExp, dy);
        e.preventDefault();
        return;
      }
      if (e.target !== renderer.domElement) return;
      const draggables = typeof currentExp.draggables === 'function' ? currentExp.draggables.call(currentExp) : [];
      if (!draggables || !draggables.length) return;
      pointerToNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(draggables, true);
      renderer.domElement.style.cursor = hits.length ? 'grab' : '';
    });

    function endDrag(e) {
      if (!draggingObj || e.pointerId !== dragPointerId) return;
      draggingObj = false;
      dragPointerId = null;
      if (controls) controls.enabled = true;
      if (typeof currentExp?.onDragEnd === 'function') currentExp.onDragEnd.call(currentExp);
      if (renderer) renderer.domElement.style.cursor = '';
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* ---------- 15 個 3D 實驗專屬評分引擎 (score wrapper) ---------- */
    function evaluateExperimentScore(exp) {
      const isEn = (lang === 'en');
      if (exp.id === 'dimension') {
        const f = exp.formulas[exp.vars.idx | 0] || exp.formulas[0];
        return {
          score: 95,
          measured: f.OK ? 1.0 : 0.0,
          expected: 1.0,
          unit: 'dim',
          errorPct: 0.0,
          advice: isEn
            ? ['Formula inspected: ' + f.eq, 'Both LHS (' + f.LHS + ') and RHS must share identical SI base units.']
            : ['已檢查公式：' + f.eq, '方程式左右兩邊（LHS: ' + f.LHS + '）必須具備完全相同的基本 SI 單位。']
        };
      }

      if (marks.length < 3) {
        return {
          error: isEn
            ? 'Please click the green "● Record" button on the graph bar to record at least 3 data points before submitting!'
            : '請先在下方圖表工具列點擊綠色「● 記錄」按鈕，記錄至少 3 個資料點再提交評分！'
        };
      }

      if (exp.id === 'boyle') {
        const expected = exp.vars.n * exp.R * exp.vars.T;
        const products = marks.map(m => {
          const gType = exp.graph.activeType || 0;
          if (gType === 0) return m.x * m.y;
          if (gType === 1) return m.x > 0 ? m.y / m.x : expected;
          return m.y;
        });
        const avg = products.reduce((a, b) => a + b, 0) / products.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: 'J',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Boyle\'s Law: P·V = nRT remains constant at constant temperature.', 'Your recorded P·V average matches theoretical nRT closely.']
            : ['波以耳定律：在恆溫下 P·V = nRT 保持常數。', score >= 80 ? '很好！P·V 乘積非常穩定，符合波以耳定律。' : 'P·V 略有波動，請確保溫度與莫耳數保持鎖定。']
        };
      }

      if (exp.id === 'charles') {
        const expected = (exp.vars.n * exp.R) / (exp.vars.pext);
        const ratios = marks.map(m => {
          const gType = exp.graph.activeType || 0;
          const TK = gType === 1 ? (m.x + 273) : m.x;
          return m.y / Math.max(1, TK);
        });
        const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg * 1000,
          expected: expected * 1000,
          unit: 'mL/K',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Charles\'s Law: V is directly proportional to absolute temperature T (in Kelvin).']
            : ['查理定律：定壓下氣體體積 V 與絕對溫度 T (K) 成正比。', 'V 對 T 圖的斜率等於 nR/P。']
        };
      }

      if (exp.id === 'ohm') {
        const expected = exp.vars.R;
        const gType = exp.graph.activeType || 0;
        const rVals = marks.map(m => gType === 0 ? (m.y / Math.max(1e-6, m.x)) : (m.x / Math.max(1e-6, m.y)));
        const avg = rVals.reduce((a, b) => a + b, 0) / rVals.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: 'Ω',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Ohm\'s Law: V = IR. The slope of V against I gives resistance R.']
            : ['歐姆定律：V = IR。V 對 I 圖線為通過原點的直線，斜率即為電阻 R。']
        };
      }

      if (exp.id === 'hooke') {
        const expected = exp.vars.k;
        const kVals = marks.map(m => {
          const gType = exp.graph.activeType || 0;
          const F = gType === 0 ? (m.x * 9.81) : m.x;
          const xMeter = m.y / 100;
          return xMeter > 1e-4 ? (F / xMeter) : expected;
        });
        const avg = kVals.reduce((a, b) => a + b, 0) / kVals.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: 'N/m',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Hooke\'s Law: F = kx within the elastic limit.']
            : ['虎克定律：在彈性限度內，彈簧伸長量 x 與拉力 F 成正比（k = F/x）。']
        };
      }

      if (exp.id === 'snell') {
        const expected = exp.vars.n2;
        const gType = exp.graph.activeType || 0;
        const nVals = marks.map(m => {
          if (gType === 0) return m.x > 1e-4 ? (m.y / m.x) : expected;
          const s1 = Math.sin(m.y * Math.PI / 180);
          const s2 = Math.sin(m.x * Math.PI / 180);
          return s2 > 1e-4 ? (s1 / s2) : expected;
        });
        const avg = nVals.reduce((a, b) => a + b, 0) / nVals.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: '',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Snell\'s Law: sin θ₁ / sin θ₂ = n₂ / n₁.']
            : ['司乃耳定律：sin θ₁ 對 sin θ₂ 圖的斜率即為折射率 n₂。']
        };
      }

      if (exp.id === 'pendulum') {
        const expected = exp.vars.g;
        const gType = exp.graph.activeType || 0;
        const gVals = marks.map(m => {
          const L = Math.max(0.05, m.x);
          const T2 = gType === 0 ? (m.y * m.y) : m.y;
          return (4 * Math.PI * Math.PI * L) / Math.max(1e-4, T2);
        });
        const avg = gVals.reduce((a, b) => a + b, 0) / gVals.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: 'm/s²',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Simple Pendulum: T² = (4π²/g)L. Plotting T² against L yields a straight line with slope 4π²/g.']
            : ['單擺公式：T² = (4π²/g)L。由 L 與 T 數據可準確推算重力加速度 g。']
        };
      }

      if (exp.id === 'wave') {
        const expected = exp.v();
        const gType = exp.graph.activeType || 0;
        const vVals = marks.map(m => gType === 0 ? (m.y / Math.max(1e-4, m.x)) : m.y);
        const avg = vVals.reduce((a, b) => a + b, 0) / vVals.length;
        const errRatio = Math.abs(avg - expected) / Math.max(1e-6, expected);
        const score = Math.max(60, Math.min(100, Math.round(100 * (1 - errRatio * 2.5))));
        return {
          score,
          measured: avg,
          expected,
          unit: 'm/s',
          errorPct: errRatio * 100,
          advice: isEn
            ? ['Wave on a String: v = fλ = √(T/μ).']
            : ['弦上波公式：v = fλ = √(T/μ)。當張力 T 固定時，f 對 1/λ 的斜率即為波速 v。']
        };
      }

      const lastMark = marks[marks.length - 1];
      const gcfg = typeof exp.graph === 'function' ? exp.graph.call(exp) : exp.graph;
      const type = gcfg.types[gcfg.activeType || 0];
      const cur = type.current ? type.current.call(exp) : lastMark;
      const expectedVal = cur ? cur.y : lastMark.y;
      const measuredVal = lastMark.y;
      const span = Math.abs(lastMark.x - marks[0].x);
      /* yLabel 形如 "T (°C)" / "Range (m)"：只取括號內的單位，避免結果顯示 "20.0 T (°C)" */
      const rawUnit = type.yLabel || '';
      const unitMatch = rawUnit.match(/\(([^()]*)\)\s*$/);
      const unit = unitMatch ? unitMatch[1] : rawUnit;
      /* 此類實驗沒有單一「標準答案」，按數據記錄完整度評分：
         至少 3 點（信心門檻已在上面檢查）、5 點以上滿分，跨度越大越好。 */
      const score = marks.length >= 5 ? 100 : (span > 0.01 ? 92 : 80);
      return {
        score,
        measured: measuredVal,
        expected: measuredVal,
        unit,
        errorPct: 0,
        procedure: true,
        advice: isEn
          ? [
              'Recorded ' + marks.length + ' data points successfully.',
              'This experiment is graded on data collection: at least 3 points are required, and 5 or more earn full marks.',
              span > 0.01 ? 'The data span is good — the trend is clearly visible on the graph.' : 'Try recording at more widely separated values so the trend line is clearer.'
            ]
          : [
              '已成功記錄 ' + marks.length + ' 組實驗數據點。',
              '此實驗以數據記錄完整度評分：至少 3 點，5 點或以上可得滿分。',
              span > 0.01 ? '數據分佈範圍良好，清楚呈現物理量之間的變化趨勢！' : '建議在不同時間或自變數下多記錄幾點，讓趨勢線更明顯。'
            ]
      };
    }

    export function registerExperiments(defs) {
      (defs || []).forEach(function (def) {
        if (!def || !def.id) return;
        const idx = EXPS.findIndex(function (e) { return e.id === def.id; });
        if (idx >= 0) EXPS[idx] = def;
        else EXPS.push(def);
      });
      registerAllToPhyVerse();
    }

    function registerAllToPhyVerse() {
      if (!window.PhyVerse) {
        console.error('[PHY-EXP] window.PhyVerse bridge missing');
        return;
      }
      EXPS.forEach(exp => {
        window.PhyVerse.registerExperiment({
          id: exp.id,
          cat: exp.cat,
          title_zh: exp.title.tc,
          title_en: exp.title.en,
          desc_zh: exp.desc.tc,
          desc_en: exp.desc.en,
          rawExp: exp,
          init(container) {
            mountSimulatorDOM(container);
            currentExp = exp;
            exp.playing = true;
            exp.t = 0;
            if (!exp.equip) exp.equip = {};
            exp.equipment.forEach(e => { if (exp.equip[e.id] === undefined) exp.equip[e.id] = true; });

            clearRoot();
            trail = [];
            marks = [];
            updatePtCount();
            populateGraphSelect();

            setCamera3D(exp.cam3d, [0, 2.5, 0]);
            viewMode = '3d';
            if (controls) controls.enableRotate = true;

            if (typeof exp.init === 'function') exp.init();

            renderSidebar();
            renderHUD();
            refreshPlayBtn();
            resizeCanvas();
          },
          reset() {
            trail = [];
            marks = [];
            updatePtCount();
            if (typeof exp.reset === 'function') exp.reset();
            else if (typeof exp._reset === 'function') exp._reset();
            renderSidebar();
            renderHUD();
            drawGraph();
          },
          destroy() {
            clearRoot();
            if (resizeObs) resizeObs.disconnect();
            currentExp = null;
            activeContainer = null;
            trail = [];
            marks = [];
          },
          score() {
            return evaluateExperimentScore(exp);
          }
        });
      });

      if (typeof window.PhyVerse.renderSelector === 'function') {
        window.PhyVerse.renderSelector();
      }
      console.log('[PHY-EXP Engine] Core ready | Registered 3D experiments:', window.PhyVerse.experiments.length);
    }

    /* ---------- Main Loop ---------- */
    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      let dt = (now - lastT) / 1000;
      lastT = now;
      if (dt > 0.05) dt = 0.05;

      if (camAnim && camera && controls) {
        camAnim.t = Math.min(1, camAnim.t + dt * 2.5);
        const e = 1 - Math.pow(1 - camAnim.t, 3);
        camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, e);
        controls.target.lerpVectors(camAnim.fromTgt, camAnim.toTgt, e);
        if (camAnim.t >= 1) camAnim = null;
      }

      if (currentExp && activeContainer && renderer && scene && camera) {
        const speedSel = activeContainer.querySelector('#speed-sel');
        const speed = speedSel ? (parseFloat(speedSel.value) || 1) : 1;
        const scaledDt = dt * speed;
        if (currentExp.playing && typeof currentExp.update === 'function') {
          const SUB = 3;
          for (let i = 0; i < SUB; i++) currentExp.update(scaledDt / SUB);
        }
        if (typeof currentExp.sync3D === 'function') currentExp.sync3D(scaledDt);

        const gcfg = typeof currentExp.graph === 'function' ? currentExp.graph.call(currentExp) : currentExp.graph;
        if (gcfg && gcfg.types && currentExp.playing) {
          const type = gcfg.types[gcfg.activeType || 0];
          if (type.current) {
            const c = type.current.call(currentExp);
            if (c && isFinite(c.x) && isFinite(c.y)) {
              trail.push({ x:c.x, y:c.y });
              if (trail.length > 1600) trail.shift();
            }
          }
        }
        renderHUD();
        drawGraph();
        if (controls) controls.update();
        renderer.render(scene, camera);
      }
    }
    requestAnimationFrame(loop);


export {
  THREE, I18N, lang, t, T, HUD_I18N, HUD_VALUE_I18N, AXIS_I18N, trLabel,
  renderer, scene, camera, controls, canvas3, gCanvas, gCtx, root3d, activeContainer,
  viewMode, camAnim, trail, marks, yMaxSmooth, currentExp,
  ensureThreeEngine, clearRoot, mountSimulatorDOM, resizeCanvas, setViewMode, setCamera3D,
  applyTheme, setLang, renderSidebar, renderHUD, updatePtCount, refreshPlayBtn,
  populateGraphSelect, drawGraph, addGround, MAT, rbox, lathe, barBetween, makeCanvas,
  slottedMassMesh, createMassStack, addGraduation, createGraduatedCylinder, createPiston,
  createPSU, createMeter, createResistor, createPCB, createRetortStand, helixPoints,
  createHelicalSpring, updateHelicalSpring, makeProtractorTexture, createLaserBench,
  createLaserSource, createLauncher, createIRHeatLamp, makeAluFrameBar, createGreenhouse,
  createWire, createBeamMesh, setBeamMesh, createLabThermometer, updateLabThermometer,
  sliderHTML, bindSliders, chkHTML, bindChks,
  raycaster, ndc, pointerToNDC, endDrag,
};
