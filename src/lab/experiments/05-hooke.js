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
  id:'hooke',
  cat:'mech',
  title:{ en:"Hooke's Law · F = kx", tc:'虎克定律 · F = kx', sc:'胡克定律 · F = kx' },
  desc:{ en:'Add or remove weights from the spring. Measure the extension — F is proportional to x.',
         tc:'從彈簧增加或移除砝碼。量度伸長量 — F 與 x 成正比。',
         sc:'从弹簧增加或移除砝码。量度伸长量 — F 与 x 成正比。' },
  hasPSU:false,
  cam3d:[5,5,9], camFront:{ pos:[0,4,12], tgt:[0,4,0] },
  vectorLegend:[
    [{en:'Spring restoring force (up)', tc:'彈簧回復力 (上)', sc:'弹簧恢复力 (上)'}, '#ff5f56'],
    [{en:'Weight (down)', tc:'重力 (下)', sc:'重力 (下)'}, '#4da3ff']
  ],
  equipment:[
    {id:'clamp', name:{en:'Stand & clamp', tc:'支架與夾具', sc:'支架与夹具'}},
    {id:'spring', name:{en:'Helical spring', tc:'螺旋彈簧', sc:'螺旋弹簧'}},
    {id:'hanger', name:{en:'Weight hanger', tc:'砝碼掛鉤', sc:'砝码挂钩'}},
    {id:'masses', name:{en:'Mass set (drag)', tc:'砝碼（拖曳）', sc:'砝码（拖拽）'}},
    {id:'ruler', name:{en:'Metre ruler', tc:'米尺', sc:'米尺'}},
    {id:'pointer', name:{en:'Marker', tc:'標記', sc:'标记'}}
  ],
  variables:[
    {id:'k', name:{en:'Spring constant k', tc:'彈簧常數 k', sc:'弹簧常数 k'}, min:10, max:80, step:1, def:30, unit:' N/m'},
    {id:'m', name:{en:'Hanging mass m', tc:'懸掛質量 m', sc:'悬挂质量 m'}, min:0, max:1.0, step:0.02, def:0.20, unit:' kg'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'xm', label:{en:'x vs m', tc:'x 對 m', sc:'x 对 m'},
        xLabel:'m (kg)', yLabel:'x (cm)', xMax:1.1, xFmt:2, yFmt:1, slopeUnit:'cm/kg',
        current(){ return { x:this.vars.m, y:this.x * 100 }; } },
      { id:'xf', label:{en:'x vs F', tc:'x 對 F', sc:'x 对 F'},
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
  _springMesh:null, _hanger:null, _weightDiscs:[],
  _arrowSpring:null, _arrowWeight:null,

  init() {
    const g = root3d;
    addGround();

    /* 鑄鐵底座 + 不鏽鋼立柱 + 十字夾 */
    const stand = createRetortStand({ baseW: 1.5, baseD: 1.05, rodH: 6, rodR: 0.07, clampY: 5.72 });
    stand.group.position.x = -0.82;
    g.add(stand.group);
    this._rod = stand.rod;

    /* 橫臂：由十字夾伸出到彈簧正上方 */
    const arm = barBetween(new THREE.Vector3(-0.82, 5.72, 0), new THREE.Vector3(0, 5.60, 0), 0.045, MAT.steel(), 12);
    g.add(arm);
    const hookTop = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.022, 10, 24), MAT.steel());
    hookTop.rotation.y = Math.PI / 2; hookTop.position.set(0, 5.52, 0); g.add(hookTop);

    /* 真實 3D 螺旋彈簧（TubeGeometry，會隨伸長量更新） */
    this._springMesh = createHelicalSpring(0.28, 12, 0.030, 5.50, 4.0);
    g.add(this._springMesh);

    /* 掛鉤 + 開槽砝碼 */
    const hg = new THREE.Group();
    hg.position.y = 4.0;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 10, 24), MAT.steel());
    hook.rotation.y = Math.PI / 2;
    hg.add(hook);
    const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.52, 16), MAT.steel());
    rod2.position.y = -0.26; hg.add(rod2);
    const stack = createMassStack({ count: 10, R: 0.32, H: 0.09, spacing: 0.10, taper: 0, cap: false });
    stack.group.position.y = -0.52;
    hg.add(stack.group);
    this._weightDiscs = stack.discs;
    g.add(hg);
    this._hanger = hg;

    /* 米尺：帆布刻度貼圖，不是一堆小方塊 */
    const rulerTex = makeCanvas(128, 1024, (c, w, h) => {
      c.fillStyle = '#f4e4bc'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8c39a'; c.fillRect(0, 0, 14, h);
      c.strokeStyle = '#3b3326'; c.fillStyle = '#3b3326';
      for (let i = 0; i <= 100; i++) {
        const y = 14 + i * (h - 28) / 100;
        const major = i % 10 === 0, mid = i % 5 === 0;
        c.fillRect(60, y, major ? 58 : (mid ? 40 : 24), major ? 3 : 2);
        if (major) { c.font = 'bold 17px Inter, system-ui, sans-serif'; c.fillText(String(100 - i), 10, y + 6); }
      }
    });
    const ruler = rbox(0.42, 6.5, 0.08, 0.02, MAT.white(), 2);
    ruler.position.set(1.4, 3.0, 0.1);
    g.add(ruler);
    const rulerFace = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 6.46), new THREE.MeshBasicMaterial({ map: rulerTex.tex }));
    rulerFace.position.set(1.4, 3.0, 0.146);
    g.add(rulerFace);

    /* 紅色標記 */
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.035), new THREE.MeshBasicMaterial({ color: 0xff5f56 }));
    marker.position.set(1.4, 0, 0.18);
    g.add(marker);
    this._marker = marker;

    /* arrows */
    this._arrowSpring = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 2, 0xff5f56, 0.4, 0.18);
    this._arrowWeight = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 2, 0x4da3ff, 0.4, 0.18);
    this._arrowSpring.visible = this._arrowWeight.visible = false;
    g.add(this._arrowSpring, this._arrowWeight);

    this.reset();
  },

  _makeSpring() {
    return createHelicalSpring(0.28, 12, 0.030, 5.50, 4.0);
  },

  reset() {
    this.x = 0;
    this.vel = 0;
  },

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
    /* spring y position: bottomY = 4.0 - x/0.05 */
    const yScale = 1 / 0.05;
    const dY = this.x * yScale;
    const bottomY = 4.0 - dY;
    /* 更新 3D 螺旋彈簧（TubeGeometry，維持金屬粗細） */
    updateHelicalSpring(this._springMesh, 5.50, bottomY);

    /* hanger */
    this._hanger.position.y = bottomY;
    /* weight discs — count reflects mass */
    const nVis = Math.round(this.vars.m / 0.1);
    this._weightDiscs.forEach((d, i) => d.visible = i < nVis);
    /* marker */
    this._marker.position.y = bottomY + 0.15;

    /* arrows */
    const show = viewMode === 'vector';
    this._arrowSpring.visible = this._arrowWeight.visible = show;
    if (show) {
      const Fs = this.vars.k * this.x;              /* spring force up */
      const Fw = this.vars.m * 9.81;                /* weight down */
      const k = 0.08;
      const lenS = Math.max(0.4, Math.min(2.4, Fs * k));
      const lenW = Math.max(0.4, Math.min(2.4, Fw * k));
      this._arrowSpring.position.set(0.5, bottomY + 0.3, 0);
      this._arrowSpring.setDirection(new THREE.Vector3(0, 1, 0));
      this._arrowSpring.setLength(lenS, 0.3, 0.15);
      this._arrowWeight.position.set(-0.5, bottomY - 0.3, 0);
      this._arrowWeight.setDirection(new THREE.Vector3(0, -1, 0));
      this._arrowWeight.setLength(lenW, 0.3, 0.15);
    }
  },

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
          sc:'<b>拖拽砝码</b>改变 m。记录不同 m 下的 x，切到 x 对 F — 斜率 = 1/k。' }) +
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
