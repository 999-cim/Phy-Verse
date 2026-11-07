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
import { createWaveApparatus } from './blueprint-apparatus.js';

export default {
  id:'wave',
  cat:'waves',
  title:{ en:'Wave on a String · v = fλ', tc:'弦上波 · v = fλ', sc:'弦上波 · v = fλ' },
  desc:{ en:'Adjust frequency and tension. Watch the wavelength change to keep v = fλ.',
         tc:'調整頻率與張力。觀察波長如何改變以維持 v = fλ。',
         sc:'调整频率與张力。观察波長如何改變以维持 v = fλ。' },
  hasPSU:false,
  cam3d:[0,3,8], camFront:{ pos:[0,2,10], tgt:[0,2,0] },
   vectorLegend:[
    [{en:'Tension (string pulls up)', tc:'張力（弦向上拉）', sc:'张力（弦向上拉）'}, '#4da3ff'],
    [{en:'Weight / gravity (down)', tc:'重力（向下）', sc:'重力（向下）'}, '#ff5f56']
  ],
  equipment:[
    {id:'gen', name:{en:'Vibration generator', tc:'振動器', sc:'振動器'}},
    {id:'str', name:{en:'String', tc:'弦線', sc:'弦線'}},
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
      { id:'fl', label:{en:'f vs 1/λ', tc:'f 對 1/λ', sc:'f 對 1/λ'},
        xLabel:'1/λ (m⁻¹)', yLabel:'f (Hz)', xMax:20, xFmt:1, yFmt:0, slopeUnit:'m/s',
        current(){ return { x: 1/this.lambda(), y: this.vars.f }; } },
      { id:'vl', label:{en:'v vs √T', tc:'v 對 √T', sc:'v 對 √T'},
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
    this._app = createWaveApparatus();
    root3d.add(this._app.group);
    this._app.update(0);
    setCamera3D([2.6, 1.8, 3.2], [0, 0.22, 0]);
  },

  update(dt) {
    this.t += dt;
    this._phase = (this._phase || 0) + this.vars.f * dt;
  },
   sync3D(dt) {
    if (this._app) this._app.update(this.t);
  },
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
          sc:'v = √(T/μ) 且 v = fλ。<b>拖拽砝码</b>改變张力。' }) + '</div></div>';
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
