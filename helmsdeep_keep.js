// helmsdeep_keep.js — Helm's Deep Inner Keep & Glittering Caves
// Sequence: helmsdeep <-> helmsdeep_keep <-> isengard
// Time: night, almost dawn — the battle has just ended

const InnerKeep = {

  name:     "The Hornburg",
  subtitle: "Inner Keep · Aglarond · Almost Dawn",

  // ─── Atmosphere ──────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x05070d,
    fogDensity:       0.011,
    fogType:          'exponential',
    skyColor:         0x030509,
    ambientColor:     0x090b12,
    ambientIntensity: 1.3,
    // Moon is low and setting — exhausted pale light from the west
    moonColor:        0x5566a0,
    moonIntensity:    0.35,
    moonPosition:     { x: -120, y: 60, z: 40 },
    showStars:        true,
    extraLights: [
      // First hint of dawn — the faintest warmth rising in the east
      { color: 0x1a0a04, intensity: 0.18, x: 80, y: 30, z: -80 },
      // Torch fill from the keep's south wall
      { color: 0x442208, intensity: 0.22, x: 0, y: 15, z: 20 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────
  // The keep sits on a great rock mass at the head of the gorge.
  // The cliff base curves around the back (north / -Z).
  // The valley floor is roughly flat near the gate (+Z side), then rises
  // steeply into the cliff face behind.
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // The great rock — a rounded slab the keep is built upon
    const rockMass = Math.max(0,
      3.5 - 0.012 * (x * x + (z + 10) * (z + 10))
    );

    // The cliff face at the north end — rises fast past z = -30
    const cliffDist = Math.max(0, -z - 25);
    const cliff     = cliffDist * 0.55 + cliffDist * cliffDist * 0.018;

    // Valley floor undulation — slight cobble feel
    const cobble = fbm(x * 0.18, z * 0.18) * 0.4
                 + fbm(x * 0.55, z * 0.55) * 0.15;

    // Rubble humps near the walls (+X / -X edges)
    const rubbleL = Math.max(0, 2.0 - 0.055 * Math.pow(x + 22, 2)) * 0.9;
    const rubbleR = Math.max(0, 2.0 - 0.055 * Math.pow(x - 22, 2)) * 0.9;

    // Slight ramp — ground rises toward the cave mouth at north end
    const ramp = Math.max(0, (-z - 5) * 0.045);

    return rockMass + cliff + cobble + rubbleL + rubbleR + ramp;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Stone flags, stained with battle smoke and old ash
    const n  = noise2d(vx * 0.12, vz * 0.12);
    const n2 = noise2d(vx * 0.42, vz * 0.42);

    // Base: dark charcoal-grey flagstone
    const r0 = 0.14, g0 = 0.13, b0 = 0.12;
    // Lighter band — worn limestone
    const r1 = 0.26, g1 = 0.24, b1 = 0.22;
    // Damp dark patches near cliff
    const r2 = 0.09, g2 = 0.09, b2 = 0.10;

    const cliffBlend = Math.max(0, Math.min(1, (-vz - 25) * 0.07));
    let r = lerp(lerp(r0, r1, n), r2, cliffBlend);
    let g = lerp(lerp(g0, g1, n), g2, cliffBlend);
    let b = lerp(lerp(b0, b1, n), b2, cliffBlend);

    // Slight warm smear — fire stains from the battle
    const soot = Math.max(0, noise2d(vx * 0.22 + 3, vz * 0.22) - 0.6) * 2.5;
    r += soot * 0.06; g += soot * 0.03;

    return [
      Math.min(1, Math.max(0, r + (n2 - 0.5) * 0.03)),
      Math.min(1, Math.max(0, g + (n2 - 0.5) * 0.025)),
      Math.min(1, Math.max(0, b)),
    ];
  },

  // Path: from the battle gate (+Z) → keep courtyard → cave mouth (-Z)
  onPath(x, z) {
    const lerp = window.api_lerp;
    // Central corridor through the courtyard
    const dx   = Math.abs(x);
    const dist = Math.max(0, dx - 2.0);
    return Math.max(0, 1 - dist * 0.55);
  },

  pathWaypoints: [
    [  0,  68 ],   // approaching from the battle gate
    [  0,  40 ],
    [  2,  18 ],
    [  0,   0 ],   // courtyard centre
    [ -1, -15 ],
    [  0, -32 ],   // toward cave mouth
    [  0, -52 ],   // into the cave passage
  ],

  // ─── Lore ─────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 20 },
      radius: 6,
      text:   '"The end will not be long… but I will not end here, taken like a badger in a trap. When dawn comes, I will bid men sound Helm's horn, and I will ride forth. Will you ride with me then, son of Arathorn?"',
      cite:   '— Théoden, The Two Towers, III.7',
    },
    {
      pos:    { x: 10, z: 0 },
      radius: 6,
      text:   '"They drove through the hosts of Isengard as a wind among grass, and all enemies before them fled or were overmastered."',
      cite:   '— The Two Towers, III.7',
    },
    {
      pos:    { x: -6, z: -26 },
      radius: 7,
      text:   '"Caves! The Glittering Caves of Aglarond! Legolas, when you come there, the least you can find to say will be: at last I understand why dwarves love the earth and stone."',
      cite:   '— Gimli, The Two Towers, III.8',
    },
    {
      pos:    { x: 4, z: -44 },
      radius: 6,
      text:   '"Immeasurable halls, filled with an everlasting music of water that tinkles into pools, as fair as Kheled-zâram in the starlight."',
      cite:   '— Gimli, The Two Towers, III.8',
    },
    {
      pos:    { x: -3, z: -62 },
      radius: 5,
      text:   '"There are columns of white and saffron and dawn-rose, Legolas, flashing and glinting, and the light trembles on them, as if it were caught in a net of silver."',
      cite:   '— Gimli, The Two Towers, III.8',
    },
    {
      pos:    { x: 0, z: 60 },
      radius: 6,
      text:   '"There suddenly upon a ridge appeared a rider, clad in white, shining in the new sun. He held no sword. And in the morning the Men of Rohan looked and saw the banner of their lord unfurled at last."',
      cite:   '— The Two Towers, III.7',
    },
  ],

  // ─── Navigation ───────────────────────────────────────────────────────────
  start: { x: 0, z: 60, yaw: 0 },   // at +Z end, facing -Z (into the keep)

  arrivals: {
    helmsdeep: { x: 0, z: 62, yaw: 0 },   // arriving from +Z (the battle / gate)
    isengard:  { x: 0, z: -68, yaw: Math.PI }, // arriving from -Z (the cave exit)
  },

  boundary: 85,

  transitions: [
    {
      trigger: { x: 0, z: 72, radius: 8 },
      to: 'helmsdeep',
    },
    {
      trigger: { x: 0, z: -74, radius: 8 },
      to: 'isengard',
    },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────
  // The keep's outer rampart wall top — walk the battlements
  // The main gate arch is raised — step up slightly to clear the threshold
  walkables: [
    // Rampart top — east side of courtyard
    { x: 20, z: 15, yaw: 0,            length: 44, width: 4, yStart: 6.5, yEnd: 6.5 },
    // Rampart top — west side
    { x: -20, z: 15, yaw: 0,           length: 44, width: 4, yStart: 6.5, yEnd: 6.5 },
    // Ramp up to east rampart from courtyard
    { x: 15, z: 35, yaw: Math.PI*0.1, length: 10, width: 3, yStart: 0.3, yEnd: 6.5 },
    // Ramp up to west rampart
    { x: -15, z: 35, yaw: -Math.PI*0.1, length: 10, width: 3, yStart: 0.3, yEnd: 6.5 },
    // The cave ledge — raised stone shelf at the mouth of Aglarond
    { x: 0, z: -36, yaw: 0,            length: 10, width: 10, yStart: 1.8, yEnd: 1.8 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────
  // The sheer cliff face prevents leaving the north side
  barriers: [
    { x: 0,   z: -80, w: 100, d: 10, yaw: 0 }, // cliff wall
    { x: 36,  z: 0,   w: 12,  d: 140, yaw: 0 }, // east gorge wall
    { x: -36, z: 0,   w: 12,  d: 140, yaw: 0 }, // west gorge wall
  ],

  // ─── Build Scene ──────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── Helpers ──────────────────────────────────────────────────────────
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

    // ── Materials ─────────────────────────────────────────────────────────
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x2a2622 });
    const stoneDarkMat = new THREE.MeshLambertMaterial({ color: 0x1a1816, side: THREE.DoubleSide });
    const stoneLightMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
    const caveWallMat = new THREE.MeshLambertMaterial({
      color: 0x1c1a18, side: THREE.DoubleSide,
    });
    const stalactiteBaseMat = new THREE.MeshLambertMaterial({ color: 0x444038 });
    const stalagmiteBaseMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });

    // Glowing cave crystal materials
    const crystalWhite = new THREE.MeshLambertMaterial({
      color: 0xdde8f8, emissive: 0x8899cc, emissiveIntensity: 0.55,
    });
    const crystalSaffron = new THREE.MeshLambertMaterial({
      color: 0xf0d890, emissive: 0xc8a420, emissiveIntensity: 0.45,
    });
    const crystalRose = new THREE.MeshLambertMaterial({
      color: 0xf8c8b8, emissive: 0xd06040, emissiveIntensity: 0.40,
    });
    const crystalMats = [crystalWhite, crystalSaffron, crystalRose];

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x2a1e12 });
    const bannerMat = new THREE.MeshLambertMaterial({
      color: 0x8b2020, side: THREE.DoubleSide,
    });

    // ── Keep gate arch ────────────────────────────────────────────────────
    // Two massive gate towers flanking the entrance (+Z side)
    const towerGeo = new THREE.CylinderGeometry(4.5, 5.0, 24, 9);
    addMesh(towerGeo, stoneMat,  14, groundY(14, 54) + 12 - 2, 54);
    addMesh(towerGeo, stoneMat, -14, groundY(-14, 54) + 12 - 2, 54);

    // Connecting wall above gate
    const lintelGeo = new THREE.BoxGeometry(16, 5, 4);
    addMesh(lintelGeo, stoneLightMat, 0, groundY(0, 54) + 23, 54);

    // Gate-side crenellations on towers
    for (let side of [1, -1]) {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI; // half-circle facing outward
        const cr = new THREE.BoxGeometry(1.4, 2.0, 1.4);
        const cx = side * 14 + Math.sin(ang * side) * 4.2;
        const cz = 54 + Math.cos(ang) * 4.2;
        addMesh(cr, stoneLightMat, cx, groundY(side*14, 54) + 25, cz);
      }
    }

    // ── Courtyard walls (east and west) ───────────────────────────────────
    for (let side of [1, -1]) {
      // Main curtain wall
      const wallGeo = new THREE.BoxGeometry(3, 10, 44);
      addMesh(wallGeo, stoneMat, side * 20, groundY(side*20, 15) + 5, 15);

      // Crenellations along the top
      for (let n = -8; n <= 8; n += 2) {
        const crenGeo = new THREE.BoxGeometry(3.4, 2.5, 1.6);
        addMesh(crenGeo, stoneLightMat, side * 20, groundY(side*20, n*2.5) + 10.5 + 1.25, n * 2.5);
      }

      // A buttress midway
      const buttGeo = new THREE.BoxGeometry(2, 8, 2);
      addMesh(buttGeo, stoneDarkMat, side * 21.5, groundY(side*21.5, 15) + 4, 15);
    }

    // ── South (gate-approach) wall across the rear ────────────────────────
    const rearWallGeo = new THREE.BoxGeometry(44, 8, 3);
    addMesh(rearWallGeo, stoneMat, 0, groundY(0, -18) + 4, -18);
    for (let n = -9; n <= 9; n += 2) {
      const cGeo = new THREE.BoxGeometry(1.6, 2.5, 3.4);
      addMesh(cGeo, stoneLightMat, n * 2.4, groundY(n*2.4, -18) + 7.5 + 1.25, -18);
    }

    // ── The great cliff face — back wall of the keep (north) ─────────────
    // Massive slab geometry — player sees this towering above them
    const cliffGeo = new THREE.BoxGeometry(90, 60, 8);
    const cliffMesh = new THREE.Mesh(cliffGeo, caveWallMat);
    cliffMesh.position.set(0, groundY(0, -72) + 30, -72);
    cliffMesh.receiveShadow = true;
    scene.add(cliffMesh);

    // Rough cliff protrusions (spurs)
    const cliffSpurData = [
      [-22, -66, 8, 28],
      [ 18, -68, 7, 22],
      [-10, -70, 6, 18],
      [ 30, -65, 5, 16],
    ];
    for (const [cx, cz, cw, ch] of cliffSpurData) {
      const sGeo = new THREE.BoxGeometry(cw, ch, 7);
      const sm = new THREE.Mesh(sGeo, caveWallMat);
      sm.position.set(cx, groundY(cx, cz) + ch * 0.5 - 1, cz);
      sm.castShadow = true;
      scene.add(sm);
    }

    // ── Cave mouth of Aglarond ─────────────────────────────────────────────
    // A grand arch cut into the cliff
    const archH = 12, archW = 10;
    // Left jamb
    const jambGeo = new THREE.BoxGeometry(3.5, archH + 2, 4);
    addMesh(jambGeo, stoneLightMat, -archW/2 - 1.75, groundY(-archW/2, -38) + (archH+2)*0.5, -38);
    // Right jamb
    addMesh(jambGeo, stoneLightMat,  archW/2 + 1.75, groundY( archW/2, -38) + (archH+2)*0.5, -38);

    // Voussoir stones forming a rough arch over the opening
    for (let i = 0; i <= 7; i++) {
      const ang = (i / 7) * Math.PI;
      const ax  = Math.cos(ang) * (archW / 2 + 2);
      const ay  = Math.sin(ang) * 5.5 + archH * 0.5;
      const keyGeo = new THREE.BoxGeometry(3.0, 2.2, 3.5);
      const keyM = new THREE.Mesh(keyGeo, stoneLightMat);
      keyM.position.set(ax, groundY(0, -38) + ay + 2.5, -38);
      keyM.rotation.z = -ang + Math.PI * 0.5;
      keyM.castShadow = true;
      scene.add(keyM);
    }

    // The dark opening interior — receding cave void
    const voidGeo = new THREE.BoxGeometry(archW - 0.5, archH, 18);
    const voidMat = new THREE.MeshLambertMaterial({ color: 0x060508, side: THREE.BackSide });
    const voidM = new THREE.Mesh(voidGeo, voidMat);
    voidM.position.set(0, groundY(0, -44) + archH * 0.5, -44);
    scene.add(voidM);

    // Raised stone shelf / threshold before the cave mouth
    const ledgeGeo = new THREE.BoxGeometry(16, 1.5, 10);
    addMesh(ledgeGeo, stoneLightMat, 0, groundY(0, -36) + 1.75, -36);

    // ── Glittering Caves interior passage ────────────────────────────────
    // Visible from outside through the arch — softly lit by crystal glow
    // Cave floor
    const caveFloorGeo = new THREE.BoxGeometry(10, 0.5, 30);
    const caveFloor = new THREE.Mesh(caveFloorGeo,
      new THREE.MeshLambertMaterial({ color: 0x1c1a16 }));
    caveFloor.position.set(0, groundY(0, -50) + 0.25, -50);
    scene.add(caveFloor);

    // Cave side walls — DoubleSide so player inside sees them
    const caveSideGeo = new THREE.BoxGeometry(0.6, 16, 30);
    for (let sx of [-5.5, 5.5]) {
      const csm = new THREE.Mesh(caveSideGeo, caveWallMat);
      csm.position.set(sx, groundY(sx, -50) + 8, -50);
      scene.add(csm);
    }
    // Cave ceiling
    const caveCeilGeo = new THREE.BoxGeometry(11, 0.6, 30);
    const caveCeilMat = new THREE.MeshLambertMaterial({ color: 0x151310, side: THREE.DoubleSide });
    const ceilMesh = new THREE.Mesh(caveCeilGeo, caveCeilMat);
    ceilMesh.position.set(0, groundY(0, -50) + 15.7, -50);
    scene.add(ceilMesh);

    // ── Stalactites and stalagmites ────────────────────────────────────────
    // Arranged in clusters of 3 sizes, with crystal tips on many
    const stalactiteData = [
      // [x, z, r, h, crystalMat]
      [ -3,  -44, 0.4, 3.5, crystalWhite   ],
      [  2,  -46, 0.5, 4.8, crystalSaffron ],
      [ -1,  -49, 0.3, 2.9, crystalRose    ],
      [  4,  -51, 0.45, 4.1, crystalWhite  ],
      [ -4,  -53, 0.5, 5.2, crystalSaffron ],
      [  1,  -55, 0.35, 3.3, crystalRose   ],
      [ -2,  -57, 0.6, 5.8, crystalWhite   ],
      [  3,  -59, 0.4, 4.4, crystalSaffron ],
      [  0,  -62, 0.55, 5.0, crystalRose   ],
      [ -3.5,-64, 0.45, 4.6, crystalWhite  ],
      [  3.5,-65, 0.5, 5.4, crystalSaffron ],
    ];

    for (const [sx, sz, sr, sh, cmat] of stalactiteData) {
      // Stalactite body
      const sGeo = new THREE.CylinderGeometry(0.05, sr, sh, 7);
      const sMesh = new THREE.Mesh(sGeo, stalactiteBaseMat);
      const ceilY = groundY(sx, sz) + 15.0;
      sMesh.position.set(sx, ceilY - sh * 0.5, sz);
      sMesh.castShadow = false;
      scene.add(sMesh);

      // Crystal tip — glowing cone
      const tGeo = new THREE.CylinderGeometry(0.0, sr * 1.3, sr * 2.5, 7);
      const tMesh = new THREE.Mesh(tGeo, cmat);
      tMesh.position.set(sx, ceilY - sh - sr * 1.0, sz);
      scene.add(tMesh);
    }

    // Stalagmites rising from floor
    const stalagmiteData = [
      [ 2.5,  -45, 0.3, 2.2, crystalSaffron ],
      [-2.0,  -48, 0.25, 1.8, crystalWhite  ],
      [ 3.5,  -52, 0.4, 3.0, crystalRose    ],
      [-3.0,  -55, 0.35, 2.6, crystalSaffron ],
      [ 1.5,  -58, 0.3, 2.1, crystalWhite   ],
      [-1.5,  -61, 0.45, 3.4, crystalRose   ],
      [ 4.0,  -63, 0.3, 2.3, crystalSaffron ],
    ];

    for (const [sx, sz, sr, sh, cmat] of stalagmiteData) {
      const sGeo = new THREE.CylinderGeometry(sr, sr * 0.5, sh, 7);
      const floorY = groundY(sx, sz);
      const sMesh = new THREE.Mesh(sGeo, stalagmiteBaseMat);
      sMesh.position.set(sx, floorY + sh * 0.5, sz);
      scene.add(sMesh);

      const tGeo = new THREE.CylinderGeometry(sr * 1.2, 0.0, sr * 2.0, 7);
      const tMesh = new THREE.Mesh(tGeo, cmat);
      tMesh.position.set(sx, floorY + sh + sr * 0.8, sz);
      scene.add(tMesh);
    }

    // ── Rubble — aftermath of the battle ──────────────────────────────────
    const rubblePositions = [
      [8, 42], [-7, 38], [5, 28], [-9, 25], [11, 18],
      [-4, 12], [15, 8], [-12, 5], [7, -2], [-5, -8],
      [9, -12], [-10, 32], [6, 48], [-14, 44], [3, 55],
    ];
    for (const [rx, rz] of rubblePositions) {
      const rs = 0.3 + Math.abs(rx * 0.07 + rz * 0.03) % 0.6;
      const rGeo = new THREE.SphereGeometry(rs, 8, 6);
      const rY = groundY(rx, rz);
      addMesh(rGeo, stoneDarkMat, rx, rY + rs * 0.45, rz);
    }

    // ── Wall torches ──────────────────────────────────────────────────────
    // East wall
    FX.makeTorch( 18, groundY(18, 36), 36,  { color: 0xff9944, intensity: 1.1, range: 12, castShadow: true });
    FX.makeTorch( 18, groundY(18, -2), -2,  { color: 0xff8833, intensity: 1.0, range: 11 });
    // West wall
    FX.makeTorch(-18, groundY(-18, 36), 36, { color: 0xff9944, intensity: 1.1, range: 12, castShadow: true });
    FX.makeTorch(-18, groundY(-18, -2), -2, { color: 0xff8833, intensity: 1.0, range: 11 });
    // Cave entrance flanking torches
    FX.makeTorch( -9, groundY(-9, -34), -34, { color: 0x88aaee, intensity: 0.7, range: 9, castShadow: true });
    FX.makeTorch(  9, groundY( 9, -34), -34, { color: 0x88aaee, intensity: 0.7, range: 9 });

    // ── The watch-fire — a smoldering pyre in the courtyard ───────────────
    // After the battle, reduced to embers
    FX.makeFire(0, groundY(0, 10) + 0.1, 10, {
      color:      0xff5500,
      intensity:  2.0,
      range:      16,
      flameScale: 0.6,
      emberCount: 60,
      emberSize:  0.07,
      castShadow: true,
    });

    // ── Flagpole with banner of the Horse of Rohan ─────────────────────────
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 14, 7);
    const poleMesh = new THREE.Mesh(poleGeo, woodMat);
    const poleX = 0, poleZ = 8;
    poleMesh.position.set(poleX, groundY(poleX, poleZ) + 7, poleZ);
    scene.add(poleMesh);

    // Banner cloth
    const bnGeo = new THREE.BoxGeometry(3.5, 2.0, 0.08);
    const banner = new THREE.Mesh(bnGeo, bannerMat);
    banner.position.set(poleX + 1.75, groundY(poleX, poleZ) + 13.5, poleZ);
    scene.add(banner);

    // Emblem — white horse silhouette (simple cross approximation)
    const emblemMat = new THREE.MeshLambertMaterial({ color: 0xeeeebb, side: THREE.DoubleSide });
    const embH = new THREE.BoxGeometry(1.6, 0.25, 0.1);
    const embV = new THREE.BoxGeometry(0.25, 1.4, 0.1);
    const eH = new THREE.Mesh(embH, emblemMat);
    const eV = new THREE.Mesh(embV, emblemMat);
    eH.position.set(poleX + 1.75, groundY(poleX, poleZ) + 13.5, poleZ - 0.05);
    eV.position.set(poleX + 1.75, groundY(poleX, poleZ) + 13.5, poleZ - 0.05);
    scene.add(eH);
    scene.add(eV);

    // ── The Great Horn of Helm ─────────────────────────────────────────────
    // Mounted on the Horn Tower (east tower)
    const hornBaseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 9);
    addMesh(hornBaseGeo, stoneLightMat, 14, groundY(14, 54) + 25, 54);
    const hornGeo = new THREE.CylinderGeometry(0.1, 0.4, 2.2, 7);
    const hornM = new THREE.Mesh(hornGeo, stoneLightMat);
    hornM.position.set(14 + 0.6, groundY(14, 54) + 25.4, 54);
    hornM.rotation.z = -Math.PI * 0.25;
    hornM.rotation.y = Math.PI * 0.15;
    scene.add(hornM);

    // ── Scattered weapons — aftermath of battle ───────────────────────────
    const weapMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const spearData = [
      [ 6, 46, Math.PI*0.3], [-8, 42, Math.PI*0.1],
      [12, 32, Math.PI*0.6], [-11, 28, Math.PI*0.8],
    ];
    for (const [wx, wz, wr] of spearData) {
      const spearGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.5, 6);
      const spearM = new THREE.Mesh(spearGeo, weapMat);
      spearM.position.set(wx, groundY(wx, wz) + 0.25, wz);
      spearM.rotation.x = Math.PI * 0.45;
      spearM.rotation.z = wr;
      scene.add(spearM);
    }

    // ── Crystal cave glow — ambient light inside the cave passage ─────────
    // Multiple small coloured point lights mimicking crystal reflection
    const crystalLightData = [
      { color: 0x9aaae0, x:  0, y: 3, z: -50, r: 10, i: 0.5 },
      { color: 0xe8d060, x: -2, y: 3, z: -55, r:  9, i: 0.45 },
      { color: 0xe8a080, x:  2, y: 3, z: -62, r:  8, i: 0.40 },
    ];
    const crystalLights = [];
    for (const cl of crystalLightData) {
      const ptLight = new THREE.PointLight(cl.color, cl.i, cl.r);
      ptLight.position.set(cl.x, groundY(cl.x, cl.z) + cl.y, cl.z);
      scene.add(ptLight);
      crystalLights.push(ptLight);
    }

    // ── Dawn light seeping over the eastern cliff rim ─────────────────────
    // Triggered by the player standing at the ride-out lore point.
    // Starts dark; lifts slowly once _dawnTriggered is set in onFrame.
    const dawnLight = new THREE.DirectionalLight(0x3d1a08, 0.0);
    dawnLight.position.set(60, 25, 70);
    scene.add(dawnLight);

    return { crystalLights, dawnLight, banner, _dawnTriggered: false, _dawnStartT: 0 };
  },

  // ─── onArrive ────────────────────────────────────────────────────────────
  onArrive(fromKey, refs) {
    // Nothing special — scene is static; onFrame handles animation
  },

  // ─── onFrame ─────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    const { crystalLights, dawnLight, banner } = refs;

    // ── Crystal shimmer — each light pulses at a slightly different rate
    for (let i = 0; i < crystalLights.length; i++) {
      const phase  = (i / crystalLights.length) * Math.PI * 2;
      const pulse  = 0.9 + 0.1 * Math.sin(t * 0.7 + phase);
      crystalLights[i].intensity = [0.5, 0.45, 0.40][i] * pulse;
    }

    // ── Dawn brightens slowly — triggered when the player reaches
    // the ride-out lore point near z=20 (Théoden's charge).
    // Once triggered, light lifts from nothing to full over ~90 seconds,
    // evoking the sun cresting the ridge as the horn sounds.
    if (!refs._dawnTriggered && playerPos) {
      const dx = playerPos.x, dz = playerPos.z - 20;
      if (Math.sqrt(dx*dx + dz*dz) < 7) {
        refs._dawnTriggered = true;
        refs._dawnStartT    = t;
      }
    }
    if (refs._dawnTriggered) {
      const elapsed  = t - refs._dawnStartT;
      const dawnRamp = Math.min(1, elapsed / 90);         // 0 → 1 over 90 s
      // Colour shifts from deep ember-red to warm golden as dawn matures
      const r = Math.round(0x3d + (0x70 - 0x3d) * dawnRamp);
      const g = Math.round(0x1a + (0x48 - 0x1a) * dawnRamp);
      const b = Math.round(0x08 + (0x18 - 0x08) * dawnRamp);
      dawnLight.color.setHex((r << 16) | (g << 8) | b);
      dawnLight.intensity = dawnRamp * 0.65;
    }

    // ── Banner sways gently in the pre-dawn breeze
    if (banner) {
      banner.rotation.y = Math.sin(t * 0.5) * 0.08
                        + Math.sin(t * 1.3) * 0.03;
    }

    // ── Crystal proximity — caves glow brighter as player approaches
    if (playerPos) {
      const pz = playerPos.z;
      // Inside cave region: z < -38
      const caveBlend = Math.min(1, Math.max(0, (-pz - 38) / 20));
      for (const cl of crystalLights) {
        // Boost cave lights when player is inside
        const baseI = [0.5, 0.45, 0.40][crystalLights.indexOf(cl)];
        const pulse  = 0.9 + 0.1 * Math.sin(t * 0.7 + crystalLights.indexOf(cl) * 2.1);
        cl.intensity = baseI * pulse * (1 + caveBlend * 0.8);
      }
    }
  },
};

window.InnerKeep = InnerKeep;
