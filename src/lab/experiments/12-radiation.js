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
  id:'radiation',
  cat:'heat',
  title:{ en:'Thermal Radiation', tc:'熱輻射', sc:'热辐射' },
  desc:{ en:'Compare how black and shiny surfaces absorb radiation. Black surfaces absorb and emit best.',
         tc:'比較黑色與光亮表面的吸收。黑色表面吸收與輻射最佳。',
         sc:'比较黑色与光亮表面的吸收。黑色表面吸收与辐射最佳。' },
  hasPSU:false,
  cam3d:[4,3,8], camFront:{ pos:[0,3,10], tgt:[0,3,0] },
  vectorLegend:[
    [{en:'Incident radiation', tc:'入射輻射', sc:'入射辐射'}, '#ffb020'],
    [{en:'Re-emitted', tc:'再輻射', sc:'再辐射'}, '#ff5f56']
  ],
  equipment:[
    {id:'lamp', name:{en:'Heat lamp', tc:'熱燈', sc:'热灯'}},
    {id:'blk', name:{en:'Black plate', tc:'黑面版', sc:'黑面板'}},
    {id:'slv', name:{en:'Shiny plate', tc:'光亮面版', sc:'光亮面板'}},
    {id:'th1', name:{en:'T₁', tc:'T₁', sc:'T₁'}},
    {id:'th2', name:{en:'T₂', tc:'T₂', sc:'T₂'}},
    {id:'stand', name:{en:'Stand', tc:'支架', sc:'支架'}}
  ],
  variables:[
    {id:'lamp', name:{en:'Lamp intensity', tc:'燈強度', sc:'灯强度'}, min:0, max:1, step:0.05, def:0.7, unit:''}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'dT', label:{en:'ΔT vs time', tc:'ΔT 對時間', sc:'ΔT 对时间'},
        xLabel:'Time (s)', yLabel:'ΔT (°C)', xMax:120, xFmt:0, yFmt:1, slopeUnit:'°C/s',
        current(){ return { x:this.t, y:this.Tblk - this.Tslv }; } }
    ],
    yMax(){ return 30; }
  },
  playing:true, t:0,
  vars:{ lamp:0.7 },
  equip:{ lamp:true, blk:true, slv:true, th1:true, th2:true, stand:true },
  Tblk: 293, Tslv: 293,
  _blk:null, _slv:null, _lamp:null,

    init() {
    const g = root3d;
    addGround();

    /* 與黑板/亮板同 z 中心，燈頭自動俯衝對準兩塊板 */
    const lamp = createIRHeatLamp(0.92, 0.90, new THREE.Vector3(-1.8, 1.35, 0.9));
    g.add(lamp.group);
    this._lamp = lamp.bulb;
    this._lampGlass = lamp.bulbGlass;
    this._lampHead = lamp.head;
    this._lampShade = lamp.shade;
    this._lampGroup = lamp.group;
    this._lampLight = lamp.light;
    this._beam = lamp.beam;

    /* 黑面版 / 光亮面版：倒角板 + 鋁框 + 支撐柱 */
    function radiationPlate(z, material) {
      const grp = new THREE.Group();
      const body = rbox(0.16, 1.2, 1.2, 0.03, material, 3);
      body.position.set(-1.8, 1.5, z);
      grp.add(body);
      for (const sy of [-0.58, 0.58]) {
        const bar = rbox(0.20, 0.05, 1.24, 0.02, MAT.aluminium(), 2);
        bar.position.set(-1.8, 1.5 + sy, z); grp.add(bar);
      }
      for (const sz of [-0.58, 0.58]) {
        const bar = rbox(0.20, 1.24, 0.05, 0.02, MAT.aluminium(), 2);
        bar.position.set(-1.8, 1.5, z + sz); grp.add(bar);
      }
      const support = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.2, 16), MAT.steel());
      support.position.set(-1.8, 0.25, z); grp.add(support);
      const foot = rbox(0.42, 0.06, 0.34, 0.02, MAT.dark(), 2);
      foot.position.set(-1.8, -0.02, z); grp.add(foot);
      return { group: grp, body };
    }
    const blackPlate = radiationPlate(0, new THREE.MeshPhysicalMaterial({
      color: 0x0c1014, metalness: 0.15, roughness: 0.78, clearcoat: 0.2
    }));
    g.add(blackPlate.group);
    this._blk = blackPlate.body;
    const shinyPlate = radiationPlate(1.8, new THREE.MeshPhysicalMaterial({
      color: 0xdde2e9, metalness: 0.97, roughness: 0.06, clearcoat: 0.5
    }));
    g.add(shinyPlate.group);
    this._slv = shinyPlate.body;

    /* Thermometers attached directly behind Black Plate (z=0) and Shiny Plate (z=1.8) */
    this._th1 = createLabThermometer(-1.95, 0.85, 0.0, 0xff3b30, 1.6);
    this._th2 = createLabThermometer(-1.95, 0.85, 1.8, 0x3b82f6, 1.6);
    g.add(this._th1.group);
    g.add(this._th2.group);

    /* Vector arrows from lamp toward each plate */
    this._arr1 = new THREE.ArrowHelper(
      new THREE.Vector3(-1, -0.35, 0).normalize(), new THREE.Vector3(0.6, 2.5, 0.0),
      2.2, 0xffb020, 0.38, 0.18
    );
    this._arr2 = new THREE.ArrowHelper(
      new THREE.Vector3(-1, -0.35, 0).normalize(), new THREE.Vector3(0.6, 2.5, 1.8),
      2.2, 0xffb020, 0.38, 0.18
    );
    g.add(this._arr1, this._arr2);
  },
  update(dt) {
    const P = this.vars.lamp * 50;
    const eB = 0.98, eS = 0.05;
    this.Tblk += (P*eB - 0.3*(this.Tblk-293)) / (0.3*900) * dt;
    this.Tslv += (P*eS - 0.3*(this.Tslv-293)) / (0.3*900) * dt;
    this.Tblk = Math.min(400, this.Tblk);
    this.Tslv = Math.min(400, this.Tslv);
    this.t += dt;
  },
    sync3D(dt) {
    if (this._lampGroup) this._lampGroup.visible = this.equip.lamp !== false;
    if (this._lamp) {
      this._lamp.material.opacity = 0.3 + this.vars.lamp * 0.7;
      this._lamp.scale.setScalar(0.9 + this.vars.lamp * 0.35);
    }
    if (this._lampGlass && this._lamp) this._lampGlass.scale.copy(this._lamp.scale);
    if (this._beam) this._beam.material.opacity = 0.035 + this.vars.lamp * 0.085;
    if (this._lampLight) this._lampLight.intensity = 1.2 + this.vars.lamp * 4.2;

    const fb = Math.min(1, (this.Tblk - 293) / 80);
    const fs = Math.min(1, (this.Tslv - 293) / 80);
    if (this._blk) this._blk.material.color.setHSL(0.58 - fb*0.55, 0.3, 0.1 + fb*0.2);
    if (this._slv) this._slv.material.color.setHSL(0.58 - fs*0.55, 0.05, 0.85 - fs*0.4);

    if (this._th1) {
      this._th1.group.visible = this.equip.th1 !== false;
      updateLabThermometer(this._th1, this.Tblk, 273, 393);
    }
    if (this._th2) {
      this._th2.group.visible = this.equip.th2 !== false;
      updateLabThermometer(this._th2, this.Tslv, 273, 393);
    }

    /* Arrows visible only in vector mode */
    const show = viewMode === 'vector';
    if (this._arr1) this._arr1.visible = show;
    if (this._arr2) this._arr2.visible = show;
    if (show) {
      const len = 1.5 + this.vars.lamp * 1.2;
      this._arr1.setLength(len, 0.4, 0.2);
      this._arr2.setLength(len, 0.4, 0.2);
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
      T({ en:'Black surfaces are good absorbers (and good emitters). Shiny surfaces reflect.',
          tc:'黑色表面是良好吸收體（也是良好輻射體）。光亮表面反射。',
          sc:'黑色表面是良好吸收体（也是良好辐射体）。光亮表面反射。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    return [
      ['T black', (this.Tblk-273).toFixed(1) + ' °C'],
      ['T shiny', (this.Tslv-273).toFixed(1) + ' °C'],
      ['', ''],
      ['ΔT', (this.Tblk - this.Tslv).toFixed(2) + ' °C', true]
    ];
  }
};
