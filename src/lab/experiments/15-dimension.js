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
import { loadHandbookGLB, mountHandbookRoot } from '../toonify.js';

export default {
  id:'dimension',
  cat:'misc',
  title:{ en:'Dimensional Analysis Checker', tc:'量綱分析檢查器', sc:'量綱分析检查器' },
  desc:{ en:'Test whether a formula is dimensionally consistent. Both sides must have the same base units.',
         tc:'檢查公式是否量綱一致。兩邊必須有相同的基本單位。',
         sc:'检查公式是否量綱一致。两边必须有相同的基本單位。' },
  hasPSU:false,
  cam3d:[0,3,7], camFront:{ pos:[0,2.5,9], tgt:[0,2.5,0] },
  vectorLegend:[],
  equipment:[
    {id:'lst', name:{en:'Formula list', tc:'公式表', sc:'公式表'}},
    {id:'un', name:{en:'Unit table', tc:'單位表', sc:'單位表'}},
    {id:'pen', name:{en:'Pen', tc:'筆', sc:'笔'}},
    {id:'calc', name:{en:'Calculator', tc:'計算機', sc:'計算機'}},
    {id:'book', name:{en:'Textbook', tc:'教科書', sc:'教科书'}},
    {id:'nb', name:{en:'Notebook', tc:'筆記本', sc:'笔記本'}}
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
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.2, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 })
    );
    table.position.set(0, -0.1, 0);
    table.receiveShadow = true; table.castShadow = true;
    g.add(table);

    const blackboard = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 2.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1b382b, roughness: 0.6 })
    );
    blackboard.position.set(0, 1.4, -1.8);
    blackboard.castShadow = true; blackboard.receiveShadow = true;
    g.add(blackboard);

    const cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x8ecae6, roughness: 0.45 })
    );
    cubeMesh.position.set(-0.8, 0.3, 0.2);
    cubeMesh.castShadow = true; cubeMesh.receiveShadow = true; g.add(cubeMesh);

    const caliper = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xaebac4, metalness: 0.8, roughness: 0.25 });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.18), metal);
    beam.position.y = 0.03; beam.castShadow = true; caliper.add(beam);
    const jawL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.28), metal);
    jawL.position.set(-0.75, 0.14, 0); caliper.add(jawL);
    const jawR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.28), metal);
    jawR.position.set(0.30, 0.14, 0); caliper.add(jawR);
    caliper.position.set(0.6, 0.04, 0.4);
    caliper.rotation.set(-Math.PI / 2, 0, 0);
    g.add(caliper);

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd9b77b, roughness: 0.35 }));
    sphere.position.set(1.65, 0.28, 0.2); sphere.castShadow = true; g.add(sphere);
    const rock = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4), new THREE.MeshStandardMaterial({ color: 0x8d8a80, roughness: 0.7 }));
    rock.position.set(2.25, 0.28, -0.1); rock.rotation.set(0.3, 0.4, 0.2); rock.castShadow = true; g.add(rock);

    setCamera3D([0, 1.5, 4.4], [0, 0.7, -0.2]);
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
          sc:'用滑杆浏覽公式。基本單位：m、s、kg、A、K、mol、cd。' }) + '</div></div>';
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
