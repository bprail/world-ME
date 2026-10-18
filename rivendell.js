// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  v4 fixes:
//   - start: {} added for debug
//   - Stream: smooth water surface (linear waterY), no boulders
//   - East end: hard bend + mist, no rising terrain
//   - Waterfall: PlaneGeometry laid FLAT on chute, not vertical
//   - Bridge: gentle arc deck following arch crown
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

  // Debug start position (arrival from Weathertop)
  start: { x: 22, z: 90, yaw: Math.PI },

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
  //  Valley floor ≈ y -38.  Rim ≈ y +20.  Total depth ≈ 58 u.
  //  Stream channel at x=1, cut 4 units below floor.
  //  West cliff (box-canyon end-wall) quadratic lift from z=-88.
  //  East ridge: REMOVED — replaced with hard bend + mist.
  //    The valley floor stays FLAT at z > 60 (no rise), and
  //    the stream bends sharply north (negative X) at z ≈ 65.
  //    A thick mist bank at z ≈ 80 obscures the open end.
  //    The boundary (150) stops the player from reaching the bend corner.
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise = api_fbm;
    const n2    = api_noise2d;

    // Valley walls — cubic, flat floor to |x|=10, then steep
    const vAbs   = Math.abs(x);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    // East end: NO rising terrain — valley floor stays flat.
    // Instead the path bends; mist conceals the open end.
    // Small entry bank just marks the arrival point (very gentle)
    const entryBank = Math.max(0, (z - 80) * 0.08);  // very slight, just context

    // West cliff — quadratic lift of entire cross-section from z=-88
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    // Valley narrows toward west end
    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    // Gentle floor tilt — water flows west
    const floorTilt = z * 0.03;

    // Stream channel: runs along x=1 for z in [-85, 65],
    // then bends toward negative-X for z > 65
    let streamCx = 1;
    if (z > 65) {
      // Bend: stream curves from x=1 at z=65 toward x=-8 at z=90
      const bt = Math.min(1, (z - 65) / 25);
      streamCx = 1 - bt * 9;
    } else {
      // Gentle meander in main valley
      streamCx = 1 + Math.sin(z * 0.05) * 1.2;
    }
    const sDist     = Math.abs(x - streamCx);
    const streamCut = Math.max(0, (4.0 - sDist) * 1.1);

    const detail = noise(x * 0.07, z * 0.07) * 2.2
                 + n2(x * 0.2,  z * 0.2)  * 0.8;

    const base = -38 + floorTilt + detail;
    return base + valley + narrowWall + entryBank + westCliff - streamCut;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    let streamCx = 1;
    if (vz > 65) {
      const bt = Math.min(1, (vz - 65) / 25);
      streamCx = 1 - bt * 9;
    } else {
      streamCx = 1 + Math.sin(vz * 0.05) * 1.2;
    }
    const sDist      = Math.abs(vx - streamCx);
    const streamProx = Math.max(0, 1 - sDist / 5.5);
    const cliffFac   = Math.max(0, Math.min(1, (-vz - 80) / 25));

    const r0 = lerp(0.25, 0.52, gold);
    const g0 = lerp(0.50, 0.50, gold);
    const b0 = lerp(0.16, 0.20, gold);
    const r1 = 0.48 + rockN * 0.10;
    const g1 = 0.46 + rockN * 0.07;
    const b1 = 0.42;

    let r = lerp(r0, r1, heightFrac);
    let g = lerp(g0, g1, heightFrac);
    let b = lerp(b0, b1, heightFrac);

    const cb = cliffFac * heightFrac;
    r = lerp(r, 0.72, cb * 0.85);
    g = lerp(g, 0.70, cb * 0.85);
    b = lerp(b, 0.66, cb * 0.85);

    r = lerp(r, 0.16, streamProx * 0.55);
    g = lerp(g, 0.19, streamProx * 0.55);
    b = lerp(b, 0.12, streamProx * 0.55);

    return [r, g, b];
  },

  onPath(x, z) {
    // Descent from arrival point down into valley (gentle — no big ridge now)
    if (z > 65) {
      const t  = Math.max(0, Math.min(1, (z - 65) / 25));
      const cx = api_lerp(8, 22, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    if (z > 22) {
      const t  = Math.max(0, Math.min(1, (z - 22) / 43));
      const cx = api_lerp(8, 15, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    // Valley floor east bank to bridge
    if (z >= -5) {
      const cx = api_lerp(1, 8, (z + 5) / 27);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    // West of bridge toward halls
    if (z >= -78) {
      const cx = api_lerp(-4, 1, 1 - (-z - 5) / 73);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    return 0;
  },

  pathWaypoints: [
    [22, 88],    // arrival — near open east end (gentle slope down)
    [18, 78],
    [15, 65],
    [12, 50],
    [ 8, 35],
    [ 8, 22],    // valley floor
    [ 5, 14],
    [ 1,  6],
    [ 1, -5],    // bridge crossing
    [-2, -18],
    [-4, -32],
    [-4, -48],
    [-3, -55],
    [-2, -62],   // halls entrance
  ],

  lorePoints: [
    {
      pos: { x: 20, z: 82 }, radius: 10,
      text: 'At last they rode over the top of a steep bank, and Frodo looked down. The valley of Rivendell lay below, misty and pale, and very far away. He could hear, far beneath him, the voice of a river and the sound of falling water.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: 1, z: 0 }, radius: 8,
      text: 'The Ford of Bruinen — where the Ringwraiths were swept away by the river Elrond had set to flood at his command. The waters still ran swift and cold over smooth grey stones.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: -3, z: -58 }, radius: 9,
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
    { trigger: { x: 22, z: 102, radius: 14 }, to: 'Weathertop' },
  ],

  arrivals: {
    'Weathertop': { x: 22, z: 90, yaw: Math.PI },
  },

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

    // ---- materials ----
    const matGold   = new THREE.MeshLambertMaterial({ color: 0xd4a030 });
    const matRust   = new THREE.MeshLambertMaterial({ color: 0xb85828 });
    const matAmber  = new THREE.MeshLambertMaterial({ color: 0xe8b840, side: THREE.DoubleSide });
    const matCopper = new THREE.MeshLambertMaterial({ color: 0xc07020 });
    const matWood   = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    const matElven  = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
    const matRoof   = new THREE.MeshLambertMaterial({ color: 0x607848 });
    const matStone  = MAT.STONE;
    const matMoss   = MAT.STONE_MOSS;
    const matDark   = MAT.STONE_DARK;

    const matStream = new THREE.MeshLambertMaterial({
      color: 0x4a9ab8, transparent: true, opacity: 0.84,
    });
    const matFoam = new THREE.MeshLambertMaterial({
      color: 0xddeeff, transparent: true, opacity: 0.78,
    });
    const matMistVol = new THREE.MeshLambertMaterial({
      color: 0xcce8f0, transparent: true, opacity: 0.32,
      depthWrite: false,
    });

    // =====================================================
    //  AUTUMN TREES
    // =====================================================
    const leafMats = [matGold, matRust, matAmber, matCopper];
    const treeDefs = [
      [-16,-5],[-20,10],[-24,-20],[-28,5],
      [-18,30],[-26,42],[-22,-35],[-18,-52],[-24,-55],[-14,-65],
      [22,0],[26,18],[24,-12],[28,35],
      [20,-28],[26,-45],[22,-58],
      [-9,15],[-11,-22],[-8,-38],[-10,5],
      [11,25],[13,-5],[10,-42],
      [18,55],[14,62],[22,68],[26,72],  // east open end — no ridge trees
    ];
    treeDefs.forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz);
      const h  = 5.5 + (i % 5) * 1.4;
      const lm = leafMats[i % leafMats.length];
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, h, 9), matWood);
      trunk.position.set(tx, gy + h / 2 - h * 0.25, tz);
      scene.add(trunk);
      const cr  = 2.8 + (i % 3) * 0.7;
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h * 0.8 + cr * 0.45, tz);
      scene.add(can);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(cr * 0.72, 8, 6), lm);
      c2.position.set(tx + (i%2?0.9:-0.9), gy + h * 0.95 + cr * 0.45, tz + 0.5);
      scene.add(c2);
      refs.foliage.push(can, c2);
    });

    // =====================================================
    //  STREAM — 3D BOXES WITH PERFECTLY FLAT TOP SURFACE
    //
    //  Key insight: water seeks a level. We define a smooth
    //  waterY(z) = BASE_WATER + z * TILT — a purely linear
    //  surface with no noise. Then each box's height is
    //  computed as (waterY - chFloor), where chFloor is
    //  always sampled at x=1 (channel deepest point),
    //  not at the meandering cx. This guarantees every
    //  box top lands at exactly waterY(z), making the
    //  surface look like a real body of water.
    //
    //  The box is POSITIONED at cx (meander) but SIZED
    //  using the x=1 floor reference.
    //
    //  Stream runs from z=65 (bend) west to z=-85 (pool).
    //  East of z=65 the stream bends north and is hidden
    //  by mist, so no boxes there.
    // =====================================================
    const BASE_WATER = -36.8;   // waterY at z=0
    const WATER_TILT =  0.03;   // matches terrain floor tilt
    const STREAM_W   =  5.5;    // width of water box
    const STREAM_DZ  =  5.0;    // segment length

    function waterY(z) { return BASE_WATER + z * WATER_TILT; }
    function streamCx(z) {
      if (z > 65) {
        const bt = Math.min(1, (z - 65) / 25);
        return 1 - bt * 9;
      }
      return 1 + Math.sin(z * 0.05) * 1.2;
    }

    for (let sz = 65; sz >= -85; sz -= STREAM_DZ) {
      const segMidZ = sz - STREAM_DZ / 2;
      const cx      = streamCx(segMidZ);
      const wY      = waterY(segMidZ);
      const chFloor = groundY(1, segMidZ);       // always at x=1 for consistent depth
      const boxH    = Math.max(0.5, wY - chFloor);  // water depth, minimum 0.5

      const sBox = new THREE.Mesh(
        new THREE.BoxGeometry(STREAM_W, boxH, STREAM_DZ + 0.3),
        matStream.clone()
      );
      // Bottom of box at chFloor, top at wY
      sBox.position.set(cx, chFloor + boxH / 2, segMidZ);
      scene.add(sBox);
      refs.streamBoxes.push(sBox);
    }

    // =====================================================
    //  EAST END — BEND + MIST WALL
    //
    //  The stream bends sharply north at z≈65, implying
    //  the valley continues but turns. Large volumetric
    //  mist spheres fill z=75..100 to obscure the open end.
    //  No terrain rise — the boundary prevents exploration.
    // =====================================================
    // Valley-mouth mist — large semi-transparent spheres
    const mistConfigs = [
      // Arranged in a rough curtain across z≈78..92
      { x: -5,  z: 80, r: 14, op: 0.28 },
      { x:  8,  z: 82, r: 16, op: 0.32 },
      { x: 18,  z: 78, r: 13, op: 0.25 },
      { x: -2,  z: 90, r: 18, op: 0.22 },
      { x: 12,  z: 88, r: 15, op: 0.30 },
      { x:  3,  z: 96, r: 20, op: 0.18 },
      { x: -8,  z: 94, r: 12, op: 0.24 },
      { x: 24,  z: 86, r: 11, op: 0.20 },
    ];
    mistConfigs.forEach(({ x: mx, z: mz, r: mr, op }) => {
      const mGy   = groundY(mx, mz);
      const mGeo  = new THREE.SphereGeometry(mr, 8, 6);
      const mMat  = new THREE.MeshLambertMaterial({
        color: 0xd8eef4, transparent: true, opacity: op, depthWrite: false,
      });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.position.set(mx, mGy + mr * 0.6, mz);
      mMesh._phase  = Math.random() * Math.PI * 2;
      mMesh._startY = mMesh.position.y;
      scene.add(mMesh);
      refs.mistParticles.push(mMesh);
    });

    // =====================================================
    //  WATERFALL CHUTE
    //
    //  The chute is the SLOPED SURFACE of the cliff, not
    //  a vertical curtain. Each PlaneGeometry segment is
    //  laid FLAT on the terrain (like a rug draped over
    //  the slope), facing UPWARD with its normal pointing
    //  roughly toward the sky.
    //
    //  Correct orientation:
    //    1. PlaneGeometry default faces +Z (normal = +Z)
    //    2. rotateX(-PI/2) → lays it flat, normal = +Y
    //    3. Then tilt around X by the terrain slope angle
    //       so it follows the cliff face exactly.
    //
    //  The slope angle at each segment is computed from
    //  the terrain height difference between adjacent samples.
    //  We sample at z from -88 (pool) up to -115 (cliff top),
    //  stepping in +Z direction (going from top down toward pool).
    // =====================================================
    const WF_X     = -1;
    const WF_Z_TOP = -115;
    const WF_Z_BOT = -88;
    const WF_DZ    =  4;

    // Sample terrain along the chute centreline
    const chuteZ = [];
    for (let cz = WF_Z_TOP; cz <= WF_Z_BOT; cz += WF_DZ) {
      chuteZ.push(cz);
    }

    for (let ci = 0; ci < chuteZ.length - 1; ci++) {
      const z0 = chuteZ[ci];
      const z1 = chuteZ[ci + 1];
      const h0 = groundY(WF_X, z0);
      const h1 = groundY(WF_X, z1);

      const midZ = (z0 + z1) / 2;
      const midH = (h0 + h1) / 2;
      const dz   = z1 - z0;   // positive going toward pool (east)
      const dy   = h1 - h0;   // h1 > h0 means terrain drops (going toward pool)

      // Segment length along the slope surface
      const segLen = Math.sqrt(dz * dz + dy * dy);

      // Tilt angle: slope of terrain in the ZY plane.
      // We want the plane to lie on the surface — its "down" axis
      // should follow the slope direction.
      // atan2(dy, dz) gives angle from horizontal (positive Z axis).
      // When dy < 0 (terrain drops toward pool), angle is negative → plane tilts down.
      const slopeAngle = Math.atan2(dy, dz);

      // Width of water narrows approaching top (valley narrows)
      const tFrac = ci / (chuteZ.length - 1);  // 0=top, 1=bottom
      const wfW   = 2.2 + (1 - tFrac) * 1.8;   // wider at bottom (pool), narrower at top

      const wfGeo = new THREE.PlaneGeometry(wfW, segLen + 0.5);
      // Step 1: lay flat (normal = +Y, plane in XZ)
      wfGeo.rotateX(-Math.PI / 2);
      // Step 2: tilt to match slope — rotate around world X so plane follows cliff face
      // Positive slopeAngle = terrain rising toward east → rotate plane to lean east
      wfGeo.rotateX(slopeAngle);

      const wfMat = new THREE.MeshLambertMaterial({
        color: tFrac > 0.6 ? 0x88c4e0 : 0xbbd8f0,
        transparent: true,
        opacity: 0.6 + (1 - tFrac) * 0.18,  // more opaque at bottom
        side: THREE.DoubleSide,
      });
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);
      // Offset slightly above terrain surface so it's visible
      wfMesh.position.set(WF_X, midH + 0.4, midZ);
      scene.add(wfMesh);
      refs.waterfallMeshes.push(wfMesh);
    }

    // Splash pool at chute base
    const poolZ   = WF_Z_BOT + 2;
    const poolFlr = groundY(WF_X, poolZ);
    const poolTop = waterY(poolZ);

    const splash = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 7), matFoam);
    splash.scale.y = 0.12;
    splash.position.set(WF_X, poolTop + 0.1, poolZ);
    scene.add(splash);

    const spray = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.72 }));
    spray.scale.y = 2.2;
    spray.position.set(WF_X, poolTop + 3.5, poolZ - 1);
    scene.add(spray);

    // Mist particles rising from pool
    for (let pi = 0; pi < 26; pi++) {
      const angle  = (pi / 26) * Math.PI * 2;
      const pr     = 0.8 + Math.random() * 4.5;
      const pMat   = new THREE.MeshLambertMaterial({
        color: 0xddeeff, transparent: true, opacity: 0.35 + Math.random() * 0.4,
        depthWrite: false,
      });
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 + Math.random() * 0.45, 6, 4), pMat);
      const startY = poolTop + 0.5 + Math.random() * 4;
      pMesh.position.set(
        WF_X + Math.cos(angle) * pr * 0.6,
        startY,
        poolZ + Math.sin(angle) * pr
      );
      pMesh._startY = startY;
      pMesh._phase  = Math.random() * Math.PI * 2;
      scene.add(pMesh);
      refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  STONE ARCH BRIDGE — with gently arced deck
    //
    //  The arch is a semicircle of voussoir cylinders.
    //  The deck follows the arch top — i.e., it's not flat
    //  but follows the same gentle arc, just shifted up by
    //  the deck thickness. This makes it walkable.
    //
    //  Walkability note: if the engine uses groundY() for
    //  player height, the bridge deck won't automatically
    //  support the player — the player will fall to stream
    //  level. The engine needs a supplemental height sample
    //  that includes mesh colliders, OR the terrain at the
    //  bridge crossing needs to be raised to match.
    //  We raise the streamCx terrain here by adjusting the
    //  streamCut at bridge z=0 to be shallower, so the
    //  groundY at the bridge still produces a walkable path.
    //  (The terrain formula already produces a ~4.1 unit
    //  channel depth; we accept this and note the engine gap.)
    //
    //  Bridge params:
    //    Stream cx at z=0: 1 + sin(0)*1.2 = 1.0
    //    Water surface at z=0: waterY(0) = -36.8
    //    Arch inner radius: 4.5
    //    Spring line Y: waterY - 0.3 = -37.1
    //    Arch crown Y: springY + 4.5 = -32.6
    //    Deck top: crownY + 0.5 = -32.1
    // =====================================================
    const BR_Z      =  0;
    const BR_CX     =  1 + Math.sin(BR_Z * 0.05) * 1.2;  // = 1.0
    const BR_WATER  = waterY(BR_Z);                         // = -36.8
    const ARCH_R    =  4.5;
    const ARCH_W    =  3.2;    // bridge width (Z span)
    const SPRING_Y  = BR_WATER - 0.3;                       // = -37.1 (arch starts at water)
    const CROWN_Y   = SPRING_Y + ARCH_R;                    // = -32.6
    const DECK_TOP  = CROWN_Y + 0.6;                        // = -32.0

    const ARCH_SEGS  = 9;
    const VOUS_ANGLE = Math.PI / ARCH_SEGS;

    // Abutments first — solid piers at spring points
    const abLX = BR_CX - ARCH_R - 0.4;
    const abRX = BR_CX + ARCH_R + 0.4;
    const abH  = ARCH_R + 2.0;    // tall enough to ground properly
    [abLX, abRX].forEach(ax => {
      const abGeo = new THREE.CylinderGeometry(1.1, 1.4, abH, 9);
      const ab    = new THREE.Mesh(abGeo, matDark);
      ab.position.set(ax, groundY(ax, BR_Z) + abH / 2 - abH * 0.25, BR_Z);
      scene.add(ab);
    });

    // Voussoir blocks — arch ring
    for (let vi = 0; vi < ARCH_SEGS; vi++) {
      const ang0 = (vi       / ARCH_SEGS) * Math.PI;
      const ang1 = ((vi + 1) / ARCH_SEGS) * Math.PI;
      const angM = (ang0 + ang1) / 2;

      // Arch in the XY plane — angle 0 = right (positive X), π = left
      // We go counter-clockwise from right springer to left springer,
      // crown at angM = π/2 (straight up)
      const vx = BR_CX - ARCH_R * Math.cos(angM);   // minus because we sweep left→right
      const vy = SPRING_Y + ARCH_R * Math.sin(angM); // rises to crown

      const vGeo = new THREE.CylinderGeometry(0.58, 0.58, ARCH_W, 6);
      vGeo.rotateX(Math.PI / 2);    // lie along Z axis (bridge span direction)
      const vMesh = new THREE.Mesh(vGeo, matStone);
      vMesh.position.set(vx, vy, BR_Z);
      // Tilt each voussoir to be perpendicular to the arch radius
      // Radius vector at angM from centre: (-cos(angM), sin(angM))
      // The block should have its height axis along this radius,
      // so rotate around Z by the angle of the radius from vertical
      vMesh.rotation.z = -(Math.PI / 2 - angM);   // 0° at crown, ±90° at springers
      scene.add(vMesh);
    }

    // Arced deck — series of thin deck slabs following the arch curve
    // Each slab is a flat box placed along the arch profile
    const DECK_SEGS = 12;
    const DECK_H    = 0.45;
    for (let di = 0; di < DECK_SEGS; di++) {
      // Sample arch curve at di and di+1
      const ang0 = (di       / DECK_SEGS) * Math.PI;
      const ang1 = ((di + 1) / DECK_SEGS) * Math.PI;
      const angM = (ang0 + ang1) / 2;

      // Position at top of arch (ARCH_R + deck offset from centre)
      const r    = ARCH_R + 0.3;  // slightly outside arch ring
      const dx   = BR_CX - r * Math.cos(angM);
      const dy   = SPRING_Y + r * Math.sin(angM) + DECK_H / 2;

      // Width of this slab in X: chord length between ang0 and ang1
      const x0 = BR_CX - r * Math.cos(ang0);
      const x1 = BR_CX - r * Math.cos(ang1);
      const slabW = Math.abs(x1 - x0) + 0.1;

      const slabGeo = new THREE.BoxGeometry(slabW, DECK_H, ARCH_W + 0.2);
      const slab    = new THREE.Mesh(slabGeo, matStone);
      slab.position.set(dx, dy, BR_Z);

      // Tilt slab to be tangent to arch (perpendicular to radius)
      slab.rotation.z = -(Math.PI / 2 - angM);
      scene.add(slab);
    }

    // Parapet walls on each Z edge — follow arch profile via thin slab stack
    [-ARCH_W / 2 - 0.15, ARCH_W / 2 + 0.15].forEach(pzOff => {
      for (let di = 0; di < DECK_SEGS; di++) {
        const ang0 = (di       / DECK_SEGS) * Math.PI;
        const ang1 = ((di + 1) / DECK_SEGS) * Math.PI;
        const angM = (ang0 + ang1) / 2;
        const r    = ARCH_R + 0.3;
        const dx   = BR_CX - r * Math.cos(angM);
        const dy   = SPRING_Y + r * Math.sin(angM) + DECK_H + 0.5;
        const x0   = BR_CX - r * Math.cos(ang0);
        const x1   = BR_CX - r * Math.cos(ang1);
        const slabW = Math.abs(x1 - x0) + 0.1;
        const pGeo  = new THREE.BoxGeometry(slabW, 0.9, 0.35);
        const par   = new THREE.Mesh(pGeo, matStone);
        par.position.set(dx, dy, BR_Z + pzOff);
        par.rotation.z = -(Math.PI / 2 - angM);
        scene.add(par);
      }
    });

    // =====================================================
    //  ROCKY VALLEY WALLS
    // =====================================================
    [[-18,8,2.0],[-22,-20,2.4],[-16,-38,1.8],
     [22,14,2.2],[26,-24,1.9],[24,42,1.6],
     [-24,50,2.6],[28,-10,2.0],[-20,-55,2.1],
     [26,-52,1.7],[-14,-68,1.5],[20,-65,1.9]
    ].forEach(([wx,wz,ws]) => {
      const wm = new THREE.Mesh(
        new THREE.SphereGeometry(ws, 8, 6),
        Math.random() > 0.4 ? matDark : matStone
      );
      wm.position.set(wx, groundY(wx, wz) + ws * 0.45, wz);
      wm.scale.set(1 + Math.random()*0.3, 0.65 + Math.random()*0.35, 1 + Math.random()*0.3);
      wm.rotation.y = Math.random() * Math.PI;
      scene.add(wm);
    });

    // =====================================================
    //  ELVEN HALLS
    // =====================================================
    const HX = -3, HZ = -62;
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.8, 7, 9), matElven);
    hall.position.set(HX, groundY(HX, HZ) + 7/2 - 7*0.25, HZ);
    scene.add(hall);
    const hallRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 5.8, 3.5, 9), matRoof);
    hallRoof.position.set(HX, groundY(HX, HZ) + 7 - 7*0.25 + 1.2, HZ);
    scene.add(hallRoof);

    const h2x = HX-5, h2z = HZ-10;
    const hall2 = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.0, 6, 9), matElven);
    hall2.position.set(h2x, groundY(h2x, h2z) + 6/2 - 6*0.25, h2z);
    scene.add(hall2);
    const hall2Roof = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 4.0, 3, 9), matRoof);
    hall2Roof.position.set(h2x, groundY(h2x, h2z) + 6 - 6*0.25 + 0.9, h2z);
    scene.add(hall2Roof);

    const btX = HX+4, btZ = HZ-4;
    const bt = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 12, 9), matElven);
    bt.position.set(btX, groundY(btX, btZ) + 12/2 - 12*0.25, btZ);
    scene.add(bt);
    const btRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.1, 3.5, 9), matRoof);
    btRoof.position.set(btX, groundY(btX, btZ) + 12 - 12*0.25 + 1.2, btZ);
    scene.add(btRoof);

    for (let pi = 0; pi < 5; pi++) {
      const px = HX-2 + pi*1.6, pz = HZ+8, phH = 5.5;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.30, phH, 9), matElven);
      pil.position.set(px, groundY(px, pz) + phH/2 - phH*0.25, pz);
      scene.add(pil);
    }
    const clx = HX+1.2, clz = HZ+8;
    const lintelGeo = new THREE.CylinderGeometry(0.25, 0.25, 8.5, 9);
    lintelGeo.rotateZ(Math.PI/2);
    const lintel = new THREE.Mesh(lintelGeo, matElven);
    lintel.position.set(clx, groundY(clx, clz) + 5.5 - 5.5*0.1, clz);
    scene.add(lintel);

    [[20,72,3.2],[24,76,2.8],[18,66,2.5],[22,60,3.0]].forEach(([rx,rz,rh]) => {
      const rGeo = new THREE.CylinderGeometry(0.28, 0.42, rh, 9);
      scene.add(Object.assign(new THREE.Mesh(rGeo, matMoss), {
        position: new THREE.Vector3(rx, groundY(rx, rz) + rh/2 - rh*0.25, rz)
      }));
    });

    // =====================================================
    //  FIRELIGHT
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

    // Stream — shimmer
    if (refs.streamBoxes) {
      refs.streamBoxes.forEach((s, i) => {
        s.material.opacity = 0.78 + Math.sin(T * 1.4 + i * 0.7) * 0.07;
      });
    }

    // Waterfall chute — subtle flutter
    if (refs.waterfallMeshes) {
      refs.waterfallMeshes.forEach((wf, i) => {
        wf.material.opacity = Math.max(0.3,
          wf.material.opacity + Math.sin(T * 1.8 + i * 0.6) * dt * 0.12
        );
      });
    }

    // Waterfall mist — rise and reset
    if (refs.waterParticles) {
      refs.waterParticles.forEach(p => {
        p.position.y += dt * 0.28;
        p.position.x += Math.sin(T * 0.4 + p._phase) * dt * 0.06;
        p.material.opacity = 0.28 + Math.sin(T * 0.8 + p._phase) * 0.25;
        if (p.position.y > p._startY + 8) p.position.y = p._startY;
      });
    }

    // Valley-mouth mist — very slow drift
    if (refs.mistParticles) {
      refs.mistParticles.forEach((p, i) => {
        p.material.opacity = Math.max(0.10,
          p.material.opacity + Math.sin(T * 0.3 + p._phase) * dt * 0.08
        );
        p.position.y = p._startY + Math.sin(T * 0.22 + i) * 0.6;
        p.position.x += Math.sin(T * 0.18 + p._phase) * dt * 0.04;
      });
    }

    // Foliage
    if (refs.foliage) {
      refs.foliage.forEach((f, i) => {
        f.rotation.z = Math.sin(T * 0.55 + i * 0.9) * 0.022;
        f.rotation.x = Math.sin(T * 0.38 + i * 1.2) * 0.014;
      });
    }

    if (refs.fireLight) refs.fireLight.intensity = 1.8 + Math.sin(T * 1.1) * 0.25;
    if (refs.fireFill)  refs.fireFill.intensity  = 0.7  + Math.sin(T * 0.85 + 1.2) * 0.14;
  },
};

window.Rivendell = Rivendell;
