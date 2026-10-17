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
    fogDensity:        0.038,      // dense — visibility ~25 u
    skyColor:          0x0d1218,   // near-black midnight sky
    ambientColor:      0x1a2a38,   // deep cold blue ambient
    ambientIntensity:  0.55,
    moonColor:         0xb8cfe0,   // icy silver-blue moon
    moonIntensity:     1.05,
    moonPosition:      { x: -60, y: 110, z: -80 },
  },

  // ── Terrain ───────────────────────────────────────────────
  // Barrow-downs: low rounded hills separated by shallow valleys.
  // Barrows sit on the crown of each hill. Paths wind between them.
  hillHeight(x, z) {
    // Large rolling downs — long wavelength, modest amplitude
    const h0 = api_fbm(x * 0.018, z * 0.018) * 9.0;          // main rolling hills
    const h1 = api_fbm(x * 0.055 + 4.1, z * 0.055 - 2.3) * 3.0; // secondary bumps
    const h2 = api_fbm(x * 0.12 + 1.7, z * 0.12 + 5.5) * 0.8;   // fine texture
    const flat = api_lerp(h0 + h1 + h2, 0.4, 0.18);           // keep valleys shallow-ish
    return flat;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Dead grey-green turf, bleached by dread, dark in valleys
    const n = noise2d(vx * 0.09, vz * 0.09);
    const parch = noise2d(vx * 0.22 + 3.1, vz * 0.18 - 1.4); // dry patches

    // Base dead grass: cold yellow-grey
    const grassR = lerp(0.28, 0.38, n);
    const grassG = lerp(0.30, 0.40, n);
    const grassB = lerp(0.20, 0.26, n);

    // Dark loam in valleys (low vy relative to surroundings)
    const loamFactor = Math.max(0, 1.0 - vy * 0.18);
    const loamR = 0.14; const loamG = 0.13; const loamB = 0.10;

    // Bleached crest (wind-scoured hilltop)
    const crestFactor = Math.max(0, (vy - 5.0) * 0.12);
    const crestR = 0.48; const crestG = 0.46; const crestB = 0.38;

    // Parch patches — bone-pale dead grass
    const parchFactor = Math.max(0, parch - 0.6) * 2.5;
    const parchR = 0.52; const parchG = 0.50; const parchB = 0.40;

    let r = lerp(grassR, loamR,  loamFactor);
    let g = lerp(grassG, loamG,  loamFactor);
    let b = lerp(grassB, loamB,  loamFactor);
    r = lerp(r, crestR, Math.min(1, crestFactor));
    g = lerp(g, crestG, Math.min(1, crestFactor));
    b = lerp(b, crestB, Math.min(1, crestFactor));
    r = lerp(r, parchR, Math.min(1, parchFactor));
    g = lerp(g, parchG, Math.min(1, parchFactor));
    b = lerp(b, parchB, Math.min(1, parchFactor));

    return [r, g, b];
  },

  // Path proximity — sinuous track between the barrows
  onPath(x, z) {
    // Main path: winds east from start toward Weathertop transition
    // Defined as a piecewise linear spine; return smooth proximity
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
  // Winds north-east through the downs, skirting the main barrow clusters
  pathWaypoints: [
    [  0,   0],
    [ 10, -12],
    [ 22, -20],
    [ 32, -14],
    [ 44, -22],
    [ 55, -18],
    [ 66, -28],
    [ 78, -24],
    [ 88, -32],
    [100, -28],
    [112, -38],
    [124, -32],
    [136, -40],
    [150, -36],
  ],

  // ── Player start ──────────────────────────────────────────
  start: { x: 0, z: 0, yaw: 0.4 },  // facing north-east, into the downs

  // ── World boundary ────────────────────────────────────────
  boundary: 180,

  // ── Lore points ───────────────────────────────────────────
  lorePoints: [
    {
      pos: { x: -18, z: -30 },
      radius: 10,
      text: 'Here lie the Barrow-downs, where the Great Barrows were raised in the Second Age for the kings of Cardolan. In evil days the Witch-king of Angmar sent wights out of Rhûdaur to inhabit the mounds — and so they became a place of dread, shunned by all living folk.',
      cite: 'The Lord of the Rings, Appendix A',
    },
    {
      pos: { x: 30, z: -50 },
      radius: 9,
      text: 'Tom Bombadil warned the hobbits: "Don\'t go a-meddling with old stone or cold Wights or prying in their houses, unless you be strong folk with hearts that never falter." The cold that breathes from the barrow-doors is no mere night chill — it is the breath of the dead years.',
      cite: 'The Fellowship of the Ring, Ch. 7',
    },
    {
      pos: { x: 60, z: -35 },
      radius: 11,
      text: 'Frodo woke alone inside the barrow. A long arm groped toward his friends. He heard a cold voice chanting:\n"Cold be hand and heart and bone, and cold be sleep under stone: never more to wake on stony bed, never, till the Sun fails and the Moon is dead."',
      cite: 'The Fellowship of the Ring, Ch. 8',
    },
    {
      pos: { x: 90, z: -55 },
      radius: 9,
      text: 'The blades of the Barrow-wights bore an ancient enchantment — the swords buried with the Dúnedain long ages past. When Merry struck the Witch-king on the Fields of the Pelennor, it was one of these long-kept blades that broke the spell, for they had been made with that very purpose in an age now forgotten.',
      cite: 'The Return of the King, Appendix A',
    },
    {
      pos: { x: 120, z: -44 },
      radius: 10,
      text: 'Tom Bombadil came at Frodo\'s cry, singing:\n"Tom Bombadil, Tom Bombadillo! By water, wood and hill, by the reed and willow, by fire, sun and moon, harken now and hear us! Come, Tom Bombadil, for our need is near us!"\nThe wight fled; the barrow-door yawned open into pale sunlight.',
      cite: 'The Fellowship of the Ring, Ch. 8',
    },
  ],

  // ── Transitions ───────────────────────────────────────────
  transitions: [
    {
      trigger: { x: 150, z: -36, radius: 12 },
      to: 'weathertop',
      arrivalOffset: { x: 0, z: 8 },
    },
  ],

  // ── Scene construction ────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      fireLight: null,
      fireFill:  null,
      flames:    [],
      embers:    [],
      wightGlow: [],  // cold blue grave-lights on barrow crests
    };

    // ── Helper: random range ──
    function rr(min, max) { return min + Math.random() * (max - min); }

    // ── Materials ─────────────────────────────────────────────
    // Ancient stone — greenish lichen on cold grey
    const MAT_BARROW_STONE = new THREE.MeshLambertMaterial({ color: 0x3a3d36 });
    const MAT_CAPSTONE     = new THREE.MeshLambertMaterial({ color: 0x2e3028 });
    const MAT_LICHEN       = new THREE.MeshLambertMaterial({ color: 0x3d4a2e });
    const MAT_BONE         = new THREE.MeshLambertMaterial({ color: 0xb0a88a });
    // Ghostly wisp material (additive-ish cold blue, but Lambert available)
    const MAT_WIGHT_GLOW   = new THREE.MeshLambertMaterial({
      color:       0x6aaccc,
      transparent: true,
      opacity:     0.55,
    });
    const MAT_MIST_WISP    = new THREE.MeshLambertMaterial({
      color:       0x8ab4c8,
      transparent: true,
      opacity:     0.18,
    });

    // ── Utility: add to scene ─────────────────────────────────
    function add(mesh) { scene.add(mesh); return mesh; }

    // ── Build a single barrow ─────────────────────────────────
    // A barrow: earthen mound (skipped — terrain handles mounds) +
    //   upright standing stones (orthostats) + capstone + surrounding
    //   ring of smaller marker stones.
    function buildBarrow(cx, cz, scale) {
      const gy = groundY(cx, cz);

      // Upright orthostats — tall thin slabs ringing the burial chamber
      const orthoCount = Math.floor(rr(4, 7));
      const ringR = scale * 2.2;
      for (let i = 0; i < orthoCount; i++) {
        const angle = (i / orthoCount) * Math.PI * 2 + rr(-0.2, 0.2);
        const ox = cx + Math.cos(angle) * ringR * rr(0.8, 1.1);
        const oz = cz + Math.sin(angle) * ringR * rr(0.8, 1.1);
        const h  = scale * rr(1.8, 3.2);
        const rTop = scale * rr(0.18, 0.28);
        const rBot = scale * rr(0.22, 0.38);
        const geo = new THREE.CylinderGeometry(rTop, rBot, h, 9);
        // random lean
        const slab = new THREE.Mesh(geo, rr(0,1) > 0.4 ? MAT_BARROW_STONE : MAT.STONE_MOSS);
        const oY = groundY(ox, oz);
        slab.position.set(ox, oY + h / 2 - h * 0.25, oz);
        slab.rotation.set(rr(-0.08, 0.08), rr(0, Math.PI * 2), rr(-0.06, 0.06));
        add(slab);
      }

      // Capstone — wide flat slab across the top of two uprights
      const capW = scale * rr(1.6, 2.4);
      const capH = scale * rr(0.22, 0.38);
      const capD = scale * rr(0.9, 1.4);
      const capGeo = new THREE.CylinderGeometry(capW * 0.5, capW * 0.48, capH, 9);
      const cap = new THREE.Mesh(capGeo, MAT_CAPSTONE);
      cap.rotation.set(rr(-0.04, 0.04), rr(0, Math.PI), rr(-0.03, 0.03));
      cap.scale.z = capD / capW;
      cap.position.set(
        cx + rr(-0.3, 0.3),
        gy + scale * 1.8 + capH * 0.25,
        cz + rr(-0.3, 0.3)
      );
      add(cap);

      // Lintel doorway — two flanking uprights + one crosspiece, off-axis
      const doorAngle = rr(0, Math.PI * 2);
      const doorDist  = scale * 1.0;
      const doorH     = scale * rr(1.2, 1.8);
      for (let side = -1; side <= 1; side += 2) {
        const dpx = cx + Math.cos(doorAngle + side * 0.3) * doorDist;
        const dpz = cz + Math.sin(doorAngle + side * 0.3) * doorDist;
        const dpy = groundY(dpx, dpz);
        const dGeo = new THREE.CylinderGeometry(scale * 0.14, scale * 0.18, doorH, 9);
        const dSlab = new THREE.Mesh(dGeo, MAT.STONE_DARK);
        dSlab.position.set(dpx, dpy + doorH / 2 - doorH * 0.25, dpz);
        add(dSlab);
      }

      // Scatter ring of small marker stones around mound base
      const markerCount = Math.floor(rr(5, 10));
      const markerR = scale * rr(3.5, 5.0);
      for (let i = 0; i < markerCount; i++) {
        const mAngle = (i / markerCount) * Math.PI * 2 + rr(-0.4, 0.4);
        const mx = cx + Math.cos(mAngle) * markerR * rr(0.7, 1.3);
        const mz = cz + Math.sin(mAngle) * markerR * rr(0.7, 1.3);
        const ms = rr(0.15, 0.5);
        const mGeo = new THREE.SphereGeometry(ms, 8, 6);
        const marker = new THREE.Mesh(mGeo, rr(0,1)>0.5 ? MAT_LICHEN : MAT_BARROW_STONE);
        const mY = groundY(mx, mz);
        marker.position.set(mx, mY + ms * 0.45, mz);
        marker.scale.set(rr(0.6,1.4), rr(0.5,1.0), rr(0.6,1.4));
        add(marker);
      }

      // Barrow-wight cold glow — a dim sphere hovering just above the capstone
      const glowGeo  = new THREE.SphereGeometry(scale * 0.35, 8, 6);
      const glowMesh = new THREE.Mesh(glowGeo, MAT_WIGHT_GLOW);
      glowMesh.position.set(cx, gy + scale * 2.5, cz);
      add(glowMesh);
      refs.wightGlow.push({ mesh: glowMesh, baseY: gy + scale * 2.5, phase: rr(0, Math.PI * 2) });

      // Point light — cold blue, weak, intimate range
      const wLight = new THREE.PointLight(0x4488aa, 0.6, scale * 12);
      wLight.position.set(cx, gy + scale * 2.8, cz);
      scene.add(wLight);
      refs.wightGlow.push({ light: wLight, baseY: gy + scale * 2.8, phase: rr(0, Math.PI * 2) });
    }

    // ── Barrow placement ──────────────────────────────────────
    // Scattered across the downs — clusters on hill crowns, stragglers between
    const barrowDefs = [
      // [cx, cz, scale]  — placed to flank the player path
      [-20, -35, 1.4],   // west cluster
      [-28, -22, 1.1],
      [-12, -50, 1.6],   // large barrow, main hill
      [ 10, -55, 1.0],
      [ 24, -38, 1.3],
      [ 38, -60, 1.5],
      [ 50, -45, 1.2],
      [ 48, -28, 0.9],   // path-side warning stone
      [ 62, -68, 1.7],   // great barrow, far hill
      [ 75, -52, 1.1],
      [ 80, -38, 0.8],
      [ 88, -70, 1.4],
      [100, -55, 1.3],
      [112, -65, 1.6],
      [125, -50, 1.0],
      [130, -78, 1.8],   // the Great Barrow — largest
      [145, -60, 1.2],
      // Scattered outliers
      [-35, -60, 0.8],
      [ 55, -80, 0.9],
      [ 95, -82, 1.1],
    ];

    barrowDefs.forEach(([cx, cz, s]) => buildBarrow(cx, cz, s));

    // ── Scattered loose boulders & rubble ─────────────────────
    // Collapsed stones from ancient barrows — everywhere
    const boulderPositions = [];
    for (let i = 0; i < 120; i++) {
      const bx = rr(-140, 140);
      const bz = rr(-140, 30);
      boulderPositions.push([bx, bz]);
    }
    boulderPositions.forEach(([bx, bz]) => {
      const s   = rr(0.12, 0.8);
      const geo = rr(0,1) > 0.4
        ? new THREE.SphereGeometry(s, 10, 7)   // rounded glacial boulder
        : new THREE.SphereGeometry(s, 8, 6);    // angular chunk
      const mat = rr(0,1) > 0.6 ? MAT_BARROW_STONE : (rr(0,1) > 0.5 ? MAT.STONE_MOSS : MAT.STONE_DARK);
      const boulder = new THREE.Mesh(geo, mat);
      const bY = groundY(bx, bz);
      boulder.position.set(bx, bY + s * 0.45, bz);
      boulder.scale.set(rr(0.5,1.8), rr(0.4,1.0), rr(0.6,1.6));
      boulder.rotation.y = rr(0, Math.PI * 2);
      add(boulder);
    });

    // ── Pale dead grass tufts — vertical cylinders ─────────────
    // Thin wisps of bone-grey grass scattered in patches
    for (let i = 0; i < 200; i++) {
      const tx = rr(-130, 130);
      const tz = rr(-130, 20);
      const th = rr(0.3, 0.9);
      const tr = rr(0.04, 0.10);
      const geo  = new THREE.CylinderGeometry(tr * 0.3, tr, th, 5);
      const tuft = new THREE.Mesh(geo, MAT_BONE);
      const tY   = groundY(tx, tz);
      tuft.position.set(tx, tY + th / 2 - th * 0.1, tz);
      tuft.rotation.set(rr(-0.15, 0.15), rr(0, Math.PI*2), rr(-0.15, 0.15));
      add(tuft);
    }

    // ── Mist wisps — low-drifting translucent spheres ──────────
    // Hover a metre above ground, animate in onFrame
    const wispCount = 40;
    for (let i = 0; i < wispCount; i++) {
      const wx = rr(-120, 130);
      const wz = rr(-120, 15);
      const ws = rr(1.2, 4.5);
      const geo  = new THREE.SphereGeometry(ws, 8, 6);
      const wisp = new THREE.Mesh(geo, MAT_MIST_WISP.clone());
      wisp.material.opacity = rr(0.10, 0.22);
      const wY = groundY(wx, wz);
      wisp.position.set(wx, wY + rr(0.4, 1.8), wz);
      wisp.scale.set(rr(0.8, 2.0), rr(0.3, 0.7), rr(0.8, 2.0));
      add(wisp);
      refs.flames.push({  // reuse flames slot for wisps
        mesh: wisp,
        baseX: wx, baseZ: wz, baseY: wY + rr(0.4, 1.8),
        phase: rr(0, Math.PI * 2),
        driftX: rr(-0.008, 0.008),
        driftZ: rr(-0.006, 0.006),
      });
    }

    // ── A central fire — cold, low; hobbits' camp remnant ──────
    // (Per contract, buildScene must return fireLight/fireFill/flames/embers)
    const campX = 6, campZ = -8;
    const campY = groundY(campX, campZ);

    // Ember ring of small stones
    const stoneCount = 7;
    for (let i = 0; i < stoneCount; i++) {
      const sa  = (i / stoneCount) * Math.PI * 2;
      const sr  = 0.9;
      const ssx = campX + Math.cos(sa) * sr;
      const ssz = campZ + Math.sin(sa) * sr;
      const ssY = groundY(ssx, ssz);
      const sgeo = new THREE.SphereGeometry(rr(0.18, 0.30), 8, 6);
      const ss   = new THREE.Mesh(sgeo, MAT.STONE_DARK);
      ss.position.set(ssx, ssY + 0.18 * 0.45, ssz);
      add(ss);
    }

    // Ember glow — very dim orange, barely alive
    const fireLight = new THREE.PointLight(0xff5500, 0.35, 10);
    fireLight.position.set(campX, campY + 0.4, campZ);
    scene.add(fireLight);
    refs.fireLight = fireLight;

    const fireFill = new THREE.PointLight(0xff3300, 0.12, 6);
    fireFill.position.set(campX + 0.5, campY + 0.2, campZ - 0.3);
    scene.add(fireFill);
    refs.fireFill = fireFill;

    // Flame mesh — just a tiny glowing nub (embers, nearly dead)
    const emberGeo  = new THREE.SphereGeometry(0.12, 6, 4);
    const emberMat  = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.set(campX, campY + 0.18, campZ);
    add(emberMesh);
    refs.embers.push({ mesh: emberMesh, mat: emberMat, phase: 0 });

    return refs;
  },

  // ── Per-frame animation ───────────────────────────────────
  onFrame(t, dt, refs) {
    // Pulse wight glows and cold point lights
    if (refs.wightGlow) {
      refs.wightGlow.forEach(entry => {
        if (!entry) return;
        const slow = Math.sin(t * 0.55 + entry.phase);
        const fast = Math.sin(t * 1.8  + entry.phase * 1.3) * 0.3;
        if (entry.mesh) {
          // gentle float + opacity flicker
          entry.mesh.position.y = entry.baseY + slow * 0.18 + fast * 0.08;
          if (entry.mesh.material) {
            entry.mesh.material.opacity = 0.38 + slow * 0.14 + fast * 0.06;
          }
        }
        if (entry.light) {
          entry.light.position.y = entry.baseY + slow * 0.22;
          entry.light.intensity  = 0.5 + slow * 0.18 + fast * 0.10;
        }
      });
    }

    // Drift mist wisps
    if (refs.flames) {
      refs.flames.forEach(wisp => {
        if (!wisp || !wisp.mesh) return;
        const bob = Math.sin(t * 0.28 + wisp.phase) * 0.25;
        wisp.mesh.position.x = wisp.baseX + Math.sin(t * wisp.driftX * 120 + wisp.phase) * 2.5;
        wisp.mesh.position.z = wisp.baseZ + Math.cos(t * wisp.driftZ * 120 + wisp.phase) * 2.0;
        wisp.mesh.position.y = wisp.baseY + bob;
        if (wisp.mesh.material) {
          wisp.mesh.material.opacity = 0.10 + Math.sin(t * 0.4 + wisp.phase) * 0.07;
        }
      });
    }

    // Ember flicker — barely alive fire
    if (refs.embers && refs.embers.length > 0) {
      const e = refs.embers[0];
      if (e && e.mat) {
        e.mat.opacity = 0.5 + Math.sin(t * 3.1 + e.phase) * 0.3 + Math.sin(t * 7.3) * 0.12;
        e.phase += dt * 0.5;
      }
    }
    if (refs.fireLight) {
      refs.fireLight.intensity = 0.28 + Math.sin(t * 2.7) * 0.10 + Math.sin(t * 5.1) * 0.05;
    }
    if (refs.fireFill) {
      refs.fireFill.intensity  = 0.08 + Math.sin(t * 3.3 + 1.1) * 0.05;
    }
  },
};

window.BarrowDowns = BarrowDowns;