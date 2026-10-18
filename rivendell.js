// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  v6 fixes:
//   - BEND_Z moved to 108 so player at z=90 sees open valley
//   - Stream extended to z=105 (flows into the bend)
//   - Path: corner waypoints so crossing is perpendicular (x-axis walk at z=0)
//   - onPath: bridge-box zone; path stays off stream until bridge
//   - Waterfall: no geometry rotation; mesh.rotation.x = -atan2(|dy|,dz)
//   - Bridge parapets removed; walkables unchanged
//   - Halls spread across shelf (3 buildings over z=-50..-68, x=-19..-22)
//   - Colonnade cylinders replaced with low stone terrace wall
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

  start: { x: 20, z: 90, yaw: 0 },

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
  //  Main valley runs Z=-90 (waterfall) → Z=+108 (bend mouth).
  //  Player arrives from east at z≈90 — still inside the straight
  //  valley, seeing the full length toward the waterfall.
  //  Bend at BEND_Z=108: coord rotation makes walls physically turn.
  //  Stream channel cut at x=1+sin(z*0.05)*1.2 (meander).
  //  Shelf carved into west wall at x≈-20, z=-50..-68 for halls.
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise    = api_fbm;
    const n2       = api_noise2d;
    const BEND_Z   = 108;
    const BEND_ANG = 65 * Math.PI / 180;

    // Coordinate bend: for z > BEND_Z rotate around (0, BEND_Z)
    let sx = x;
    let pastBend = false;
    if (z > BEND_Z) {
      pastBend = true;
      const dz = z - BEND_Z;
      sx = x * Math.cos(BEND_ANG) - dz * Math.sin(BEND_ANG);
    }

    // Valley walls — cubic, flat floor out to |sx|=10
    const vAbs   = Math.abs(sx);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    // Bend closing wall (only fires past BEND_Z; player never gets there)
    const bendWall = pastBend
      ? Math.min(Math.max(0, (z - BEND_Z - 4) * 1.3), 55)
      : 0;

    // West cliff (waterfall end-wall)
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    // Valley narrows toward west
    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    // Gentle floor tilt
    const floorTilt = z * 0.03;

    // Stream channel cut
    const streamCx  = 1 + Math.sin(z * 0.05) * 1.2;
    const sDist     = Math.abs(x - streamCx);
    const streamCut = Math.max(0, (3.8 - sDist) * 1.05);

    // Shelf carved into west wall for Elven halls:
    // Oval patch centred at (-20, -59), wider in Z than X.
    // Suppresses the valley-wall cubic term locally.
    const shelfDx   = (x + 20) / 12;
    const shelfDz   = (z + 59) / 18;
    const shelfDist = Math.sqrt(shelfDx * shelfDx + shelfDz * shelfDz);
    const shelfFac  = Math.max(0, 1 - shelfDist);
    const valleyNet = valley * (1 - shelfFac * 0.72);

    const detail = noise(x * 0.07, z * 0.07) * 2.2
                 + n2(x * 0.2,  z * 0.2)  * 0.8;

    return -38 + floorTilt + detail + valleyNet + narrowWall + bendWall + westCliff - streamCut;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    const streamCx   = 1 + Math.sin(vz * 0.05) * 1.2;
    const streamProx = Math.max(0, 1 - Math.abs(vx - streamCx) / 5.5);
    const cliffFac   = Math.max(0, Math.min(1, (-vz - 80) / 25));

    // Shelf: greener ledge visible from below
    const shelfDx   = (vx + 20) / 12;
    const shelfDz   = (vz + 59) / 18;
    const shelfGreen = Math.max(0, 1 - Math.sqrt(shelfDx*shelfDx + shelfDz*shelfDz)) * 0.35;

    const r0 = lerp(0.25, 0.52, gold + shelfGreen * 0.2);
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
  //  PATH
  //
  //  Key insight: bridge runs along X axis at z=0.
  //  Player must walk in the -X direction to cross it.
  //  So the path must:
  //    1. Walk south along east bank (x≈7) until z=4
  //    2. Step to bridge east end  (x=7, z=0)  — short jog in Z
  //    3. Cross in X direction     (x=7→x=-3, z=0)
  //    4. Exit bridge west end     (x=-3, z=-4) — short jog in Z
  //    5. Angle toward hillside halls
  //
  //  onPath uses three zones:
  //    A. East bank descent (z > 4): x=7..20
  //    B. Bridge box (|z|<=2 AND x in [-3.5,7.5]): always high proximity
  //    C. West of bridge (z < -4): x drifts -3 → -22
  // -----------------------------------------------------------
  onPath(x, z) {
    // B — bridge box zone (takes priority)
    if (Math.abs(z) <= 2.5 && x >= -4 && x <= 8) {
      // Proximity based on being within the bridge span, with gentle falloff
      const zDist = Math.abs(z) / 2.5;
      return Math.max(0, 1 - zDist * 0.35);
    }
    // A — descent along east bank
    if (z > 4) {
      const t  = Math.max(0, Math.min(1, (z - 4) / 88));
      const cx = api_lerp(7, 20, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    // A2 — short jog to bridge entry (z=2..4, path at x=7)
    if (z >= -4) {
      return Math.max(0, 1 - Math.abs(x - 7) / 4) * 0.5 +
             Math.max(0, 1 - Math.abs(x - 1) / 4) * 0.5;
    }
    // C — west of bridge, climb toward halls
    if (z >= -75) {
      const t  = Math.max(0, Math.min(1, (-z - 4) / 71));
      const cx = api_lerp(-22, -3, 1 - t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5.5);
    }
    return 0;
  },

  pathWaypoints: [
    [20, 92],   // arrival
    [18, 78],
    [16, 68],
    [14, 55],
    [ 9, 38],
    [ 7, 20],   // east bank
    [ 7,  4],   // approach bridge east end
    [ 7,  0],   // step onto bridge east end
    [-3,  0],   // cross bridge — walk in -x direction at z=0
    [-3, -4],   // step off bridge west end
    [-7, -15],
    [-12,-30],
    [-16,-42],
    [-20,-52],
    [-22,-60],  // halls
  ],

  lorePoints: [
    {
      pos: { x: 18, z: 82 }, radius: 10,
      text: 'At last they rode over the top of a steep bank, and Frodo looked down. The valley of Rivendell lay below, misty and pale, and very far away. He could hear, far beneath him, the voice of a river and the sound of falling water.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: 2, z: 0 }, radius: 8,
      text: 'The Ford of Bruinen — where the Ringwraiths were swept away by the river Elrond had set to flood at his command. The waters still ran swift and cold over smooth grey stones.',
      cite: 'The Fellowship of the Ring, Book I, Ch. 12'
    },
    {
      pos: { x: -20, z: -55 }, radius: 10,
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
  transitions: [{ trigger: { x: 20, z: 108, radius: 14 }, to: 'Weathertop' }],
  arrivals:    { 'Weathertop': { x: 20, z: 92, yaw: 0 } },

  // -----------------------------------------------------------
  //  WALKABLE BRIDGE — gentle arch, 3 segments (/-\)
  //  Bridge: x=-3.25 to x=7.25, z=0, runs along X (yaw=PI/2)
  //  Deck ends: y=-38.0  Crown: y=-35.5  (2.5 unit rise)
  // -----------------------------------------------------------
  walkables: [
    { x: -1.5, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -38.0, yEnd: -35.5 },
    { x:  2.0, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -35.5, yEnd: -35.5 },
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
    //  STREAM — 3D boxes, smooth linear waterY surface
    //  waterY(z) = BASE_WATER + z*TILT (no noise — flat top)
    //  chFloor sampled at x=1 for consistent depth reference
    //  Stream runs from z=105 (near bend) down to z=-85 (pool)
    // =====================================================
    const BASE_WATER = -39.5;
    const WATER_TILT =  0.03;
    const STREAM_W   =  5.5;
    const STREAM_DZ  =  5.0;

    function waterY(z) { return BASE_WATER + z * WATER_TILT; }
    function streamCx(z) { return 1 + Math.sin(z * 0.05) * 1.2; }

    for (let sz = 105; sz >= -85; sz -= STREAM_DZ) {
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
    //  AUTUMN TREES
    // =====================================================
    const leafMats = [matGold, matRust, matAmber, matCopper];
    const treeDefs = [
      [-16,-5],[-20,10],[-24,-20],[-28,5],[-18,30],[-26,42],
      [-22,-35],[-18,-52],[-14,-65],
      [22,0],[26,18],[24,-12],[28,35],[20,-28],[26,-45],[22,-58],
      [8,20],[9,-10],[8,-35],[10,5],
      [18,55],[14,65],[16,78],[22,85],[12,92],
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
      c2.position.set(tx + (i%2?0.9:-0.9), gy + h*0.95 + cr*0.45, tz+0.5);
      scene.add(c2);
      refs.foliage.push(can, c2);
    });

    // =====================================================
    //  BEND MOUTH MIST — at z≈100..120
    // =====================================================
    [
      {x:-2,z:104,r:13,op:0.28},{x:10,z:108,r:16,op:0.32},
      {x:20,z:106,r:12,op:0.24},{x:4, z:116,r:18,op:0.20},
      {x:14,z:114,r:14,op:0.28},{x:0, z:122,r:20,op:0.16},
      {x:-6,z:118,r:11,op:0.22},{x:26,z:112,r:10,op:0.18},
    ].forEach(({x:mx,z:mz,r:mr,op}) => {
      const mGy  = groundY(mx, mz);
      const mMat = new THREE.MeshLambertMaterial({
        color: 0xd8eef4, transparent: true, opacity: op, depthWrite: false,
      });
      const mMesh = new THREE.Mesh(new THREE.SphereGeometry(mr, 8, 6), mMat);
      mMesh.position.set(mx, mGy + mr*0.55, mz);
      mMesh._phase  = Math.random() * Math.PI * 2;
      mMesh._startY = mMesh.position.y;
      scene.add(mMesh);
      refs.mistParticles.push(mMesh);
    });

    // =====================================================
    //  WATERFALL CHUTE — planes draped along cliff slope
    //
    //  Correct rotation (no geometry.rotateX):
    //    PlaneGeometry default: in XY plane, normal = +Z (faces camera).
    //    We want it to lie ON the cliff face (slope in ZY plane).
    //    mesh.rotation.x = -slopeAngle
    //    where slopeAngle = atan2(|dy|, dz) = angle of drop from horizontal.
    //    Positive slopeAngle (0..PI/2) tilts the plane's bottom edge
    //    downward into the cliff → plane drapes along the slope.
    //    For a 79° slope: plane is nearly vertical but tilted to match cliff.
    //
    //  We also sample along the X width of the chute (not just centreline)
    //  to position each segment accurately on the cliff face.
    // =====================================================
    const WF_X     = -1;
    const WF_Z_TOP = -115;
    const WF_Z_BOT = -88;
    const WF_DZ    =  3.5;

    for (let cz = WF_Z_TOP; cz < WF_Z_BOT; cz += WF_DZ) {
      const z0 = cz, z1 = cz + WF_DZ;
      const h0 = groundY(WF_X, z0);
      const h1 = groundY(WF_X, z1);
      const midZ = (z0 + z1) / 2;
      const midH = (h0 + h1) / 2;

      const dz   = z1 - z0;              // always positive (toward pool)
      const dy   = h1 - h0;              // negative (terrain drops toward pool)
      const drop = Math.abs(dy);
      const segLen = Math.sqrt(dz*dz + dy*dy);

      // Slope angle from horizontal: how steeply the cliff drops
      const slopeAngle = Math.atan2(drop, dz);  // 0=flat, PI/2=vertical

      const tFrac = (cz - WF_Z_TOP) / (WF_Z_BOT - WF_Z_TOP); // 0=top,1=bottom
      const wfW   = 1.8 + tFrac * 2.5;   // widens toward pool

      const wfGeo = new THREE.PlaneGeometry(wfW, segLen + 0.5);
      // No geometry rotation — rely entirely on mesh.rotation
      const wfMat = new THREE.MeshLambertMaterial({
        color: tFrac < 0.4 ? 0x99ccee : 0xbbddff,
        transparent: true,
        opacity: 0.50 + tFrac * 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);
      wfMesh.position.set(WF_X, midH + 0.3, midZ);
      // Tilt to follow cliff: -slopeAngle tips the plane's +Y edge back
      // into the cliff face, making it drape along the slope
      wfMesh.rotation.x = -slopeAngle;
      scene.add(wfMesh);
      refs.waterfallMeshes.push(wfMesh);
    }

    // Splash pool + spray
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
      const ang   = (pi / 24) * Math.PI * 2;
      const pr    = 0.8 + Math.random() * 4.2;
      const pMat  = new THREE.MeshLambertMaterial({
        color: 0xddeeff, transparent: true, opacity: 0.35 + Math.random()*0.4, depthWrite: false,
      });
      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random()*0.45, 6, 4), pMat);
      const startY = poolTop + 0.5 + Math.random()*4;
      pMesh.position.set(WF_X + Math.cos(ang)*pr*0.6, startY, poolZ + Math.sin(ang)*pr);
      pMesh._startY = startY;
      pMesh._phase  = Math.random() * Math.PI * 2;
      scene.add(pMesh);
      refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  STONE ARCH BRIDGE — gentle arc, no parapets
    //  Spans x=-3.25 to x=7.25 at z=0.
    //  Shallow arch: radius from sag formula.
    //  Abutment blocks tuck into stream banks.
    //  No parapets — they looked like floating beams.
    // =====================================================
    const BR_Z     =  0;
    const BR_X0    = -3.25;
    const BR_X1    =  7.25;
    const BR_CX    = (BR_X0 + BR_X1) / 2;   // 2.0
    const BR_SPAN  = BR_X1 - BR_X0;          // 10.5
    const DECK_END = -38.0;
    const DECK_TOP = -35.5;
    const HALF_SPAN = BR_SPAN / 2;
    const SAG       = DECK_TOP - DECK_END;    // 2.5
    const ARCH_R    = (HALF_SPAN*HALF_SPAN + SAG*SAG) / (2*SAG);  // ≈6.76
    const ARCH_CY   = DECK_END - ARCH_R;
    const ARCH_W    = 3.2;
    const halfAng   = Math.asin(HALF_SPAN / ARCH_R);

    // Small abutment blocks (no big pillars)
    [BR_X0, BR_X1].forEach(ax => {
      const abGy  = groundY(ax, BR_Z);
      const abH   = Math.max(0.8, DECK_END - abGy + 0.3);
      const ab    = new THREE.Mesh(new THREE.BoxGeometry(1.6, abH, ARCH_W + 0.3), matDark);
      ab.position.set(ax, abGy + abH/2, BR_Z);
      scene.add(ab);
    });

    // Arch ring — voussoir cylinders along Z axis
    const ARCH_SEGS = 9;
    for (let vi = 0; vi < ARCH_SEGS; vi++) {
      const angM = -halfAng + ((vi + 0.5) / ARCH_SEGS) * 2 * halfAng;
      const ang0 = -halfAng + (vi       / ARCH_SEGS) * 2 * halfAng;
      const ang1 = -halfAng + ((vi + 1) / ARCH_SEGS) * 2 * halfAng;
      const vx   = BR_CX + ARCH_R * Math.sin(angM);
      const vy   = ARCH_CY + ARCH_R * Math.cos(angM);
      const vGeo = new THREE.CylinderGeometry(0.45, 0.45, ARCH_W, 6);
      vGeo.rotateX(Math.PI / 2);
      const vMesh = new THREE.Mesh(vGeo, matStone);
      vMesh.position.set(vx, vy, BR_Z);
      vMesh.rotation.z = angM;
      scene.add(vMesh);
    }

    // Deck slabs following arch curve
    const DECK_SEGS = 12;
    for (let di = 0; di < DECK_SEGS; di++) {
      const angM = -halfAng + ((di + 0.5) / DECK_SEGS) * 2 * halfAng;
      const ang0 = -halfAng + (di        / DECK_SEGS) * 2 * halfAng;
      const ang1 = -halfAng + ((di + 1)  / DECK_SEGS) * 2 * halfAng;
      const r    = ARCH_R + 0.3;
      const dx   = BR_CX + r * Math.sin(angM);
      const dy   = ARCH_CY + r * Math.cos(angM) + 0.25;
      const slabW = Math.abs((BR_CX + r*Math.sin(ang1)) - (BR_CX + r*Math.sin(ang0))) + 0.05;
      const slab  = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.4, ARCH_W + 0.2), matStone);
      slab.position.set(dx, dy, BR_Z);
      slab.rotation.z = angM;
      scene.add(slab);
    }

    // =====================================================
    //  ROCKY VALLEY WALLS
    // =====================================================
    [[-18,8,2.0],[-22,-20,2.4],[-16,-38,1.8],
     [22,14,2.2],[26,-24,1.9],[24,42,1.6],
     [-24,50,2.6],[28,-10,2.0],[-20,-65,2.1],
     [26,-52,1.7],[-14,-68,1.5],[20,-65,1.9]
    ].forEach(([wx,wz,ws]) => {
      const wm = new THREE.Mesh(new THREE.SphereGeometry(ws, 8, 6),
        Math.random() > 0.4 ? matDark : matStone);
      wm.position.set(wx, groundY(wx, wz) + ws*0.45, wz);
      wm.scale.set(1+Math.random()*0.3, 0.65+Math.random()*0.35, 1+Math.random()*0.3);
      wm.rotation.y = Math.random()*Math.PI;
      scene.add(wm);
    });

    // =====================================================
    //  ELVEN HALLS — spread across shelf, 3 buildings
    //
    //  Shelf oval: centred x=-20, z=-59, 24×36 unit oval.
    //  Buildings at 20-35% up the west wall:
    //    Main hall:   x=-21, z=-56 (≈30% up)
    //    East wing:   x=-19, z=-50 (≈21% up, lower — entrance level)
    //    Upper study: x=-21, z=-68 (≈30% up, deeper into hillside)
    //  Replaced colonnade with a low stone terrace wall along shelf front.
    // =====================================================

    // Low terrace retaining wall along shelf face (Z direction)
    for (let tz = -48; tz >= -72; tz -= 2) {
      const twx = -17;   // shelf front x (faces valley)
      const twy = groundY(twx, tz);
      const twH = 2.2;
      const tw  = new THREE.Mesh(new THREE.BoxGeometry(0.7, twH, 2.2), matDark);
      tw.position.set(twx, twy + twH/2 - twH*0.15, tz);
      scene.add(tw);
    }
    // Cap stone on top of wall
    const capGeo = new THREE.BoxGeometry(0.8, 0.35, 26);
    const cap    = new THREE.Mesh(capGeo, matStone);
    cap.position.set(-17, groundY(-17,-60) + 2.2, -60);
    scene.add(cap);

    // Trees on shelf (autumn gold, behind buildings)
    [[-23,-52,matGold],[-25,-60,matAmber],[-23,-68,matRust]].forEach(([tx,tz,lm],i) => {
      const gy = groundY(tx, tz);
      const h  = 5.0 + i*0.8;
      const cr = 2.4 + i*0.4;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, h, 9), matWood);
      tr.position.set(tx, gy + h/2 - h*0.25, tz);
      scene.add(tr);
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h*0.8 + cr*0.45, tz);
      scene.add(can);
      refs.foliage.push(can);
    });

    // Main hall — large, central
    const HX1 = -21, HZ1 = -56, HGY1 = groundY(HX1, HZ1);
    const hall1 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 7.0, 9), matElven);
    hall1.position.set(HX1, HGY1 + 7.0/2 - 7.0*0.22, HZ1);
    scene.add(hall1);
    const roof1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 5.5, 3.2, 9), matRoof);
    roof1.position.set(HX1, HGY1 + 7.0 - 7.0*0.22 + 1.1, HZ1);
    scene.add(roof1);

    // Slender bell tower beside main hall
    const TX = HX1 + 2.5, TZ = HZ1 + 4, TGY = groundY(TX, TZ);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 12, 9), matElven);
    tower.position.set(TX, TGY + 12/2 - 12*0.22, TZ);
    scene.add(tower);
    const towerRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 1.0, 3.0, 9), matRoof);
    towerRoof.position.set(TX, TGY + 12 - 12*0.22 + 1.0, TZ);
    scene.add(towerRoof);

    // East wing — lower, at shelf entrance level
    const HX2 = -19, HZ2 = -50, HGY2 = groundY(HX2, HZ2);
    const hall2 = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.0, 5.5, 9), matElven);
    hall2.position.set(HX2, HGY2 + 5.5/2 - 5.5*0.22, HZ2);
    scene.add(hall2);
    const roof2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 4.0, 2.8, 9), matRoof);
    roof2.position.set(HX2, HGY2 + 5.5 - 5.5*0.22 + 0.9, HZ2);
    scene.add(roof2);

    // Upper study — deeper into hillside, smaller
    const HX3 = -21, HZ3 = -68, HGY3 = groundY(HX3, HZ3);
    const hall3 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 5.0, 9), matElven);
    hall3.position.set(HX3, HGY3 + 5.0/2 - 5.0*0.22, HZ3);
    scene.add(hall3);
    const roof3 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 3.4, 2.5, 9), matRoof);
    roof3.position.set(HX3, HGY3 + 5.0 - 5.0*0.22 + 0.8, HZ3);
    scene.add(roof3);

    // =====================================================
    //  ENTRY STONES near arrival
    // =====================================================
    [[18,88,2.8],[22,86,3.0],[16,80,2.5],[20,76,2.6]].forEach(([rx,rz,rh]) => {
      const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.40, rh, 9), matMoss);
      rMesh.position.set(rx, groundY(rx,rz) + rh/2 - rh*0.25, rz);
      scene.add(rMesh);
    });

    // =====================================================
    //  FIRELIGHT
    // =====================================================
    const fireLight = new THREE.PointLight(0xffcc66, 2.0, 35);
    fireLight.position.set(HX1, HGY1 + 6, HZ1);
    scene.add(fireLight);
    const fireFill = new THREE.PointLight(0xffaa44, 0.8, 22);
    fireFill.position.set(HX2, HGY2 + 5, HZ2);
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
