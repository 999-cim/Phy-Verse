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
  id:'projectile',
  cat:'mech',
  title:{ en:'Projectile Motion', tc:'拋體運動', sc:'抛体运动' },
  desc:{ en:'Launch a ball. See how range depends on angle and speed, independent of mass.',
         tc:'發射小球。觀察射程如何取決於角度與速度，與質量無關。',
         sc:'发射小球。观察射程如何取决于角度与速度，与质量无关。' },
  hasPSU:false,
  cam3d:[0,4.2,8.6], camFront:{ pos:[0,3.2,11], tgt:[0,3.2,0] },
  vectorLegend:[
    [{en:'Velocity', tc:'速度', sc:'速度'}, '#4da3ff'],
    [{en:'Gravity', tc:'重力', sc:'重力'}, '#ff5f56']
  ],
  equipment:[
    {id:'launcher', name:{en:'Spring launcher', tc:'彈簧發射器', sc:'弹簧发射器'}},
    {id:'ball', name:{en:'Ball', tc:'小球', sc:'小球'}},
    {id:'prot', name:{en:'Protractor', tc:'量角器', sc:'量角器'}},
    {id:'grid', name:{en:'Grid floor', tc:'網格地板', sc:'网格地板'}},
    {id:'cam', name:{en:'Video camera', tc:'攝影機', sc:'摄像机'}},
    {id:'ruler', name:{en:'Ruler', tc:'尺', sc:'尺'}}
  ],
  variables:[
    {id:'angle', name:{en:'Launch angle', tc:'發射角度', sc:'发射角度'}, min:5, max:85, step:1, def:45, unit:'°'},
    {id:'speed', name:{en:'Launch speed', tc:'發射速度', sc:'发射速度'}, min:3, max:20, step:0.5, def:10, unit:' m/s'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'range', label:{en:'Range vs angle', tc:'射程 對 角度', sc:'射程 对 角度'},
        xLabel:'Angle (°)', yLabel:'Range (m)', xMax:90, xFmt:0, yFmt:1, slopeUnit:'',
        current(){ return { x:this.vars.angle, y:this.range() }; } },
          { id:'y', label:{en:'Y vs X', tc:'Y 對 X', sc:'Y 对 X'},
              xLabel:'X (m)', yLabel:'Y (m)', xMax:40, xFmt:1, yFmt:1, slopeUnit:'',
              current(){ return this._lastPos || { x:0, y:0 }; } } 
    ],
    yMax(){ return this.graph.activeType === 1 ? 12 : 25; }
  },
  playing:true, t:0,
  vars:{ angle:45, speed:10 },
  equip:{ launcher:true, ball:true, prot:true, grid:true, cam:true, ruler:true },
  _ball:null, _trail:null, _launched:false, _vx:0, _vy:0, _x:0, _y:0, _lastPos:null,

  range(){ const a = this.vars.angle*Math.PI/180; return this.vars.speed*this.vars.speed*Math.sin(2*a)/9.81; },

  init() {
    const g = root3d;
    addGround(24, 24);
    /* 彈簧拋射砲台：底座、俯仰軸、角度尺、金屬砲管 */
    const launcher = createLauncher();
    g.add(launcher.group);
    this._launcher = launcher;
    this._barrelPivot = launcher.pivot;
    this._barrel = launcher.barrel;
    /* ball */
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xff5f56, metalness: 0.4, roughness: 0.35 }));
    ball.castShadow = true;
    g.add(ball);
    this._ball = ball;
    /* trail */
    this._trailPts = [];
    this._trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x4da3ff, transparent: true, opacity: 0.75 })
    );
    g.add(this._trail);
    this._reset();
  },
    _reset() {
    this.t = 0;
    const a = this.vars.angle*Math.PI/180;
    /* 由砲口出發（與 3D 砲管方向一致），不是從原點突然出現 */
    this._x = Math.cos(a) * 0.82;
    this._y = 0.56 + Math.sin(a) * 0.82;
    this._vx = this.vars.speed*Math.cos(a);
    this._vy = this.vars.speed*Math.sin(a);
    const dh = Math.max(0.05, this._y - 0.15), g = 9.81;
    this._flightTime = (this._vy + Math.sqrt(Math.max(0, this._vy*this._vy + 2*g*dh))) / g;
    this._trailPts = [];
    this._launched = false;
  },
  update(dt) {
    this.t += dt;
    const a = this.vars.angle*Math.PI/180;
    this._vx = this.vars.speed*Math.cos(a);
    this._vy -= 9.81 * dt;
    this._x += this._vx * dt;
    this._y += this._vy * dt;
    if (this._y < 0.15) { this._y = 0.15; this._vy = 0; this._vx = 0; }
    this._lastPos = { x: this._x, y: this._y };
  },
  sync3D(dt) {
    /* 砲管隨角度即時俯仰 */
    if (this._barrelPivot) this._barrelPivot.rotation.z = this.vars.angle * Math.PI / 180;
    this._ball.position.set(this._x, this._y, 0);
    if (this._y > 0.16 && (this._trailPts.length === 0 || 
        Math.abs(this._x - this._trailPts[this._trailPts.length-1].x) > 0.15)) {
      this._trailPts.push(new THREE.Vector3(this._x, this._y, 0));
      if (this._trailPts.length > 300) this._trailPts.shift();
      this._trail.geometry.dispose();
      this._trail.geometry = new THREE.BufferGeometry().setFromPoints(this._trailPts);
    }
    if (this._y <= 0.16 && this.t > 1) {
      /* landed — restart after a delay */
      if (this.t > this._flightTime + 1.5) this._reset();
    }
  },
  draggables(){ return []; }, onDragStart(){}, onDragMove(){}, onDragEnd(){},
  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), true);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'Maximum range is at 45°. Complementary angles (30° and 60°) give the same range.',
          tc:'最大射程在 45°。互補角度（30° 與 60°）射程相同。',
          sc:'最大射程在 45°。互补角度（30° 与 60°）射程相同。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => this._reset());
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    return [
      ['angle', this.vars.angle + '°'],
      ['speed', this.vars.speed.toFixed(1) + ' m/s'],
      ['x', this._x.toFixed(2) + ' m'],
      ['y', this._y.toFixed(2) + ' m'],
      ['', ''],
      ['Range', this.range().toFixed(2) + ' m', true]
    ];
  }
};
