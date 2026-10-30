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
  id:'dimension',
  cat:'misc',
  title:{ en:'Dimensional Analysis Checker', tc:'量綱分析檢查器', sc:'量纲分析检查器' },
  desc:{ en:'Test whether a formula is dimensionally consistent. Both sides must have the same base units.',
         tc:'檢查公式是否量綱一致。兩邊必須有相同的基本單位。',
         sc:'检查公式是否量纲一致。两边必须有相同的基本单位。' },
  hasPSU:false,
  cam3d:[0,3,7], camFront:{ pos:[0,2.5,9], tgt:[0,2.5,0] },
  vectorLegend:[],
  equipment:[
    {id:'lst', name:{en:'Formula list', tc:'公式表', sc:'公式表'}},
    {id:'un', name:{en:'Unit table', tc:'單位表', sc:'单位表'}},
    {id:'pen', name:{en:'Pen', tc:'筆', sc:'笔'}},
    {id:'calc', name:{en:'Calculator', tc:'計算機', sc:'计算机'}},
    {id:'book', name:{en:'Textbook', tc:'教科書', sc:'教科书'}},
    {id:'nb', name:{en:'Notebook', tc:'筆記本', sc:'笔记本'}}
  ],
  variables:[
    {id:'idx', name:{en:'Formula index', tc:'公式編號', sc:'公式编号'}, min:0, max:6, step:1, def:0, unit:''}
  ],
  graph:null,
  playing:true, t:0,
  vars:{ idx:0 },
  equip:{ lst:true, un:true, pen:true, calc:true, book:true, nb:true },
  formulas: [
    { eq:'v = u + at',        LHS:'m/s',  RHS:'m/s + (m/s²)(s) = m/s', OK:true },
    { eq:'s = ut + ½at²',     LHS:'m',    RHS:'(m/s)(s) + (m/s²)(s²) = m', OK:true },
    { eq:'v² = u² + 2as',     LHS:'m²/s²',RHS:'(m/s)² + (m/s²)(m) = m²/s²', OK:true },
    { eq:'F = ma',            LHS:'N',    RHS:'kg·m/s² = N', OK:true },
    { eq:'E = mc²',           LHS:'J',    RHS:'kg·(m/s)² = kg·m²/s² = J', OK:true },
    { eq:'v = at²/2',         LHS:'m/s',  RHS:'(m/s²)(s²)/2 = m', OK:false },
    { eq:'P = F/A',           LHS:'Pa',   RHS:'N/m² = Pa', OK:true }
  ],
  init() {
    const g = root3d;
    addGround();
    const plate = rbox(4.0, 2.5, 0.16, 0.04, new THREE.MeshPhysicalMaterial({
      color: 0x14263a, metalness: 0.25, roughness: 0.45, clearcoat: 0.5
    }), 3);
    plate.position.set(0, 2, 0);
    g.add(plate);
    /* 鋁框與展示架 */
    for (const sy of [-1.24, 1.24]) {
      const bar = rbox(4.12, 0.05, 0.20, 0.02, MAT.aluminium(), 2);
      bar.position.set(0, 2 + sy, 0); g.add(bar);
    }
    for (const sx of [-1.99, 1.99]) {
      const bar = rbox(0.05, 2.56, 0.20, 0.02, MAT.aluminium(), 2);
      bar.position.set(sx, 2, 0); g.add(bar);
    }
    for (const sx of [-1.35, 1.35]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.28, 16), MAT.steel());
      leg.position.set(sx, 0.28, -0.22); g.add(leg);
      const foot = rbox(0.48, 0.06, 0.34, 0.02, MAT.dark(), 2);
      foot.position.set(sx, -0.02, -0.22); g.add(foot);
    }

    /* 在板上顯示公式與量綱檢查結果（CanvasTexture） */
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 640;
    this._plateCanvas = cv;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this._plateTex = tex;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 2.4),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    panel.position.set(0, 2, 0.081);
    g.add(panel);
    this._platePanel = panel;
    this._drawPlate();
  },
  _drawPlate() {
    const cv = this._plateCanvas;
    if (!cv) return;
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const f = this.formulas[this.vars.idx | 0] || this.formulas[0];
    const en = (lang === 'en');

    c.fillStyle = '#0b1a2b'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2c4a6e'; c.lineWidth = 8; c.strokeRect(6, 6, W - 12, H - 12);

    c.textAlign = 'left';
    c.fillStyle = '#7fc0ff';
    c.font = 'bold 30px Inter, system-ui, sans-serif';
    c.fillText(en ? 'DIMENSIONAL ANALYSIS' : '量綱分析', 56, 78);

    c.fillStyle = '#e8eef6';
    c.font = 'bold 64px Inter, system-ui, sans-serif';
    c.fillText(f.eq, 56, 192);

    c.font = 'bold 26px Inter, system-ui, sans-serif';
    c.fillStyle = '#8b9aad'; c.fillText('LHS', 56, 282);
    c.fillStyle = '#e8eef6'; c.fillText(f.LHS, 168, 282);
    c.fillStyle = '#8b9aad'; c.fillText('RHS', 56, 342);
    c.fillStyle = '#e8eef6'; c.fillText(f.RHS, 168, 342);

    c.fillStyle = f.OK ? '#2ec4a6' : '#ff5f56';
    c.font = 'bold 38px Inter, system-ui, sans-serif';
    c.fillText(f.OK ? (en ? '✓ DIMENSIONALLY CONSISTENT' : '✓ 量綱一致') : (en ? '✗ NOT CONSISTENT' : '✗ 量綱不一致'), 56, 466);

    c.fillStyle = '#5f7085';
    c.font = '22px Inter, system-ui, sans-serif';
    c.fillText(en ? 'Base units: m · s · kg · A · K · mol · cd' : '基本單位：m · s · kg · A · K · mol · cd', 56, 556);

    c.textAlign = 'right';
    c.fillStyle = '#7fc0ff';
    c.font = 'bold 24px Inter, system-ui, sans-serif';
    c.fillText(((this.vars.idx | 0) + 1) + ' / ' + this.formulas.length, W - 56, 610);
    c.textAlign = 'left';

    if (this._plateTex) this._plateTex.needsUpdate = true;
  },
  update(dt){ this.t += dt; },
  sync3D(){},
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
      T({ en:'Use the slider to browse formulas. Base units: m, s, kg, A, K, mol, cd.',
          tc:'用滑桿瀏覽公式。基本單位：m、s、kg、A、K、mol、cd。',
          sc:'用滑杆浏览公式。基本单位：m、s、kg、A、K、mol、cd。' }) + '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => this._drawPlate());
    bindChks(el, this.equipment, this.equip);
  },
  hud() {
    const f = this.formulas[this.vars.idx|0];
    return [
      ['Formula', f.eq],
      ['LHS', f.LHS],
      ['RHS', f.RHS],
      ['', ''],
      ['Verdict', f.OK ? '✓ consistent' : '✗ NOT consistent', true]
    ];
  }
};
