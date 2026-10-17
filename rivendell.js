// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  v3: arch bridge, 3D stream boxes, chute waterfall, mist exit
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

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
      { color: 0x90b8c8, intensity: 0.45, x: -40, y: 60,  z: -100 },
      { color: 0xc8a050, intensity: 0.25, x:  20, y: -10, z:   30 },
    ],
    showStars: false,
  },

  // -----------------------------------------------------------
  //  TERRAIN
  //  Valley floor ≈ y -38.  Rim ≈ y +20.  Total depth ~58.
  //  Stream channel at x=1, cut 4 units below floor.
  //  West cliff (box-canyon end-wall) quadratic lift from z=-88.
  //  East entry ridge rises from z=60.
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise = api_fbm;
    const n2    = api_noise2d;

    // Valley walls — cubic, flat floor out to |x|=10
    const vAbs   = Math.abs(x);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    // East ridge
    const eastRise = Math.max(0, (z - 60) * 0.45);

    // West cliff — quadratic lift of entire cross-section base
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    // Valley narrows toward west end
    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    // Gentle floor tilt — water flows west
    const floorTilt = z * 0.03;

    // Stream channel — centred x=1, 4 units deep
    const sDist     = Math.abs(x - 1);
    const streamCut = Math.max(0, (4.0 - sDist) * 1.1);

    // Stream wanders — slight lateral meander
    const meander = Math.sin(z * 0.05) * 1.2;
    const sDistM  = Math.abs(x - 1 - meander);
    const streamCutM = Math.max(0, (3.5 - sDistM) * 0.9);
    const totalStreamCut = Math.max(streamCut, streamCutM);

    const detail = noise(x * 0.07, z * 0.07) * 2.2
                 + n2(x * 0.2,  z * 0.2)  * 0.8;

    const base = -38 + floorTilt + detail;
    return base + valley + narrowWall + eastRise + westCliff - totalStreamCut;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    // Stream meander for vertex colour
    const meander  = Math.sin(vz * 0.05) * 1.2;
    const sDist    = Math.min(Math.abs(vx - 1), Math.abs(vx - 1 - meander));
    const streamProx = Math.max(0, 1 - sDist / 5.5);

    const cliffFac = Math.max(0, Math.min(1, (-vz - 80) / 25));

    const r0 = lerp(0.25, 0.52, gold);
    const g0 = lerp(0.50, 0.50, gold);
    const b0 = lerp(0.16, 0.20, gold);
    const r1 = 0.48 + rockN * 0.10;
    const g1 = 0.46 + rockN * 0.07;
    const b1 = 0.42;
    const r2 = 0.72, g2 = 0.70, b2 = 0.66;

    let r = lerp(r0, r1, heightFrac);
    let g = lerp(g0, g1, heightFrac);
    let b = lerp(b0, b1, heightFrac);
    const cb = cliffFac * heightFrac;
    r = lerp(r, r2, cb * 0.85);
    g = lerp(g, g2, cb * 0.85);
    b = lerp(b, b2, cb * 0.85);
    r = lerp(r, 0.16, streamProx * 0.55);
    g = lerp(g, 0.19, streamProx * 0.55);
    b = lerp(b, 0.12, streamProx * 0.55);
    return [r, g, b];
  },

  onPath(x, z) {
    if (z > 22) {
      const t = Math.max(0, Math.min(1, (z - 22) / 66));
      const cx = t > 0.5
        ? api_lerp(16, 22, (t - 0.5) * 2)
        : api_lerp(8,  16, t * 2);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    if (z >= -5) {
      const cx = api_lerp(1, 8, (z + 5) / 27);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    if (z >= -78) {
      const cx = api_lerp(-4, 1, 1 - (-z - 5) / 73);
      return Math.max(0, 1 - Math.abs(x - cx) / 4.5);
    }
    return 0;
  },

  pathWaypoints: [
    [22, 88],
    [20, 78],
    [16, 68],
    [12, 58],
    [16, 48],
    [12, 38],
    [ 8, 28],
    [ 8, 22],
    [ 5, 14],
    [ 1,  6],
    [ 1, -5],
    [-2, -18],
    [-4, -32],
    [-4, -48],
    [-3, -55],
    [-2, -62],
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

    // Water materials — stream vs waterfall chute
    const matStream = new THREE.MeshLambertMaterial({
      color: 0x4a9ab8, transparent: true, opacity: 0.82,
    });
    const matChute  = new THREE.MeshLambertMaterial({
      color: 0x88c4e0, transparent: true, opacity: 0.78,
      side: THREE.DoubleSide,
    });
    const matFoam   = new THREE.MeshLambertMaterial({
      color: 0xddeeff, transparent: true, opacity: 0.75,
    });
    const matMist   = new THREE.MeshLambertMaterial({
      color: 0xcce8f0, transparent: true, opacity: 0.35,
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
      [20,60],[16,54],[26,66],[24,72],
    ];
    treeDefs.forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz);
      const h  = 5.5 + (i % 5) * 1.4;
      const lm = leafMats[i % leafMats.length];
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.36, h, 9), matWood);
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
    //  STREAM — 3D BOXES, FLAT TOP, WINDING ALONG VALLEY
    //
    //  Strategy: sample the terrain channel floor every DZ steps,
    //  compute the meander offset (same formula as hillHeight),
    //  then build a BoxGeometry whose:
    //    - width  spans the channel (6 units)
    //    - height fills from channel floor up to a fixed water surface
    //    - top face is therefore flat at a consistent world Y
    //
    //  The "flat top" trick: we set the box height so the top
    //  lands at a target world-Y that descends very gently westward
    //  (matching the valley floor tilt of z*0.03).
    //
    //  The stream meanders: cx = 1 + sin(z*0.05)*1.2
    // =====================================================
    const STREAM_W     = 5.5;   // box width (spans channel)
    const STREAM_DEPTH = 3.6;   // depth of water (box height)
    const STREAM_DZ    = 5.0;   // sample spacing along valley

    // We'll track the previous segment's top-Y to keep continuity
    // Stream runs from z=+75 (east, mist exit) down to z=-85 (waterfall pool)
    const streamSegs = [];
    for (let sz = 75; sz >= -85; sz -= STREAM_DZ) {
      const meander = Math.sin(sz * 0.05) * 1.2;
      const cx      = 1 + meander;
      const chFloor = groundY(cx, sz);          // channel bottom at this z
      // Target water-surface Y: gently descends west.
      // Use channel floor + fixed depth — top is always at chFloor + STREAM_DEPTH
      const topY    = chFloor + STREAM_DEPTH;
      streamSegs.push({ sz, cx, chFloor, topY });
    }

    streamSegs.forEach(({ sz, cx, chFloor, topY }) => {
      const boxH  = STREAM_DEPTH;
      const boxGeo = new THREE.BoxGeometry(STREAM_W, boxH, STREAM_DZ + 0.3);
      const sBox  = new THREE.Mesh(boxGeo, matStream.clone());
      // Centre of box: Y midpoint between chFloor and topY
      sBox.position.set(cx, chFloor + boxH / 2, sz - STREAM_DZ / 2);
      scene.add(sBox);
      refs.streamBoxes.push(sBox);
    });

    // Small boulders poking above water surface
    [[0, 10, 0.6],[3,-8,0.5],[-0.5,-22,0.7],[2.5,18,0.55],[-1,-42,0.65],[2,-56,0.5]].forEach(([bx,bz,bs]) => {
      const meander = Math.sin(bz * 0.05) * 1.2;
      const cx = 1 + meander;
      const chFloor = groundY(cx, bz);
      const b = new THREE.Mesh(new THREE.SphereGeometry(bs, 10, 7), matMoss);
      b.position.set(bx, chFloor + STREAM_DEPTH + bs * 0.2, bz);
      scene.add(b);
    });

    // Mist at east exit (z=+75..+85) — stream fades into fog
    for (let mi = 0; mi < 14; mi++) {
      const mz = 70 + mi * 2.5;
      const mx = 1 + Math.sin(mz * 0.05) * 1.2 + (Math.random() - 0.5) * 3;
      const mGeo  = new THREE.SphereGeometry(1.2 + Math.random() * 1.5, 6, 4);
      const mMesh = new THREE.Mesh(mGeo, matMist.clone());
      const chFloor = groundY(mx, mz);
      mMesh.position.set(mx, chFloor + STREAM_DEPTH + 0.5 + Math.random() * 1.5, mz);
      mMesh._phase  = Math.random() * Math.PI * 2;
      mMesh._startY = mMesh.position.y;
      scene.add(mMesh);
      refs.mistParticles.push(mMesh);
    }

    // =====================================================
    //  WATERFALL CHUTE
    //
    //  The cliff end-wall at z=-88..-115 rises steeply.
    //  The chute is the SLOPED FACE of that cliff, not a
    //  vertical curtain. We model it as a series of tilted
    //  PlaneGeometry segments that follow the terrain slope
    //  from the cliff top down to the splash pool.
    //
    //  Approach:
    //    - Sample terrain at (WF_X, z) for z from -88 to -115
    //    - Each segment is a plane whose normal points "outward"
    //      (toward positive Z), tilted to match terrain slope
    //    - Width narrows as valley narrows toward the head
    //    - Place each segment flush against the terrain surface
    // =====================================================
    const WF_X     = -1;       // x position of chute centre
    const WF_Z_TOP = -115;     // chute top (high up cliff)
    const WF_Z_BOT = -88;      // chute bottom (splash pool level)
    const WF_DZ    = 4;        // sample spacing along chute

    // Sample the cliff face terrain height at each Z step
    const chutePoints = [];
    for (let cz = WF_Z_TOP; cz <= WF_Z_BOT; cz += WF_DZ) {
      const h = groundY(WF_X, cz);
      chutePoints.push({ cz, h });
    }

    // Build tilted water segments between consecutive sample points
    for (let ci = 0; ci < chutePoints.length - 1; ci++) {
      const p0 = chutePoints[ci];
      const p1 = chutePoints[ci + 1];
      const midZ = (p0.cz + p1.cz) / 2;
      const midY = (p0.h  + p1.h)  / 2;

      // Horizontal run and vertical drop of this segment
      const dz   = p1.cz - p0.cz;  // positive (going east = up the slope)
      const dy   = p1.h  - p0.h;   // positive when terrain rises toward BOT
      const segLen = Math.sqrt(dz * dz + dy * dy);

      // Tilt angle: terrain slope angle in the ZY plane
      const angle = Math.atan2(dy, dz);  // radians, rotation around X axis

      // Width: valley narrows toward the top — max 4 at bottom, 2 at top
      const tFrac = (ci / (chutePoints.length - 1));
      const wfW   = 4.0 - tFrac * 1.8;

      const wfGeo = new THREE.PlaneGeometry(wfW, segLen + 0.3);
      const wfMat = matChute.clone();
      wfMat.opacity = 0.72 - tFrac * 0.12;   // more opaque at bottom
      wfMat.color.setHex(tFrac < 0.4 ? 0x88c4e0 : 0xbbd8ee);
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);

      // Position at segment midpoint on terrain surface
      wfMesh.position.set(WF_X, midY + 0.3, midZ);

      // Tilt to follow terrain slope (rotate around X axis)
      wfMesh.rotation.x = -angle;

      // Face outward (toward east = positive Z)
      wfMesh.rotation.y = 0;

      scene.add(wfMesh);
      refs.waterfallMeshes.push(wfMesh);
    }

    // Splash pool at chute base
    const poolZ   = WF_Z_BOT + 1;
    const poolFlr = groundY(WF_X, poolZ);
    const poolTop = poolFlr + STREAM_DEPTH + 0.2;

    const splashGeo = new THREE.SphereGeometry(5.0, 10, 7);
    const splash    = new THREE.Mesh(splashGeo, matFoam);
    splash.scale.y  = 0.12;
    splash.position.set(WF_X, poolTop, poolZ);
    scene.add(splash);

    // Foam spray column rising above pool
    const sprayGeo = new THREE.SphereGeometry(2.5, 8, 6);
    const spray    = new THREE.Mesh(sprayGeo, matFoam.clone());
    spray.scale.y  = 2.0;
    spray.position.set(WF_X, poolTop + 3, poolZ - 1);
    scene.add(spray);

    // Mist particles rising from splash
    for (let pi = 0; pi < 26; pi++) {
      const angle  = (pi / 26) * Math.PI * 2;
      const pr     = 0.8 + Math.random() * 4.5;
      const pGeo   = new THREE.SphereGeometry(0.28 + Math.random() * 0.42, 6, 4);
      const pMat   = new THREE.MeshLambertMaterial({
        color: 0xddeeff, transparent: true, opacity: 0.4 + Math.random() * 0.4,
      });
      const pMesh  = new THREE.Mesh(pGeo, pMat);
      const startY = poolTop + 0.5 + Math.random() * 3.5;
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
    //  STONE ARCH BRIDGE
    //
    //  A proper arch: two abutments + a curved arch ring
    //  made from ~9 CylinderGeometry voussoir blocks arranged
    //  in a semicircle, plus a flat deck on top.
    //
    //  Bridge spans stream at z=0, x from -3 to +5 (width=8).
    //  Arch radius = 4, centre at stream midpoint.
    // =====================================================
    const BR_Z       = 0;
    // Water top at bridge: use stream box topY there
    const meander0   = Math.sin(BR_Z * 0.05) * 1.2;
    const brCX       = 1 + meander0;                     // stream cx at bridge
    const chFloorBR  = groundY(brCX, BR_Z);
    const waterTopBR = chFloorBR + STREAM_DEPTH;

    // Arch geometry parameters
    const ARCH_R     = 4.2;    // radius of arch inner curve
    const ARCH_CX    = brCX;   // arch centre X
    const ARCH_CY    = waterTopBR - 0.5;  // arch spring line (Y)
    const ARCH_SEGS  = 9;      // voussoir blocks
    const ARCH_W     = 2.8;    // bridge width (Z span)
    const VOUS_ANG   = Math.PI / ARCH_SEGS;  // angle per voussoir

    // Each voussoir: a short cylinder rotated to sit in the arch ring
    for (let vi = 0; vi < ARCH_SEGS; vi++) {
      // Angle from -π/2 (right springer) sweeping up and over to +π/2 (left)
      // We go from 0 to π (right abutment to left, bottom of arch = π/2)
      const ang0 = (vi       / ARCH_SEGS) * Math.PI;       // start angle
      const ang1 = ((vi + 1) / ARCH_SEGS) * Math.PI;       // end angle
      const angM = (ang0 + ang1) / 2;                       // midpoint angle

      // Position in XY plane (arch in XY, extruded along Z)
      // Arch circle: centre at (ARCH_CX, ARCH_CY)
      // θ=0 → right (positive X), θ=π → left (negative X), θ=π/2 → top
      // We want right at +X side of stream: use standard polar from right
      const vx = ARCH_CX + (ARCH_R + 0.4) * Math.cos(Math.PI - angM); // mirror so arch opens downward
      const vy = ARCH_CY + (ARCH_R + 0.4) * Math.sin(angM);            // rises over stream

      // Voussoir block: short wide cylinder (like a keystone wedge approximation)
      const vGeo = new THREE.CylinderGeometry(0.55, 0.55, ARCH_W, 6);
      // Rotate to lie along bridge Z axis and tilt to follow arch tangent
      vGeo.rotateX(Math.PI / 2);            // lie along Z
      const vMesh = new THREE.Mesh(vGeo, matStone);
      vMesh.position.set(vx, vy, BR_Z);

      // Tilt each block outward along the arch radius
      // The tangent to a circle at angle angM is perpendicular to the radius
      // Rotation around Z axis (since block lies along Z)
      // Radius direction at angM: normal = (cos(π-angM), sin(angM))
      // We want the cylinder's height axis to point along the radius
      vMesh.rotation.z = Math.PI - angM;    // align block height to radius
      scene.add(vMesh);
    }

    // Arch abutments — solid stone piers at each spring
    // Left abutment (negative X side of stream)
    const abH = ARCH_R + 1.2;
    const abLX = ARCH_CX - ARCH_R - 0.3;
    const abRX = ARCH_CX + ARCH_R + 0.3;
    [abLX, abRX].forEach((ax) => {
      const abGeo = new THREE.CylinderGeometry(1.0, 1.3, abH, 9);
      const ab    = new THREE.Mesh(abGeo, matDark);
      ab.position.set(ax, groundY(ax, BR_Z) + abH / 2 - abH * 0.25, BR_Z);
      scene.add(ab);
    });

    // Deck — flat box spanning the arch top
    const deckTop = ARCH_CY + ARCH_R + 1.1;  // top of arch + slight rise
    const deckH   = 0.7;
    const deckW   = abRX - abLX + 1.4;
    const deckGeo = new THREE.BoxGeometry(deckW, deckH, ARCH_W + 0.4);
    const deck    = new THREE.Mesh(deckGeo, matStone);
    deck.position.set(ARCH_CX, deckTop - deckH / 2, BR_Z);
    scene.add(deck);

    // Parapet walls — thin boxes on each Z edge of deck
    [-ARCH_W / 2 - 0.1, ARCH_W / 2 + 0.1].forEach((pz) => {
      const pGeo = new THREE.BoxGeometry(deckW, 1.1, 0.4);
      const par  = new THREE.Mesh(pGeo, matStone);
      par.position.set(ARCH_CX, deckTop + 0.55 - deckH / 2, BR_Z + pz);
      scene.add(par);
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

    // =====================================================
    //  ENTRY RIDGE STONES
    // =====================================================
    [[20,72,3.2],[24,76,2.8],[18,66,2.5],[22,60,3.0]].forEach(([rx,rz,rh]) => {
      const rGeo = new THREE.CylinderGeometry(0.28, 0.42, rh, 9);
      const rMesh = new THREE.Mesh(rGeo, matMoss);
      rMesh.position.set(rx, groundY(rx, rz) + rh/2 - rh*0.25, rz);
      scene.add(rMesh);
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

    // Stream boxes — gentle opacity shimmer
    if (refs.streamBoxes) {
      refs.streamBoxes.forEach((s, i) => {
        s.material.opacity = 0.76 + Math.sin(T * 1.4 + i * 0.7) * 0.07;
      });
    }

    // Waterfall chute — gentle lateral drift on each segment
    if (refs.waterfallMeshes) {
      refs.waterfallMeshes.forEach((wf, i) => {
        wf.position.x += Math.sin(T * 0.55 + i * 0.8) * dt * 0.04;
        wf.material.opacity = Math.max(0.3,
          wf.material.opacity + Math.sin(T * 1.8 + i * 0.6) * dt * 0.15
        );
      });
    }

    // Waterfall mist particles — rise and reset
    if (refs.waterParticles) {
      refs.waterParticles.forEach((p) => {
        p.position.y += dt * 0.3;
        p.position.x += Math.sin(T * 0.4 + p._phase) * dt * 0.06;
        p.material.opacity = 0.3 + Math.sin(T * 0.8 + p._phase) * 0.28;
        if (p.position.y > p._startY + 8) p.position.y = p._startY;
      });
    }

    // East mist — slow drift and fade
    if (refs.mistParticles) {
      refs.mistParticles.forEach((p, i) => {
        p.position.x += Math.sin(T * 0.25 + p._phase) * dt * 0.04;
        p.material.opacity = 0.18 + Math.sin(T * 0.5 + p._phase) * 0.15;
        p.position.y = p._startY + Math.sin(T * 0.3 + i) * 0.3;
      });
    }

    // Foliage sway
    if (refs.foliage) {
      refs.foliage.forEach((f, i) => {
        f.rotation.z = Math.sin(T * 0.55 + i * 0.9) * 0.022;
        f.rotation.x = Math.sin(T * 0.38 + i * 1.2) * 0.014;
      });
    }

    // Hall glow
    if (refs.fireLight) refs.fireLight.intensity = 1.8 + Math.sin(T * 1.1) * 0.25;
    if (refs.fireFill)  refs.fireFill.intensity  = 0.7  + Math.sin(T * 0.85 + 1.2) * 0.14;
  },
};

window.Rivendell = Rivendell;
