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
  id:'charles',
  cat:'gas',
  title:{ en:"Charles's Law · V ∝ T", tc:'查理定律 · V ∝ T', sc:'查理定律 · V ∝ T' },
  desc:{ en:'Heat a trapped gas at constant pressure. Volume expands proportionally to absolute temperature.',
         tc:'在定壓下加熱密閉氣體。體積與絕對溫度成正比。',
         sc:'在定压下加热密闭气体。体积与绝对温度成正比。' },
  hasPSU:true,
  cam3d:[8,7,11], camFront:{ pos:[0,3.2,15], tgt:[0,3.2,0] },
  vectorLegend:[
    [{en:'Gas pressure force', tc:'氣體壓力', sc:'气体压力'}, '#ff5f56'],
    [{en:'External pressure force', tc:'外加壓力', sc:'外加压力'}, '#4da3ff']
  ],
  equipment:[
    {id:'cyl', name:{en:'Glass cylinder', tc:'玻璃氣缸', sc:'玻璃气缸'}},
    {id:'pist', name:{en:'Free piston', tc:'自由活塞', sc:'自由活塞'}},
    {id:'gas', name:{en:'Trapped gas', tc:'密閉氣體', sc:'密闭气体'}},
    {id:'ht', name:{en:'Heating coil', tc:'加熱線圈', sc:'加热线圈'}},
    {id:'psu', name:{en:'Power supply (V)', tc:'電源供應器', sc:'电源供应器'}},
    {id:'th', name:{en:'Thermometer', tc:'溫度計', sc:'温度计'}}
  ],
  variables:[
    {id:'n', name:{en:'Amount of gas', tc:'莫耳數', sc:'摩尔数'}, min:0.03, max:0.10, step:0.005, def:0.05, unit:' mol', locked:true},
    {id:'pext', name:{en:'External pressure', tc:'外加壓力', sc:'外加压力'}, min:80, max:200, step:5, def:100, unit:' kPa', locked:true}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'vt', label:{en:'V vs T', tc:'V 對 T', sc:'V 对 T'},
        xLabel:'T (K)', yLabel:'V (L)', xMax:500, xFmt:0, yFmt:2, slopeUnit:'L/K',
        current(){ return { x:this.vars.T, y:this.V }; } },
      { id:'vtc', label:{en:'V vs T (°C)', tc:'V 對 T (°C)', sc:'V 对 T (°C)'},
        xLabel:'T (°C)', yLabel:'V (L)', xMax:230, xFmt:0, yFmt:2, slopeUnit:'L/°C',
        current(){ return { x:this.vars.T - 273, y:this.V }; } }
    ],
    yMax(){ return Math.max(2, this.V * 1.35); }
  },
  playing:true, t:0,
  vars:{ T:300, n:0.05, pext:100 },
  equip:{ cyl:true, pist:true, gas:true, ht:true, psu:true, th:true },
  voltage:12, V:1.5, h:0.15,
  _particles:null, _piston:null, _coil:null, _coilGlow:null, _weightDiscs:[],
  _arrowGas:null, _arrowExt:null,
  A:0.01, R:8.314,
  R_COIL: 20, K_LOSS: 0.14, C_TH: 0.5, T_ROOM: 293,

  init() {
    const g = root3d;
        addGround();
    const R = 1.2, H = 6;
    /* 厚底玻璃量筒 */
    const cyl = createGraduatedCylinder({ R, H, marks: true, ticks: 20 });
    g.add(cyl.group);
    this._cylinder = cyl;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.42, R + 0.52, 0.22, 56), MAT.aluminium());
    base.position.y = -0.24; base.receiveShadow = true; base.castShadow = true; g.add(base);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(R + 0.38, 0.045, 8, 56), MAT.rubber());
    pad.rotation.x = Math.PI / 2; pad.position.y = -0.35; g.add(pad);

    /* gas particles */
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteCanvas.height = 64;
    const sc = spriteCanvas.getContext('2d');
    const grd = sc.createRadialGradient(32,32,0,32,32,32);
    grd.addColorStop(0, 'rgba(210,235,255,1)');
    grd.addColorStop(0.4, 'rgba(110,180,255,0.85)');
    grd.addColorStop(1, 'rgba(60,140,255,0)');
    sc.fillStyle = grd; sc.fillRect(0,0,64,64);
    const pTex = new THREE.CanvasTexture(spriteCanvas);
    pTex.colorSpace = THREE.SRGBColorSpace;
    const pGeo = new THREE.BufferGeometry();
    const N = 200;
    const pos = new Float32Array(N*3);
    const vel = new Float32Array(N*3);
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

    /* heating coil at bottom */
    const coilMat = new THREE.MeshStandardMaterial({ color: 0x555b68, metalness: 0.85, roughness: 0.35 });
    const coil = new THREE.Mesh(new THREE.TorusGeometry(R - 0.15, 0.05, 8, 40), coilMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 0.15;
    g.add(coil);
    this._coil = coil;
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0 });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.3, R - 0.3, 0.16, 32), glowMat);
    glow.position.y = 0.15;
    g.add(glow);
    this._coilGlow = glow;

    /* 自由活塞 + 開槽砝碼 */
    const piston = createPiston(R - 0.05, 0.32, 0.11, 1.4);
    const pg = piston.group;
    const stack = createMassStack({ count: 3, R: 0.52, H: 0.14, spacing: 0.17, taper: 0.035 });
    stack.group.position.y = 1.72;
    pg.add(stack.group);
    this._weightDiscs = [stack.group];
    this._weights = stack.group;
    g.add(pg);
    this._piston = pg;

    /* arrows */
    this._arrowGas = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 2, 0xff5f56, 0.5, 0.24);
    this._arrowExt = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 2, 0x4da3ff, 0.5, 0.24);
    this._arrowGas.visible = this._arrowExt.visible = false;
    g.add(this._arrowGas, this._arrowExt);

    /* 數位直流電源供應器（倒角外殼、內凹 LCD、旋鈕、紅黑接線柱） */
    const psu = createPSU({ w: 1.8, h: 1.4, d: 1.3, screenW: 1.5, screenH: 0.75 });
    psu.group.position.set(4.0, 0, -0.4);
    g.add(psu.group);
    this._psuDisplayCanvas = psu.canvas;
    this._psuDisplayCtx = psu.ctx;
    this._psuDisplayTex = psu.tex;
    this._psuScreen = psu.screen;
    g.add(createWire([[3.35, 0.45, 0.1], [2.6, -0.1, 0.9], [1.15, 0.15, 0]], 0xcc3333, 0.045));
    g.add(createWire([[4.55, 0.45, 0.1], [3.0, -0.1, -1.1], [-1.15, 0.15, 0]], 0x22282f, 0.045));
    this._drawPSUDisplay();

    this.reset();
  },

  _drawPSUDisplay() {
    const c = this._psuDisplayCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0, 0, 256, 128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63';
    c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('DC SUPPLY', 12, 24);
    const on = this.voltage > 0.01;
    c.fillStyle = on ? '#4dffa0' : '#2a6a4a';
    c.font = 'bold 54px ui-monospace,monospace';
    c.fillText(this.voltage.toFixed(1), 12, 90);
    c.font = 'bold 22px ui-monospace,monospace';
    c.fillText('V', 180, 90);
    c.fillStyle = '#2e6b4a';
    c.font = 'bold 13px ui-monospace,monospace';
    c.fillText(((this.voltage*this.voltage)/this.R_COIL).toFixed(1) + ' W', 12, 116);
    if (this._psuDisplayTex) this._psuDisplayTex.needsUpdate = true;
  },

  reset() {
    this.h = 0.15;
    this.updateV();
  },
  updateV() {
    /* V = nRT / P at equilibrium */
    const Pext = this.vars.pext * 1000;
    this.V = this.vars.n * this.R * this.vars.T / Pext * 1000;   /* L */
    this.h = this.V / 1000 / this.A;
  },

  update(dt) {
    /* thermal step */
    if (this.voltage > 0 && this.equip.psu && this.equip.ht) {
      const P = this.voltage * this.voltage / this.R_COIL;
      const loss = this.K_LOSS * (this.vars.T - this.T_ROOM);
      this.vars.T += ((P - loss) / this.C_TH) * dt;
      this.vars.T = Math.max(220, Math.min(500, this.vars.T));
    } else if (this.equip.ht === false || this.equip.psu === false) {
      const loss = this.K_LOSS * (this.vars.T - this.T_ROOM) * 0.3;
      this.vars.T += (-loss / this.C_TH) * dt;
      this.vars.T = Math.max(220, Math.min(500, this.vars.T));
    }
    /* equilibrium piston height */
    const Pext = this.vars.pext * 1000;
    const targetH = this.vars.n * this.R * this.vars.T / Pext / this.A;
    this.h += (targetH - this.h) * Math.min(1, dt * 2.5);
    this.h = Math.max(0.04, Math.min(0.40, this.h));
    this.updateV();
  },

  sync3D(dt) {
    const yUnit = this.h / 0.05;
    this._piston.position.y = Math.min(5.8, yUnit);

    /* coil glow */

    const heatFrac = Math.max(0, Math.min(1, (this.vars.T - 300) / 200));
    if (this._coilGlow) {
      this._coilGlow.material.opacity = this.voltage > 0 ? 0.15 + heatFrac * 0.55 : heatFrac * 0.3;
    }
    if (this._pointsMat) {
      this._pointsMat.color.setHSL(0.58 - heatFrac * 0.45, 0.85, 0.6);
    }

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
          pt.vel[i*3] -= 2*dot*nx;
          pt.vel[i*3+2] -= 2*dot*nz;
          arr[i*3] = nx * R_IN * 0.97;
          arr[i*3+2] = nz * R_IN * 0.97;
        }
        if (y < 0.12) { pt.vel[i*3+1] = Math.abs(pt.vel[i*3+1]); arr[i*3+1] = 0.12; }
        if (y > topY - 0.08) { pt.vel[i*3+1] = -Math.abs(pt.vel[i*3+1]); arr[i*3+1] = topY - 0.08; }
      }
      pt.geo.attributes.position.needsUpdate = true;
    }

    /* arrows */
    const show = viewMode === 'vector';
    this._arrowGas.visible = this._arrowExt.visible = show;
    if (show) {
      const baseY = yUnit + 0.25;
      const P_int = this.vars.pext * 1000;   /* equal at equilibrium */
      const F_gas = P_int * this.A;
      const F_ext = P_int * this.A;
      const k = 0.00014;
      const len = Math.max(0.4, Math.min(2.8, Math.abs(F_gas) * k));
      this._arrowGas.position.set(0.75, baseY, 0);
      this._arrowGas.setDirection(new THREE.Vector3(0, 1, 0));
      this._arrowGas.setLength(len, 0.4, 0.2);
      this._arrowExt.position.set(-0.75, baseY + len, 0);
      this._arrowExt.setDirection(new THREE.Vector3(0, -1, 0));
      this._arrowExt.setLength(len, 0.4, 0.2);
    }
  },

  draggables(){ return this._weightDiscs; },
  dragScale: 0.003,
  onDragStart(){ this._dragStart = this.vars.pext; },
  onDragMove(dy) {
    this.vars.pext = Math.max(80, Math.min(200, this._dragStart - dy * this.dragScale));
    const inp = document.getElementById('sl-pext');
    if (inp) inp.value = this.vars.pext;
    const lab = document.getElementById('sv-pext');
    if (lab) lab.textContent = this.vars.pext + ' kPa';
  },
  onDragEnd(){},

  sidebar() {
    let h = '';
    h += '<div class="card"><div class="card-head"><h3>' + t('equipment') + '</h3><span class="badge">6</span></div>';
    for (const e of this.equipment) h += chkHTML(e.id, T(e.name), this.equip[e.id] !== false);
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('variables') + '</h3></div>';
    for (const v of this.variables) {
      h += sliderHTML(v.id, T(v.name), v.min, v.max, v.step, this.vars[v.id], v.unit, v.locked);
    }
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('power') + '</h3></div>';
    h += '<div class="psu-display"><span class="lbl">V</span><span class="val" id="psu-v">' + this.voltage.toFixed(1) + '</span><span class="sub" id="psu-w">' + ((this.voltage*this.voltage)/this.R_COIL).toFixed(1) + ' W</span></div>';
    h += sliderHTML('volt', t('voltage'), 0, 24, 0.1, this.voltage, ' V');
    h += '</div>';
    h += '<div class="card"><div class="card-head"><h3>' + t('hint') + '</h3></div><div class="hint-text">' +
      T({ en:'Raise the <b>voltage</b> to heat the gas. Watch V grow linearly with absolute temperature.',
          tc:'提高<b>電壓</b>加熱氣體。觀察 V 隨絕對溫度線性增長。',
          sc:'提高<b>电压</b>加热气体。观察 V 随绝对温度线性增长。' }) +
      '</div></div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, (k, v) => {
      if (k === 'pext') { const lab = el.querySelector('#sv-pext'); if (lab) lab.textContent = v + ' kPa'; }
      this.updateV();
    });
    bindChks(el, this.equipment, this.equip, () => {});
    const vi = el.querySelector('#sl-volt');
    vi.addEventListener('input', e => {
      this.voltage = parseFloat(e.target.value);
      el.querySelector('#sv-volt').textContent = this.voltage.toFixed(1) + ' V';
      el.querySelector('#psu-v').textContent = this.voltage.toFixed(1);
      el.querySelector('#psu-w').textContent = ((this.voltage*this.voltage)/this.R_COIL).toFixed(1) + ' W';
      this._drawPSUDisplay();
    });
  },

  hud() {
    return [
      ['V', this.V.toFixed(3) + ' L'],
      ['T', this.vars.T.toFixed(0) + ' K'],
      ['n', this.vars.n.toFixed(3) + ' mol'],
      ['P', this.vars.pext + ' kPa'],
      ['V/T', (this.V / this.vars.T * 1000).toFixed(3) + ' mL/K', true],
      ['', ''],
      ['Supply', this.voltage.toFixed(1) + ' V']
    ];
  }
};
