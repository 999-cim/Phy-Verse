import {
  THREE, T, t, lang, root3d, camera, viewMode, marks, trail,
  MAT, rbox, lathe, barBetween, makeCanvas, slottedMassMesh, createMassStack,
  addGraduation, createGraduatedCylinder, createPiston, createPSU, createMeter,
  createResistor, createPCB, createRetortStand, helixPoints, createHelicalSpring,
  updateHelicalSpring, makeProtractorTexture, createLaserBench, createLaserSource,
  createLauncher, createIRHeatLamp, makeAluFrameBar, createGreenhouse, createWire,
  createBeamMesh, setBeamMesh, addGround, createLabThermometer, updateLabThermometer,
  sliderHTML, bindSliders, chkHTML, bindChks, renderSidebar, renderHUD, updatePtCount,
  refreshPlayBtn, populateGraphSelect, drawGraph, setCamera3D, setViewMode,
} from '../engine.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function toStandard(mat) {
  return new THREE.MeshStandardMaterial({
    color: mat.color ? mat.color.clone() : 0xffffff,
    metalness: mat.metalness ?? 0,
    roughness: mat.roughness ?? 0.5,
    envMapIntensity: mat.envMapIntensity ?? 1,
    transparent: !!mat.transparent,
    opacity: mat.opacity ?? 1,
    side: mat.side,
    depthWrite: mat.depthWrite,
  });
}

function toLambertGlass(mat, opacity) {
  return new THREE.MeshLambertMaterial({
    color: mat.color ? mat.color.clone() : 0xffffff,
    transparent: true,
    opacity: opacity ?? mat.opacity ?? 0.3,
    side: mat.side ?? THREE.DoubleSide,
    depthWrite: false,
  });
}

/* Merge the thermometer's 16 shaft ticks into one mesh per material.
   The shared thermometer helper is not modified; this only touches the
   returned group inside the convection experiment. */
function mergeThermometerTicks(group) {
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh || o.parent !== group) return;
    if (!o.geometry || o.geometry.type !== 'BoxGeometry') return;
    const mat = o.material;
    if (!mat || !mat.isMeshBasicMaterial) return;
    const hex = mat.color && mat.color.getHexString();
    if (hex !== 'd92d20' && hex !== '1e293b') return;
    if (!buckets.has(mat.uuid)) buckets.set(mat.uuid, { mat, meshes: [] });
    buckets.get(mat.uuid).meshes.push(o);
  });

  for (const { mat, meshes } of buckets.values()) {
    if (meshes.length < 2) continue;
    const geos = [];
    for (const mesh of meshes) {
      mesh.updateMatrix();
      geos.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach((geo) => geo.dispose());
    if (!merged) continue;

    const mergedMesh = new THREE.Mesh(merged, mat);
    mergedMesh.castShadow = false;
    group.add(mergedMesh);
    for (const mesh of meshes) {
      group.remove(mesh);
      mesh.geometry.dispose();
    }
  }
}

export default {
  id:'convection',
  cat:'heat',
  title:{ en:'Convection Currents', tc:'對流', sc:'对流' },
  desc:{ en:'Watch coloured fluid rise and fall as it is heated and cooled — a convection current.',
         tc:'觀察有色流體受熱上升、冷卻下降 — 對流循環。',
         sc:'观察有色流体受热上升、冷却下降 — 对流循环。' },
  hasPSU:true,
  cam3d:[0,3,7], camFront:{ pos:[0,2.5,9], tgt:[0,2.5,0] },
  vectorLegend:[
    [{en:'Warm rising', tc:'暖流上升', sc:'暖流上升'}, '#ff5f56'],
    [{en:'Cool sinking', tc:'冷流下降', sc:'冷流下降'}, '#4da3ff']
  ],
  equipment:[
    {id:'tank', name:{en:'Glass tank', tc:'玻璃缸', sc:'玻璃缸'}},
    {id:'water', name:{en:'Water + dye', tc:'水與染料', sc:'水与染料'}},
    {id:'htr', name:{en:'Heater', tc:'加熱器', sc:'加热器'}},
    {id:'ice', name:{en:'Ice', tc:'冰', sc:'冰'}},
    {id:'psu', name:{en:'Power supply', tc:'電源', sc:'电源'}},
    {id:'th', name:{en:'Thermometer', tc:'溫度計', sc:'温度计'}}
  ],
  variables:[
    {id:'dye', name:{en:'Dye brightness', tc:'染料亮度', sc:'染料亮度'}, min:0.2, max:1, step:0.05, def:0.7, unit:''}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'conv', label:{en:'Current speed vs V', tc:'流速 對 V', sc:'流速 对 V'},
        xLabel:'V (V)', yLabel:'Speed (arb.)', xMax:24, xFmt:0, yFmt:2, slopeUnit:'',
        current(){ return { x:this.voltage, y: this.voltage*this.voltage/400 }; } }
    ],
    yMax(){ return 4; }
  },
  playing:true, t:0,
  vars:{ dye:0.7 },
  equip:{ tank:true, water:true, htr:true, ice:true, psu:true, th:true },
  voltage:12,
  _particles:null, _heater:null,

    init() {
    const g = root3d;
    const ground = addGround();

    /* 玻璃水缸 + 鋁合金框 + 半透明水體 */
    const tankGroup = new THREE.Group();
    const tank = rbox(3, 3, 1.4, 0.04, MAT.glassThin(), 3);
    tank.position.y = 1.5;
    tank.material = toLambertGlass(tank.material, 0.24);
    tankGroup.add(tank);
    const water = rbox(2.9, 2.7, 1.3, 0.04, MAT.water(), 3);
    water.position.y = 1.40;
    water.material = toLambertGlass(water.material, 0.35);
    tankGroup.add(water);

    /* 鋁框：先建 8 根，再合併成 1 個 static mesh，材質改 Standard */
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd5dbe2, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.1
    });
    const frameBars = [];
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.7, 0.7]) {
      frameBars.push(makeAluFrameBar(new THREE.Vector3(sx, 0.04, sz), new THREE.Vector3(sx, 2.96, sz), 0.035));
    }
    for (const y of [0.04, 2.96]) for (const sz of [-0.7, 0.7]) {
      frameBars.push(makeAluFrameBar(new THREE.Vector3(-1.5, y, sz), new THREE.Vector3(1.5, y, sz), 0.028));
    }
    const frameGeos = [];
    for (const bar of frameBars) {
      bar.updateMatrix();
      frameGeos.push(bar.geometry.clone().applyMatrix4(bar.matrix));
    }
    const mergedFrameGeo = mergeGeometries(frameGeos, false);
    if (mergedFrameGeo) {
      const frameMesh = new THREE.Mesh(mergedFrameGeo, frameMat);
      frameMesh.castShadow = false;
      tankGroup.add(frameMesh);
      frameGeos.forEach((geo) => geo.dispose());
      frameBars.forEach((bar) => { bar.geometry.dispose(); bar.material.dispose(); });
    } else {
      /* 極端 fallback：保留 8 根，仍用同一 Standard 材質 */
      frameGeos.forEach((geo) => geo.dispose());
      frameBars.forEach((bar) => {
        bar.geometry.dispose();
        bar.material.dispose();
        bar.material = frameMat;
        bar.castShadow = false;
        tankGroup.add(bar);
      });
    }
    g.add(tankGroup);
    this._tank = tank;
    this._tankWater = water;
    this._thermo = createLabThermometer(1.18, 0.18, 0.0, 0xff3b30, 1.9);
    let thermoGlassMat = null;
    this._thermo.group.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const glass = mats.find((mm) => mm && mm.isMeshPhysicalMaterial && (mm.transmission || 0) > 0);
      if (!glass) return;
      if (!thermoGlassMat) thermoGlassMat = toLambertGlass(glass, 0.34);
      o.material = thermoGlassMat;
    });
    g.add(this._thermo.group);
    mergeThermometerTicks(this._thermo.group);

    /* 數位電源 */
    const psu = createPSU({ w: 1.3, h: 1.0, d: 0.9, screenW: 1.0, screenH: 0.55 });
    psu.group.position.set(-3.2, 0, 0.9);
    psu.group.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some((mm) => mm && mm.isMeshPhysicalMaterial)) return;
      /* 保留 3 個鋁旋鈕的 Physical，其餘 PSU 件改 Standard */
      if (o.geometry && o.geometry.type === 'CylinderGeometry' &&
          mats.some((mm) => mm.color && mm.color.getHexString() === 'd5dbe2')) return;
      o.material = toStandard(mats[0]);
    });
    g.add(psu.group);
    this._psuCtx = psu.ctx; this._psuTex = psu.tex; this._psuScreen = psu.screen;
    const wireRed = createWire([[-2.8, 0.45, 0.6], [-1.9, 0.4, 0.3], [-1.0, 0.2, 0]], 0xcc3333, 0.035);
    wireRed.material = toStandard(wireRed.material);
    g.add(wireRed);
    const wireBlack = createWire([[-3.4, 0.45, 0.6], [-2.1, 0.4, -0.3], [-1.0, 0.2, 0]], 0x22282f, 0.035);
    wireBlack.material = toStandard(wireBlack.material);
    g.add(wireBlack);

    /* 桌面與地面：只替換 convection 這份 ground group 的材質 */
    const groundTop = ground.userData.topMat;
    const groundFloor = ground.userData.floorMat;
    ground.traverse((o) => {
      if (!o.isMesh) return;
      if (o.material === groundTop) o.material = toStandard(groundTop);
      else if (o.material === groundFloor) o.material = toStandard(groundFloor);
    });

    /* Heater at bottom left */
    const htr = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.15, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xff5f56, metalness: 0.5, roughness: 0.4 })
    );
    htr.position.set(-1, 0.1, 0);
    htr.castShadow = true;
    g.add(htr);
    this._heater = htr;

    /* Ice at top right */
    const ice = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xdfeaf7, transparent: true, opacity: 0.7 })
    );
    ice.position.set(1.2, 2.85, 0);
    ice.castShadow = true;
    g.add(ice);

    /* Particles flowing along a closed convection loop */
    const N = 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const u = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      u[i] = i / N;
      const p = this._loopPoint(u[i]);
      pos[i*3]   = p.x;
      pos[i*3+1] = p.y;
      pos[i*3+2] = p.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.12, color: 0xff6a2a, transparent: true, opacity: 0.9,
      blending: THREE.NormalBlending, sizeAttenuation: true, depthWrite: false
    });
    this._particles = { geo, u, N, mat };
    g.add(new THREE.Points(geo, mat));

    /* Shadow budget: only the tank, heater and ice remain casters */
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    tank.castShadow = true;
    htr.castShadow = true;
    ice.castShadow = true;
  },

  /* Rectangle loop: up left, across top, down right, across bottom */
  _loopPoint(t) {
    t = ((t % 1) + 1) % 1;
    const w = 1.15, yLow = 0.35, yHigh = 2.7, cx = 0;
    let x, y;
    if (t < 0.4) {
      x = -w;                                  y = yLow + (yHigh - yLow) * (t / 0.4);
    } else if (t < 0.5) {
      x = -w + (2 * w) * ((t - 0.4) / 0.1);    y = yHigh;
    } else if (t < 0.9) {
      x = w;                                   y = yHigh - (yHigh - yLow) * ((t - 0.5) / 0.4);
    } else {
      x = w - (2 * w) * ((t - 0.9) / 0.1);     y = yLow;
    }
    return { x, y, z: 0 };
  },

  _drawDisplay() {
    const c = this._psuCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('SUPPLY', 12, 22);
    c.fillStyle = this.voltage > 0 ? '#4dffa0' : '#2a6a4a';
    c.font = 'bold 42px ui-monospace,monospace';
    c.fillText(this.voltage.toFixed(1), 12, 78);
    c.font = 'bold 20px ui-monospace,monospace';
    c.fillText('V', 165, 78);
    if (this._psuTex) this._psuTex.needsUpdate = true;
  },
  update(dt){ this.t += dt; },
    sync3D(dt) {
    const P = this._particles;
    if (!P) return;
    const arr = P.geo.attributes.position.array;
    /* speed scales with power ~ V²; base crawl so it never fully stops */
    const speed = 0.03 + (this.voltage * this.voltage / 400) * 0.35;
    P.mat.opacity = 0.3 + this.vars.dye * 0.6;
    for (let i = 0; i < P.N; i++) {
      P.u[i] = (P.u[i] + speed * dt) % 1;
      const pt = this._loopPoint(P.u[i]);
      arr[i*3]   = pt.x;
      arr[i*3+1] = pt.y;
      arr[i*3+2] = pt.z;
    }
    P.geo.attributes.position.needsUpdate = true;
    if (this._heater) {
      this._heater.material.color.setHex(this.voltage > 0 ? 0xff5f56 : 0x555b68);
      if (this._heater.material.emissive) {
        this._heater.material.emissive.setHex(this.voltage > 0 ? 0x661100 : 0x000000);
      }
    }
    if (this._tankWater) {
      this._tankWater.material.opacity = 0.22 + this.vars.dye * 0.14;
    }
    if (this._thermo) {
      this._thermo.group.visible = this.equip.th !== false;
      updateLabThermometer(this._thermo, 293 + this.voltage * 1.2, 273, 373);
    }
    if (this._psuTex) this._drawDisplay();
  },
  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), this.equip[e.id] !== false);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('power') + '</h3></div>';
    h += '<div class="psu-display"><span class="lbl">V</span><span class="val" id="psu-v">' + this.voltage.toFixed(1) + '</span></div>';
    h += sliderHTML('volt', t('voltage'), 0, 24, 0.1, this.voltage, ' V');
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'Raise the <b>voltage</b> to speed up the convection loop. Warm water rises on the left, cools and sinks on the right.',
          tc:'提高<b>電壓</b>加快對流循環。左側暖水上升，右側冷卻下沉。',
          sc:'提高<b>电压</b>加快对流循环。左侧暖水上升，右侧冷却下沉。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
    el.querySelector('#sl-volt').addEventListener('input', e => {
      this.voltage = parseFloat(e.target.value);
      el.querySelector('#sv-volt').textContent = this.voltage.toFixed(1) + ' V';
      el.querySelector('#psu-v').textContent = this.voltage.toFixed(1);
    });
  },
  hud() {
    return [
      ['V', this.voltage.toFixed(1) + ' V'],
      ['Power', (this.voltage*this.voltage/20).toFixed(1) + ' W'],
      ['Flow', this.voltage > 0 ? 'Rising left, sinking right' : 'Static', true]
    ];
  }
};
