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
  id:'pendulum',
  cat:'mech',
  title:{ en:'Simple Pendulum · T = 2π√(L/g)', tc:'單擺 · T = 2π√(L/g)', sc:'单摆 · T = 2π√(L/g)' },
  desc:{ en:'Swing a bob. Measure the period and see how it depends on length — not on mass.',
         tc:'擺動擺錘。量度週期，觀察與長度的關係 — 與質量無關。',
         sc:'摆动摆锤。量度周期，观察与长度的关系 — 与质量无关。' },
  hasPSU:false,
  cam3d:[0,4,9], camFront:{ pos:[0,3.5,11], tgt:[0,3.5,0] },
  vectorLegend:[
    [{en:'Tension', tc:'張力', sc:'张力'}, '#4da3ff'],
    [{en:'Weight', tc:'重力', sc:'重力'}, '#ff5f56'],
    [{en:'Restoring component', tc:'回復分量', sc:'恢复分量'}, '#a78bfa']
  ],
  equipment:[
    {id:'stand', name:{en:'Retort stand', tc:'支架', sc:'支架'}},
    {id:'str', name:{en:'String', tc:'細線', sc:'细线'}},
    {id:'bob', name:{en:'Bob (drag)', tc:'擺錘（拖曳）', sc:'摆锤（拖拽）'}},
    {id:'prot', name:{en:'Protractor', tc:'量角器', sc:'量角器'}},
    {id:'ruler', name:{en:'Ruler', tc:'尺', sc:'尺'}},
    {id:'timer', name:{en:'Stopwatch', tc:'碼錶', sc:'秒表'}}
  ],
  variables:[
    {id:'L', name:{en:'String length L', tc:'擺長 L', sc:'摆长 L'}, min:0.3, max:2.0, step:0.05, def:0.8, unit:' m'},
    {id:'g', name:{en:'Gravity g', tc:'重力 g', sc:'重力 g'}, min:1.6, max:20, step:0.1, def:9.81, unit:' m/s²'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'tl', label:{en:'T vs L', tc:'T 對 L', sc:'T 对 L'},
        xLabel:'L (m)', yLabel:'T (s)', xMax:2.2, xFmt:1, yFmt:2, slopeUnit:'s/m',
        current(){ return { x:this.vars.L, y:this.period() }; } },
      { id:'tl2', label:{en:'T² vs L', tc:'T² 對 L', sc:'T² 对 L'},
        xLabel:'L (m)', yLabel:'T² (s²)', xMax:2.2, xFmt:1, yFmt:2, slopeUnit:'s²/m',
        current(){ return { x:this.vars.L, y:this.period()**2 }; } }
    ],
    yMax(){ return Math.max(4, this.period()*1.4); }
  },
  playing:true, t:0,
  vars:{ L:0.8, g:9.81 },
  equip:{ stand:true, str:true, bob:true, prot:true, ruler:true, timer:true },
  angle: 0.35,        /* radians */
  omega: 0,
  bobMass: 0.15,
  _pivot:null, _rod:null, _bob:null, _arrowT:null, _arrowW:null, _prot:null,

  period(){ return 2*Math.PI*Math.sqrt(this.vars.L/this.vars.g); },

  init() {
    const g = root3d;
    addGround();

    /* 鑄鐵底座 + 立柱 + 十字夾 + 橫臂 */
    const stand = createRetortStand({ baseW: 1.35, baseD: 0.95, rodH: 5.2, rodR: 0.065, clampY: 4.92 });
    stand.group.position.x = -1.05;
    g.add(stand.group);
    this._stand = stand;
    g.add(barBetween(new THREE.Vector3(-1.05, 4.92, 0), new THREE.Vector3(1.2, 4.9, 0), 0.042, MAT.steel(), 12));

    /* 樞軸：黃銅軸承 + 小滑輪 */
    const pivot = new THREE.Group();
    const pivotBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 24), MAT.brass());
    pivotBody.rotation.z = Math.PI / 2;
    pivot.add(pivotBody);
    const pivotCap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24), MAT.steel());
    pivotCap.rotation.y = Math.PI / 2;
    pivot.add(pivotCap);
    pivot.position.set(1.2, 4.9, 0);
    g.add(pivot);
    this._pivot = pivot;

    /* 黃銅擺錘 + 金屬吊環 */
    const bob = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 22), MAT.brass());
    ball.castShadow = true;
    bob.add(ball);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20), MAT.steel());
    eye.position.y = 0.25;
    bob.add(eye);
    g.add(bob);
    this._bob = bob;

    /* 細線：TubeGeometry，不是 1px Line */
    const strGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.2, 4.9, 0), new THREE.Vector3(1.2, 4.9-this.vars.L, 0)
    ]), 8, 0.009, 6, false);
    this._rod = new THREE.Mesh(strGeo, new THREE.MeshPhysicalMaterial({ color: 0xd9e0e8, metalness: 0.1, roughness: 0.6 }));
    g.add(this._rod);

    /* 量角器背板（顯示振幅） */
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.05, 48, 1, Math.PI * 1.18, Math.PI * 0.64), MAT.white());
    arc.position.set(1.2, 4.9, -0.14);
    g.add(arc);
    /* arrows */
    this._arrowT = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1, 0x4da3ff, 0.25, 0.12);
    this._arrowW = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 1, 0xff5f56, 0.25, 0.12);
    this._arrowT.visible = this._arrowW.visible = false;
    g.add(this._arrowT, this._arrowW);
    this.angle = 0.35;
    this.omega = 0;
  },
  update(dt) {
    const gv = this.vars.g;
    /* simple pendulum: alpha = -(g/L) sin(theta) */
    const alpha = -(gv/this.vars.L) * Math.sin(this.angle) - 0.2 * this.omega;
    this.omega += alpha * dt;
    this.angle += this.omega * dt;
    this.t += dt;
  },
  sync3D(dt) {
    const px = 1.2, py = 4.9;
    const bx = px + Math.sin(this.angle) * this.vars.L;
    const by = py - Math.cos(this.angle) * this.vars.L;
    this._bob.position.set(bx, by, 0);
    const pts = [new THREE.Vector3(px, py, 0), new THREE.Vector3(bx, by, 0)];
    if (this._rod) {
      this._rod.geometry.dispose();
      this._rod.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.009, 6, false);
    }
    const show = viewMode === 'vector';
    this._arrowT.visible = this._arrowW.visible = show;
    if (show) {
      const m = this.bobMass;
      const T = m*this.vars.g;
      const k = 0.06;
      this._arrowT.position.set(bx, by, 0);
      this._arrowT.setDirection(new THREE.Vector3(-Math.sin(this.angle), Math.cos(this.angle), 0));
      this._arrowT.setLength(T*k, 0.25, 0.12);
      this._arrowW.position.set(bx, by, 0);
      this._arrowW.setDirection(new THREE.Vector3(0,-1,0));
      this._arrowW.setLength(T*k, 0.25, 0.12);
    }
  },
  draggables(){ return [this._bob]; },
  dragScale: 0.008,
  onDragStart(){ this._dragTheta = this.angle; },
  onDragMove(dy) {
    this.angle = Math.max(-1.2, Math.min(1.2, this._dragTheta + dy*this.dragScale));
    this.omega = 0;
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
      T({ en:'<b>Drag the bob</b> sideways to set amplitude. T² vs L is a straight line through the origin.',
          tc:'<b>拖曳擺錘</b>設定振幅。T² 對 L 是過原點的直線。',
          sc:'<b>拖拽摆锤</b>设置振幅。T² 对 L 是过原点的直线。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    return [
      ['L', this.vars.L.toFixed(2) + ' m'],
      ['g', this.vars.g.toFixed(2) + ' m/s²'],
      ['θ', (this.angle*180/Math.PI).toFixed(1) + '°'],
      ['', ''],
      ['T (theory)', this.period().toFixed(3) + ' s', true]
    ];
  }
};
