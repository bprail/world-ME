// eregion.js — Eregion, Land of the Ring-makers
// Sequence: rivendell (north, +Z) <-> eregion <-> moriadoors (south, -Z)
// Time: dusk — last orange light dying in the west, violet night from the east

const Eregion = {

  name:     'Eregion',
  subtitle: 'Land of the Ring-makers · The Forgotten Realm',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  // Deep dusk. The sun has set; only a bruised orange glow lingers on the
  // western horizon. Violet-blue night is washing in from the east.
  // Fog is kept relatively close so the sky reads dark, not golden.
  atmosphere: {
    fogColor:         0x110c18,   // cool violet-grey ground mist
    fogType:          'linear',
    fogNear:          40,
    fogFar:           180,
    skyColor:         0x07050e,   // near-black violet sky
    ambientColor:     0x0d0a18,   // cold violet ambient — night arriving
    ambientIntensity: 1.5,
    // The "moon" acts as the last sliver of western sunset — very low, orange
    moonColor:        0x883318,   // deep burnt-orange, almost red
    moonIntensity:    0.38,
    moonPosition:     { x: 140, y: 8, z: 80 },  // almost at the horizon, west
    showStars:        true,
    extraLights: [
      // Cold blue-violet from the east (Misty Mountains side) — dominant fill
      { color: 0x1a1240, intensity: 0.45, x: -100, y: 70, z: -60 },
      // Faint warm uplight from campfire — very local
      { color: 0xff5500, intensity: 0.10, x: -3, y: 1, z: -3 },
    ],
  },

  // ─── Terrain ───────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm = window.api_fbm;

    // Broad rolling moorland hills
    const roll  = fbm(x * 0.018, z * 0.018) * 6.5;
    // Fine surface roughness
    const rough = fbm(x * 0.07,  z * 0.07)  * 1.1;
    // Secondary undulation
    const wave  = fbm(x * 0.035, z * 0.035) * 2.8;

    // Western mountain wall — Misty Mountains rise steeply beyond x > +40
    // (player walks south along -Z; mountains are to the west, +X side)
    const ridgeDist = (x - 42) / 28.0;
    const ridgeMask = Math.max(0, ridgeDist);
    const ridge     = ridgeMask * ridgeMask * 30.0
                    + fbm(x * 0.025 + 5, z * 0.025 + 9) * ridgeMask * 7.0;

    // Shallow central vale suppresses height near x=0 (the road corridor)
    const valeMask = Math.max(0, 1.0 - Math.abs(x) / 13.0);
    const vale     = -valeMask * valeMask * 3.2;

    return roll + rough + wave + ridge + vale;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Dark, desaturated dusk palette. Vertex colors are kept dim —
    // the atmosphere and lights do the warmth, not the geometry.
    const height = vy;

    // Base: dark grey-green moorland (dead autumn grass)
    const grassR = lerp(0.10, 0.16, noise2d(vx * 0.06, vz * 0.06));
    const grassG = lerp(0.10, 0.15, noise2d(vx * 0.05, vz * 0.07));
    const grassB = lerp(0.07, 0.12, noise2d(vx * 0.08, vz * 0.04));

    // High ground: cold grey rock
    const rockR = lerp(0.18, 0.24, noise2d(vx * 0.04, vz * 0.03));
    const rockG = lerp(0.17, 0.22, noise2d(vx * 0.05, vz * 0.05));
    const rockB = lerp(0.20, 0.27, noise2d(vx * 0.03, vz * 0.04));

    // Vale floor: boggy dark earth
    const earthR = lerp(0.07, 0.11, noise2d(vx * 0.09, vz * 0.09));
    const earthG = lerp(0.07, 0.10, noise2d(vx * 0.07, vz * 0.08));
    const earthB = lerp(0.05, 0.09, noise2d(vx * 0.10, vz * 0.06));

    const rockBlend  = Math.min(1, Math.max(0, (height - 6) / 7.0));
    const earthBlend = Math.min(1, Math.max(0, 1.0 - Math.abs(vx) / 10.0))
                     * Math.min(1, Math.max(0, (4 - height) / 3.5));

    let r = lerp(grassR, rockR,  rockBlend);
    let g = lerp(grassG, rockG,  rockBlend);
    let b = lerp(grassB, rockB,  rockBlend);

    r = lerp(r, earthR, earthBlend);
    g = lerp(g, earthG, earthBlend);
    b = lerp(b, earthB, earthBlend);

    return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
  },

  // ─── Path ──────────────────────────────────────────────────────────────────
  // Player walks SOUTH (-Z) from Rivendell toward Moria.
  // Waypoints run from +Z (north, Rivendell end) to -Z (south, Moria end).
  // Gentle S-curve — the old Elvish road wound around the hills.

  onPath(x, z) {
    const progress   = (z + 70) / 140.0;  // 0 at z=-70, 1 at z=+70
    const centreline = Math.sin(progress * Math.PI) * 3.5;
    const dx         = x - centreline;
    const t          = 1.0 - Math.min(1, Math.abs(dx) / 2.5);
    return t * t;
  },

  pathWaypoints: [
    [  0.0,   70],   // north end — arriving from / leaving to Rivendell
    [  1.5,   45],
    [  3.0,   20],
    [  3.2,    0],   // campfire area
    [  2.0,  -20],
    [  0.8,  -45],
    [  0.0,  -68],   // south end — toward Moria Doors
  ],

  // ─── Lore points ───────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 8, z: 32 },
      radius: 6,
      text:   '"Hollin, Hollin, I hear the stones lament. Deep they delved us, fair they wrought us, high they builded us; but they are gone."',
      cite:   '— The Fellowship of the Ring, Book II',
    },
    {
      pos:    { x: -12, z: 8 },
      radius: 5,
      text:   '"They dwelt here once, Elves of the Middle Days; and here they wrought the rings of power, and here their joy came to an end."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: 14, z: -28 },
      radius: 6,
      text:   '"The land is silent. Even the birds are hushed, and the sky holds its breath as the Misty Mountains gather the dark."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: -6, z: -50 },
      radius: 5,
      text:   '"Regret, Pippin. They passed these hills ten thousand years ago. They lived here once, and the land knew them."',
      cite:   '— Legolas, The Fellowship of the Ring',
    },
    {
      pos:    { x: 2, z: -5 },
      radius: 4,
      text:   '"By the small fire they kept, none spoke for a long while. The Red Eye was ever in their thought."',
      cite:   '— Companion lore',
    },
  ],

  // ─── Player start and arrivals ─────────────────────────────────────────────
  // Arriving from Rivendell (north): player spawns at north edge, faces south.
  // yaw: Math.PI = facing south (-Z → +Z convention: south is Math.PI)
  start: { x: 0, z: 65, yaw: Math.PI },

  arrivals: {
    rivendell:  { x: 0, z:  65, yaw: Math.PI },       // from north, walk south
    moriadoors: { x: 0, z: -65, yaw: 0 },             // from south, walk north
  },

  // ─── Boundary and transitions ──────────────────────────────────────────────
  boundary: 88,

  transitions: [
    {
      trigger: { x: 0, z:  78, radius: 9 },
      to: 'rivendell',
    },
    {
      trigger: { x: 0, z: -78, radius: 9 },
      to: 'moriadoors',
    },
  ],

  // ─── Walkable elevated surfaces ────────────────────────────────────────────
  walkables: [
    // Elvish terrace — flat slab east of road near z=18
    { x: -10, z: 18, yaw: Math.PI * 0.5, length: 10, width: 5, yStart: 1.8, yEnd: 1.8 },
    // Stair up to terrace
    { x:  -6, z: 18, yaw: Math.PI * 0.5, length: 4,  width: 3, yStart: 0.2, yEnd: 1.8 },
    // Remnant Elvish pavement section
    { x:   2, z: -8, yaw: 0,             length: 12, width: 4, yStart: 0.6, yEnd: 0.6 },
  ],

  // ─── Build scene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    function addMesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.scale.set(sx, sy, sz);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ─────────────────────────────────────────────────────────────
    const mossyStone = new THREE.MeshStandardMaterial({ color: 0x353028, roughness: 0.95 });
    const darkStone  = new THREE.MeshStandardMaterial({ color: 0x242018, roughness: 0.98 });
    const slateStone = new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.92 });
    const elvishStn  = new THREE.MeshStandardMaterial({ color: 0x48423c, roughness: 0.88, metalness: 0.03 });
    const ashMat     = new THREE.MeshLambertMaterial({ color: 0x1a1814 });
    const mistMat    = new THREE.MeshStandardMaterial({
      color: 0x18122a, transparent: true, opacity: 0.13,
      roughness: 1.0, depthWrite: false,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MISTY MOUNTAINS — west side (+X), flat ridge boxes buried deep
    // Wide flat-topped forms read as a distant mountain wall, not cones.
    // Extreme burial ensures no floating base; dark near-black so they
    // silhouette against the violet sky.
    // ─────────────────────────────────────────────────────────────────────────
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x080610, roughness: 1.0 });

    // Each ridge: a wide squashed box. rb = half-width at base (x), h = height,
    // depth = extent along Z. Buried to gy - h*burialFrac so base is below terrain.
    const ridges = [
      { x:  76, z: -65, w: 28, h: 52, d: 22 },
      { x:  80, z: -38, w: 24, h: 62, d: 18 },
      { x:  74, z: -10, w: 30, h: 48, d: 25 },
      { x:  82, z:  18, w: 22, h: 58, d: 20 },
      { x:  78, z:  44, w: 26, h: 44, d: 22 },
      { x:  72, z: -52, w: 20, h: 40, d: 16 },
      { x:  86, z:   2, w: 18, h: 55, d: 15 },
    ];

    ridges.forEach(({ x, z, w, h, d }, i) => {
      // Clamp x so groundY lookup stays within boundary
      const sampleX = Math.min(86, x);
      const gy = groundY(sampleX, z);
      // Bury the box so its midpoint is well below terrain surface
      const geo = new THREE.BoxGeometry(w, h, d);
      addMesh(geo, mountainMat, x, gy + h * 0.28, z, 0, i * 0.18, 0);
    });

    // Narrow peak spires on top of select ridges — CylinderGeometry,
    // buried into the ridge box so only the tip protrudes
    const spireData = [
      { x:  78, z: -38, h: 28, rb: 5, rt: 0.6 },
      { x:  72, z: -10, h: 24, rb: 4, rt: 0.8 },
      { x:  80, z:  18, h: 32, rb: 6, rt: 0.5 },
    ];
    spireData.forEach(({ x, z, h, rb, rt }, i) => {
      const sampleX = Math.min(86, x);
      const gy = groundY(sampleX, z);
      const geo = new THREE.CylinderGeometry(rt, rb, h, 9);
      // Place so bottom third is inside the ridge box
      addMesh(geo, mountainMat, x, gy + h * 0.28 + 26 + h * 0.35, z, 0, i * 0.5, 0);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SCATTERED BOULDERS — moorland debris
    // Mountains are on +X (west) side; boulders scattered across the vale.
    // ─────────────────────────────────────────────────────────────────────────
    const boulderData = [
      // east of road (negative X side)
      [-18,  36, 4.0], [-22,  18, 3.2], [-16,   8, 2.5],
      [-24, -18, 5.0], [-20, -30, 3.6], [-28, -44, 4.4],
      [-15, -58, 2.8],
      // west of road (positive X side, not too close to mountain zone)
      [ 16,  40, 3.2], [ 20,  24, 4.1], [ 14,   6, 2.6],
      [ 22, -20, 5.1], [ 18, -34, 3.4],
      // mid-field
      [-10,  52, 2.2], [ 10,  54, 2.9],
      [ -8, -64, 2.7], [  8, -60, 3.3],
    ];

    boulderData.forEach(([bx, bz, r], i) => {
      const gy  = groundY(bx, bz);
      const mat = (i % 3 === 0) ? mossyStone : darkStone;
      addMesh(new THREE.SphereGeometry(r, 10, 7), mat,
        bx, gy + r * 0.45, bz, 0.1 * Math.sin(i), i * 1.37, 0);
      // Small rubble cluster
      if (i % 2 === 0) {
        [0.9, -0.7].forEach((dx, j) => {
          const sr  = 0.28 + j * 0.12;
          const rgy = groundY(bx + dx, bz + 0.5);
          addMesh(new THREE.SphereGeometry(sr, 8, 6), darkStone,
            bx + dx, rgy + sr * 0.3, bz + 0.5, 0, j * 1.8, 0);
        });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ELVISH RUINS
    // ─────────────────────────────────────────────────────────────────────────

    // ── Standing waystone (east of road, z ≈ 35) ─────────────────────────────
    {
      const bx = -9, bz = 35;
      const gy = groundY(bx, bz);
      const shaft = new THREE.CylinderGeometry(0.28, 0.38, 5.5, 9);
      addMesh(shaft, elvishStn, bx, gy + 5.5 * 0.5 - 5.5 * 0.22, bz, 0.04, 0.3, 0);
      addMesh(new THREE.CylinderGeometry(0.52, 0.30, 0.45, 9), slateStone,
        bx, gy + 5.5 - 5.5 * 0.22 + 0.22, bz, 0.04, 0.3, 0);
      addMesh(new THREE.BoxGeometry(1.1, 0.35, 1.1), mossyStone, bx, gy + 0.18, bz);
    }

    // ── Toppled waystone (west side, z ≈ 22) ─────────────────────────────────
    {
      const bx = 12, bz = 22;
      const gy = groundY(bx, bz);
      addMesh(new THREE.CylinderGeometry(0.25, 0.35, 4.0, 9), slateStone,
        bx, gy + 0.35, bz, 0, 0.8, Math.PI * 0.5 + 0.12);
    }

    // ── Low ruined wall (east side, z ≈ -25) ─────────────────────────────────
    {
      const wx = -16, wz = -25;
      const gy = groundY(wx, wz);
      addMesh(new THREE.BoxGeometry(8.0, 1.8, 0.9), mossyStone, wx, gy + 0.9 - 0.1, wz, 0, 0.06, 0);
      addMesh(new THREE.BoxGeometry(3.2, 0.9, 0.85), darkStone, wx + 4.5, gy + 0.45, wz + 0.3, 0.08, 0.15, 0.12);
      addMesh(new THREE.CylinderGeometry(0.5, 0.65, 2.4, 9), elvishStn,
        wx - 4.2, gy + 2.4 * 0.5 - 2.4 * 0.2, wz, 0, 0.2, 0);
      [[wx + 2, wz + 1.5, 0.35], [wx - 1, wz + 2, 0.28], [wx + 5.5, wz - 0.5, 0.40]].forEach(([rx, rz, sr], j) => {
        const rgy = groundY(rx, rz);
        addMesh(new THREE.SphereGeometry(sr, 8, 6), darkStone, rx, rgy + sr * 0.3, rz, 0, j * 1.2, 0);
      });
    }

    // ── Collapsed arch remnant (over road, z ≈ -8) ───────────────────────────
    {
      const ax = 3, az = -8;
      const gy = groundY(ax, az);
      addMesh(new THREE.CylinderGeometry(0.55, 0.72, 4.0, 9), mossyStone,
        ax + 3.5, gy + 4.0 * 0.5 - 4.0 * 0.2, az, 0, 0.1, 0);
      addMesh(new THREE.CylinderGeometry(0.50, 0.68, 3.6, 9), darkStone,
        ax - 3.2, gy + 0.5, az + 0.4, 0, 0.3, Math.PI * 0.5 + 0.2);
      addMesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), slateStone,
        ax - 0.5, gy + 0.4, az - 0.6, 0.2, 0.5, 0.15);
      addMesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), elvishStn,
        ax + 3.5, gy + 4.0 - 4.0 * 0.2 + 0.25, az, 0, 0.1, 0);
    }

    // ── Elvish terrace (walkable, east of road, z ≈ 18) ──────────────────────
    {
      const tx = -10, tz = 18, terY = 1.8;
      const gy = groundY(tx, tz);
      addMesh(new THREE.BoxGeometry(5.0, 0.3, 10.0), elvishStn, tx, gy + terY - 0.15, tz);
      [-4.8, 4.8].forEach(dz =>
        addMesh(new THREE.BoxGeometry(5.0, 0.35, 0.4), mossyStone, tx, gy + terY + 0.17, tz + dz));
      for (let s = 0; s < 4; s++) {
        const stepX = tx + 2.5 - 0.6 * s;
        const stepH = (terY / 4) * (s + 1);
        addMesh(new THREE.BoxGeometry(0.58, 0.2, 3.0), elvishStn, stepX, gy + stepH, tz);
      }
      addMesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 9), elvishStn,
        tx - 2.3, gy + terY + 1.2 * 0.5 - 1.2 * 0.2, tz + 4.5);
    }

    // ── Remnant paved road section (walkable, z ≈ -8) ────────────────────────
    {
      const px = 2, pz = -8;
      const gy = groundY(px, pz);
      addMesh(new THREE.BoxGeometry(4.0, 0.2, 12.0), slateStone, px, gy + 0.55, pz);
      [[ 2.2, -5], [ 2.4, 0], [ 2.1, 4]].forEach(([dx, dz]) =>
        addMesh(new THREE.BoxGeometry(0.6, 0.18, 1.8), darkStone, px + dx, gy + 0.54, pz + dz, 0, 0.1, 0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CAMPFIRE — Weathertop-style sprite flames + particle embers
    // Position: just west of road centre, sheltered, z ≈ -3
    // ─────────────────────────────────────────────────────────────────────────
    const fireX = 3, fireZ = -3;
    const fireBase = groundY(fireX, fireZ) + 0.12;

    // Fire light — matching Weathertop intensities
    const fireLight = new THREE.PointLight(0xff6820, 7.0, 13, 2);
    fireLight.position.set(fireX, fireBase + 1.0, fireZ);
    fireLight.castShadow = true;
    fireLight.shadow.mapSize.set(512, 512);
    scene.add(fireLight);

    const fireFill = new THREE.PointLight(0xff4400, 0.5, 18, 2);
    fireFill.position.set(fireX, fireBase + 0.5, fireZ);
    scene.add(fireFill);

    // Campfire stones — same angle/radius array as Weathertop
    [
      [0.0, 0.55, 0.18], [0.85, 0.68, 0.22], [1.9, 0.56, 0.15], [2.8, 0.63, 0.20],
      [3.9, 0.48, 0.25], [4.8, 0.70, 0.16],  [5.6, 0.58, 0.21], [6.3, 0.43, 0.14],
    ].forEach(([a, r, sr]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(sr, 10, 7), MAT.STONE);
      m.position.set(fireX + Math.cos(a) * r, fireBase + sr * 0.55, fireZ + Math.sin(a) * r);
      m.scale.y = 0.7 + Math.random() * 0.3;
      m.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
      scene.add(m);
    });

    // Log cross
    for (let i = 0; i < 2; i++) {
      const l = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 1.0, 6),
        new THREE.MeshLambertMaterial({ color: 0x2a1a0c }),
      );
      l.position.set(fireX, fireBase + 0.14, fireZ);
      l.rotation.z = Math.PI / 2;
      l.rotation.y = i * Math.PI / 2;
      scene.add(l);
    }

    // Flame sprites
    function makeFlameTexture(c1, c2) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 40, 2, 32, 32, 30);
      g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }

    const flameCfgs = [
      { tex: makeFlameTexture('rgba(255,240,180,0.95)', 'rgba(255,100,10,0.6)'),  sz: 1.1,  speed: 1.2, phase: 0   },
      { tex: makeFlameTexture('rgba(255,160,30,0.85)',  'rgba(200,40,0,0.4)'),    sz: 0.85, speed: 0.9, phase: 1   },
      { tex: makeFlameTexture('rgba(255,200,80,0.7)',   'rgba(180,60,0,0.2)'),    sz: 1.3,  speed: 1.5, phase: 2.1 },
    ];

    const flames = flameCfgs.map(cfg => {
      const mat = new THREE.SpriteMaterial({
        map: cfg.tex, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const sp = new THREE.Sprite(mat);
      sp.position.set(fireX, fireBase + cfg.sz * 0.5, fireZ);
      sp.scale.set(cfg.sz, cfg.sz * 1.6, 1);
      sp.userData = { baseY: sp.position.y, ...cfg };
      scene.add(sp);
      return sp;
    });

    // Ember particles
    const EC = 120;
    const eGeo = new THREE.BufferGeometry();
    const ePOS = new Float32Array(EC * 3);
    const eVEL = [];
    const eLIF = new Float32Array(EC);

    function resetEmber(i) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.3;
      ePOS[i * 3]     = fireX + Math.cos(a) * r;
      ePOS[i * 3 + 1] = fireBase + 0.4 + Math.random() * 0.3;
      ePOS[i * 3 + 2] = fireZ + Math.sin(a) * r;
      eVEL[i] = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        1.2 + Math.random() * 1.8,
        (Math.random() - 0.5) * 0.5,
      );
      eLIF[i] = Math.random();
    }
    for (let i = 0; i < EC; i++) resetEmber(i);

    eGeo.setAttribute('position', new THREE.BufferAttribute(ePOS, 3));
    const eMat = new THREE.PointsMaterial({
      color: 0xffaa22, size: 0.08, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const emberPoints = new THREE.Points(eGeo, eMat);
    scene.add(emberPoints);

    // ─────────────────────────────────────────────────────────────────────────
    // GROUND MIST
    // ─────────────────────────────────────────────────────────────────────────
    const mistGeo  = new THREE.PlaneGeometry(28, 140);
    const mistMesh = new THREE.Mesh(mistGeo, mistMat);
    mistMesh.rotation.x = -Math.PI / 2;
    mistMesh.position.set(2, groundY(0, 0) + 0.4, 0);
    mistMesh.receiveShadow = false;
    scene.add(mistMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // GRASS TUFTS
    // ─────────────────────────────────────────────────────────────────────────
    const tuftMat = new THREE.MeshStandardMaterial({ color: 0x1e1a10, roughness: 1.0 });
    [[-6,48],[8,50],[-12,30],[14,28],[-9,15],[11,-5],[-7,-22],[13,-38],[-5,-50]].forEach(([tx,tz],i) => {
      for (let b = 0; b < 4; b++) {
        const bx = tx + (Math.random() - 0.5) * 1.8;
        const bz = tz + (Math.random() - 0.5) * 1.8;
        const h  = 0.55 + Math.random() * 0.45;
        const bg = groundY(bx, bz);
        addMesh(new THREE.CylinderGeometry(0.03, 0.06, h, 5), tuftMat,
          bx, bg + h * 0.5 - h * 0.1, bz, (Math.random()-0.5)*0.3, Math.random()*Math.PI, 0);
      }
    });

    return { fireLight, fireFill, flames, emberPoints, eGeo, ePOS, eVEL, eLIF, resetEmber, mistMesh, EC };
  },

  // ─── On Frame ──────────────────────────────────────────────────────────────
  onFrame(t, dt, refs) {
    if (!refs) return;
    const { fireLight, fireFill, flames, emberPoints, eGeo, ePOS, eVEL, eLIF, resetEmber, mistMesh, EC } = refs;

    // Fire flicker
    const flicker = 1.0 + Math.sin(t * 7.3) * 0.22 + Math.sin(t * 13.1) * 0.10 + Math.sin(t * 3.7) * 0.08;
    if (fireLight) fireLight.intensity = 7.0 * flicker;
    if (fireFill)  fireFill.intensity  = 0.5 * (0.9 + Math.sin(t * 9.7) * 0.15);

    // Flame sprite animation — matching Weathertop pattern
    if (flames) {
      flames.forEach(sp => {
        if (!sp) return;
        const { baseY, speed, phase, sz } = sp.userData;
        const s = 0.85 + Math.sin(t * speed * 6.0 + phase) * 0.18;
        sp.scale.set(sz * s, sz * s * 1.6, 1);
        sp.position.y = baseY + Math.sin(t * speed * 4.0 + phase) * 0.05;
      });
    }

    // Ember particle update
    if (emberPoints && eGeo && ePOS && eVEL && eLIF) {
      const dtCap = Math.min(dt, 0.05);
      for (let i = 0; i < EC; i++) {
        eLIF[i] -= dtCap * 0.6;
        if (eLIF[i] <= 0) { resetEmber(i); continue; }
        ePOS[i * 3]     += eVEL[i].x * dtCap;
        ePOS[i * 3 + 1] += eVEL[i].y * dtCap;
        ePOS[i * 3 + 2] += eVEL[i].z * dtCap;
        eVEL[i].y       -= 0.3 * dtCap; // gentle gravity
      }
      eGeo.attributes.position.needsUpdate = true;
    }

    // Mist breath
    if (mistMesh) mistMesh.material.opacity = 0.10 + Math.sin(t * 0.4) * 0.02;
  },

};

window.Eregion = Eregion;
