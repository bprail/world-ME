// ============================================================
//  loc_barrowdowns.js  —  The Barrow-downs
//  Middle-earth walkable world · location module
//
//  Sequence: (Shire →) Barrow-downs → Weathertop
//  Tone:     Cold, misty, moonlit night.  Wights, dread, ancient barrows.
//
//  TERRAIN STRATEGY
//  ────────────────
//  Rather than placing barrows on random noise terrain, the terrain
//  is built from the barrow positions: each barrow centre adds a smooth
//  radial hill bump via a Gaussian envelope.  Finer noise adds surface
//  texture between hills.  The camp is placed in a guaranteed flat saddle
//  near the start.  This means every barrow sits on a real hilltop
//  every single load.
// ============================================================

const BarrowDowns = (function () {

  // ── Barrow definitions — single source of truth ───────────
  // These drive BOTH the terrain hills AND the buildScene objects.
  // [cx, cz, hillRadius, hillHeight, stoneScale, hasCave]
  //   hillRadius  — Gaussian σ of the hill bump (u)
  //   hillHeight  — peak height added above base noise (u)
  //   stoneScale  — standing-stone size multiplier
  const BARROWS = [
    [ -22,  -48,  28, 20, 1.5, true  ],  // The First Mound — west sentinel
    [  22,  -65,  26, 18, 1.3, true  ],  // Mound of Cardolan's Last King
    [  55,  -52,  32, 24, 1.6, true  ],  // The Great Barrow — hobbit capture site
    [  80,  -80,  24, 16, 1.2, false ],  // Far north mound
    [ 102,  -50,  28, 20, 1.4, true  ],  // Mid-downs barrow
    [ 128,  -74,  22, 15, 1.1, false ],  // Deep off-path barrow
    [ 145,  -56,  30, 22, 1.7, true  ],  // Easternmost Barrow — near transition
    [  35,  -92,  20, 14, 1.0, false ],  // Southern outlier
  ];

  // Camp is at origin saddle — guaranteed flat by the terrain formula
  const CAMP_X =  4;
  const CAMP_Z = -6;

  // ── Terrain: noise base + guaranteed hill bumps ────────────
  // Each barrow contributes a Gaussian bump centred on its (cx,cz).
  // Smooth noise gives valley texture between bumps.
  function hillHeight(x, z) {
    // Low rolling base — subtle background undulation, valleys stay near 0
    const base = api_fbm(x * 0.022, z * 0.022) * 4.0
                + api_fbm(x * 0.08 + 2.1, z * 0.07 - 1.4) * 1.2;

    // Flatten a saddle at the camp spawn so the fire never clips
    const dCampX = x - CAMP_X, dCampZ = z - CAMP_Z;
    const campDist2 = dCampX*dCampX + dCampZ*dCampZ;
    const campFlat = Math.exp(-campDist2 / (18 * 18)) * base; // subtract base near camp
    const flattenedBase = base - campFlat;                      // = 0 at camp centre

    // Guaranteed hill bumps at each barrow
    let hillSum = 0;
    for (let i = 0; i < BARROWS.length; i++) {
      const [cx, cz, hr, hh] = BARROWS[i];
      const dx = x - cx, dz = z - cz;
      const dist2 = dx*dx + dz*dz;
      // Gaussian: peaks at hh, falls to ~0.01*hh at 2.5σ
      hillSum += hh * Math.exp(-dist2 / (hr * hr));
    }

    return flattenedBase + hillSum;
  }

  // ── Vertex colour: height-banded, load-stable ─────────────
  // Bands are keyed to absolute vy so they look the same every load.
  function vertexColor(vx, vy, vz, noise2d, lerp) {
    const n     = noise2d(vx * 0.08,  vz * 0.08);
    const n2    = noise2d(vx * 0.25 + 3.1, vz * 0.20 - 1.4);
    const nFine = noise2d(vx * 0.55 + 7.2, vz * 0.48 + 2.8);

    // Dark loam (valley, vy < 2)
    const loamR = 0.13 + n*0.04,  loamG = 0.12 + n*0.03,  loamB = 0.09 + n*0.02;
    // Dead turf (hillside, vy 2–12)
    const turfR = 0.28 + n*0.07,  turfG = 0.30 + n*0.07,  turfB = 0.20 + n*0.04;
    // Bleached turf (upper slope, vy 12–20)
    const bleachR = 0.42 + n2*0.06, bleachG = 0.40 + n2*0.05, bleachB = 0.30 + n2*0.04;
    // Scoured crest (vy > 20)
    const crestR = 0.58 + nFine*0.06, crestG = 0.56 + nFine*0.05, crestB = 0.48 + nFine*0.04;

    function band(lo, hi) { return Math.max(0, Math.min(1, (vy - lo) / (hi - lo))); }
    const tLoam   = 1.0 - band(0.5, 3.5);
    const tTurf   = band(1.0, 4.0)  * (1.0 - band(11.0, 14.0));
    const tBleach = band(10.0, 13.0) * (1.0 - band(18.0, 21.0));
    const tCrest  = band(17.0, 21.0);
    const wSum    = tLoam + tTurf + tBleach + tCrest + 0.001;
    const wL = tLoam/wSum, wT = tTurf/wSum, wB = tBleach/wSum, wC = tCrest/wSum;

    let r = wL*loamR + wT*turfR + wB*bleachR + wC*crestR;
    let g = wL*loamG + wT*turfG + wB*bleachG + wC*crestG;
    let b = wL*loamB + wT*turfB + wB*bleachB + wC*crestB;

    // Wide parch patches — only where n2 is distinctly high
    const parch = Math.max(0, (n2 - 0.58) * 2.5);
    r = lerp(r, 0.50, parch * 0.6);
    g = lerp(g, 0.48, parch * 0.6);
    b = lerp(b, 0.37, parch * 0.6);

    return [r, g, b];
  }

  // ── Path proximity ────────────────────────────────────────
  const PATH_WP = [
    [  0,   0], [ 12, -14], [ 26, -22], [ 38, -16],
    [ 52, -26], [ 66, -20], [ 80, -32], [ 94, -26],
    [108, -36], [124, -30], [138, -42], [152, -44],
  ];

  function onPath(x, z) {
    let minDist = Infinity;
    for (let i = 0; i < PATH_WP.length - 1; i++) {
      const ax = PATH_WP[i][0],   az = PATH_WP[i][1];
      const bx = PATH_WP[i+1][0], bz = PATH_WP[i+1][1];
      const dx = bx-ax, dz = bz-az;
      const lenSq = dx*dx+dz*dz;
      let t = lenSq > 0 ? ((x-ax)*dx+(z-az)*dz)/lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax+t*dx-x, pz = az+t*dz-z;
      const d = Math.sqrt(px*px+pz*pz);
      if (d < minDist) minDist = d;
    }
    const PATH_HALF = 2.8, EDGE = 5.5;
    if (minDist < PATH_HALF) return 1.0;
    if (minDist > EDGE) return 0.0;
    return 1.0 - (minDist - PATH_HALF) / (EDGE - PATH_HALF);
  }

  // ── buildScene ────────────────────────────────────────────
  function buildScene(THREE, scene, groundY, MAT) {
    const refs = {
      fireLight: null,
      fireFill:  null,
      flames:    [],   // mist wisps
      embers:    [],
      wightGlow: [],
    };

    function rr(min, max) { return min + Math.random() * (max - min); }
    function add(mesh)    { scene.add(mesh); return mesh; }

    // ── Materials ──────────────────────────────────────────
    const MAT_BARROW_STONE = new THREE.MeshLambertMaterial({ color: 0x3a3d36 });
    const MAT_CAPSTONE     = new THREE.MeshLambertMaterial({ color: 0x2a2d22 });
    const MAT_LICHEN       = new THREE.MeshLambertMaterial({ color: 0x3a4828 });
    const MAT_CAVE_WALL    = new THREE.MeshLambertMaterial({ color: 0x10120e });
    const MAT_BONE         = new THREE.MeshLambertMaterial({ color: 0xb0a88a });
    const MAT_LOG          = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const MAT_BARK         = new THREE.MeshLambertMaterial({ color: 0x2e2010 });
    const MAT_EMBER_COAL   = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    const MAT_MIST_WISP    = new THREE.MeshLambertMaterial({
      color: 0x7aaabb, transparent: true, opacity: 0.15,
    });

    // ── Build one barrow ──────────────────────────────────
    // cx,cz — barrow centre (on hilltop — guaranteed by terrain)
    // scale — stone scale
    // hasCave — whether to cut a cave entrance into the hillside
    function buildBarrow(cx, cz, scale, hasCave) {
      const gy = groundY(cx, cz);

      // Standing-stone ring (orthostats)
      const orthoCount = Math.floor(rr(5, 9));
      const ringR = scale * 3.0;
      for (let i = 0; i < orthoCount; i++) {
        const angle = (i / orthoCount) * Math.PI * 2 + rr(-0.15, 0.15);
        const ox = cx + Math.cos(angle) * ringR * rr(0.85, 1.15);
        const oz = cz + Math.sin(angle) * ringR * rr(0.85, 1.15);
        const h  = scale * rr(2.2, 4.0);
        const rTop = scale * rr(0.16, 0.26);
        const rBot = scale * rr(0.24, 0.40);
        const slab = new THREE.Mesh(
          new THREE.CylinderGeometry(rTop, rBot, h, 9),
          rr(0,1) > 0.4 ? MAT_BARROW_STONE : MAT.STONE_MOSS
        );
        const oY = groundY(ox, oz);
        slab.position.set(ox, oY + h/2 - h*0.25, oz);
        slab.rotation.set(rr(-0.12, 0.12), rr(0, Math.PI*2), rr(-0.08, 0.08));
        add(slab);

        // Occasional fallen stone
        if (rr(0,1) > 0.65) {
          const fh = scale * rr(1.5, 2.8);
          const fallen = new THREE.Mesh(
            new THREE.CylinderGeometry(scale*0.18, scale*0.26, fh, 9),
            MAT.STONE_DARK
          );
          const fY = groundY(ox + rr(-1,1), oz + rr(-1,1));
          fallen.position.set(ox + rr(-0.8,0.8), fY + scale*0.28, oz + rr(-0.8,0.8));
          fallen.rotation.set(Math.PI/2 + rr(-0.2,0.2), rr(0,Math.PI*2), rr(-0.15,0.15));
          add(fallen);
        }
      }

      // Capstone — flat slab on hilltop
      const capW = scale * rr(2.0, 3.2);
      const capH = scale * rr(0.25, 0.45);
      const cap  = new THREE.Mesh(
        new THREE.CylinderGeometry(capW*0.52, capW*0.48, capH, 9),
        MAT_CAPSTONE
      );
      cap.rotation.set(rr(-0.03,0.03), rr(0,Math.PI), rr(-0.02,0.02));
      cap.scale.z = rr(0.55, 0.80);
      cap.position.set(cx + rr(-0.4,0.4), gy + capH*0.6, cz + rr(-0.4,0.4));
      add(cap);

      // Cave entrance — placed on the downhill face, 4–6 u from centre
      if (hasCave) {
        // Find the lowest of 8 radial samples to pick the true downhill face
        let lowestY = Infinity, lowestAngle = 0;
        for (let a = 0; a < 8; a++) {
          const testAngle = (a / 8) * Math.PI * 2;
          const testDist  = scale * 5.0;
          const testY = groundY(
            cx + Math.cos(testAngle) * testDist,
            cz + Math.sin(testAngle) * testDist
          );
          if (testY < lowestY) { lowestY = testY; lowestAngle = testAngle; }
        }
        const caveAngle = lowestAngle + rr(-0.3, 0.3);
        const caveDist  = scale * 4.2;
        const entX = cx + Math.cos(caveAngle) * caveDist;
        const entZ = cz + Math.sin(caveAngle) * caveDist;
        const entY = groundY(entX, entZ);

        const doorH = scale * rr(1.8, 2.6);
        const doorW = scale * rr(0.6, 0.9);
        const perpA = caveAngle + Math.PI / 2;

        // Door jamb uprights
        for (let side = -1; side <= 1; side += 2) {
          const jx = entX + Math.cos(perpA) * side * doorW;
          const jz = entZ + Math.sin(perpA) * side * doorW;
          const jY = groundY(jx, jz);
          const jamb = new THREE.Mesh(
            new THREE.CylinderGeometry(scale*0.16, scale*0.22, doorH, 9),
            MAT.STONE_DARK
          );
          jamb.position.set(jx, jY + doorH/2 - doorH*0.25, jz);
          jamb.rotation.set(rr(-0.05,0.05), caveAngle + rr(-0.1,0.1), rr(-0.04,0.04));
          add(jamb);
        }

        // Lintel
        const lintW = doorW * 2.4 * scale;
        const lintH = scale * 0.28;
        const lintel = new THREE.Mesh(
          new THREE.CylinderGeometry(lintW*0.5, lintW*0.48, lintH, 9),
          MAT_CAPSTONE
        );
        lintel.rotation.set(Math.PI/2 + rr(-0.05,0.05), caveAngle, rr(-0.03,0.03));
        lintel.position.set(entX, entY + doorH*0.72, entZ);
        add(lintel);

        // Cave mouth — dark hemisphere pushed into hillside
        const mouthR = scale * rr(0.7, 1.0);
        const mouth  = new THREE.Mesh(new THREE.SphereGeometry(mouthR, 10, 7), MAT_CAVE_WALL);
        mouth.position.set(
          entX + Math.cos(caveAngle + Math.PI) * mouthR * 0.6,
          entY + mouthR * 0.55,
          entZ + Math.sin(caveAngle + Math.PI) * mouthR * 0.6
        );
        add(mouth);

        // Wight glow — point light inside cave, light only (no mesh)
        const wLight = new THREE.PointLight(0x3399bb, 0.7, scale * 9);
        wLight.position.set(
          entX + Math.cos(caveAngle + Math.PI) * mouthR * 1.4,
          entY + mouthR * 0.9,
          entZ + Math.sin(caveAngle + Math.PI) * mouthR * 1.4
        );
        scene.add(wLight);
        refs.wightGlow.push({ light: wLight, baseIntensity: 0.7, phase: rr(0, Math.PI*2) });

        // Entrance rubble
        for (let ri = 0; ri < 6; ri++) {
          const rox = entX + rr(-scale*1.8, scale*1.8);
          const roz = entZ + rr(-scale*0.8, scale*1.8);
          const rs  = rr(0.14, scale*0.5);
          const rubble = new THREE.Mesh(
            new THREE.SphereGeometry(rs, 8, 6),
            rr(0,1) > 0.5 ? MAT_BARROW_STONE : MAT_LICHEN
          );
          rubble.position.set(rox, groundY(rox,roz) + rs*0.45, roz);
          rubble.scale.set(rr(0.6,1.6), rr(0.3,0.7), rr(0.6,1.6));
          add(rubble);
        }
      }

      // Outer marker-stone ring at base of hill
      const markerCount = Math.floor(rr(6, 12));
      const markerR = scale * rr(4.5, 6.5);
      for (let i = 0; i < markerCount; i++) {
        const mAngle = (i / markerCount) * Math.PI * 2 + rr(-0.5, 0.5);
        const mx = cx + Math.cos(mAngle) * markerR * rr(0.75, 1.25);
        const mz = cz + Math.sin(mAngle) * markerR * rr(0.75, 1.25);
        const ms = rr(0.18, 0.55);
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(ms, 8, 6),
          rr(0,1) > 0.5 ? MAT_LICHEN : MAT_BARROW_STONE
        );
        marker.position.set(mx, groundY(mx,mz) + ms*0.45, mz);
        marker.scale.set(rr(0.5,1.5), rr(0.4,0.9), rr(0.5,1.5));
        add(marker);
      }
    }

    // Build all barrows from BARROWS table
    BARROWS.forEach(([cx, cz, _hr, _hh, scale, hasCave]) => {
      buildBarrow(cx, cz, scale, hasCave);
    });

    // ── Scattered boulders between barrows ─────────────────
    for (let i = 0; i < 90; i++) {
      const bx = rr(-150, 160);
      const bz = rr(-150, 20);
      const s  = rr(0.15, 0.9);
      const geo = rr(0,1) > 0.4
        ? new THREE.SphereGeometry(s, 10, 7)
        : new THREE.SphereGeometry(s, 8, 6);
      const mat = rr(0,1) > 0.6 ? MAT_BARROW_STONE : (rr(0,1) > 0.5 ? MAT.STONE_MOSS : MAT.STONE_DARK);
      const boulder = new THREE.Mesh(geo, mat);
      boulder.position.set(bx, groundY(bx,bz) + s*0.45, bz);
      boulder.scale.set(rr(0.5,1.9), rr(0.35,0.9), rr(0.5,1.7));
      boulder.rotation.y = rr(0, Math.PI*2);
      add(boulder);
    }

    // ── Dead grass tufts — noise-clustered grid ─────────────
    const TUFT_GRID = 3.5;
    for (let gx = -130; gx < 130; gx += TUFT_GRID) {
      for (let gz = -130; gz < 20; gz += TUFT_GRID) {
        const jx = gx + rr(-TUFT_GRID*0.4, TUFT_GRID*0.4);
        const jz = gz + rr(-TUFT_GRID*0.4, TUFT_GRID*0.4);
        const density = api_noise2d(jx*0.06 + 2.2, jz*0.05 - 1.8);
        if (density < 0.40) continue;
        const th = rr(0.28, 0.75);
        const tr = rr(0.04, 0.09);
        const tuft = new THREE.Mesh(
          new THREE.CylinderGeometry(tr*0.25, tr, th, 5),
          MAT_BONE
        );
        const tY = groundY(jx, jz);
        tuft.position.set(jx, tY + th/2 - th*0.08, jz);
        tuft.rotation.set(rr(-0.18,0.18), rr(0,Math.PI*2), rr(-0.18,0.18));
        add(tuft);
      }
    }

    // ── Mist wisps ─────────────────────────────────────────
    for (let i = 0; i < 40; i++) {
      const wx = rr(-130, 150);
      const wz = rr(-130, 15);
      const ws = rr(1.4, 5.0);
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(ws, 8, 6),
        MAT_MIST_WISP.clone()
      );
      wisp.material.opacity = rr(0.09, 0.20);
      const wY = groundY(wx, wz);
      wisp.position.set(wx, wY + rr(0.3, 2.0), wz);
      wisp.scale.set(rr(0.9, 2.2), rr(0.25, 0.55), rr(0.9, 2.2));
      add(wisp);
      refs.flames.push({
        mesh: wisp,
        baseX: wx, baseZ: wz, baseY: wY + rr(0.3, 2.0),
        phase: rr(0, Math.PI*2),
      });
    }

    // ── Camp fire ──────────────────────────────────────────
    // CAMP_X/Z is at the flattened saddle near origin — terrain is
    // guaranteed ≈0 there so campY is always a sensible ground level.
    const campY = groundY(CAMP_X, CAMP_Z);

    // Fire-ring stones
    for (let i = 0; i < 8; i++) {
      const fa  = (i / 8) * Math.PI * 2;
      const fr  = 1.1;
      const fsx = CAMP_X + Math.cos(fa) * fr;
      const fsz = CAMP_Z + Math.sin(fa) * fr;
      const stone = new THREE.Mesh(
        new THREE.SphereGeometry(rr(0.20, 0.34), 8, 6),
        MAT.STONE_DARK
      );
      stone.position.set(fsx, groundY(fsx, fsz) + 0.10, fsz);
      add(stone);
    }

    // Two crossed logs laid horizontal
    [
      { angle: 0.3,              len: 1.8, lr: 0.10, mat: MAT_LOG  },
      { angle: 0.3 + Math.PI/2,  len: 1.5, lr: 0.09, mat: MAT_BARK },
    ].forEach(({ angle, len, lr, mat: lmat }) => {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(lr*0.75, lr, len, 8),
        lmat
      );
      log.rotation.set(0, angle, Math.PI/2);
      log.position.set(CAMP_X + Math.cos(angle)*0.4, campY + lr*0.7, CAMP_Z + Math.sin(angle)*0.4);
      add(log);

      // Charred end nub
      const endNub = new THREE.Mesh(new THREE.SphereGeometry(lr*0.72, 7, 5), MAT_EMBER_COAL);
      endNub.position.set(
        CAMP_X + Math.cos(angle)*(0.4 + len*0.45),
        campY + lr*0.7,
        CAMP_Z + Math.sin(angle)*(0.4 + len*0.45)
      );
      add(endNub);
    });

    // Coal bed
    for (let i = 0; i < 5; i++) {
      const cs   = rr(0.12, 0.28);
      const coal = new THREE.Mesh(new THREE.SphereGeometry(cs, 6, 4), MAT_EMBER_COAL);
      coal.position.set(CAMP_X + rr(-0.5,0.5), campY + cs*0.18, CAMP_Z + rr(-0.5,0.5));
      coal.scale.y = 0.3;
      add(coal);
    }

    // Ember glow mesh
    const emberMat  = new THREE.MeshLambertMaterial({ color: 0xff5500, transparent: true, opacity: 0.85 });
    const emberMesh = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 4), emberMat);
    emberMesh.position.set(CAMP_X, campY + 0.16, CAMP_Z);
    add(emberMesh);
    refs.embers.push({ mesh: emberMesh, mat: emberMat, phase: 0 });

    const fireLight = new THREE.PointLight(0xff4400, 0.55, 12);
    fireLight.position.set(CAMP_X, campY + 0.5, CAMP_Z);
    scene.add(fireLight);
    refs.fireLight = fireLight;

    const fireFill = new THREE.PointLight(0xff2200, 0.18, 7);
    fireFill.position.set(CAMP_X + 0.6, campY + 0.25, CAMP_Z - 0.4);
    scene.add(fireFill);
    refs.fireFill = fireFill;

    return refs;
  }

  // ── onFrame ───────────────────────────────────────────────
  function onFrame(t, dt, refs) {
    if (refs.wightGlow) {
      refs.wightGlow.forEach(entry => {
        if (!entry || !entry.light) return;
        const slow    = Math.sin(t * 0.45 + entry.phase);
        const flicker = Math.sin(t * 2.3  + entry.phase * 1.7) * 0.15;
        entry.light.intensity = entry.baseIntensity * (0.75 + slow*0.18 + flicker);
      });
    }
    if (refs.flames) {
      refs.flames.forEach(wisp => {
        if (!wisp || !wisp.mesh) return;
        const bob = Math.sin(t * 0.26 + wisp.phase) * 0.30;
        wisp.mesh.position.x = wisp.baseX + Math.sin(t * 0.08 + wisp.phase) * 3.0;
        wisp.mesh.position.z = wisp.baseZ + Math.cos(t * 0.06 + wisp.phase) * 2.2;
        wisp.mesh.position.y = wisp.baseY + bob;
        if (wisp.mesh.material) {
          wisp.mesh.material.opacity = 0.09 + Math.sin(t * 0.35 + wisp.phase) * 0.06;
        }
      });
    }
    if (refs.embers && refs.embers.length > 0) {
      const e = refs.embers[0];
      if (e && e.mat) {
        e.mat.opacity = 0.55 + Math.sin(t*3.4 + e.phase)*0.28 + Math.sin(t*7.8)*0.10;
        e.phase += dt * 0.6;
      }
    }
    if (refs.fireLight) {
      refs.fireLight.intensity = 0.42 + Math.sin(t*2.9)*0.10 + Math.sin(t*5.7)*0.06;
    }
    if (refs.fireFill) {
      refs.fireFill.intensity  = 0.12 + Math.sin(t*3.5 + 1.2)*0.06;
    }
  }

  // ── Public object ─────────────────────────────────────────
  return {
    name:     'The Barrow-downs',
    subtitle: 'East of the Shire · Where old evil dwells',

    atmosphere: {
      fogColor:         0x3a4a55,
      fogDensity:       0.028,
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

    start:    { x: CAMP_X, z: CAMP_Z, yaw: 0.4 },
    boundary: 190,

    lorePoints: [
      {
        pos: { x: -18, z: -48 }, radius: 12,
        text: 'Here lie the Barrow-downs, where the Great Barrows were raised in the Second Age for the kings of Cardolan. In evil days the Witch-king of Angmar sent wights out of Rhûdaur to inhabit the mounds — and so they became a place of dread, shunned by all living folk.',
        cite: 'The Lord of the Rings, Appendix A',
      },
      {
        pos: { x: 38, z: -65 }, radius: 10,
        text: 'Tom Bombadil warned the hobbits: "Don\'t go a-meddling with old stone or cold Wights or prying in their houses, unless you be strong folk with hearts that never falter." The cold that breathes from the barrow-doors is no mere night chill — it is the breath of the dead years.',
        cite: 'The Fellowship of the Ring, Ch. 7',
      },
      {
        pos: { x: 74, z: -42 }, radius: 11,
        text: 'Frodo woke alone inside the barrow. A long arm groped toward his friends. He heard a cold voice chanting:\n"Cold be hand and heart and bone, and cold be sleep under stone: never more to wake on stony bed, never, till the Sun fails and the Moon is dead."',
        cite: 'The Fellowship of the Ring, Ch. 8',
      },
      {
        pos: { x: 112, z: -58 }, radius: 10,
        text: 'The blades of the Barrow-wights bore an ancient enchantment — the swords buried with the Dúnedain long ages past. When Merry struck the Witch-king on the Fields of the Pelennor, it was one of these long-kept blades that broke the spell, for they had been made with that very purpose in an age now forgotten.',
        cite: 'The Return of the King, Appendix A',
      },
      {
        pos: { x: 140, z: -50 }, radius: 10,
        text: 'Tom Bombadil came at Frodo\'s cry, singing:\n"Tom Bombadil, Tom Bombadillo! By water, wood and hill, by the reed and willow, by fire, sun and moon, harken now and hear us! Come, Tom Bombadil, for our need is near us!"\nThe wight fled; the barrow-door yawned open into pale sunlight.',
        cite: 'The Fellowship of the Ring, Ch. 8',
      },
    ],

    transitions: [
      { trigger:{x:0, z:-78, radius:8}, to:'weathertop' },
    ],

    buildScene,
    onFrame,
  };

})();

window.BarrowDowns = BarrowDowns;
