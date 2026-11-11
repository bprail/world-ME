// edoras.js — Edoras, the Golden Hall of Rohan
// Sequence: fangorn <-> edoras <-> helmsdeep

const Edoras = {

  name:     'Edoras',
  subtitle:  'Meduseld · The Golden Hall of Rohan',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0xc8c0a0,
    fogType:          'linear',
    fogNear:          90,
    fogFar:           280,
    skyColor:         0x7aa0c8,
    ambientColor:     0x9090a0,
    ambientIntensity: 1.1,
    moonColor:        0xfff4d0,   // warm afternoon sun
    moonIntensity:    1.6,
    moonPosition:     { x: 60, y: 120, z: -40 },
    showStars:        false,
    extraLights: [
      // soft blue fill from the opposite sky
      { color: 0x8aaac8, intensity: 0.35, x: -80, y: 60, z: 80 },
      // warm bounce off the golden grass plain
      { color: 0xd4b870, intensity: 0.18, x: 0,   y: -10, z: 30 },
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  // The hill of Edoras: a smooth broad mound centred at (0, -20).
  // The plain stretches south (+Z) toward Fangorn and north-west (-Z) toward
  // Helm's Deep. The road winds up from the south, arriving at the palisade
  // gate around z=0, then climbs the paved causeway to Meduseld at the crown.

  hillHeight(x, z) {
    const fbm    = window.api_fbm;
    const noise  = window.api_noise2d;

    // Main hill — Gaussian mound centred at (0, -20), peak 14
    const dx = x, dz = z + 20;
    const hillGauss = 14.0 * Math.exp(-(dx*dx + dz*dz) / 450.0);

    // Secondary eastward spur — the hill isn't perfectly round
    const ex = x - 18, ez = z + 12;
    const spur = 3.5 * Math.exp(-(ex*ex + ez*ez) / 180.0);

    // Broad plains undulation
    const plains = 0.55 * fbm(x * 0.038, z * 0.038);

    // Mid-frequency grassy rolls
    const rolls = 0.35 * noise(x * 0.09, z * 0.09);

    // Fine surface texture
    const texture = 0.12 * noise(x * 0.28, z * 0.28);

    // Smooth path bed along the road centreline — slightly flatten it
    // so the paved walkable sits a consistent 0.5 units above terrain
    const pathDist = Math.abs(x) + Math.max(0, 2.0 - Math.abs(z - (-9)));
    const pathFlatten = Math.exp(-pathDist * pathDist / 8.0) *
                        Math.exp(-((z+9)*(z+9)) / 400.0) * 0.4;

    return hillGauss + spur + plains + rolls + texture - pathFlatten;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Determine how high up the hill we are (0 = plain, 1 = crown)
    const dx = vx, dz = vz + 20;
    const dHill = Math.sqrt(dx*dx + dz*dz);
    const hillFraction = Math.max(0, 1.0 - dHill / 32.0);

    // Height-based blend — golden parched grass on crown, richer below
    const heightT = Math.min(1, Math.max(0, (vy - 2.0) / 12.0));

    // Noise for variety
    const n1 = noise2d(vx * 0.07, vz * 0.07);
    const n2 = noise2d(vx * 0.19, vz * 0.19);
    const n3 = noise2d(vx * 0.41, vz * 0.41);

    // Base: rich Rohan plain grass (blue-green)
    const grassR = lerp(0.30, 0.42, n1);
    const grassG = lerp(0.36, 0.46, n1);
    const grassB = lerp(0.14, 0.20, n2);

    // Hill grass: dry golden-green
    const hillR = lerp(0.52, 0.62, n2);
    const hillG = lerp(0.50, 0.58, n1);
    const hillB = lerp(0.16, 0.22, n3);

    // Crown / parched top: pale straw gold
    const crownR = lerp(0.68, 0.76, n3);
    const crownG = lerp(0.60, 0.66, n1);
    const crownB = lerp(0.20, 0.26, n2);

    // Bare rock patches on steep hillside
    const rockR = lerp(0.44, 0.52, n2);
    const rockG = lerp(0.40, 0.46, n2);
    const rockB = lerp(0.32, 0.36, n3);

    // Steepness proxy: use height relative to neighbours (approximated by y)
    const steepT = Math.min(1, Math.max(0, (vy - 7.0) / 6.0)) * (0.3 + 0.7*n2);

    // Blend chain
    let r = lerp(grassR, hillR, hillFraction * 0.6 + heightT * 0.4);
    let g = lerp(grassG, hillG, hillFraction * 0.6 + heightT * 0.4);
    let b = lerp(grassB, hillB, hillFraction * 0.6 + heightT * 0.4);

    r = lerp(r, crownR, hillFraction * hillFraction * heightT);
    g = lerp(g, crownG, hillFraction * hillFraction * heightT);
    b = lerp(b, crownB, hillFraction * hillFraction * heightT);

    r = lerp(r, rockR, steepT * 0.45);
    g = lerp(g, rockG, steepT * 0.45);
    b = lerp(b, rockB, steepT * 0.45);

    // Paved causeway strip — stone-grey band along the road approach
    const roadDist = Math.sqrt(vx*vx + (vz + 9)*(vz + 9) * 0.15); // elongated along z
    const roadMask = Math.max(0, 1.0 - Math.abs(vx) / 2.5) *
                     (vz > -22 && vz < 4 ? 1 : 0);
    const stoneR = lerp(0.50, 0.58, n3);
    const stoneG = lerp(0.46, 0.52, n2);
    const stoneB = lerp(0.38, 0.44, n1);
    const roadBlend = roadMask * 0.70;
    r = lerp(r, stoneR, roadBlend);
    g = lerp(g, stoneG, roadBlend);
    b = lerp(b, stoneB, roadBlend);

    return [r, g, b];
  },

  // Path centreline: winding road from south plain up to Meduseld
  onPath(x, z) {
    // Piecewise linear path — same waypoints as pathWaypoints
    const segs = [
      [[0, 68], [0, 50]],
      [[0, 50], [-4, 35]],
      [[-4, 35], [-2, 20]],
      [[-2, 20], [0, 5]],
      [[0, 5], [0, -20]],
    ];
    const radius = 2.5;
    let minDist = Infinity;
    for (const [[ax, az], [bx, bz]] of segs) {
      const dx = bx - ax, dz = bz - az;
      const len2 = dx*dx + dz*dz;
      let t = ((x - ax)*dx + (z - az)*dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx - x;
      const pz = az + t*dz - z;
      minDist = Math.min(minDist, Math.sqrt(px*px + pz*pz));
    }
    return Math.max(0, 1.0 - minDist / radius);
  },

  // ─── Path ribbon waypoints ──────────────────────────────────────────────────
  pathWaypoints: [
    [  0,  68 ],   // at +Z end, arriving from Fangorn side
    [  0,  50 ],   // open plain
    [ -4,  35 ],   // gentle bend as terrain starts rising
    [ -2,  20 ],   // lower slope
    [  0,   5 ],   // approach the gate
    [  0, -20 ],   // up the paved causeway to Meduseld crown
  ],

  // ─── Lore points ───────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 40 },
      radius: 6,
      text:   '"There stands Meduseld, the house of Éomund\'s son, and it is very great. It seems to me that a light comes from it, as if the sun itself had descended upon the hill."',
      cite:   '— Legolas, The Two Towers, III.6',
    },
    {
      pos:    { x: 0, z: 2 },
      radius: 5,
      text:   '"You must leave your weapons here, old man, and that staff too."',
      cite:   '— Háma, The Two Towers, III.6',
    },
    {
      pos:    { x: 0, z: -8 },
      radius: 5,
      text:   '"I am no weathered fool, Háma. I will not leave my staff. I need it to walk."',
      cite:   '— Gandalf, The Two Towers, III.6',
    },
    {
      pos:    { x: 0, z: -19 },
      radius: 6,
      text:   '"Who is this old man that you bring here? We have enough trouble of our own."',
      cite:   '— Théoden, The Two Towers, III.6',
    },
    {
      pos:    { x: 0, z: -32 },
      radius: 5,
      text:   '"Behold, I am not Gandalf the Grey, whom you betrayed. I am Gandalf the White, who has returned from death."',
      cite:   '— Gandalf, The Two Towers, III.6',
    },
  ],

  // ─── Walkable surfaces ──────────────────────────────────────────────────────
  // Causeway: the paved road rises from gate (z=4, y≈5.3) to crown (z=-20, y≈14.5)
  // Split into two segments to follow the hill curvature better

  walkables: [
    // Lower causeway — gate mouth to mid-hill
    // Centre z = (4 + -10) / 2 = -3,  length = 14
    // yStart at local -Z = z=4:  hillH(0,4)+0.5 ≈ 5.28 (use 5.1 slightly conservative)
    // yEnd   at local +Z = z=-10: hillH(0,-10)+0.5 ≈ 11.6
    { x: 0, z: -3,  yaw: 0, length: 14, width: 4.5, yStart: 5.1, yEnd: 11.6 },

    // Upper causeway — mid-hill to Meduseld threshold
    // Centre z = (-10 + -20) / 2 = -15,  length = 10
    // yStart at local -Z = z=-10: 11.6
    // yEnd   at local +Z = z=-20: 14.5
    { x: 0, z: -15, yaw: 0, length: 10, width: 4.5, yStart: 11.6, yEnd: 14.5 },

    // Meduseld terrace — broad platform at the crown, slightly raised
    // Covers z=-20 to z=-42, flat at y=15.5
    { x: 0, z: -31, yaw: 0, length: 22, width: 22, yStart: 15.5, yEnd: 15.5 },
  ],

  barriers: [],

  // ─── Player start and arrivals ──────────────────────────────────────────────
  start: { x: 0, z: 55, yaw: 0 },   // at +Z end, facing -Z (toward the hill)

  arrivals: {
    fangorn:   { x: 0, z: 60, yaw: 0        },  // arriving from +Z, facing -Z
    helmsdeep: { x: 0, z:-60, yaw: Math.PI  },  // arriving from -Z, facing +Z
  },

  // ─── Boundary and transitions ───────────────────────────────────────────────
  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 72, radius: 8 },
      to: 'fangorn',
    },
    {
      trigger: { x: 0, z: -68, radius: 8 },
      to: 'helmsdeep',
    },
  ],

  // ─── Build scene ────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── Helper materials ────────────────────────────────────────────────────
    const mWood = new THREE.MeshLambertMaterial({ color: 0x5c3e22 });
    const mWoodDark = new THREE.MeshLambertMaterial({ color: 0x3e2812 });
    const mGold = new THREE.MeshLambertMaterial({ color: 0xc8a030, emissive: 0x1a0e00, emissiveIntensity: 0.3 });
    const mGoldRoof = new THREE.MeshLambertMaterial({ color: 0xd4a832, emissive: 0x1a0a00, emissiveIntensity: 0.4 });
    const mThatch = new THREE.MeshLambertMaterial({ color: 0x8a7030 });
    const mStone = MAT.STONE;
    const mStoneDark = MAT.STONE_DARK;
    const mStoneMoss = MAT.STONE_MOSS;
    const mBanner = new THREE.MeshLambertMaterial({ color: 0xb04010, side: THREE.DoubleSide });

    // ── Utility: place a mesh at groundY ──────────────────────────────────
    function place(mesh, x, z, yOff = 0) {
      mesh.position.set(x, groundY(x, z) + yOff, z);
      scene.add(mesh);
      return mesh;
    }

    // ── Palisade wall of Edoras ───────────────────────────────────────────
    // A ring of upright wooden stakes encircling the hilltop, broken only
    // by the gate. Runs in an ellipse approximated as arc segments.

    function addPalisadePost(x, z) {
      const h = 3.8 + Math.random() * 0.5;
      const r = 0.18 + Math.random() * 0.06;
      const geo = new THREE.CylinderGeometry(r * 0.6, r, h, 7);
      const mesh = new THREE.Mesh(geo, mWood);
      mesh.position.set(x, groundY(x, z) + h * 0.5 - h * 0.08, z);
      mesh.rotation.y = Math.random() * 0.3 - 0.15;
      scene.add(mesh);
    }

    // West and east arcs of palisade (excluding gate gap at x≈[-4,4], z≈0)
    const palisadeRx = 11, palisadeRz = 13;
    const postCount = 72;
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      const px = Math.sin(angle) * palisadeRx;
      const pz = Math.cos(angle) * palisadeRz - 10; // centred on (0,-10)
      // Skip gate opening at z≈0 to z≈2, |x|<5
      if (pz > -1 && pz < 3 && Math.abs(px) < 5) continue;
      addPalisadePost(px, pz);
    }

    // ── Gate structure ────────────────────────────────────────────────────
    // Two heavy wooden gate-posts flanking the road, with a crossbeam lintel.
    // The gate doors themselves are heavy wood planks.

    const gateY = groundY(0, 0);

    // Gate posts — left and right
    for (const side of [-1, 1]) {
      const gx = side * 3.0;
      const postH = 5.5;
      const postGeo = new THREE.CylinderGeometry(0.35, 0.42, postH, 9);
      const post = new THREE.Mesh(postGeo, mWood);
      post.position.set(gx, gateY + postH * 0.5 - postH * 0.12, 0);
      scene.add(post);

      // Post cap — small stone block
      const capGeo = new THREE.BoxGeometry(0.9, 0.4, 0.9);
      const cap = new THREE.Mesh(capGeo, mStone);
      cap.position.set(gx, gateY + postH - postH * 0.12 + 0.2, 0);
      scene.add(cap);
    }

    // Lintel beam
    const lintelGeo = new THREE.BoxGeometry(7.0, 0.55, 0.55);
    const lintel = new THREE.Mesh(lintelGeo, mWoodDark);
    lintel.position.set(0, gateY + 5.5 - 5.5 * 0.12 + 0.4, 0);
    scene.add(lintel);

    // Gate door panels (ajar / open inward, flanking the passage)
    for (const side of [-1, 1]) {
      const doorW = 2.6, doorH = 4.5, doorD = 0.22;
      const doorGeo = new THREE.BoxGeometry(doorW, doorH, doorD);
      const door = new THREE.Mesh(doorGeo, mWoodDark);
      door.position.set(side * 2.6, gateY + doorH * 0.5 + 0.3, side * 1.2);
      door.rotation.y = side * Math.PI * 0.22; // open outward at an angle
      scene.add(door);

      // Door plank texture — horizontal boards
      for (let b = -1.5; b <= 1.5; b += 0.75) {
        const plankGeo = new THREE.BoxGeometry(doorW + 0.05, 0.08, doorD + 0.06);
        const plank = new THREE.Mesh(plankGeo, mWood);
        plank.position.set(0, b, 0);
        door.add(plank);
      }
    }

    // Guard towers flanking gate — two squat stone towers
    for (const side of [-1, 1]) {
      const tx = side * 5.5;
      const tz = -1.5;
      const tY = groundY(tx, tz);
      const towerH = 7.0, towerR = 1.6;
      const towerGeo = new THREE.CylinderGeometry(towerR * 0.9, towerR, towerH, 9);
      const tower = new THREE.Mesh(towerGeo, mStone);
      tower.position.set(tx, tY + towerH * 0.5 - towerH * 0.12, tz);
      scene.add(tower);

      // Tower battlements — ring of merlons
      const merCount = 7;
      for (let m = 0; m < merCount; m++) {
        const ma = (m / merCount) * Math.PI * 2;
        const mx = tx + Math.sin(ma) * towerR * 0.85;
        const mz = tz + Math.cos(ma) * towerR * 0.85;
        const merH = 0.8;
        const merGeo = new THREE.BoxGeometry(0.5, merH, 0.5);
        const mer = new THREE.Mesh(merGeo, mStone);
        mer.position.set(mx, tY + towerH - towerH * 0.12 + merH * 0.5, mz);
        scene.add(mer);
      }

      // Torch on tower — guards keep watch
      FX.makeTorch(tx + side * 0.6, tY + towerH - towerH * 0.12 - 0.5, tz, {
        color: 0xff9944,
        intensity: 1.2,
        range: 12,
        castShadow: false,
      });
    }

    // ── Paved causeway — visible stone flagging ───────────────────────────
    // A run of stone-coloured slab meshes up the hill, slightly above terrain
    const slabCount = 14;
    for (let i = 0; i < slabCount; i++) {
      const t = i / (slabCount - 1);
      const sz = 4 - t * 24; // z from +4 to -20
      const sy = groundY(0, sz) + 0.3;
      const slabW = 4.2, slabH = 0.28, slabD = 1.6;
      const slabGeo = new THREE.BoxGeometry(slabW, slabH, slabD);
      const slab = new THREE.Mesh(slabGeo, mStone);
      // Slight random offset to feel hand-laid
      const jx = (Math.random() - 0.5) * 0.3;
      const jy = (Math.random() - 0.5) * 0.08;
      slab.position.set(jx, sy + jy, sz);
      scene.add(slab);
    }

    // Balustrade posts along causeway edges
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const bz = 3 - t * 23;
      for (const side of [-1, 1]) {
        const bx = side * 2.6;
        const by = groundY(bx, bz);
        const bpostH = 1.3;
        const bpostGeo = new THREE.CylinderGeometry(0.1, 0.13, bpostH, 7);
        const bpost = new THREE.Mesh(bpostGeo, mStone);
        bpost.position.set(bx, by + bpostH * 0.5 + 0.3, bz);
        scene.add(bpost);
      }
    }

    // ── Meduseld — The Golden Hall ────────────────────────────────────────
    // Position: centred at (0, -30), on the terrace (y=15.5+ground offset)
    const hallX = 0, hallZ = -30;
    const hallFloor = groundY(hallX, hallZ) + 1.5; // slightly raised plinth

    // Plinth / foundation — a broad low stone platform
    const plinthGeo = new THREE.BoxGeometry(20, 1.5, 32);
    const plinth = new THREE.Mesh(plinthGeo, mStone);
    plinth.position.set(hallX, hallFloor - 0.5, hallZ);
    scene.add(plinth);

    // Hall walls — long rectangular body
    const wallH = 6.0, wallW = 16, wallD = 28;
    const wallGeo = new THREE.BoxGeometry(wallW, wallH, wallD);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8a7458 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(hallX, hallFloor + wallH * 0.5, hallZ);
    scene.add(wall);

    // Corner posts — heavy timber pillars at hall corners
    const cornerPositions = [
      [-7, -16], [7, -16], [-7, -44], [7, -44],
    ];
    for (const [cx, cz] of cornerPositions) {
      const cpH = wallH + 1.5;
      const cpGeo = new THREE.CylinderGeometry(0.5, 0.6, cpH, 9);
      const cp = new THREE.Mesh(cpGeo, mWoodDark);
      cp.position.set(cx, hallFloor + cpH * 0.5, cz);
      scene.add(cp);
    }

    // Roof — a long gabled ridgepole roof, gold-thatched
    // Built as a BoxGeometry tilted to form a ridge shape
    // Approximated by a row of trapezoidal sections

    // Main roof body — wide base, narrow ridge
    const roofBaseW = 19, roofRidgeW = 3, roofH = 5.0, roofD = 30;
    // Build as a custom geometry for the wedge shape
    const roofVertices = new Float32Array([
      // Bottom face (wide)
      -roofBaseW/2, 0,          -roofD/2,
       roofBaseW/2, 0,          -roofD/2,
       roofBaseW/2, 0,           roofD/2,
      -roofBaseW/2, 0,           roofD/2,
      // Top ridge (narrow)
      -roofRidgeW/2, roofH,     -roofD/2,
       roofRidgeW/2, roofH,     -roofD/2,
       roofRidgeW/2, roofH,      roofD/2,
      -roofRidgeW/2, roofH,      roofD/2,
    ]);
    const roofIndices = [
      // South gable
      0, 1, 5, 0, 5, 4,
      // North gable
      3, 7, 6, 3, 6, 2,
      // East slope
      1, 2, 6, 1, 6, 5,
      // West slope
      0, 4, 7, 0, 7, 3,
      // Ridge cap top
      4, 5, 6, 4, 6, 7,
    ];
    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
    roofGeo.setIndex(roofIndices);
    roofGeo.computeVertexNormals();
    const roof = new THREE.Mesh(roofGeo, mGoldRoof);
    roof.position.set(hallX, hallFloor + wallH, hallZ);
    scene.add(roof);

    // Ridgepole — the great beam along the top
    const ridgeGeo = new THREE.CylinderGeometry(0.22, 0.22, roofD + 2, 7);
    ridgeGeo.rotateX(Math.PI / 2);
    const ridge = new THREE.Mesh(ridgeGeo, mWoodDark);
    ridge.position.set(hallX, hallFloor + wallH + roofH + 0.1, hallZ);
    scene.add(ridge);

    // Gable end finials — dragon-head carvings at roof peaks (approximated)
    for (const side of [-1, 1]) {
      const fz = hallZ + side * (roofD / 2 + 0.5);
      const finialGeo = new THREE.SphereGeometry(0.5, 8, 6);
      const finial = new THREE.Mesh(finialGeo, mGold);
      finial.position.set(hallX, hallFloor + wallH + roofH + 0.3, fz);
      scene.add(finial);

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.2, 7);
      const neck = new THREE.Mesh(neckGeo, mGold);
      neck.position.set(hallX, hallFloor + wallH + roofH - 0.4, fz);
      neck.rotation.x = side * Math.PI * 0.15;
      scene.add(neck);
    }

    // ── Meduseld front steps ──────────────────────────────────────────────
    // Three stone steps leading up from terrace to the hall doors
    const doorZ = hallZ + wallD / 2; // front face of hall
    for (let s = 0; s < 3; s++) {
      const stepW = 8 - s * 0.8;
      const stepH = 0.35;
      const stepD = 0.9;
      const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
      const step = new THREE.Mesh(stepGeo, mStone);
      step.position.set(
        hallX,
        hallFloor - stepH * (3 - s) + stepH * 0.5,
        doorZ + (3 - s) * stepD
      );
      scene.add(step);
    }

    // Hall doors — tall heavy wood, slightly ajar
    for (const side of [-1, 1]) {
      const doorW2 = 2.4, doorH2 = 5.0, doorD2 = 0.25;
      const doorGeo2 = new THREE.BoxGeometry(doorW2, doorH2, doorD2);
      const doorMesh = new THREE.Mesh(doorGeo2, mWoodDark);
      doorMesh.position.set(
        hallX + side * 2.5,
        hallFloor + doorH2 * 0.5,
        doorZ + 0.1 + side * 0.4
      );
      doorMesh.rotation.y = side * Math.PI * 0.08; // slightly ajar
      scene.add(doorMesh);

      // Door boss / handle
      const bossGeo = new THREE.SphereGeometry(0.22, 8, 6);
      const boss = new THREE.Mesh(bossGeo, mGold);
      boss.position.set(
        hallX + side * (2.5 - side * 1.0),
        hallFloor + doorH2 * 0.5,
        doorZ + 0.25
      );
      scene.add(boss);
    }

    // ── Hall torches — flanking the front doors ───────────────────────────
    for (const side of [-1, 1]) {
      FX.makeTorch(
        hallX + side * 4.2,
        hallFloor,
        doorZ + 0.3,
        {
          color: 0xffaa44,
          intensity: 1.1,
          range: 14,
          castShadow: true,
        }
      );
    }

    // ── Interior light seeping through doors ──────────────────────────────
    // Warm light emanating from within Meduseld
    const hallLight = new THREE.PointLight(0xffcc66, 1.8, 20);
    hallLight.position.set(hallX, hallFloor + 3, doorZ - 2);
    scene.add(hallLight);

    // ── Banner poles flanking causeway approach ──────────────────────────
    // Horse of Rohan banners — vertical planes

    function addBanner(x, z) {
      const poleH = 7.5;
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, poleH, 7);
      const pole = new THREE.Mesh(poleGeo, mWoodDark);
      const py = groundY(x, z);
      pole.position.set(x, py + poleH * 0.5, z);
      scene.add(pole);

      // Banner cloth
      const bannerW = 1.4, bannerH = 2.2;
      const bannerGeo = new THREE.PlaneGeometry(bannerW, bannerH, 3, 1);
      const banner = new THREE.Mesh(bannerGeo, mBanner);
      banner.position.set(x + bannerW * 0.5, py + poleH - bannerH * 0.5 - 0.3, z);
      scene.add(banner);

      // Gold border strip on banner
      const borderGeo = new THREE.PlaneGeometry(bannerW + 0.08, bannerH + 0.08, 1, 1);
      const borderMat = new THREE.MeshLambertMaterial({ color: 0xd4a800, side: THREE.DoubleSide });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.set(x + bannerW * 0.5, py + poleH - bannerH * 0.5 - 0.3, z - 0.02);
      scene.add(border);
    }

    // Pairs of banners along the causeway approach
    addBanner(-3.8, -6);
    addBanner( 3.8, -6);
    addBanner(-3.8, -13);
    addBanner( 3.8, -13);
    addBanner(-4.5, doorZ + 4);
    addBanner( 4.5, doorZ + 4);

    // ── Surrounding buildings — the town of Edoras ───────────────────────
    // Simple longhouses dotted around the palisade interior

    function addLonghouse(x, z, angle, len, wid) {
      const hy = groundY(x, z);
      const houseH = 3.0;
      const houseGeo = new THREE.BoxGeometry(wid, houseH, len);
      const houseMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
      const house = new THREE.Mesh(houseGeo, houseMat);
      house.position.set(x, hy + houseH * 0.5, z);
      house.rotation.y = angle;
      scene.add(house);

      // Thatch roof (simple box, slightly oversized)
      const roofH2 = 1.6;
      const thatchGeo = new THREE.BoxGeometry(wid + 0.6, roofH2, len + 0.6);
      const thatch = new THREE.Mesh(thatchGeo, mThatch);
      thatch.position.set(x, hy + houseH + roofH2 * 0.5 - 0.1, z);
      thatch.rotation.y = angle;
      scene.add(thatch);
    }

    // Town buildings inside palisade ring
    addLonghouse(-7,  -7,  0.3,  8, 3.5);
    addLonghouse( 7,  -6, -0.2,  7, 3.2);
    addLonghouse(-8, -16,  0.1,  9, 3.8);
    addLonghouse( 8, -15,  0.0,  6, 3.0);
    addLonghouse(-6, -24,  0.4,  7, 3.3);
    addLonghouse( 7, -22, -0.3,  8, 3.5);

    // ── Mounds of the kings (Barrow mounds) on the plain ─────────────────
    // East of the road, the burial mounds of Rohan's kings are visible

    function addMound(x, z, r, h) {
      const my = groundY(x, z);
      const moundGeo = new THREE.SphereGeometry(r, 12, 8);
      const moundMat = new THREE.MeshLambertMaterial({ color: 0x556040 });
      const mound = new THREE.Mesh(moundGeo, moundMat);
      // Flatten by scaling y
      mound.scale.set(1, h / r, 1);
      mound.position.set(x, my + h * 0.45, z);
      scene.add(mound);
    }

    addMound( 25, 30, 5.5, 2.8);
    addMound( 32, 18, 4.2, 2.1);
    addMound( 28,  5, 4.8, 2.4);
    addMound( 22, -5, 3.8, 1.9);
    addMound(-26, 22, 4.5, 2.2);
    addMound(-30, 10, 5.0, 2.5);

    // ── Grass tufts on the plain ──────────────────────────────────────────
    // Clumps of tall golden grass for depth

    for (let i = 0; i < 60; i++) {
      const gx = (Math.random() - 0.5) * 160;
      const gz = Math.random() * 80 + 10; // south plain mostly
      if (Math.abs(gx) < 6 && gz < 60) continue; // avoid road
      const gy = groundY(gx, gz);
      const tH = 0.6 + Math.random() * 0.9;
      const tGeo = new THREE.CylinderGeometry(0.05, 0.12, tH, 5);
      const tMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0.55 + Math.random() * 0.15, 0.48 + Math.random() * 0.1, 0.12),
      });
      const tuft = new THREE.Mesh(tGeo, tMat);
      tuft.position.set(gx, gy + tH * 0.4, gz);
      tuft.rotation.z = (Math.random() - 0.5) * 0.4;
      tuft.rotation.x = (Math.random() - 0.5) * 0.3;
      scene.add(tuft);
    }

    // ── Scattered boulders on hillside ────────────────────────────────────
    for (let i = 0; i < 18; i++) {
      const bx = (Math.random() - 0.5) * 30 + (Math.random() > 0.5 ? 10 : -10);
      const bz = Math.random() * 40 - 25;
      const by = groundY(bx, bz);
      const br = 0.4 + Math.random() * 0.9;
      const bGeo = new THREE.SphereGeometry(br, 10, 7);
      const bMat = Math.random() > 0.4 ? mStone : mStoneDark;
      const boulder = new THREE.Mesh(bGeo, bMat);
      boulder.position.set(bx, by + br * 0.45, bz);
      boulder.rotation.set(
        Math.random() * 0.4,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4
      );
      scene.add(boulder);
    }

    // ── Fangorn side: distant tree-line hint ──────────────────────────────
    // Dark silhouette trees at the far +Z edge suggesting Fangorn behind
    for (let i = 0; i < 22; i++) {
      const tx = (Math.random() - 0.5) * 180;
      const tz = 65 + Math.random() * 12;
      const ty = groundY(tx, tz);
      const treeH = 5 + Math.random() * 7;
      const treeTrunkGeo = new THREE.CylinderGeometry(0.22, 0.38, treeH, 7);
      const treeMat = new THREE.MeshLambertMaterial({ color: 0x2a2015 });
      const trunk = new THREE.Mesh(treeTrunkGeo, treeMat);
      trunk.position.set(tx, ty + treeH * 0.5, tz);
      scene.add(trunk);

      const crownR = 2.0 + Math.random() * 2.5;
      const crownGeo = new THREE.SphereGeometry(crownR, 8, 6);
      const crownMat = new THREE.MeshLambertMaterial({ color: 0x1e2a10 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(tx, ty + treeH + crownR * 0.5, tz);
      scene.add(crown);
    }

    // ── Clouds (static, far plane) ────────────────────────────────────────
    // Simple ellipsoid puffs high in the sky for daytime context
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xf4f0e8,
      transparent: true,
      opacity: 0.82,
    });
    const cloudPositions = [
      [-60, 55, -40], [40, 50, -55], [-30, 60, 20], [70, 48, 30], [-80, 52, 55],
    ];
    for (const [cx, cy, cz] of cloudPositions) {
      const puffCount = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const pr = 5 + Math.random() * 7;
        const pGeo = new THREE.SphereGeometry(pr, 8, 6);
        const puff = new THREE.Mesh(pGeo, cloudMat);
        puff.position.set(
          cx + (Math.random() - 0.5) * 14,
          cy + (Math.random() - 0.5) * 4,
          cz + (Math.random() - 0.5) * 10
        );
        puff.scale.y = 0.45 + Math.random() * 0.2;
        scene.add(puff);
      }
    }

    return { hallLight };
  },

  // ─── onFrame ────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // Gentle pulse on the hall's interior glow — lantern flicker
    if (refs.hallLight) {
      refs.hallLight.intensity = 1.6 + Math.sin(t * 1.7) * 0.12 +
                                       Math.sin(t * 3.1) * 0.06;
    }
  },

};

window.Edoras = Edoras;
