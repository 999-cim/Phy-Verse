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
  id:'wave',
  cat:'waves',
  title:{ en:'Wave on a String · v = fλ', tc:'弦上波 · v = fλ', sc:'弦上波 · v = fλ' },
  desc:{ en:'Adjust frequency and tension. Watch the wavelength change to keep v = fλ.',
         tc:'調整頻率與張力。觀察波長如何改變以維持 v = fλ。',
         sc:'调整频率与张力。观察波长如何改变以维持 v = fλ。' },
  hasPSU:false,
  cam3d:[0,3,8], camFront:{ pos:[0,2,10], tgt:[0,2,0] },
   vectorLegend:[
    [{en:'Tension (string pulls up)', tc:'張力（弦向上拉）', sc:'张力（弦向上拉）'}, '#4da3ff'],
    [{en:'Weight / gravity (down)', tc:'重力（向下）', sc:'重力（向下）'}, '#ff5f56']
  ],
  equipment:[
    {id:'gen', name:{en:'Vibration generator', tc:'振動器', sc:'振动器'}},
    {id:'str', name:{en:'String', tc:'弦線', sc:'弦线'}},
    {id:'pul', name:{en:'Pulley', tc:'滑輪', sc:'滑轮'}},
    {id:'wt', name:{en:'Weights (drag)', tc:'砝碼（拖曳）', sc:'砝码（拖拽）'}},
    {id:'ruler', name:{en:'Ruler', tc:'尺', sc:'尺'}},
    {id:'strobe', name:{en:'Strobe', tc:'閃頻器', sc:'频闪器'}}
  ],
  variables:[
    {id:'f', name:{en:'Frequency f', tc:'頻率 f', sc:'频率 f'}, min:2, max:20, step:0.5, def:8, unit:' Hz'},
    {id:'T', name:{en:'Tension T', tc:'張力 T', sc:'张力 T'}, min:1, max:20, step:0.5, def:9, unit:' N'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'fl', label:{en:'f vs 1/λ', tc:'f 對 1/λ', sc:'f 对 1/λ'},
        xLabel:'1/λ (m⁻¹)', yLabel:'f (Hz)', xMax:20, xFmt:1, yFmt:0, slopeUnit:'m/s',
        current(){ return { x: 1/this.lambda(), y: this.vars.f }; } },
      { id:'vl', label:{en:'v vs √T', tc:'v 對 √T', sc:'v 对 √T'},
        xLabel:'√T', yLabel:'v (m/s)', xMax:5, xFmt:1, yFmt:0, slopeUnit:'',
        current(){ return { x: Math.sqrt(this.vars.T), y: this.v() }; } }
    ],
    yMax(){ return Math.max(15, this.vars.f*1.3); }
  },
  playing:true, t:0,
  vars:{ f:8, T:9 },
  equip:{ gen:true, str:true, pul:true, wt:true, ruler:true, strobe:true },
  mu: 0.02,        /* kg/m */
  v(){ return Math.sqrt(this.vars.T/this.mu); },
  lambda(){ return this.v()/this.vars.f; },
  _wave:null, _weight:null,

   init() {
    const g = root3d;
    addGround();
    /* 振動產生器：倒角機箱 + 夾具 + 線圈 */
    const genGroup = new THREE.Group();
    const gen = rbox(0.72, 0.52, 0.52, 0.06, MAT.dark(), 3);
    gen.position.set(-2.72, 1.62, 0);
    genGroup.add(gen);
    const genTop = rbox(0.52, 0.05, 0.40, 0.02, MAT.aluminium(), 2);
    genTop.position.set(-2.72, 1.90, 0); genGroup.add(genTop);
    const genPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12), MAT.steel());
    genPost.position.set(-2.72, 2.25, 0.18); genGroup.add(genPost);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 20), MAT.copper());
    coil.rotation.y = Math.PI / 2; coil.position.set(-2.42, 1.82, 0); genGroup.add(coil);
    g.add(genGroup);
    this._gen = gen;

    /* 滑輪：黃銅輪 + 金屬支架 */
    const pul = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 10, 28), MAT.brass());
    wheel.position.set(2.5, 1.8, 0);
    pul.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16), MAT.steel());
    hub.rotation.x = Math.PI / 2; hub.position.set(2.5, 1.8, 0); pul.add(hub);
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 12), MAT.steel());
    bracket.position.set(2.5, 1.42, 0.15); pul.add(bracket);
    const clamp = rbox(0.30, 0.10, 0.28, 0.03, MAT.dark(), 2);
    clamp.position.set(2.5, 1.02, 0.15); pul.add(clamp);
    g.add(pul);
    this._pulleyPos = new THREE.Vector3(2.5, 1.8, 0);

    /* 弦線：TubeGeometry（有真實粗細），每 1/30 秒重建 */
    const pts = [];
    for (let i=0;i<=120;i++) pts.push(new THREE.Vector3(-2.5 + i*5/120, 1.8, 0));
    this._wave = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 5, false),
      new THREE.MeshPhysicalMaterial({ color: 0xd94b3e, metalness: 0.1, roughness: 0.45, clearcoat: 0.2 })
    );
    g.add(this._wave);

    /* 垂直懸掛弦 */
    this._hang = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(2.5, 1.8, 0), new THREE.Vector3(2.5, 0.6, 0)]), 8, 0.018, 5, false),
      new THREE.MeshPhysicalMaterial({ color: 0xd94b3e, metalness: 0.1, roughness: 0.45 })
    );
    g.add(this._hang);

   /* 開槽砝碼堆（C 形、倒角） */
const stack = createMassStack({
  count: 10, R: 0.30, H: 0.09, spacing: 0.10, taper: 0.012, cap: false,
  colors: [0xb0a07a, 0x99a4b4, 0x8a94a6, 0x7fa3b8, 0xa8a0b8,
           0x93a0b0, 0xb0a07a, 0x99a4b4, 0x8a94a6, 0x7fa3b8]
});
stack.group.position.y = -0.05;
g.add(stack.group);
this._weightGroup = stack.group;
this._discs = stack.discs;

    /* tension arrow (up along the hanging string, pulling the weight up) */
    this._arrTension = new THREE.ArrowHelper(
      new THREE.Vector3(0,1,0), new THREE.Vector3(), 1.5, 0x4da3ff, 0.3, 0.15
    );
    /* weight arrow (down, gravity on the weight) */
    this._arrWeight = new THREE.ArrowHelper(
      new THREE.Vector3(0,-1,0), new THREE.Vector3(), 1.5, 0xff5f56, 0.3, 0.15
    );
    this._arrTension.visible = this._arrWeight.visible = false;
    g.add(this._arrTension, this._arrWeight);
  },
  update(dt) {
    this.t += dt;
    this._phase = (this._phase || 0) + this.vars.f * dt;
  },
   sync3D(dt) {
    /* --- horizontal vibrating string --- */
    const pts = [];
    const L = 5;
    const k = 2*Math.PI/this.lambda() * (L/5);
    const amp = 0.25;
    for (let i=0;i<=120;i++) {
      const x = -2.5 + i*L/120;
      const y = 1.8 + Math.sin(k * (i/120*L) - this._phase*2*Math.PI) * amp * Math.sin(Math.PI*i/120);
      pts.push(new THREE.Vector3(x, y, 0));
    }
    if (this.t - (this._lastWaveT || 0) > 0.033) {
      this._wave.geometry.dispose();
      this._wave.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 5, false);
      this._lastWaveT = this.t;
    }

    /* --- hanging segment: pulley → weight --- */
    /* 弦長隨張力 T 改變：T=1 → 短，T=20 → 長
       公式 drop = 0.55 + T * 0.075  → T=1→0.63，T=20→2.05（單位：世界座標）
       這樣砝碼堆的頂端會隨 T 明顯上下移動 */
    const pulleyY = 1.8;
    const drop = 0.55 + this.vars.T * 0.075;
    const weightY = pulleyY - drop;

    /* 更新懸掛弦幾何（從滑輪底到砝碼頂） */
    const vpts = [new THREE.Vector3(2.5, pulleyY, 0), new THREE.Vector3(2.5, weightY + 0.15, 0)];
    if (Math.abs((this._lastHangY || 0) - weightY) > 0.004) {
      this._hang.geometry.dispose();
      this._hang.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vpts), 8, 0.018, 5, false);
      this._lastHangY = weightY;
    }

    /* 依 T 決定顯示幾片砝碼 (1 到 10 片) */
const nVis = Math.max(1, Math.min(10, Math.round(this.vars.T / 2)));
this._discs.forEach((d, i) => d.visible = i < nVis);

/* 定位砝碼堆：堆頂接在弦底 */
const stackTopY = weightY + 0.15;
this._weightGroup.position.set(2.5, stackTopY, 0);

/* --- force arrows (vector mode) --- */
const show = viewMode === 'vector';
this._arrTension.visible = this._arrWeight.visible = show;
if (show) {
  /* arrow length ∝ T, clamped so it stays readable */
  const lenT = Math.max(0.5, Math.min(2.4, this.vars.T * 0.09));
  /* bottom of the visible stack */
  const stackBottomY = stackTopY - 0.05 - (nVis - 1) * 0.10 - 0.045;

  /* tension: arrow from stack top, points up */
  this._arrTension.position.set(2.5, stackTopY + 0.1, 0);
  this._arrTension.setDirection(new THREE.Vector3(0, 1, 0));
  this._arrTension.setLength(lenT, 0.28, 0.14);

  /* weight: arrow from stack bottom, points down */
  this._arrWeight.position.set(2.5, stackBottomY - 0.1, 0);
  this._arrWeight.setDirection(new THREE.Vector3(0, -1, 0));
  this._arrWeight.setLength(lenT, 0.28, 0.14);
}

    /* --- generator pulse so the source is obvious --- */
    if (this._gen) {
      const s = 1 + Math.sin(this._phase * 2 * Math.PI) * 0.08;
      this._gen.scale.set(1, s, 1);
    }
  },
  draggables(){ return this._discs; },
  dragScale: 0.08,
  onDragStart(){ this._dragT = this.vars.T; },
   onDragMove(dy) {
    /* 往下拖 (dy > 0) → T 增加；往上拖 (dy < 0) → T 減小 */
    this.vars.T = Math.max(1, Math.min(20, this._dragT + dy * this.dragScale));
    const inp = document.getElementById('sl-T');
    if (inp) inp.value = this.vars.T;
    const lab = document.getElementById('sv-T');
    if (lab) lab.textContent = this.vars.T.toFixed(1) + ' N';
  },
  onDragEnd(){},
  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), true);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'v = √(T/μ) and v = fλ. <b>Drag the weight</b> to change tension.',
          tc:'v = √(T/μ) 且 v = fλ。<b>拖曳砝碼</b>改變張力。',
          sc:'v = √(T/μ) 且 v = fλ。<b>拖拽砝码</b>改变张力。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    return [
      ['f', this.vars.f.toFixed(1) + ' Hz'],
      ['T', this.vars.T.toFixed(1) + ' N'],
      ['λ', this.lambda().toFixed(3) + ' m'],
      ['', ''],
      ['v = fλ', this.v().toFixed(2) + ' m/s', true]
    ];
  }
};
