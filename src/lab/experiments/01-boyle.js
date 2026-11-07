import {
  THREE, T, t, lang, root3d, camera, viewMode, marks, trail, scene, renderer,
  barBetween, makeCanvas, createPSU, createMeter,
  createResistor, createPCB, createRetortStand, helixPoints, createHelicalSpring,
  updateHelicalSpring, makeProtractorTexture, createLaserBench, createLaserSource,
  createLauncher, createIRHeatLamp, makeAluFrameBar, createGreenhouse, createWire,
  createBeamMesh, setBeamMesh, addGround, createLabThermometer, updateLabThermometer,
  sliderHTML, bindSliders, chkHTML, bindChks, renderSidebar, renderHUD, updatePtCount,
  refreshPlayBtn, populateGraphSelect, drawGraph, setCamera3D, setViewMode,
} from '../engine.js';
import { createBoyleApparatus } from './blueprint-apparatus.js';

export default {
  id:'boyle',
  cat:'gas',
  title:{ en:"Boyle's Law · P₁V₁ = P₂V₂", tc:'波以耳定律 · P₁V₁ = P₂V₂', sc:'玻意耳定律 · P₁V₁ = P₂V₂' },
  desc:{ en:'Drag the weights on the piston to compress the trapped gas. Pressure rises as volume falls — their product stays constant.',
         tc:'拖曳活塞上的砝碼壓縮氣體。體積減小時壓力升高 — 乘積保持不變。',
         sc:'拖拽活塞上的砝码壓缩氣體。體積减小時壓力升高 — 乘積保持不變。' },
  hasPSU:false,
  cam3d:[8,7,11], camFront:{ pos:[0,3.2,15], tgt:[0,3.2,0] },
  vectorLegend:[
    [{en:'Gas pressure force', tc:'氣體壓力', sc:'氣體壓力'}, '#ff5f56'],
    [{en:'External weight force', tc:'外加重量', sc:'外加重量'}, '#4da3ff'],
    [{en:'Net force', tc:'淨力', sc:'净力'}, '#a78bfa']
  ],
  equipment:[
    {id:'cyl', name:{en:'Glass cylinder', tc:'玻璃氣缸', sc:'玻璃氣缸'}},
    {id:'pist', name:{en:'Piston & seal', tc:'活塞與密封', sc:'活塞與密封'}},
    {id:'gas', name:{en:'Trapped gas', tc:'密閉氣體', sc:'密閉氣體'}},
    {id:'wt', name:{en:'Weight stack (drag)', tc:'砝碼（拖曳）', sc:'砝码（拖拽）'}},
    {id:'pg', name:{en:'Pressure gauge', tc:'壓力計', sc:'壓力計'}},
    {id:'th', name:{en:'Thermometer', tc:'溫度計', sc:'溫度計'}}
  ],
  variables:[
    {id:'T', name:{en:'Temperature', tc:'溫度', sc:'溫度'}, min:200, max:500, step:1, def:300, unit:' K', locked:true},
    {id:'n', name:{en:'Amount of gas', tc:'莫耳數', sc:'摩爾數'}, min:0.04, max:0.16, step:0.005, def:0.08, unit:' mol', locked:true}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'pv', label:{en:'P vs V', tc:'P 對 V', sc:'P 對 V'},
        xLabel:'V (L)', yLabel:'P (kPa)', xMax:5, xFmt:1, yFmt:0, slopeUnit:'kPa/L',
        current(){ return { x:this.V, y:this.P }; } },
      { id:'p1v', label:{en:'P vs 1/V', tc:'P 對 1/V', sc:'P 對 1/V'},
        xLabel:'1/V (L⁻¹)', yLabel:'P (kPa)', xMax:3, xFmt:2, yFmt:0, slopeUnit:'kPa·L',
        current(){ return { x:this.V>0.01 ? 1/this.V : 0, y:this.P }; } },
      { id:'pvv', label:{en:'P·V vs V', tc:'P·V 對 V', sc:'P·V 對 V'},
        xLabel:'V (L)', yLabel:'P·V (J)', xMax:5, xFmt:1, yFmt:0, slopeUnit:'',
        current(){ return { x:this.V, y:this.P * this.V }; } }
    ],
    yMax(){ return this.graph.activeType === 2 ? Math.max(30, this.P*this.V*1.35) : Math.max(220, this.P*1.3); }
  },
  /* state */
  playing:true, t:0,
  vars:{ T:300, n:0.08 },
  equip:{ cyl:true, pist:true, gas:true, wt:true, pg:true, th:true },
  V:1.0, P:200, h:0.10, vel:0, weightDrag:0.35,
  _meshes:{}, _particles:[], _piston:null, _weights:null, _weightDiscs:[],
  _assetRoot:null, _assetScaleY:1, _assetReady:false, _assetError:null,
  _arrowGas:null, _arrowExt:null, _arrowNet:null,
  A:0.01, R:8.314,
  get pext() { return 60 + this.weightDrag * 440; },

  init() {
    this._app = createBoyleApparatus();
    root3d.add(this._app.group);
    this._app.update(1.6);
    setCamera3D([2.8, 2.1, 3.4], [0, 1.05, 0]);
    this.h = 0.40;
  },

  afterInitCamera() { setCamera3D([2.8, 2.1, 3.4], [0, 1.05, 0]); },

  reset() {
    this.h = 0.40;
    this.vel = 0;
    this.updatePV();
    if (this._app) this._app.update(1.6);
  },

  updatePV() {
    const V = this.A * this.h;
    this.P = this.vars.n * this.R * this.vars.T / V / 1000;
    this.V = V * 1000;
  },

  afterInitCamera() { setCamera3D([7.8, 7.0, 9.5], [0.8, 3.2, 0]); },
  update(dt) {
    this.t += dt;
    this.h += this.vel * dt;
    if (this.h < 0.04) { this.h = 0.04; this.vel = Math.abs(this.vel) * 0.15; }
    if (this.h > 0.40) { this.h = 0.40; this.vel = -Math.abs(this.vel) * 0.15; }
    this.updatePV();
  },

  sync3D(dt) {
    if (!this._app) return;
    const hVis = 0.5 + 1.1 * ((Math.max(0.04, Math.min(0.40, this.h)) - 0.04) / 0.36);
    this._app.update(hVis);
  },

  draggables(){
    const head = this._piston && this._piston.getObjectByName ? this._piston.getObjectByName('Piston_Head') : null;
    return head ? [...this._weightDiscs, head] : this._weightDiscs;
  },
  dragScale: 0.0035,
  onDragStart(){ this._dragStart = this.weightDrag; },
  onDragMove(dy) {
    this.weightDrag = Math.max(0, Math.min(1, this._dragStart + dy * this.dragScale));
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
      T({ en:'<b>Drag the weight stack</b> above the piston up/down. Watch P and V respond in real time. Record points, then check P vs 1/V — the slope is nRT.',
          tc:'<b>拖曳活塞上方的砝碼</b>。觀察 P 與 V 即時反應。記錄幾點後切到 P 對 1/V — 斜率即 nRT。',
          sc:'<b>拖拽活塞上方的砝码</b>。观察 P 與 V 實時反應。記錄几點後切到 P 對 1/V — 斜率即 nRT。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => this.reset());
    bindChks(el, this.equipment, this.equip);
  },

  hud() {
    return [
      ['P', this.P.toFixed(1) + ' kPa'],
      ['V', this.V.toFixed(3) + ' L'],
      ['T', this.vars.T.toFixed(0) + ' K'],
      ['n', this.vars.n.toFixed(3) + ' mol'],
      ['', ''],
      ['P·V', (this.P * this.V).toFixed(1) + ' J', true]
    ];
  }
};
