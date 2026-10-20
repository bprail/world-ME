// bree.js — Bree
// Sequence: Barrow-downs (west/-X) <-> Bree <-> Weathertop (east/+X)
// Also: Prancing Pony courtyard → PrancingPonyInn (interior)
// Time: Rainy night / overcast

const Bree = {

  name:     'Bree',
  subtitle: 'The Prancing Pony · The Great East Road',

  // ─── Atmosphere ───────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x1a1e1c,       // cold wet grey-green
    fogType:          'linear',
    fogNear:          30,
    fogFar:           110,
    skyColor:         0x0c0f0e,       // overcast dark sky
    ambientColor:     0x1a2018,
    ambientIntensity: 1.6,
    moonColor:        0x4a5e52,       // diffuse overcast glow, no direct moon
    moonIntensity:    0.28,
    moonPosition:     { x: -40, y: 120, z: -80 },
    showStars:        false,          // clouds obscure stars
    extraLights: [
      // soft fill from opposite side — simulates overcast sky bounce
      { color: 0x2a3830, intensity: 0.35, x: 60, y: 60, z: 80 },
      // cold top light, rain-cloud bounce
      { color: 0x3a4840, intensity: 0.25, x: 0, y: 100, z: 0 },
    ],
  },

  // ─── Terrain ──────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Bree-hill: rises to the north (-Z), offset to slight west (-X)
    const hillDx = x + 10;
    const hillDz = z + 30;
    const hillDist = Math.sqrt(hillDx * hillDx + hillDz * hillDz);
    const hill = Math.max(0, 1.0 - hillDist / 55) * 18.0;
    const hillSmooth = hill * hill / 18.0;

    // Rolling Bree-land hills, gentle
    const base = fbm(x * 0.018, z * 0.018) * 3.5
               + fbm(x * 0.042, z * 0.042) * 1.4;

    // The Great East Road — a flat lane running east-west along z≈2
    // Flatten terrain near the road
    const roadDist = Math.abs(z - 2);
    const roadFlat = Math.max(0, 1.0 - roadDist / 7.0);
    const roadY = base * (1 - roadFlat * 0.85) + hillSmooth;

    // Small depression in town centre (settled ground)
    const townDist = Math.sqrt(x * x + Math.max(0, z) * Math.max(0, z));
    const townDip  = Math.max(0, 1.0 - townDist / 28) * 0.8;

    return roadY - townDip + noise(x * 0.11, z * 0.11) * 0.3;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Wet earth base — dark olive-grey
    const wetEarth  = [0.18, 0.20, 0.16];
    // Muddy road
    const mud       = [0.22, 0.19, 0.15];
    // Mossy stone / higher ground
    const stone     = [0.24, 0.26, 0.23];
    // Dark grass
    const grass     = [0.14, 0.22, 0.14];

    const n1 = noise2d(vx * 0.07, vz * 0.07);
    const n2 = noise2d(vx * 0.17, vz * 0.19);

    // Road band
    const roadDist = Math.abs(vz - 2);
    const onRoad   = Math.max(0, 1.0 - roadDist / 8.0);

    // Height-based: higher = stone / grassy hill
    const heightBlend = Math.min(1, Math.max(0, (vy - 2.0) / 10.0));

    let r, g, b;
    // base: wet earth with noise variation
    r = lerp(wetEarth[0], grass[0], n1 * 0.5);
    g = lerp(wetEarth[1], grass[1], n1 * 0.5);
    b = lerp(wetEarth[2], grass[2], n1 * 0.5);

    // road mud blend
    r = lerp(r, mud[0], onRoad * 0.75);
    g = lerp(g, mud[1], onRoad * 0.75);
    b = lerp(b, mud[2], onRoad * 0.75);

    // higher ground → stone
    r = lerp(r, stone[0], heightBlend + n2 * 0.2);
    g = lerp(g, stone[1], heightBlend + n2 * 0.2);
    b = lerp(b, stone[2], heightBlend + n2 * 0.2);

    return [
      Math.min(1, Math.max(0, r)),
      Math.min(1, Math.max(0, g)),
      Math.min(1, Math.max(0, b)),
    ];
  },

  // Path: The Great East Road — runs west-east along z≈2
  onPath(x, z) {
    const dz = Math.abs(z - 2);
    if (dz > 5) return 0;
    return Math.max(0, 1.0 - dz / 2.5);
  },

  pathWaypoints: [
    // from west (barrow-downs side, -X)
    [-72,  2],
    [-55,  2],
    [-38,  3],
    [-22,  2],
    // winds slightly around the Pony courtyard
    [ -8,  3],
    [  0,  2],
    [  8,  1],
    // eastern gate toward Weathertop
    [ 24,  2],
    [ 42,  2],
    [ 58,  2],
    [ 72,  2],
  ],

  // ─── Lore ─────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 0 },
      radius: 7,
      text:   '"At the sign of the Prancing Pony by Barliman Butterbur," said Frodo. "We hear it\'s a good house, and a meeting place for travellers from afar."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: -40, z: 2 },
      radius: 6,
      text:   '"Bree was the chief village of the Bree-land, a small inhabited region, like an island in the empty lands round about."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: -5, z: -22 },
      radius: 6,
      text:   '"On the hill of Bree there were many houses of stone, and round it, under the shelter of the hill, there was a village."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: 40, z: 2 },
      radius: 6,
      text:   '"The Road ran on past Bree, and wound away towards the East, through the lands they had come to call the Wild."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: 12, z: 14 },
      radius: 5,
      text:   '"A dark figure climbed quickly in, and as it did so, it pulled back its hood. In the light of the lanterns it could be seen that the figure was that of a man, lean and dark."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
  ],

  // ─── Player start & arrivals ───────────────────────────────────────────────
  // East-west lane: barrow-downs arrives from -X (west), weathertop from +X (east)
  start: { x: -10, z: 2, yaw: Math.PI * 1.5 }, // at west end, facing +X (east)

  arrivals: {
    barrowdowns:    { x: -68, z:  2, yaw: Math.PI * 1.5 }, // from -X, facing +X
    weathertop:     { x:  68, z:  2, yaw: Math.PI * 0.5 }, // from +X, facing -X
    prancingponyinn:{ x:   4, z: 18, yaw: 0              }, // returning from inn, facing -Z (toward road)
  },

  // ─── Boundary & transitions ────────────────────────────────────────────────
  boundary: 82,

  transitions: [
    {
      trigger: { x: -72, z: 2, radius: 8 },
      to: 'barrowdowns',
    },
    {
      trigger: { x: 72, z: 2, radius: 8 },
      to: 'weathertop',
    },
    {
      // Prancing Pony courtyard — entering from south side of yard
      trigger: { x: 4, z: 8, radius: 7 },
      to: 'prancingponyinn',
    },
  ],

  // ─── Walkable elevated surfaces ───────────────────────────────────────────
  walkables: [
    // Prancing Pony: front steps / raised threshold
    { x: 4,  z: 16, yaw: 0, length: 4,  width: 9,  yStart: 0.6, yEnd: 0.6 },
    // Inn porch / covered stoop
    { x: 4,  z: 19, yaw: 0, length: 3,  width: 9,  yStart: 0.6, yEnd: 0.6 },

    // Stone fence atop the Bree-hill road-cut retaining wall (decorative, walkable ledge)
    { x: -18, z: -8, yaw: Math.PI * 0.5, length: 14, width: 2, yStart: 1.8, yEnd: 1.8 },
  ],

  barriers: [],

  // ─── buildScene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── helpers ──────────────────────────────────────────────────────────────
    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx !== undefined) m.rotation.set(rx, ry, rz);
      if (sx !== undefined) m.scale.set(sx, sy, sz);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    const rng = (() => { let s = 42; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })();

    // ── materials ─────────────────────────────────────────────────────────────
    const matWetStone = new THREE.MeshLambertMaterial({ color: 0x2a2e2b });
    const matDarkStone= new THREE.MeshLambertMaterial({ color: 0x1e2220 });
    const matMossStone= new THREE.MeshLambertMaterial({ color: 0x252e25 });
    const matThatch   = new THREE.MeshLambertMaterial({ color: 0x2e2a1e });
    const matTimber   = new THREE.MeshLambertMaterial({ color: 0x1e1810 });
    const matSignWood = new THREE.MeshLambertMaterial({ color: 0x3a2c18 });
    const matPonySign = new THREE.MeshLambertMaterial({ color: 0x4a3820, emissive: 0x100800, emissiveIntensity: 0.4 });
    const matMud      = new THREE.MeshLambertMaterial({ color: 0x1c1a14 });
    const matCourtyard= new THREE.MeshLambertMaterial({ color: 0x282a26 });
    const matShutter  = new THREE.MeshLambertMaterial({ color: 0x1a1408 });
    const matChimney  = new THREE.MeshLambertMaterial({ color: 0x222422 });
    const matFence    = new THREE.MeshLambertMaterial({ color: 0x201c14 });
    const matGatePost = new THREE.MeshLambertMaterial({ color: 0x2a2622 });
    const matWindow   = new THREE.MeshLambertMaterial({ color: 0x4a3c18, emissive: 0x3a2808, emissiveIntensity: 0.7 });

    // ══════════════════════════════════════════════════════════════════════════
    // BREE-HILL — rocky outcrop rising behind town to the north
    // ══════════════════════════════════════════════════════════════════════════
    const hillBoulders = [
      [-12, -28, 2.2], [-6, -32, 1.8], [-18, -35, 2.6], [-2, -40, 1.4],
      [-22, -42, 2.0], [4, -38, 1.6], [-10, -45, 1.2], [-28, -30, 1.8],
      [-16, -50, 2.8], [8, -44, 1.0], [-32, -38, 1.5], [-8, -55, 1.6],
    ];
    const geoHillBoulder = new THREE.SphereGeometry(1, 10, 7);
    for (const [bx, bz, bs] of hillBoulders) {
      const gy = groundY(bx, bz);
      addMesh(geoHillBoulder, matWetStone, bx, gy + bs * 0.45, bz, 0, rng() * Math.PI, 0, bs, bs * 0.65, bs);
    }

    // Hill retaining-wall cliff face along the north side of town
    for (let i = 0; i < 9; i++) {
      const wx = -28 + i * 7;
      const wz = -12 - rng() * 4;
      const gy = groundY(wx, wz);
      const h  = 2.5 + rng() * 1.5;
      const w  = 3.5 + rng() * 1.5;
      const geoSlab = new THREE.BoxGeometry(w, h, 1.2);
      addMesh(geoSlab, matDarkStone, wx, gy + h * 0.5, wz, 0, rng() * 0.12 - 0.06, 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // THE PRANCING PONY — central inn
    // Position: centred around (4, z≈14-22)
    // ══════════════════════════════════════════════════════════════════════════
    const ponyX = 4;
    const ponyZ = 22;
    const ponyGY = groundY(ponyX, ponyZ);

    // -- Main building body
    // Large two-storey inn
    const geoPonyBody = new THREE.BoxGeometry(14, 6, 9);
    addMesh(geoPonyBody, matWetStone, ponyX, ponyGY + 3.6, ponyZ, 0, 0, 0);

    // Upper storey / gable end (slightly narrower)
    const geoPonyUpper = new THREE.BoxGeometry(14, 3, 8);
    addMesh(geoPonyUpper, matWetStone, ponyX, ponyGY + 8.5, ponyZ, 0, 0, 0);

    // Roof — pitched, runs E-W (long axis along X)
    const geoPonyRoof = new THREE.BoxGeometry(15, 1.2, 5);
    // Ridge beam: long thin box along X, angled
    addMesh(geoPonyRoof, matThatch, ponyX, ponyGY + 11.2, ponyZ, 0.42, 0, 0);
    addMesh(geoPonyRoof, matThatch, ponyX, ponyGY + 11.2, ponyZ, -0.42, 0, 0);

    // Gable peaks (triangular approximated with thin boxes)
    const geoPonyGable = new THREE.BoxGeometry(1.0, 2.2, 5);
    addMesh(geoPonyGable, matTimber, ponyX - 7,  ponyGY + 10.2, ponyZ, 0, 0, 0);
    addMesh(geoPonyGable, matTimber, ponyX + 7,  ponyGY + 10.2, ponyZ, 0, 0, 0);

    // Chimney stacks (two)
    const geoChimney = new THREE.CylinderGeometry(0.5, 0.6, 5, 9);
    addMesh(geoChimney, matChimney, ponyX - 4, ponyGY + 12, ponyZ, 0, 0, 0);
    addMesh(geoChimney, matChimney, ponyX + 3, ponyGY + 12, ponyZ, 0, 0, 0);

    // -- Side wing (east/+X)
    const geoWing = new THREE.BoxGeometry(5, 4.5, 7);
    addMesh(geoWing, matWetStone, ponyX + 9, ponyGY + 2.85, ponyZ + 1, 0, 0, 0);
    const geoWingRoof = new THREE.BoxGeometry(5.5, 0.9, 4);
    addMesh(geoWingRoof, matThatch, ponyX + 9, ponyGY + 5.6, ponyZ + 1, 0.35, 0, 0);
    addMesh(geoWingRoof, matThatch, ponyX + 9, ponyGY + 5.6, ponyZ + 1, -0.35, 0, 0);

    // -- Stable block (west/-X of inn)
    const geoStable = new THREE.BoxGeometry(6, 3.5, 8);
    addMesh(geoStable, matDarkStone, ponyX - 10, ponyGY + 2.25, ponyZ + 1, 0, 0, 0);
    const geoStableRoof = new THREE.BoxGeometry(6.5, 0.8, 5);
    addMesh(geoStableRoof, matThatch, ponyX - 10, ponyGY + 4.2, ponyZ + 1, 0.38, 0, 0);
    addMesh(geoStableRoof, matThatch, ponyX - 10, ponyGY + 4.2, ponyZ + 1, -0.38, 0, 0);

    // -- Timber framing (half-timbered look — horizontal beams)
    const geoBeam = new THREE.BoxGeometry(14.2, 0.25, 0.28);
    for (let row = 0; row < 4; row++) {
      addMesh(geoBeam, matTimber, ponyX, ponyGY + 1.5 + row * 1.5, ponyZ - 4.51, 0, 0, 0);
    }
    const geoBeamV = new THREE.BoxGeometry(0.25, 6, 0.28);
    for (let col = -3; col <= 3; col++) {
      addMesh(geoBeamV, matTimber, ponyX + col * 2, ponyGY + 3.2, ponyZ - 4.51, 0, 0, 0);
    }

    // -- Windows (glowing amber — rain-blurred light inside)
    const geoWin = new THREE.BoxGeometry(1.4, 1.1, 0.15);
    const winPositions = [
      [-4, 2.2], [-1, 2.2], [2, 2.2], [5, 2.2],  // ground floor
      [-4, 5.2], [ 1, 5.2], [4, 5.2],              // upper floor
    ];
    for (const [wx, wy] of winPositions) {
      addMesh(geoWin, matWindow, ponyX + wx, ponyGY + wy, ponyZ - 4.58, 0, 0, 0);
    }
    // Side windows
    addMesh(geoWin, matWindow, ponyX - 7.08, ponyGY + 2.2, ponyZ, 0, Math.PI * 0.5, 0);
    addMesh(geoWin, matWindow, ponyX + 7.08, ponyGY + 2.2, ponyZ, 0, Math.PI * 0.5, 0);

    // -- Porch / front overhang (facing south/-Z toward courtyard)
    const geoPorch = new THREE.BoxGeometry(8, 0.4, 2);
    addMesh(geoPorch, matTimber, ponyX, ponyGY + 4.2, ponyZ - 5.2, 0, 0, 0);
    // Porch posts
    const geoPost = new THREE.CylinderGeometry(0.18, 0.22, 3.8, 9);
    addMesh(geoPost, matTimber, ponyX - 3.5, ponyGY + 2.3, ponyZ - 5.3, 0, 0, 0);
    addMesh(geoPost, matTimber, ponyX,       ponyGY + 2.3, ponyZ - 5.3, 0, 0, 0);
    addMesh(geoPost, matTimber, ponyX + 3.5, ponyGY + 2.3, ponyZ - 5.3, 0, 0, 0);

    // -- Front step slab
    const geoStep = new THREE.BoxGeometry(8.5, 0.5, 1.5);
    addMesh(geoStep, matWetStone, ponyX, ponyGY + 0.65, ponyZ - 5.5, 0, 0, 0);

    // -- Inn sign (hanging beam over door)
    const geoSignBeam = new THREE.BoxGeometry(0.15, 0.15, 3.5);
    addMesh(geoSignBeam, matTimber, ponyX, ponyGY + 5.5, ponyZ - 5.3, 0, 0, 0);
    const geoSignBoard = new THREE.BoxGeometry(2.8, 1.2, 0.18);
    addMesh(geoSignBoard, matPonySign, ponyX, ponyGY + 4.6, ponyZ - 5.3, 0, 0, 0);

    // Torch each side of the inn door
    FX.makeTorch(ponyX - 4.5, groundY(ponyX - 4.5, ponyZ - 5), ponyZ - 5, {
      color: 0xffa040, intensity: 1.1, range: 12, castShadow: true,
    });
    FX.makeTorch(ponyX + 4.5, groundY(ponyX + 4.5, ponyZ - 5), ponyZ - 5, {
      color: 0xffa040, intensity: 1.1, range: 12, castShadow: true,
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PRANCING PONY COURTYARD
    // Open area between inn front and the road, z ≈ 8–16
    // ══════════════════════════════════════════════════════════════════════════

    // Courtyard cobble ground (low flat slabs — rainy/dark)
    const geoYard = new THREE.BoxGeometry(20, 0.25, 11);
    addMesh(geoYard, matCourtyard, ponyX, groundY(ponyX, 11) + 0.12, 11, 0, 0, 0);

    // Courtyard fence / wall (low stone walls on east and west sides)
    // West wall
    const geoYardWall = new THREE.BoxGeometry(0.8, 1.6, 11);
    addMesh(geoYardWall, matWetStone, ponyX - 10, groundY(ponyX - 10, 11) + 1.0, 11, 0, 0, 0);
    // East wall
    addMesh(geoYardWall, matWetStone, ponyX + 10, groundY(ponyX + 10, 11) + 1.0, 11, 0, 0, 0);

    // Gate posts at south end of courtyard (facing the road)
    const geoGatePost = new THREE.CylinderGeometry(0.3, 0.35, 2.2, 9);
    addMesh(geoGatePost, matGatePost, ponyX - 3.5, groundY(ponyX - 3.5, 7.5) + 1.3, 7.5, 0, 0, 0);
    addMesh(geoGatePost, matGatePost, ponyX + 3.5, groundY(ponyX + 3.5, 7.5) + 1.3, 7.5, 0, 0, 0);

    // Lantern on each gate post
    const geoLantern = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    const matLantern  = new THREE.MeshLambertMaterial({ color: 0x8a6020, emissive: 0x7a4800, emissiveIntensity: 0.9 });
    addMesh(geoLantern, matLantern, ponyX - 3.5, groundY(ponyX - 3.5, 7.5) + 2.7, 7.5, 0, 0, 0);
    addMesh(geoLantern, matLantern, ponyX + 3.5, groundY(ponyX + 3.5, 7.5) + 2.7, 7.5, 0, 0, 0);

    // Gate-post fires (small lantern-scale)
    FX.makeFire(ponyX - 3.5, groundY(ponyX - 3.5, 7.5) + 2.7, 7.5, {
      color: 0xffc060, intensity: 1.4, range: 9, flameScale: 0.35, emberCount: 20, castShadow: false,
    });
    FX.makeFire(ponyX + 3.5, groundY(ponyX + 3.5, 7.5) + 2.7, 7.5, {
      color: 0xffc060, intensity: 1.4, range: 9, flameScale: 0.35, emberCount: 20, castShadow: false,
    });

    // Well in the courtyard
    const geoWellBase = new THREE.CylinderGeometry(1.0, 1.1, 0.7, 12);
    const geoWellRim  = new THREE.CylinderGeometry(1.2, 1.0, 0.25, 12);
    const wellGY = groundY(ponyX + 3, 12);
    addMesh(geoWellBase, matMossStone, ponyX + 3, wellGY + 0.55, 12, 0, 0, 0);
    addMesh(geoWellRim,  matMossStone, ponyX + 3, wellGY + 1.0, 12, 0, 0, 0);
    // Well posts and crossbar
    const geoWellPost = new THREE.CylinderGeometry(0.1, 0.12, 1.5, 9);
    addMesh(geoWellPost, matTimber, ponyX + 2.2, wellGY + 1.9, 12, 0, 0, 0);
    addMesh(geoWellPost, matTimber, ponyX + 3.8, wellGY + 1.9, 12, 0, 0, 0);
    const geoWellBar = new THREE.BoxGeometry(1.7, 0.12, 0.12);
    addMesh(geoWellBar, matTimber, ponyX + 3, wellGY + 2.55, 12, 0, 0, 0);

    // Trough for horses
    const geoTrough = new THREE.BoxGeometry(3.5, 0.5, 0.9);
    addMesh(geoTrough, matTimber, ponyX - 5, groundY(ponyX - 5, 12) + 0.55, 12, 0, 0, 0);

    // ══════════════════════════════════════════════════════════════════════════
    // BREE VILLAGE HOUSES — along the road and behind
    // ══════════════════════════════════════════════════════════════════════════

    // House builder helper
    function buildHouse(hx, hz, hw, hd, hh, facing) {
      const hgy = groundY(hx, hz);
      // Body
      const geoH = new THREE.BoxGeometry(hw, hh, hd);
      addMesh(geoH, matWetStone, hx, hgy + hh * 0.5, hz, 0, facing, 0);
      // Roof (pitched)
      const geoR1 = new THREE.BoxGeometry(hw + 0.4, 0.3, hd * 0.65);
      addMesh(geoR1, matThatch, hx, hgy + hh + 0.8, hz, 0.38, facing, 0);
      addMesh(geoR1, matThatch, hx, hgy + hh + 0.8, hz, -0.38, facing, 0);
      // Timber frames
      const geoTF = new THREE.BoxGeometry(hw + 0.05, 0.2, 0.2);
      addMesh(geoTF, matTimber, hx, hgy + hh * 0.33, hz + (facing === 0 ? -hd * 0.5 - 0.1 : 0), 0, facing, 0);
      addMesh(geoTF, matTimber, hx, hgy + hh * 0.66, hz + (facing === 0 ? -hd * 0.5 - 0.1 : 0), 0, facing, 0);
      // Window
      const geoHW = new THREE.BoxGeometry(1.0, 0.8, 0.15);
      const frontZ = facing === 0 ? hz - hd * 0.5 - 0.08 : hz - hd * 0.5;
      addMesh(geoHW, matWindow, hx, hgy + hh * 0.52, frontZ, 0, facing, 0);
      // Small chimney
      const geoHC = new THREE.CylinderGeometry(0.22, 0.28, 2.5, 9);
      addMesh(geoHC, matChimney, hx + hw * 0.28, hgy + hh + 1.2, hz + (facing === 0 ? hd * 0.1 : 0), 0, 0, 0);
    }

    // South side of road (+Z from road, z≈7 to 16)
    buildHouse(-30,  9, 5.5, 4.5, 4.0, 0);
    buildHouse(-22, 10, 4.5, 4.0, 3.5, 0);
    buildHouse(-14,  9, 6.0, 5.0, 4.5, 0);
    buildHouse( 16,  8, 5.0, 4.2, 4.0, 0);
    buildHouse( 24,  9, 4.5, 4.0, 3.5, 0);
    buildHouse( 34,  8, 5.5, 4.5, 4.0, 0);
    buildHouse( 44, 10, 4.0, 4.0, 3.8, 0);

    // North side of road (-Z, z≈-4 to -16)
    buildHouse(-36, -8, 5.0, 4.2, 4.0, 0);
    buildHouse(-26, -9, 4.5, 4.0, 3.5, 0);
    buildHouse(-16,-10, 6.0, 5.0, 4.5, 0);
    buildHouse(  6,-10, 5.5, 4.8, 4.2, 0);
    buildHouse( 18, -9, 5.0, 4.0, 3.8, 0);
    buildHouse( 28, -8, 6.0, 4.5, 4.0, 0);
    buildHouse( 40, -9, 4.5, 4.0, 3.5, 0);
    buildHouse( 50,-10, 5.0, 4.2, 4.2, 0);

    // A few back-lane houses further north toward Bree Hill
    buildHouse(-18,-20, 5.0, 4.0, 3.8, 0);
    buildHouse( -4,-18, 4.5, 4.0, 3.5, 0);
    buildHouse( 12,-20, 5.5, 4.5, 4.0, 0);

    // ══════════════════════════════════════════════════════════════════════════
    // STONE ROAD BOUNDARY — low walls / kerbs along the Great East Road
    // ══════════════════════════════════════════════════════════════════════════
    const geoKerb = new THREE.BoxGeometry(6, 0.4, 0.5);
    for (let kx = -62; kx <= 62; kx += 7) {
      // North kerb
      addMesh(geoKerb, matWetStone, kx, groundY(kx, -3) + 0.3, -3, 0, 0, 0);
      // South kerb
      addMesh(geoKerb, matWetStone, kx, groundY(kx,  7) + 0.3,  7, 0, 0, 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BREE GATE — eastern and western archway/posts
    // ══════════════════════════════════════════════════════════════════════════
    function buildGate(gx) {
      const ggY = groundY(gx, 2);
      // Two tall gate posts
      const geoGP = new THREE.CylinderGeometry(0.5, 0.65, 7, 9);
      addMesh(geoGP, matDarkStone, gx, ggY + 3.8, -1.5, 0, 0, 0);
      addMesh(geoGP, matDarkStone, gx, ggY + 3.8,  5.5, 0, 0, 0);
      // Lintel
      const geoLintel = new THREE.BoxGeometry(1.3, 1.2, 8);
      addMesh(geoLintel, matDarkStone, gx, ggY + 7.5, 2, 0, 0, 0);
      // Cap stones
      const geoCap = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 9);
      addMesh(geoCap, matMossStone, gx, ggY + 8.1, -1.5, 0, 0, 0);
      addMesh(geoCap, matMossStone, gx, ggY + 8.1,  5.5, 0, 0, 0);
      // Torches on gate
      FX.makeTorch(gx, ggY, -1.5, {
        color: 0xffb040, intensity: 0.9, range: 11, castShadow: false,
      });
      FX.makeTorch(gx, ggY,  5.5, {
        color: 0xffb040, intensity: 0.9, range: 11, castShadow: false,
      });
    }
    buildGate(-58);
    buildGate( 58);

    // ══════════════════════════════════════════════════════════════════════════
    // ROAD DETAILS — scattered stones, puddle-flats, boundary posts
    // ══════════════════════════════════════════════════════════════════════════
    const geoRubble = new THREE.SphereGeometry(1, 8, 6);
    const roadRubble = [
      [-45, 5, 0.35], [-32, -2, 0.28], [-10, 6, 0.32], [15, -1, 0.25],
      [30, 5, 0.3], [48, 4, 0.27], [-50, -3, 0.22],
    ];
    for (const [rx, rz, rs] of roadRubble) {
      addMesh(geoRubble, matMossStone, rx, groundY(rx, rz) + rs * 0.45, rz,
        rng()*0.4, rng()*Math.PI, 0, rs, rs*0.6, rs);
    }

    // Fence posts along south side lane
    const geoFencePost = new THREE.CylinderGeometry(0.12, 0.14, 1.2, 9);
    const geoFenceRail = new THREE.BoxGeometry(4.2, 0.1, 0.1);
    for (let fi = -55; fi <= -18; fi += 4) {
      const fgy = groundY(fi, 8.5);
      addMesh(geoFencePost, matFence, fi, fgy + 0.9, 8.5, 0, rng()*0.1, 0);
      if (fi < -18) {
        addMesh(geoFenceRail, matFence, fi + 2, fgy + 1.2, 8.5, 0, 0, 0);
        addMesh(geoFenceRail, matFence, fi + 2, fgy + 0.7, 8.5, 0, 0, 0);
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ATMOSPHERIC DETAILS — rain barrel, carts, barrels
    // ══════════════════════════════════════════════════════════════════════════
    // Rain barrel (beside inn)
    const geoBarrel = new THREE.CylinderGeometry(0.5, 0.55, 1.1, 10);
    addMesh(geoBarrel, matTimber, ponyX - 14.5, groundY(ponyX - 14.5, 18) + 0.65, 18, 0, 0, 0);
    addMesh(geoBarrel, matTimber, ponyX - 14.5, groundY(ponyX - 14.5, 18) + 1.8, 18, 0, 0, 0);
    addMesh(geoBarrel, matTimber, ponyX + 13, groundY(ponyX + 13, 20) + 0.65, 20, 0, 0.3, 0);

    // Stacked barrels near stable
    addMesh(geoBarrel, matTimber, ponyX - 13, groundY(ponyX - 13, 24) + 0.65, 24, 0, 0, 0);
    addMesh(geoBarrel, matTimber, ponyX - 13, groundY(ponyX - 13, 24) + 1.75, 24, 0, 0.4, 0);

    // Cart wheel suggestion
    const geoCartBox = new THREE.BoxGeometry(3.5, 1.0, 1.8);
    addMesh(geoCartBox, matTimber, -38, groundY(-38, 6) + 0.8, 6, 0, 0.15, 0);

    // Milestone at road edge
    const geoMile = new THREE.BoxGeometry(0.4, 1.2, 0.25);
    addMesh(geoMile, matWetStone, -55, groundY(-55, -2.5) + 0.75, -2.5, 0, 0.08, 0);

    // ══════════════════════════════════════════════════════════════════════════
    // CAMPFIRE — a travelling company's fire beside the road
    // ══════════════════════════════════════════════════════════════════════════
    FX.makeFire(-20, groundY(-20, 5) + 0.1, 5, {
      color: 0xff7020, intensity: 2.8, range: 13, flameScale: 0.9,
      emberCount: 60, castShadow: true,
    });

    // A few surrounding stones for the campfire ring
    const geoCampStone = new THREE.SphereGeometry(0.38, 8, 6);
    const campStones = [[0,1.1],[0.7,0.8],[1.0,0],[0.7,-0.8],[0,-1.1],[-0.7,-0.8],[-1.0,0],[-0.7,0.8]];
    for (const [cs, ct] of campStones) {
      addMesh(geoCampStone, matWetStone, -20 + cs, groundY(-20+cs, 5+ct) + 0.22, 5 + ct, 0, rng()*Math.PI, 0, 1, 0.55, 1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LIGHTS — streetside torch pairs along the lane
    // ══════════════════════════════════════════════════════════════════════════
    // Pairs every ~20 units along the road, north and south sides
    const roadTorches = [-40, -20, 20, 40];
    for (const tx of roadTorches) {
      FX.makeTorch(tx, groundY(tx, -3.5), -3.5, {
        color: 0xffa030, intensity: 0.85, range: 10, castShadow: false,
      });
      FX.makeTorch(tx, groundY(tx,  6.5),  6.5, {
        color: 0xffa030, intensity: 0.85, range: 10, castShadow: false,
      });
    }

    // Return refs for onFrame
    return {};
  },

  // ─── onFrame ──────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // FX handles all fire/torch animation automatically.
    // Rain atmosphere is purely visual (fog, palette) — no frame logic needed.
  },
};

window.Bree = Bree;
