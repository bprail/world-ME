// fangorn.js — Fangorn Forest
// Sequence: Eastemnet → Fangorn → Edoras  OR  Fangorn → Entmoot
// Daytime — ancient, dim, primordial forest light

const Fangorn = {

  name:     'Fangorn Forest',
  subtitle:  'The Entwood · Where the Trees Have Long Memories',

  // ─── onLoad ───────────────────────────────────────────────────────────────
  async onLoad() {
    // No async data needed for Fangorn — geometry and lore are self-contained.
    // Placeholder satisfies the contract; engine will await this before buildScene.
  },

  // ─── Atmosphere ──────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x2a3520,
    fogType:          'linear',
    fogNear:          40,
    fogFar:           220,
    skyColor:         0x1a2010,   // deep canopy-filtered green-grey
    ambientColor:     0x2d3a1a,
    ambientIntensity: 1.1,
    moonColor:        0x7a9450,   // pale green shaft of forest light
    moonIntensity:    0.55,
    moonPosition:     { x: 30, y: 120, z: -40 },
    showStars:        false,
    extraLights: [
      // warm amber fill — ancient sunlight filtered through leaves
      { color: 0x7a6030, intensity: 0.35, x: -60, y: 80, z: 30 },
      // cool rim from the east edge of the forest
      { color: 0x405530, intensity: 0.25, x: 80, y: 60, z: -20 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const n2d   = window.api_noise2d;

    // Base rolling forest floor
    let h = fbm(x * 0.03, z * 0.03) * 5.0;

    // Broad undulation
    h += fbm(x * 0.015, z * 0.015) * 8.0;

    // Rocky ledge — raised shelf in the north-west quadrant where the hunters climb
    // centred around (-18, -20)
    const ledgeDx = x + 18;
    const ledgeDz = z + 20;
    const ledgeDist = Math.sqrt(ledgeDx * ledgeDx + ledgeDz * ledgeDz);
    const ledgeRise = Math.max(0, 1.0 - ledgeDist / 22);
    h += ledgeRise * ledgeRise * 14.0;

    // Secondary ridge running south from ledge — eroded spine
    const ridgeLine = Math.abs(x + 18) < 6 ? Math.max(0, (-z - 5) / 30) : 0;
    h += ridgeLine * 3.5 * n2d(x * 0.08, z * 0.08);

    // Gentle bowl at scene centre — the meeting dell
    const dellDist = Math.sqrt(x * x + z * z);
    h -= Math.max(0, 1.0 - dellDist / 18) * 2.5;

    // Roots and undergrowth noise
    h += n2d(x * 0.18, z * 0.18) * 1.2;
    h += fbm(x * 0.07, z * 0.07) * 2.0;

    return h;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const h = vy;
    // Forest floor colours: dark loam, old moss, pale root-paths
    const loam    = [0.14, 0.11, 0.07];
    const moss    = [0.18, 0.22, 0.09];
    const dryMoss = [0.20, 0.17, 0.08];
    const rock    = [0.26, 0.24, 0.20];
    const rootPth = [0.22, 0.19, 0.12];

    const n = noise2d(vx * 0.09, vz * 0.09);
    const n2 = noise2d(vx * 0.21 + 7, vz * 0.21 + 3);

    // Low ground: loam / moss mix
    let col = [
      lerp(loam[0], moss[0], n),
      lerp(loam[1], moss[1], n),
      lerp(loam[2], moss[2], n),
    ];

    // Mid height: dry moss
    if (h > 3.0) {
      const t = Math.min(1, (h - 3.0) / 5.0);
      col = [
        lerp(col[0], dryMoss[0], t),
        lerp(col[1], dryMoss[1], t),
        lerp(col[2], dryMoss[2], t),
      ];
    }

    // High: rock on ledge and ridge
    if (h > 7.0) {
      const t = Math.min(1, (h - 7.0) / 5.0);
      col = [
        lerp(col[0], rock[0], t * n2),
        lerp(col[1], rock[1], t * n2),
        lerp(col[2], rock[2], t * n2),
      ];
    }

    // Root-path tint near scene centre
    const dXZ = Math.sqrt(vx * vx + vz * vz);
    if (dXZ < 25) {
      const pt = Math.max(0, 1 - dXZ / 25) * 0.4 * n2;
      col = [
        lerp(col[0], rootPth[0], pt),
        lerp(col[1], rootPth[1], pt),
        lerp(col[2], rootPth[2], pt),
      ];
    }

    return col;
  },

  onPath(x, z) {
    // The path winds from the south edge (+Z entry from Eastemnet),
    // curves west to the rocky ledge, then forks:
    //   North-west fork → Entmoot exit (-X edge)
    //   North fork      → Edoras exit (-Z edge via gap in trees)
    // We approximate as two overlapping bezier-style strips.

    function distToSegment(px, pz, ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.sqrt((px-ax)**2 + (pz-az)**2);
      let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      return Math.sqrt((px - (ax + t*dx))**2 + (pz - (az + t*dz))**2);
    }

    // Main stem: south entry → dell → ledge foot
    const segments_main = [
      [0, 60],  [0, 38],
      [0, 38],  [-5, 20],
      [-5, 20], [-12, 5],
      [-12, 5], [-16, -10],
    ];

    // Fork A: ledge foot → rocky ledge crown (Gandalf meeting)
    const segments_ledge = [
      [-16, -10], [-18, -20],
      [-18, -20], [-20, -30],
    ];

    // Fork B (from crown): north exit toward Edoras (-Z)
    const segments_edoras = [
      [-20, -30], [-15, -44],
      [-15, -44], [-8, -58],
    ];

    // Fork C (from crown): west exit toward Entmoot (-X edge)
    const segments_entmoot = [
      [-20, -30], [-32, -28],
      [-32, -28], [-50, -22],
      [-50, -22], [-65, -12],
    ];

    const R = 2.5;
    let minD = Infinity;

    for (const [a, b] of [...segments_main, ...segments_ledge, ...segments_edoras, ...segments_entmoot]) {
      // segments stored as paired flat entries above — fix iteration
    }

    // Proper iteration over segment pairs
    const allSegs = [
      ...segments_main,
      ...segments_ledge,
      ...segments_edoras,
      ...segments_entmoot,
    ];
    for (let i = 0; i < allSegs.length; i += 2) {
      const [ax, az] = allSegs[i];
      const [bx, bz] = allSegs[i + 1];
      const d = distToSegment(x, z, ax, az, bx, bz);
      if (d < minD) minD = d;
    }

    return Math.max(0, 1 - minD / R);
  },

  // ─── Path Waypoints ───────────────────────────────────────────────────────
  pathWaypoints: [
    // South entry (Eastemnet)
    [  0,  60],
    [  0,  38],
    [ -5,  20],
    [-12,   5],
    [-16, -10],
    [-18, -20],  // rocky ledge foot
    [-20, -30],  // ledge crown — Gandalf meeting point
    // Fork toward Edoras (north, -Z)
    [-15, -44],
    [ -8, -58],
    // Note: Entmoot fork handled as separate branch; engine shows primary path
  ],

  // ─── Lore ─────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 55 },
      radius: 6,
      text:   '"There are old legends along the Mark of strange beings that dwell in the Entwood. None of our people go there."',
      cite:   '— Éomer, The Two Towers, III.2',
    },
    {
      pos:    { x: -8, z: 30 },
      radius: 5,
      text:   '"The wood was old, and full of rumour. Great trees, bare and silent, stood all about them... they felt the trees were watching them."',
      cite:   '— The Two Towers, III.2',
    },
    {
      pos:    { x: -14, z: 10 },
      radius: 5,
      text:   '"It is a strange thing to meet an Ent these days... we are losing count of our years. We have no time to look for Entwives."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: -20, z: -18 },
      radius: 6,
      text:   '"Then suddenly... they saw, standing beside a large grey stone, an old man. He was stooped, leaning on a staff... his cloak was white."',
      cite:   '— The Two Towers, III.5',
    },
    {
      pos:    { x: -20, z: -34 },
      radius: 5,
      text:   '"I am Gandalf the White; and I return to you now at the turn of the tide."',
      cite:   '— Gandalf, The Two Towers, III.5',
    },
    {
      pos:    { x: -44, z: -26 },
      radius: 6,
      text:   '"We must go to Entmoot... It is a gathering of Ents — which does not often happen; it has not happened in many a long year."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: -10, z: -50 },
      radius: 5,
      text:   '"Ride then to Edoras and the halls of Théoden... for time presses. Let us come to Meduseld."',
      cite:   '— Gandalf, The Two Towers, III.5',
    },
  ],

  // ─── Start and Arrivals ───────────────────────────────────────────────────
  start: { x: 0, z: 55, yaw: 0 }, // at +Z end, facing -Z into forest

  arrivals: {
    eastemnet: { x: 0,   z:  60, yaw: 0           }, // arriving from +Z, facing -Z
    edoras:    { x: -8,  z: -60, yaw: Math.PI      }, // arriving from -Z, facing +Z
    entmoot:   { x: -65, z: -15, yaw: Math.PI * 1.5 }, // arriving from -X, facing +X
  },

  // ─── Boundary and Transitions ─────────────────────────────────────────────
  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 72, radius: 8 },
      to: 'eastemnet',
    },
    {
      trigger: { x: -8, z: -70, radius: 8 },
      to: 'edoras',
    },
    {
      trigger: { x: -72, z: -15, radius: 8 },
      to: 'entmoot',
    },
  ],

  // ─── Walkables — Rocky Ledge ─────────────────────────────────────────────
  walkables: [
    // South approach ramp — rises from forest floor up to ledge foot
    { x: -17, z:  -5, yaw: 0, length: 10, width: 5.0, yStart: 2.0, yEnd: 5.5 },
    // Ledge mid-shelf — wider flat area
    { x: -18, z: -15, yaw: 0, length:  8, width: 6.5, yStart: 5.5, yEnd: 7.5 },
    // Ledge crown — broad flat area where Gandalf stands
    { x: -19, z: -27, yaw: 0, length: 14, width: 8.0, yStart: 7.5, yEnd: 7.5 },
    // West descent off ledge crown toward Entmoot path
    { x: -27, z: -30, yaw: Math.PI * 0.5, length: 12, width: 5.0, yStart: 7.5, yEnd: 3.5 },
    // North ramp off crown toward Edoras path
    { x: -18, z: -38, yaw: 0, length:  8, width: 5.0, yStart: 7.5, yEnd: 2.5 },
  ],

  // ─── Barriers ─────────────────────────────────────────────────────────────
  barriers: [
    // Cliff face east of ledge — sheer drop
    { x: -8,  z: -22, w: 10, d: 30, yaw: 0 },
    // Cliff face north of ledge crown — prevents walking off back
    { x: -19, z: -48, w: 20, d:  8, yaw: 0 },
  ],

  // ─── Build Scene ──────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {
    const refs = {};

    // ── Helpers ──────────────────────────────────────────────────────────────
    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      if (sx) m.scale.set(sx, sy || sx, sz || sx);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Shared materials ──────────────────────────────────────────────────────
    const matBark = new THREE.MeshLambertMaterial({ color: 0x1e1508 });
    const matBarkOld = new THREE.MeshLambertMaterial({ color: 0x2a1e0a });
    const matMoss = new THREE.MeshLambertMaterial({ color: 0x2e3c14 });
    const matLeaf = new THREE.MeshLambertMaterial({
      color: 0x2a4010,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    const matLeafGold = new THREE.MeshLambertMaterial({
      color: 0x4a4010,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });
    const matRock = MAT.STONE_DARK;
    const matRockMoss = MAT.STONE_MOSS;
    const matRootLight = new THREE.MeshLambertMaterial({ color: 0x3a2e18 });

    // ── Tree factory ──────────────────────────────────────────────────────────
    // Ancient Fangorn trees: gnarled trunks, sparse dark canopies
    function makeTree(x, z, scale, variant) {
      const gy = groundY(x, z);

      // Trunk — CylinderGeometry, tapered
      const trunkH = (12 + Math.random() * 8) * scale;
      const rBot   = (0.55 + Math.random() * 0.35) * scale;
      const rTop   = rBot * (0.35 + Math.random() * 0.2);
      const trunkGeo = new THREE.CylinderGeometry(rTop, rBot, trunkH, 9);
      const trunkMat = variant === 1 ? matBarkOld : matBark;
      const trunk = addMesh(trunkGeo, trunkMat, x, gy + trunkH * 0.5 - trunkH * 0.1, z);
      trunk.rotation.set(
        (Math.random() - 0.5) * 0.08,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.06,
      );

      // Surface roots — 3–4 flared root spurs
      const nRoots = 3 + Math.floor(Math.random() * 2);
      for (let r = 0; r < nRoots; r++) {
        const angle = (r / nRoots) * Math.PI * 2 + Math.random() * 0.4;
        const rx2 = x + Math.cos(angle) * rBot * 2.2;
        const rz2 = z + Math.sin(angle) * rBot * 2.2;
        const rgy = groundY(rx2, rz2);
        const rootH = 1.2 * scale;
        const rootGeo = new THREE.CylinderGeometry(rBot * 0.15, rBot * 0.55, rootH, 7);
        const rm = new THREE.Mesh(rootGeo, matRootLight);
        rm.position.set(rx2, rgy + rootH * 0.3, rz2);
        rm.rotation.set(
          Math.cos(angle) * 0.4,
          0,
          Math.sin(angle) * 0.4,
        );
        rm.receiveShadow = true;
        scene.add(rm);
      }

      // Canopy — 2–3 dark cloud spheres
      const nClouds = 2 + (variant === 2 ? 1 : 0);
      const leafMat = Math.random() < 0.3 ? matLeafGold : matLeaf;
      for (let c = 0; c < nClouds; c++) {
        const cr = (2.0 + Math.random() * 2.0) * scale;
        const cx = x + (Math.random() - 0.5) * cr * 0.9;
        const cz2 = z + (Math.random() - 0.5) * cr * 0.9;
        const cy = gy + trunkH * (0.65 + c * 0.18 + Math.random() * 0.12);
        const cGeo = new THREE.SphereGeometry(cr, 10, 7);
        const cm = new THREE.Mesh(cGeo, leafMat);
        cm.position.set(cx, cy, cz2);
        cm.scale.set(1, 0.55 + Math.random() * 0.3, 1);
        cm.castShadow = true;
        scene.add(cm);
      }
    }

    // ── Scatter trees across the scene ───────────────────────────────────────
    // Dense outer ring, sparser in the central dell and on the ledge
    const treePositions = [
      // South grove — entering the forest
      [ -8,  52, 1.1, 0], [ 7,  48, 1.0, 1], [-14,  46, 0.9, 2],
      [ 12,  42, 1.2, 0], [-4,  40, 1.0, 1], [ 16,  36, 0.85, 0],
      [-20,  38, 1.1, 2], [ 20,  30, 0.95, 0],
      // Mid forest — either side of path
      [ 14,  18, 1.1, 1], [-22,  22, 1.2, 2], [ 18,   8, 1.0, 0],
      [-26,  12, 1.0, 1], [ 22,   0, 1.1, 2], [ 10,  -5, 0.9, 0],
      // East and west deep trees
      [ 32,  25, 1.3, 2], [-34,  28, 1.2, 0], [ 36,   5, 1.1, 1],
      [-38,   8, 1.3, 2], [ 34, -18, 1.0, 0], [-35, -15, 1.1, 1],
      // Behind ledge — north quadrant
      [-32, -40, 1.2, 2], [-10, -48, 1.1, 0], [ 5,  -40, 1.0, 1],
      [-22, -55, 1.3, 2], [ 12, -52, 1.0, 0],
      // North-west: Entmoot path trees
      [-50,   0, 1.2, 1], [-58, -10, 1.1, 2], [-62, -22, 1.0, 0],
      [-46, -30, 1.1, 1], [-40, -40, 1.0, 2],
      // Fill
      [ 28,  42, 0.9, 0], [-28,  44, 1.0, 1], [ 25,  -8, 1.0, 2],
      [-5,  -30, 0.9, 0], [ 18, -35, 1.0, 1],
    ];

    for (const [tx, tz, sc, va] of treePositions) {
      makeTree(tx, tz, sc, va);
    }

    // ── Rocky ledge geometry ─────────────────────────────────────────────────
    // The hunters climb this shelf to find Gandalf.
    // Match the walkable footprint centred ~(-18 to -20, -15 to -34)

    // Main ledge face — large flat-topped rock mass
    const ledgeFaceGeo = new THREE.BoxGeometry(16, 10, 6);
    addMesh(ledgeFaceGeo, matRock, -15, groundY(-15, -17) + 11, -17);

    // Ledge crown slabs
    const crownGeo1 = new THREE.BoxGeometry(18, 1.5, 16);
    addMesh(crownGeo1, matRockMoss, -19, groundY(-19, -27) + 8.2, -27);

    const crownGeo2 = new THREE.BoxGeometry(10, 1.0, 8);
    addMesh(crownGeo2, matRockMoss, -14, groundY(-14, -24) + 7.8, -24);

    // Flanking boulders on ledge
    const b1 = new THREE.SphereGeometry(2.8, 10, 7);
    addMesh(b1, matRock, -26, groundY(-26, -28) + 2.8 * 0.45, -28);

    const b2 = new THREE.SphereGeometry(2.1, 10, 7);
    addMesh(b2, matRockMoss, -12, groundY(-12, -30) + 2.1 * 0.45, -30);

    const b3 = new THREE.SphereGeometry(1.6, 8, 6);
    addMesh(b3, matRock, -24, groundY(-24, -22) + 1.6 * 0.45, -22);

    // Cliff face — sheer east face of ledge
    const cliffGeo = new THREE.BoxGeometry(3, 12, 28);
    addMesh(cliffGeo, matRock, -7, groundY(-7, -22) + 7, -22,
      0, 0, 0.08); // slight lean

    // Rubble at base of cliff
    const rubbleData = [
      [-5, -12, 1.1], [-3, -16, 0.8], [-8, -10, 0.9],
      [-6, -26, 1.2], [-4, -30, 0.7], [-7, -32, 1.0],
    ];
    for (const [rx2, rz2, rs] of rubbleData) {
      const rg = new THREE.SphereGeometry(rs, 8, 6);
      addMesh(rg, matRock, rx2, groundY(rx2, rz2) + rs * 0.45, rz2);
    }

    // ── Gandalf's stone — large pale grey rock on the crown ───────────────────
    const gandalfStoneGeo = new THREE.SphereGeometry(1.4, 10, 7);
    const matPaleRock = new THREE.MeshLambertMaterial({ color: 0x7a7870 });
    addMesh(gandalfStoneGeo, matPaleRock, -18, groundY(-18, -27) + 9.1, -27);

    // A second companion stone beside it
    const gs2 = new THREE.SphereGeometry(0.9, 10, 7);
    addMesh(gs2, matPaleRock, -21, groundY(-21, -26) + 8.9, -26);

    // ── Ancient standing stones / huorn sentinels ─────────────────────────────
    // Tall thin pillars — remnants or sleeping Huorns, scattered through the forest
    const huornData = [
      [ 18,  22, 0.4, 7.0, 0.3],
      [-26,  15, 0.35, 8.5, 0.28],
      [ 22, -10, 0.38, 6.5, 0.32],
      [-32,   2, 0.3,  7.5, 0.25],
      [-40, -34, 0.42, 9.0, 0.35],
      [  8, -44, 0.36, 7.0, 0.3 ],
    ];
    for (const [hx, hz, rT, h, rB] of huornData) {
      const hGeo = new THREE.CylinderGeometry(rT, rB, h, 9);
      addMesh(hGeo, matBarkOld, hx, groundY(hx, hz) + h * 0.5 - h * 0.25, hz);
    }

    // ── Fallen ancient tree trunk ─────────────────────────────────────────────
    // Across the path south of the ledge — the hunters scramble over it
    const logGeo = new THREE.CylinderGeometry(0.6, 0.75, 14, 9);
    const log = new THREE.Mesh(logGeo, matBark);
    log.position.set(-8, groundY(-8, 0) + 0.5, 0);
    log.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.15); // lying flat, diagonal
    log.castShadow = true;
    log.receiveShadow = true;
    scene.add(log);

    // Moss on log
    const logMossGeo = new THREE.CylinderGeometry(0.65, 0.8, 8, 9);
    const logMoss = new THREE.Mesh(logMossGeo, matMoss);
    logMoss.position.set(-6, groundY(-6, 0) + 0.52, 0.5);
    logMoss.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.15);
    scene.add(logMoss);

    // ── Root mounds and undergrowth ───────────────────────────────────────────
    const rootMoundData = [
      [ 6,  44, 2.5], [-10, 36, 2.0], [ 14, 26, 1.8],
      [-18, 18, 2.2], [ 20, 10, 1.6], [-24,  4, 2.0],
      [  2, -8, 1.9], [ 16,-20, 1.7], [-10,-38, 2.1],
      [ 26, 36, 1.5], [-36, 20, 2.0], [ 30,-24, 1.8],
    ];
    for (const [mx2, mz, mr] of rootMoundData) {
      const mg = new THREE.SphereGeometry(mr, 8, 6);
      addMesh(mg, matMoss, mx2, groundY(mx2, mz) + mr * 0.3, mz,
        0, Math.random() * Math.PI, 0, 1, 0.45, 1);
    }

    // ── Scattered boulders ────────────────────────────────────────────────────
    const boulderData = [
      [ 10,  32, 1.8], [-16,  28, 2.1], [ 24,  14, 1.5],
      [-30, -10, 2.4], [ 12, -32, 1.9], [-8,  -18, 1.3],
      [ 32,  -8, 2.0], [-44, -18, 1.7], [ 20, -48, 2.2],
      [-12, -50, 1.5], [ 4,  -60, 1.8],
    ];
    for (const [bx2, bz, bs] of boulderData) {
      const bg = new THREE.SphereGeometry(bs, 10, 7);
      const bm = Math.random() < 0.4 ? matRockMoss : matRock;
      addMesh(bg, bm, bx2, groundY(bx2, bz) + bs * 0.45, bz);
    }

    // ── A fire — Gandalf's quiet warmth on the ledge crown ────────────────────
    // Small, controlled — the White Wizard needs no great fire
    FX.makeFire(-19, groundY(-19, -29) + 8.3, -29, {
      color:      0xffcc66,
      intensity:  2.2,
      range:      12,
      flameScale: 0.6,
      emberCount: 40,
      emberSize:  0.06,
      castShadow: true,
    });

    // ── Torches flanking the south path entry ─────────────────────────────────
    // Ancient posts — perhaps placed by Rangers long ago
    FX.makeTorch( 4, groundY( 4, 50), 50, { color: 0xffaa44, intensity: 1.0, range: 9 });
    FX.makeTorch(-4, groundY(-4, 50), 50, { color: 0xffaa44, intensity: 1.0, range: 9 });

    return refs;
  },

  // ─── onFrame ──────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // FX fires/torches are engine-managed.
    // No additional per-frame logic needed for this location.
  },
};

window.Fangorn = Fangorn;
