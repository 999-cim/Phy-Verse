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

export default {
  id:'latent',
  cat:'heat',
  title:{ en:'Latent Heat of Fusion of Ice · L_f', tc:'冰的熔化潛熱 · L_f', sc:'冰的熔化潜热 · L_f' },
  desc:{ en:'Heat ice with a known electrical power. When it reaches 0 °C, T stays constant until all ice melts. Plateau length gives L_f.',
         tc:'用已知電功率加熱冰。到 0 °C 後 T 保持不變，直到冰全部融化。平台長度可求出 L_f。',
         sc:'用已知电功率加热冰。到 0 °C 后 T 保持不变，直到冰全部融化。平台长度可求出 L_f。' },
  hasPSU:true,
  cam3d:[6,5,8], camFront:{ pos:[0,2,10], tgt:[0,2,0] },
  vectorLegend:[
    [{en:'Heat in from heater', tc:'加熱器輸入', sc:'加热器输入'}, '#ff5f56'],
    [{en:'Latent heat absorbed', tc:'潛熱吸收', sc:'潜热吸收'}, '#a78bfa']
  ],
  equipment:[
    {id:'bk', name:{en:'Beaker with ice', tc:'裝冰的燒杯', sc:'装冰的烧杯'}},
    {id:'heater', name:{en:'Immersion heater', tc:'加熱器', sc:'加热器'}},
    {id:'psu', name:{en:'Power supply', tc:'電源', sc:'电源'}},
    {id:'thermo', name:{en:'Thermometer', tc:'溫度計', sc:'温度计'}},
    {id:'stir', name:{en:'Stirrer', tc:'攪拌器', sc:'搅拌器'}},
    {id:'bal', name:{en:'Balance', tc:'天平', sc:'天平'}}
  ],
  variables:[
    {id:'ice', name:{en:'Ice mass', tc:'冰的質量', sc:'冰的质量'}, min:0.05, max:0.30, step:0.01, def:0.10, unit:' kg'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'Tt', label:{en:'T vs t', tc:'T 對 t', sc:'T 对 t'},
        xLabel:'Time (s)', yLabel:'T (°C)', xMax:300, xFmt:0, yFmt:0, slopeUnit:'°C/s',
        current(){ return { x:this.t, y:this.vars.T - 273 }; } }
    ],
    yMax(){ return Math.max(30, (this.vars.T - 273) * 1.5); }
  },
  playing:true, t:0,
  vars:{ T:253, ice:0.10 },
  equip:{ bk:true, heater:true, psu:true, thermo:true, stir:true, bal:true },
  voltage:15,
  R_HEAT: 20, L_FUS: 334000, C_WATER: 4180, C_ICE: 2100,
  melted:0, phase:'solid',

  init() {
    const g = root3d;
    addGround();

    /* 厚底刻度燒杯（帶傾倒嘴） */
    const bk = createGraduatedCylinder({ R: 1.0, H: 1.8, marks: true, spout: true, ticks: 12 });
    g.add(bk.group);
    this._beaker = bk.wall;
    const beakerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.05, 0.10, 48), MAT.glassThin());
    beakerBase.position.y = 0.05; g.add(beakerBase);

    /* water level (progresses as ice melts) */
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3d8bff, transparent: true, opacity: 0.45, roughness: 0.15, metalness: 0.05
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 0.94, 0.1, 40), waterMat);
    water.position.y = 0.2;
    g.add(water);
    this._water = water;

   /* ice cubes — up to 12, one per ~0.025 kg of ice */
this._iceCubes = [];
const iceMat = new THREE.MeshPhysicalMaterial({
  color: 0xeaf7ff, transparent: true, opacity: 0.94,
  roughness: 0.26, metalness: 0.0, transmission: 0.0,
  clearcoat: 0.65, clearcoatRoughness: 0.2, envMapIntensity: 1.25,
  emissive: 0x1b3550, emissiveIntensity: 0.12
});
const MAX_CUBES = 12;
for (let i = 0; i < MAX_CUBES; i++) {
  const size = 0.25;
  const cube = rbox(size, size, size, 0.045, iceMat, 2);
  const a = i / MAX_CUBES * Math.PI * 2;
  cube.position.set(Math.cos(a) * 0.55, 0.42 + (i % 3) * 0.20, Math.sin(a) * 0.55);
  cube.rotation.set(Math.random(), Math.random(), Math.random());
  g.add(cube);
  this._iceCubes.push(cube);
}

    /* 浸入式加熱線圈（螺旋管，不是單圈 Torus） */
    const coilPts = helixPoints(0.35, 3.2, 0.42, 0.20, 18);
    const hCoil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 160, 0.035, 7, false), MAT.steel());
    g.add(hCoil);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.2, 16), MAT.steel());
    stem.position.set(0, 1.0, 0); g.add(stem);
    const hHead = rbox(0.24, 0.20, 0.24, 0.04, MAT.ceramic(), 3);
    hHead.position.set(0, 1.66, 0); g.add(hHead);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0 });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 32), glowMat);
    glow.position.y = 0.15;
    g.add(glow);
    this._glow = glow;

    /* 數位電源 */
    const psu = createPSU({ w: 1.2, h: 1.0, d: 0.9, screenW: 0.95, screenH: 0.5 });
    psu.group.position.set(2.4, 0, -0.6);
    g.add(psu.group);
    this._psuCtx = psu.ctx; this._psuTex = psu.tex; this._psuScreen = psu.screen;
    g.add(createWire([[2.0, 0.45, -0.3], [1.2, 0.2, 0.4], [0.5, 0.15, 0.35]], 0xcc3333, 0.032));
    g.add(createWire([[2.8, 0.45, -0.3], [1.4, 0.2, -0.4], [-0.5, 0.15, 0.35]], 0x22282f, 0.032));
    this._drawDisplay();

    /* thermometer inside beaker */
    this._thermo = createLabThermometer(0.55, 0.25, 0.45, 0xff3b30, 1.8);
    g.add(this._thermo.group);

    this.reset();
  },

  _drawDisplay() {
    const c = this._psuCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('HEATER', 12, 22);
    c.fillStyle = this.voltage > 0 ? '#4dffa0' : '#2a6a4a';
    c.font = 'bold 46px ui-monospace,monospace';
    c.fillText(this.voltage.toFixed(1), 12, 80);
    c.font = 'bold 22px ui-monospace,monospace';
    c.fillText('V', 160, 80);
    c.fillStyle = '#2e6b4a'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText(((this.voltage*this.voltage)/this.R_HEAT).toFixed(1) + ' W', 12, 108);
    if (this._psuTex) this._psuTex.needsUpdate = true;
  },

  reset() {
  this.t = 0;
  this.vars.T = 253;
  this.melted = 0;
  this.phase = 'solid';
  /* restore ice cubes to full size */
  for (const c of this._iceCubes) {
    c.visible = true;
    c.scale.set(1, 1, 1);
  }
},

  update(dt) {
  if (this.voltage <= 0 || !this.equip.psu || !this.equip.heater) { this.t += dt; return; }
  const P = this.voltage * this.voltage / this.R_HEAT;
  /* ×20 speed-up so a classroom demo melts the ice in seconds, not minutes */
  const dQ = P * dt * 20;
    if (this.phase === 'solid') {
      this.vars.T += dQ / (this.vars.ice * this.C_ICE);
      if (this.vars.T >= 273) { this.vars.T = 273; this.phase = 'melting'; }
    } else if (this.phase === 'melting') {
      this.melted += dQ / this.L_FUS;
      if (this.melted >= this.vars.ice) { this.melted = this.vars.ice; this.phase = 'liquid'; }
    } else {
      this.vars.T += dQ / (this.vars.ice * this.C_WATER);
      this.vars.T = Math.min(373, this.vars.T);
    }
    this.t += dt;
  },

 sync3D(dt) {
  /* how many cubes should exist for the current ice mass? */
  const totalCubes = Math.max(1, Math.min(this._iceCubes.length,
                       Math.round(this.vars.ice / 0.025)));
  const frac = this.melted / this.vars.ice;
  const N = totalCubes;
  this._iceCubes.forEach((c, i) => {
    if (i >= totalCubes) { c.visible = false; return; }
    const startAt = (i / N) * 0.4;
    const localFrac = Math.max(0, Math.min(1, (frac - startAt) / 0.6));
    const s = 1 - localFrac;
    c.scale.set(s, s, s);
    c.visible = s > 0.06;
    if (c.visible) {
      c.rotation.y += dt * 0.2;
      c.rotation.x += dt * 0.08;
    }
  });
  /* water level rises from 0.2 up to 1.4 as all ice melts */
  if (this._water) {
    const level = 0.2 + frac * 1.2;
    this._water.scale.y = level / 0.1;
    this._water.position.y = level / 2 + 0.1;
  }
    /* glow */
    if (this._glow) {
      this._glow.material.opacity = this.voltage > 0 ? 0.4 : 0;
    }
    if (this._thermo) {
      this._thermo.group.visible = this.equip.thermo !== false;
      updateLabThermometer(this._thermo, this.vars.T, 253, 373);
    }
  },

  draggables(){ return []; },
  onDragStart(){}, onDragMove(){}, onDragEnd(){},

  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), this.equip[e.id] !== false);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) {
      h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    }
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('power') + '</h3></div>';
    h += '<div class="psu-display"><span class="lbl">V</span><span class="val" id="psu-v">' + this.voltage.toFixed(1) + '</span><span class="sub" id="psu-w">' + ((this.voltage*this.voltage)/this.R_HEAT).toFixed(1) + ' W</span></div>';
    h += sliderHTML('volt', t('voltage'), 0, 24, 0.1, this.voltage, ' V');
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'Set <b>voltage</b> &gt; 0 to heat the ice. The flat 0 °C line lasts while ice is melting — energy goes into L_f, not T.',
          tc:'將<b>電壓</b>設 &gt; 0 加熱冰。0 °C 平台持續到冰全部融化 — 能量用於 L_f，而非升溫。',
          sc:'将<b>电压</b>设 &gt; 0 加热冰。0 °C 平台持续到冰全部融化 — 能量用于 L_f，而非升温。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => this.reset());
    bindChks(el, this.equipment, this.equip, () => {});
    el.querySelector('#sl-volt').addEventListener('input', e => {
      this.voltage = parseFloat(e.target.value);
      el.querySelector('#sv-volt').textContent = this.voltage.toFixed(1) + ' V';
      el.querySelector('#psu-v').textContent = this.voltage.toFixed(1);
      el.querySelector('#psu-w').textContent = ((this.voltage*this.voltage)/this.R_HEAT).toFixed(1) + ' W';
      this._drawDisplay();
    });
  },

  hud() {
    const P = this.voltage * this.voltage / this.R_HEAT;
    return [
      ['T', (this.vars.T - 273).toFixed(2) + ' °C'],
      ['Phase', this.phase],
      ['Ice melted', (this.melted / this.vars.ice * 100).toFixed(1) + ' %'],
      ['t', this.t.toFixed(1) + ' s'],
      ['', ''],
      ['P', P.toFixed(1) + ' W'],
      ['L_f est.', this.melted > 0 ? (P * this.t * 0.02 / this.vars.ice).toFixed(0) + ' J/kg (rough)' : '—', true]
    ];
  }
};
