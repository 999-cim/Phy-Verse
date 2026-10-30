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
    addGround();

    /* 玻璃水缸 + 鋁合金框 + 半透明水體 */
    const tankGroup = new THREE.Group();
    const tank = rbox(3, 3, 1.4, 0.04, MAT.glassThin(), 3);
    tank.position.y = 1.5;
    tankGroup.add(tank);
    const water = rbox(2.9, 2.7, 1.3, 0.04, MAT.water(), 3);
    water.position.y = 1.40;
    tankGroup.add(water);
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.7, 0.7]) {
      tankGroup.add(makeAluFrameBar(new THREE.Vector3(sx, 0.04, sz), new THREE.Vector3(sx, 2.96, sz), 0.035));
    }
    for (const y of [0.04, 2.96]) for (const sz of [-0.7, 0.7]) {
      tankGroup.add(makeAluFrameBar(new THREE.Vector3(-1.5, y, sz), new THREE.Vector3(1.5, y, sz), 0.028));
    }
    g.add(tankGroup);
    this._tank = tank;
    this._tankWater = water;
    this._thermo = createLabThermometer(1.18, 0.18, 0.0, 0xff3b30, 1.9);
    g.add(this._thermo.group);

    /* 數位電源 */
    const psu = createPSU({ w: 1.3, h: 1.0, d: 0.9, screenW: 1.0, screenH: 0.55 });
    psu.group.position.set(-3.2, 0, 0.9);
    g.add(psu.group);
    this._psuCtx = psu.ctx; this._psuTex = psu.tex; this._psuScreen = psu.screen;
    g.add(createWire([[-2.8, 0.45, 0.6], [-1.9, 0.4, 0.3], [-1.0, 0.2, 0]], 0xcc3333, 0.035));
    g.add(createWire([[-3.4, 0.45, 0.6], [-2.1, 0.4, -0.3], [-1.0, 0.2, 0]], 0x22282f, 0.035));

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
    const N = 120;
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
