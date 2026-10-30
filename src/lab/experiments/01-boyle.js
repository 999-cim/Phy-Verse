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
  id:'boyle',
  cat:'gas',
  title:{ en:"Boyle's Law · P₁V₁ = P₂V₂", tc:'波以耳定律 · P₁V₁ = P₂V₂', sc:'玻意耳定律 · P₁V₁ = P₂V₂' },
  desc:{ en:'Drag the weights on the piston to compress the trapped gas. Pressure rises as volume falls — their product stays constant.',
         tc:'拖曳活塞上的砝碼壓縮氣體。體積減小時壓力升高 — 乘積保持不變。',
         sc:'拖拽活塞上的砝码压缩气体。体积减小时压力升高 — 乘积保持不变。' },
  hasPSU:false,
  cam3d:[8,7,11], camFront:{ pos:[0,3.2,15], tgt:[0,3.2,0] },
  vectorLegend:[
    [{en:'Gas pressure force', tc:'氣體壓力', sc:'气体压力'}, '#ff5f56'],
    [{en:'External weight force', tc:'外加重量', sc:'外加重量'}, '#4da3ff'],
    [{en:'Net force', tc:'淨力', sc:'净力'}, '#a78bfa']
  ],
  equipment:[
    {id:'cyl', name:{en:'Glass cylinder', tc:'玻璃氣缸', sc:'玻璃气缸'}},
    {id:'pist', name:{en:'Piston & seal', tc:'活塞與密封', sc:'活塞与密封'}},
    {id:'gas', name:{en:'Trapped gas', tc:'密閉氣體', sc:'密闭气体'}},
    {id:'wt', name:{en:'Weight stack (drag)', tc:'砝碼（拖曳）', sc:'砝码（拖拽）'}},
    {id:'pg', name:{en:'Pressure gauge', tc:'壓力計', sc:'压力计'}},
    {id:'th', name:{en:'Thermometer', tc:'溫度計', sc:'温度计'}}
  ],
  variables:[
    {id:'T', name:{en:'Temperature', tc:'溫度', sc:'温度'}, min:200, max:500, step:1, def:300, unit:' K', locked:true},
    {id:'n', name:{en:'Amount of gas', tc:'莫耳數', sc:'摩尔数'}, min:0.04, max:0.16, step:0.005, def:0.08, unit:' mol', locked:true}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'pv', label:{en:'P vs V', tc:'P 對 V', sc:'P 对 V'},
        xLabel:'V (L)', yLabel:'P (kPa)', xMax:5, xFmt:1, yFmt:0, slopeUnit:'kPa/L',
        current(){ return { x:this.V, y:this.P }; } },
      { id:'p1v', label:{en:'P vs 1/V', tc:'P 對 1/V', sc:'P 对 1/V'},
        xLabel:'1/V (L⁻¹)', yLabel:'P (kPa)', xMax:3, xFmt:2, yFmt:0, slopeUnit:'kPa·L',
        current(){ return { x:this.V>0.01 ? 1/this.V : 0, y:this.P }; } },
      { id:'pvv', label:{en:'P·V vs V', tc:'P·V 對 V', sc:'P·V 对 V'},
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
  _arrowGas:null, _arrowExt:null, _arrowNet:null,
  A:0.01, R:8.314,
  get pext() { return 60 + this.weightDrag * 440; },

  init() {
    const g = root3d;
      addGround();  
    const R = 1.2, H = 6;

    /* 厚底硼矽酸玻璃量筒（刻度、金屬邊圈、PYREX 標籤） */
    const cyl = createGraduatedCylinder({ R, H, marks: true, ticks: 20 });
    g.add(cyl.group);
    this._cylinder = cyl;

    /* 底座：金屬圈 + 橡膠防滑墊 */
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.42, R + 0.52, 0.22, 56), MAT.aluminium());
    base.position.y = -0.24;
    base.receiveShadow = true; base.castShadow = true;
    g.add(base);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(R + 0.38, 0.045, 8, 56), MAT.rubber());
    pad.rotation.x = Math.PI / 2; pad.position.y = -0.35;
    g.add(pad);

    /* gas particles */
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteCanvas.height = 64;
    const sc = spriteCanvas.getContext('2d');
    const grd = sc.createRadialGradient(32,32,0,32,32,32);
    grd.addColorStop(0, 'rgba(210,235,255,1)');
    grd.addColorStop(0.4, 'rgba(110,180,255,0.85)');
    grd.addColorStop(1, 'rgba(60,140,255,0)');
    sc.fillStyle = grd;
    sc.fillRect(0,0,64,64);
    const pTex = new THREE.CanvasTexture(spriteCanvas);
    pTex.colorSpace = THREE.SRGBColorSpace;

    const pGeo = new THREE.BufferGeometry();
    const N = 260;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * (R - 0.15);
      pos[i*3] = Math.cos(a) * rr;
      pos[i*3+1] = 0.15 + Math.random() * 1.5;
      pos[i*3+2] = Math.sin(a) * rr;
      const th = Math.acos(2*Math.random()-1), ph = Math.random()*Math.PI*2;
      vel[i*3] = Math.sin(th)*Math.cos(ph);
      vel[i*3+1] = Math.cos(th);
      vel[i*3+2] = Math.sin(th)*Math.sin(ph);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._particles = { geo:pGeo, vel, N, R };
    const pMat = new THREE.PointsMaterial({
      size: 0.16, map: pTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0.9, color: 0x7fc0ff
    });
    const points = new THREE.Points(pGeo, pMat);
    g.add(points);
    this._pointsMat = pMat;

    /* 活塞：倒角金屬盤 + 雙 O-ring + 不鏽鋼桿 */
    const piston = createPiston(R - 0.05, 0.32, 0.11, 1.4);
    const pg = piston.group;

    /* 開槽砝碼堆（C 形、倒角邊、中心孔） */
    const stack = createMassStack({
      count: 6, R: 0.68, H: 0.18, spacing: 0.2, taper: 0.055,
      colors: [0x99a4b4, 0x8a94a6, 0xb0a07a, 0x7fa3b8, 0xa8a0b8, 0x93a0b0]
    });
    const wg = stack.group;
    wg.position.y = 1.6;
    pg.add(wg);
    this._weights = wg;
    this._weightDiscs = stack.discs;
    if (stack.cap) this._weightDiscs.push(stack.cap);

    g.add(pg);
    this._piston = pg;

    /* force arrows */
    this._arrowGas = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 2, 0xff5f56, 0.5, 0.24);
    this._arrowExt = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 2, 0x4da3ff, 0.5, 0.24);
    this._arrowNet = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 2, 0xa78bfa, 0.5, 0.22);
    this._arrowGas.visible = this._arrowExt.visible = this._arrowNet.visible = false;
    g.add(this._arrowGas, this._arrowExt, this._arrowNet);

    this.reset();
  },

  reset() {
    this.h = 0.10;
    this.vel = 0;
    this.updatePV();
    const pt = this._particles;
    if (pt) {
      const arr = pt.geo.attributes.position.array;
      for (let i = 0; i < pt.N; i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * (pt.R - 0.15);
        arr[i*3] = Math.cos(a) * rr;
        arr[i*3+1] = 0.15 + Math.random() * 1.5;
        arr[i*3+2] = Math.sin(a) * rr;
      }
      pt.geo.attributes.position.needsUpdate = true;
    }
  },

  updatePV() {
    const V = this.A * this.h;
    this.P = this.vars.n * this.R * this.vars.T / V / 1000;
    this.V = V * 1000;
  },

  update(dt) {
    this.updatePV();
    const pextPa = this.pext * 1000;
    const P = this.P * 1000;
    const Fnet = (P - pextPa) * this.A - 400 * this.vel;
    const acc = Fnet / 12;
    this.vel += acc * dt;
    this.vel = Math.max(-3, Math.min(3, this.vel));
    this.h += this.vel * dt;
    if (this.h < 0.04) { this.h = 0.04; this.vel = Math.abs(this.vel) * 0.15; }
    if (this.h > 0.40) { this.h = 0.40; this.vel = -Math.abs(this.vel) * 0.15; }
    this.updatePV();
  },

  sync3D(dt) {
    const yUnit = this.h / 0.05;
        this._piston.position.y = Math.min(5.8, yUnit);

    /* weight stack visibility */
    const nVis = Math.max(1, Math.round(1 + this.weightDrag * 5));
    this._weightDiscs.forEach((d, i) => d.visible = i < nVis);

    /* particles */
    const pt = this._particles;
    if (pt) {
      const arr = pt.geo.attributes.position.array;
      const spd = Math.sqrt(this.vars.T / 300) * 1.2;
      const R_IN = pt.R - 0.15;
      const topY = yUnit - 0.17;
      for (let i = 0; i < pt.N; i++) {
        arr[i*3]   += pt.vel[i*3]   * spd * dt;
        arr[i*3+1] += pt.vel[i*3+1] * spd * dt;
        arr[i*3+2] += pt.vel[i*3+2] * spd * dt;
        const x = arr[i*3], y = arr[i*3+1], z = arr[i*3+2];
        const rad = Math.hypot(x, z);
        if (rad > R_IN) {
          const nx = x/rad, nz = z/rad;
          const dot = pt.vel[i*3]*nx + pt.vel[i*3+2]*nz;
          pt.vel[i*3]   -= 2*dot*nx;
          pt.vel[i*3+2] -= 2*dot*nz;
          arr[i*3]   = nx * R_IN * 0.97;
          arr[i*3+2] = nz * R_IN * 0.97;
        }
        if (y < 0.12) { pt.vel[i*3+1] = Math.abs(pt.vel[i*3+1]); arr[i*3+1] = 0.12; }
        if (y > topY - 0.08) { pt.vel[i*3+1] = -Math.abs(pt.vel[i*3+1]); arr[i*3+1] = topY - 0.08; }
      }
      pt.geo.attributes.position.needsUpdate = true;
    }

    /* arrows (visible only in vector mode) */
    const show = viewMode === 'vector';
    this._arrowGas.visible = this._arrowExt.visible = this._arrowNet.visible = show;
    if (show) {
      const baseY = yUnit + 0.25;
      const P_gas = this.vars.n * this.R * this.vars.T / (this.A * this.h);
      const F_gas = P_gas * this.A;
      const F_ext = this.pext * 1000 * this.A;
      const F_net = F_gas - F_ext;
      const k = 0.00014;
      const lenGas = Math.max(0.4, Math.min(2.8, Math.abs(F_gas) * k));
      const lenExt = Math.max(0.4, Math.min(2.8, Math.abs(F_ext) * k));
      const lenNet = Math.max(0.4, Math.min(2.8, Math.abs(F_net) * k));
      this._arrowGas.position.set(0.75, baseY, 0);
      this._arrowGas.setDirection(new THREE.Vector3(0, 1, 0));
      this._arrowGas.setLength(lenGas, 0.4, 0.2);
      this._arrowExt.position.set(-0.75, baseY + lenExt, 0);
      this._arrowExt.setDirection(new THREE.Vector3(0, -1, 0));
      this._arrowExt.setLength(lenExt, 0.4, 0.2);
      this._arrowNet.position.set(0, baseY, 0.9);
      this._arrowNet.setDirection(new THREE.Vector3(0, F_net >= 0 ? 1 : -1, 0));
      this._arrowNet.setLength(lenNet, 0.35, 0.18);
    }
  },

  draggables(){ return this._weightDiscs; },
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
          sc:'<b>拖拽活塞上方的砝码</b>。观察 P 与 V 实时反应。记录几点后切到 P 对 1/V — 斜率即 nRT。' }) +
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
