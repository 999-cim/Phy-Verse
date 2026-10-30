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
  id:'ohm',
  cat:'elec',
  title:{ en:"Ohm's Law · V = IR", tc:'歐姆定律 · V = IR', sc:'欧姆定律 · V = IR' },
  desc:{ en:'Adjust supply voltage and load resistance. Measure V and I; the graph is a straight line through the origin.',
         tc:'調整電壓與負載電阻。量度 V 與 I；圖為過原點的直線。',
         sc:'调整电压与负载电阻。量度 V 与 I；图为过原点的直线。' },
  hasPSU:true,
  cam3d:[5.0,3.9,7.4], camFront:{ pos:[0,2.2,9.2], tgt:[0,2.2,0] },
  vectorLegend:[
    [{en:'Conventional current', tc:'慣例電流方向', sc:'惯例电流方向'}, '#ff5f56']
  ],
  equipment:[
    {id:'bat', name:{en:'DC supply', tc:'直流電源', sc:'直流电源'}},
    {id:'res', name:{en:'Resistor R', tc:'電阻器 R', sc:'电阻器 R'}},
    {id:'amm', name:{en:'Ammeter', tc:'安培計', sc:'安培计'}},
    {id:'vol', name:{en:'Voltmeter', tc:'伏特計', sc:'伏特计'}},
    {id:'rheo', name:{en:'Rheostat', tc:'變阻器', sc:'变阻器'}},
    {id:'wire', name:{en:'Connecting wires', tc:'連接線', sc:'连接线'}}
  ],
  variables:[
    {id:'R', name:{en:'Resistance R', tc:'電阻 R', sc:'电阻 R'}, min:5, max:100, step:1, def:20, unit:' Ω'},
    {id:'V', name:{en:'Supply voltage', tc:'供應電壓', sc:'供应电压'}, min:0, max:20, step:0.1, def:6, unit:' V'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'vi', label:{en:'V vs I', tc:'V 對 I', sc:'V 对 I'},
        xLabel:'I (A)', yLabel:'V (V)', xMax:2.0, xFmt:2, yFmt:1, slopeUnit:'Ω',
        current(){ return { x:this.I(), y:this.V() }; } },
      { id:'iv', label:{en:'I vs V', tc:'I 對 V', sc:'I 对 V'},
        xLabel:'V (V)', yLabel:'I (A)', xMax:20, xFmt:0, yFmt:3, slopeUnit:'A/V',
        current(){ return { x:this.V(), y:this.I() }; } }
    ],
    yMax(){ return this.graph.activeType === 0 ? Math.max(4, this.V()*1.4) : Math.max(0.5, this.I()*1.4); }
  },
  playing:true, t:0,
  vars:{ R:20, V:6 },
  equip:{ bat:true, res:true, amm:true, vol:true, rheo:true, wire:true },
  I(){ const R = this.vars.R || 1; return this.vars.V / R; },
  V(){ return this.vars.V; },
  _arrowCur:null,
  _currentDots:null,

  init() {
    const g = root3d;
    /* circuit board */
    const pcb = createPCB(6, 4);
    pcb.group.position.y = -0.18;
    g.add(pcb.group);
    this._pcb = pcb;

    /* wire loop (true straight copper wires with smooth 90-deg rounded corners) */
    const yW = 0.12, xW = 2.4, zW = 1.4, rC = 0.25;
    const wireCurve = new THREE.CurvePath();
    /* Top straight (-x to +x at z = -1.4) */
    wireCurve.add(new THREE.LineCurve3(new THREE.Vector3(-xW + rC, yW, -zW), new THREE.Vector3(xW - rC, yW, -zW)));
    /* Top-right corner */
    wireCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(xW - rC, yW, -zW), new THREE.Vector3(xW, yW, -zW), new THREE.Vector3(xW, yW, -zW + rC)));
    /* Right straight (-z to +z at x = +2.4) */
    wireCurve.add(new THREE.LineCurve3(new THREE.Vector3(xW, yW, -zW + rC), new THREE.Vector3(xW, yW, zW - rC)));
    /* Bottom-right corner */
    wireCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(xW, yW, zW - rC), new THREE.Vector3(xW, yW, zW), new THREE.Vector3(xW - rC, yW, zW)));
    /* Bottom straight (+x to -x at z = +1.4) */
    wireCurve.add(new THREE.LineCurve3(new THREE.Vector3(xW - rC, yW, zW), new THREE.Vector3(-xW + rC, yW, zW)));
    /* Bottom-left corner */
    wireCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-xW + rC, yW, zW), new THREE.Vector3(-xW, yW, zW), new THREE.Vector3(-xW, yW, zW - rC)));
    /* Left straight (+z to -z at x = -2.4) */
    wireCurve.add(new THREE.LineCurve3(new THREE.Vector3(-xW, yW, zW - rC), new THREE.Vector3(-xW, yW, -zW + rC)));
    /* Top-left corner */
    wireCurve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-xW, yW, -zW + rC), new THREE.Vector3(-xW, yW, -zW), new THREE.Vector3(-xW + rC, yW, -zW)));

    const wireGeo = new THREE.TubeGeometry(wireCurve, 160, 0.045, 20, true);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, metalness: 0.88, roughness: 0.22 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.castShadow = true;
    g.add(wire);

    /* 直流電源（左側） */
    const bat = createPSU({ w: 0.62, h: 0.78, d: 1.10, screenW: 0.44, screenH: 0.22, knobs: 1 });
    bat.group.position.set(-2.4, 0.0, 0);
    g.add(bat.group);
    this._batCtx = bat.ctx; this._batTex = bat.tex; this._batScreen = bat.screen;
    this._drawBat();

    /* 啞鈴型陶瓷色環電阻 + 接線座 */
    const res = createResistor({ L: 1.0, R: 0.20 });
    res.group.position.set(2.4, 0.40, 0);
    g.add(res.group);
    this._resistor = res;

    /* 安培計（下側） */
    const am = createMeter('AMMETER', { w: 1.0, h: 0.7, d: 0.6 });
    am.group.position.set(0, 0.30, 1.4);
    g.add(am.group);
    this._amCtx = am.ctx; this._amTex = am.tex; this._amScreen = am.screen;
    this._drawAm();

    /* 伏特計（上側），面板朝向相機 */
    const vm = createMeter('VOLTMETER', { w: 1.0, h: 0.7, d: 0.6 });
    vm.group.position.set(0, 0.30, -1.4);
    g.add(vm.group);
    this._vmCtx = vm.ctx; this._vmTex = vm.tex; this._vmScreen = vm.screen;
    this._drawVm();

    /* current-flow charge carriers (smooth glowing spheres moving along the wire) */
    this._flowDots = [];
    const dotGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 28; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      g.add(dot);
      this._flowDots.push({ mesh: dot, u: i / 28 });
    }
    this._flowCurve = wireCurve;

    /* arrow for current direction (vector mode) */
    this._arrowCur = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0.5,-1.4), 1.2, 0xff5f56, 0.35, 0.16);
    this._arrowCur.visible = false;
    g.add(this._arrowCur);
  },

  _drawBat() {
    const c = this._batCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('SUPPLY', 12, 22);
    c.fillStyle = '#4dffa0'; c.font = 'bold 46px ui-monospace,monospace';
    c.fillText(this.vars.V.toFixed(1), 12, 80);
    c.font = 'bold 22px ui-monospace,monospace';
    c.fillText('V', 150, 80);
    if (this._batTex) this._batTex.needsUpdate = true;
  },
  _drawAm() {
    const c = this._amCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('AMMETER', 12, 22);
    c.fillStyle = '#ffcf4d'; c.font = 'bold 40px ui-monospace,monospace';
    c.fillText(this.I().toFixed(3), 12, 78);
    c.font = 'bold 20px ui-monospace,monospace';
    c.fillText('A', 210, 78);
    if (this._amTex) this._amTex.needsUpdate = true;
  },
  _drawVm() {
    const c = this._vmCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('VOLTMETER', 12, 22);
    c.fillStyle = '#4dffa0'; c.font = 'bold 40px ui-monospace,monospace';
    c.fillText(this.V().toFixed(2), 12, 78);
    c.font = 'bold 20px ui-monospace,monospace';
    c.fillText('V', 210, 78);
    if (this._vmTex) this._vmTex.needsUpdate = true;
  },

  reset() {},
  update(dt) {
    this.t += dt;
    /* flow dots advance with I */
    const speed = Math.min(1.5, this.I() / 1.0) * 0.15;
    for (const d of this._flowDots) {
      d.u = (d.u + speed * dt) % 1;
    }
    this._drawBat(); this._drawAm(); this._drawVm();
  },
  sync3D(dt) {
    /* update flow dot positions along curve */
    if (this._flowCurve) {
      const len = this._flowCurve.getLength();
      for (const d of this._flowDots) {
        const pt = this._flowCurve.getPointAt(d.u);
        d.mesh.position.copy(pt);
        d.mesh.visible = this.I() > 0.005;
        d.mesh.material.opacity = Math.min(0.9, 0.3 + this.I() * 0.8);
      }
    }
    /* current arrow */
    const show = viewMode === 'vector';
    this._arrowCur.visible = show;
  },
  draggables(){ return []; },
  onDragStart(){}, onDragMove(){}, onDragEnd(){},

  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), true);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) {
      h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    }
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'Record (V, I) pairs at different supply voltages. Switch to <b>V vs I</b> — the slope is R.',
          tc:'在不同電壓記錄 (V, I)，切到 <b>V 對 I</b> — 斜率即 R。',
          sc:'在不同电压记录 (V, I)，切到 <b>V 对 I</b> — 斜率即 R。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },

  hud() {
    return [
      ['V', this.V().toFixed(2) + ' V'],
      ['I', this.I().toFixed(3) + ' A'],
      ['R', this.vars.R.toFixed(0) + ' Ω'],
      ['', ''],
      ['V / I', (this.V() / Math.max(this.I(), 1e-6)).toFixed(1) + ' Ω', true]
    ];
  }
};
