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
  id:'conduction',
  cat:'heat',
  title:{ en:'Conduction Through a Rod', tc:'金屬棒的傳導', sc:'金属棒的传导' },
  desc:{ en:'Heat one end of a rod. Observe the temperature gradient along it and how different metals conduct.',
         tc:'加熱金屬棒的一端。觀察沿棒的溫度梯度以及不同金屬的傳導。',
         sc:'加热金属棒的一端。观察沿棒的温度梯度以及不同金属的传导。' },
  hasPSU:true,
  cam3d:[0,3,8], camFront:{ pos:[0,2.5,10], tgt:[0,2.5,0] },
  vectorLegend:[
    [{en:'Heat flow', tc:'熱流', sc:'热流'}, '#ff5f56']
  ],
  equipment:[
    {id:'rod', name:{en:'Metal rod', tc:'金屬棒', sc:'金属棒'}},
    {id:'htr', name:{en:'Heater', tc:'加熱器', sc:'加热器'}},
    {id:'psu', name:{en:'Power supply', tc:'電源', sc:'电源'}},
    {id:'th1', name:{en:'T₁ thermometer', tc:'T₁ 溫度計', sc:'T₁ 温度计'}},
    {id:'th2', name:{en:'T₂ thermometer', tc:'T₂ 溫度計', sc:'T₂ 温度计'}},
    {id:'clamp', name:{en:'Clamps', tc:'夾具', sc:'夹具'}}
  ],
  variables:[
    {id:'k', name:{en:'Thermal conductivity k', tc:'導熱率 k', sc:'导热率 k'}, min:10, max:400, step:5, def:200, unit:' W/m·K'}
  ],
  graph:{
    activeType:0,
    types:[
      { id:'tx', label:{en:'T along rod', tc:'沿棒的溫度', sc:'沿棒的温度'},
        xLabel:'Position (cm)', yLabel:'T (°C)', xMax:100, xFmt:0, yFmt:0, slopeUnit:'°C/cm',
        current(){ return { x:50, y:this.T_at(0.5) - 273 }; } }
    ],
    yMax(){ return Math.max(60, this.T_max() - 253); }
  },
  playing:true, t:0,
  vars:{ k:200 },
  equip:{ rod:true, htr:true, psu:true, th1:true, th2:true, clamp:true },
  voltage:15,
  _rod:null, _htrGlow:null,

  T_max(){ return 273 + 80 * Math.min(1, this.voltage/24); },
  T_at(x){ /* x: 0..1 along rod */
    const T0 = this.T_max();
    return 293 + (T0-293) * Math.exp(-x * 4 * (this.vars.k/200));
  },
   init() {
    const g = root3d;
    addGround();
    /* 金屬棒：倒角桿身 + 兩端銅環 + 隔熱手柄 */
    const rodMat = new THREE.MeshPhysicalMaterial({ color: 0xc3cbd6, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.15 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 32), rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(2, 1.5, 0);
    rod.castShadow = true;
    g.add(rod);
    this._rod = rod;
    for (const x of [-0.5, 4.5]) {
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.10, 32), MAT.brass());
      collar.rotation.z = Math.PI / 2; collar.position.set(x, 1.5, 0); g.add(collar);
    }
    for (const x of [1.0, 3.0]) {
      const ringClamp = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.035, 8, 28), MAT.dark());
      ringClamp.rotation.y = Math.PI / 2; ringClamp.position.set(x, 1.5, 0); g.add(ringClamp);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.55, 16), MAT.steel());
      post.position.set(x, 0.72, 0.35); g.add(post);
      const foot = rbox(0.42, 0.08, 0.34, 0.03, MAT.dark(), 2);
      foot.position.set(x, 0.04, 0.35); g.add(foot);
      g.add(barBetween(new THREE.Vector3(x, 1.5, 0.35), new THREE.Vector3(x, 1.5, 0), 0.035, MAT.steel(), 8));
    }

    /* 端部加熱器：金屬筒 + 陶瓷接頭 */
    const htr = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 28), MAT.dark());
    htr.rotation.z = Math.PI / 2;
    htr.position.set(-0.5, 1.5, 0);
    htr.castShadow = true;
    g.add(htr);
    const htrCap = rbox(0.18, 0.34, 0.34, 0.04, MAT.ceramic(), 3);
    htrCap.position.set(-0.83, 1.5, 0); g.add(htrCap);
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.52, 24),
      new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0 })
    );
    glow.rotation.z = Math.PI / 2;
    glow.position.set(-0.5, 1.5, 0);
    g.add(glow);
    this._htrGlow = glow;

    /* 數位電源 */
    const psu = createPSU({ w: 1.4, h: 1.0, d: 0.9, screenW: 1.0, screenH: 0.55 });
    psu.group.position.set(-2.6, 0, 0.9);
    g.add(psu.group);
    this._psuCtx = psu.ctx; this._psuTex = psu.tex; this._psuScreen = psu.screen;
    g.add(createWire([[-2.2, 0.45, 0.7], [-1.5, 0.6, 0.3], [-0.7, 1.3, 0.15]], 0xcc3333, 0.035));
    g.add(createWire([[-2.8, 0.45, 0.7], [-1.9, 0.6, -0.2], [-0.7, 1.7, 0.15]], 0x22282f, 0.035));

    /* Two thermometers touching hot end (x=0.0) and cold end (x=4.0) of the rod (y=1.5, z=0) */
    this._thermo1 = createLabThermometer(0.0, 1.55, 0.0, 0xff3b30, 1.7);
    this._thermo2 = createLabThermometer(4.0, 1.55, 0.0, 0x3b82f6, 1.7);
    g.add(this._thermo1.group);
    g.add(this._thermo2.group);
  },

  _drawDisplay() {
    const c = this._psuCtx;
    if (!c) return;
    c.fillStyle = '#06120c'; c.fillRect(0,0,256,128);
    c.strokeStyle = '#1c3a2a'; c.lineWidth = 4; c.strokeRect(2,2,252,124);
    c.fillStyle = '#3f8a63'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText('SUPPLY', 12, 22);
    c.fillStyle = this.voltage > 0 ? '#4dffa0' : '#2a6a4a';
    c.font = 'bold 42px ui-monospace,monospace';
    c.fillText(this.voltage.toFixed(1), 12, 78);
    c.font = 'bold 20px ui-monospace,monospace';
    c.fillText('V', 165, 78);
    c.fillStyle = '#2e6b4a'; c.font = 'bold 12px ui-monospace,monospace';
    c.fillText(((this.voltage*this.voltage)/20).toFixed(1) + ' W', 12, 106);
    if (this._psuTex) this._psuTex.needsUpdate = true;
  },
  update(dt){ this.t += dt; },
  sync3D(dt) {
    const heatFrac = Math.min(1, this.voltage/24);
    this._htrGlow.material.opacity = this.voltage > 0 ? 0.4 + heatFrac*0.5 : 0;
    /* rod color gradient */
    /* (simple emissive tint) */
    if (this._rod) {
      const hsl = 0.58 - heatFrac*0.55;
      this._rod.material.color.setHSL(hsl, 0.5, 0.55);
      if (this._rod.material.emissive) {
        this._rod.material.emissive.setHSL(0.045, 1.0, 0.5);
        this._rod.material.emissiveIntensity = heatFrac * 0.45;
      }
    }
    if (this._thermo1) {
      this._thermo1.group.visible = this.equip.th1 !== false;
      updateLabThermometer(this._thermo1, this.T_at(0), 273, 365);
    }
    if (this._thermo2) {
      this._thermo2.group.visible = this.equip.th2 !== false;
      updateLabThermometer(this._thermo2, this.T_at(1), 273, 365);
    }
    if (this._psuTex) this._drawDisplay();
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
    h += '<div class="card"><div class="card-head"><h3>' + t('power') + '</h3></div>';
    h += '<div class="psu-display"><span class="lbl">V</span><span class="val" id="psu-v">' + this.voltage.toFixed(1) + '</span></div>';
    h += sliderHTML('volt', t('voltage'), 0, 24, 0.1, this.voltage, ' V');
    h += '</div>';
    return h;
  },
  bindSidebar(el) {
    bindSliders(el, this.variables, this.vars, () => {});
    bindChks(el, this.equipment, this.equip);
    el.querySelector('#sl-volt').addEventListener('input', e => {
      this.voltage = parseFloat(e.target.value);
      el.querySelector('#sv-volt').textContent = this.voltage.toFixed(1) + ' V';
      el.querySelector('#psu-v').textContent = this.voltage.toFixed(1);
    });
  },
  hud() {
    return [
      ['T at hot end', (this.T_at(0)-273).toFixed(1) + ' °C'],
      ['T at mid', (this.T_at(0.5)-273).toFixed(1) + ' °C'],
      ['T at far end', (this.T_at(1)-273).toFixed(1) + ' °C'],
      ['k', this.vars.k + ' W/m·K', true]
    ];
  }
};
