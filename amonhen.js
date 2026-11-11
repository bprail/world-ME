// amonhen.js — Amon Hen, the Hill of Sight
// Sequence: Argonath <-> Amon Hen
// Time: Daytime, tense and grief-shadowed

const AmonHen = {

  name:     'Amon Hen',
  subtitle: 'The Hill of Sight · Nen Hithoel · Argonath',

  // ─── onLoad ──────────────────────────────────────────────────────────────
  async onLoad() {
    // Nothing to prefetch for Amon Hen — buildScene uses only procedural geometry.
  },

  // ─── Atmosphere ──────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x9aacb8,
    fogDensity:       0.004,
    fogType:          'linear',
    fogNear:          90,
    fogFar:           320,
    skyColor:         0x7a9db5,
    ambientColor:     0x8899a8,
    ambientIntensity: 1.1,
    moonColor:        0xd4c8a8,   // pale sun
    moonIntensity:    0.85,
    moonPosition:     { x: 120, y: 180, z: -80 },
    showStars:        false,
    extraLights: [
      // soft fill from the east — lake-reflected light
      { color: 0xa8c0cc, intensity: 0.35, x: 80,  y: 60,  z: 20  },
      // cool shadow fill from the west
      { color: 0x6878a0, intensity: 0.18, x: -90, y: 40,  z: 10  },
      // gentle overhead bounce
      { color: 0xc8bfa0, intensity: 0.22, x: 0,   y: -60, z: 0   },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Hill rises steeply from shore (+Z flat) toward summit (-Z high)
    // Shore zone: z > 30 → flat near 0
    // Hill flank: z  -20 → summit plateau near z = -50
    const northness = Math.max(0, -z - 10) / 60.0;  // 0 at z=-10, 1 at z=-70
    const hillBase  = northness * northness * 28.0;

    // Summit dome centred around (0, -52)
    const dxS = x * 0.012;
    const dzS = (z + 52) * 0.012;
    const dome = Math.max(0, 1.0 - (dxS*dxS + dzS*dzS)) * 14.0;

    // Broad noise for terrain undulation
    const big   = fbm(x * 0.018, z * 0.018) * 4.5;
    // Fine detail
    const fine  = fbm(x * 0.07,  z * 0.07)  * 1.2;
    // Shore flatness — clamp near z=+60
    const shoreFlat = Math.max(0, (z - 42) / 25.0);

    const raw = hillBase + dome + big + fine - shoreFlat * (hillBase + dome + big * 0.5);

    // Shore water-line: gently slope to 0 near +Z
    const shoreDamp = 1.0 - Math.max(0, Math.min(1, (z - 35) / 30.0));
    return raw * shoreDamp;
  },

  // ─── Vertex colour ───────────────────────────────────────────────────────
  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Colour bands by height and slope-proxy
    const n = noise2d(vx * 0.06, vz * 0.06);

    // Shore / low ground: sandy-grass
    const shore   = [0.52, 0.50, 0.38];
    // Forest floor: dark mossy green
    const forest  = [0.22, 0.28, 0.16];
    // Mid-slope: olive-green with rock mix
    const midslope = [0.30, 0.30, 0.20];
    // Upper rocky: grey-brown
    const rock    = [0.42, 0.38, 0.32];
    // Summit stone: pale grey
    const summit  = [0.55, 0.52, 0.48];

    let r, g, b;
    if (vy < 1.5) {
      // shore blend
      const t = Math.min(1, vy / 1.5) + n * 0.3;
      r = lerp(shore[0], forest[0], t);
      g = lerp(shore[1], forest[1], t);
      b = lerp(shore[2], forest[2], t);
    } else if (vy < 8.0) {
      const t = (vy - 1.5) / 6.5 + (n - 0.5) * 0.25;
      const tc = Math.max(0, Math.min(1, t));
      r = lerp(forest[0], midslope[0], tc);
      g = lerp(forest[1], midslope[1], tc);
      b = lerp(forest[2], midslope[2], tc);
    } else if (vy < 18.0) {
      const t = (vy - 8.0) / 10.0 + (n - 0.5) * 0.3;
      const tc = Math.max(0, Math.min(1, t));
      r = lerp(midslope[0], rock[0], tc);
      g = lerp(midslope[1], rock[1], tc);
      b = lerp(midslope[2], rock[2], tc);
    } else {
      const t = Math.min(1, (vy - 18.0) / 8.0 + (n - 0.5) * 0.2);
      r = lerp(rock[0], summit[0], t);
      g = lerp(rock[1], summit[1], t);
      b = lerp(rock[2], summit[2], t);
    }
    return [r, g, b];
  },

  // ─── Path ─────────────────────────────────────────────────────────────────
  // Shore landing → winding forest climb → switchback → summit approach
  onPath(x, z) {
    const waypoints = AmonHen.pathWaypoints;
    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const ax = waypoints[i][0],   az = waypoints[i][1];
      const bx = waypoints[i+1][0], bz = waypoints[i+1][1];
      const dx = bx - ax, dz = bz - az;
      const len2 = dx*dx + dz*dz;
      let t = len2 > 0 ? ((x-ax)*dx + (z-az)*dz) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx, pz = az + t*dz;
      const d = Math.sqrt((x-px)*(x-px) + (z-pz)*(z-pz));
      if (d < minDist) minDist = d;
    }
    const r = 2.5;
    return minDist < r ? Math.max(0, 1.0 - minDist / r) : 0;
  },

  pathWaypoints: [
    // Shore landing (transition zone, +Z end)
    [  0,  68 ],
    [  0,  54 ],
    [  2,  44 ],
    // Enter tree line, begin climb
    [  5,  34 ],
    [  8,  24 ],
    // First switchback — bend east
    [ 14,  14 ],
    [ 18,   6 ],
    // Bend back west — steeper now
    [ 12,  -4 ],
    [  5, -14 ],
    // Second switchback — bend east again
    [ -4, -24 ],
    [ -8, -34 ],
    // Final approach west then straight to summit
    [ -4, -44 ],
    [  0, -52 ],   // summit
  ],

  // ─── Lore points ─────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 60 },
      radius: 6,
      text:   '"The Company came at last to Nen Hithoel... The air was cold and grey. The long journey was near its end, and the Fellowship had reached the parting of the ways."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 4, z: 42 },
      radius: 5,
      text:   '"Frodo felt the burden of the Ring, a weight of dread and longing, pressing down upon him. He needed time to think, to decide the road he must take — alone."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 10, z: 20 },
      radius: 5,
      text:   '"Boromir came and sat beside him. For a while he was silent. Then he began to speak of Minas Tirith, of its need, of the peril of Mordor pressing ever closer."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 16, z: 8 },
      radius: 5,
      text:   '"It is a gift, I say; a gift to the foes of Mordor. It is mad not to use it, to use the power of the Enemy against him... Lend me the Ring!"',
      cite:   '— Boromir, The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 8, z: -8 },
      radius: 5,
      text:   '"Frodo felt a sudden irrational longing to cry out to Boromir for help. But something held him back. He turned and fled up the hill."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: -6, z: -24 },
      radius: 5,
      text:   '"Sam went after his master as fast as he could go up the steep path. High overhead above the trees came the sound of wind, and of things rushing through the air."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: -6, z: -40 },
      radius: 5,
      text:   '"Then Boromir came. He stood over the fallen body and wept. His sword was drawn and stained. Many Orcs lay slain about him, but more were still coming."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 0, z: -52 },
      radius: 6,
      text:   '"He sat upon the ancient seat of kings. And he saw — the Eye of Mordor, lidless and wreathed in flame, searching, moving across the world. It found him."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: -18, z: -50 },
      radius: 5,
      text:   '"Then a great dread fell on him, as if he heard the voice of Sauron, commanding: Come! Take off the Ring! Then he was weeping, and he put on the Ring and vanished."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 18, z: -48 },
      radius: 5,
      text:   '"Aragorn knelt beside Boromir, and undid his belt, and tried to staunch the wounds in his breast. Boromir opened his eyes and looked up at Aragorn. I tried to take the Ring from Frodo... I am sorry."',
      cite:   '— Boromir, The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 20, z: -34 },
      radius: 5,
      text:   '"You have conquered. Few have gained such a victory. Be at peace! Minas Tirith shall not fall!" Aragorn did not know whether he had spoken true; but as he said it, he knew that he did not believe it."',
      cite:   '— Aragorn, The Fellowship of the Ring, II.10',
    },
    {
      pos:    { x: 10, z: -58 },
      radius: 5,
      text:   '"Then Aragorn was left alone. Leaves came falling through the air. The last of the Fellowship stood upon Amon Hen as evening came on, and his heart was troubled."',
      cite:   '— The Fellowship of the Ring, II.10',
    },
  ],

  // ─── Start and arrivals ───────────────────────────────────────────────────
  start: { x: 0, z: 68, yaw: 0 },   // at +Z shore, facing -Z into the hill

  arrivals: {
    argonath:  { x: 0, z:  68, yaw: 0          },  // arriving from +Z (lake), facing -Z up the hill
    eastemnet: { x: 0, z: -78, yaw: Math.PI    },  // arriving from -Z, facing +Z back toward summit
  },

  // ─── Boundary and transitions ─────────────────────────────────────────────
  boundary: 90,

  transitions: [
    {
      trigger: { x: 0, z:  80, radius: 8 },
      to: 'argonath',
    },
    {
      trigger: { x: 0, z: -80, radius: 8 },
      to: 'eastemnet',
    },
  ],

  // ─── Walkables ────────────────────────────────────────────────────────────
  // The Seat of Seeing: a raised stone platform at the summit
  // yaw:0 — runs along Z axis; summit terrain is ~y:26 here
  walkables: [
    // Stone approach ramp — east side of summit, rises from terrain
    { x:  6, z: -46, yaw: 0,            length: 10, width: 4.0, yStart: 24.0, yEnd: 27.5 },
    // The Seat platform — flat crown
    { x:  0, z: -52, yaw: 0,            length:  8, width: 8.0, yStart: 27.5, yEnd: 27.5 },
    // West descent ramp
    { x: -6, z: -58, yaw: 0,            length: 10, width: 4.0, yStart: 27.5, yEnd: 24.0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────
  // Block players walking off the sheer western cliff face of summit
  barriers: [
    { x: -22, z: -52, w: 10, d: 40, yaw: 0 },
    { x:  22, z: -52, w: 10, d: 40, yaw: 0 },
  ],

  // ─── buildScene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    const lerp = (a, b, t) => a + (b - a) * t;

    // ── Campfire remnants on the shore (Fellowship camped here) ────────────
    FX.makeFire(3, groundY(3, 56) + 0.1, 56, {
      color:      0xff7020,
      intensity:  2.2,
      range:      10,
      flameScale: 0.6,
      emberCount: 40,
      emberSize:  0.06,
      castShadow: false,
    });

    // ── Shore rocks — Nen Hithoel lake edge ───────────────────────────────
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6e6a60 });
    const shoreRockData = [
      [ -18, 62, 1.8 ], [ -12, 65, 1.1 ], [ -6, 67, 0.9 ],
      [  10, 64, 1.4 ], [  18, 61, 2.0 ], [  22, 66, 1.0 ],
      [ -24, 60, 2.4 ], [  26, 60, 1.6 ], [ -8, 70, 0.8 ],
      [  14, 70, 1.2 ], [ -20, 70, 0.7 ], [ 28, 68, 0.9 ],
    ];
    for (const [rx, rz, rs] of shoreRockData) {
      const geo = new THREE.SphereGeometry(rs, 10, 7);
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.position.set(rx, groundY(rx, rz) + rs * 0.45, rz);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(mesh);
    }

    // ── Trees — forest covering the hill flanks ────────────────────────────
    // Trunk material: dark bark
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2a2018 });
    // Canopy materials: several shades of deep woodland green
    const canopyMats = [
      new THREE.MeshLambertMaterial({ color: 0x1e3018 }),
      new THREE.MeshLambertMaterial({ color: 0x243820 }),
      new THREE.MeshLambertMaterial({ color: 0x1a2c14 }),
      new THREE.MeshLambertMaterial({ color: 0x2e3c22 }),
    ];

    // Tree placement: scattered across the hill flanks, denser mid-slope
    // Avoid summit (z < -38), avoid shore (z > 50), avoid path corridor
    const treePositions = [
      // West side lower
      [-22, 36], [-26, 28], [-20, 20], [-28, 14], [-24,  4], [-18, -4],
      [-30,  2], [-26, -10], [-22, -18], [-18, -26], [-24, -30],
      // East side lower
      [ 24, 32], [ 28, 22], [ 22, 12], [ 26,  2], [ 20, -6],
      [ 28, -8], [ 24, -16], [ 20, -22], [ 26, -28],
      // Mid-slope scattered
      [-12, 30], [-8, 18], [-14,  8], [-10, -2], [-16, -12],
      [ 16, 28], [ 12, 16], [ 18,  6], [ 14, -4], [ 16, -14],
      // Upper flanks — sparser, shorter
      [-14, -30], [ -6, -32], [ 12, -30], [ 18, -32],
      [-10, -36], [  8, -36],
      // Extra fill lower west/east
      [-32, 24], [ 30, 18], [-34, 10], [ 32,  6],
      [-28, 36], [ 26, 40], [-18, 44], [ 20, 44],
    ];

    for (let i = 0; i < treePositions.length; i++) {
      const [tx, tz] = treePositions[i];
      const gy = groundY(tx, tz);
      // skip if too close to path
      if (AmonHen.onPath(tx, tz) > 0.3) continue;

      // Height varies with elevation — shorter near summit
      const heightFactor = Math.max(0.4, 1.0 - Math.max(0, (-tz - 20)) / 50.0);
      const treeH = lerp(5.0, 11.0, heightFactor) + (Math.sin(i * 1.37) * 0.5);
      const trunkR = treeH * 0.045;

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, treeH, 7);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, gy + treeH * 0.5 - treeH * 0.18, tz);
      scene.add(trunk);

      // Canopy — two overlapping spheres for volume
      const cMat = canopyMats[i % canopyMats.length];
      const capR = treeH * 0.38 + Math.sin(i * 2.1) * 0.4;
      const capGeo = new THREE.SphereGeometry(capR, 8, 6);
      const cap = new THREE.Mesh(capGeo, cMat);
      cap.position.set(tx, gy + treeH * 0.82, tz);
      cap.scale.y = 1.25;
      scene.add(cap);

      // Second offset cap for irregular silhouette
      const cap2 = new THREE.Mesh(
        new THREE.SphereGeometry(capR * 0.72, 7, 5),
        canopyMats[(i + 2) % canopyMats.length]
      );
      cap2.position.set(
        tx + Math.sin(i * 0.9) * capR * 0.45,
        gy + treeH * 0.72 + capR * 0.3,
        tz + Math.cos(i * 1.3) * capR * 0.4
      );
      scene.add(cap2);
    }

    // ── Fallen ancient ruins along the path climb ─────────────────────────
    // These are remnants of old Númenórean stonework
    const ruinMat  = new THREE.MeshLambertMaterial({ color: 0x7a7268 });
    const mossyMat = MAT.STONE_MOSS;

    // Fallen column drums — mid slope
    const fallenColumns = [
      { x: -16, z: 10, r: 0.9, h: 2.2, ry: 0.4 },
      { x: -18, z: 6,  r: 0.75,h: 1.8, ry: 1.1 },
      { x:  20, z: 2,  r: 0.85,h: 2.0, ry: 0.7 },
      { x:  22, z: -4, r: 0.70,h: 1.6, ry: 2.1 },
      { x: -20, z: -20,r: 1.0, h: 2.6, ry: 0.2 },
      { x:  18, z: -18,r: 0.9, h: 2.0, ry: 1.8 },
    ];
    for (const col of fallenColumns) {
      const geo = new THREE.CylinderGeometry(col.r, col.r * 1.05, col.h, 9);
      const mesh = new THREE.Mesh(geo, mossyMat);
      const gy = groundY(col.x, col.z);
      mesh.position.set(col.x, gy + col.h * 0.25, col.z);
      // Fallen — tip over on X axis
      mesh.rotation.set(Math.PI * 0.48, col.ry, 0.1);
      scene.add(mesh);
    }

    // Upright broken stumps of columns
    const stumpData = [
      { x: -15, z: -6,  rT: 0.5, rB: 0.65, h: 1.4 },
      { x:  19, z: -10, rT: 0.4, rB: 0.60, h: 1.1 },
      { x: -22, z: -28, rT: 0.6, rB: 0.75, h: 1.8 },
      { x:  20, z: -26, rT: 0.5, rB: 0.65, h: 1.5 },
      { x:  -8, z: -40, rT: 0.7, rB: 0.85, h: 2.2 },
      { x:   8, z: -40, rT: 0.6, rB: 0.80, h: 1.9 },
    ];
    for (const st of stumpData) {
      const geo = new THREE.CylinderGeometry(st.rT, st.rB, st.h, 9);
      const mesh = new THREE.Mesh(geo, ruinMat);
      const gy = groundY(st.x, st.z);
      mesh.position.set(st.x, gy + st.h / 2 - st.h * 0.2, st.z);
      mesh.rotation.y = Math.random() * Math.PI;
      scene.add(mesh);
    }

    // Flat lintel slabs — lying across the ruins
    const slabData = [
      { x: -16, z: 8,   w: 3.0, h: 0.4, d: 1.2, ry: 0.3  },
      { x:  20, z: -2,  w: 2.6, h: 0.35,d: 1.0, ry: 1.1  },
      { x: -21, z: -24, w: 3.4, h: 0.45,d: 1.1, ry: 0.6  },
      { x:   9, z: -38, w: 2.8, h: 0.40,d: 1.0, ry: 0.9  },
    ];
    for (const sl of slabData) {
      const geo = new THREE.BoxGeometry(sl.w, sl.h, sl.d);
      const mesh = new THREE.Mesh(geo, mossyMat);
      const gy = groundY(sl.x, sl.z);
      mesh.position.set(sl.x, gy + sl.h * 0.25, sl.z);
      mesh.rotation.y = sl.ry;
      scene.add(mesh);
    }

    // ── Summit — the Seat of Seeing ───────────────────────────────────────
    // Build the visible platform matching the walkable geometry
    const seatMat  = new THREE.MeshLambertMaterial({ color: 0x8a8278 });
    const seatDark = new THREE.MeshLambertMaterial({ color: 0x5a5650 });

    // Platform base — a wide flat stone
    const platformGeo = new THREE.BoxGeometry(10.0, 1.2, 10.0);
    const platform = new THREE.Mesh(platformGeo, seatMat);
    platform.position.set(0, 27.0, -52);
    scene.add(platform);

    // The Seat itself — a tall stone chair, ancient and carved
    // Back slab
    const backGeo = new THREE.BoxGeometry(3.5, 3.8, 0.55);
    const back = new THREE.Mesh(backGeo, seatDark);
    back.position.set(0, 29.5, -53.2);
    scene.add(back);

    // Seat slab
    const seatSlabGeo = new THREE.BoxGeometry(2.8, 0.45, 1.6);
    const seatSlab = new THREE.Mesh(seatSlabGeo, seatDark);
    seatSlab.position.set(0, 28.0, -52.3);
    scene.add(seatSlab);

    // Left arm
    const armGeo = new THREE.BoxGeometry(0.4, 1.0, 1.8);
    const armL = new THREE.Mesh(armGeo, seatDark);
    armL.position.set(-1.5, 28.6, -52.3);
    scene.add(armL);

    // Right arm
    const armR = armL.clone();
    armR.position.set(1.5, 28.6, -52.3);
    scene.add(armR);

    // Summit standing columns — tall sentinels flanking the seat
    const summitColData = [
      { x: -5, z: -50, rT: 0.4, rB: 0.5, h: 5.0 },
      { x:  5, z: -50, rT: 0.4, rB: 0.5, h: 5.0 },
      { x: -5, z: -54, rT: 0.4, rB: 0.5, h: 4.0 },
      { x:  5, z: -54, rT: 0.4, rB: 0.5, h: 4.0 },
      // Fallen/broken outer ring
      { x:-10, z: -49, rT: 0.35,rB: 0.45,h: 2.4 },
      { x: 10, z: -49, rT: 0.35,rB: 0.45,h: 2.6 },
      { x:  0, z: -57, rT: 0.4, rB: 0.5, h: 3.2 },
    ];
    for (const sc of summitColData) {
      const geo = new THREE.CylinderGeometry(sc.rT, sc.rB, sc.h, 9);
      const mesh = new THREE.Mesh(geo, seatMat);
      mesh.position.set(sc.x, 27.5 + sc.h / 2 - sc.h * 0.1, sc.z);
      scene.add(mesh);
    }

    // Broken rubble around summit base
    const summitRubble = [
      [  3, -48, 0.5], [ -4, -48, 0.4], [  7, -52, 0.6],
      [ -7, -52, 0.5], [  2, -57, 0.45],[ -3, -57, 0.5],
      [  9, -55, 0.35],[ -9, -55, 0.4 ], [ 11, -48, 0.5],
      [-11, -48, 0.45],
    ];
    for (const [rx, rz, rs] of summitRubble) {
      const geo = new THREE.SphereGeometry(rs, 8, 6);
      const mesh = new THREE.Mesh(geo, ruinMat);
      mesh.position.set(rx, 27.5 + rs * 0.45, rz);
      mesh.rotation.set(
        (Math.random()-0.5)*0.5,
        Math.random()*Math.PI,
        (Math.random()-0.5)*0.5
      );
      scene.add(mesh);
    }

    // ── Ramp approach geometry (matches walkable ramp east side) ──────────
    // Stone paving approach ramp — east approach
    const rampGeo = new THREE.BoxGeometry(4.0, 0.5, 10.0);
    const rampEast = new THREE.Mesh(rampGeo, seatMat);
    rampEast.position.set(6, 25.8, -46);
    rampEast.rotation.x = -Math.atan2(27.5 - 24.0, 10.0);
    scene.add(rampEast);

    // West descent ramp geometry
    const rampWest = new THREE.Mesh(rampGeo, seatMat);
    rampWest.position.set(-6, 25.8, -58);
    rampWest.rotation.x = Math.atan2(27.5 - 24.0, 10.0);
    scene.add(rampWest);

    // ── Scattered boulders mid-hill ───────────────────────────────────────
    const boulderMat = new THREE.MeshLambertMaterial({ color: 0x5e5a52 });
    const boulderData = [
      [-32, 26, 2.2], [ 30, 20, 1.8], [-36, 12, 1.6], [ 32, -2, 2.0],
      [-30, -6, 1.9], [ 28,-14, 1.5], [-28,-20, 2.1], [ 24,-24, 1.7],
      [ -6, 32, 1.1], [  8, 28, 0.9], [-10, -8, 1.3], [ 12,-12, 1.0],
    ];
    for (const [bx, bz, bs] of boulderData) {
      const geo = new THREE.SphereGeometry(bs, 10, 7);
      const mesh = new THREE.Mesh(geo, boulderMat);
      mesh.position.set(bx, groundY(bx, bz) + bs * 0.45, bz);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mesh);
    }

    // ── A torch at the summit for drama ───────────────────────────────────
    // Unlit — cold iron, no flame
    // We use a simple pole + head instead of FX.makeTorch so it's dark
    const torchPoleMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
    const torchPoleGeo = new THREE.CylinderGeometry(0.07, 0.09, 2.2, 7);
    const poleL = new THREE.Mesh(torchPoleGeo, torchPoleMat);
    poleL.position.set(-2.5, 28.0 + 1.1, -53.8);
    scene.add(poleL);
    const poleR = poleL.clone();
    poleR.position.set(2.5, 28.0 + 1.1, -53.8);
    scene.add(poleR);

    return {}; // no onFrame refs needed
  },

  // ─── onFrame ─────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // No animated refs needed — FX handles the campfire automatically
  },
};

window.AmonHen = AmonHen;
