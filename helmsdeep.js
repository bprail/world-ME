// helmsdeep.js — Helm's Deep · The Deeping Wall
// Sequence: Edoras <-> Helm's Deep <-> Inner Keep
//
// Player arc:
//   Arrive from Edoras at south (+Z end) at dusk, below the wall on the approach
//   Climb west or east stair to the battlement walk
//   Move west along the wall as the assault intensifies (arrows fly overhead, east→west)
//   Descend north behind the wall to the Deep floor
//   Culvert explosion lore triggers near the base
//   Transition northwest to inner keep
//
// Valley walls flank the scene left and right throughout.

const HelmsDeep = {
  name:     "Helm's Deep",
  subtitle: "The Deeping Wall · Battle of the Hornburg",

  // ─── Atmosphere ──────────────────────────────────────────────
  // Dusk on approach, deepening to full battle-night at the wall.
  // A warm amber-orange fills the southern horizon (torches, siege fires);
  // the fortress and cliffs are lit by cold directional moonlight.
  atmosphere: {
    fogColor:          0x0a0c14,
    fogDensity:        0.009,
    fogType:           'exponential',
    skyColor:          0x04060f,
    ambientColor:      0x121420,    // slightly lifted — dusk residual
    ambientIntensity:  1.5,
    moonColor:         0x5a6e9a,
    moonIntensity:     0.55,        // stronger moon so valley walls read clearly
    moonPosition:      { x: -70, y: 110, z: -50 },
    showStars:         true,
    extraLights: [
      // Warm fill from fortress torches — lifts the north side of the wall
      { color: 0x7a3800, intensity: 0.45, x: -30, y: 20, z: -20 },
      // Cold blue-grey bounce off east valley cliff
      { color: 0x2a3858, intensity: 0.22, x: 60,  y: 30, z:  10 },
      // Dusk glow on south horizon — the host's fires
      { color: 0x5a1800, intensity: 0.35, x:  0,  y: -5, z: 100 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────
  // South of wall (z > 6): the Deeping-coomb approach, flat valley floor
  // Wall zone (−6 < z < 6): suppressed — wall sits on this
  // North of wall (z < −6): the Deep, rocky floor, rises toward gorge
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Keep the valley floor relatively flat — it's a mountain coomb, not rolling hills
    // But add valley walls: terrain rises steeply as |x| increases
    const valleyWallRise = Math.max(0, (Math.abs(x) - 36) * 1.8);

    if (z > 6) {
      // South approach: very gently slopes down toward player arrival
      const base  = -2.5 + (z - 6) * 0.03;
      const rough = fbm(x * 0.06, z * 0.06) * 1.0;
      return base + rough + valleyWallRise;
    }

    if (z > -6) {
      // Wall base zone: blend smoothly
      const t      = (z + 6) / 12;
      const southH = -2.5 + fbm(x * 0.06,  6 * 0.06) * 1.0;
      const northH =  0.2  + fbm(x * 0.06, -6 * 0.06) * 0.8;
      return (southH * t + northH * (1 - t)) + valleyWallRise;
    }

    // North of wall: the Deep — rocky, rises gently toward gorge
    const gorgeRise  = Math.max(0, (-z - 6) * 0.10);
    const rock       = noise(x * 0.09, z * 0.09) * 2.0;
    const fbmR       = fbm(x  * 0.05, z * 0.05) * 1.5;
    // Hornburg rock mass — large dome on the west side (negative X)
    const hbDist     = Math.sqrt((x + 55) ** 2 + (z + 8) ** 2);
    const hornburgBulge = Math.max(0, 1.0 - hbDist / 30) * 22;
    return 0.3 + gorgeRise + rock + fbmR + hornburgBulge + valleyWallRise;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    const m = noise2d(vx * 0.20, vz * 0.20 + 10);

    if (vz > 6) {
      // South approach: churned muddy earth, pale gravel
      const mud = noise2d(vx * 0.10, vz * 0.10);
      const r = lerp(0.17, 0.26, mud) + m * 0.05;
      const g = lerp(0.13, 0.19, mud) + m * 0.03;
      const b = lerp(0.09, 0.13, mud) + m * 0.02;
      return [r, g, b];
    }
    // North and wall zone: grey limestone, dark moss
    const r = lerp(0.19, 0.31, n) + m * 0.03;
    const g = lerp(0.20, 0.32, n) + m * 0.04;
    const b = lerp(0.21, 0.33, n) + m * 0.03;
    return [r, g, b];
  },

  onPath(x, z) { return 0; },   // no path ribbon — battlements and stairs guide the player

  pathWaypoints: [],

  // ─── Lore — sequenced along the player arc ───────────────────
  // South approach (dusk, before the wall)
  // Wall top (assault, arrows)
  // North ground (aftermath, transition)
  lorePoints: [
    {
      // South approach — the host assembles. Player arrives here from Edoras.
      pos: { x: 0, z: 50 },
      radius: 8,
      text: 'There in the Deeping-coomb the host of Saruman gathered. It had been raining. Through the dark and the rain they came, ten thousand strong, and all with torches.',
      cite: '— The Two Towers, III.7',
    },
    {
      // East stair foot — joining the defenders climbing to the wall
      pos: { x: 30, z: 7 },
      radius: 5,
      text: '"There is ever this choice," said Aragorn. "But tonight I would not have it said of us that we waited in the Dark, until the end came there in the Deep. Let us go forth and meet our enemies."',
      cite: '— Aragorn, The Two Towers, III.7',
    },
    {
      // East end of wall top — arrows begin, standing among archers
      pos: { x: 24, z: -1 },
      radius: 5,
      text: 'Shafts of fire leaped from the host in a hundred arcs. They fell on the battlements: some burst into flame and went out; others struck and lay burning. And still the dark host came on.',
      cite: '— The Two Towers, III.7',
    },
    {
      // Centre wall top — the assault at its height, Aragorn revealed
      pos: { x: 0, z: -1 },
      radius: 5,
      text: 'So great a power and royalty was revealed in Aragorn, as he stood there alone above the ruined gates before the host of his enemies, that many of the wild men paused, and looked back over their shoulders to the valley, and some looked up doubtfully at the sky.',
      cite: '— The Two Towers, III.7',
    },
    {
      // West end of wall, near Hornburg stair — Gimli's tally
      pos: { x: -22, z: -1 },
      radius: 5,
      text: '"Forty-two, Master Legolas!" he cried. "Alas! My axe is notched: the forty-second had an iron collar on his neck. Twenty-one, master!" answered Legolas. "Good hunting!"',
      cite: '— The Two Towers, III.7',
    },
    {
      // North ground, below wall (culvert aftermath)
      pos: { x: 0, z: -18 },
      radius: 6,
      text: 'There came a great flash, as of lightning from the cloud, and a rumble, and then a blasting roar. The wall cracked and staggered, and then fell in a heap of shattered stone and rubble. All was dark and smoke.',
      cite: '— The Two Towers, III.7',
    },
    {
      // Inside the Deep, near inner keep transition
      pos: { x: -28, z: -50 },
      radius: 6,
      text: '"Look to my coming, at first light, on the fifth day. At dawn look to the East."',
      cite: '— Gandalf, The Two Towers, III.6',
    },
  ],

  // ─── Start and arrivals ──────────────────────────────────────
  start: { x: 0, z: 55, yaw: 0 },   // at +Z end (south), facing -Z (toward the wall)

  arrivals: {
    edoras:    { x:  0,  z: 60, yaw: 0           }, // from +Z, facing -Z toward wall
    innerkeep: { x: -30, z: -55, yaw: Math.PI*1.5 }, // from inner keep, facing +X (east)
  },

  // ─── Boundary and transitions ────────────────────────────────
  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 75, radius: 8 },    // south end — back to Edoras
      to: 'edoras',
    },
    {
      trigger: { x: -40, z: -65, radius: 8 }, // northwest — through Hornburg to inner keep
      to: 'innerkeep',
    },
  ],

  // ─── Walkables ───────────────────────────────────────────────
  // The Deeping Wall battlement walk sits at y = 7.5.
  // Two corner stairs (east and west) connect ground to battlement.
  // A short descent ramp behind (north) connects battlement to Deep floor.
  walkables: [
    // Main battlement walk — full east-west span, flat
    { x:  0,  z: -1,  yaw: Math.PI*0.5, length: 72, width: 4.5, yStart: 7.5, yEnd: 7.5 },
    // West stair — rises from south ground (y≈0) to battlement top
    { x: -32, z:  5,  yaw: 0,           length: 11, width: 3.5, yStart: 0.0, yEnd: 7.5 },
    // East stair — mirror
    { x:  32, z:  5,  yaw: 0,           length: 11, width: 3.5, yStart: 0.0, yEnd: 7.5 },
    // North descent — from battlement down to Deep floor, behind wall
    { x: -30, z: -8,  yaw: 0,           length: 10, width: 3.5, yStart: 7.5, yEnd: 1.0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────
  barriers: [
    // East valley cliff — impassable rock face
    { x:  52, z: -10, w: 14, d: 140, yaw: 0 },
    // West — solid Hornburg rock mass
    { x: -60, z: -10, w: 16, d: 140, yaw: 0 },
    // Far north — gorge narrows to passage only the game allows
    { x:   0, z: -78, w: 100, d: 10, yaw: 0 },
    // Far south — beyond the battlefield
    { x:   0, z:  82, w: 100, d: 10, yaw: 0 },
  ],

  // ─── buildScene ──────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    const stoneMat     = MAT.STONE;
    const stoneDarkMat = MAT.STONE_DARK;

    const add = (geo, mat, x, y, z, rx, ry, rz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. VALLEY WALLS — left (east) and right (west) cliffs
    //    These are the defining feature of the Deeping-coomb: a narrow
    //    gorge with sheer walls rising on both sides. They run the full
    //    north-south length of the scene and loom above the player.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const cliffMat = new THREE.MeshLambertMaterial({ color: 0x252528 });
    const cliffAccent = new THREE.MeshLambertMaterial({ color: 0x1e1e22 });

    // East cliff — a stack of large slab faces stepping back as they rise
    // Runs from z=−70 to z=+70
    for (let seg = 0; seg < 7; seg++) {
      const sz  = -55 + seg * 18;
      const sh  = 28 + (seg % 3) * 6;
      const sx  = 44 + (seg % 2) * 3;
      add(new THREE.BoxGeometry(14, sh, 20), cliffMat, sx, groundY(sx, sz) + sh * 0.5, sz);
    }
    // Upper cliff tier — taller, further east
    for (let seg = 0; seg < 5; seg++) {
      const sz = -40 + seg * 24;
      add(new THREE.BoxGeometry(10, 44, 26), cliffAccent, 54, groundY(54, sz) + 22, sz);
    }
    // Cliff foot boulders, east
    for (let i = 0; i < 9; i++) {
      const bz = -50 + i * 12;
      const gy = groundY(40, bz);
      const s  = 1.8 + (i % 3) * 0.7;
      add(new THREE.SphereGeometry(s, 10, 7), cliffMat, 40 + (i % 2), gy + s * 0.45, bz);
    }

    // West cliff — merges with Hornburg rock but extends south as a cliff face
    for (let seg = 0; seg < 6; seg++) {
      const sz = -30 + seg * 18;
      const sh = 26 + (seg % 2) * 8;
      add(new THREE.BoxGeometry(12, sh, 22), cliffMat, -47, groundY(-47, sz) + sh * 0.5, sz);
    }
    for (let seg = 0; seg < 4; seg++) {
      const sz = -20 + seg * 22;
      add(new THREE.BoxGeometry(9, 40, 24), cliffAccent, -55, groundY(-55, sz) + 20, sz);
    }
    // Cliff foot boulders, west
    for (let i = 0; i < 7; i++) {
      const bz = -40 + i * 12;
      const gy = groundY(-42, bz);
      const s  = 1.6 + (i % 3) * 0.6;
      add(new THREE.SphereGeometry(s, 10, 7), cliffMat, -42, gy + s * 0.45, bz);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. THE DEEPING WALL
    //    Runs east-west, centred at z=0. Wall top at y=7.5.
    //    Bottom is buried into the terrain base.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const wallMat = new THREE.MeshLambertMaterial({ color: 0x3c3c40, side: THREE.DoubleSide });
    // Main body
    const wallBody = new THREE.Mesh(new THREE.BoxGeometry(72, 12, 5.5), wallMat);
    wallBody.position.set(0, 1.5, 0);
    wallBody.castShadow    = true;
    wallBody.receiveShadow = true;
    scene.add(wallBody);

    // Cap / walkway surface
    const capMat = new THREE.MeshLambertMaterial({ color: 0x525258 });
    add(new THREE.BoxGeometry(72, 0.5, 5.6), capMat, 0, 7.75, 0);

    // ── South-face merlons — wider gaps for archers
    const merlonMat = new THREE.MeshLambertMaterial({ color: 0x44444a });
    for (let i = -5; i <= 5; i++) {
      const mx = i * 6.2;
      if (Math.abs(mx) > 33) continue;
      add(new THREE.BoxGeometry(3.0, 2.4, 1.1), merlonMat, mx,  8.95, -2.2);
    }
    // North-face merlons (rear parapet)
    for (let i = -5; i <= 5; i++) {
      const mx = i * 6.2;
      if (Math.abs(mx) > 33) continue;
      add(new THREE.BoxGeometry(3.0, 1.8, 1.1), merlonMat, mx, 8.65, 2.2);
    }

    // ── Culvert at wall base, centre — the weak point
    const culvertMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1e, side: THREE.DoubleSide });
    add(new THREE.BoxGeometry(3.8, 3.5, 5.6), culvertMat, -4.0, -1.2, 0);
    add(new THREE.BoxGeometry(3.8, 3.5, 5.6), culvertMat,  4.0, -1.2, 0);
    add(new THREE.BoxGeometry(10,  1.2, 5.6), culvertMat,  0,    0.9,  0); // lintel
    // Void — dark opening
    add(new THREE.BoxGeometry(3.4, 2.7, 5.8),
        new THREE.MeshLambertMaterial({ color: 0x060608, side: THREE.DoubleSide }),
        0, -0.5, 0);

    // ── Culvert explosion rubble — slumped at base, south face
    const blastMat = new THREE.MeshLambertMaterial({ color: 0x222226 });
    [
      [0,7,1.1],[-2.5,7.5,0.9],[2.5,7,0.8],
      [-1.5,8,0.7],[1.2,8.8,0.6],[-3.5,6.5,1.2],[3.8,6,0.95],
      [0.5,10,0.5],[-1,9.5,0.65],
    ].forEach(([rx,rz,rs]) => {
      const gy = groundY(rx, rz);
      add(new THREE.SphereGeometry(rs, 8, 6), blastMat, rx, gy + rs*0.45, rz);
    });
    // Scorch mark
    const scorchPlane = new THREE.Mesh(
      new THREE.CircleGeometry(5.8, 12),
      new THREE.MeshLambertMaterial({ color: 0x0c0c0e })
    );
    scorchPlane.rotation.x = -Math.PI * 0.5;
    scorchPlane.position.set(0, groundY(0, 7) + 0.06, 7.5);
    scene.add(scorchPlane);

    // ── West stair — stone steps
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x484850 });
    for (let s = 0; s < 10; s++) {
      const sy =  s * 0.75 + 0.3;
      const sz =  5 - s * 0.55;
      add(new THREE.BoxGeometry(3.5, 0.45, 1.1), stairMat, -32, sy, sz);
    }
    // East stair
    for (let s = 0; s < 10; s++) {
      const sy = s * 0.75 + 0.3;
      const sz = 5 - s * 0.55;
      add(new THREE.BoxGeometry(3.5, 0.45, 1.1), stairMat, 32, sy, sz);
    }
    // North descent stair (behind wall)
    for (let s = 0; s < 10; s++) {
      const sy = 7.5 - s * 0.65;
      const sz = -6 - s * 0.55;
      add(new THREE.BoxGeometry(3.5, 0.45, 1.1), stairMat, -30, sy, sz);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. HORNBURG ROCK MASS AND KEEP (northwest)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const rockMat = new THREE.MeshLambertMaterial({ color: 0x2e2e34 });
    const keepMat = new THREE.MeshLambertMaterial({ color: 0x3a3a40 });

    // Base rock dome
    add(new THREE.CylinderGeometry(20, 26, 36, 9), rockMat, -52, groundY(-52,-10) + 18, -10);
    // Keep body on top
    add(new THREE.BoxGeometry(26, 18, 22), keepMat, -52, groundY(-52,-10) + 36 + 9, -10);
    // Four corner towers
    for (const [tx, tz] of [[-41,-4],[-63,-4],[-41,-20],[-63,-20]]) {
      add(new THREE.CylinderGeometry(3.2, 3.8, 24, 9), stoneMat, tx, groundY(tx,tz) + 46, tz);
      // Crenels
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        add(new THREE.BoxGeometry(1.3, 1.6, 1.3), merlonMat,
            tx + Math.cos(ang)*3.5, groundY(tx,tz)+59, tz + Math.sin(ang)*3.5);
      }
    }
    // Horn turret
    add(new THREE.CylinderGeometry(2.0, 2.4, 16, 9), stoneMat, -47, groundY(-47,-5) + 52, -5);
    // Keep buttress connecting to wall end
    add(new THREE.BoxGeometry(12, 11, 5.5), rockMat, -39, 2.5, 0);

    // ── Rohirrim banner on keep
    const poleBaseY = groundY(-45, -4) + 62;
    add(new THREE.CylinderGeometry(0.09, 0.09, 5.5, 6),
        new THREE.MeshLambertMaterial({ color: 0x503820 }), -45, poleBaseY+2.5, -4);
    add(new THREE.PlaneGeometry(2.6, 1.7),
        new THREE.MeshLambertMaterial({ color: 0x1a3010, side: THREE.DoubleSide }),
        -44, poleBaseY+5, -4);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. DEFENDERS ON THE WALL
    //    Silhouette Rohirrim along the battlement
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const soldierMat = new THREE.MeshLambertMaterial({ color: 0x28282e });
    [-26, -13, 0, 13, 26].forEach(sx => {
      add(new THREE.CylinderGeometry(0.32, 0.38, 1.6, 7), soldierMat, sx, 8.55, -1.8);
      add(new THREE.SphereGeometry(0.36, 8, 6),            soldierMat, sx, 9.55, -1.8);
      // Spear
      add(new THREE.CylinderGeometry(0.05, 0.05, 4.5, 6), soldierMat,
          sx+0.35, 10.0, -1.8);
      // Shield hint on south face
      add(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 8), soldierMat,
          sx-0.4, 8.5, -2.2, Math.PI*0.5, 0, 0);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. SIEGE LADDERS leaning on south wall face
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const ladderMat = new THREE.MeshLambertMaterial({ color: 0x1e1208 });
    [-22, -8, 10, 24].forEach(lx => {
      const leanAngle = -0.26;
      for (const side of [-0.5, 0.5]) {
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 10.5, 6), ladderMat);
        rail.position.set(lx + side, 2.0, 2.0);
        rail.rotation.x = leanAngle;
        rail.castShadow = true;
        scene.add(rail);
      }
      for (let r = 0; r < 7; r++) {
        add(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), ladderMat,
            lx, -2.5 + r*1.4, 2.6 - r*0.28, 0, 0, Math.PI*0.5);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. URUK SILHOUETTES on south approach
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const urukMat = new THREE.MeshLambertMaterial({ color: 0x0e0e12 });
    [
      [-15,22],[-8,28],[5,20],[14,26],[-20,32],
      [10,36],[-5,42],[18,32],[-12,18],[22,24],[0,46],[-25,38],
    ].forEach(([ux, uz]) => {
      const gy = groundY(ux, uz);
      add(new THREE.CylinderGeometry(0.28, 0.33, 1.4, 7), urukMat, ux, gy+0.75, uz);
      add(new THREE.SphereGeometry(0.28, 8, 6), urukMat, ux, gy+1.85, uz);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. BOULDERS AND RUBBLE on approach
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const rubbleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2e });
    [
      [9,16],[-13,24],[21,19],[-6,31],[15,36],[-18,29],[7,43],[-9,49],
    ].forEach(([rx, rz]) => {
      const gy = groundY(rx, rz);
      const s  = 0.7 + Math.abs((rx * 7 + rz) % 5) * 0.2;
      add(new THREE.SphereGeometry(s, 8, 6), rubbleMat, rx, gy + s*0.45, rz);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. DEEPING STREAM behind the wall
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const streamGeo = new THREE.PlaneGeometry(4.5, 65);
    const streamMat = new THREE.MeshLambertMaterial({
      color: 0x08121e, transparent: true, opacity: 0.75,
    });
    const stream = new THREE.Mesh(streamGeo, streamMat);
    stream.rotation.x = -Math.PI * 0.5;
    stream.position.set(2, -1.6, -38);
    scene.add(stream);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. TORCHES — south face, north face, Hornburg
    //    Budget: directional moon uses 1 shadow. 3 torch shadows.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // South-face torches (3) — warmly lit, cast shadow
    [-20, 0, 20].forEach((tx, i) => {
      FX.makeTorch(tx, 7.5, -2.4, {
        color:      0xff7722,
        intensity:  1.3,
        range:      14,
        castShadow: i === 1,  // centre torch only
      });
    });

    // North-face torches (2) — help player see behind the wall
    [-14, 14].forEach(tx => {
      FX.makeTorch(tx, 7.5, 2.4, {
        color:      0xff8833,
        intensity:  1.1,
        range:      12,
        castShadow: false,
      });
    });

    // Ground-level torches in the Deep (north side) — guide player toward transition
    [-15, -28].forEach((tx, i) => {
      FX.makeTorch(tx, groundY(tx, -30), -30, {
        color:      0xff6600,
        intensity:  1.0,
        range:      11,
        castShadow: i === 0,  // one shadow torch at the head of the north stair
      });
    });

    // Hornburg keep torch
    FX.makeTorch(-44, groundY(-44,-5) + 50, -5, {
      color:     0xff6600,
      intensity: 1.1,
      range:     15,
      castShadow: true,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 10. SIEGE GLOW — south horizon
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const siegeGlow = new THREE.PointLight(0x6e1a00, 2.0, 100);
    siegeGlow.position.set(0, 5, 78);
    scene.add(siegeGlow);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 11. FLAMING ARROWS — fly ALONG the wall, east to west
    //     Player on the battlement sees them arc overhead laterally.
    //     Arc from x≈+55 to x≈−55, peak height ≈ 18 above wall top.
    //     Staggered z positions so some pass in front, some behind player.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const ARROW_COUNT = 55;
    const arrowPos   = new Float32Array(ARROW_COUNT * 3);
    const arrowSeeds = new Float32Array(ARROW_COUNT * 3);
    // seed[0] = z-spread, seed[1] = arc speed, seed[2] = phase offset
    for (let i = 0; i < ARROW_COUNT; i++) {
      arrowSeeds[i*3    ] = (Math.random() - 0.3) * 10;   // z-spread near wall top
      arrowSeeds[i*3 + 1] = 0.55 + Math.random() * 0.5;   // arc speed
      arrowSeeds[i*3 + 2] = Math.random() * Math.PI * 2;   // phase
      // Initialise positions off-screen
      arrowPos[i*3    ] = 60;
      arrowPos[i*3 + 1] = 15;
      arrowPos[i*3 + 2] = 0;
    }
    const arrowGeo = new THREE.BufferGeometry();
    arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowPos, 3));
    const arrowMat = new THREE.PointsMaterial({
      color: 0xff5500, size: 0.60,
      transparent: true, opacity: 0.92,
      sizeAttenuation: true,
    });
    const arrows = new THREE.Points(arrowGeo, arrowMat);
    scene.add(arrows);

    // Trailing embers — 3 per arrow
    const EMBERS_PER = 3;
    const emberPos = new Float32Array(ARROW_COUNT * EMBERS_PER * 3);
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xff2200, size: 0.30,
      transparent: true, opacity: 0.55,
      sizeAttenuation: true,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    return {
      arrows, arrowPos, arrowSeeds,
      embers, emberPos,
      siegeGlow,
      ARROW_COUNT, EMBERS_PER,
    };
  },

  // ─── onFrame ─────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    const { arrows, arrowPos, arrowSeeds,
            embers, emberPos, siegeGlow,
            ARROW_COUNT, EMBERS_PER } = refs;

    // ── Flaming arrows: arc east (+X) to west (−X) along the wall
    // The parabola rises steeply, peaks overhead, then descends into the cliff.
    // z varies per arrow so volleys pass at different depths relative to the player.
    for (let i = 0; i < ARROW_COUNT; i++) {
      const zSpread = arrowSeeds[i*3    ];
      const speed   = arrowSeeds[i*3 + 1];
      const phase   = arrowSeeds[i*3 + 2];

      // tArc: 0→1 loops continuously, staggered by phase
      const tArc = ((t * speed * 0.16 + phase / (Math.PI * 2)) % 1.0);

      // X: travels east→west, +55 → −55
      const xPos = 55 - tArc * 110;

      // Y: parabolic arc — wall top is ~7.5; peak ~18 units above that = ~26
      // 4*t*(1-t) peaks at 1 when t=0.5
      const arcHeight = 18.5;
      const yPos = 7.5 + arcHeight * (tArc * (1.0 - tArc) * 4.0);

      // Z: each arrow has a slight z-spread so volleys have depth
      const zPos = zSpread + Math.sin(t * 0.4 + phase) * 0.8;

      arrowPos[i*3    ] = xPos;
      arrowPos[i*3 + 1] = yPos;
      arrowPos[i*3 + 2] = zPos;

      // Trailing embers — lagging slightly in tArc
      for (let e = 0; e < EMBERS_PER; e++) {
        const lag = (e + 1) * 0.013;
        const te  = Math.max(0, tArc - lag);
        const idx = (i * EMBERS_PER + e) * 3;
        emberPos[idx    ] = 55 - te * 110;
        emberPos[idx + 1] = 7.5 + arcHeight * (te * (1.0 - te) * 4.0) + e * 0.25;
        emberPos[idx + 2] = zPos;
      }
    }
    arrows.geometry.attributes.position.needsUpdate = true;
    embers.geometry.attributes.position.needsUpdate = true;

    // ── Siege glow flickers like distant fires
    siegeGlow.intensity = 1.8 + Math.sin(t * 2.5) * 0.3 + Math.sin(t * 6.3) * 0.14;
  },

  onArrive(fromKey, refs) {
    // Nothing location-specific; FX handles torches automatically.
  },
};

window.HelmsDeep = HelmsDeep;
