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
  id:'greenhouse',
  cat:'heat',
  title:{ en:'Greenhouse Effect', tc:'溫室效應', sc:'温室效应' },
  desc:{ en:'Compare temperature rise inside and outside a glass box under a heat lamp.',
         tc:'比較加熱燈下玻璃箱內外的升溫。',
         sc:'比较加热灯下玻璃箱内外的升温。' },
  hasPSU:false,
  cam3d:[4,3,8], camFront:{ pos:[0,3,10], tgt:[0,3,0] },
  vectorLegend:[
    [{en:'Incoming', tc:'入射', sc:'入射'}, '#ffb020'],
    [{en:'Trapped IR', tc:'困住的紅外線', sc:'困住的红外线'}, '#ff5f56']
  ],
  equipment:[
    {id:'lamp', name:{en:'Heat lamp', tc:'熱燈', sc:'热灯'}},
    {id:'box', name:{en:'Glass box', tc:'玻璃箱', sc:'玻璃箱'}},
    {id:'th1', name:{en:'T inside', tc:'箱內 T', sc:'箱内 T'}},
    {id:'th2', name:{en:'T outside', tc:'箱外 T', sc:'箱外 T'}},
    {id:'co2', name:{en:'CO₂ supply', tc:'CO₂ 來源', sc:'CO₂ 来源'}},
    {id:'stand', name:{en:'Stand', tc:'支架', sc:'支架'}}
  ],
  variables:[
    {id:'co2', name:{en:'CO₂ concentration', tc:'CO₂ 濃度', sc:'CO₂ 浓度'}, min:0, max:1, step:0.05, def:0.5, unit:''}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'T', label:{en:'T vs time', tc:'T 對時間', sc:'T 对时间'},
        xLabel:'Time (s)', yLabel:'T (°C)', xMax:200, xFmt:0, yFmt:1, slopeUnit:'°C/s',
        current(){ return { x:this.t, y:this.Tin - 273 }; } }
    ],
    yMax(){ return Math.max(40, (this.Tin-273)*1.3); }
  },
  playing:true, t:0,
  vars:{ co2:0.5 },
  equip:{ lamp:true, box:true, th1:true, th2:true, co2:true, stand:true },
  Tin: 293, Tout: 293,
  _box:null, _lamp:null,

    init() {
    const g = root3d;
    addGround();

    /* 燈頭自動俯衝對準溫室中心，而不是水平射向空中 */
    const lamp = createIRHeatLamp(1.02, 0.90, new THREE.Vector3(-1.5, 0.95, 0));
    g.add(lamp.group);
    this._lamp = lamp.bulb;
    this._lampGlass = lamp.bulbGlass;
    this._lampHead = lamp.head;
    this._lampShade = lamp.shade;
    this._lampGroup = lamp.group;
    this._lampLight = lamp.light;
    this._beam = lamp.beam;

    /* 玻璃溫室：鋁合金骨架 + 斜屋頂 + 門框 */
    const gh = createGreenhouse(2.0, 1.6, 2.0, 0.8);
    gh.group.position.set(-1.5, 0, 0);
    g.add(gh.group);
    this._box = gh.walls;
    this._house = gh.group;
    this._ghRoof = gh.roof;

    /* Two thermometers: inside the greenhouse (-1.5, 0.15, 0) and outside (0.2, 0.15, 0.5) */
    this._thIn  = createLabThermometer(-1.5, 0.15, 0.0, 0xff3b30, 1.35);
    this._thOut = createLabThermometer(0.2, 0.15, 0.5, 0x3b82f6, 1.35);
    g.add(this._thIn.group);
    g.add(this._thOut.group);
  },
  update(dt) {
    /* greenhouse: incoming solar + trapped IR depending on co2 */
    const solar = 60;
    const trap = 1 + this.vars.co2 * 3;
    const lossIn = 0.15 * (this.Tin - 293);
    const lossOut = 0.5 * (this.Tout - 293);
    this.Tin += (solar*trap*0.5 - lossIn) / (0.5*900) * dt;
    this.Tout += (solar*0.3 - lossOut) / (0.5*900) * dt;
    this.Tin = Math.min(360, this.Tin);
    this.Tout = Math.min(330, this.Tout);
    this.t += dt;
  },
   sync3D(dt) {
    const f = Math.min(1, (this.Tin - 293) / 60);
    if (this._box) {
      this._box.material.opacity = 0.15 + this.vars.co2 * 0.35;
      this._box.material.color.setHSL(0.58 - f * 0.5, 0.5, 0.7 - f * 0.3);
    }
    if (this._lampGroup) this._lampGroup.visible = this.equip.lamp !== false;
    if (this._lamp) this._lamp.scale.setScalar(0.9 + Math.sin(this.t * 4) * 0.06);
    if (this._lampGlass && this._lamp) this._lampGlass.scale.copy(this._lamp.scale);
    if (this._beam) this._beam.material.opacity = 0.035 + this.vars.co2 * 0.05;
    if (this._lampLight) this._lampLight.intensity = 2.4;

    if (this._thIn) {
      this._thIn.group.visible = this.equip.th1 !== false;
      updateLabThermometer(this._thIn, this.Tin, 273, 365);
    }
    if (this._thOut) {
      this._thOut.group.visible = this.equip.th2 !== false;
      updateLabThermometer(this._thOut, this.Tout, 273, 365);
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
      T({ en:'More CO₂ → more trapped IR → hotter inside. This is the greenhouse effect.',
          tc:'更多 CO₂ → 更多困住的紅外線 → 內部更熱。這就是溫室效應。',
          sc:'更多 CO₂ → 更多困住的红外线 → 内部更热。这就是温室效应。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    return [
      ['T inside', (this.Tin-273).toFixed(1) + ' °C'],
      ['T outside', (this.Tout-273).toFixed(1) + ' °C'],
      ['', ''],
      ['ΔT', (this.Tin - this.Tout).toFixed(2) + ' °C', true]
    ];
  }
};
