// lothlorien.js — Lothlórien Border (Nimrodel Ford)
// Sequence: moriabridge <-> lothlorien <-> carasgaladhon
// Dusk — warm amber fading to deep indigo at zenith, mist among the mallorns

const Lothlorien = {

  name:     'Lothlórien',
  subtitle: 'The Golden Wood · Ford of Nimrodel',

  // ─── Atmosphere ──────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x3a2d1e,   // warm amber-brown dusk mist
    fogType:          'linear',
    fogNear:          40,
    fogFar:           200,
    skyColor:         0x1a0f06,   // deep amber-brown at horizon darkening to indigo
    ambientColor:     0x2a1f12,
    ambientIntensity: 1.6,
    moonColor:        0xd4783a,   // low dusk sun — deep amber-orange
    moonIntensity:    0.55,
    moonPosition:     { x: 90, y: 28, z: 60 },  // low on the western horizon
    showStars:        false,                       // dusk — stars not yet visible
    extraLights: [
      // Soft indigo fill from the zenith sky
      { color: 0x1a1a3a, intensity: 0.3, x: 0,   y: 120, z: 0    },
      // Warm amber bounce from below-horizon sun
      { color: 0x7a3810, intensity: 0.25, x: 60,  y: -10, z: 40   },
      // Cool blue-violet from the eastern sky (opposite of sunset)
      { color: 0x1a2040, intensity: 0.2,  x: -80, y: 60,  z: -60  },
      // Elven glow from within the wood — soft gold-green
      { color: 0x4a5a18, intensity: 0.18, x: -30, y: 20,  z: -70  },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────────
  // Scene layout along Z axis:
  //   z: +80  moriabridge arrival — high ground, rocky hillside
  //   z: +20  slope levels out, path descends to river
  //   z:   0  Nimrodel river ford (river runs roughly along X)
  //   z: -20  flat bank, entering forest eaves
  //   z: -80  carasgaladhon direction — deeper into the wood
  //
  // X axis: valley walls rise on both sides

  hillHeight(x, z) {
    const fbm    = window.api_fbm;
    const noise  = window.api_noise2d;

    // --- Base slope: descends from +Z (Moria side) toward -Z (Lothlórien)
    // Gentle concave valley — slopes up on both sides
    const slopeFraction = Math.max(-1, Math.min(1, z / 80));
    const baseSlope = slopeFraction * 10.0;  // +10 at z=+80, -10 at z=-80

    // Valley cross-section — walls rise on the X flanks
    const absX       = Math.abs(x);
    const valleyWall = Math.pow(Math.max(0, (absX - 28) / 30), 1.5) * 18;

    // River bed — shallow depression near z=0
    const riverDist  = Math.abs(z - (x * 0.08));   // river meanders slightly
    const riverFord  = riverDist < 8
      ? -2.5 * Math.max(0, 1 - riverDist / 8)
      : 0;

    // Fine terrain noise
    const n1 = fbm(x * 0.06, z * 0.06) * 3.0;
    const n2 = fbm(x * 0.18, z * 0.18) * 0.9;

    // Rock outcrops on the Moria-side slope (z > 20)
    const rockyZone = Math.max(0, (z - 20) / 60);
    const rockNoise = fbm(x * 0.3, z * 0.3) * 4.5 * rockyZone;

    // Flat forest floor on the Lothlórien side (z < -15)
    const forestFlat = Math.max(0, (-z - 15) / 40);
    const forestNoise = fbm(x * 0.12, z * 0.12) * (1.0 - forestFlat * 0.7);

    return baseSlope + valleyWall + riverFord + n1 + n2 * forestNoise
         + rockNoise - 2.0;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Colours: rocky hill, path dirt, ford gravel, forest floor, riverbank mud
    const rockColour   = [0.38, 0.32, 0.24];  // grey-brown rock
    const dirtColour   = [0.32, 0.26, 0.16];  // dark earth path
    const grassColour  = [0.18, 0.22, 0.09];  // deep dusk grass
    const gravelColour = [0.42, 0.38, 0.30];  // river gravel / ford stones
    const mudColour    = [0.22, 0.17, 0.10];  // wet riverbank mud
    const forestColour = [0.10, 0.14, 0.06];  // deep shadowed forest floor
    const mossColour   = [0.16, 0.20, 0.08];  // mossy stones

    const n = noise2d(vx * 0.15, vz * 0.15);
    const n2 = noise2d(vx * 0.4, vz * 0.4);

    // River zone
    const riverDist = Math.abs(vz - (vx * 0.08));
    const inRiver   = Math.max(0, 1 - riverDist / 9);

    // Forest eaves (z < -15)
    const forestFactor = Math.max(0, Math.min(1, (-vz - 15) / 30));

    // Rocky slope (z > 25)
    const rockyFactor  = Math.max(0, Math.min(1, (vz - 20) / 40));

    // Height-based rock / grass blend
    const heightFactor = Math.max(0, Math.min(1, (vy - 2) / 8));

    // Blend rock vs grass by height and slope zone
    let base = [
      lerp(grassColour[0], rockColour[0], heightFactor * 0.7 + rockyFactor * 0.4 + n * 0.15),
      lerp(grassColour[1], rockColour[1], heightFactor * 0.7 + rockyFactor * 0.4 + n * 0.15),
      lerp(grassColour[2], rockColour[2], heightFactor * 0.7 + rockyFactor * 0.4 + n * 0.15),
    ];

    // River gravel / mud
    if (inRiver > 0.05) {
      const gravelBlend = lerp(mudColour, gravelColour, n2);
      base = [
        lerp(base[0], gravelBlend[0], inRiver),
        lerp(base[1], gravelBlend[1], inRiver),
        lerp(base[2], gravelBlend[2], inRiver),
      ];
    }

    // Forest floor darkening
    if (forestFactor > 0) {
      const floorBlend = lerp > 0 ? forestColour : mossColour;  // always forest
      const fc = n > 0.5 ? mossColour : forestColour;
      base = [
        lerp(base[0], fc[0], forestFactor * 0.75),
        lerp(base[1], fc[1], forestFactor * 0.75),
        lerp(base[2], fc[2], forestFactor * 0.75),
      ];
    }

    // Slight warm amber tint everywhere (dusk light)
    base[0] = Math.min(1, base[0] * 1.08);
    base[1] = Math.min(1, base[1] * 0.96);
    base[2] = Math.min(1, base[2] * 0.82);

    return base;
  },

  onPath(x, z) {
    // Path centreline: descends from z=+75 (rocky slope) to z=-75 (forest)
    // Meanders slightly — S-curve through the ford
    const cx =
        z > 30  ?  4.0                                    // straight on rocky slope
      : z > 0   ?  lerp3( 4.0, -2.0, (30 - z) / 30)     // curves left toward ford
      : z > -20 ?  lerp3(-2.0,  2.0, (0  - z) / 20)     // curves back right
      :             2.0;                                   // straight into trees

    function lerp3(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

    const dist = Math.abs(x - cx);
    return Math.max(0, 1 - dist / 2.5);
  },

  // ─── Path waypoints ──────────────────────────────────────────────────────────
  pathWaypoints: [
    [  4,  75 ],   // top of rocky slope, Moria side
    [  4,  50 ],
    [  3,  30 ],   // slope moderates
    [  0,  15 ],   // approach to ford
    [ -2,   0 ],   // ford crossing
    [ -2, -12 ],   // far bank
    [  2, -30 ],   // under first mallorn boughs
    [  2, -55 ],
    [  2, -75 ],   // into the wood, toward Caras Galadhon
  ],

  // ─── Lore points ─────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 48 },
      radius: 6,
      text:   '"Frodo heard, or imagined that he heard, away above the rush and tinkle of the stream, a sound like soft singing."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: -2, z: 2 },
      radius: 5,
      text:   '"Already they had come to the Ford of Nimrodel. The stream was shallow and clear, and sparkled in the starlight."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: -10, z: -22 },
      radius: 5,
      text:   '"Legolas turned and set his foot on a root of the tree... The others followed him, and soon all the Company were upon the bank."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: 5, z: -50 },
      radius: 6,
      text:   '"There were lamps hanging from boughs and glimmering with a pale golden light... In the middle of it there was a great grey mallorn-tree of immense height."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start & arrivals ─────────────────────────────────────────────────
  start: { x: 4, z: 72, yaw: 0 },         // at +Z (south) end, facing north into scene

  arrivals: {
    moriabridge:   { x: 4, z:  72, yaw: 0       },  // arriving from south (+Z), facing north (-Z)
    carasgaladhon: { x: 2, z: -72, yaw: Math.PI },  // arriving from north (-Z), facing south (+Z)
  },

  // ─── Boundary & transitions ───────────────────────────────────────────────────
  boundary: 88,

  transitions: [
    {
      trigger: { x: 4, z: 80, radius: 8 },
      to: 'moriabridge',
    },
    {
      trigger: { x: 2, z: -80, radius: 8 },
      to: 'carasgaladhon',
    },
  ],

  // ─── Walkables ────────────────────────────────────────────────────────────────
  // Ford stepping stones are essentially at terrain level — no elevated walkables needed.
  walkables: [],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  // Valley walls on both sides prevent wandering off the edge of terrain
  barriers: [
    { x:  58, z: 0, w: 20, d: 200, yaw: 0 },  // east valley wall
    { x: -58, z: 0, w: 20, d: 200, yaw: 0 },  // west valley wall
  ],

  // ─── buildScene ──────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    // ── Helpers ────────────────────────────────────────────────────────────────
    function rng(seed) {
      // Simple deterministic pseudo-random from seed
      let s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    }

    function addMesh(geo, mat, x, y, z, sx=1, sy=1, sz=1, ry=0) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.rotation.y = ry;
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ──────────────────────────────────────────────────────────────

    // River water — translucent shallow stream
    const waterMat = new THREE.MeshStandardMaterial({
      color:       0x2a4a38,
      roughness:   0.05,
      metalness:   0.3,
      transparent: true,
      opacity:     0.78,
    });
    // Emissive amber surface shimmer updated in onFrame
    waterMat.emissive    = new THREE.Color(0x1a0c04);
    waterMat.emissiveIntensity = 0.12;

    // Ford stepping stones
    const stoneMat = MAT.STONE;

    // Dark river gravel
    const gravelMat = new THREE.MeshStandardMaterial({
      color:     0x2e2820,
      roughness: 0.95,
      metalness: 0.0,
    });

    // Mallorn bark — silvery-grey
    const mallornBarkMat = new THREE.MeshStandardMaterial({
      color:     0x8a8878,
      roughness: 0.85,
      metalness: 0.05,
    });

    // Mallorn leaves — golden amber (dusk)
    const mallornLeafMat = new THREE.MeshStandardMaterial({
      color:     0xc8841a,
      roughness: 0.9,
      metalness: 0.0,
      emissive:  new THREE.Color(0x3a1f04),
      emissiveIntensity: 0.35,
    });

    // Undergrowth — dark green ferns etc.
    const fernMat = new THREE.MeshStandardMaterial({
      color:     0x1a2a0e,
      roughness: 1.0,
      metalness: 0.0,
      side:      THREE.DoubleSide,
    });

    // Rocky slope stones (Moria side)
    const rockSlabMat = MAT.STONE_DARK;
    const mossMat     = MAT.STONE_MOSS;

    // Elven rope-bridge rope material
    const ropeMat = new THREE.MeshStandardMaterial({
      color:     0x5a4a30,
      roughness: 0.95,
      metalness: 0.0,
    });

    // Mud/earth bank material
    const earthMat = new THREE.MeshStandardMaterial({
      color:     0x2a1f10,
      roughness: 1.0,
      metalness: 0.0,
    });

    // ── River (Nimrodel) ───────────────────────────────────────────────────────
    // River runs roughly along X, meanders with Z = x*0.08
    // We build it as a flat plane tilted to follow terrain, plus depth mesh

    // Main water surface — a gently subdivided plane following the ford
    const riverGeo = new THREE.PlaneGeometry(26, 18, 16, 12);
    riverGeo.rotateX(-Math.PI * 0.5);
    // Warp vertices to follow terrain and river meander
    const rPos = riverGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const rx = rPos.getX(i);
      const rz = rPos.getZ(i) + 0;   // plane is centred at z=0
      const meander = rx * 0.08;
      const gY = groundY(rx, rz + meander);
      rPos.setY(i, gY + 0.18);        // float 18cm above gravel
    }
    rPos.needsUpdate = true;
    riverGeo.computeVertexNormals();
    const riverMesh = new THREE.Mesh(riverGeo, waterMat);
    riverMesh.position.set(0, 0, 0);
    scene.add(riverMesh);

    // Gravel river bed (visible through water)
    const bedGeo = new THREE.PlaneGeometry(24, 16, 8, 6);
    bedGeo.rotateX(-Math.PI * 0.5);
    const bPos = bedGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const bx = bPos.getX(i);
      const bz = bPos.getZ(i);
      bPos.setY(i, groundY(bx, bz) - 0.05);
    }
    bPos.needsUpdate = true;
    bedGeo.computeVertexNormals();
    const bedMesh = new THREE.Mesh(bedGeo, gravelMat);
    scene.add(bedMesh);

    // ── Ford stepping stones ───────────────────────────────────────────────────
    const stoneOffsets = [
      [-5.5, 0.06, -0.44],
      [-3.0, 0.10,  0.24],
      [-0.5, 0.12, -0.16],
      [ 2.0, 0.08,  0.32],
      [ 4.5, 0.14, -0.24],
      [ 7.0, 0.10,  0.10],
    ];
    const stoneGeos = [
      new THREE.SphereGeometry(0.70, 8, 6),
      new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.SphereGeometry(0.65, 8, 6),
    ];
    stoneOffsets.forEach(([sx, sy, sOff], i) => {
      const geo  = stoneGeos[i % stoneGeos.length];
      const sz   = sOff;
      const gy   = groundY(sx, sz);
      const flat = new THREE.Mesh(geo, stoneMat);
      flat.position.set(sx, gy + 0.18, sz);
      flat.scale.set(1.0, 0.38, 0.85);
      flat.rotation.y = rng(i * 7.3) * Math.PI;
      flat.castShadow = true;
      scene.add(flat);
    });

    // ── Rocky slope (Moria side, z: 10 → 80) ─────────────────────────────────
    const slopeRocks = [];
    for (let ri = 0; ri < 55; ri++) {
      const seed = ri * 17.3;
      const rx   = (rng(seed)     - 0.5) * 52;
      const rz   =  rng(seed + 1) * 60 + 12;   // z: 12 → 72
      const r    =  rng(seed + 2) * 1.6 + 0.4;
      const gy   =  groundY(rx, rz);
      const isLarge = r > 1.4;
      const geo  = isLarge
        ? new THREE.SphereGeometry(r, 10, 7)   // large boulders — smooth
        : new THREE.SphereGeometry(r,  8, 6);  // rubble — slightly faceted
      const mat  = rng(seed + 3) > 0.45 ? rockSlabMat : mossMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(rx, gy + r * 0.45, rz);
      mesh.rotation.y    = rng(seed + 4) * Math.PI * 2;
      mesh.rotation.z    = (rng(seed + 5) - 0.5) * 0.4;
      mesh.scale.set(
        1.0 + rng(seed + 6) * 0.3,
        0.7 + rng(seed + 7) * 0.25,
        0.9 + rng(seed + 8) * 0.3
      );
      mesh.castShadow = true;
      scene.add(mesh);
      slopeRocks.push(mesh);
    }

    // Occasional tall rock columns on slope
    const colGeo = new THREE.CylinderGeometry(0.28, 0.45, 3.2, 9);
    for (let ci = 0; ci < 10; ci++) {
      const seed = ci * 31.7 + 100;
      const cx   = (rng(seed) - 0.5) * 44;
      const cz   =  rng(seed + 1) * 55 + 15;
      const h    =  rng(seed + 2) * 2.0 + 1.8;
      const gy   =  groundY(cx, cz);
      const cGeo = new THREE.CylinderGeometry(
        rng(seed + 3) * 0.18 + 0.18,
        rng(seed + 4) * 0.25 + 0.28,
        h, 9
      );
      const mesh = new THREE.Mesh(cGeo, rockSlabMat);
      mesh.position.set(cx, gy + h / 2 - h * 0.25, cz);
      mesh.rotation.y = rng(seed + 5) * Math.PI * 2;
      mesh.castShadow = true;
      scene.add(mesh);
    }

    // ── Riverbank (both sides of ford) ────────────────────────────────────────
    // Small earth bank steps
    for (let bi = 0; bi < 16; bi++) {
      const seed = bi * 23.1 + 200;
      const bx   = (rng(seed) - 0.5) * 22;
      const side = bi < 8 ? 1 : -1;    // near bank (+z) or far bank (-z)
      const bz   = side * (8 + rng(seed + 1) * 5);
      const gy   = groundY(bx, bz);
      const geo  = new THREE.SphereGeometry(rng(seed + 2) * 0.5 + 0.25, 8, 6);
      const mesh = new THREE.Mesh(geo, earthMat);
      mesh.position.set(bx, gy + 0.12, bz);
      mesh.scale.set(1.8, 0.45, 1.4);
      mesh.rotation.y = rng(seed + 3) * Math.PI;
      scene.add(mesh);
    }

    // ── Valley walls ──────────────────────────────────────────────────────────
    // Large boulders and cliff faces on both sides of the valley
    for (let wi = 0; wi < 40; wi++) {
      const seed = wi * 41.1 + 300;
      const side = wi < 20 ? 1 : -1;
      const wx   = side * (35 + rng(seed) * 14);
      const wz   = (rng(seed + 1) - 0.5) * 140;
      const wr   = rng(seed + 2) * 2.8 + 1.0;
      const gy   = groundY(wx, wz);
      const geo  = new THREE.SphereGeometry(wr, 10, 7);
      const mat  = rng(seed + 3) > 0.5 ? rockSlabMat : mossMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx, gy + wr * 0.5, wz);
      mesh.scale.set(1.2, 0.8 + rng(seed + 4) * 0.4, 1.1);
      mesh.rotation.y = rng(seed + 5) * Math.PI * 2;
      mesh.castShadow = true;
      scene.add(mesh);
    }

    // ── Mallorn trees (Lothlórien side, z: -15 → -85) ─────────────────────────
    // Mallorns: tall silver boles, wide canopy, golden leaves at dusk
    const mallornPositions = [
      // First ring of trees at the eaves
      [ -8, -22], [ 9, -24], [-14, -32], [10, -30],
      [  3, -38], [-6, -45], [14, -44],  [-12, -52],
      [ 16, -55], [ 0, -58], [ -4, -65], [18, -62],
      [-18, -68], [ 8, -72], [-10, -78], [20, -75],
      [  2, -80], [-20, -80],
    ];

    const mallornTrunks = [];
    const mallornCanopies = [];

    mallornPositions.forEach(([mx, mz], i) => {
      const seed   = i * 59.3 + 400;
      const height = rng(seed) * 12 + 14;   // 14–26 units tall
      const gy     = groundY(mx, mz);
      const trunkR = rng(seed + 1) * 0.3 + 0.55;

      // Trunk
      const trunkGeo  = new THREE.CylinderGeometry(trunkR * 0.65, trunkR, height, 9);
      const trunkMesh = new THREE.Mesh(trunkGeo, mallornBarkMat);
      trunkMesh.position.set(mx, gy + height / 2 - height * 0.25, mz);
      trunkMesh.rotation.y = rng(seed + 2) * Math.PI * 2;
      trunkMesh.castShadow = true;
      scene.add(trunkMesh);
      mallornTrunks.push(trunkMesh);

      // Canopy — two overlapping sphere-lobes for volume
      const canopyR = rng(seed + 3) * 4 + 5;
      [0, 1].forEach(li => {
        const lOff   = li === 0 ? 0 : (rng(seed + li * 7) - 0.5) * canopyR * 0.6;
        const canGeo = new THREE.SphereGeometry(canopyR * (0.8 + li * 0.15), 10, 7);
        const canopy = new THREE.Mesh(canGeo, mallornLeafMat);
        canopy.position.set(
          mx + lOff,
          gy + height - height * 0.25 + canopyR * 0.55 + li * canopyR * 0.3,
          mz + (rng(seed + li * 11) - 0.5) * canopyR * 0.4
        );
        canopy.scale.set(
          1.0 + rng(seed + li * 13) * 0.25,
          0.7 + rng(seed + li * 17) * 0.15,
          0.9 + rng(seed + li * 19) * 0.2
        );
        canopy.castShadow = true;
        scene.add(canopy);
        mallornCanopies.push(canopy);
      });
    });

    // ── Undergrowth / ferns near tree base ────────────────────────────────────
    for (let fi = 0; fi < 60; fi++) {
      const seed = fi * 13.7 + 500;
      const fx   = (rng(seed) - 0.5) * 42;
      const fz   = -18 - rng(seed + 1) * 58;   // z: -18 to -76
      const gy   = groundY(fx, fz);
      const w    = rng(seed + 2) * 1.5 + 0.8;
      const h    = rng(seed + 3) * 1.2 + 0.5;
      // Fan-shaped fern: two crossed quads
      [0, 1].forEach(qi => {
        const qGeo  = new THREE.PlaneGeometry(w, h);
        const fern  = new THREE.Mesh(qGeo, fernMat);
        fern.position.set(fx, gy + h * 0.45, fz);
        fern.rotation.y = rng(seed + qi * 7) * Math.PI;
        fern.rotation.x = (rng(seed + qi * 11) - 0.3) * 0.4;
        scene.add(fern);
      });
    }

    // ── Nimrodel torch / driftwood markers at ford ────────────────────────────
    // A few small reed-torch stakes mark the ford — soft flickering light source
    const torchPositions = [[-8, -5], [8, 5]];  // one each bank

    const torchLights = [];
    torchPositions.forEach(([tx, tz], i) => {
      const gy   = groundY(tx, tz);

      // Stake
      const stakeGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.8, 7);
      const stake    = new THREE.Mesh(stakeGeo, ropeMat);
      stake.position.set(tx, gy + 0.9, tz);
      scene.add(stake);

      // Torch head glow (geometry)
      const headGeo  = new THREE.SphereGeometry(0.18, 8, 6);
      const headMat  = new THREE.MeshStandardMaterial({
        color:             0xff6010,
        emissive:          new THREE.Color(0xff5500),
        emissiveIntensity: 1.8,
        roughness:         0.9,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(tx, gy + 1.85, tz);
      head.scale.set(1, 1.4, 1);
      scene.add(head);

      // Point light for warm ford glow
      const pLight = new THREE.PointLight(0xff6010, 1.2, 14);
      pLight.position.set(tx, gy + 2.2, tz);
      scene.add(pLight);
      torchLights.push({ light: pLight, head, baseY: gy + 2.2, baseI: 1.2, index: i });
    });

    // ── Elven lantern in the first mallorn ────────────────────────────────────
    // A single hanging lamp in the first mallorn — soft golden glow
    const lanternPos  = { x: -8, y: groundY(-8, -22) + 6.5, z: -22 };
    const lanternGeo  = new THREE.SphereGeometry(0.22, 8, 6);
    const lanternMat  = new THREE.MeshStandardMaterial({
      color:             0xffe0a0,
      emissive:          new THREE.Color(0xffa020),
      emissiveIntensity: 2.2,
      transparent:       true,
      opacity:           0.85,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(lanternPos.x, lanternPos.y, lanternPos.z);
    scene.add(lantern);

    const lanternLight = new THREE.PointLight(0xffe080, 1.8, 28);
    lanternLight.position.copy(lantern.position);
    scene.add(lanternLight);

    // ── Thin hanging rope from lantern ────────────────────────────────────────
    const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 5);
    const rope    = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(lanternPos.x, lanternPos.y + 1.5, lanternPos.z);
    scene.add(rope);

    // ── Dusk sky glow particle sheet ──────────────────────────────────────────
    // Large sprite-like plane far in the +X/+Z direction to suggest sunset glow
    const glowMat = new THREE.MeshBasicMaterial({
      color:       0x7a2a04,
      transparent: true,
      opacity:     0.18,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const glowGeo  = new THREE.PlaneGeometry(160, 70);
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.position.set(80, 30, 50);
    glowPlane.rotation.y = -Math.PI * 0.25;
    scene.add(glowPlane);

    // ── Mist layer over river ─────────────────────────────────────────────────
    const mistMat = new THREE.MeshBasicMaterial({
      color:       0x6a5840,
      transparent: true,
      opacity:     0.10,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const mistGeo  = new THREE.PlaneGeometry(40, 20);
    const mistMesh = new THREE.Mesh(mistGeo, mistMat);
    mistMesh.rotation.x = -Math.PI * 0.5;
    mistMesh.position.set(0, groundY(0, 0) + 0.6, 0);
    scene.add(mistMesh);

    // Deeper forest mist
    const forestMistMat = new THREE.MeshBasicMaterial({
      color:       0x2a3018,
      transparent: true,
      opacity:     0.13,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const forestMistGeo = new THREE.PlaneGeometry(70, 60);
    const forestMist    = new THREE.Mesh(forestMistGeo, forestMistMat);
    forestMist.rotation.x = -Math.PI * 0.5;
    forestMist.position.set(0, groundY(0, -50) + 0.8, -50);
    scene.add(forestMist);

    // ── Return refs for onFrame ───────────────────────────────────────────────
    return {
      torchLights,
      lanternLight,
      lantern,
      lanternMat,
      waterMat,
      mistMesh,
      mistMat,
    };
  },

  // ─── onFrame ─────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    const { torchLights, lanternLight, lantern, lanternMat, waterMat, mistMesh } = refs;

    // Torch flicker — each torch flickers at a different rate and phase
    torchLights.forEach(({ light, head, baseY, baseI, index }) => {
      const phase  = index * 2.37;
      const flicker = 0.82
        + Math.sin(t * 8.1 + phase) * 0.09
        + Math.sin(t * 13.7 + phase * 1.4) * 0.05
        + Math.sin(t * 3.3  + phase * 0.7) * 0.04;
      light.intensity = baseI * flicker;
      light.position.y = baseY + Math.sin(t * 7.0 + phase) * 0.04;
    });

    // Lantern gentle sway (slower, more serene)
    const lanternSway = Math.sin(t * 0.8) * 0.06 + Math.sin(t * 0.34) * 0.03;
    lanternLight.intensity = 1.8 + lanternSway;
    lantern.position.y    += Math.sin(t * 0.8) * 0.001;   // imperceptible bob

    // Water shimmer — animate emissive intensity
    const waterShimmer = 0.10 + Math.sin(t * 1.4) * 0.04 + Math.sin(t * 2.3) * 0.02;
    waterMat.emissiveIntensity = waterShimmer;

    // Mist drift — gentle UV offset illusion via opacity pulse
    const mistPulse = 0.09 + Math.sin(t * 0.22) * 0.015 + Math.sin(t * 0.09) * 0.008;
    mistMesh.material.opacity = mistPulse;
  },

};

window.Lothlorien = Lothlorien;
