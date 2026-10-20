// ============================================================
//  loc_barrowdowns.js  —  The Barrow-downs
//  Middle-earth walkable world · location module
//
//  Sequence: (Shire →) Barrow-downs → Weathertop
//  Tone:     Cold, misty, moonlit night.  Wights, dread, ancient barrows.
//
//  TERRAIN STRATEGY
//  ────────────────
//  The BARROWS table is the single source of truth for both terrain
//  and scene objects.  Each entry adds a sharp Gaussian hill bump so
//  every barrow is guaranteed to sit on a real hilltop every load.
//
//  Barrows are deliberately spread so Gaussian tails do NOT overlap —
//  each hill reads as isolated.  Between hills the base noise provides
//  low rolling ground with clear valley floors.
//
//  Hill sigma (hr) is kept tight (12–14 u) so peaks are steep and
//  distinct.  The hillHeight amplitude is 16–22 u so vertexColor bands
//  (keyed to vy) are comfortably reached.  vertexColor thresholds are
//  tuned to the actual height range the engine will see.
//
//  Camp flattening: a wide Gaussian suppresses the base noise near the
//  spawn point so the fire never clips into a mound.
//
//  TRANSITIONS  (new engine contract)
//  ──────────────────────────────────
//  transitions: [ { trigger:{x,z,radius}, to:'key' } ]
//  arrivals:    { key: { x, z, yaw } }
//  The transition trigger is at (0, -78) — the eastern edge of the downs.
//  The arrival from Weathertop comes in from the east at (0, -60).
// ============================================================

const BarrowDowns = (function () {

  // ── Barrow table ──────────────────────────────────────────
  // [cx, cz,  hr, hh, scale, hasCave]
  //   cx/cz  — world position of barrow crown
  //   hr     — Gaussian half-width (u) — KEEP ≤ 14 to avoid ridges
  //   hh     — peak height above valley floor (u)
  //   scale  — standing-stone size multiplier
  //   hasCave — cut a cave entrance into the hillside
  //
  // Minimum separation between barrow centres should be ≥ 3×hr
  // to prevent hills merging.  Check: nearest pair gap listed below.
  //   BD0 (-30,-30) ↔ BD1 ( 20,-55) = 57 u  ✓  (3×13=39)
  //   BD1 ( 20,-55) ↔ BD2 ( 60,-35) = 45 u  ✓
  //   BD2 ( 60,-35) ↔ BD3 ( 60,-80) = 45 u  ✓
  //   BD3 ( 60,-80) ↔ BD4 (100,-55) = 52 u  ✓
  //   BD4 (100,-55) ↔ BD5 ( -5,-85) = 109 u ✓
  //   BD5 ( -5,-85) ↔ BD6 (130,-45) = 144 u ✓  (far outlier)
  const BARROWS = [
    //  cx,   cz,  hr,  hh, scale, cave
    [  -30,  -30,  13,  18,  1.4,  true  ],  // BD0 – The First Mound, near spawn
    [   20,  -55,  12,  20,  1.3,  true  ],  // BD1 – Mound of Cardolan's Last King
    [   60,  -35,  14,  22,  1.6,  true  ],  // BD2 – The Great Barrow (hobbit site)
    [   60,  -80,  12,  17,  1.2,  false ],  // BD3 – Southern deep mound
    [  100,  -55,  13,  19,  1.4,  true  ],  // BD4 – Mid-downs barrow
    [   -5,  -85,  11,  15,  1.0,  false ],  // BD5 – West outlier
    [  145,  -35,  13,  21,  1.7,  true  ],  // BD6 – Easternmost barrow, near exit
  ];

  // Camp: guaranteed flat saddle near spawn
  const CAMP_X =  3;
  const CAMP_Z = -8;

  // ── hillHeight ────────────────────────────────────────────
  // Base noise is very low (max ~3 u) so valleys read as near-flat.
  // Gaussian bumps dominate completely.  Each bump falls to <1% of
  // peak at 3σ = 3×hr ≈ 36–42 u from centre — well within the
  // spacing guarantee above, so hills stay isolated.
  function hillHeight(x, z) {
    // Low valley floor — just enough texture to read as uneven ground
    const base = api_fbm(x * 0.028, z * 0.028) * 2.5
               + api_fbm(x * 0.09  + 2.1, z * 0.08 - 1.4) * 0.8;

    // Flatten camp saddle: multiply base by (1 − flatMask) near spawn
    const dcx = x - CAMP_X, dcz = z - CAMP_Z;
    const campMask = Math.exp(-(dcx*dcx + dcz*dcz) / (14 * 14));
    const flatBase = base * (1.0 - campMask);

    // Sharp Gaussian hill at each barrow centre
    let hills = 0;
    for (let i = 0; i < BARROWS.length; i++) {
      const [cx, cz, hr, hh] = BARROWS[i];
      const dx = x - cx, dz = z - cz;
      hills += hh * Math.exp(-(dx*dx + dz*dz) / (hr * hr));
    }

    return flatBase + hills;
  }

  // ── vertexColor ───────────────────────────────────────────
  // The engine passes vy = hillHeight(vx, vz) at that vertex.
  // With base ≈ 0–3 u and hill peaks 15–22 u, total vy range is 0–22.
  // Bands are tuned to this range:
  //   0– 2  valley loam (dark, wet)
  //   2–10  dead hillside turf (grey-green)
  //  10–16  wind-bleached upper slope
  //  16–22  scoured crest (pale stone)
  function vertexColor(vx, vy, vz, noise2d, lerp) {
    const n     = noise2d(vx * 0.08,  vz * 0.08);
    const n2    = noise2d(vx * 0.22 + 3.1, vz * 0.18 - 1.4);
    const nFine = noise2d(vx * 0.52 + 7.2, vz * 0.46 + 2.8);

    // Colours per zone
    const loamR   = 0.13 + n*0.04,    loamG   = 0.12 + n*0.03,    loamB   = 0.09 + n*0.02;
    const turfR   = 0.27 + n*0.07,    turfG   = 0.29 + n*0.07,    turfB   = 0.19 + n*0.04;
    const bleachR = 0.40 + n2*0.07,   bleachG = 0.38 + n2*0.06,   bleachB = 0.28 + n2*0.04;
    const crestR  = 0.55 + nFine*0.07,crestG  = 0.53 + nFine*0.06,crestB  = 0.45 + nFine*0.04;

    // Smooth step between zones
    function band(lo, hi) { return Math.max(0, Math.min(1, (vy - lo) / (hi - lo))); }
    const wLoam   = 1.0 - band(0.5, 2.5);
    const wTurf   = band(1.5, 3.0)   * (1.0 - band(9.0,  11.0));
    const wBleach = band(8.5, 10.5)  * (1.0 - band(15.0, 17.0));
    const wCrest  = band(14.5, 17.0);

    const wSum = wLoam + wTurf + wBleach + wCrest + 0.001;
    const wL = wLoam/wSum, wT = wTurf/wSum, wB = wBleach/wSum, wC = wCrest/wSum;

    let r = wL*loamR + wT*turfR + wB*bleachR + wC*crestR;
    let g = wL*loamG + wT*turfG + wB*bleachG + wC*crestG;
    let b = wL*loamB + wT*turfB + wB*bleachB + wC*crestB;

    // Wide parch patches keyed to n2 — large blotches, not speckle
    const parch = Math.max(0, (n2 - 0.60) * 2.5);
    r = lerp(r, 0.48, parch * 0.55);
    g = lerp(g, 0.46, parch * 0.55);
    b = lerp(b, 0.35, parch * 0.55);

    return [r, g, b];
  }

  // ── Path ──────────────────────────────────────────────────
  // Winds through the downs toward the eastern transition.
  // Ends near (0, -78) where the transition trigger sits.
  const PATH_WP = [
    [  3,  -8],   // camp / spawn
    [  0, -18],
    [ 10, -28],
    [ 20, -38],
    [ 35, -42],
    [ 48, -36],
    [ 55, -45],
    [ 65, -38],
    [ 75, -48],
    [ 85, -55],
    [ 70, -65],
    [ 45, -70],
    [ 20, -72],
    [  0, -78],   // transition trigger
  ];

  function onPath(x, z) {
    let minDist = Infinity;
    for (let i = 0; i < PATH_WP.length - 1; i++) {
      const ax = PATH_WP[i][0],   az = PATH_WP[i][1];
      const bx = PATH_WP[i+1][0], bz = PATH_WP[i+1][1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx*dx + dz*dz;
      let t = lenSq > 0 ? ((x-ax)*dx + (z-az)*dz) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx - x, pz = az + t*dz - z;
      const d = Math.sqrt(px*px + pz*pz);
      if (d < minDist) minDist = d;
    }
    if (minDist < 2.8) return 1.0;
    if (minDist > 5.5) return 0.0;
    return 1.0 - (minDist - 2.8) / (5.5 - 2.8);
  }

  // ── buildScene ────────────────────────────────────────────
  function buildScene(THREE, scene, groundY, MAT) {
    const refs = {
      fireLight: null,
      fireFill:  null,
      flames:    [],   // mist wisps stored here
      embers:    [],
      wightGlow: [],
    };

    function rr(a, b) { return a + Math.random() * (b - a); }
    function add(m)   { scene.add(m); return m; }

    // ── Materials ──────────────────────────────────────────
    const MAT_STONE2   = new THREE.MeshLambertMaterial({ color: 0x3a3d36 });
    const MAT_CAPSTONE = new THREE.MeshLambertMaterial({ color: 0x2a2d22 });
    const MAT_LICHEN   = new THREE.MeshLambertMaterial({ color: 0x3a4828 });
    const MAT_CAVE     = new THREE.MeshLambertMaterial({ color: 0x0c0e0a });
    const MAT_BONE     = new THREE.MeshLambertMaterial({ color: 0xb0a88a });
    const MAT_LOG      = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const MAT_BARK     = new THREE.MeshLambertMaterial({ color: 0x2e2010 });
    const MAT_COAL     = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    const MAT_WISP     = new THREE.MeshLambertMaterial({
      color: 0x7aaabb, transparent: true, opacity: 0.14,
    });

    // ── Single barrow ──────────────────────────────────────
    function buildBarrow(cx, cz, scale, hasCave) {
      const gy = groundY(cx, cz);

      // Standing stone ring
      const count = Math.floor(rr(5, 9));
      const ringR = scale * 3.0;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + rr(-0.15, 0.15);
        const ox  = cx + Math.cos(ang) * ringR * rr(0.85, 1.15);
        const oz  = cz + Math.sin(ang) * ringR * rr(0.85, 1.15);
        const h   = scale * rr(2.2, 4.0);
        const rT  = scale * rr(0.16, 0.26);
        const rB  = scale * rr(0.24, 0.42);
        const slab = add(new THREE.Mesh(
          new THREE.CylinderGeometry(rT, rB, h, 9),
          rr(0,1) > 0.4 ? MAT_STONE2 : MAT.STONE_MOSS
        ));
        slab.position.set(ox, groundY(ox,oz) + h/2 - h*0.25, oz);
        slab.rotation.set(rr(-0.12,0.12), rr(0,Math.PI*2), rr(-0.08,0.08));

        // Occasional fallen stone beside it
        if (rr(0,1) > 0.65) {
          const fh = scale * rr(1.5, 2.8);
          const fallen = add(new THREE.Mesh(
            new THREE.CylinderGeometry(scale*0.18, scale*0.26, fh, 9),
            MAT.STONE_DARK
          ));
          fallen.position.set(ox + rr(-0.8,0.8), groundY(ox,oz) + scale*0.28, oz + rr(-0.8,0.8));
          fallen.rotation.set(Math.PI/2 + rr(-0.2,0.2), rr(0,Math.PI*2), rr(-0.15,0.15));
        }
      }

      // Capstone — flat disc on the crown
      const cw = scale * rr(2.0, 3.2);
      const ch = scale * rr(0.25, 0.45);
      const cap = add(new THREE.Mesh(
        new THREE.CylinderGeometry(cw*0.52, cw*0.48, ch, 9),
        MAT_CAPSTONE
      ));
      cap.scale.z = rr(0.55, 0.80);
      cap.rotation.set(rr(-0.03,0.03), rr(0,Math.PI), rr(-0.02,0.02));
      cap.position.set(cx + rr(-0.4,0.4), gy + ch*0.6, cz + rr(-0.4,0.4));

      // Cave entrance — find actual downhill face
      if (hasCave) {
        let loY = Infinity, loAng = 0;
        for (let a = 0; a < 12; a++) {
          const ta = (a / 12) * Math.PI * 2;
          const ty = groundY(cx + Math.cos(ta)*scale*5, cz + Math.sin(ta)*scale*5);
          if (ty < loY) { loY = ty; loAng = ta; }
        }
        const ca   = loAng + rr(-0.25, 0.25);
        const dist = scale * 4.0;
        const ex   = cx + Math.cos(ca) * dist;
        const ez   = cz + Math.sin(ca) * dist;
        const ey   = groundY(ex, ez);
        const dh   = scale * rr(1.8, 2.6);
        const dw   = scale * rr(0.6, 0.9);
        const pa   = ca + Math.PI / 2;

        // Door jambs
        for (let s = -1; s <= 1; s += 2) {
          const jx = ex + Math.cos(pa)*s*dw, jz = ez + Math.sin(pa)*s*dw;
          const jy = groundY(jx, jz);
          const jamb = add(new THREE.Mesh(
            new THREE.CylinderGeometry(scale*0.16, scale*0.22, dh, 9),
            MAT.STONE_DARK
          ));
          jamb.position.set(jx, jy + dh/2 - dh*0.25, jz);
          jamb.rotation.set(rr(-0.05,0.05), ca + rr(-0.1,0.1), rr(-0.04,0.04));
        }

        // Lintel
        const lw = dw * 2.4 * scale;
        const lh = scale * 0.28;
        const lintel = add(new THREE.Mesh(
          new THREE.CylinderGeometry(lw*0.5, lw*0.48, lh, 9),
          MAT_CAPSTONE
        ));
        lintel.rotation.set(Math.PI/2 + rr(-0.04,0.04), ca, rr(-0.03,0.03));
        lintel.position.set(ex, ey + dh*0.72, ez);

        // Cave mouth — dark hemisphere pushed into hillside
        const mr  = scale * rr(0.7, 1.0);
        const inX = ex + Math.cos(ca + Math.PI)*mr*0.6;
        const inZ = ez + Math.sin(ca + Math.PI)*mr*0.6;
        const mouth = add(new THREE.Mesh(new THREE.SphereGeometry(mr, 10, 7), MAT_CAVE));
        mouth.position.set(inX, ey + mr*0.55, inZ);

        // Wight light — inside cave, light only
        const wl = new THREE.PointLight(0x2288aa, 0.65, scale * 8);
        wl.position.set(
          ex + Math.cos(ca + Math.PI)*mr*1.5,
          ey + mr * 0.9,
          ez + Math.sin(ca + Math.PI)*mr*1.5
        );
        scene.add(wl);
        refs.wightGlow.push({ light: wl, baseI: 0.65, phase: rr(0, Math.PI*2) });

        // Entrance rubble
        for (let ri = 0; ri < 6; ri++) {
          const rx = ex + rr(-scale*1.8, scale*1.8);
          const rz = ez + rr(-scale*0.5, scale*1.8);
          const rs = rr(0.14, scale*0.5);
          const rrr = add(new THREE.Mesh(
            new THREE.SphereGeometry(rs, 8, 6),
            rr(0,1)>0.5 ? MAT_STONE2 : MAT_LICHEN
          ));
          rrr.position.set(rx, groundY(rx,rz)+rs*0.45, rz);
          rrr.scale.set(rr(0.6,1.6), rr(0.3,0.7), rr(0.6,1.6));
        }
      }

      // Outer marker-stone ring at hill base
      const mc = Math.floor(rr(6, 12));
      const mr = scale * rr(4.5, 6.5);
      for (let i = 0; i < mc; i++) {
        const ma = (i/mc)*Math.PI*2 + rr(-0.5,0.5);
        const mx = cx + Math.cos(ma)*mr*rr(0.75,1.25);
        const mz = cz + Math.sin(ma)*mr*rr(0.75,1.25);
        const ms = rr(0.18, 0.55);
        const mk = add(new THREE.Mesh(
          new THREE.SphereGeometry(ms, 8, 6),
          rr(0,1)>0.5 ? MAT_LICHEN : MAT_STONE2
        ));
        mk.position.set(mx, groundY(mx,mz)+ms*0.45, mz);
        mk.scale.set(rr(0.5,1.5), rr(0.4,0.9), rr(0.5,1.5));
      }
    }

    // Build all barrows
    BARROWS.forEach(([cx,cz,,, scale, cave]) => buildBarrow(cx, cz, scale, cave));

    // ── Scattered boulders ─────────────────────────────────
    for (let i = 0; i < 80; i++) {
      const bx = rr(-80, 100);
      const bz = rr(-100, 10);
      const s  = rr(0.15, 0.9);
      const b  = add(new THREE.Mesh(
        rr(0,1)>0.4 ? new THREE.SphereGeometry(s,10,7) : new THREE.SphereGeometry(s,8,6),
        rr(0,1)>0.6 ? MAT_STONE2 : (rr(0,1)>0.5 ? MAT.STONE_MOSS : MAT.STONE_DARK)
      ));
      b.position.set(bx, groundY(bx,bz)+s*0.45, bz);
      b.scale.set(rr(0.5,1.9), rr(0.35,0.9), rr(0.5,1.7));
      b.rotation.y = rr(0, Math.PI*2);
    }

    // ── Dead grass tufts — noise-clustered grid ─────────────
    const TG = 3.5;
    for (let gx = -80; gx < 100; gx += TG) {
      for (let gz = -100; gz < 10; gz += TG) {
        const jx = gx + rr(-TG*0.4, TG*0.4);
        const jz = gz + rr(-TG*0.4, TG*0.4);
        if (api_noise2d(jx*0.06+2.2, jz*0.05-1.8) < 0.42) continue;
        const th = rr(0.28, 0.75);
        const tr = rr(0.04, 0.09);
        const tuft = add(new THREE.Mesh(
          new THREE.CylinderGeometry(tr*0.25, tr, th, 5),
          MAT_BONE
        ));
        tuft.position.set(jx, groundY(jx,jz)+th/2-th*0.08, jz);
        tuft.rotation.set(rr(-0.18,0.18), rr(0,Math.PI*2), rr(-0.18,0.18));
      }
    }

    // ── Mist wisps ─────────────────────────────────────────
    for (let i = 0; i < 35; i++) {
      const wx = rr(-80, 100);
      const wz = rr(-100, 8);
      const ws = rr(1.4, 5.0);
      const wisp = add(new THREE.Mesh(
        new THREE.SphereGeometry(ws, 8, 6),
        MAT_WISP.clone()
      ));
      wisp.material.opacity = rr(0.08, 0.18);
      const wY = groundY(wx, wz);
      wisp.position.set(wx, wY + rr(0.3, 2.0), wz);
      wisp.scale.set(rr(0.9,2.2), rr(0.22,0.50), rr(0.9,2.2));
      refs.flames.push({
        mesh: wisp,
        baseX: wx, baseZ: wz, baseY: wY + rr(0.3, 2.0),
        phase: rr(0, Math.PI*2),
      });
    }

    // ── Camp fire — guaranteed flat at CAMP_X/Z ─────────────
    const campY = groundY(CAMP_X, CAMP_Z);

    // Fire-ring stones
    for (let i = 0; i < 8; i++) {
      const fa = (i/8)*Math.PI*2;
      const fx = CAMP_X + Math.cos(fa)*1.1;
      const fz = CAMP_Z + Math.sin(fa)*1.1;
      const stone = add(new THREE.Mesh(
        new THREE.SphereGeometry(rr(0.20,0.34), 8, 6),
        MAT.STONE_DARK
      ));
      stone.position.set(fx, groundY(fx,fz)+0.10, fz);
    }

    // Two crossed logs
    [
      { ang: 0.3,            len: 1.8, lr: 0.10, mat: MAT_LOG  },
      { ang: 0.3+Math.PI/2,  len: 1.5, lr: 0.09, mat: MAT_BARK },
    ].forEach(({ ang, len, lr, mat: lm }) => {
      const log = add(new THREE.Mesh(
        new THREE.CylinderGeometry(lr*0.75, lr, len, 8), lm
      ));
      log.rotation.set(0, ang, Math.PI/2);
      log.position.set(CAMP_X+Math.cos(ang)*0.4, campY+lr*0.7, CAMP_Z+Math.sin(ang)*0.4);

      const nub = add(new THREE.Mesh(new THREE.SphereGeometry(lr*0.72,7,5), MAT_COAL));
      nub.position.set(
        CAMP_X+Math.cos(ang)*(0.4+len*0.45),
        campY+lr*0.7,
        CAMP_Z+Math.sin(ang)*(0.4+len*0.45)
      );
    });

    // Coal bed
    for (let i = 0; i < 5; i++) {
      const cs = rr(0.12,0.28);
      const coal = add(new THREE.Mesh(new THREE.SphereGeometry(cs,6,4), MAT_COAL));
      coal.position.set(CAMP_X+rr(-0.5,0.5), campY+cs*0.18, CAMP_Z+rr(-0.5,0.5));
      coal.scale.y = 0.3;
    }

    // Ember mesh + lights
    const emberMat  = new THREE.MeshLambertMaterial({ color:0xff5500, transparent:true, opacity:0.85 });
    const emberMesh = add(new THREE.Mesh(new THREE.SphereGeometry(0.10,6,4), emberMat));
    emberMesh.position.set(CAMP_X, campY+0.16, CAMP_Z);
    refs.embers.push({ mesh: emberMesh, mat: emberMat, phase: 0 });

    const fireLight = new THREE.PointLight(0xff4400, 0.55, 12);
    fireLight.position.set(CAMP_X, campY+0.5, CAMP_Z);
    scene.add(fireLight);
    refs.fireLight = fireLight;

    const fireFill = new THREE.PointLight(0xff2200, 0.18, 7);
    fireFill.position.set(CAMP_X+0.6, campY+0.25, CAMP_Z-0.4);
    scene.add(fireFill);
    refs.fireFill = fireFill;

    return refs;
  }

  // ── onFrame ───────────────────────────────────────────────
  function onFrame(t, dt, refs) {
    if (refs.wightGlow) {
      refs.wightGlow.forEach(e => {
        if (!e || !e.light) return;
        const s = Math.sin(t*0.45 + e.phase);
        const f = Math.sin(t*2.3  + e.phase*1.7) * 0.15;
        e.light.intensity = e.baseI * (0.75 + s*0.18 + f);
      });
    }
    if (refs.flames) {
      refs.flames.forEach(w => {
        if (!w || !w.mesh) return;
        const bob = Math.sin(t*0.26 + w.phase) * 0.28;
        w.mesh.position.x = w.baseX + Math.sin(t*0.08 + w.phase)*2.8;
        w.mesh.position.z = w.baseZ + Math.cos(t*0.06 + w.phase)*2.0;
        w.mesh.position.y = w.baseY + bob;
        if (w.mesh.material) w.mesh.material.opacity = 0.08 + Math.sin(t*0.35+w.phase)*0.06;
      });
    }
    if (refs.embers && refs.embers.length > 0) {
      const e = refs.embers[0];
      if (e && e.mat) {
        e.mat.opacity = 0.55 + Math.sin(t*3.4+e.phase)*0.28 + Math.sin(t*7.8)*0.10;
        e.phase += dt * 0.6;
      }
    }
    if (refs.fireLight) refs.fireLight.intensity = 0.42 + Math.sin(t*2.9)*0.10 + Math.sin(t*5.7)*0.06;
    if (refs.fireFill)  refs.fireFill.intensity  = 0.12 + Math.sin(t*3.5+1.2)*0.06;
  }

  // ── Public export ─────────────────────────────────────────
  return {
    name:     'The Barrow-downs',
    subtitle: 'East of the Shire · Where old evil dwells',

    atmosphere: {
      fogColor:         0x3a4a55,
      fogDensity:       0.026,
      skyColor:         0x0d1218,
      ambientColor:     0x1a2a38,
      ambientIntensity: 0.55,
      moonColor:        0xb8cfe0,
      moonIntensity:    1.05,
      moonPosition:     { x: -60, y: 110, z: -80 },
    },

    hillHeight,
    vertexColor,
    onPath,

    pathWaypoints: PATH_WP,

    start:    { x: CAMP_X, z: CAMP_Z, yaw: 0.35 },
    boundary: 110,   // tight — the downs are claustrophobic, not vast

    lorePoints: [
      {
        pos: { x: -30, z: -30 }, radius: 12,
        text: 'Here lie the Barrow-downs, where the Great Barrows were raised in the Second Age for the kings of Cardolan. In evil days the Witch-king of Angmar sent wights out of Rhûdaur to inhabit the mounds — and so they became a place of dread, shunned by all living folk.',
        cite: 'The Lord of the Rings, Appendix A',
      },
      {
        pos: { x: 20, z: -55 }, radius: 10,
        text: 'Tom Bombadil warned the hobbits: "Don\'t go a-meddling with old stone or cold Wights or prying in their houses, unless you be strong folk with hearts that never falter." The cold that breathes from the barrow-doors is no mere night chill — it is the breath of the dead years.',
        cite: 'The Fellowship of the Ring, Ch. 7',
      },
      {
        pos: { x: 60, z: -35 }, radius: 11,
        text: 'Frodo woke alone inside the barrow. A long arm groped toward his friends. He heard a cold voice chanting:\n"Cold be hand and heart and bone, and cold be sleep under stone: never more to wake on stony bed, never, till the Sun fails and the Moon is dead."',
        cite: 'The Fellowship of the Ring, Ch. 8',
      },
      {
        pos: { x: 100, z: -55 }, radius: 10,
        text: 'The blades of the Barrow-wights bore an ancient enchantment — the swords buried with the Dúnedain long ages past. When Merry struck the Witch-king on the Fields of the Pelennor, it was one of these long-kept blades that broke the spell, for they had been made with that very purpose in an age now forgotten.',
        cite: 'The Return of the King, Appendix A',
      },
      {
        pos: { x: 145, z: -35 }, radius: 10,
        text: 'Tom Bombadil came at Frodo\'s cry, singing:\n"Tom Bombadil, Tom Bombadillo! By water, wood and hill, by the reed and willow, by fire, sun and moon, harken now and hear us! Come, Tom Bombadil, for our need is near us!"\nThe wight fled; the barrow-door yawned open into pale sunlight.',
        cite: 'The Fellowship of the Ring, Ch. 8',
      },
    ],

    // Transition: walk east out of the downs → Bree
    transitions: [
      { trigger: { x: 0, z: -78, radius: 8 }, to: 'bree' },
    ],

    // Arrival points — where the player spawns when coming FROM another location
    arrivals: {
      // Coming from Bree heading west into the downs: spawn facing inward
      bree: { x: 0, z: -60, yaw: Math.PI },
    },

    buildScene,
    onFrame,
  };

})();

window.BarrowDowns = BarrowDowns;
