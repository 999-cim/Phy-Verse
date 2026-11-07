import * as THREE from 'three';
/* Exact pure-Three.js apparatus blueprints supplied for Boyle, Hooke and Wave. */
export function createBoyleApparatus() {
  const group = new THREE.Group();
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1, transmission: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.85, roughness: 0.25 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });
  const cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.0, 32, 1, true), glassMat);
  cylinderMesh.position.set(0, 1.0, 0); group.add(cylinderMesh);
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 32), metalMat);
  baseMesh.position.set(0, 0.02, 0); baseMesh.receiveShadow = true; group.add(baseMesh);
  const pistonGroup = new THREE.Group(); const H_PISTON = 0.08; const H_ROD = 0.90;
  const pistonPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, H_PISTON, 32), metalMat);
  pistonPlate.position.set(0, 0, 0); pistonPlate.castShadow = true; pistonGroup.add(pistonPlate);
  const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, H_ROD, 16), metalMat);
  rodMesh.position.set(0, (H_PISTON / 2) + (H_ROD / 2), 0); rodMesh.castShadow = true; pistonGroup.add(rodMesh);
  const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24), metalMat);
  handleMesh.position.set(0, (H_PISTON / 2) + H_ROD + 0.02, 0); pistonGroup.add(handleMesh);
  group.add(pistonGroup);
  const weights = []; const H_WEIGHT = 0.05; const R_WEIGHT = 0.14; const OFFSET_X = 0.18;
  for (let i = 0; i < 5; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(R_WEIGHT, R_WEIGHT, H_WEIGHT, 24), brassMat);
    w.castShadow = true; w.visible = false; pistonGroup.add(w); weights.push(w);
  }
  function update(gasHeight) {
    const h = Math.max(0.5, Math.min(1.6, gasHeight));
    pistonGroup.position.set(0, h + (H_PISTON / 2), 0);
    const ratio = (1.6 - h) / (1.6 - 0.5);
    const visibleCount = Math.min(5, Math.max(0, Math.round(ratio * 5)));
    weights.forEach((w, i) => {
      if (i < visibleCount) { w.visible = true; w.position.set(OFFSET_X, (H_PISTON / 2) + (i * H_WEIGHT) + (H_WEIGHT / 2), 0); }
      else w.visible = false;
    });
  }
  update(1.6);
  return { group, update };
}

export function createHookeApparatus() {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.8, roughness: 0.3 });
  const springMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.95, roughness: 0.15 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.75, roughness: 0.3 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 });
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), metalMat);
  standBase.position.set(-0.25, 0.02, 0); standBase.receiveShadow = true; group.add(standBase);
  const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.15, 16), metalMat);
  standPole.position.set(-0.35, 1.075, 0); standPole.castShadow = true; group.add(standPole);
  const standArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 16), metalMat);
  standArm.rotation.z = Math.PI / 2; standArm.position.set(-0.15, 2.05, 0); group.add(standArm);
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 0.015), woodMat);
  ruler.position.set(0.12, 1.0, -0.02); ruler.castShadow = true; group.add(ruler);
  let springMesh = null; const hookGroup = new THREE.Group(); group.add(hookGroup);
  const trayPole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25, 12), metalMat);
  trayPole.position.set(0, -0.125, 0); hookGroup.add(trayPole);
  const trayBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), metalMat);
  trayBase.position.set(0, -0.25, 0); trayBase.castShadow = true; hookGroup.add(trayBase);
  const weights = []; const H_SLOT = 0.04;
  for (let i = 0; i < 5; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, H_SLOT, 24), brassMat);
    w.castShadow = true; w.visible = false; hookGroup.add(w); weights.push(w);
  }
  function buildSpringGeometry(yTop, yBottom, turns = 10, coilRadius = 0.065) {
    const points = []; const segments = 160;
    points.push(new THREE.Vector3(0, yTop + 0.04, 0)); points.push(new THREE.Vector3(0, yTop, 0));
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; const y = yTop - t * (yTop - yBottom); const angle = t * turns * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * coilRadius, y, Math.sin(angle) * coilRadius));
    }
    points.push(new THREE.Vector3(0, yBottom, 0)); points.push(new THREE.Vector3(0, yBottom - 0.03, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 180, 0.012, 8, false);
  }
  function update(mass) {
    const m = Math.max(0, Math.min(1.0, mass)); const Y_TOP = 2.0;
    const yBottom = 1.35 - m * 0.50;
    if (springMesh) { group.remove(springMesh); springMesh.geometry.dispose(); }
    springMesh = new THREE.Mesh(buildSpringGeometry(Y_TOP, yBottom, 10, 0.065), springMat);
    springMesh.castShadow = true; group.add(springMesh);
    hookGroup.position.set(0, yBottom - 0.03, 0);
    const count = Math.min(5, Math.max(0, Math.round(m / 0.2)));
    weights.forEach((w, i) => {
      if (i < count) { w.visible = true; w.position.set(0, -0.24 + (i * H_SLOT) + (H_SLOT / 2), 0); }
      else w.visible = false;
    });
  }
  update(0);
  return { group, update };
}

export function createWaveApparatus() {
  const group = new THREE.Group();
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, transmission: 0.95, depthWrite: false });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.8, roughness: 0.25 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe0f7fa, linewidth: 2 });
  const L = 2.4, W = 1.4, H = 0.35, T = 0.03;
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(L, T, W), glassMat); bottom.position.set(0, T / 2, 0); group.add(bottom);
  const front = new THREE.Mesh(new THREE.BoxGeometry(L, H, T), glassMat); front.position.set(0, H / 2, (W / 2) - (T / 2)); group.add(front);
  const back = new THREE.Mesh(new THREE.BoxGeometry(L, H, T), glassMat); back.position.set(0, H / 2, -(W / 2) + (T / 2)); group.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(T, H, W - 2 * T), glassMat); left.position.set(-(L / 2) + (T / 2), H / 2, 0); group.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(T, H, W - 2 * T), glassMat); right.position.set((L / 2) - (T / 2), H / 2, 0); group.add(right);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(L - 2 * T, W - 2 * T), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.22, 0); group.add(water);
  const WAVE_POINTS = 180; const wavePoints = [];
  for (let i = 0; i <= WAVE_POINTS; i++) wavePoints.push(new THREE.Vector3(-1.0 + (i / WAVE_POINTS) * 2.0, 0.225, 0));
  const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePoints);
  const waveLine = new THREE.Line(waveGeo, lineMat); group.add(waveLine);
  const pulleyStand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.20, 16), metalMat); pulleyStand.position.set(1.28, 0.28, 0); group.add(pulleyStand);
  const pulleyWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24), metalMat); pulleyWheel.rotation.x = Math.PI / 2; pulleyWheel.position.set(1.28, 0.38, 0); pulleyWheel.castShadow = true; group.add(pulleyWheel);
  const stringGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.95, 0.38, 0), new THREE.Vector3(1.35, 0.38, 0), new THREE.Vector3(1.35, 0.12, 0)]);
  group.add(new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0x37474f })));
  const hangWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), metalMat); hangWeight.position.set(1.35, 0.08, 0); hangWeight.castShadow = true; group.add(hangWeight);
  function update(time = 0) {
    const positions = waveLine.geometry.attributes.position.array; const freq = 12.0; const speed = 6.0; const amp = 0.02;
    for (let i = 0; i <= WAVE_POINTS; i++) { const x = -1.0 + (i / WAVE_POINTS) * 2.0; positions[i * 3 + 1] = 0.225 + Math.sin(x * freq - time * speed) * amp; }
    waveLine.geometry.attributes.position.needsUpdate = true;
  }
  update(0);
  return { group, update };
}
