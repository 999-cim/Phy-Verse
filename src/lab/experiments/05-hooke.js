import {
  THREE, T, t, lang, root3d, camera, viewMode, marks, trail, scene, renderer,
  MAT, rbox, lathe, barBetween, makeCanvas, slottedMassMesh, createMassStack,
  addGraduation, createGraduatedCylinder, createPiston, createPSU, createMeter,
  createResistor, createPCB, createRetortStand, helixPoints, createHelicalSpring,
  updateHelicalSpring, makeProtractorTexture, createLaserBench, createLaserSource,
  createLauncher, createIRHeatLamp, makeAluFrameBar, createGreenhouse, createWire,
  createBeamMesh, setBeamMesh, addGround, createLabThermometer, updateLabThermometer,
  sliderHTML, bindSliders, chkHTML, bindChks, renderSidebar, renderHUD, updatePtCount,
  refreshPlayBtn, populateGraphSelect, drawGraph, setCamera3D, setViewMode,
} from '../engine.js';
import { createHookeApparatus } from './blueprint-apparatus.js';

export default {
  id:'hooke',
  cat:'mech',
  title:{ en:"Hooke's Law · F = kx", tc:'虎克定律 · F = kx', sc:'胡克定律 · F = kx' },
  desc:{ en:'Add or remove weights from the spring. Measure the extension — F is proportional to x.',
         tc:'從彈簧增加或移除砝碼。量度伸長量 — F 與 x 成正比。',
         sc:'从彈簧增加或移除砝码。量度伸長量 — F 與 x 成正比。' },
  hasPSU:false,
  cam3d:[5,5,9], camFront:{ pos:[0,4,12], tgt:[0,4,0] },
  vectorLegend:[
    [{en:'Spring restoring force (up)', tc:'彈簧回復力 (上)', sc:'彈簧恢复力 (上)'}, '#ff5f56'],
    [{en:'Weight (down)', tc:'重力 (下)', sc:'重力 (下)'}, '#4da3ff']
  ],
  equipment:[
    {id:'clamp', name:{en:'Stand & clamp', tc:'支架與夾具', sc:'支架與夹具'}},
    {id:'spring', name:{en:'Helical spring', tc:'螺旋彈簧', sc:'螺旋彈簧'}},
    {id:'hanger', name:{en:'Weight hanger', tc:'砝碼掛鉤', sc:'砝码挂钩'}},
    {id:'masses', name:{en:'Mass set (drag)', tc:'砝碼（拖曳）', sc:'砝码（拖拽）'}},
    {id:'ruler', name:{en:'Metre ruler', tc:'米尺', sc:'米尺'}},
    {id:'pointer', name:{en:'Marker', tc:'標記', sc:'標記'}}
  ],
  variables:[
    {id:'k', name:{en:'Spring constant k', tc:'彈簧常數 k', sc:'彈簧常數 k'}, min:10, max:80, step:1, def:30, unit:' N/m'},
    {id:'m', name:{en:'Hanging mass m', tc:'懸掛質量 m', sc:'懸挂質量 m'}, min:0, max:1.0, step:0.02, def:0.20, unit:' kg'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'xm', label:{en:'x vs m', tc:'x 對 m', sc:'x 對 m'},
        xLabel:'m (kg)', yLabel:'x (cm)', xMax:1.1, xFmt:2, yFmt:1, slopeUnit:'cm/kg',
        current(){ return { x:this.vars.m, y:this.x * 100 }; } },
      { id:'xf', label:{en:'x vs F', tc:'x 對 F', sc:'x 對 F'},
        xLabel:'F (N)', yLabel:'x (cm)', xMax:12, xFmt:1, yFmt:1, slopeUnit:'cm/N',
        current(){ return { x:this.vars.m * 9.81, y:this.x * 100 }; } }
    ],
    yMax(){ return Math.max(30, this.x * 100 * 1.5 + 4); }
  },
  playing:true, t:0,
  vars:{ k:30, m:0.20 },
  equip:{ clamp:true, spring:true, hanger:true, masses:true, ruler:true, pointer:true },
  x:0.065,           /* extension (m) */
  vel:0,
  _springMesh:null, _spring:null, _hanger:null, _weightDiscs:[],
  _assetRoot:null,
  _arrowSpring:null, _arrowWeight:null,

  init() {
    this._app = createHookeApparatus();
    root3d.add(this._app.group);
    this._app.update(0);
    setCamera3D([3.2, 2.3, 3.8], [0, 1.1, 0]);
  },

  afterInitCamera() { setCamera3D([3.2, 2.3, 3.8], [0, 1.1, 0]); },

  update(dt) {
    /* equilibrium extension = mg / k */
    const targetX = (this.vars.m * 9.81) / this.vars.k;
    /* dynamic approach */
    const k = this.vars.k;
    const m_eq = Math.max(0.01, this.vars.m);
    const acc = (this.vars.m * 9.81 - k * this.x - 8 * this.vel) / Math.max(0.3, m_eq);
    this.vel += acc * dt;
    this.x += this.vel * dt;
    if (this.x < -0.02) { this.x = -0.02; this.vel = 0; }
    if (this.x > 0.5) { this.x = 0.5; this.vel = 0; }
    /* relax to equilibrium faster */
    this.x += (targetX - this.x) * Math.min(1, dt * 6);
  },

  sync3D(dt) {
    if (this._app) this._app.update(this.vars.m);
  },

  _weightDiscs: [],

  draggables(){ return this._weightDiscs; },
  dragScale: 0.005,
  onDragStart(){ this._dragStart = this.vars.m; },
  onDragMove(dy) {
    this.vars.m = Math.max(0, Math.min(1.0, this._dragStart + dy * this.dragScale));
    const inp = document.getElementById('sl-m');
    if (inp) inp.value = this.vars.m;
    const lab = document.getElementById('sv-m');
    if (lab) lab.textContent = this.vars.m.toFixed(2) + ' kg';
  },
  onDragEnd(){},

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
      T({ en:'<b>Drag weights</b> onto the hanger (drag up/down) to change m. Record x at different m, then check x vs F — slope = 1/k.',
          tc:'<b>拖曳砝碼</b>改變 m。記錄不同 m 下的 x，切到 x 對 F — 斜率 = 1/k。',
          sc:'<b>拖拽砝码</b>改變 m。記錄不同 m 下的 x，切到 x 對 F — 斜率 = 1/k。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },

  hud() {
    const F = this.vars.m * 9.81;
    return [
      ['x', (this.x * 100).toFixed(2) + ' cm'],
      ['F', F.toFixed(2) + ' N'],
      ['k', this.vars.k + ' N/m'],
      ['m', this.vars.m.toFixed(2) + ' kg'],
      ['', ''],
      ['F/x', this.x > 0.001 ? (F / this.x).toFixed(1) + ' N/m' : '—', true]
    ];
  }
};
