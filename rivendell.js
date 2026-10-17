// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  Sequence: Weathertop ↔ Rivendell
//  Tone: bright autumn day, deep valley, waterfall, stream, halls
//
//  v2 changes:
//   - Valley 3× deeper (floor y≈-38, rim y≈+20, total ~58 units)
//   - Waterfall embedded into west cliff face, not a freestanding tower
//   - Arrival high on east ridge looking down; path winds to stream→bridge→halls
//   - Stream raised in its channel with visible banks above water surface
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

  // -----------------------------------------------------------
  //  ATMOSPHERE  — golden autumn midday
  // -----------------------------------------------------------
  atmosphere: {
    fogType:         'linear',
    fogColor:          0xbdd4aa,   // pale leaf-green valley air
    fogNear:           90,
    fogFar:            320,
    skyColor:          0x8ec8e8,   // clear autumn blue
    ambientColor:      0xd8c89a,   // warm diffuse gold
    ambientIntensity:  1.7,
    moonColor:         0xfff3cc,   // sun — warm white-gold
    moonIntensity:     1.4,
    moonPosition:      { x: 60, y: 130, z: 50 },
    extraLights: [
      { color: 0x90b8c8, intensity: 0.45, x: -40, y: 60, z: -100 },
      { color: 0xc8a050, intensity: 0.25, x: 20,  y: -10, z: 30  },
    ],
    showStars: false,
  },

  // -----------------------------------------------------------
  //  TERRAIN
  //
  //  Coordinate layout (Z = north-south axis of valley):
  //    z > 0   = east end (entry ridge, player arrives here)
  //    z < 0   = west end (waterfall cliff, Elven halls)
  //    x = 0   = valley centreline
  //
  //  Heights:
  //    Valley rim:    y ≈ +20  (top of cliff walls)
  //    Valley floor:  y ≈ -38  (flat basin)
  //    Stream surface: y ≈ -34  (sits 4 units above deepest floor)
  //    Entry ridge:   y ≈ +18..+28 (player starts here)
  //    West cliff:    y ≈ +30..+60 (sheer face, waterfall carved in)
  //
  //  The valley is a steep-walled gorge: wall slope is cubic so
  //  the floor is genuinely flat and the walls are nearly vertical
  //  in the middle, easing only near the rim.
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise = api_fbm;
    const n2    = api_noise2d;

    // --- Valley cross-section walls (X axis) ---
    // Cubic profile: flat floor out to |x|=10, then walls climb steeply
    const vAbs   = Math.abs(x);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    // --- East entry ridge (z > 60): rises steeply so player descends into valley ---
    const eastRise = Math.max(0, (z - 60) * 0.45);

    // --- West cliff — box-canyon end wall ---
    // Raises the ENTIRE floor quadratically as z approaches the waterfall head.
    // At z=-88 it starts; by z=-110 the cliff is ~60 units tall.
    // This is NOT just a wall-height addition — it lifts the base, so the
    // whole cross-section at z=-100 is significantly higher than the valley floor.
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    // --- Valley narrows toward the west end ---
    // Floor width shrinks from ±10 to ±5 between z=-65 and z=-95
    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    // --- Gentle valley floor tilt: water flows west ---
    const floorTilt = z * 0.03;

    // --- Stream channel cut ---
    // Centred at x=1; 4 units deep, ~8 units wide
    const sDist     = Math.abs(x - 1);
    const streamCut = Math.max(0, (4.0 - sDist) * 1.1);

    // --- Surface detail ---
    const detail = noise(x * 0.07, z * 0.07) * 2.2
                 + n2(x * 0.2, z * 0.2) * 0.8;

    const base = -38 + floorTilt + detail;
    return base + valley + narrowWall + eastRise + westCliff - streamCut;
  },

  // -----------------------------------------------------------
  //  VERTEX COLOUR
  // -----------------------------------------------------------
  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Height-based slope: valley floor green, walls become rock
    // Floor is near y=-38, rim near y=+20 → normalise over ~58 units
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));

    // Autumn canopy gold patches — mid-slope trees read as colour
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;

    // Rocky high-slope grey
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    // Stream bank darkening
    const sDist     = Math.abs(vx - 1);
    const streamProx = Math.max(0, 1 - sDist / 5.5);

    // West cliff face — pale granite
    const cliffFac = Math.max(0, Math.min(1, (-vz - 80) / 25));

    // Valley floor: rich grass green
    const r0 = lerp(0.25, 0.52, gold);
    const g0 = lerp(0.50, 0.50, gold);
    const b0 = lerp(0.16, 0.20, gold);

    // Upper slope: grey rock with moss patches
    const r1 = 0.48 + rockN * 0.10;
    const g1 = 0.46 + rockN * 0.07;
    const b1 = 0.42;

    // High cliff: pale granite
    const r2 = 0.72, g2 = 0.70, b2 = 0.66;

    // Blend: floor → rock by height, then cliff overlay on west face
    let r = lerp(r0, r1, heightFrac);
    let g = lerp(g0, g1, heightFrac);
    let b = lerp(b0, b1, heightFrac);

    // Cliff face overlay
    const cliffBlend = cliffFac * heightFrac;
    r = lerp(r, r2, cliffBlend * 0.85);
    g = lerp(g, g2, cliffBlend * 0.85);
    b = lerp(b, b2, cliffBlend * 0.85);

    // Wet stream bank
    r = lerp(r, 0.16, streamProx * 0.55);
    g = lerp(g, 0.19, streamProx * 0.55);
    b = lerp(b, 0.12, streamProx * 0.55);

    return [r, g, b];
  },

  // -----------------------------------------------------------
  //  PATH PROXIMITY
  //
  //  Segment A: East ridge descent — from arrival (x=22,z=88)
  //             winding down switchback to valley floor (x=8,z=22)
  //  Segment B: Valley floor approach to bridge (x=8 → x=1, z=22→z=-5)
  //  Segment C: Cross bridge / ford — path crosses stream channel
  //  Segment D: West bank to Elven halls (x=-4, z=-5 → z=-75)
  // -----------------------------------------------------------
  onPath(x, z) {
    // A — descent from ridge
    if (z > 22) {
      const t  = Math.max(0, Math.min(1, (z - 22) / 66));
      // Switchback: two curves
      let cx;
      if (t > 0.5) {
        cx = api_lerp(16, 22, (t - 0.5) * 2);
      } else {
        cx = api_lerp(8, 16, t * 2);
      }
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    // B — valley floor east bank to bridge
    if (z >= -5) {
      const t  = (z - (-5)) / 27;           // 0 at z=-5, 1 at z=22
      const cx = api_lerp(1, 8, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    // C & D — west of bridge, track along west bank toward halls
    if (z >= -78) {
      const t  = (-z - 5) / 73;
      const cx = api_lerp(-4, 1, 1 - t);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    return 0;
  },

  // -----------------------------------------------------------
  //  PATH WAYPOINTS
  // -----------------------------------------------------------
  pathWaypoints: [
    [22, 88],    // arrival — top of east ridge
    [20, 78],    // first switchback start
    [16, 68],
    [12, 58],
    [16, 48],    // switchback turn
    [12, 38],
    [ 8, 28],
    [ 8, 22],    // valley floor reached
    [ 5, 14],    // approach stream
    [ 1,  6],    // to bridge/ford at x≈1
    [ 1, -5],    // cross — west bank
    [-2, -18],
    [-4, -32],
    [-4, -48],
    [-3, -55],
    [-2, -62],   // halls entrance
  ],

  // -----------------------------------------------------------
  //  LORE POINTS
  // -----------------------------------------------------------
  lorePoints: [
    {
      pos: { x: 20, z: 82 },
      radius: 10,
      text: 'At last they rode over the top of a steep bank, and Frodo looked down. The valley of Rivendell lay below, misty and pale, and very far away. He could hear, far beneath him, the voice of a river and the sound of falling water.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: 1, z: 0 },
      radius: 8,
      text: 'The Ford of Bruinen — where the Ringwraiths were swept away by the river Elrond had set to flood at his command. The waters still ran swift and cold over smooth grey stones.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: -3, z: -58 },
      radius: 9,
      text: '"Welcome to Rivendell, Mr. Baggins." A perfect house, whether you like food or sleep or story-telling or singing, or just sitting and thinking best, or a pleasant mixture of them all.',
      cite: 'The Fellowship of the Ring, Book II, Ch. 1'
    },
    {
      pos: { x: -2, z: -84 },
      radius: 12,
      text: 'At the valley\'s head, a great fall of water leapt from a high cliff ledge into a mist-filled pool, and from that pool the Bruinen was born. The Elves said the voice of the fall could be heard in every hall of Imladris.',
      cite: 'The Fellowship of the Ring, Book II'
    },
  ],

  // -----------------------------------------------------------
  //  BOUNDARY & TRANSITIONS
  // -----------------------------------------------------------
  boundary: 150,
  start: { x: 22, z: 90, yaw: Math.PI },

  transitions: [
    {
      trigger: { x: 22, z: 102, radius: 14 },
      to: 'Weathertop'
    },
  ],

  arrivals: {
    // High on east ridge — player can see the valley below immediately
    'Weathertop': { x: 22, z: 90, yaw: Math.PI },
  },

  // -----------------------------------------------------------
  //  BUILD SCENE
  // -----------------------------------------------------------
  buildScene(THREE, scene, groundY, MAT) {
    const refs = {
      waterParticles: [],
      waterfallPlanes: [],
      streamSurfaces: [],
      foliage: [],
      t: 0,
    };

    // ---- materials ----
    const matGold     = new THREE.MeshLambertMaterial({ color: 0xd4a030 });
    const matRust     = new THREE.MeshLambertMaterial({ color: 0xb85828 });
    const matAmber    = new THREE.MeshLambertMaterial({ color: 0xe8b840, side: THREE.DoubleSide });
    const matCopper   = new THREE.MeshLambertMaterial({ color: 0xc07020 });
    const matWater    = new THREE.MeshLambertMaterial({ color: 0x4488aa, transparent: true, opacity: 0.78 });
    const matFoam     = new THREE.MeshLambertMaterial({ color: 0xddeeff, transparent: true, opacity: 0.80 });
    const matWood     = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    const matElven    = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
    const matRoof     = new THREE.MeshLambertMaterial({ color: 0x607848 });
    const matStone    = MAT.STONE;
    const matMoss     = MAT.STONE_MOSS;
    const matDark     = MAT.STONE_DARK;

    // =====================================================
    //  AUTUMN TREES
    //  Distributed on valley slopes — floor clear for stream
    // =====================================================
    const leafMats = [matGold, matRust, matAmber, matCopper];
    const treeDefs = [
      // West wall mid-slope
      [-16, -5],  [-20, 10],  [-24, -20], [-28,  5],
      [-18, 30],  [-26, 42],  [-22, -35], [-18, -52],
      [-24, -55], [-14, -65],
      // East wall mid-slope
      [ 22,  0],  [ 26, 18],  [ 24, -12], [ 28, 35],
      [ 20, -28], [ 26, -45], [ 22, -58],
      // Valley floor edges (not over stream channel)
      [ -9, 15],  [-11, -22], [ -8, -38], [-10,  5],
      [ 11, 25],  [ 13, -5],  [ 10, -42],
      // Entry ridge
      [ 20, 60],  [ 16, 54],  [ 26, 66],  [ 24, 72],
    ];

    treeDefs.forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz);
      const h  = 5.5 + (i % 5) * 1.4;
      const lm = leafMats[i % leafMats.length];

      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.36, h, 9);
      const trunk    = new THREE.Mesh(trunkGeo, matWood);
      trunk.position.set(tx, gy + h / 2 - h * 0.25, tz);
      scene.add(trunk);

      const cr  = 2.8 + (i % 3) * 0.7;
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h * 0.8 + cr * 0.45, tz);
      scene.add(can);

      const c2 = new THREE.Mesh(new THREE.SphereGeometry(cr * 0.72, 8, 6), lm);
      c2.position.set(tx + (i % 2 ? 0.9 : -0.9), gy + h * 0.95 + cr * 0.45, tz + 0.5);
      scene.add(c2);

      refs.foliage.push(can, c2);
    });

    // =====================================================
    //  STREAM SURFACE
    //  Stream runs along x ≈ 1.
    //  Stream channel floor is at groundY(1,z).
    //  We raise the water surface 3.2 units above that —
    //  so it visibly fills the channel and has depth.
    //  Bank edges at x≈-3 and x≈+5 sit ABOVE water surface.
    // =====================================================
    const STREAM_RAISE = 3.2;  // water surface above channel floor

    for (let sz = -84; sz < 80; sz += 7) {
      const chFloor = groundY(1, sz + 3.5);
      const surfY   = chFloor + STREAM_RAISE;
      const wGeo    = new THREE.PlaneGeometry(5.5, 7.5);
      wGeo.rotateX(-Math.PI / 2);
      const surf = new THREE.Mesh(wGeo, matWater.clone());
      surf.position.set(1, surfY, sz + 3.5);
      scene.add(surf);
      refs.streamSurfaces.push(surf);
    }

    // Small ripple boulders poking above water surface
    const streamBoulders = [
      [-1, 10, 0.6], [3, -8, 0.5], [-0.5, -22, 0.7],
      [2.5, 18, 0.55], [-1, -42, 0.65], [3, -56, 0.5],
    ];
    streamBoulders.forEach(([bx, bz, bs]) => {
      const gy   = groundY(bx, bz);
      const surf = gy + STREAM_RAISE;
      const bMesh = new THREE.Mesh(
        new THREE.SphereGeometry(bs, 10, 7),
        matMoss
      );
      // Place at water surface level — half submerged
      bMesh.position.set(bx, surf + bs * 0.15, bz);
      scene.add(bMesh);
    });

    // =====================================================
    //  WATERFALL — carved into west cliff face
    //
    //  The cliff at z≈-90..-120 already rises 30-50 units.
    //  We DON'T build a freestanding tower — instead we:
    //   1. Stack the waterfall PlaneGeometry sheets flat
    //      against the cliff face (z fixed ≈ -91)
    //   2. Drop a wider splash pool below at stream level
    //   3. Scatter mist particles rising from the pool
    //
    //  The cliff face geometry is all terrain — these objects
    //  just dress it.
    // =====================================================
    // Waterfall positioning:
    // The west cliff end-wall rises steeply from z≈-88 outward.
    // The waterfall "lip" is at the cliff top — roughly at z=-90, x≈-2.
    // The splash pool is on the valley floor just inside z=-88.
    // We anchor all waterfall geometry to groundY at the POOL side (z=-87)
    // so it sits on the raised terrain naturally.
    const WF_X      = -2;
    const WF_POOL_Z = -87;   // splash pool — where water lands
    const WF_FACE_Z = -90;   // cliff face — where sheets hang

    // Pool / splash base height — at stream level on the valley floor side
    const poolFloor = groundY(WF_X, WF_POOL_Z);
    const splashY   = poolFloor + STREAM_RAISE + 0.1;

    // Cliff face ground level (will be higher than pool due to westCliff formula)
    // The sheets span from splashY up to the cliff top
    // Total fall height: cliff face is ~28 units above valley floor at z=-100,
    // so the drop from lip to pool is approximately that.
    const WF_DROP = 28;   // visual height of the waterfall in units

    // Multiple stacked waterfall plane sheets spanning the fall
    // Sheet 0 = bottom (near pool), Sheet 3 = top (near cliff lip)
    // Each sheet is WF_DROP/4 tall and overlaps slightly
    const SHEET_H = WF_DROP / 3.5;
    for (let wi = 0; wi < 4; wi++) {
      const wfGeo = new THREE.PlaneGeometry(4.8 - wi * 0.4, SHEET_H);
      const wfMat = new THREE.MeshLambertMaterial({
        color: wi < 2 ? 0x88bbdd : 0xbbd8ee,
        transparent: true, opacity: 0.75 - wi * 0.05,
        side: THREE.DoubleSide,
      });
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);
      // Place sheets progressively higher — bottom sheet at pool, top at cliff lip
      const sheetCentreY = splashY + SHEET_H * 0.5 + wi * (SHEET_H * 0.88);
      wfMesh.position.set(WF_X + wi * 0.15, sheetCentreY, WF_FACE_Z + 0.6);
      refs.waterfallPlanes.push(wfMesh);
      scene.add(wfMesh);
    }

    // Wide mist/spray at the base
    const splashGeo = new THREE.SphereGeometry(5.5, 10, 7);
    const splash    = new THREE.Mesh(splashGeo, matFoam);
    splash.scale.y  = 0.10;
    splash.position.set(WF_X, splashY, WF_POOL_Z + 1);
    scene.add(splash);

    // Narrower rising spray column
    const spray2Geo = new THREE.PlaneGeometry(3.5, 10);
    const spray2    = new THREE.Mesh(spray2Geo, matFoam);
    spray2.position.set(WF_X, splashY + 5, WF_FACE_Z + 1.2);
    scene.add(spray2);

    // Mist particles rising from splash pool
    for (let pi = 0; pi < 24; pi++) {
      const angle  = (pi / 24) * Math.PI * 2;
      const pr     = 1.0 + Math.random() * 4.0;
      const pGeo   = new THREE.SphereGeometry(0.28 + Math.random() * 0.38, 6, 4);
      const pMat   = new THREE.MeshLambertMaterial({
        color: 0xddeeff, transparent: true, opacity: 0.45 + Math.random() * 0.35,
      });
      const pMesh  = new THREE.Mesh(pGeo, pMat);
      const startY = splashY + 0.2 + Math.random() * 3.0;
      pMesh.position.set(
        WF_X + Math.cos(angle) * pr * 0.65,
        startY,
        WF_POOL_Z + 1 + Math.sin(angle) * pr
      );
      pMesh._startY = startY;
      pMesh._phase  = Math.random() * Math.PI * 2;
      scene.add(pMesh);
      refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  ROCKY VALLEY WALLS — angular chunks on steep slopes
    // =====================================================
    const wallChunks = [
      [-18,  8, 2.0], [-22, -20, 2.4], [-16, -38, 1.8],
      [ 22, 14, 2.2], [ 26, -24, 1.9], [ 24,  42, 1.6],
      [-24, 50, 2.6], [ 28, -10, 2.0], [-20, -55, 2.1],
      [ 26, -52, 1.7], [-14, -68, 1.5], [20, -65, 1.9],
    ];
    wallChunks.forEach(([wx, wz, ws]) => {
      const wm = new THREE.Mesh(
        new THREE.SphereGeometry(ws, 8, 6),
        Math.random() > 0.4 ? matDark : matStone
      );
      wm.position.set(wx, groundY(wx, wz) + ws * 0.45, wz);
      wm.scale.set(1 + Math.random() * 0.3, 0.65 + Math.random() * 0.35, 1 + Math.random() * 0.3);
      wm.rotation.y = Math.random() * Math.PI;
      scene.add(wm);
    });

    // =====================================================
    //  STONE BRIDGE / FORD over stream
    //  Bridge at x=1, z=0 — where path crosses
    //  Water surface here is at groundY(1,0) + STREAM_RAISE
    // =====================================================
    const BRZ   = 0;
    const waterSurfHere = groundY(1, BRZ) + STREAM_RAISE;

    // Two bridge piers — tall enough to reach from channel floor to deck
    [[-3.0, BRZ], [5.0, BRZ]].forEach(([px, pz]) => {
      const pierH  = STREAM_RAISE + 1.8;
      const pierGeo = new THREE.CylinderGeometry(0.55, 0.7, pierH, 9);
      const pier   = new THREE.Mesh(pierGeo, matStone);
      // Base pier at channel floor, rises through water
      pier.position.set(px, groundY(px, pz) + pierH / 2, pz);
      scene.add(pier);
    });

    // Bridge deck — sits just above water surface
    const deckGeo = new THREE.CylinderGeometry(0.5, 0.5, 9, 9);
    deckGeo.rotateZ(Math.PI / 2);
    const deck = new THREE.Mesh(deckGeo, matStone);
    deck.position.set(1, waterSurfHere + 1.2, BRZ);
    scene.add(deck);

    // Low parapet rails — thin cylinders on each side of bridge
    [[-0.5, BRZ - 0.3], [-0.5, BRZ + 0.3]].forEach(([rx, rz]) => {
      const rGeo = new THREE.CylinderGeometry(0.12, 0.12, 8.5, 6);
      rGeo.rotateZ(Math.PI / 2);
      const rail = new THREE.Mesh(rGeo, matStone);
      rail.position.set(1, waterSurfHere + 2.1, rz * 2.2);
      scene.add(rail);
    });

    // =====================================================
    //  ELVEN HALLS — west end, close to waterfall
    //  Keep buildings modest — valley walls dwarf everything
    // =====================================================
    // Halls sit at z≈-62, well clear of the cliff face (which starts at z=-88).
    // From here the player looks west and sees the waterfall against the cliff.
    const HX = -3, HZ = -62;

    // Main hall body — wide, low cylinder
    const hallGeo  = new THREE.CylinderGeometry(5.5, 5.8, 7, 9);
    const hall     = new THREE.Mesh(hallGeo, matElven);
    hall.position.set(HX, groundY(HX, HZ) + 7 / 2 - 7 * 0.25, HZ);
    scene.add(hall);

    const hallRoofGeo = new THREE.CylinderGeometry(0.6, 5.8, 3.5, 9);
    const hallRoof    = new THREE.Mesh(hallRoofGeo, matRoof);
    hallRoof.position.set(HX, groundY(HX, HZ) + 7 - 7 * 0.25 + 1.2, HZ);
    scene.add(hallRoof);

    // Secondary hall — offset deeper into valley (closer to waterfall)
    const h2x = HX - 5, h2z = HZ - 10;
    const hall2Geo  = new THREE.CylinderGeometry(3.8, 4.0, 6, 9);
    const hall2     = new THREE.Mesh(hall2Geo, matElven);
    hall2.position.set(h2x, groundY(h2x, h2z) + 6 / 2 - 6 * 0.25, h2z);
    scene.add(hall2);

    const hall2RoofGeo = new THREE.CylinderGeometry(0.4, 4.0, 3, 9);
    const hall2Roof    = new THREE.Mesh(hall2RoofGeo, matRoof);
    hall2Roof.position.set(h2x, groundY(h2x, h2z) + 6 - 6 * 0.25 + 0.9, h2z);
    scene.add(hall2Roof);

    // Slender bell tower — one narrow cylinder, just to give silhouette
    const btX = HX + 4, btZ = HZ - 4;
    const btGeo  = new THREE.CylinderGeometry(1.0, 1.2, 12, 9);
    const btMesh = new THREE.Mesh(btGeo, matElven);
    btMesh.position.set(btX, groundY(btX, btZ) + 12 / 2 - 12 * 0.25, btZ);
    scene.add(btMesh);
    const btRoofGeo = new THREE.CylinderGeometry(0.1, 1.1, 3.5, 9);
    const btRoof    = new THREE.Mesh(btRoofGeo, matRoof);
    btRoof.position.set(btX, groundY(btX, btZ) + 12 - 12 * 0.25 + 1.2, btZ);
    scene.add(btRoof);

    // Colonnade approach — 5 pillars from path to main hall door
    for (let pi = 0; pi < 5; pi++) {
      const px  = HX - 2 + pi * 1.6;
      const pz  = HZ + 8;
      const phH = 5.5;
      const pilGeo = new THREE.CylinderGeometry(0.25, 0.30, phH, 9);
      const pil    = new THREE.Mesh(pilGeo, matElven);
      pil.position.set(px, groundY(px, pz) + phH / 2 - phH * 0.25, pz);
      scene.add(pil);
    }
    // Colonnade lintel
    const colLintelGeo = new THREE.CylinderGeometry(0.25, 0.25, 8.5, 9);
    colLintelGeo.rotateZ(Math.PI / 2);
    const colLintel = new THREE.Mesh(colLintelGeo, matElven);
    const clx = HX + 1.2, clz = HZ + 8;
    colLintel.position.set(clx, groundY(clx, clz) + 5.5 - 5.5 * 0.1, clz);
    scene.add(colLintel);

    // =====================================================
    //  ENTRY RIDGE — standing stones / waymarkers
    // =====================================================
    [[20, 72, 3.2], [24, 76, 2.8], [18, 66, 2.5], [22, 60, 3.0]].forEach(([rx, rz, rh]) => {
      const rGeo  = new THREE.CylinderGeometry(0.28, 0.42, rh, 9);
      const rMesh = new THREE.Mesh(rGeo, matMoss);
      rMesh.position.set(rx, groundY(rx, rz) + rh / 2 - rh * 0.25, rz);
      scene.add(rMesh);
    });

    // =====================================================
    //  FIRELIGHT — Elven hall glow
    // =====================================================
    const fireLight = new THREE.PointLight(0xffcc66, 2.0, 35);
    fireLight.position.set(HX, groundY(HX, HZ) + 6, HZ);
    scene.add(fireLight);

    const fireFill = new THREE.PointLight(0xffaa44, 0.8, 22);
    fireFill.position.set(h2x, groundY(h2x, h2z) + 5, h2z);
    scene.add(fireFill);

    refs.fireLight = fireLight;
    refs.fireFill  = fireFill;
    refs.flames    = [];
    refs.embers    = [];

    return refs;
  },

  // -----------------------------------------------------------
  //  ON FRAME
  // -----------------------------------------------------------
  onFrame(t, dt, refs) {
    if (!refs) return;
    refs.t = (refs.t || 0) + dt;
    const T = refs.t;

    // Stream — gentle opacity ripple
    if (refs.streamSurfaces) {
      refs.streamSurfaces.forEach((s, i) => {
        s.material.opacity = 0.68 + Math.sin(T * 1.6 + i * 0.8) * 0.08;
      });
    }

    // Waterfall planes — drift horizontally + breathe opacity
    if (refs.waterfallPlanes) {
      refs.waterfallPlanes.forEach((wf, i) => {
        wf.position.x += Math.sin(T * 0.5 + i * 1.1) * dt * 0.06;
        wf.material.opacity = Math.max(0.3,
          (0.72 - i * 0.06) + Math.sin(T * 2.2 + i * 0.7) * 0.08
        );
      });
    }

    // Mist particles — rise, drift, reset
    if (refs.waterParticles) {
      refs.waterParticles.forEach((p) => {
        p.position.y  += dt * 0.32;
        p.position.x  += Math.sin(T * 0.45 + p._phase) * dt * 0.06;
        p.material.opacity = 0.35 + Math.sin(T * 0.8 + p._phase) * 0.28;
        if (p.position.y > p._startY + 7) {
          p.position.y = p._startY;
        }
      });
    }

    // Foliage sway
    if (refs.foliage) {
      refs.foliage.forEach((f, i) => {
        f.rotation.z = Math.sin(T * 0.55 + i * 0.9) * 0.022;
        f.rotation.x = Math.sin(T * 0.38 + i * 1.2) * 0.014;
      });
    }

    // Hall glow breathe
    if (refs.fireLight) {
      refs.fireLight.intensity = 1.8 + Math.sin(T * 1.1) * 0.25;
    }
    if (refs.fireFill) {
      refs.fireFill.intensity  = 0.7 + Math.sin(T * 0.85 + 1.2) * 0.14;
    }
  },
};

window.Rivendell = Rivendell;
