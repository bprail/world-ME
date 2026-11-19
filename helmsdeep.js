// helmsdeep.js — Helm's Deep · The Deeping Wall
// Sequence: Edoras <-> Helm's Deep <-> Inner Keep
// Night scene. Player walks the battlements of the Deeping Wall
// as the host of Saruman assaults from the south (+Z).

const HelmsDeep = {
  name:     "Helm's Deep",
  subtitle: "The Deeping Wall · Battle of the Hornburg",

  // ─── Atmosphere ──────────────────────────────────────────────
  atmosphere: {
    fogColor:        0x05080d,
    fogDensity:      0.011,
    fogType:         'exponential',
    skyColor:        0x020408,
    ambientColor:    0x060810,
    ambientIntensity: 1.2,
    moonColor:       0x3a4a6a,
    moonIntensity:   0.3,
    moonPosition:    { x: -60, y: 90, z: -80 },
    showStars:       true,
    extraLights: [
      // Faint red-orange glow from burning siege works far south
      { color: 0x4a1800, intensity: 0.25, x: 0, y: -10, z: 120 },
      // Rim light from moon on fortress rock
      { color: 0x2a3a55, intensity: 0.18, x: 80, y: 60, z: -20 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────
  // The ground south of the wall is the approach (Deeping-coomb floor).
  // North of the wall (behind it) is the Deep — rocky, rising gorge.
  // The wall itself is built geometry, not terrain.
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // South of wall (z > 8): flat approach, slight slope, muddy battlefield
    if (z > 8) {
      const base  = -3.0 + (z - 8) * 0.04;          // very gentle southward descent
      const rough = fbm(x * 0.07, z * 0.07) * 1.2;
      return base + rough;
    }

    // The wall zone (−8 < z < 8): suppress terrain — wall sits on flat base
    if (z > -8) {
      const t = (z + 8) / 16;  // 0 at z=−8, 1 at z=8
      const southH = -3.0 + fbm(x * 0.07, 8 * 0.07) * 1.2;
      const northH =  0.5 + fbm(x * 0.07, -8 * 0.07) * 0.6;
      return southH * t + northH * (1 - t);
    }

    // North of wall (z < −8): the Deep — rocky floor, rises toward gorge
    const gorgeRise = Math.max(0, (-z - 8) * 0.12);
    const rock = noise(x * 0.09, z * 0.09) * 2.5;
    const fbmR = fbm(x * 0.05, z * 0.05) * 1.8;
    // Hornburg rock mass on west side (+X direction is east, so -X is west)
    // The rock is to the WEST = negative X
    const hornburgBulge = Math.max(0, 1.0 - (Math.sqrt((x + 55) ** 2 + z ** 2)) / 30) * 20;
    return 0.5 + gorgeRise + rock + fbmR + hornburgBulge;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // South of wall: churned muddy earth, some pale stone
    if (vz > 8) {
      const mud   = noise2d(vx * 0.1, vz * 0.1);
      const stone = noise2d(vx * 0.17, vz * 0.17 + 5);
      const r = lerp(0.18, 0.28, mud) + stone * 0.06;
      const g = lerp(0.14, 0.20, mud) + stone * 0.04;
      const b = lerp(0.09, 0.14, mud) + stone * 0.03;
      return [r, g, b];
    }
    // North: grey limestone, dark moss in crevices
    const n = noise2d(vx * 0.08, vz * 0.08);
    const m = noise2d(vx * 0.2, vz * 0.2 + 10);
    const r = lerp(0.18, 0.30, n) + m * 0.03;
    const g = lerp(0.19, 0.31, n) + m * 0.04;
    const b = lerp(0.20, 0.32, n) + m * 0.03;
    return [r, g, b];
  },

  onPath(x, z) { return 0; },   // no path ribbon — battlements replace it

  // ─── Path waypoints ──────────────────────────────────────────
  // No cross-terrain path; player walks the wall itself.
  pathWaypoints: [],

  // ─── Lore ────────────────────────────────────────────────────
  lorePoints: [
    {
      pos: { x: 0, z: -2 },   // centre of the wall top — the parapet walk
      radius: 6,
      text: '"There is ever this choice," said Aragorn. "But tonight I would not have it said of us that we waited in the Dark, until the end came there in the Deep. Let us go forth and meet our enemies."',
      cite: '— Aragorn, The Two Towers, III.7',
    },
    {
      pos: { x: -18, z: -2 },  // west end, near Hornburg stair
      radius: 5,
      text: '"When dawn comes, I will bid them sound the Helm\'s horn, and I will ride forth. Will you ride with me then, son of Arathorn? Maybe we shall cleave a road, or make such an end as will be worth a song—if any be left to sing of us hereafter."',
      cite: '— Théoden, The Two Towers, III.7',
    },
    {
      pos: { x: 18, z: -2 },   // east end of wall
      radius: 5,
      text: '"But I spoke of death," said Éowyn. "I shall look on your going with grief; but it heartens me to think that you go, since you said, that the Dark Lord\'s arm grows long."',
      cite: '— The Two Towers, III.6',
    },
    {
      pos: { x: 0, z: 2 },     // south face of wall, near the culvert
      radius: 5,
      text: 'At the base of the wall ran the culvert through which the Deeping-stream poured. It was the one weakness in the stone — and the enemy found it. There came a great flash, and a roar as of thunder: a column of smoke and flame leaped up into the sky.',
      cite: '— The Two Towers, III.7',
    },
    {
      pos: { x: 0, z: -30 },   // inside the Deep, behind the wall
      radius: 7,
      text: '"Look to my coming, at first light, on the fifth day. At dawn look to the East."',
      cite: '— Gandalf, The Two Towers, III.6',
    },
    {
      pos: { x: -38, z: -18 }, // near the Hornburg steps
      radius: 5,
      text: 'From the Hornburg came the sound of a great horn. The echoes rang and rolled in the valley. The host of Saruman quailed and many wavered and turned back.',
      cite: '— The Two Towers, III.7',
    },
  ],

  // ─── Start and arrivals ──────────────────────────────────────
  start: { x: 0, z: -5, yaw: Math.PI },   // on wall top, facing +Z (south, toward the host)

  arrivals: {
    edoras:    { x: 0,   z: 60, yaw: 0          },  // arriving from +Z, facing -Z (into the Deep)
    innerkeep: { x: -30, z: -55, yaw: Math.PI*1.5 }, // arriving from inner keep, facing +X (east along wall)
  },

  // ─── Boundary and transitions ────────────────────────────────
  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 75, radius: 8 },   // south, back toward Edoras
      to: 'edoras',
    },
    {
      trigger: { x: -40, z: -65, radius: 8 }, // northwest, through the Hornburg gate to inner keep
      to: 'innerkeep',
    },
  ],

  // ─── Walkables — the Deeping Wall battlement walk ────────────
  // Wall runs east–west (along X). The walkable top is ~7.5 units high.
  // Three segments to give a slight arch and cover the full 70-unit span.
  walkables: [
    // Main battlement walk — full east-west span
    { x:  0,  z: -1, yaw: Math.PI*0.5, length: 72, width: 4.5, yStart: 7.5, yEnd: 7.5 },
    // West stair — rises from ground to wall top, near Hornburg rock
    { x: -32, z:  4, yaw: 0,           length: 10, width: 3.5, yStart: 0.5, yEnd: 7.5 },
    // East stair — mirror on east cliff side
    { x:  32, z:  4, yaw: 0,           length: 10, width: 3.5, yStart: 0.5, yEnd: 7.5 },
  ],

  // ─── Barriers — keep player off the cliff edges and chasm ────
  barriers: [
    // South of the wall — the approach below; don't let player fall off south face
    { x:  0, z: 14, w: 100, d: 10, yaw: 0 },
    // East cliff face
    { x: 44, z: -10, w: 10, d: 80, yaw: 0 },
    // West — solid Hornburg rock mass
    { x: -52, z: -10, w: 14, d: 80, yaw: 0 },
    // Far north — gorge narrows and blocks passage
    { x:  0, z: -72, w: 100, d: 10, yaw: 0 },
  ],

  // ─── buildScene ──────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    const stoneMat     = MAT.STONE;
    const stoneDarkMat = MAT.STONE_DARK;
    const stoneMossMat = MAT.STONE_MOSS;

    // ── Helper: add mesh to scene
    const add = (geo, mat, x, y, z, rx, ry, rz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. THE DEEPING WALL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Main wall body — 70 units wide, 10 high, 5 deep
    // Runs east-west centred at x=0, z=0
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3c, side: THREE.DoubleSide });
    const wallGeo = new THREE.BoxGeometry(72, 10, 5);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 2.5, 0);  // base at y≈−2.5, top at y≈7.5
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    // Wall cap / walkway surface
    const capMat = new THREE.MeshLambertMaterial({ color: 0x484848 });
    const capGeo = new THREE.BoxGeometry(72, 0.4, 5.4);
    add(capGeo, capMat, 0, 7.7, 0);

    // ── Merlons (battlements) — south-facing, 10 merlons with gaps
    const merlonMat = new THREE.MeshLambertMaterial({ color: 0x3c3c3f });
    for (let i = -5; i <= 5; i++) {
      const mx = i * 6.5;
      if (Math.abs(mx) > 34) continue; // don't overshoot wall ends
      // Merlon block
      const mg = new THREE.BoxGeometry(3.0, 2.2, 1.0);
      add(mg, merlonMat, mx, 8.8, -2.0);  // south face
    }
    // North-face merlons (rear parapet)
    for (let i = -5; i <= 5; i++) {
      const mx = i * 6.5;
      if (Math.abs(mx) > 34) continue;
      const mg = new THREE.BoxGeometry(3.0, 1.6, 1.0);
      add(mg, merlonMat, mx, 8.5, 2.0);
    }

    // ── Culvert arch at wall base, centre
    // A round opening — simulate with two dark blocks flanking a gap
    const culvertMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1c, side: THREE.DoubleSide });
    // Left block
    add(new THREE.BoxGeometry(4, 3.5, 5.2), culvertMat, -4, -1.0, 0);
    // Right block
    add(new THREE.BoxGeometry(4, 3.5, 5.2), culvertMat,  4, -1.0, 0);
    // Arch lintel
    add(new THREE.BoxGeometry(10, 1.2, 5.2), culvertMat, 0, 0.75, 0);
    // Dark void behind culvert opening
    const voidMat = new THREE.MeshLambertMaterial({ color: 0x080808, side: THREE.DoubleSide });
    add(new THREE.BoxGeometry(3.4, 2.5, 5.6), voidMat, 0, -0.5, 0);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. HORNBURG ROCK MASS (west end)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // A large stepped cliff / fortress rock, dim and looming
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x2e2e32 });

    // Base rock mass
    add(new THREE.CylinderGeometry(22, 28, 38, 9), rockMat, -52, groundY(-52, -10) + 19, -10);
    // Upper keep body
    const keepMat = new THREE.MeshLambertMaterial({ color: 0x38383c });
    add(new THREE.BoxGeometry(28, 20, 24), keepMat, -52, groundY(-52,-10) + 38 + 10, -10);
    // Keep towers
    for (const [tx, tz] of [[-40,-4],[-64,-4],[-40,-20],[-64,-20]]) {
      add(new THREE.CylinderGeometry(3.5, 4.0, 26, 9), stoneMat, tx, groundY(tx,tz) + 48, tz);
      // Crenelated cap
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        const cr = 3.8;
        add(new THREE.BoxGeometry(1.4, 1.8, 1.4), merlonMat,
            tx + Math.cos(ang)*cr, groundY(tx,tz) + 62, tz + Math.sin(ang)*cr);
      }
    }
    // Horn turret (the horn hangs here)
    add(new THREE.CylinderGeometry(2.2, 2.6, 18, 9), stoneMat, -46, groundY(-46,-5) + 55, -5);

    // Connection: wall meets Hornburg rock — a short buttress
    add(new THREE.BoxGeometry(10, 10, 5), rockMat, -38, 2.5, 0);

    // ── West stair
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x404044 });
    for (let s = 0; s < 8; s++) {
      const sy = s * 0.94 + 0.5;
      const sz = s * 0.5 + 0.5;
      add(new THREE.BoxGeometry(3.5, 0.5, 1.2), stairMat, -32, sy, sz + 2);
    }

    // ── East stair
    for (let s = 0; s < 8; s++) {
      const sy = s * 0.94 + 0.5;
      const sz = s * 0.5 + 0.5;
      add(new THREE.BoxGeometry(3.5, 0.5, 1.2), stairMat, 32, sy, sz + 2);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. EAST CLIFF (natural rock face)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cliffMat = new THREE.MeshLambertMaterial({ color: 0x28282c });
    add(new THREE.BoxGeometry(10, 55, 60), cliffMat, 46, groundY(46, -20) + 27, -20);
    // Rough cliff face boulders
    for (let i = 0; i < 7; i++) {
      const bz = -10 - i * 7;
      const by = groundY(42, bz);
      add(new THREE.SphereGeometry(2 + i * 0.3, 10, 7), cliffMat, 42, by + 2, bz);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. DEFENDERS ON THE WALL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Silhouettes of Rohirrim soldiers at the merlons
    const soldierMat = new THREE.MeshLambertMaterial({ color: 0x1c1c20 });
    const soldierPositions = [-26, -13, 0, 13, 26];
    soldierPositions.forEach(sx => {
      // Body
      add(new THREE.CylinderGeometry(0.35, 0.4, 1.7, 7), soldierMat, sx, 8.6, -1.6);
      // Head (helm)
      add(new THREE.SphereGeometry(0.38, 8, 6), soldierMat, sx, 9.65, -1.6);
      // Spear
      add(new THREE.CylinderGeometry(0.05, 0.05, 4.5, 6), soldierMat, sx + 0.4, 10.0, -1.6);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. TORCHES ON THE WALL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // South face torches — spaced along the wall, shadow budget ~3
    const torchPositions = [-20, 0, 20];
    torchPositions.forEach((tx, i) => {
      FX.makeTorch(tx, 7.5, -2.5, {
        color:      0xff7722,
        intensity:  1.1,
        range:      12,
        castShadow: i === 1,  // only centre torch casts shadow
      });
    });

    // North face torches — behind wall
    [-15, 15].forEach(tx => {
      FX.makeTorch(tx, 7.5, 2.5, {
        color:      0xff8833,
        intensity:  0.85,
        range:      10,
        castShadow: false,
      });
    });

    // Hornburg torches
    FX.makeTorch(-44, groundY(-44, -4) + 50, -4, {
      color:     0xff6600,
      intensity: 1.0,
      range:     14,
      castShadow: true,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. DEEPING STREAM (behind the wall)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const waterMat = new THREE.MeshLambertMaterial({
      color: 0x0a1428, transparent: true, opacity: 0.72,
    });
    const streamGeo = new THREE.PlaneGeometry(5, 60);
    const stream = new THREE.Mesh(streamGeo, waterMat);
    stream.rotation.x = -Math.PI * 0.5;
    stream.position.set(2, -1.8, -32);
    scene.add(stream);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. BOULDERS AND RUBBLE ON APPROACH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const rubbleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2e });
    const ruinedRubble = [
      [8, 15], [-12, 22], [20, 18], [-5, 30], [14, 35],
      [-18, 28], [6, 42], [-8, 48],
    ];
    ruinedRubble.forEach(([rx, rz]) => {
      const gy = groundY(rx, rz);
      const s  = 0.8 + Math.abs((rx * rz) % 7) * 0.18;
      add(new THREE.SphereGeometry(s, 8, 6), rubbleMat, rx, gy + s * 0.45, rz);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. FLAMING ARROWS — particle system
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Each arrow is a small point-sprite with an orange tail
    const ARROW_COUNT = 60;
    const arrowGeo = new THREE.BufferGeometry();
    const arrowPos = new Float32Array(ARROW_COUNT * 3);
    const arrowSeeds = new Float32Array(ARROW_COUNT * 3); // x-offset, speed, phase

    for (let i = 0; i < ARROW_COUNT; i++) {
      // Start them in random positions along their arc initially
      const phase = (i / ARROW_COUNT);
      arrowPos[i*3    ] = (Math.random() - 0.5) * 70;
      arrowPos[i*3 + 1] = 15 + Math.random() * 20;
      arrowPos[i*3 + 2] = 20 + phase * 60;
      arrowSeeds[i*3    ] = (Math.random() - 0.5) * 60;  // x spread
      arrowSeeds[i*3 + 1] = 0.6 + Math.random() * 0.5;   // arc speed
      arrowSeeds[i*3 + 2] = Math.random() * Math.PI * 2;  // time offset
    }
    arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowPos, 3));

    const arrowMat = new THREE.PointsMaterial({
      color: 0xff5500, size: 0.55,
      transparent: true, opacity: 0.90,
      sizeAttenuation: true,
    });
    const arrows = new THREE.Points(arrowGeo, arrowMat);
    scene.add(arrows);

    // Smaller trailing embers for each arrow
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(ARROW_COUNT * 3 * 3); // 3 trail particles each
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff2200, size: 0.28,
      transparent: true, opacity: 0.55,
      sizeAttenuation: true,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. DISTANT SIEGE GLOW (south horizon)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const glowLight = new THREE.PointLight(0x6e1a00, 1.8, 90);
    glowLight.position.set(0, 4, 72);
    scene.add(glowLight);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. BROKEN SECTION OF WALL (culvert explosion aftermath)
    //     Visible as rubble slumped at base, centre-south face
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const blastMat = new THREE.MeshLambertMaterial({ color: 0x222224 });
    const blastRubble = [
      [0, 6, 1.1], [-2.5, 7, 0.9], [2.5, 7, 0.8],
      [-1.5, 8, 0.7], [1, 8.5, 0.6], [-3, 6, 1.2], [3.5, 6, 0.95],
    ];
    blastRubble.forEach(([rx, rz, rs]) => {
      const gy = groundY(rx, rz);
      add(new THREE.SphereGeometry(rs, 8, 6), blastMat, rx, gy + rs * 0.45, rz);
    });

    // Scorched ground plane at culvert base
    const scorchMat = new THREE.MeshLambertMaterial({ color: 0x0e0e10 });
    const scorchPlane = new THREE.Mesh(new THREE.CircleGeometry(5.5, 12), scorchMat);
    scorchPlane.rotation.x = -Math.PI * 0.5;
    scorchPlane.position.set(0, groundY(0, 7) + 0.05, 7);
    scene.add(scorchPlane);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. SIEGE LADDERS (leaning against south face of wall)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const ladderMat = new THREE.MeshLambertMaterial({ color: 0x1e1208 });
    const ladderPositions = [-22, -8, 10, 24];
    ladderPositions.forEach(lx => {
      // Rails
      const angle = -0.28;
      for (const side of [-0.5, 0.5]) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 11, 6), ladderMat);
        rail.position.set(lx + side, 2.0, 2.0);
        rail.rotation.x = angle;
        rail.castShadow = true;
        scene.add(rail);
      }
      // Rungs
      for (let r = 0; r < 7; r++) {
        const ry = -2.5 + r * 1.4;
        const rz = 2.6 - r * 0.3;
        add(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), ladderMat,
            lx, ry, rz, 0, 0, Math.PI * 0.5);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 12. URUK BODY SILHOUETTES on approach
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const urukMat = new THREE.MeshLambertMaterial({ color: 0x0e0e10 });
    const urukPositions = [
      [-15,25],[-8,30],[5,22],[14,28],[-20,32],[10,38],
      [-5,42],[18,34],[-12,20],[22,26],
    ];
    urukPositions.forEach(([ux, uz]) => {
      const gy = groundY(ux, uz);
      // Body
      add(new THREE.CylinderGeometry(0.3, 0.35, 1.5, 7), urukMat, ux, gy + 0.8, uz);
      // Head
      add(new THREE.SphereGeometry(0.3, 8, 6), urukMat, ux, gy + 1.9, uz);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 13. BANNER ON HORNBURG TOWER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const poleY = groundY(-44, -4) + 65;
    // Pole
    add(new THREE.CylinderGeometry(0.1, 0.1, 5, 6),
        new THREE.MeshLambertMaterial({ color: 0x503820 }),
        -44, poleY + 2, -4);
    // Banner cloth — green for Rohan
    const bannerMat = new THREE.MeshLambertMaterial({
      color: 0x1a3010, side: THREE.DoubleSide,
    });
    add(new THREE.PlaneGeometry(2.4, 1.6), bannerMat, -43, poleY + 4.2, -4);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Return refs for onFrame
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return {
      arrows,
      arrowPos,
      arrowSeeds,
      embers,
      emberPos,
      glowLight,
      ARROW_COUNT,
    };
  },

  // ─── onFrame ─────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    const { arrows, arrowPos, arrowSeeds, embers, emberPos, glowLight, ARROW_COUNT } = refs;

    // ── Flaming arrows arcing from south (+Z) northward (-Z)
    // Each arrow follows a parabolic arc: starts z~80 at height ~40,
    // lands at the wall (z~2) at height ~8
    for (let i = 0; i < ARROW_COUNT; i++) {
      const speed  = arrowSeeds[i*3 + 1];
      const phase  = arrowSeeds[i*3 + 2];
      const xBase  = arrowSeeds[i*3];

      // t_arc: 0..1, offset by phase so arrows are staggered
      const tRaw   = ((t * speed * 0.18 + phase / (Math.PI * 2)) % 1.0);
      const tArc   = tRaw;

      // Z: travels from +80 to +2  (south to wall, i.e. decreasing Z)
      const zPos   = 80 - tArc * 78;

      // Y: parabolic arc — peaks around t=0.4
      const arcY   = 8 + 32 * (tArc * (1.0 - tArc) * 4.0 * 0.65);

      // X: slight spread per arrow, tiny wobble
      const xPos   = xBase + Math.sin(t * 2.1 + phase) * 1.5;

      arrowPos[i*3    ] = xPos;
      arrowPos[i*3 + 1] = arcY;
      arrowPos[i*3 + 2] = zPos;

      // Three ember trail particles — slightly behind and above arrow
      for (let e = 0; e < 3; e++) {
        const lag   = (e + 1) * 0.012;
        const te    = Math.max(0, tArc - lag);
        const ez    = 80 - te * 78;
        const ey    = 8 + 32 * (te * (1.0 - te) * 4.0 * 0.65) + (e * 0.3);
        const ex    = xPos + Math.sin(t * 2.1 + phase - lag) * 1.5;
        const idx   = (i * 3 + e) * 3;
        emberPos[idx    ] = ex;
        emberPos[idx + 1] = ey;
        emberPos[idx + 2] = ez;
      }
    }
    arrows.geometry.attributes.position.needsUpdate = true;
    embers.geometry.attributes.position.needsUpdate = true;

    // ── Siege glow flickers
    glowLight.intensity = 1.6 + Math.sin(t * 2.3) * 0.3 + Math.sin(t * 5.1) * 0.12;
  },

  // ─── onArrive ────────────────────────────────────────────────
  onArrive(fromKey, refs) {
    // Nothing location-specific to do on arrival; FX handles torches.
  },
};

window.HelmsDeep = HelmsDeep;
