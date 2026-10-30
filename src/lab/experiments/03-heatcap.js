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
  id:'heatcap',
  cat:'heat',
  title:{ en:'Specific Heat Capacity · Q = mcΔT', tc:'比熱容量 · Q = mcΔT', sc:'比热容量 · Q = mcΔT' },
  desc:{ en:'Heat a metal block with a known electrical power. The slope of T vs t gives P/(mc).',
         tc:'用已知電功率加熱金屬塊。T 對 t 的斜率即 P/(mc)。',
         sc:'用已知电功率加热金属块。T 对 t 的斜率即 P/(mc)。' },
  hasPSU:true,
  cam3d:[6,5,8], camFront:{ pos:[0,2,11], tgt:[0,2,0] },
  vectorLegend:[
    [{en:'Electrical power → heat', tc:'電功率 → 熱', sc:'电功率 → 热'}, '#ff5f56'],
    [{en:'Heat loss to surroundings', tc:'散熱損失', sc:'散热损失'}, '#4da3ff']
  ],
  equipment:[
    {id:'blk', name:{en:'Metal block', tc:'金屬塊', sc:'金属块'}},
    {id:'heater', name:{en:'Immersion heater', tc:'加熱器', sc:'加热器'}},
    {id:'psu', name:{en:'Power supply', tc:'電源', sc:'电源'}},
    {id:'thermo', name:{en:'Thermometer', tc:'溫度計', sc:'温度计'}},
    {id:'ins', name:{en:'Insulation jacket', tc:'保溫套', sc:'保温套'}},
    {id:'timer', name:{en:'Timer', tc:'計時器', sc:'计时器'}}
  ],
  variables:[
    {id:'mass', name:{en:'Block mass', tc:'金屬塊質量', sc:'金属块质量'}, min:0.2, max:1.5, step:0.05, def:0.5, unit:' kg'},
    {id:'c', name:{en:'Specific heat c', tc:'比熱容量 c', sc:'比热容 c'}, min:400, max:900, step:10, def:900, unit:' J/kg·K'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'Tt', label:{en:'T vs t', tc:'T 對 t', sc:'T 对 t'},
        xLabel:'Time (s)', yLabel:'T (°C)', xMax:200, xFmt:0, yFmt:0, slopeUnit:'°C/s',
        current(){ return { x:this.t, y:this.vars.T - 273 }; } }
    ],
    yMax(){ return Math.max(60, (this.vars.T - 273) * 1.35); }
  },
  playing:true, t:0,
  vars:{ T:293, mass:0.5, c:900 },
  equip:{ blk:true, heater:true, psu:true, thermo:true, ins:true, timer:true },
  voltage:10,
  R_HEAT: 20, K_LOSS: 0.15, T_ROOM: 293,

  init() {
    const g = root3d;
    addGround();

    /* 金屬塊：倒角立方體 + 頂部測溫孔 + 側面加熱孔 */
    const blockMat = new THREE.MeshPhysicalMaterial({ color: 0xaeb7c4, metalness: 0.88, roughness: 0.28, clearcoat: 0.25, envMapIntensity: 1.1 });
    const block = rbox(1.6, 1.2, 1.6, 0.09, blockMat, 4);
    block.position.y = 0.6;
    g.add(block);
    this._block = block;
    const hole = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 24), MAT.dark());
    hole.rotation.x = Math.PI / 2; hole.position.set(0.42, 1.205, 0.35); g.add(hole);
    const sideHole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 20), MAT.dark());
    sideHole.rotation.z = Math.PI / 2; sideHole.position.set(0.805, 0.62, 0); g.add(sideHole);

    /* 保溫套：泡棉質感 */
    const insMat = new THREE.MeshPhysicalMaterial({ color: 0xd8c098, roughness: 0.88, transparent: true, opacity: 0.46, side: THREE.DoubleSide });
    const ins = rbox(1.74, 1.34, 1.74, 0.12, insMat, 4);
    ins.position.y = 0.6;
    g.add(ins);
    this._ins = ins;

    /* 浸入式加熱器：金屬管 + 陶瓷頭 + 電纜 */
    const heater = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.6, 20), MAT.steel());
    heater.position.set(0, 1.3, 0);
    heater.castShadow = true;
    g.add(heater);
    this._heater = heater;
    const head = rbox(0.24, 0.22, 0.24, 0.04, MAT.ceramic(), 3);
    head.position.set(0, 2.22, 0); g.add(head);
    const cable = createWire([[0.12, 2.22, 0], [0.8, 2.4, 0.1], [2.0, 1.2, 0.1]], 0x1a1d22, 0.035);
    g.add(cable);

    /* heater glow */
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0 });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 16), glowMat);
    glow.position.set(0, 1.15, 0);
    g.add(glow);
    this._glow = glow;

    /* 數位電源 */
    const psu = createPSU({ w: 1.4, h: 1.0, d: 0.9, screenW: 1.1, screenH: 0.55 });
    psu.group.position.set(2.6, 0, -0.8);
    g.add(psu.group);
    this._psuCtx = psu.ctx; this._psuTex = psu.tex; this._psuScreen = psu.screen;
    g.add(createWire([[2.15, 0.45, -0.55], [1.2, 0.2, 0.2], [0.5, 1.3, 0]], 0xcc3333, 0.035));
    g.add(createWire([[3.0, 0.45, -0.55], [1.6, 0.2, -0.3], [-0.5, 1.3, 0]], 0x22282f, 0.035));
    this._drawDisplay();

    /* thermometer inserted into thermometer hole of metal block */
    this._thermo = createLabThermometer(0.42, 0.85, 0.35, 0xff3b30, 1.8);
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
    this.vars.T = 293;
  },

  update(dt) {
    const kLoss = this.equip.ins !== false ? this.K_LOSS : this.K_LOSS * 4;
    let power = 0;
    if (this.voltage > 0 && this.equip.psu !== false && this.equip.heater !== false) {
      power = this.voltage * this.voltage / this.R_HEAT;
    }
    const loss = kLoss * (this.vars.T - this.T_ROOM);
    const dT = (power - loss) / (this.vars.mass * this.vars.c) * dt;
    this.vars.T += dT;
    this.vars.T = Math.max(250, Math.min(450, this.vars.T));
    this.t += dt;
  },

 sync3D(dt) {
  /* block color warms with T */
  const heatFrac = Math.max(0, Math.min(1, (this.vars.T - 293) / 150));
  if (this._block) {
    this._block.material.color.setHSL(0.58 - heatFrac * 0.55, 0.55, 0.55);
  }
  /* block + jacket size scale with mass (reference: 0.5 kg) */
  const sizeScale = Math.cbrt(this.vars.mass / 0.5);
  if (this._block) this._block.scale.set(sizeScale, sizeScale, sizeScale);
  if (this._ins) this._ins.scale.set(sizeScale, sizeScale, sizeScale);
    /* heater glow */
    if (this._glow) {
      this._glow.material.opacity = this.voltage > 0 ? 0.35 + heatFrac * 0.45 : heatFrac * 0.2;
    }
    if (this._thermo) {
      this._thermo.group.visible = this.equip.thermo !== false;
      updateLabThermometer(this._thermo, this.vars.T, 273, 393);
    }
   /* insulation visibility */
if (this._ins) this._ins.visible = this.equip.ins !== false;
/* heater visibility */
if (this._heater) this._heater.visible = this.equip.heater !== false;
if (this._glow)   this._glow.visible   = this.equip.heater !== false;
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
      T({ en:'Raise the <b>supply voltage</b> and watch T rise linearly. Slope of T vs t = P/(mc).',
          tc:'提高<b>電壓</b>，觀察 T 線性上升。T 對 t 斜率 = P/(mc)。',
          sc:'提高<b>电压</b>，观察 T 线性上升。T 对 t 斜率 = P/(mc)。' }) +
      '</div></div>';
    return h;
  },

  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
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
    const slope = this.equip.ins !== false ? P / (this.vars.mass * this.vars.c) : 0;
    return [
      ['T', this.vars.T.toFixed(1) + ' K (' + (this.vars.T - 273).toFixed(1) + ' °C)'],
      ['t', this.t.toFixed(1) + ' s'],
      ['c', this.vars.c + ' J/kg·K'],
      ['m', this.vars.mass.toFixed(2) + ' kg'],
      ['', ''],
      ['P', P.toFixed(1) + ' W'],
      ['dT/dt', slope.toFixed(3) + ' K/s', true]
    ];
  }
};
