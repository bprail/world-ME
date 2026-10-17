// ============================================================
//  loc_barrowdowns.js  —  The Barrow-downs
//  Middle-earth walkable world · location module
//
//  Sequence: (Shire →) Barrow-downs → Weathertop
//  Tone:     Cold, misty, moonlit night.  Wights, dread, ancient barrows.
// ============================================================

const BarrowDowns = {

  // ── Identity ──────────────────────────────────────────────
  name:     'The Barrow-downs',
  subtitle: 'East of the Shire · Where old evil dwells',

  // ── Atmosphere ────────────────────────────────────────────
  atmosphere: {
    fogColor:          0x3a4a55,   // cold slate-blue mist
    fogDensity:        0.030,      // dense but hills must read through it
    skyColor:          0x0d1218,   // near-black midnight sky
    ambientColor:      0x1a2a38,   // deep cold blue ambient
    ambientIntensity:  0.55,
    moonColor:         0xb8cfe0,   // icy silver-blue moon
    moonIntensity:     1.05,
    moonPosition:      { x: -60, y: 110, z: -80 },
  },

  // ── Terrain ───────────────────────────────────────────────
  // Barrow-downs: proper hills — 50-100 ft real-world (~15-30 u at 1u≈1.5ft).
  // Long smooth wavelengths for rounded downs; fine detail for turf texture.
  hillHeight(x, z) {
    // Primary rolling hills — long wavelength, real amplitude (≈18 u peak)
    const h0 = api_fbm(x * 0.014, z * 0.014) * 18.0;
    // Secondary ridgelines — medium wavelength
    const h1 = api_fbm(x * 0.040 + 4.1, z * 0.040 - 2.3) * 6.0;
    // Fine surface texture — keeps turf from looking like plastic
    const h2 = api_fbm(x * 0.10 + 1.7, z * 0.10 + 5.5) * 1.2;
    // Blend: valleys stay open, hilltops dome smoothly
    return h0 + h1 + h2;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Color zones are keyed to real terrain height ranges now that hills are taller.
    // Valley floor  vy < 2   → dark wet loam
    // Hillside      vy 2-12  → dead grey-green turf
    // Upper slopes  vy 12-20 → wind-bleached pale turf
    // Crest         vy > 20  → bone-white scoured rock/turf
    //
    // Noise adds within-zone variation so it reads as organic patches,
    // not a lighting gradient.

    const n     = noise2d(vx * 0.08,  vz * 0.08);   // large-scale patch variation
    const n2    = noise2d(vx * 0.25 + 3.1, vz * 0.20 - 1.4); // mid-scale blotch
    const nFine = noise2d(vx * 0.55 + 7.2, vz * 0.48 + 2.8); // fine speckle

    // ── Base colours ──
    // Dark loam (valley)
    const loamR = 0.13 + n * 0.04,  loamG = 0.12 + n * 0.03,  loamB = 0.09 + n * 0.02;
    // Dead turf (hillside) — grey-green, desaturated
    const turfR = 0.28 + n * 0.07,  turfG = 0.30 + n * 0.07,  turfB = 0.20 + n * 0.04;
    // Bleached turf (upper) — yellowy-grey
    const bleachR = 0.42 + n2 * 0.06, bleachG = 0.40 + n2 * 0.05, bleachB = 0.30 + n2 * 0.04;
    // Scoured crest — near-white cold stone/bare soil
    const crestR = 0.58 + nFine * 0.06, crestG = 0.56 + nFine * 0.05, crestB = 0.48 + nFine * 0.04;

    // ── Smooth height-based transitions ──
    // Each band transitions over a ~3u range to avoid hard lines.
    function band(lo, hi) { return Math.max(0, Math.min(1, (vy - lo) / (hi - lo))); }

    const tLoam   = 1.0 - band(0.5, 3.5);   // valley floor fades in below vy=3.5
    const tTurf   = band(1.0, 4.0) * (1.0 - band(11.0, 14.0));
    const tBleach = band(10.0, 13.0) * (1.0 - band(18.0, 21.0));
    const tCrest  = band(17.0, 21.0);

    // Normalise so weights sum to ~1
    const wSum = tLoam + tTurf + tBleach + tCrest + 0.001;
    const wL = tLoam / wSum, wT = tTurf / wSum, wB = tBleach / wSum, wC = tCrest / wSum;

    let r = wL*loamR   + wT*turfR   + wB*bleachR   + wC*crestR;
    let g = wL*loamG   + wT*turfG   + wB*bleachG   + wC*crestG;
    let b = wL*loamB   + wT*turfB   + wB*bleachB   + wC*crestB;

    // Extra parch blotch — large noise patches of extra-pale dead grass
    // Use n2 threshold so patches are wide enough to read as ground cover,
    // not random noise speckle
    const parch = Math.max(0, (n2 - 0.58) * 2.5);
    r = lerp(r, 0.50, parch * 0.6);
    g = lerp(g, 0.48, parch * 0.6);
    b = lerp(b, 0.37, parch * 0.6);

    return [r, g, b];
  },

  // Path proximity — sinuous track between the barrows
  onPath(x, z) {
    const waypoints = BarrowDowns.pathWaypoints;
    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const ax = waypoints[i][0],   az = waypoints[i][1];
      const bx = waypoints[i+1][0], bz = waypoints[i+1][1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx*dx + dz*dz;
      let t = lenSq > 0 ? ((x-ax)*dx + (z-az)*dz) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx - x;
      const pz = az + t*dz - z;
      const d = Math.sqrt(px*px + pz*pz);
      if (d < minDist) minDist = d;
    }
    const PATH_HALF = 2.8;
    const EDGE = 5.5;
    if (minDist < PATH_HALF) return 1.0;
    if (minDist > EDGE) return 0.0;
    return 1.0 - (minDist - PATH_HALF) / (EDGE - PATH_HALF);
  },

  // ── Path waypoints ────────────────────────────────────────
  pathWaypoints: [
    [  0,   0],
    [ 12, -14],
    [ 26, -22],
    [ 38, -16],
    [ 50, -26],
    [ 62, -20],
    [ 74, -32],
    [ 86, -26],
    [ 98, -36],
    [112, -30],
    [126, -42],
    [140, -36],
    [152, -44],
  ],

  // ── Player start ──────────────────────────────────────────
  start: { x: 0, z: 0, yaw: 0.4 },

  // ── World boundary ────────────────────────────────────────
  boundary: 190,

  // ── Lore points ───────────────────────────────────────────
  lorePoints: [
    {
      pos: { x: -18, z: -38 },
      radius: 12,
      text: 'Here lie the Barrow-downs, where the Great Barrows were raised in the Second Age for the kings of Cardolan. In evil days the Witch-king of Angmar sent wights out of Rhûdaur to inhabit the mounds — and so they became a place of dread, shunned by all living folk.',
      cite: 'The Lord of the Rings, Appendix A',
    },
    {
      pos: { x: 38, z: -55 },
      radius: 10,
      text: 'Tom Bombadil warned the hobbits: "Don\'t go a-meddling with old stone or cold Wights or prying in their houses, unless you be strong folk with hearts that never falter." The cold that breathes from the barrow-doors is no mere night chill — it is the breath of the dead years.',
      cite: 'The Fellowship of the Ring, Ch. 7',
    },
    {
      pos: { x: 74, z: -42 },
      radius: 11,
      text: 'Frodo woke alone inside the barrow. A long arm groped toward his friends. He heard a cold voice chanting:\n"Cold be hand and heart and bone, and cold be sleep under stone: never more to wake on stony bed, never, till the Sun fails and the Moon is dead."',
      cite: 'The Fellowship of the Ring, Ch. 8',
    },
    {
      pos: { x: 112, z: -58 },
      radius: 10,
      text: 'The blades of the Barrow-wights bore an ancient enchantment — the swords buried with the Dúnedain long ages past. When Merry struck the Witch-king on the Fields of the Pelennor, it was one of these long-kept blades that broke the spell, for they had been made with that very purpose in an age now forgotten.',
      cite: 'The Return of the King, Appendix A',
    },
    {
      pos: { x: 140, z: -50 },
      radius: 10,
      text: 'Tom Bombadil came at Frodo\'s cry, singing:\n"Tom Bombadil, Tom Bombadillo! By water, wood and hill, by the reed and willow, by fire, sun and moon, harken now and hear us! Come, Tom Bombadil, for our need is near us!"\nThe wight fled; the barrow-door yawned open into pale sunlight.',
      cite: 'The Fellowship of the Ring, Ch. 8',
    },
  ],

  // ── Transitions ───────────────────────────────────────────
  transitions: [
    {
      trigger: { x: 152, z: -44, radius: 12 },
      to: 'weathertop',
      arrivalOffset: { x: 0, z: 8 },
    },
  ],

  // ── Scene construction ────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      fireLight: null,
      fireFill:  null,
      flames:    [],   // mist wisps stored here
      embers:    [],
      wightGlow: [],   // { light, phase } — lights only, no mesh
    };

    function rr(min, max) { return min + Math.random() * (max - min); }
    function add(mesh) { scene.add(mesh); return mesh; }

    // ── Materials ─────────────────────────────────────────────
    const MAT_BARROW_STONE = new THREE.MeshLambertMaterial({ color: 0x3a3d36 });
    const MAT_CAPSTONE     = new THREE.MeshLambertMaterial({ color: 0x2a2d22 });
    const MAT_LICHEN       = new THREE.MeshLambertMaterial({ color: 0x3a4828 });
    const MAT_CAVE_WALL    = new THREE.MeshLambertMaterial({ color: 0x1e2018 });
    const MAT_BONE         = new THREE.MeshLambertMaterial({ color: 0xb0a88a });
    const MAT_LOG          = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const MAT_BARK         = new THREE.MeshLambertMaterial({ color: 0x2e2010 });
    const MAT_EMBER_COAL   = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    const MAT_MIST_WISP    = new THREE.MeshLambertMaterial({
      color: 0x7aaabb, transparent: true, opacity: 0.15,
    });

    // ── Build a single barrow ─────────────────────────────────
    // Each barrow = standing stones on the hilltop crown
    //             + cave entrance cut into the hillside
    //             + scattered rubble
    // The hill mound itself is the terrain — we dress its surface.
    function buildBarrow(cx, cz, scale, hasCave) {
      const gy = groundY(cx, cz);

      // --- Standing stones: ring of upright orthostats ---
      // These mark the crown and line up with the buried king below
      const orthoCount = Math.floor(rr(5, 9));
      const ringR = scale * 3.0;
      for (let i = 0; i < orthoCount; i++) {
        const angle = (i / orthoCount) * Math.PI * 2 + rr(-0.15, 0.15);
        const ox = cx + Math.cos(angle) * ringR * rr(0.85, 1.15);
        const oz = cz + Math.sin(angle) * ringR * rr(0.85, 1.15);
        const h  = scale * rr(2.2, 4.0);
        const rTop = scale * rr(0.16, 0.26);
        const rBot = scale * rr(0.24, 0.40);
        const geo  = new THREE.CylinderGeometry(rTop, rBot, h, 9);
        const mat  = rr(0,1) > 0.4 ? MAT_BARROW_STONE : MAT.STONE_MOSS;
        const slab = new THREE.Mesh(geo, mat);
        const oY   = groundY(ox, oz);
        slab.position.set(ox, oY + h / 2 - h * 0.25, oz);
        slab.rotation.set(rr(-0.12, 0.12), rr(0, Math.PI * 2), rr(-0.08, 0.08));
        add(slab);

        // Occasional fallen stone — lying flat
        if (rr(0,1) > 0.65) {
          const fh  = scale * rr(1.5, 2.8);
          const fGeo = new THREE.CylinderGeometry(scale*0.18, scale*0.26, fh, 9);
          const fallen = new THREE.Mesh(fGeo, MAT.STONE_DARK);
          const fY = groundY(ox + rr(-1,1), oz + rr(-1,1));
          fallen.position.set(ox + rr(-0.8, 0.8), fY + scale * 0.28, oz + rr(-0.8, 0.8));
          fallen.rotation.set(Math.PI / 2 + rr(-0.2,0.2), rr(0, Math.PI*2), rr(-0.15, 0.15));
          add(fallen);
        }
      }

      // Capstone slab — laid flat across the centre of the ring
      const capW = scale * rr(2.0, 3.2);
      const capH = scale * rr(0.25, 0.45);
      const capGeo = new THREE.CylinderGeometry(capW * 0.52, capW * 0.48, capH, 9);
      const cap = new THREE.Mesh(capGeo, MAT_CAPSTONE);
      cap.rotation.set(rr(-0.03,0.03), rr(0,Math.PI), rr(-0.02,0.02));
      cap.scale.z = rr(0.55, 0.80); // flatten into a slab shape
      cap.position.set(cx + rr(-0.4,0.4), gy + capH * 0.6, cz + rr(-0.4,0.4));
      add(cap);

      // --- Cave entrance cut into the hillside ---
      // Placed on the downhill face of the barrow mound, 4-6 u from centre
      if (hasCave) {
        // Slope direction: find the low side by sampling groundY around the barrow
        // Simple: use a fixed offset toward the path (roughly south/toward origin)
        const caveAngle = Math.atan2(0 - cz, 0 - cx) + rr(-0.5, 0.5);
        const caveDist  = scale * 4.5;
        const entX = cx + Math.cos(caveAngle) * caveDist;
        const entZ = cz + Math.sin(caveAngle) * caveDist;
        const entY = groundY(entX, entZ);

        // Door jamb: two upright slabs flanking the opening
        const doorH  = scale * rr(1.8, 2.6);
        const doorW  = scale * rr(0.6, 0.9);
        const perpA  = caveAngle + Math.PI / 2;
        for (let side = -1; side <= 1; side += 2) {
          const jx = entX + Math.cos(perpA) * side * doorW;
          const jz = entZ + Math.sin(perpA) * side * doorW;
          const jY = groundY(jx, jz);
          const jGeo = new THREE.CylinderGeometry(scale*0.16, scale*0.22, doorH, 9);
          const jamb  = new THREE.Mesh(jGeo, MAT.STONE_DARK);
          jamb.position.set(jx, jY + doorH/2 - doorH*0.25, jz);
          jamb.rotation.set(rr(-0.05,0.05), caveAngle + rr(-0.1,0.1), rr(-0.04,0.04));
          add(jamb);
        }

        // Lintel across the top
        const lintW = doorW * 2.4 * scale;
        const lintH = scale * 0.28;
        const lintGeo = new THREE.CylinderGeometry(lintW*0.5, lintW*0.48, lintH, 9);
        const lintel  = new THREE.Mesh(lintGeo, MAT_CAPSTONE);
        lintel.rotation.set(Math.PI/2 + rr(-0.05,0.05), caveAngle, rr(-0.03,0.03));
        lintel.position.set(entX, entY + doorH * 0.72, entZ);
        add(lintel);

        // Cave mouth — a dark inset hemisphere suggesting depth
        const mouthR = scale * rr(0.7, 1.0);
        const mGeo   = new THREE.SphereGeometry(mouthR, 10, 7);
        const mouth  = new THREE.Mesh(mGeo, MAT_CAVE_WALL);
        // Push it into the hillside so only the dark front face shows
        mouth.position.set(
          entX + Math.cos(caveAngle + Math.PI) * mouthR * 0.5,
          entY + mouthR * 0.55,
          entZ + Math.sin(caveAngle + Math.PI) * mouthR * 0.5
        );
        add(mouth);

        // Wight glow: a point light inside the cave — cold blue seeping from the dark
        const wLight = new THREE.PointLight(0x3399bb, 0.7, scale * 9);
        wLight.position.set(
          entX + Math.cos(caveAngle + Math.PI) * mouthR * 1.2,
          entY + mouthR * 0.8,
          entZ + Math.sin(caveAngle + Math.PI) * mouthR * 1.2
        );
        scene.add(wLight);
        refs.wightGlow.push({ light: wLight, baseIntensity: 0.7, phase: rr(0, Math.PI*2) });

        // Heap of rubble around the entrance — collapsed ancient stonework
        for (let r2 = 0; r2 < 6; r2++) {
          const rox = entX + rr(-scale*1.8, scale*1.8);
          const roz = entZ + rr(-scale*1.2, scale*1.8);
          const rs  = rr(0.14, scale * 0.5);
          const rGeo = new THREE.SphereGeometry(rs, 8, 6);
          const rubble = new THREE.Mesh(rGeo, rr(0,1)>0.5 ? MAT_BARROW_STONE : MAT_LICHEN);
          const rY = groundY(rox, roz);
          rubble.position.set(rox, rY + rs*0.45, roz);
          rubble.scale.set(rr(0.6,1.6), rr(0.3,0.7), rr(0.6,1.6));
          add(rubble);
        }
      }

      // Outer ring of small marker stones around the mound base
      const markerCount = Math.floor(rr(6, 12));
      const markerR = scale * rr(4.5, 6.5);
      for (let i = 0; i < markerCount; i++) {
        const mAngle = (i / markerCount) * Math.PI * 2 + rr(-0.5, 0.5);
        const mx = cx + Math.cos(mAngle) * markerR * rr(0.75, 1.25);
        const mz = cz + Math.sin(mAngle) * markerR * rr(0.75, 1.25);
        const ms = rr(0.18, 0.55);
        const mGeo = new THREE.SphereGeometry(ms, 8, 6);
        const marker = new THREE.Mesh(mGeo, rr(0,1)>0.5 ? MAT_LICHEN : MAT_BARROW_STONE);
        const mY = groundY(mx, mz);
        marker.position.set(mx, mY + ms*0.45, mz);
        marker.scale.set(rr(0.5,1.5), rr(0.4,0.9), rr(0.5,1.5));
        add(marker);
      }
    }

    // ── Barrow placement — 8 meaningful barrows ───────────────
    // Fewer, larger, each with a named character.
    // hasCave=true on the ones the player will actually walk near.
    const barrowDefs = [
      // [cx,   cz,  scale, hasCave]
      [ -22,  -45,   1.5,  true ],   // The First Mound — west sentinel
      [  18,  -60,   1.3,  true ],   // The Mound of Cardolan's Last King
      [  50,  -50,   1.6,  true ],   // The Great Barrow — where the hobbits were taken
      [  74,  -75,   1.2,  false],   // Far north mound, path skirts it
      [  98,  -48,   1.4,  true ],   // Mid-downs barrow, right of path
      [ 120,  -70,   1.1,  false],   // Deep barrow, off-path
      [ 138,  -55,   1.7,  true ],   // The Easternmost Barrow — near transition
      [  30,  -88,   1.0,  false],   // Outlier — distant on southern ridge
    ];

    barrowDefs.forEach(([cx, cz, s, cave]) => buildBarrow(cx, cz, s, cave));

    // ── Scattered loose boulders & ancient rubble ─────────────
    for (let i = 0; i < 90; i++) {
      const bx = rr(-150, 160);
      const bz = rr(-150, 20);
      const s  = rr(0.15, 0.9);
      const geo = rr(0,1) > 0.4
        ? new THREE.SphereGeometry(s, 10, 7)
        : new THREE.SphereGeometry(s, 8, 6);
      const mat = rr(0,1) > 0.6 ? MAT_BARROW_STONE : (rr(0,1)>0.5 ? MAT.STONE_MOSS : MAT.STONE_DARK);
      const boulder = new THREE.Mesh(geo, mat);
      const bY = groundY(bx, bz);
      boulder.position.set(bx, bY + s*0.45, bz);
      boulder.scale.set(rr(0.5,1.9), rr(0.35,0.9), rr(0.5,1.7));
      boulder.rotation.y = rr(0, Math.PI*2);
      add(boulder);
    }

    // ── Dead grass tufts — clustered patches, not random scatter ─
    // Use noise to cluster them so they read as ground-cover zones.
    // Placed in a grid with noise-based accept/reject — patches emerge naturally.
    const TUFT_GRID = 3.5; // grid cell size
    for (let gx = -130; gx < 130; gx += TUFT_GRID) {
      for (let gz = -130; gz < 20; gz += TUFT_GRID) {
        const jx = gx + rr(-TUFT_GRID*0.4, TUFT_GRID*0.4);
        const jz = gz + rr(-TUFT_GRID*0.4, TUFT_GRID*0.4);
        // Patch density: use a noise field so tufts cluster in bands
        const density = api_noise2d(jx * 0.06 + 2.2, jz * 0.05 - 1.8);
        if (density < 0.40) continue; // skip — this cell is bare loam or open ground
        const th = rr(0.28, 0.75);
        const tr = rr(0.04, 0.09);
        const geo  = new THREE.CylinderGeometry(tr*0.25, tr, th, 5);
        const tuft = new THREE.Mesh(geo, MAT_BONE);
        const tY   = groundY(jx, jz);
        tuft.position.set(jx, tY + th/2 - th*0.08, jz);
        tuft.rotation.set(rr(-0.18,0.18), rr(0,Math.PI*2), rr(-0.18,0.18));
        add(tuft);
      }
    }

    // ── Mist wisps ────────────────────────────────────────────
    for (let i = 0; i < 40; i++) {
      const wx = rr(-130, 150);
      const wz = rr(-130, 15);
      const ws = rr(1.4, 5.0);
      const geo  = new THREE.SphereGeometry(ws, 8, 6);
      const wisp = new THREE.Mesh(geo, MAT_MIST_WISP.clone());
      wisp.material.opacity = rr(0.09, 0.20);
      const wY = groundY(wx, wz);
      wisp.position.set(wx, wY + rr(0.3, 2.0), wz);
      wisp.scale.set(rr(0.9, 2.2), rr(0.25, 0.55), rr(0.9, 2.2));
      add(wisp);
      refs.flames.push({
        mesh: wisp,
        baseX: wx, baseZ: wz, baseY: wY + rr(0.3, 2.0),
        phase: rr(0, Math.PI*2),
        driftX: rr(-0.006, 0.006),
        driftZ: rr(-0.005, 0.005),
      });
    }

    // ── Camp fire — hobbits' resting place before capture ─────
    const campX = 6, campZ = -10;
    const campY = groundY(campX, campZ);

    // Fire ring stones
    const fireRingCount = 8;
    for (let i = 0; i < fireRingCount; i++) {
      const fa  = (i / fireRingCount) * Math.PI * 2;
      const fr  = 1.1;
      const fsx = campX + Math.cos(fa) * fr;
      const fsz = campZ + Math.sin(fa) * fr;
      const fsY = groundY(fsx, fsz);
      const fsGeo = new THREE.SphereGeometry(rr(0.20, 0.34), 8, 6);
      const fs    = new THREE.Mesh(fsGeo, MAT.STONE_DARK);
      fs.position.set(fsx, fsY + 0.22*0.45, fsz);
      add(fs);
    }

    // Logs — two crossing cylinders, charred and partly burnt
    const logDefs = [
      { angle: 0.3,         len: 1.8, r: 0.10, mat: MAT_LOG  },
      { angle: 0.3+Math.PI/2, len: 1.5, r: 0.09, mat: MAT_BARK },
    ];
    logDefs.forEach(({ angle, len, r: lr, mat: lmat }) => {
      const lGeo = new THREE.CylinderGeometry(lr*0.75, lr, len, 8);
      const log  = new THREE.Mesh(lGeo, lmat);
      log.rotation.set(0, angle, Math.PI/2); // lay horizontal
      log.position.set(campX + Math.cos(angle)*0.4, campY + lr*0.7, campZ + Math.sin(angle)*0.4);
      add(log);

      // Charred end nub — darkened tip
      const endGeo = new THREE.SphereGeometry(lr*0.72, 7, 5);
      const endNub  = new THREE.Mesh(endGeo, MAT_EMBER_COAL);
      endNub.position.set(
        campX + Math.cos(angle)*(0.4 + len*0.45),
        campY + lr*0.7,
        campZ + Math.sin(angle)*(0.4 + len*0.45)
      );
      add(endNub);
    });

    // Bed of coals — flat dark discs under the logs
    for (let i = 0; i < 5; i++) {
      const cs  = rr(0.12, 0.28);
      const cGeo = new THREE.SphereGeometry(cs, 6, 4);
      const coal = new THREE.Mesh(cGeo, MAT_EMBER_COAL);
      coal.position.set(campX + rr(-0.5,0.5), campY + cs*0.25, campZ + rr(-0.5,0.5));
      coal.scale.y = 0.3;
      add(coal);
    }

    // Ember glow — small flickering orange sphere above the coal bed
    const emberGeo  = new THREE.SphereGeometry(0.10, 6, 4);
    const emberMat  = new THREE.MeshLambertMaterial({ color: 0xff5500, transparent: true, opacity: 0.85 });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.set(campX, campY + 0.15, campZ);
    add(emberMesh);
    refs.embers.push({ mesh: emberMesh, mat: emberMat, phase: 0 });

    // Main fire light — low warm orange
    const fireLight = new THREE.PointLight(0xff4400, 0.55, 12);
    fireLight.position.set(campX, campY + 0.5, campZ);
    scene.add(fireLight);
    refs.fireLight = fireLight;

    const fireFill = new THREE.PointLight(0xff2200, 0.18, 7);
    fireFill.position.set(campX + 0.6, campY + 0.25, campZ - 0.4);
    scene.add(fireFill);
    refs.fireFill = fireFill;

    return refs;
  },

  // ── Per-frame animation ───────────────────────────────────
  onFrame(t, dt, refs) {
    // Wight cave lights — slow pulse, occasional stutter
    if (refs.wightGlow) {
      refs.wightGlow.forEach(entry => {
        if (!entry || !entry.light) return;
        const slow = Math.sin(t * 0.45 + entry.phase);
        const flicker = Math.sin(t * 2.3 + entry.phase * 1.7) * 0.15;
        entry.light.intensity = entry.baseIntensity * (0.75 + slow * 0.18 + flicker);
      });
    }

    // Mist wisps — slow lateral drift and vertical bob
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

    // Ember flicker
    if (refs.embers && refs.embers.length > 0) {
      const e = refs.embers[0];
      if (e && e.mat) {
        e.mat.opacity = 0.55 + Math.sin(t * 3.4 + e.phase) * 0.28 + Math.sin(t * 7.8) * 0.10;
        e.phase += dt * 0.6;
      }
    }
    if (refs.fireLight) {
      refs.fireLight.intensity = 0.42 + Math.sin(t * 2.9) * 0.10 + Math.sin(t * 5.7) * 0.06;
    }
    if (refs.fireFill) {
      refs.fireFill.intensity  = 0.12 + Math.sin(t * 3.5 + 1.2) * 0.06;
    }
  },
};

window.BarrowDowns = BarrowDowns;
