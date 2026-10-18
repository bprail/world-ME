// eregion.js — Eregion, Land of the Ring-makers
// Sequence: rivendell <-> eregion <-> moria (entrance)
// Time: dusk — amber last-light fading into violet dark

const Eregion = {

  name:     'Eregion',
  subtitle: 'Land of the Ring-makers · The Forgotten Realm',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  // Dusk: sky bleeding from deep violet overhead to bruised amber at the
  // horizon. Fog is linear — the valley floor holds a ground mist but the
  // distant Misty Mountains are still dimly visible as silhouettes.
  atmosphere: {
    fogColor:         0x2a1a0e,   // warm dusty amber ground-mist
    fogType:          'linear',
    fogNear:          55,
    fogFar:           240,
    skyColor:         0x0d0810,   // deep indigo-violet overhead
    ambientColor:     0x1a0e08,   // warm dusky amber ambient
    ambientIntensity: 1.6,
    moonColor:        0xc87030,   // setting sun — low orange-red wash
    moonIntensity:    0.55,
    moonPosition:     { x: 120, y: 18, z: 60 },  // low in the west, behind player
    showStars:        true,       // first stars appearing at dusk
    extraLights: [
      // Cold violet from the east — the night arriving from the Misty Mountains
      { color: 0x2a1840, intensity: 0.35, x: -90, y: 60,  z: -80 },
      // Warm campfire fill — low, flickering approximated by a static fill
      { color: 0xff6010, intensity: 0.18, x: 0,   y: 2,   z: -10 },
    ],
  },

  // ─── Terrain ───────────────────────────────────────────────────────────────
  // Rolling moorland: gentle FBM hills with a broad shallow vale through
  // the centre (the old Elvish road). The eastern edge climbs steeply toward
  // the Misty Mountains backdrop.

  hillHeight(x, z) {
    const fbm = window.api_fbm;
    const n   = window.api_noise2d;

    // Broad rolling hills — medium-frequency FBM
    const roll  = fbm(x * 0.018, z * 0.018) * 7.0;
    // Fine surface detail
    const rough = fbm(x * 0.07,  z * 0.07)  * 1.2;
    // Secondary undulation
    const wave  = fbm(x * 0.035, z * 0.035) * 3.0;

    // Eastern mountain wall — rises steeply toward -X
    // The Misty Mountains are west in lore but we place them as a backdrop
    // to the north/east so the player walks toward them en-route to Moria.
    // backdrop ridge at roughly x < -40
    const ridgeDist = (-x - 40) / 30.0;          // positive when east of x=-40
    const ridgeMask = Math.max(0, ridgeDist);
    const ridge     = ridgeMask * ridgeMask * 28.0
                    + fbm(x * 0.025 + 5, z * 0.025 + 9) * ridgeMask * 8.0;

    // Shallow central vale along the road (z-axis corridor)
    // Gently suppresses height within ~12 units of x=0
    const valeMask  = Math.max(0, 1.0 - Math.abs(x) / 14.0);
    const vale      = -valeMask * valeMask * 3.5;

    return roll + rough + wave + ridge + vale;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Moorland palette — Eregion was once beautiful but long untended.
    // Tawny autumn grass, dark earth, grey-green lichen on old stone.
    const height = vy;

    // Base moorland grass — amber-tawny
    const grassR = lerp(0.20, 0.34, noise2d(vx * 0.06, vz * 0.06));
    const grassG = lerp(0.18, 0.28, noise2d(vx * 0.05, vz * 0.07));
    const grassB = lerp(0.05, 0.10, noise2d(vx * 0.08, vz * 0.04));

    // Rock / high ground — grey with faint purple (dusky light)
    const rockR = lerp(0.25, 0.32, noise2d(vx * 0.04, vz * 0.03));
    const rockG = lerp(0.22, 0.28, noise2d(vx * 0.05, vz * 0.05));
    const rockB = lerp(0.22, 0.30, noise2d(vx * 0.03, vz * 0.04));

    // Dark boggy earth in the vale
    const earthR = lerp(0.10, 0.16, noise2d(vx * 0.09, vz * 0.09));
    const earthG = lerp(0.09, 0.13, noise2d(vx * 0.07, vz * 0.08));
    const earthB = lerp(0.04, 0.08, noise2d(vx * 0.10, vz * 0.06));

    // Blend by height
    const rockBlend  = Math.min(1, Math.max(0, (height - 6)  / 8.0));
    const earthBlend = Math.min(1, Math.max(0, 1.0 - Math.abs(vx) / 10.0))
                     * Math.min(1, Math.max(0, (4 - height) / 3.0));

    let r = lerp(grassR, rockR,  rockBlend);
    let g = lerp(grassG, rockG,  rockBlend);
    let b = lerp(grassB, rockB,  rockBlend);

    r = lerp(r, earthR, earthBlend);
    g = lerp(g, earthG, earthBlend);
    b = lerp(b, earthB, earthBlend);

    // Dusk golden tint across the terrain — subtle warm overlay
    r += 0.03;
    g += 0.015;

    return [
      Math.min(1, r),
      Math.min(1, g),
      Math.min(1, b),
    ];
  },

  // ─── Path ──────────────────────────────────────────────────────────────────
  // The old Elvish road through Eregion — worn but still faintly visible.
  // Winds gently to feel like an ancient track, not a modern road.

  onPath(x, z) {
    // Spline approximation: slight westward curve in the middle,
    // to avoid a dead-straight Roman road feel.
    const progress  = (z + 70) / 140.0;          // 0 at z=-70, 1 at z=70
    const centreline = Math.sin(progress * Math.PI) * -4.0;  // gentle S-bend
    const dx        = x - centreline;
    const halfW     = 2.5;
    const t         = 1.0 - Math.min(1, Math.abs(dx) / halfW);
    return t * t;
  },

  pathWaypoints: [
    [  0.0,   70],   // south — arriving from Rivendell (transition edge)
    [ -1.0,   45],
    [ -2.5,   20],
    [ -3.5,    0],   // campfire area — gentle bend
    [ -2.0,  -20],
    [ -1.0,  -45],
    [  0.0,  -68],   // north — toward Moria entrance (transition edge)
  ],

  // ─── Lore points ───────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: -8, z: 30 },
      radius: 6,
      text:   '"Hollin, Hollin, I hear the stones lament. Deep they delved us, fair they wrought us, high they builded us; but they are gone."',
      cite:   '— The Fellowship of the Ring, Book II',
    },
    {
      pos:    { x: 12, z: 5 },
      radius: 5,
      text:   '"Here of old was the land of the Elves, the craftsmen of the Second Age who gave their skill to Celebrimbor\'s dream, and in dreaming were undone."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: -5, z: -30 },
      radius: 6,
      text:   '"The land is silent. Even the birds are hushed, and the sky holds its breath as the Misty Mountains gather the dark."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: 18, z: -50 },
      radius: 5,
      text:   '"Regret, Pippin. They passed these hills ten thousand years ago. They lived here once, and the land knew them."',
      cite:   '— Legolas, The Fellowship of the Ring',
    },
    {
      pos:    { x: -3, z: -10 },
      radius: 4,
      text:   '"By the small fire they kept, none spoke for a long while. The Red Eye was ever in their thought."',
      cite:   '— Companion lore',
    },
  ],

  // ─── Player start and arrivals ─────────────────────────────────────────────
  start: { x: 0, z: 60, yaw: 0 },    // facing north, toward Moria

  arrivals: {
    rivendell: { x:  0, z:  65, yaw: 0 },          // walking in from the south
    moria:     { x:  0, z: -65, yaw: Math.PI },     // turning back from Moria gate
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
      to: 'moria',
    },
  ],

  // ─── Walkable elevated surfaces ────────────────────────────────────────────
  // A crumbled Elvish waystone terrace beside the road (~z = 15).
  // A low ruined lintel arch over the road near the campfire area.
  walkables: [
    // Waystone terrace — flat elevated slab, slightly off-road to the east
    { x: 10, z: 18, yaw: Math.PI * 0.5, length: 10, width: 5, yStart: 1.8, yEnd: 1.8 },

    // Crumbled stair up to the terrace from road level
    { x: 6,  z: 18, yaw: Math.PI * 0.5, length: 4,  width: 3, yStart: 0.2, yEnd: 1.8 },

    // Remnant pavement — flat section of old Elvish road, slightly raised
    { x: -1, z: -8, yaw: 0, length: 12, width: 4, yStart: 0.6, yEnd: 0.6 },
  ],

  // ─── Build scene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    // ── Helpers ──────────────────────────────────────────────────────────────
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    function addMesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.scale.set(sx, sy, sz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ─────────────────────────────────────────────────────────────
    const mossyStone = new THREE.MeshStandardMaterial({
      color:     0x3a3a32,
      roughness: 0.95,
      metalness: 0.0,
    });

    const darkStone = new THREE.MeshStandardMaterial({
      color:     0x2a2820,
      roughness: 0.98,
      metalness: 0.0,
    });

    const weatheredSlate = new THREE.MeshStandardMaterial({
      color:     0x4a4438,
      roughness: 0.92,
      metalness: 0.0,
    });

    // Campfire embers — deep orange
    const emberMat = new THREE.MeshStandardMaterial({
      color:     0xff4400,
      emissive:  0xff2200,
      emissiveIntensity: 1.8,
      roughness: 1.0,
    });

    // Flame — bright orange-yellow
    const flameMat = new THREE.MeshStandardMaterial({
      color:     0xff8800,
      emissive:  0xff6600,
      emissiveIntensity: 2.5,
      roughness: 1.0,
      transparent: true,
      opacity: 0.85,
    });

    // Ash / char
    const ashMat = new THREE.MeshStandardMaterial({
      color:     0x1a1814,
      roughness: 1.0,
    });

    // Elvish carved stone — slightly lighter, hinting at old craft
    const elvishStone = new THREE.MeshStandardMaterial({
      color:     0x5a5248,
      roughness: 0.88,
      metalness: 0.03,
    });

    // Ground mist plane — translucent low fog
    const mistMat = new THREE.MeshStandardMaterial({
      color:       0x3a2a18,
      transparent: true,
      opacity:     0.12,
      roughness:   1.0,
      depthWrite:  false,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SCATTERED BOULDERS — moorland debris across the valley floor
    // ─────────────────────────────────────────────────────────────────────────
    const boulderPositions = [
      // west side scatter
      [-18,  38, 4.2], [-22,  20, 3.1], [-15,  10, 2.4],
      [-25, -15, 5.1], [-19, -28, 3.8], [-28, -40, 4.5],
      [-14, -55, 2.9],
      // east side scatter
      [ 20,  42, 3.3], [ 24,  25, 4.0], [ 18,   8, 2.7],
      [ 26, -18, 5.2], [ 22, -32, 3.5], [ 30, -45, 4.8],
      [ 16, -60, 2.6],
      // mid-field
      [-10,  52, 2.2], [ 12,  55, 3.0],
      [ -8, -65, 2.8], [ 10, -62, 3.4],
    ];

    boulderPositions.forEach(([bx, bz, r], i) => {
      const gy    = groundY(bx, bz);
      const yOff  = gy + r * 0.45;
      const mat   = (i % 3 === 0) ? mossyStone : darkStone;
      const geo   = new THREE.SphereGeometry(r, 10, 7);
      const ry    = i * 1.37;
      addMesh(geo, mat, bx, yOff, bz, 0.1 * Math.sin(i), ry, 0.05 * i);
    });

    // Small rubble chunks around boulders
    const rubbleSeeds = [
      [-20, 36], [-16, 39], [-24, 22], [22, 26], [19, 10],
      [-26, -17], [24, -33], [-20, -42], [28, -47],
    ];
    rubbleSeeds.forEach(([rx2, rz2], i) => {
      const r   = 0.3 + (i % 4) * 0.15;
      const gy  = groundY(rx2, rz2);
      const geo = new THREE.SphereGeometry(r, 8, 6);
      addMesh(geo, darkStone, rx2, gy + r * 0.3, rz2, 0, i * 0.9, 0);
      // second piece nearby
      addMesh(geo, mossyStone, rx2 + 0.8, gy + r * 0.25, rz2 - 0.6, 0.2, i * 1.4, 0.1);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // RUINED ELVISH STRUCTURES
    // ─────────────────────────────────────────────────────────────────────────

    // ── Waystone / standing stone pillar (east of road, z≈ 35) ───────────────
    // Tall, tapered — the Elvish habit of elegant uprights
    {
      const bx = 8, bz = 35;
      const gy = groundY(bx, bz);
      // Main shaft — tall cylinder, slightly tapered
      const shaft = new THREE.CylinderGeometry(0.28, 0.38, 5.5, 9);
      addMesh(shaft, elvishStone, bx, gy + 5.5 / 2 - 5.5 * 0.22, bz, 0.04, 0.3, 0);
      // Cap stone
      const cap = new THREE.CylinderGeometry(0.55, 0.32, 0.45, 9);
      addMesh(cap, weatheredSlate, bx, gy + 5.5 - 5.5 * 0.22 + 0.22, bz, 0.04, 0.3, 0);
      // Base slab
      const base = new THREE.BoxGeometry(1.1, 0.35, 1.1);
      addMesh(base, mossyStone, bx, gy + 0.18, bz);
    }

    // ── Second broken waystone (toppled, west side, z≈ 22) ───────────────────
    {
      const bx = -12, bz = 22;
      const gy = groundY(bx, bz);
      // Fallen shaft — horizontal, slightly tilted
      const shaft = new THREE.CylinderGeometry(0.25, 0.35, 4.2, 9);
      addMesh(shaft, weatheredSlate, bx, gy + 0.35, bz, 0, 0.8, Math.PI * 0.5 + 0.12);
    }

    // ── Ruined wall segment (east side, z ≈ -25) ─────────────────────────────
    // Low remnant — three courses of Elvish ashlar, partially collapsed
    {
      const wx = 16, wz = -25;
      const gy = groundY(wx, wz);
      // Main wall body — long low box
      const wall = new THREE.BoxGeometry(8.0, 1.8, 0.9);
      addMesh(wall, mossyStone, wx, gy + 0.9 - 0.1, wz, 0, 0.06, 0);
      // Tumbled section — shorter, lower
      const tumble = new THREE.BoxGeometry(3.2, 0.9, 0.85);
      addMesh(tumble, darkStone, wx + 4.5, gy + 0.45, wz + 0.3, 0.08, 0.15, 0.12);
      // Corner buttress remnant
      const butt = new THREE.CylinderGeometry(0.5, 0.65, 2.4, 9);
      addMesh(butt, elvishStone, wx - 4.2, gy + 2.4 / 2 - 2.4 * 0.2, wz, 0, 0.2, 0);
      // Scattered rubble from wall
      [[wx + 2, wz + 1.5], [wx - 1, wz + 2], [wx + 5.5, wz - 0.5]].forEach(([rX, rZ], j) => {
        const rgy = groundY(rX, rZ);
        const r   = 0.35 + j * 0.1;
        addMesh(new THREE.SphereGeometry(r, 8, 6), darkStone, rX, rgy + r * 0.3, rZ, 0, j * 1.2, 0);
      });
    }

    // ── Collapsed archway remnant (over the road, z ≈ -8) ────────────────────
    // One pier standing, one fallen — the arch never closes now
    {
      const ax = -4, az = -8;
      const gy = groundY(ax, az);
      // Standing east pier
      const pier1 = new THREE.CylinderGeometry(0.55, 0.72, 4.0, 9);
      addMesh(pier1, mossyStone, ax + 3.5, gy + 4.0 / 2 - 4.0 * 0.2, az, 0, 0.1, 0);
      // Fallen west pier
      const pier2 = new THREE.CylinderGeometry(0.5, 0.68, 3.6, 9);
      addMesh(pier2, darkStone, ax - 3.2, gy + 0.5, az + 0.4, 0, 0.3, Math.PI * 0.5 + 0.2);
      // Keystone block on the ground
      const key = new THREE.BoxGeometry(1.4, 0.8, 0.9);
      addMesh(key, weatheredSlate, ax - 0.5, gy + 0.4, az - 0.6, 0.2, 0.5, 0.15);
      // Capstone still atop standing pier
      const cap = new THREE.BoxGeometry(1.6, 0.5, 1.6);
      addMesh(cap, elvishStone, ax + 3.5, gy + 4.0 - 4.0 * 0.2 + 0.25, az, 0, 0.1, 0);
    }

    // ── Elvish terrace remnant (walkable, east of road, z ≈ 18) ──────────────
    // Visible geometry matching the walkable definition
    {
      const tx = 10, tz = 18;
      const gy = groundY(tx, tz);
      const terY = 1.8;
      // Terrace slab
      const slab = new THREE.BoxGeometry(5.0, 0.3, 10.0);
      addMesh(slab, elvishStone, tx, gy + terY - 0.15, tz);
      // Edge kerb stones along north and south
      [-4.8, 4.8].forEach((dz) => {
        const kerb = new THREE.BoxGeometry(5.0, 0.35, 0.4);
        addMesh(kerb, mossyStone, tx, gy + terY + 0.17, tz + dz);
      });
      // Stair up from road (west edge)
      for (let s = 0; s < 4; s++) {
        const stepW = 0.6;
        const stepX = tx - 2.5 + stepW * s;
        const stepH = (terY / 4) * (s + 1);
        const step  = new THREE.BoxGeometry(0.58, 0.2, 3.0);
        addMesh(step, elvishStone, stepX - 0.3, gy + stepH, tz);
      }
      // Small carved post at terrace corner
      const post = new THREE.CylinderGeometry(0.12, 0.16, 1.2, 9);
      addMesh(post, elvishStone, tx + 2.3, gy + terY + 1.2 / 2 - 1.2 * 0.2, tz + 4.5);
    }

    // ── Remnant paved road section (walkable, z ≈ -8) ─────────────────────────
    {
      const px = -1, pz = -8;
      const gy = groundY(px, pz);
      const slab = new THREE.BoxGeometry(4.0, 0.2, 12.0);
      addMesh(slab, weatheredSlate, px, gy + 0.55, pz);
      // Cracked edge pieces
      [[-2.2, -5], [-2.4, 0], [-2.1, 4]].forEach(([dx, dz]) => {
        const crack = new THREE.BoxGeometry(0.6, 0.18, 1.8);
        addMesh(crack, darkStone, px + dx, gy + 0.54, pz + dz, 0, 0.1, 0);
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CAMPFIRE — the Fellowship's small fire in the hollow
    // Position: just off the road, sheltered by boulders, z ≈ -3
    // ─────────────────────────────────────────────────────────────────────────

    const fireX = -3, fireZ = -3;
    const fireY = groundY(fireX, fireZ);

    // Fire pit — shallow depression outlined by stones
    const pitRing = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const angle = (i / 7) * Math.PI * 2;
      const r     = 1.05 + Math.sin(i * 2.3) * 0.12;
      const sx    = fireX + Math.cos(angle) * r;
      const sz    = fireZ + Math.sin(angle) * r;
      const sgy   = groundY(sx, sz);
      const sr    = 0.22 + Math.abs(Math.sin(i * 1.7)) * 0.12;
      const geo   = new THREE.SphereGeometry(sr, 10, 7);
      return addMesh(geo, mossyStone, sx, sgy + sr * 0.4, sz, 0, i * 0.9, 0);
    });

    // Ash bed
    const ashBed = new THREE.CylinderGeometry(0.85, 0.9, 0.12, 12);
    addMesh(ashBed, ashMat, fireX, fireY + 0.06, fireZ);

    // Log structure (two crossed logs)
    const logGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.8, 7);
    addMesh(logGeo, ashMat, fireX, fireY + 0.18, fireZ, 0, 0.4,  Math.PI * 0.5);
    addMesh(logGeo, ashMat, fireX, fireY + 0.22, fireZ, 0, 1.1,  Math.PI * 0.5);

    // Ember core
    const emberGeo = new THREE.SphereGeometry(0.28, 8, 6);
    const embers   = addMesh(emberGeo, emberMat, fireX, fireY + 0.32, fireZ);

    // Flame cones — three offset spires
    const flameGeo = new THREE.CylinderGeometry(0.0, 0.22, 0.9, 7);
    const flames = [
      addMesh(flameGeo, flameMat, fireX,        fireY + 0.7,  fireZ,        0, 0,    0),
      addMesh(flameGeo, flameMat, fireX + 0.18, fireY + 0.55, fireZ - 0.15, 0.15, 0.8, 0),
      addMesh(flameGeo, flameMat, fireX - 0.14, fireY + 0.52, fireZ + 0.18, -0.1, 1.7, 0.05),
    ];

    // ── Dynamic campfire light ─────────────────────────────────────────────
    const fireLight = new THREE.PointLight(0xff5500, 1.8, 28);
    fireLight.position.set(fireX, fireY + 1.0, fireZ);
    scene.add(fireLight);

    // Softer secondary fill — slightly cooler, offset
    const fireFill = new THREE.PointLight(0xff8822, 0.6, 18);
    fireFill.position.set(fireX + 1.5, fireY + 0.5, fireZ + 1.0);
    scene.add(fireFill);

    // ─────────────────────────────────────────────────────────────────────────
    // DISTANT MOUNTAIN SILHOUETTES — Misty Mountains to the east
    // Large dark ridge masses, too far to traverse — pure atmosphere
    // ─────────────────────────────────────────────────────────────────────────
    const mountainMat = new THREE.MeshStandardMaterial({
      color:     0x0d0b0e,
      roughness: 1.0,
      metalness: 0.0,
    });

    const peaks = [
      { x: -78, z: -70, h: 55, rb: 22, rt: 2 },
      { x: -70, z: -40, h: 62, rb: 18, rt: 1 },
      { x: -82, z: -20, h: 48, rb: 16, rt: 3 },
      { x: -75, z:  10, h: 58, rb: 20, rt: 2 },
      { x: -80, z:  40, h: 44, rb: 15, rt: 4 },
      { x: -68, z: -55, h: 40, rb: 14, rt: 2 },
      { x: -85, z:   0, h: 52, rb: 17, rt: 1 },
    ];

    peaks.forEach(({ x, z, h, rb, rt }, i) => {
      const gy  = groundY(Math.max(-87, x), z);
      const geo = new THREE.CylinderGeometry(rt, rb, h, 9);
      addMesh(geo, mountainMat, x, gy + h / 2 - h * 0.08, z, 0, i * 0.7, 0);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // GROUND MIST PLANE — low, translucent, in the vale only
    // ─────────────────────────────────────────────────────────────────────────
    const mistGeo = new THREE.PlaneGeometry(30, 140);
    const mistMesh = new THREE.Mesh(mistGeo, mistMat);
    // Find approximate vale floor height
    const valeFloorY = groundY(0, 0) + 0.4;
    mistMesh.rotation.x = -Math.PI / 2;
    mistMesh.position.set(-1, valeFloorY, 0);
    mistMesh.receiveShadow = false;
    scene.add(mistMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // TALL GRASS / REED TUFTS — scattered organic detail
    // ─────────────────────────────────────────────────────────────────────────
    const tufts = [
      [-6, 48], [8, 50], [-12, 30], [14, 28], [-9, 15],
      [11, -5], [-7, -22], [13, -38], [-5, -50],
    ];
    const tuftMat = new THREE.MeshStandardMaterial({ color: 0x2a2214, roughness: 1.0 });

    tufts.forEach(([tx, tz], i) => {
      const tgy = groundY(tx, tz);
      for (let b = 0; b < 4; b++) {
        const bx   = tx + (Math.random() - 0.5) * 1.8;
        const bz2  = tz + (Math.random() - 0.5) * 1.8;
        const h    = 0.6 + Math.random() * 0.5;
        const tilt = (Math.random() - 0.5) * 0.3;
        const geo  = new THREE.CylinderGeometry(0.03, 0.06, h, 5);
        const bg   = groundY(bx, bz2);
        addMesh(geo, tuftMat, bx, bg + h / 2 - h * 0.1, bz2, tilt, Math.random() * Math.PI, 0);
      }
    });

    // Return refs for onFrame
    return {
      fireLight,
      fireFill,
      flames,
      embers,
      mistMesh,
    };
  },

  // ─── On Frame ──────────────────────────────────────────────────────────────
  onFrame(t, dt, refs) {
    if (!refs) return;
    const { fireLight, fireFill, flames, embers, mistMesh } = refs;

    // Campfire flicker — layered sine waves for organic feeling
    const flicker1 = Math.sin(t * 7.3) * 0.22;
    const flicker2 = Math.sin(t * 13.1) * 0.10;
    const flicker3 = Math.sin(t * 3.7)  * 0.08;
    const flicker  = 1.0 + flicker1 + flicker2 + flicker3;

    if (fireLight) {
      fireLight.intensity = 1.8 * flicker;
      // Subtle position drift — fire breathes
      fireLight.position.y = fireLight.position.y + (Math.sin(t * 4.1) * 0.003);
    }
    if (fireFill) {
      fireFill.intensity = 0.6 * (0.9 + Math.sin(t * 9.7) * 0.15);
    }

    // Flame cone scale animation — individual flicker per flame
    if (flames) {
      flames.forEach((f, i) => {
        if (!f) return;
        const phase = t * 6.0 + i * 1.4;
        const s     = 0.85 + Math.sin(phase) * 0.18 + Math.sin(phase * 1.7) * 0.08;
        f.scale.set(1, s, 1);
        // Slight horizontal sway
        f.position.x += Math.sin(t * 5.1 + i * 2.1) * 0.001;
      });
    }

    // Embers pulse — slow deep breathing
    if (embers) {
      const ep = 0.7 + Math.sin(t * 2.1) * 0.3;
      embers.material.emissiveIntensity = ep * 1.8;
    }

    // Mist opacity — gentle slow pulse
    if (mistMesh) {
      mistMesh.material.opacity = 0.10 + Math.sin(t * 0.4) * 0.02;
    }
  },

};

window.Eregion = Eregion;
