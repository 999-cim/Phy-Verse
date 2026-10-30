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
  id:'snell',
  cat:'optics',
  title:{ en:"Snell's Law · n₁sin θ₁ = n₂sin θ₂", tc:'司乃耳定律 · n₁sin θ₁ = n₂sin θ₂', sc:'斯涅尔定律 · n₁sin θ₁ = n₂sin θ₂' },
  desc:{ en:'Shine a ray at a glass block. Measure the angles of incidence and refraction.',
         tc:'將光線射向玻璃塊。量度入射角與折射角。',
         sc:'将光线射向玻璃块。量度入射角与折射角。' },
  hasPSU:false,
  cam3d:[4,3,7], camFront:{ pos:[0,3,10], tgt:[0,1,0] },
  vectorLegend:[
    [{en:'Incident ray', tc:'入射光', sc:'入射光'}, '#ff5f56'],
    [{en:'Refracted ray', tc:'折射光', sc:'折射光'}, '#4da3ff'],
    [{en:'Normal', tc:'法線', sc:'法线'}, '#a78bfa']
  ],
  equipment:[
    {id:'laser', name:{en:'Laser', tc:'雷射', sc:'激光'}},
    {id:'blk', name:{en:'Glass block', tc:'玻璃塊', sc:'玻璃块'}},
    {id:'prot', name:{en:'Protractor', tc:'量角器', sc:'量角器'}},
    {id:'scr', name:{en:'Screen', tc:'光屏', sc:'光屏'}},
    {id:'rh', name:{en:'Rotating holder', tc:'旋轉座', sc:'旋转座'}},
    {id:'psu', name:{en:'Laser power', tc:'雷射電源', sc:'激光电源'}}
  ],
  variables:[
    {id:'theta1', name:{en:'Angle of incidence', tc:'入射角', sc:'入射角'}, min:0, max:85, step:1, def:30, unit:'°'},
    {id:'n2', name:{en:'Refractive index n₂', tc:'折射率 n₂', sc:'折射率 n₂'}, min:1.3, max:2.0, step:0.01, def:1.5, unit:''}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'sin', label:{en:'sin θ₁ vs sin θ₂', tc:'sin θ₁ 對 sin θ₂', sc:'sin θ₁ 对 sin θ₂'},
        xLabel:'sin θ₂', yLabel:'sin θ₁', xMax:1, xFmt:1, yFmt:1, slopeUnit:'n₂/n₁',
        current(){ return { x: Math.sin(this.theta2()*Math.PI/180), y: Math.sin(this.vars.theta1*Math.PI/180) }; } },
      { id:'th', label:{en:'θ₁ vs θ₂', tc:'θ₁ 對 θ₂', sc:'θ₁ 对 θ₂'},
        xLabel:'θ₂ (°)', yLabel:'θ₁ (°)', xMax:60, xFmt:0, yFmt:0, slopeUnit:'',
        current(){ return { x:this.theta2(), y:this.vars.theta1 }; } }
    ],
    yMax(){ return 90; }
  },
  playing:true, t:0,
  vars:{ theta1:30, n2:1.5 },
  equip:{ laser:true, blk:true, prot:true, scr:true, rh:true, psu:true },
  n1: 1.0,
  theta2(){ const s = Math.sin(this.vars.theta1*Math.PI/180)*this.n1/this.vars.n2; return s>1?90:Math.asin(s)*180/Math.PI; },
  _rayIn:null, _rayOut:null, _normal:null,

  init() {
    const g = root3d;
    addGround();

    /* 360° 白色量角轉盤 + 光學玻璃磚 */
    const table = createLaserBench();
    g.add(table.group);
    this._table = table;

    const blk = rbox(2.0, 1.4, 2.0, 0.05, MAT.glass(), 4);
    blk.position.y = 0.70;
    g.add(blk);
    this._blk = blk;

    /* 雷射筆：散熱鰭片 + 金屬鏡頭 + 發光鏡片 */
    const laser = createLaserSource();
    laser.group.position.set(-2.4, 2.5, 0);
    laser.group.scale.setScalar(0.85);
    g.add(laser.group);
    this._laser = laser;

    /* 可升降的光學支架，避免雷射筆懸空 */
    this._laserPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1, 12), MAT.steel());
    this._laserBase = rbox(0.50, 0.06, 0.50, 0.02, MAT.dark(), 2);
    this._laserClamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), MAT.brass());
    g.add(this._laserPost, this._laserBase, this._laserClamp);

    /* 法線（虛線） */
    const nm = new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.12, gapSize: 0.09 });
    const np = [new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(0, 3.4, 0)];
    this._normal = new THREE.Line(new THREE.BufferGeometry().setFromPoints(np), nm);
    this._normal.computeLineDistances();
    g.add(this._normal);

    /* 光束：內層箭頭 + 外層 additive glow 管 */
    this._rayIn = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 2.5, 0xff5f56, 0.32, 0.16);
    this._rayOut = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 2.5, 0x4da3ff, 0.32, 0.16);
    this._glowIn = createBeamMesh(0xff5f56, 0.045);
    this._glowOut = createBeamMesh(0x4da3ff, 0.045);
    g.add(this._rayIn, this._rayOut, this._glowIn, this._glowOut);
  },
  update(dt){ this.t += dt; },
  sync3D(dt) {
    const t1 = this.vars.theta1 * Math.PI/180;
    const t2 = this.theta2() * Math.PI/180;
    const dirIn = new THREE.Vector3(Math.sin(t1), -Math.cos(t1), 0);
    const dirOut = new THREE.Vector3(Math.sin(t2), -Math.cos(t2), 0);
    const impact = new THREE.Vector3(0, 1.4, 0);
    const startIn = impact.clone().sub(dirIn.clone().multiplyScalar(2.6));
    const endOut = impact.clone().add(dirOut.clone().multiplyScalar(2.6));

    /* 雷射筆跟隨入射方向，鏡頭對準入射點 */
    if (this._laser) {
      this._laser.group.position.copy(startIn);
      this._laser.group.rotation.z = Math.atan2(dirIn.y, dirIn.x);
      const baseY = -0.34;
      if (this._laserPost) {
        const h = Math.max(0.2, startIn.y - baseY);
        this._laserPost.scale.y = h;
        this._laserPost.position.set(startIn.x, baseY + h / 2, 0);
      }
      if (this._laserBase) this._laserBase.position.set(startIn.x, baseY + 0.03, 0);
      if (this._laserClamp) this._laserClamp.position.set(startIn.x, startIn.y, 0);
    }

    this._rayIn.position.copy(startIn);
    this._rayIn.setDirection(dirIn);
    this._rayIn.setLength(2.6, 0.4, 0.2);
    this._rayOut.position.copy(impact);
    this._rayOut.setDirection(dirOut);
    this._rayOut.setLength(2.6, 0.4, 0.2);
    setBeamMesh(this._glowIn, startIn, impact);
    setBeamMesh(this._glowOut, impact, endOut);

    const vector = viewMode === 'vector';
    this._rayIn.visible = this._rayOut.visible = vector;
    this._glowIn.visible = this._glowOut.visible = true;
    this._normal.visible = vector;
    if (this._laser) this._laser.lens.material.color.setHex(this.vars.theta1 > 0 ? 0xff3b30 : 0x552222);
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
      T({ en:'Plot sin θ₁ vs sin θ₂ — the slope equals n₂/n₁.',
          tc:'將 sin θ₁ 對 sin θ₂ 作圖 — 斜率等於 n₂/n₁。',
          sc:'将 sin θ₁ 对 sin θ₂ 作图 — 斜率等于 n₂/n₁。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    const t2 = this.theta2();
    return [
      ['θ₁', this.vars.theta1.toFixed(1) + '°'],
      ['θ₂', t2.toFixed(1) + '°'],
      ['n₂', this.vars.n2.toFixed(2)],
      ['', ''],
      ['sin θ₁ / sin θ₂', t2<89.9 ? (Math.sin(this.vars.theta1*Math.PI/180)/Math.sin(t2*Math.PI/180)).toFixed(3) : '—', true]
    ];
  }
};
