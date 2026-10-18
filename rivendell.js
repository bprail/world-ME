// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  v5 fixes:
//   - Valley bends at z=65 (coord rotation), mist at bend mouth
//   - Stream water level below banks; boxes have correct depth
//   - Waterfall planes drape along slope (correct tilt axis)
//   - Bridge: gentle 3-segment arc, walkables[], no big pillars
//   - Path: stays east of stream, crosses bridge at x=1,z=0
//   - Halls: 32% up west hillside on carved shelf
//   - Yaw: 0 (facing into valley, toward -Z)
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

  start: { x: 22, z: 90, yaw: 0 },

  atmosphere: {
    fogType:         'linear',
    fogColor:          0xbdd4aa,
    fogNear:           90,
    fogFar:            320,
    skyColor:          0x8ec8e8,
    ambientColor:      0xd8c89a,
    ambientIntensity:  1.7,
    moonColor:         0xfff3cc,
    moonIntensity:     1.4,
    moonPosition:      { x: 60, y: 130, z: 50 },
    extraLights: [
      { color: 0x90b8c8, intensity: 0.45, x: -40, y:  60, z: -100 },
      { color: 0xc8a050, intensity: 0.25, x:  20, y: -10, z:   30 },
    ],
    showStars: false,
  },

  // -----------------------------------------------------------
  //  TERRAIN
  //
  //  The valley runs along Z from z=65 (bend) westward to z=-90
  //  (waterfall cliff). East of z=65 the valley bends ~70° and
  //  is obscured by mist — the player arrives from that bend.
  //
  //  Bend implementation: for z > BEND_Z, rotate the sample
  //  coordinate around (0, BEND_Z) before computing walls.
  //  This makes the valley walls physically turn, not just the
  //  stream. A closing wall builds up at the bend mouth.
  //
  //  Elven halls shelf: a shallow plateau carved into the west
  //  wall at x≈-20, z≈-55 by suppressing the valley-wall term
  //  locally. groundY() will return a flat-ish ledge there.
  // -----------------------------------------------------------

  hillHeight(x, z) {
    const noise = api_fbm;
    const n2    = api_noise2d;

    const BEND_Z  = 65;
    const BEND_ANG = 65 * Math.PI / 180;  // 65° bend, valley continues NW

    // --- Coordinate bend ---
    // For z > BEND_Z, rotate sample point around (0, BEND_Z).
    // The original valley straight section stays unchanged below BEND_Z.
    let sx = x, sz = z;
    let pastBend = false;
    if (z > BEND_Z) {
      pastBend = true;
      const dz  = z - BEND_Z;
      // Rotate (x, dz) by BEND_ANG in the XZ plane
      sx = x * Math.cos(BEND_ANG) - dz * Math.sin(BEND_ANG);
      sz = x * Math.sin(BEND_ANG) + dz * Math.cos(BEND_ANG) + BEND_Z;
    }

    // --- Valley walls in (possibly rotated) space ---
    const vAbs   = Math.abs(sx);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    // Bend mouth closing wall: terrain rises quickly beyond BEND_Z
    // to block the straight-ahead view. Scaled by how far past the bend.
    const bendWall = pastBend
      ? Math.min(Math.max(0, (z - BEND_Z - 5) * 1.2), 55)
      : 0;

    // West cliff end-wall (box-canyon head at waterfall)
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    // Valley narrows toward west
    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    // Gentle floor tilt (water flows west)
    const floorTilt = z * 0.03;

    // --- Stream channel cut ---
    // Stream centreline: straight at x=1+meander for z <= BEND_Z
    // past bend it curves with the rotated coords (handled by terrain naturally)
    const streamCx = 1 + Math.sin(z * 0.05) * 1.2;
    const sDist    = Math.abs(x - streamCx);
    const streamCut = Math.max(0, (3.8 - sDist) * 1.05);

    // --- Elven halls SHELF ---
    // Suppress the valley-wall rise in a small patch on the west wall:
    // centred at (x≈-20, z≈-55), radius≈12 in ZX space.
    // This flattens the slope locally, creating a ledge.
    const shelfCX = -22, shelfCZ = -55, shelfR = 12;
    const shelfDist = Math.sqrt((x - shelfCX)**2 + (z - shelfCZ)**2);
    const shelfFac  = Math.max(0, 1 - shelfDist / shelfR);
    // Shelf target height: 30% of the way up the wall at that point ≈ -22
    // Suppress valley term by shelfFac: reduces the wall height there
    const valleyShelfed = valley * (1 - shelfFac * 0.68);

    // --- Surface detail ---
    const detail = noise(x * 0.07, z * 0.07) * 2.2
                 + n2(x * 0.2,  z * 0.2)  * 0.8;

    const base = -38 + floorTilt + detail;
    return base + valleyShelfed + narrowWall + bendWall + westCliff - streamCut;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    const streamCx   = 1 + Math.sin(vz * 0.05) * 1.2;
    const sDist      = Math.abs(vx - streamCx);
    const streamProx = Math.max(0, 1 - sDist / 5.5);
    const cliffFac   = Math.max(0, Math.min(1, (-vz - 80) / 25));

    // Shelf area: greener, flatter-looking (less rock)
    const shelfDist = Math.sqrt((vx + 20)**2 + (vz + 55)**2);
    const shelfGreen = Math.max(0, 1 - shelfDist / 12) * 0.4;

    const r0 = lerp(0.25, 0.52, gold + shelfGreen * 0.3);
    const g0 = lerp(0.50, 0.54, gold + shelfGreen);
    const b0 = lerp(0.16, 0.20, gold);
    const r1 = 0.48 + rockN * 0.10;
    const g1 = 0.46 + rockN * 0.07;
    const b1 = 0.42;

    let r = lerp(r0, r1, heightFrac * (1 - shelfGreen));
    let g = lerp(g0, g1, heightFrac * (1 - shelfGreen));
    let b = lerp(b0, b1, heightFrac);

    r = lerp(r, 0.72, cliffFac * heightFrac * 0.85);
    g = lerp(g, 0.70, cliffFac * heightFrac * 0.85);
    b = lerp(b, 0.66, cliffFac * heightFrac * 0.85);

    r = lerp(r, 0.16, streamProx * 0.55);
    g = lerp(g, 0.19, streamProx * 0.55);
    b = lerp(b, 0.12, streamProx * 0.55);

    return [r, g, b];
  },

  // -----------------------------------------------------------
  //  PATH  — stays east (high-x) of stream until bridge
  //  Bridge at x=1, z=0. Path approaches along x=7..5 east bank,
  //  then steps across to x=1 at z=4, crosses, continues west.
  // -----------------------------------------------------------
  onPath(x, z) {
    // Descent from arrival into bent valley section
    if (z > 65) {
      const t  = Math.max(0, Math.min(1, (z - 65) / 28));
      const cx = api_lerp(14, 20, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    // Valley floor — east bank, well clear of stream (stream cx ≈ 1..2, path at x=7)
    if (z > 4) {
      const t  = Math.max(0, Math.min(1, (z - 4) / 61));
      const cx = api_lerp(7, 14, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    // Bridge crossing — path narrows to bridge centreline x=1
    if (z >= -4) {
      return Math.max(0, 1 - Math.abs(x - 1) / 3.5);
    }
    // West of bridge toward halls on hillside (x drifts toward -18)
    if (z >= -70) {
      const t  = Math.max(0, Math.min(1, (-z - 4) / 66));
      const cx = api_lerp(-14, 1, 1 - t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    return 0;
  },

  pathWaypoints: [
    [20, 92],   // arrival in bent section
    [18, 80],
    [16, 68],
    [14, 58],   // valley floor reached
    [12, 45],
    [ 9, 30],
    [ 7, 15],   // east bank, clear of stream
    [ 7,  8],
    [ 1,  2],   // step onto bridge
    [ 1, -4],   // off bridge west side
    [-3, -14],
    [-8, -28],
    [-13,-42],
    [-18,-50],  // climbing up toward shelf
    [-22,-60],  // halls entrance on hillside
  ],

  lorePoints: [
    {
      pos: { x: 18, z: 80 }, radius: 10,
      text: 'At last they rode over the top of a steep bank, and Frodo looked down. The valley of Rivendell lay below, misty and pale, and very far away. He could hear, far beneath him, the voice of a river and the sound of falling water.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: 1, z: 0 }, radius: 8,
      text: 'The Ford of Bruinen — where the Ringwraiths were swept away by the river Elrond had set to flood at his command. The waters still ran swift and cold over smooth grey stones.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: -22, z: -55 }, radius: 9,
      text: '"Welcome to Rivendell, Mr. Baggins." A perfect house, whether you like food or sleep or story-telling or singing, or just sitting and thinking best, or a pleasant mixture of them all.',
      cite: 'The Fellowship of the Ring, Book II, Ch. 1'
    },
    {
      pos: { x: -2, z: -84 }, radius: 12,
      text: 'At the valley\'s head, a great fall of water leapt from a high cliff ledge into a mist-filled pool, and from that pool the Bruinen was born. The Elves said the voice of the fall could be heard in every hall of Imladris.',
      cite: 'The Fellowship of the Ring, Book II'
    },
  ],

  boundary: 150,

  transitions: [
    { trigger: { x: 22, z: 105, radius: 14 }, to: 'Weathertop' },
  ],

  arrivals: {
    'Weathertop': { x: 20, z: 92, yaw: 0 },
  },

  // -----------------------------------------------------------
  //  WALKABLE BRIDGE SEGMENTS
  //  Three segments approximate a gentle arch (/-\).
  //  Bridge runs along X axis → yaw = PI/2.
  //  BR_WATER = waterY(0) = -39.5.
  //  Deck ends at water + 1.5 = -38.0. Crown +2.5 = -35.5.
  //  Each segment length=3.5 (X span), width=3.2 (Z depth).
  // -----------------------------------------------------------
  walkables: [
    // Left ramp: x -3.25 to 0.25, centre x=-1.5, z=0
    { x: -1.5, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -38.0, yEnd: -35.5 },
    // Crown: x 0.25 to 3.75, centre x=2.0, z=0  (slight residual curve)
    { x:  2.0, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -35.5, yEnd: -35.5 },
    // Right ramp: x 3.75 to 7.25, centre x=5.5, z=0
    { x:  5.5, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -35.5, yEnd: -38.0 },
  ],

  // -----------------------------------------------------------
  //  BUILD SCENE
  // -----------------------------------------------------------
  buildScene(THREE, scene, groundY, MAT) {
    const refs = {
      waterParticles:  [],
      waterfallMeshes: [],
      streamBoxes:     [],
      mistParticles:   [],
      foliage:         [],
      t: 0,
    };

    const matGold   = new THREE.MeshLambertMaterial({ color: 0xd4a030 });
    const matRust   = new THREE.MeshLambertMaterial({ color: 0xb85828 });
    const matAmber  = new THREE.MeshLambertMaterial({ color: 0xe8b840 });
    const matCopper = new THREE.MeshLambertMaterial({ color: 0xc07020 });
    const matWood   = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    const matElven  = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
    const matRoof   = new THREE.MeshLambertMaterial({ color: 0x607848 });
    const matStone  = MAT.STONE;
    const matMoss   = MAT.STONE_MOSS;
    const matDark   = MAT.STONE_DARK;

    const matStream = new THREE.MeshLambertMaterial({
      color: 0x4a9ab8, transparent: true, opacity: 0.86,
    });
    const matFoam = new THREE.MeshLambertMaterial({
      color: 0xddeeff, transparent: true, opacity: 0.78,
    });

    // =====================================================
    //  STREAM — 3D boxes, smooth flat waterY surface
    //
    //  waterY(z) = BASE_WATER + z * TILT (purely linear).
    //  chFloor always sampled at x=1 (channel deepest point),
    //  so boxH = waterY - chFloor is consistent.
    //  Box is positioned at streamCx for visual meander, but
    //  its height anchors to the x=1 channel depth reference.
    //  This guarantees all box tops land at exactly waterY(z).
    //  Stream starts at z=65 (bend point) and runs to z=-85.
    // =====================================================
    const BASE_WATER = -39.5;
    const WATER_TILT =  0.03;
    const STREAM_W   =  5.5;
    const STREAM_DZ  =  5.0;

    function waterY(z) { return BASE_WATER + z * WATER_TILT; }
    function streamCx(z) { return 1 + Math.sin(z * 0.05) * 1.2; }

    for (let sz = 65; sz >= -85; sz -= STREAM_DZ) {
      const segZ    = sz - STREAM_DZ / 2;
      const cx      = streamCx(segZ);
      const wY      = waterY(segZ);
      const chFloor = groundY(1, segZ);
      const boxH    = Math.max(0.4, wY - chFloor);
      const sBox    = new THREE.Mesh(
        new THREE.BoxGeometry(STREAM_W, boxH, STREAM_DZ + 0.2),
        matStream.clone()
      );
      sBox.position.set(cx, chFloor + boxH / 2, segZ);
      scene.add(sBox);
      refs.streamBoxes.push(sBox);
    }

    // =====================================================
    //  AUTUMN TREES — on valley walls, clear of stream
    // =====================================================
    const leafMats = [matGold, matRust, matAmber, matCopper];
    const treeDefs = [
      // West wall
      [-16,-5],[-20,10],[-24,-20],[-28,5],[-18,30],[-26,42],
      [-22,-35],[-18,-52],[-24,-55],[-14,-65],
      // East wall
      [22,0],[26,18],[24,-12],[28,35],[20,-28],[26,-45],[22,-58],
      // Floor edges (east of stream, well clear)
      [8,20],[9,-10],[8,-35],[10,5],
      // Near bend
      [18,55],[14,62],[16,70],[22,75],
    ];
    treeDefs.forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz);
      const h  = 5.5 + (i % 5) * 1.4;
      const lm = leafMats[i % leafMats.length];
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, h, 9), matWood);
      trunk.position.set(tx, gy + h/2 - h*0.25, tz);
      scene.add(trunk);
      const cr  = 2.8 + (i % 3) * 0.7;
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h*0.8 + cr*0.45, tz);
      scene.add(can);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(cr*0.72, 8, 6), lm);
      c2.position.set(tx + (i%2?0.9:-0.9), gy + h*0.95 + cr*0.45, tz + 0.5);
      scene.add(c2);
      refs.foliage.push(can, c2);
    });

    // =====================================================
    //  BEND MOUTH MIST — large volumes at z=72..100
    // =====================================================
    [
      { x:-2,  z:76, r:13, op:0.28 },
      { x:10,  z:80, r:16, op:0.32 },
      { x:20,  z:78, r:12, op:0.24 },
      { x: 4,  z:88, r:18, op:0.20 },
      { x:14,  z:86, r:14, op:0.28 },
      { x: 0,  z:96, r:20, op:0.16 },
      { x:-6,  z:92, r:11, op:0.22 },
      { x:26,  z:84, r:10, op:0.18 },
    ].forEach(({ x: mx, z: mz, r: mr, op }) => {
      const mGy  = groundY(mx, mz);
      const mMat = new THREE.MeshLambertMaterial({
        color: 0xd8eef4, transparent: true, opacity: op, depthWrite: false,
      });
      const mMesh = new THREE.Mesh(new THREE.SphereGeometry(mr, 8, 6), mMat);
      mMesh.position.set(mx, mGy + mr * 0.55, mz);
      mMesh._phase  = Math.random() * Math.PI * 2;
      mMesh._startY = mMesh.position.y;
      scene.add(mMesh);
      refs.mistParticles.push(mMesh);
    });

    // =====================================================
    //  WATERFALL CHUTE — planes draped along terrain slope
    //
    //  Each PlaneGeometry is created in its default orientation
    //  (faces +Z, normal = +Z). We then:
    //    1. rotateX(-PI/2) — lay flat on XZ plane, normal = +Y
    //  That's all for the geometry. Then on the MESH:
    //    2. rotation.x = slopeAngle — tilt to follow cliff face
    //       where slopeAngle = atan2(dy, dz), dy = rise, dz = run
    //  This way the plane drapes along the slope like water
    //  flowing down the cliff face.
    //  We also rotate the mesh around Y to face slightly toward
    //  the valley (the cliff face is not perfectly Z-aligned).
    // =====================================================
    const WF_X     = -1;
    const WF_Z_TOP = -115;
    const WF_Z_BOT = -88;
    const WF_DZ    =  4;

    for (let cz = WF_Z_TOP; cz < WF_Z_BOT; cz += WF_DZ) {
      const z0 = cz, z1 = cz + WF_DZ;
      const h0 = groundY(WF_X, z0);
      const h1 = groundY(WF_X, z1);
      const midZ = (z0 + z1) / 2;
      const midH = (h0 + h1) / 2;

      const dz      = z1 - z0;        // +4 (toward pool = east = positive Z)
      const dy      = h1 - h0;        // negative when dropping toward pool
      const segLen  = Math.sqrt(dz*dz + dy*dy);
      const slopeAngle = Math.atan2(dy, dz);  // negative on steep drop

      const tFrac = (cz - WF_Z_TOP) / (WF_Z_BOT - WF_Z_TOP); // 0=top, 1=bottom
      const wfW   = 2.0 + tFrac * 2.2;  // wider at pool base

      // Geometry laid flat with rotateX
      const wfGeo = new THREE.PlaneGeometry(wfW, segLen + 0.4);
      wfGeo.rotateX(-Math.PI / 2);   // now faces +Y (lies in XZ plane)

      const wfMat = new THREE.MeshLambertMaterial({
        color: tFrac < 0.5 ? 0x99ccee : 0xbbddff,
        transparent: true,
        opacity: 0.55 + tFrac * 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);
      wfMesh.position.set(WF_X, midH + 0.5, midZ);
      // Tilt mesh to follow cliff slope in ZY plane
      wfMesh.rotation.x = slopeAngle;
      scene.add(wfMesh);
      refs.waterfallMeshes.push(wfMesh);
    }

    // Splash pool
    const poolZ   = WF_Z_BOT + 2;
    const poolTop = waterY(poolZ);
    const splash  = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 7), matFoam);
    splash.scale.y = 0.10;
    splash.position.set(WF_X, poolTop + 0.1, poolZ);
    scene.add(splash);

    const sprayMat = new THREE.MeshLambertMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.70 });
    const spray    = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 6), sprayMat);
    spray.scale.y  = 2.0;
    spray.position.set(WF_X, poolTop + 3.5, poolZ - 1);
    scene.add(spray);

    for (let pi = 0; pi < 24; pi++) {
      const angle  = (pi / 24) * Math.PI * 2;
      const pr     = 0.8 + Math.random() * 4.2;
      const pMat   = new THREE.MeshLambertMaterial({
        color: 0xddeeff, transparent: true, opacity: 0.35 + Math.random() * 0.4, depthWrite: false,
      });
      const pMesh  = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.45, 6, 4), pMat);
      const startY = poolTop + 0.5 + Math.random() * 4;
      pMesh.position.set(WF_X + Math.cos(angle)*pr*0.6, startY, poolZ + Math.sin(angle)*pr);
      pMesh._startY = startY;
      pMesh._phase  = Math.random() * Math.PI * 2;
      scene.add(pMesh);
      refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  STONE ARCH BRIDGE — gentle arc, matches walkables[]
    //
    //  Bridge runs along X from x≈-3 to x≈7.
    //  Walkable segments: ends at y=-38, crown at y=-35.5.
    //  Visual arch matches those Y values.
    //  No large cylindrical pillars — small stone abutment
    //  blocks at each end tuck into the stream bank.
    //  Arch ring: 9 voussoir cylinders (Z-axis) in a
    //  shallow semicircle. Deck: 10 thin BoxGeometry slabs
    //  following the arch curve. Parapets on Z edges.
    // =====================================================
    const BR_Z      =  0;
    const BR_X0     = -3.25;   // west abutment x
    const BR_X1     =  7.25;   // east abutment x
    const BR_CX     = (BR_X0 + BR_X1) / 2;   // = 2.0
    const BR_SPAN   = BR_X1 - BR_X0;          // = 10.5
    const DECK_END  = -38.0;   // deck Y at abutments (water + 1.5)
    const DECK_TOP  = -35.5;   // deck Y at crown (+2.5 above ends)
    // Arch circle: passes through ends (DECK_END) and crown (DECK_TOP).
    // For a gentle arch: radius R, sag S = DECK_TOP - DECK_END = 2.5
    // Using circular arc: R = (half_span² + S²) / (2S)
    const HALF_SPAN = BR_SPAN / 2;   // 5.25
    const SAG       = DECK_TOP - DECK_END;  // 2.5
    const ARCH_R    = (HALF_SPAN*HALF_SPAN + SAG*SAG) / (2*SAG);  // ≈ 13.5 (large R = gentle)
    const ARCH_CY   = DECK_END - ARCH_R;    // centre of arch circle (below deck)
    const ARCH_W    = 3.2;   // bridge width (Z span)

    // Half-angle of the arch (angle from vertical to springer)
    const halfAng = Math.asin(HALF_SPAN / ARCH_R);

    // Small abutment blocks at each springer
    [BR_X0, BR_X1].forEach(ax => {
      const abGy  = groundY(ax, BR_Z);
      const abTop = DECK_END;
      const abH   = abTop - abGy + 0.3;
      const abGeo = new THREE.BoxGeometry(1.4, Math.max(0.5, abH), ARCH_W + 0.4);
      const ab    = new THREE.Mesh(abGeo, matDark);
      ab.position.set(ax, abGy + Math.max(0.5, abH)/2, BR_Z);
      scene.add(ab);
    });

    // Arch ring — voussoir cylinders
    const ARCH_SEGS = 9;
    for (let vi = 0; vi < ARCH_SEGS; vi++) {
      const t0   = vi       / ARCH_SEGS;
      const t1   = (vi + 1) / ARCH_SEGS;
      const tM   = (t0 + t1) / 2;
      // Angle sweeps from -halfAng (left springer) to +halfAng (right springer)
      // via the top (angle = 0 = pointing straight up)
      const ang  = -halfAng + tM * 2 * halfAng;
      const vx   = BR_CX + ARCH_R * Math.sin(ang);
      const vy   = ARCH_CY + ARCH_R * Math.cos(ang);
      const vGeo = new THREE.CylinderGeometry(0.45, 0.45, ARCH_W, 6);
      vGeo.rotateX(Math.PI / 2);    // lie along Z
      const vMesh = new THREE.Mesh(vGeo, matStone);
      vMesh.position.set(vx, vy, BR_Z);
      vMesh.rotation.z = ang;       // tilt to be radial
      scene.add(vMesh);
    }

    // Deck slabs following arch curve
    const DECK_SEGS = 12;
    for (let di = 0; di < DECK_SEGS; di++) {
      const t0   = di       / DECK_SEGS;
      const t1   = (di + 1) / DECK_SEGS;
      const tM   = (t0 + t1) / 2;
      const ang  = -halfAng + tM * 2 * halfAng;
      const ang0 = -halfAng + t0 * 2 * halfAng;
      const ang1 = -halfAng + t1 * 2 * halfAng;

      // Top of arch at this point
      const dx   = BR_CX + ARCH_R * Math.sin(ang);
      const dy   = ARCH_CY + ARCH_R * Math.cos(ang) + 0.25; // +deck thickness/2
      const x0   = BR_CX + ARCH_R * Math.sin(ang0);
      const x1   = BR_CX + ARCH_R * Math.sin(ang1);
      const slabW = Math.abs(x1 - x0) + 0.05;

      const slabGeo = new THREE.BoxGeometry(slabW, 0.4, ARCH_W + 0.2);
      const slab    = new THREE.Mesh(slabGeo, matStone);
      slab.position.set(dx, dy, BR_Z);
      slab.rotation.z = ang;   // tangent tilt = radial angle
      scene.add(slab);
    }

    // Parapets — thin box running full span on each Z edge
    // Approximate as straight horizontal boxes (gentle arch ≈ flat)
    [-ARCH_W/2 - 0.18, ARCH_W/2 + 0.18].forEach(pzOff => {
      const pGeo = new THREE.BoxGeometry(BR_SPAN + 0.4, 0.85, 0.38);
      const par  = new THREE.Mesh(pGeo, matStone);
      par.position.set(BR_CX, DECK_TOP + 0.42, BR_Z + pzOff);
      scene.add(par);
    });

    // =====================================================
    //  ROCKY VALLEY WALLS
    // =====================================================
    [[-18,8,2.0],[-22,-20,2.4],[-16,-38,1.8],
     [22,14,2.2],[26,-24,1.9],[24,42,1.6],
     [-24,50,2.6],[28,-10,2.0],[-20,-65,2.1],
     [26,-52,1.7],[-14,-68,1.5],[20,-65,1.9]
    ].forEach(([wx,wz,ws]) => {
      const wm = new THREE.Mesh(
        new THREE.SphereGeometry(ws, 8, 6),
        Math.random() > 0.4 ? matDark : matStone
      );
      wm.position.set(wx, groundY(wx, wz) + ws*0.45, wz);
      wm.scale.set(1+Math.random()*0.3, 0.65+Math.random()*0.35, 1+Math.random()*0.3);
      wm.rotation.y = Math.random()*Math.PI;
      scene.add(wm);
    });

    // =====================================================
    //  ELVEN HALLS — on shelf at x≈-20, z≈-55 (~32% up west wall)
    //  groundY(-20, -55) ≈ -20.8. Place base there.
    //  Small retaining wall below the shelf edge.
    // =====================================================
    const HX = -22, HZ = -55;
    const HGY = groundY(HX, HZ);  // ≈ -20.8

    // Retaining wall — a row of stone chunks at the shelf front edge
    for (let rz = HZ - 6; rz <= HZ + 6; rz += 3) {
      const rwx = HX + 4;   // shelf front (facing valley)
      const rwGy = groundY(rwx, rz);
      const rwH  = 3.5;
      const rw   = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, rwH, 9), matDark);
      rw.position.set(rwx, rwGy + rwH/2 - rwH*0.2, rz);
      scene.add(rw);
    }

    // Main hall
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.0, 6.5, 9), matElven);
    hall.position.set(HX, HGY + 6.5/2 - 6.5*0.22, HZ);
    scene.add(hall);
    const hallRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 5.0, 3.2, 9), matRoof);
    hallRoof.position.set(HX, HGY + 6.5 - 6.5*0.22 + 1.1, HZ);
    scene.add(hallRoof);

    // Secondary hall — slightly higher on slope
    const h2x = HX - 4, h2z = HZ - 7, h2Gy = groundY(h2x, h2z);
    const hall2 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 5.5, 9), matElven);
    hall2.position.set(h2x, h2Gy + 5.5/2 - 5.5*0.22, h2z);
    scene.add(hall2);
    const hall2Roof = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.6, 2.8, 9), matRoof);
    hall2Roof.position.set(h2x, h2Gy + 5.5 - 5.5*0.22 + 0.8, h2z);
    scene.add(hall2Roof);

    // Slender tower
    const btX = HX + 2, btZ = HZ + 5, btGy = groundY(btX, btZ);
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 11, 9), matElven);
    bt.position.set(btX, btGy + 11/2 - 11*0.22, btZ);
    scene.add(bt);
    const btRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.0, 3.2, 9), matRoof);
    btRoof.position.set(btX, btGy + 11 - 11*0.22 + 1.0, btZ);
    scene.add(btRoof);

    // Colonnade along shelf edge
    for (let pi = 0; pi < 4; pi++) {
      const px = HX - 1 + pi * 1.8, pz = HZ + 7, phGy = groundY(px, pz), phH = 4.8;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, phH, 9), matElven);
      pil.position.set(px, phGy + phH/2 - phH*0.22, pz);
      scene.add(pil);
    }
    // Lintel
    const clx = HX + 2, clz = HZ + 7, clGy = groundY(clx, clz);
    const lintelGeo = new THREE.CylinderGeometry(0.22, 0.22, 7.5, 9);
    lintelGeo.rotateZ(Math.PI/2);
    const lintel = new THREE.Mesh(lintelGeo, matElven);
    lintel.position.set(clx, clGy + 4.8 - 4.8*0.1, clz);
    scene.add(lintel);

    // Hall glow
    const fireLight = new THREE.PointLight(0xffcc66, 2.0, 35);
    fireLight.position.set(HX, HGY + 6, HZ);
    scene.add(fireLight);
    const fireFill = new THREE.PointLight(0xffaa44, 0.8, 22);
    fireFill.position.set(h2x, h2Gy + 5, h2z);
    scene.add(fireFill);

    // =====================================================
    //  ENTRY RIDGE STONES near arrival
    // =====================================================
    [[18,80,2.8],[22,78,3.0],[16,72,2.5],[20,68,2.6]].forEach(([rx,rz,rh]) => {
      const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.40, rh, 9), matMoss);
      rMesh.position.set(rx, groundY(rx, rz) + rh/2 - rh*0.25, rz);
      scene.add(rMesh);
    });

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

    if (refs.streamBoxes) {
      refs.streamBoxes.forEach((s, i) => {
        s.material.opacity = 0.80 + Math.sin(T*1.4 + i*0.7)*0.07;
      });
    }

    if (refs.waterfallMeshes) {
      refs.waterfallMeshes.forEach((wf, i) => {
        wf.material.opacity = Math.max(0.25,
          wf.material.opacity + Math.sin(T*1.8 + i*0.6)*dt*0.12
        );
      });
    }

    if (refs.waterParticles) {
      refs.waterParticles.forEach(p => {
        p.position.y += dt * 0.28;
        p.position.x += Math.sin(T*0.4 + p._phase)*dt*0.06;
        p.material.opacity = 0.25 + Math.sin(T*0.8 + p._phase)*0.22;
        if (p.position.y > p._startY + 8) p.position.y = p._startY;
      });
    }

    if (refs.mistParticles) {
      refs.mistParticles.forEach((p, i) => {
        p.material.opacity = Math.max(0.08,
          p.material.opacity + Math.sin(T*0.3 + p._phase)*dt*0.06
        );
        p.position.y = p._startY + Math.sin(T*0.22 + i)*0.7;
      });
    }

    if (refs.foliage) {
      refs.foliage.forEach((f, i) => {
        f.rotation.z = Math.sin(T*0.55 + i*0.9)*0.022;
        f.rotation.x = Math.sin(T*0.38 + i*1.2)*0.014;
      });
    }

    if (refs.fireLight) refs.fireLight.intensity = 1.8 + Math.sin(T*1.1)*0.25;
    if (refs.fireFill)  refs.fireFill.intensity  = 0.7  + Math.sin(T*0.85+1.2)*0.14;
  },
};

window.Rivendell = Rivendell;
