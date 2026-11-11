// entmoot.js — The Entmoot of Derndingle
// Sequence: Fangorn → Entmoot → Isengard
// Daytime — dappled ancient forest, the great hollow where Ents gather

const Entmoot = {

  name:     'The Entmoot',
  subtitle: 'Derndingle · Fangorn Forest',

  // ─── Load hook ───────────────────────────────────────────────────────────
  async onLoad() {
    // No async data needed — onLoad is a no-op for this location.
    // Reserved for future use (e.g. loading ambient birdsong cues or
    // pre-computing the ent-figure geometry on a worker thread).
  },

  // ─── Atmosphere ──────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x6b7a4a,   // deep forest green haze
    fogType:          'linear',
    fogNear:          55,
    fogFar:           220,
    skyColor:         0x7a9b5a,   // green-gold forest canopy ceiling
    ambientColor:     0x4a5c2a,   // rich leafy ambient
    ambientIntensity: 1.6,
    moonColor:        0xd4b87a,   // warm afternoon sun filtering through leaves
    moonIntensity:    0.85,
    moonPosition:     { x: 60, y: 140, z: -80 },
    showStars:        false,
    extraLights: [
      // Soft fill from sky-scattered canopy light
      { color: 0x8aaa5a, intensity: 0.5, x: -50, y: 80, z: 60 },
      // Warm low-angle fill from west — late-afternoon feel
      { color: 0xc8a060, intensity: 0.3, x: -90, y: 30, z: 20 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────
  // Broad shallow bowl (the Derndingle hollow) surrounded by gentle forested ridges.
  // The bowl centre sits noticeably lower — a natural amphitheatre.
  // Quickbeam's resting spot is a low mossy knoll to the east (+X).

  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // --- bowl shape: deepest at centre, rising to forest floor ---
    const dist  = Math.sqrt(x * x + z * z);
    const bowl  = Math.max(0, (dist / 32) * (dist / 32) - 0.1) * 7.0;

    // --- surrounding forested ridges ---
    const ridge = fbm(x * 0.03, z * 0.03) * 5.5
                + fbm(x * 0.07, z * 0.07) * 2.5
                + noise(x * 0.12, z * 0.12) * 1.2;

    // --- Quickbeam knoll: low mossy rise east of centre ---
    const qbDist = Math.sqrt((x - 28) * (x - 28) + (z + 8) * (z + 8));
    const qbKnoll = Math.max(0, 1 - qbDist / 14) * 3.2;

    // --- fine surface texture ---
    const detail = noise(x * 0.4, z * 0.4) * 0.35
                 + noise(x * 0.9, z * 0.9) * 0.12;

    // North approach (z < -38): gently rising path into forest
    const northSlope = (z < -38) ? ((-z - 38) * 0.08) : 0;
    // South approach (z > 38): slight rise toward Fangorn edge
    const southSlope = (z >  38) ? (( z - 38) * 0.07) : 0;

    return bowl + ridge * 0.55 + qbKnoll + detail + northSlope + southSlope;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const dist = Math.sqrt(vx * vx + vz * vz);

    // Mossy ancient earth in the bowl
    const bowlGreen  = [0.22, 0.28, 0.12];  // deep forest moss
    const forestFloor= [0.28, 0.24, 0.12];  // rich damp leaf-mould brown
    const rootEarth  = [0.32, 0.22, 0.10];  // exposed root earth
    const ridgeGreen = [0.18, 0.26, 0.10];  // darker ridge canopy-shadow

    const n1 = noise2d(vx * 0.08, vz * 0.08);
    const n2 = noise2d(vx * 0.22, vz * 0.19);

    // Bowl centre: very green moss
    if (dist < 18) {
      const t = lerp(bowlGreen, forestFloor, n1 * 0.6 + n2 * 0.3);
      return t;
    }
    // Mid zone: mossy-to-earth blend
    if (dist < 36) {
      const blend = (dist - 18) / 18;
      const a = lerp(bowlGreen, rootEarth, n1);
      return [
        lerp([a[0]], [forestFloor[0]], blend * 0.6)[0],
        lerp([a[1]], [forestFloor[1]], blend * 0.5)[0],
        lerp([a[2]], [forestFloor[2]], blend * 0.4)[0],
      ];
    }
    // Outer forest floor
    return lerp(forestFloor, ridgeGreen, n2 * 0.7);
  },

  onPath(x, z) {
    // Single winding path from south entry (+Z) through bowl to north exit (-Z)
    // Winds slightly to pass near Quickbeam's knoll on the way through

    const waypoints = [
      [0,   62],
      [3,   48],
      [-4,  35],
      [-2,  20],
      [0,    8],  // south bowl rim
      [0,   -2],  // bowl centre
      [4,  -12],  // slight east wind toward Quickbeam
      [2,  -24],
      [-3, -36],
      [0,  -50],
      [0,  -62],
    ];

    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [ax, az] = waypoints[i];
      const [bx, bz] = waypoints[i + 1];
      const dx = bx - ax, dz = bz - az;
      const len2 = dx * dx + dz * dz;
      let t = ((x - ax) * dx + (z - az) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx, pz = az + t * dz;
      const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
      if (d < minDist) minDist = d;
    }
    const r = 2.4;
    return minDist < r ? Math.max(0, 1 - minDist / r) : 0;
  },

  pathWaypoints: [
    [0,   62],
    [3,   48],
    [-4,  35],
    [-2,  20],
    [0,    8],
    [0,   -2],
    [4,  -12],
    [2,  -24],
    [-3, -36],
    [0,  -50],
    [0,  -62],
  ],

  // ─── Lore ────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 0 },
      radius: 7,
      // Narration describing the entmoot hollow — no speaker
      text:   'There was a great grey hill of stone in the middle of the valley, and there Treebeard stood, and the Ents were gathered round him in a wide circle.',
      cite:   '— The Two Towers, III.4',
    },
    {
      pos:    { x: 28, z: -8 },
      radius: 6,
      // Narration about Quickbeam — no speaker
      text:   'Quickbeam was waked earlier than the others. He had spoken in haste, and had not had time to think things over.',
      cite:   '— The Two Towers, III.4',
    },
    {
      pos:    { x: -18, z: 12 },
      radius: 6,
      // Direct speech by Merry
      text:   '"It is a solemn business. For three days they have been here, and nothing that Men or Hobbits would call a word has yet been said."',
      cite:   '— Merry, The Two Towers, III.4',
    },
    {
      pos:    { x: 14, z: -30 },
      radius: 5,
      // Direct speech by Treebeard
      text:   '"We have already agreed that we have no time to waste. And yet — we still think it is too hasty. We are still talking. But it is not idle talk."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: 0, z: 50 },
      radius: 5,
      // Direct speech by Gandalf — chapter III.5 (The White Rider)
      text:   '"Fangorn is old, old even as the Elves would reckon it. As old as the forest on the doorstep of Moria. It is perilous to go in."',
      cite:   '— Gandalf, The Two Towers, III.5',
    },
    {
      pos:    { x: -26, z: -20 },
      radius: 5,
      // Direct speech by Treebeard
      text:   '"But Ents do not like being roused; and the Wood of Fangorn is old, and full of old anger."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
  ],

  // ─── Navigation ──────────────────────────────────────────────────────────
  start:    { x: 0, z: 62, yaw: 0 },   // at +Z end, facing -Z (into scene)

  arrivals: {
    fangorn:  { x: 0, z: 62, yaw: 0         },  // arriving from +Z, facing -Z
    isengard: { x: 0, z: -62, yaw: Math.PI  },  // arriving from -Z, facing +Z
  },

  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 74, radius: 8 },
      to: 'fangorn',
    },
    {
      trigger: { x: 0, z: -74, radius: 8 },
      to: 'isengard',
    },
  ],

  walkables: [],   // terrain only — the hollow is walkable ground
  barriers:  [],

  // ─── Scene ───────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── Helpers ─────────────────────────────────────────────────────────────
    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ────────────────────────────────────────────────────────────
    const barkMat = new THREE.MeshLambertMaterial({ color: 0x3d3220 });
    const darkBarkMat = new THREE.MeshLambertMaterial({ color: 0x2a2015 });
    const mossMat = new THREE.MeshLambertMaterial({ color: 0x3a4e1a });
    const mossDarkMat = new THREE.MeshLambertMaterial({ color: 0x2e3c14 });
    const leafMat = new THREE.MeshLambertMaterial({
      color: 0x4a6a20, transparent: true, opacity: 0.88, side: THREE.DoubleSide,
    });
    const leafDarkMat = new THREE.MeshLambertMaterial({
      color: 0x2e4a14, transparent: true, opacity: 0.82, side: THREE.DoubleSide,
    });
    const stoneMat = MAT.STONE_MOSS;
    const rootMat = new THREE.MeshLambertMaterial({ color: 0x4a3820 });
    const groundStoneMat = MAT.STONE;

    // ── Bowl rim stones — ancient standing stones mark the entmoot circle ───
    const rimStoneAngles = 12;
    for (let i = 0; i < rimStoneAngles; i++) {
      const angle = (i / rimStoneAngles) * Math.PI * 2;
      const r = 22 + Math.sin(angle * 2.3) * 2;
      const sx = Math.cos(angle) * r;
      const sz = Math.sin(angle) * r;
      const h = 2.0 + Math.sin(angle * 1.7 + 1.2) * 0.8;
      const rTop = 0.35 + Math.random() * 0.2;
      const rBot = 0.6  + Math.random() * 0.3;
      const gy = groundY(sx, sz);
      addMesh(
        new THREE.CylinderGeometry(rTop, rBot, h, 7),
        stoneMat,
        sx, gy + h / 2 - h * 0.18, sz,
        (Math.random() - 0.5) * 0.08,
        angle + 0.3,
        (Math.random() - 0.5) * 0.06,
      );
    }

    // ── Central mound — the great grey stump-like rise ───────────────────────
    // Broad low cylinder, encrusted with moss and root-stones
    const moungGeo = new THREE.CylinderGeometry(4.5, 6.2, 2.4, 11);
    addMesh(moungGeo, mossMat, 0, groundY(0, 0) + 0.8, 0);

    // A few large boulders partially sunk into the mound
    const mouldBoulders = [
      [2.0, 1.0], [-1.8, 1.4], [0.8, -2.1], [-0.5, 2.6],
    ];
    for (const [bx, bz] of mouldBoulders) {
      const r = 0.8 + Math.random() * 0.5;
      addMesh(
        new THREE.SphereGeometry(r, 10, 7),
        mossDarkMat,
        bx, groundY(bx, bz) + r * 0.42, bz,
      );
    }

    // ── ENT FIGURES — massive tree-like beings in the circle ─────────────────
    // 7 Ents gathered around the mound. Each is a compound of cylinder trunk,
    // branching limbs, and canopy cluster geometry.

    function buildEnt(wx, wz, trunkHeight, trunkTilt, yawAngle, variant) {
      const gy = groundY(wx, wz);
      const group = new THREE.Group();
      group.position.set(wx, gy, wz);
      group.rotation.y = yawAngle;
      scene.add(group);

      // Trunk — tall, slightly irregular
      const trunkBot = 0.9 + variant * 0.15;
      const trunkTop = 0.5 + variant * 0.08;
      const tGeo = new THREE.CylinderGeometry(trunkTop, trunkBot, trunkHeight, 9);
      const trunk = new THREE.Mesh(tGeo, barkMat);
      trunk.position.set(0, trunkHeight / 2 - trunkHeight * 0.08, 0);
      trunk.rotation.z = trunkTilt;
      trunk.castShadow = true;
      group.add(trunk);

      // Lower root-splay — flared base discs
      for (let ri = 0; ri < 4; ri++) {
        const ra = (ri / 4) * Math.PI * 2 + variant;
        const rLen = 1.4 + variant * 0.3;
        const rootGeo = new THREE.CylinderGeometry(0.18, 0.4, rLen, 6);
        const root = new THREE.Mesh(rootGeo, darkBarkMat);
        root.position.set(
          Math.cos(ra) * 0.7, rLen * 0.3, Math.sin(ra) * 0.7,
        );
        root.rotation.z = Math.cos(ra) * 0.55;
        root.rotation.x = Math.sin(ra) * 0.55;
        root.castShadow = true;
        group.add(root);
      }

      // Arms — two branch-pairs emerging from upper trunk
      const armHeight = trunkHeight * 0.72;
      for (let ai = 0; ai < 2; ai++) {
        const aSide = ai === 0 ? 1 : -1;
        const armLen = 4.5 + variant;
        const armGeo = new THREE.CylinderGeometry(0.14, 0.32, armLen, 7);
        const arm = new THREE.Mesh(armGeo, barkMat);
        arm.position.set(aSide * 1.1, armHeight, 0);
        arm.rotation.z = aSide * 0.7 + trunkTilt;
        arm.rotation.x = -0.3 + variant * 0.1;
        arm.castShadow = true;
        group.add(arm);

        // Forearm
        const foreLen = 3.0 + variant * 0.5;
        const foreGeo = new THREE.CylinderGeometry(0.09, 0.16, foreLen, 6);
        const fore = new THREE.Mesh(foreGeo, darkBarkMat);
        fore.position.set(aSide * (1.1 + armLen * 0.4), armHeight + armLen * 0.3, 0.6);
        fore.rotation.z = aSide * 1.1;
        fore.rotation.x = 0.4;
        fore.castShadow = true;
        group.add(fore);
      }

      // Canopy — irregular cluster of leaf-cloud spheres
      const canopyY = trunkHeight * 0.88;
      const canopySpheres = 5 + Math.floor(variant * 2);
      for (let ci = 0; ci < canopySpheres; ci++) {
        const angle = (ci / canopySpheres) * Math.PI * 2 + variant;
        const cr = 1.2 + Math.sin(angle + variant) * 0.6;
        const cx = Math.cos(angle) * (1.5 + variant * 0.4);
        const cz = Math.sin(angle) * (1.5 + variant * 0.4);
        const cy = canopyY + Math.sin(ci + variant) * 1.2;
        const lGeo = new THREE.SphereGeometry(cr + 0.4, 8, 6);
        const leaf = new THREE.Mesh(lGeo, ci % 3 === 0 ? leafDarkMat : leafMat);
        leaf.position.set(cx, cy, cz);
        leaf.castShadow = true;
        group.add(leaf);
      }

      return group;
    }

    // 7 Ents in a loose arc around the mound
    const entPositions = [
      { x: -18, z: -6,   h: 14.0, tilt:  0.04, yaw: 0.4,         v: 0.1 },
      { x:  16, z:  2,   h: 15.5, tilt: -0.05, yaw: Math.PI+0.3,  v: 0.4 },
      { x:   8, z: -16,  h: 13.0, tilt:  0.03, yaw: 2.8,          v: 0.7 },
      { x: -12, z: -18,  h: 16.0, tilt: -0.04, yaw: 0.9,          v: 0.2 },
      { x:  -6, z:  18,  h: 12.5, tilt:  0.06, yaw: 3.6,          v: 0.9 },
      { x:  18, z: -18,  h: 14.5, tilt: -0.03, yaw: 1.8,          v: 0.5 },
      { x: -20, z:  14,  h: 13.5, tilt:  0.05, yaw: 5.1,          v: 0.3 },
    ];

    for (const e of entPositions) {
      buildEnt(e.x, e.z, e.h, e.tilt, e.yaw, e.v);
    }

    // ── QUICKBEAM — a younger, slimmer Ent at his knoll east of the hollow ───
    // He woke earlier; he stands slightly apart, more alert, facing west
    buildEnt(28, -8, 11.5, 0.03, Math.PI * 1.5, 0.6);

    // A second smaller tree beside Quickbeam (a rowan, his companion)
    buildEnt(31, -11, 8.0, 0.02, Math.PI * 1.3, 0.8);

    // ── Background forest — ring of large ancient trees around the scene ────
    function buildTree(wx, wz, h, variant) {
      const gy = groundY(wx, wz);
      const tGeo = new THREE.CylinderGeometry(
        0.4 + variant * 0.15, 0.8 + variant * 0.2, h, 8,
      );
      addMesh(tGeo, barkMat, wx, gy + h / 2 - h * 0.22, wz);

      // 2–3 canopy clusters
      const nc = 2 + Math.floor(variant * 1.5);
      for (let ci = 0; ci < nc; ci++) {
        const a = (ci / nc) * Math.PI * 2 + variant;
        const r = 1.8 + variant * 0.6;
        const lGeo = new THREE.SphereGeometry(r, 8, 6);
        addMesh(
          lGeo,
          ci % 2 === 0 ? leafMat : leafDarkMat,
          wx + Math.cos(a) * 1.4,
          gy + h * 0.84 + Math.sin(ci) * 0.8,
          wz + Math.sin(a) * 1.4,
        );
      }
    }

    // Dense ring at ~55–78 units radius
    const treeCount = 36;
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const r = 54 + Math.sin(angle * 3.1 + i) * 10 + (i % 3) * 4;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      const h = 9 + (i % 5) * 1.4;
      buildTree(tx, tz, h, (i * 0.37) % 1.0);
    }

    // Mid-ring trees — filling the forest between bowl and outer ring
    const midTreeCount = 24;
    for (let i = 0; i < midTreeCount; i++) {
      const angle = (i / midTreeCount) * Math.PI * 2 + 0.13;
      // avoid the bowl centre and the main path corridor
      const r = 32 + (i % 4) * 4;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      // skip trees that would sit in the path corridor
      if (Math.abs(tx) < 4 && Math.abs(tz) < 70) continue;
      const h = 7 + (i % 3) * 1.8;
      buildTree(tx, tz, h, (i * 0.53) % 1.0);
    }

    // ── Merry and Pippin — resting logs near the bowl rim ────────────────────
    // A pair of mossy fallen logs where the hobbits sat during the moot
    function addLog(wx, wz, len, yaw) {
      const gy = groundY(wx, wz);
      const lGeo = new THREE.CylinderGeometry(0.32, 0.38, len, 8);
      const log = addMesh(lGeo, mossDarkMat, wx, gy + 0.3, wz, Math.PI / 2, yaw, 0);
      return log;
    }
    addLog(-8, 20, 3.5, 0.3);
    addLog(-6, 22, 2.8, 0.1);

    // Small hearthstone arrangement between the logs (Quickbeam gave them food)
    const heartStones = [[-7.5, 21], [-8.4, 21.8], [-7.0, 22.5], [-8.8, 20.8]];
    for (const [hx, hz] of heartStones) {
      const r = 0.18 + Math.random() * 0.14;
      addMesh(
        new THREE.SphereGeometry(r, 8, 6),
        groundStoneMat,
        hx, groundY(hx, hz) + r * 0.5, hz,
      );
    }

    // ── Scattered root-humps and large boulders in the bowl surround ─────────
    const boulderPlaces = [
      [-30, -5], [25, 20], [-22, -26], [32, -22],
      [18,  28], [-38, 18], [30, 10], [-15, 32],
    ];
    for (const [bx, bz] of boulderPlaces) {
      const r = 0.9 + Math.random() * 0.9;
      addMesh(
        new THREE.SphereGeometry(r, 10, 7),
        mossMat,
        bx, groundY(bx, bz) + r * 0.42, bz,
      );
    }

    // Large root-humps: low squashed spheres half-sunk in ground
    const rootHumps = [
      [-10, 8], [12, -6], [-6, -14], [8, 14], [-16, -4],
    ];
    for (const [rx, rz] of rootHumps) {
      const gy = groundY(rx, rz);
      const rGeo = new THREE.SphereGeometry(1.1, 10, 7);
      const rMesh = new THREE.Mesh(rGeo, rootMat);
      rMesh.scale.set(1.6, 0.55, 1.4);
      rMesh.position.set(rx, gy + 0.3, rz);
      rMesh.castShadow = true;
      scene.add(rMesh);
    }

    // ── Dappled canopy light shafts — a few translucent cone/disc meshes ─────
    // These give the impression of sunlight filtering through the high canopy
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0xc8d890,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shaftPositions = [
      [5, 60, 0], [-12, 55, -4], [18, 58, 10], [-5, 52, 20],
    ];
    for (const [sx, sy, sz] of shaftPositions) {
      const shaftGeo = new THREE.CylinderGeometry(2.5, 0.4, sy, 8, 1, true);
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      const gx = sx, gz = sz;
      shaft.position.set(gx, sy / 2 + groundY(gx, gz), gz);
      scene.add(shaft);
    }

    // ── A small stream trickle along the northern path descent ────────────────
    // Flat planes with a tinted blue-green material suggesting water
    const streamMat = new THREE.MeshLambertMaterial({
      color: 0x4a6830,
      transparent: true,
      opacity: 0.7,
    });
    for (let si = 0; si < 5; si++) {
      const sz = -38 - si * 4;
      const sx = -2 + Math.sin(si * 1.3) * 1.5;
      const gy = groundY(sx, sz);
      const sGeo = new THREE.BoxGeometry(1.4, 0.05, 2.5);
      const slab = new THREE.Mesh(sGeo, streamMat);
      slab.position.set(sx, gy + 0.04, sz);
      slab.rotation.y = Math.sin(si * 0.9) * 0.3;
      scene.add(slab);
    }

    // ── Torch near Quickbeam's resting spot (a subtle warm glow) ─────────────
    FX.makeTorch(26, groundY(26, -5), -5, {
      color:     0xd4a840,
      intensity: 0.6,
      range:     12,
      castShadow: false,
    });

    // ── Soft ambient campfire embers near the hobbit logs ────────────────────
    FX.makeFire(-7.5, groundY(-7.5, 21) + 0.05, 21, {
      color:      0xc86820,
      intensity:  0.5,
      range:      6,
      flameScale: 0.35,
      emberCount: 30,
      emberSize:  0.05,
      castShadow: false,
    });

    return {};
  },

  // onFrame — no dynamic refs needed; FX handles the fire/torch animation
  onFrame(t, dt, refs, playerPos) {
    // nothing required
  },
};

window.Entmoot = Entmoot;
