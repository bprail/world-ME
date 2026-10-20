// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  v7 fixes:
//   - Waterfall: mesh.rotation.x = atan2(dz, dy) — correct slope alignment
//   - Shelf: rectangular lerp mask, perfectly flat at -27 from x=-19..-24, z=-46..-74
//     Wide enough for council circle + 4 halls + tower + terraces
//   - All other fixes retained from v6
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
  //  Valley: z=-90 (waterfall) to z=+108 (bend mouth).
  //  Player arrives at z≈90 in open valley, walks west.
  //
  //  SHELF: rectangular flat terrace carved into west wall,
  //    x in [-17, -25], z in [-43, -76] — 8 × 33 units.
  //    Implementation: independent smoothstep masks on X and Z,
  //    multiplied together, then lerp(raw, SHELF_Y=-27, mask).
  //    Interior is perfectly flat at y=-27 (≈27% up west wall).
  //    Back wall (x < -25) rises naturally as cliff face behind halls.
  //
  //  WATERFALL CHUTE: z=-88 (pool) to z=-115 (cliff top), x≈-1.
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise    = api_fbm;
    const n2       = api_noise2d;
    const BEND_Z   = 108;
    const BEND_ANG = 65 * Math.PI / 180;

    let sx = x, pastBend = false;
    if (z > BEND_Z) {
      pastBend = true;
      const dz = z - BEND_Z;
      sx = x * Math.cos(BEND_ANG) - dz * Math.sin(BEND_ANG);
    }

    const vAbs   = Math.abs(sx);
    const vFloor = Math.max(0, vAbs - 10);
    const valley = Math.min(vFloor * vFloor * vFloor * 0.018, 60);

    const bendWall  = pastBend ? Math.min(Math.max(0, (z - BEND_Z - 4) * 1.3), 55) : 0;
    const westT     = Math.max(0, -z - 88);
    const westCliff = Math.min(westT * westT * 0.22, 65);

    const narrowFac  = Math.max(0, Math.min(1, (-z - 65) / 30));
    const narrowedW  = 10 - narrowFac * 5;
    const narrowDist = Math.max(0, vAbs - narrowedW);
    const narrowWall = Math.min(narrowDist * narrowDist * 0.12, 40) * narrowFac;

    const floorTilt = z * 0.03;
    const streamCx  = 1 + Math.sin(z * 0.05) * 1.2;
    const sDist     = Math.abs(x - streamCx);
    const streamCut = Math.max(0, (3.8 - sDist) * 1.05);
    const detail    = noise(x * 0.07, z * 0.07) * 2.2
                    + n2(x * 0.2,    z * 0.2)   * 0.8;

    const raw = -38 + floorTilt + detail + valley + narrowWall + bendWall + westCliff - streamCut;

    // --- Rectangular shelf lerp ---
    // X: fade from 0→1 between x=-17 and x=-19 (front ramp), held at 1 to x=-25
    const xFront = Math.max(0, Math.min(1, (-x - 17) / 2));  // 0 at x=-17, 1 at x=-19
    const xBack  = Math.max(0, Math.min(1, (x + 26) / 1.5)); // 1 at x=-24.5, 0 at x=-26
    const xFac   = Math.min(xFront, xBack);
    // Z: fade 0→1 between z=-43 and z=-46, held to z=-74, then 1→0 to z=-77
    const zFront = Math.max(0, Math.min(1, (-z - 43) / 3));
    const zBack  = Math.max(0, Math.min(1, (z + 77) / 3));
    const zFac   = Math.min(zFront, zBack);
    // Smooth combined mask
    const sm = xFac * zFac;
    const shelf = sm * sm * (3 - 2 * sm);   // smoothstep

    const SHELF_Y = -27;
    const withShelf = raw + (SHELF_Y - raw) * shelf;

    // --- Eregion ramp (south wall, z=0..44, x=8..28) ---
    // Clips the steep south valley wall to a gentle grade so the player
    // can walk up to the Eregion transition. rampY(x) defines the ceiling.
    // A path notch (1.8 units deep, 2.2 units wide) winds diagonally up
    // the slope, making the route readable from across the valley.
    const rzFac = Math.max(0, Math.min(1, z / 4))
                * Math.max(0, Math.min(1, (82 - z) / 4));
    const rxFac = Math.max(0, Math.min(1, (x - 8) / 3))
                * Math.max(0, Math.min(1, (28 - x) / 3));
    const rRaw  = rzFac * rxFac;
    const rMask = rRaw * rRaw * (3 - 2 * rRaw);

    if (rMask > 0) {
      const rampCeil  = -38 + Math.max(0, Math.min(20, x - 7)) * 0.55;
      const clipped   = Math.min(withShelf, rampCeil);
      const withRamp  = withShelf + (clipped - withShelf) * rMask;

      // Path notch: S-curve from (x≈8,z=2) to (x≈23,z=78) — doubled length
      const pt = Math.max(0, Math.min(1, (z - 2) / 74));
      const pathCx = 7 + pt * 16 + Math.sin(pt * Math.PI) * 1.8;
      const pDist  = Math.abs(x - pathCx);
      const pN     = Math.max(0, 1 - pDist / 2.2);
      const notch  = pN * pN * (3 - 2 * pN) * 1.8 * rMask;

      return withRamp - notch;
    }

    return withShelf;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const heightFrac = Math.max(0, Math.min(1, (vy + 38) / 58));
    const goldN = noise2d(vx * 0.055, vz * 0.055);
    const gold  = Math.max(0, goldN - 0.3) * 1.9;
    const rockN = noise2d(vx * 0.12, vz * 0.09);

    const streamCx   = 1 + Math.sin(vz * 0.05) * 1.2;
    const streamProx = Math.max(0, 1 - Math.abs(vx - streamCx) / 5.5);
    const cliffFac   = Math.max(0, Math.min(1, (-vz - 80) / 25));

    // Shelf: greener, garden-like ledge
    const xFront = Math.max(0, Math.min(1, (-vx - 17) / 2));
    const xBack  = Math.max(0, Math.min(1, (vx + 26) / 1.5));
    const zFront = Math.max(0, Math.min(1, (-vz - 43) / 3));
    const zBack  = Math.max(0, Math.min(1, (vz + 77) / 3));
    const shelfMask = Math.min(xFront, xBack) * Math.min(zFront, zBack);
    const shelfGreen = shelfMask * 0.40;

    const r0 = lerp(0.25, 0.52, gold + shelfGreen * 0.15);
    const g0 = lerp(0.50, 0.54, gold + shelfGreen);
    const b0 = lerp(0.16, 0.20, gold);
    const r1 = 0.48 + rockN * 0.10;
    const g1 = 0.46 + rockN * 0.07;
    const b1 = 0.42;

    let r = lerp(r0, r1, heightFrac * (1 - shelfMask * 0.7));
    let g = lerp(g0, g1, heightFrac * (1 - shelfMask * 0.7));
    let b = lerp(b0, b1, heightFrac);
    r = lerp(r, 0.72, cliffFac * heightFrac * 0.85);
    g = lerp(g, 0.70, cliffFac * heightFrac * 0.85);
    b = lerp(b, 0.66, cliffFac * heightFrac * 0.85);
    r = lerp(r, 0.16, streamProx * 0.55);
    g = lerp(g, 0.19, streamProx * 0.55);
    b = lerp(b, 0.12, streamProx * 0.55);

    // Eregion path: packed-earth tone on the ramp notch
    if (vz > 2 && vz < 78 && vx > 7 && vx < 28) {
      const pt2   = Math.max(0, Math.min(1, (vz - 2) / 74));
      const pCx2  = 7 + pt2 * 16 + Math.sin(pt2 * Math.PI) * 1.8;
      const pD2   = Math.abs(vx - pCx2);
      const pFac2 = Math.max(0, 1 - pD2 / 2.5);
      const earth = pFac2 * pFac2 * 0.55;
      r = lerp(r, 0.52, earth);
      g = lerp(g, 0.42, earth);
      b = lerp(b, 0.28, earth);
    }

    return [r, g, b];
  },

  onPath(x, z) {
    // Bridge box zone (takes priority)
    if (Math.abs(z) <= 2.5 && x >= -4 && x <= 8) {
      return Math.max(0, 1 - Math.abs(z) / 2.5 * 0.35);
    }
    // East bank descent
    if (z > 4) {
      const t  = Math.max(0, Math.min(1, (z - 4) / 88));
      const cx = api_lerp(7, 20, t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5);
    }
    // Bridge approach / exit
    if (z >= -4) {
      return Math.max(0, 1 - Math.abs(x - 7) / 4) * 0.4
           + Math.max(0, 1 - Math.abs(x - 1) / 4) * 0.6;
    }
    // West toward shelf
    if (z >= -80) {
      const t  = Math.max(0, Math.min(1, (-z - 4) / 76));
      const cx = api_lerp(-20, -3, 1 - t);
      return Math.max(0, 1 - Math.abs(x - cx) / 5.5);
    }
    return 0;
  },

  pathWaypoints: [
    [20, 92], [18, 78], [16, 68], [14, 55],
    [ 9, 38], [ 7, 20], [ 7,  4], [ 7,  0],
    [-3,  0], [-3, -4], [-7, -15], [-12,-30],
    [-16,-42], [-19,-52], [-20,-60],
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
      pos: { x: -20, z: -60 }, radius: 12,
      text: '"Welcome to Rivendell, Mr. Baggins." A perfect house, whether you like food or sleep or story-telling or singing, or just sitting and thinking best, or a pleasant mixture of them all.',
      cite: 'The Fellowship of the Ring, Book II, Ch. 1'
    },
    {
      pos: { x: -2, z: -84 }, radius: 12,
      text: 'At the valley\'s head, a great fall of water leapt from a high cliff ledge into a mist-filled pool, and from that pool the Bruinen was born.',
      cite: 'The Fellowship of the Ring, Book II'
    },
  ],

  boundary: 150,
  transitions: [
    { trigger: { x: 20, z: 108, radius: 14 }, to: 'Weathertop' },
    { trigger: { x: 24, z: 64,  radius: 10 }, to: 'eregion'    },
  ],
  arrivals: {
    'Weathertop': { x: 20, z: 92, yaw: 0          },
    'eregion':    { x: 20, z: 28, yaw: Math.PI * 0.5 },
  },

  walkables: [
    { x: -1.5, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -38.0, yEnd: -35.5 },
    { x:  2.0, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -35.5, yEnd: -35.5 },
    { x:  5.5, z: 0, yaw: Math.PI/2, length: 3.5, width: 3.2, yStart: -35.5, yEnd: -38.0 },
  ],

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
    const matStream = new THREE.MeshLambertMaterial({ color: 0x4a9ab8, transparent: true, opacity: 0.86 });
    const matFoam   = new THREE.MeshLambertMaterial({ color: 0xddeeff, transparent: true, opacity: 0.78 });

    // =====================================================
    //  STREAM
    // =====================================================
    const BASE_WATER = -39.5, WATER_TILT = 0.03, STREAM_W = 5.5, STREAM_DZ = 5.0;
    function waterY(z) { return BASE_WATER + z * WATER_TILT; }
    function streamCx(z) { return 1 + Math.sin(z * 0.05) * 1.2; }

    for (let sz = 105; sz >= -85; sz -= STREAM_DZ) {
      const segZ = sz - STREAM_DZ / 2;
      const cx = streamCx(segZ), wY = waterY(segZ);
      const chFloor = groundY(1, segZ);
      const boxH = Math.max(0.4, wY - chFloor);
      const sBox = new THREE.Mesh(new THREE.BoxGeometry(STREAM_W, boxH, STREAM_DZ + 0.2), matStream.clone());
      sBox.position.set(cx, chFloor + boxH / 2, segZ);
      scene.add(sBox);
      refs.streamBoxes.push(sBox);
    }

    // =====================================================
    //  TREES
    // =====================================================
    const leafMats = [matGold, matRust, matAmber, matCopper];
    [[-16,-5],[-20,10],[-24,-20],[-28,5],[-18,30],[-26,42],
     [-22,-35],[-18,-52],[-14,-65],
     [22,0],[26,18],[24,-12],[28,35],[20,-28],[26,-45],[22,-58],
     [8,20],[9,-10],[8,-35],[10,5],
     [18,55],[14,65],[16,78],[22,85],[12,92],
    ].forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz), h = 5.5 + (i%5)*1.4, lm = leafMats[i%4];
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, h, 9), matWood);
      trunk.position.set(tx, gy + h/2 - h*0.25, tz);
      scene.add(trunk);
      const cr = 2.8 + (i%3)*0.7;
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h*0.8 + cr*0.45, tz);
      scene.add(can);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(cr*0.72, 8, 6), lm);
      c2.position.set(tx+(i%2?0.9:-0.9), gy+h*0.95+cr*0.45, tz+0.5);
      scene.add(c2);
      refs.foliage.push(can, c2);
    });

    // =====================================================
    //  BEND MIST
    // =====================================================
    [{x:-2,z:104,r:13,op:0.28},{x:10,z:108,r:16,op:0.32},
     {x:20,z:106,r:12,op:0.24},{x:4, z:116,r:18,op:0.20},
     {x:14,z:114,r:14,op:0.28},{x:0, z:122,r:20,op:0.16},
     {x:-6,z:118,r:11,op:0.22},{x:26,z:112,r:10,op:0.18},
    ].forEach(({x:mx,z:mz,r:mr,op}) => {
      const mMat = new THREE.MeshLambertMaterial({ color:0xd8eef4, transparent:true, opacity:op, depthWrite:false });
      const mMesh = new THREE.Mesh(new THREE.SphereGeometry(mr,8,6), mMat);
      mMesh.position.set(mx, groundY(mx,mz)+mr*0.55, mz);
      mMesh._phase=Math.random()*Math.PI*2; mMesh._startY=mMesh.position.y;
      scene.add(mMesh); refs.mistParticles.push(mMesh);
    });

    // =====================================================
    //  WATERFALL CHUTE
    //
    //  Correct rotation derivation:
    //    PlaneGeometry default: in XY plane, normal = +Z.
    //    After mesh.rotation.x = θ, the plane's Y-axis maps to (0, cosθ, sinθ).
    //    We want Y-axis to point DOWN the slope = (0, dy, dz) / segLen.
    //    So: cosθ = dy/segLen, sinθ = dz/segLen → θ = atan2(dz, dy).
    //    With dz>0 (toward pool) and dy<0 (dropping), atan2(dz,dy) ≈ 90°..170°.
    //    This tilts the plane so it lies ALONG the cliff face, stretching from
    //    top to bottom of each segment exactly on the terrain surface.
    //    Position: midpoint between sample points, offset 0.4 outward in +Z.
    // =====================================================
    const WF_X = -1, WF_Z_TOP = -115, WF_Z_BOT = -88, WF_DZ = 3.5;

    for (let cz = WF_Z_TOP; cz < WF_Z_BOT; cz += WF_DZ) {
      const z0 = cz, z1 = cz + WF_DZ;
      const h0 = groundY(WF_X, z0), h1 = groundY(WF_X, z1);
      const dz = z1 - z0, dy = h1 - h0;       // dz>0, dy<0 on steep sections
      const segLen = Math.sqrt(dz*dz + dy*dy);
      const midZ = (z0+z1)/2, midH = (h0+h1)/2;
      const tFrac = (cz - WF_Z_TOP) / (WF_Z_BOT - WF_Z_TOP);  // 0=top,1=bottom
      const wfW   = 1.6 + tFrac * 2.8;

      const wfGeo = new THREE.PlaneGeometry(wfW, segLen + 0.5);
      const wfMat = new THREE.MeshLambertMaterial({
        color: tFrac < 0.4 ? 0x99ccee : 0xbbddff,
        transparent: true, opacity: 0.50 + tFrac * 0.28,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const wfMesh = new THREE.Mesh(wfGeo, wfMat);
      // Place at midpoint on terrain surface, offset slightly outward (+Z)
      wfMesh.position.set(WF_X, midH + 0.4, midZ + 0.5);
      // Rotate so plane Y-axis aligns with downslope direction (dy, dz)
      wfMesh.rotation.x = Math.atan2(dz, dy);
      scene.add(wfMesh);
      refs.waterfallMeshes.push(wfMesh);
    }

    // Splash pool + spray
    const poolTop = waterY(WF_Z_BOT + 2);
    const splash  = new THREE.Mesh(new THREE.SphereGeometry(5.5,10,7), matFoam);
    splash.scale.y = 0.10;
    splash.position.set(WF_X, poolTop+0.1, WF_Z_BOT+2);
    scene.add(splash);
    const spray = new THREE.Mesh(new THREE.SphereGeometry(2.8,8,6),
      new THREE.MeshLambertMaterial({color:0xeef6ff, transparent:true, opacity:0.70}));
    spray.scale.y=2.0; spray.position.set(WF_X, poolTop+3.5, WF_Z_BOT+1); scene.add(spray);

    for (let pi=0; pi<24; pi++) {
      const ang=pi/24*Math.PI*2, pr=0.8+Math.random()*4.2;
      const pMat=new THREE.MeshLambertMaterial({color:0xddeeff,transparent:true,opacity:0.35+Math.random()*0.4,depthWrite:false});
      const pMesh=new THREE.Mesh(new THREE.SphereGeometry(0.3+Math.random()*0.45,6,4),pMat);
      const sY=poolTop+0.5+Math.random()*4;
      pMesh.position.set(WF_X+Math.cos(ang)*pr*0.6, sY, WF_Z_BOT+2+Math.sin(ang)*pr);
      pMesh._startY=sY; pMesh._phase=Math.random()*Math.PI*2;
      scene.add(pMesh); refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  BRIDGE — gentle arch, no parapets
    // =====================================================
    const BR_Z=0, BR_X0=-3.25, BR_X1=7.25, BR_CX=(BR_X0+BR_X1)/2;
    const BR_SPAN=BR_X1-BR_X0, DECK_END=-38.0, DECK_TOP=-35.5;
    const HALF_SPAN=BR_SPAN/2, SAG=DECK_TOP-DECK_END;
    const ARCH_R=(HALF_SPAN*HALF_SPAN+SAG*SAG)/(2*SAG);
    const ARCH_CY=DECK_END-ARCH_R, ARCH_W=3.2;
    const halfAng=Math.asin(HALF_SPAN/ARCH_R);

    [BR_X0,BR_X1].forEach(ax => {
      const abH=Math.max(0.8, DECK_END-groundY(ax,BR_Z)+0.3);
      const ab=new THREE.Mesh(new THREE.BoxGeometry(1.6,abH,ARCH_W+0.3),matDark);
      ab.position.set(ax, groundY(ax,BR_Z)+abH/2, BR_Z);
      scene.add(ab);
    });
    for (let vi=0; vi<9; vi++) {
      const angM=-halfAng+((vi+0.5)/9)*2*halfAng;
      const vGeo=new THREE.CylinderGeometry(0.45,0.45,ARCH_W,6);
      vGeo.rotateX(Math.PI/2);
      const vm=new THREE.Mesh(vGeo,matStone);
      vm.position.set(BR_CX+ARCH_R*Math.sin(angM), ARCH_CY+ARCH_R*Math.cos(angM), BR_Z);
      vm.rotation.z=angM; scene.add(vm);
    }
    for (let di=0; di<12; di++) {
      const angM=-halfAng+((di+0.5)/12)*2*halfAng;
      const ang0=-halfAng+(di/12)*2*halfAng, ang1=-halfAng+((di+1)/12)*2*halfAng;
      const r=ARCH_R+0.3;
      const slabW=Math.abs(BR_CX+r*Math.sin(ang1)-(BR_CX+r*Math.sin(ang0)))+0.05;
      const slab=new THREE.Mesh(new THREE.BoxGeometry(slabW,0.4,ARCH_W+0.2),matStone);
      slab.position.set(BR_CX+r*Math.sin(angM), ARCH_CY+r*Math.cos(angM)+0.25, BR_Z);
      slab.rotation.z=angM; scene.add(slab);
    }

    // =====================================================
    //  ROCKY WALLS
    // =====================================================
    [[-18,8,2.0],[-22,-20,2.4],[-16,-38,1.8],[22,14,2.2],[26,-24,1.9],
     [24,42,1.6],[-24,50,2.6],[28,-10,2.0],[-14,-68,1.5],[20,-65,1.9]
    ].forEach(([wx,wz,ws]) => {
      const wm=new THREE.Mesh(new THREE.SphereGeometry(ws,8,6),Math.random()>0.4?matDark:matStone);
      wm.position.set(wx,groundY(wx,wz)+ws*0.45,wz);
      wm.scale.set(1+Math.random()*0.3,0.65+Math.random()*0.35,1+Math.random()*0.3);
      wm.rotation.y=Math.random()*Math.PI; scene.add(wm);
    });

    // =====================================================
    //  ELVEN HALLS — on flat shelf (y≈-27)
    //
    //  Shelf: x=-17..-25, z=-46..-74.  All groundY calls in
    //  this zone return ≈-27. Buildings placed at various
    //  positions across the full shelf area.
    //
    //  Layout:
    //    Council of Elrond circle: ring of stones at (-20,-60), r=4
    //    Main hall:      (-21,-57) — central hall facing valley
    //    East hall:      (-19,-50) — entrance pavilion
    //    West hall:      (-21,-68) — deep hall, quieter
    //    Great tower:    (-20,-62) — tall landmark beside main hall
    //    Library wing:   (-23,-54) — secondary structure
    //    Terrace wall:   z=-46 front edge (low stone retaining wall)
    //    Shelf trees:    scattered behind buildings
    // =====================================================
    const SY = -27;   // shelf floor Y (matches SHELF_Y in hillHeight)

    // Low retaining wall along shelf front (z≈-46 face, runs in Z)
    for (let tz = -46; tz >= -74; tz -= 2.5) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.0, 2.6), matDark);
      tw.position.set(-16.7, SY + 1.0, tz);
      scene.add(tw);
    }
    // Cap strip
    const capMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 30), matStone);
    capMesh.position.set(-16.7, SY + 2.1, -60);
    scene.add(capMesh);

    // Council of Elrond — ring of standing stones, r=4
    const CC_X = -20, CC_Z = -60;
    for (let ci = 0; ci < 14; ci++) {
      const ang  = (ci / 14) * Math.PI * 2;
      const stX  = CC_X + Math.cos(ang) * 4;
      const stZ  = CC_Z + Math.sin(ang) * 4;
      const stH  = 1.8 + (ci % 3) * 0.4;
      const st   = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, stH, 7), matMoss);
      st.position.set(stX, SY + stH/2 - stH*0.15, stZ);
      scene.add(st);
    }
    // Council seat stones — low flat boulders inside ring
    for (let ci = 0; ci < 8; ci++) {
      const ang = (ci / 8) * Math.PI * 2;
      const sX  = CC_X + Math.cos(ang) * 2.6;
      const sZ  = CC_Z + Math.sin(ang) * 2.6;
      const s   = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), matDark);
      s.scale.y = 0.4;
      s.position.set(sX, SY + 0.22, sZ);
      scene.add(s);
    }

    // Main hall — largest, central
    const MH_X=-21, MH_Z=-57;
    const mHall=new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.8,7.5,9),matElven);
    mHall.position.set(MH_X, SY+7.5/2-7.5*0.22, MH_Z);
    scene.add(mHall);
    const mRoof=new THREE.Mesh(new THREE.CylinderGeometry(0.5,5.8,3.5,9),matRoof);
    mRoof.position.set(MH_X, SY+7.5-7.5*0.22+1.2, MH_Z);
    scene.add(mRoof);

    // Great tower beside main hall
    const GT_X=-19, GT_Z=-62;
    const gTower=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.25,15,9),matElven);
    gTower.position.set(GT_X, SY+15/2-15*0.22, GT_Z);
    scene.add(gTower);
    const gRoof=new THREE.Mesh(new THREE.CylinderGeometry(0.08,1.1,3.5,9),matRoof);
    gRoof.position.set(GT_X, SY+15-15*0.22+1.1, GT_Z);
    scene.add(gRoof);

    // East entrance pavilion
    const EH_X=-19, EH_Z=-50;
    const eHall=new THREE.Mesh(new THREE.CylinderGeometry(4.0,4.2,5.5,9),matElven);
    eHall.position.set(EH_X, SY+5.5/2-5.5*0.22, EH_Z);
    scene.add(eHall);
    const eRoof=new THREE.Mesh(new THREE.CylinderGeometry(0.4,4.2,2.8,9),matRoof);
    eRoof.position.set(EH_X, SY+5.5-5.5*0.22+0.9, EH_Z);
    scene.add(eRoof);
    // Entrance pavilion small tower
    const et=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.85,8,9),matElven);
    et.position.set(EH_X+2, SY+8/2-8*0.2, EH_Z+2);
    scene.add(et);
    const etR=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.75,2.4,9),matRoof);
    etR.position.set(EH_X+2, SY+8-8*0.2+0.8, EH_Z+2);
    scene.add(etR);

    // Library wing
    const LH_X=-23, LH_Z=-53;
    const lHall=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.7,6.0,9),matElven);
    lHall.position.set(LH_X, SY+6.0/2-6.0*0.22, LH_Z);
    scene.add(lHall);
    const lRoof=new THREE.Mesh(new THREE.CylinderGeometry(0.35,3.7,2.8,9),matRoof);
    lRoof.position.set(LH_X, SY+6.0-6.0*0.22+0.9, LH_Z);
    scene.add(lRoof);

    // West hall — deeper in hillside
    const WH_X=-22, WH_Z=-70;
    const wHall=new THREE.Mesh(new THREE.CylinderGeometry(4.0,4.2,6.0,9),matElven);
    wHall.position.set(WH_X, SY+6.0/2-6.0*0.22, WH_Z);
    scene.add(wHall);
    const wRoof=new THREE.Mesh(new THREE.CylinderGeometry(0.4,4.2,2.8,9),matRoof);
    wRoof.position.set(WH_X, SY+6.0-6.0*0.22+0.9, WH_Z);
    scene.add(wRoof);
    // Slender west tower
    const wt=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1.0,10,9),matElven);
    wt.position.set(WH_X-2, SY+10/2-10*0.2, WH_Z-3);
    scene.add(wt);
    const wtR=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.85,2.5,9),matRoof);
    wtR.position.set(WH_X-2, SY+10-10*0.2+0.8, WH_Z-3);
    scene.add(wtR);

    // Shelf trees (behind buildings, against cliff)
    [[-24,-50,matGold],[-25,-57,matAmber],[-24,-65,matRust],[-25,-70,matCopper]].forEach(([tx,tz,lm],i) => {
      const h=5.0+i*0.7, cr=2.2+i*0.3;
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.30,h,9),matWood);
      tr.position.set(tx, SY+h/2-h*0.25, tz);
      scene.add(tr);
      const can=new THREE.Mesh(new THREE.SphereGeometry(cr,8,6),lm);
      can.position.set(tx, SY+h*0.8+cr*0.45, tz);
      scene.add(can);
      refs.foliage.push(can);
    });

    // =====================================================
    //  EREGION RAMP — waymarker stones and slope trees
    //  Stones mark the route up the south slope and signal
    //  the Eregion exit at the top of the ramp.
    //  A few autumn trees provide visual depth on the slope.
    // =====================================================

    // Path waymarker stones — spaced every ~9 units along doubled ramp
    [
      [10, 10, 1.6], [11, 18, 1.4], [13, 26, 1.8],
      [15, 34, 1.5], [16, 42, 2.0], [18, 50, 1.7],
      [20, 58, 2.2], [21, 66, 1.9],
    ].forEach(([sx, sz, sh]) => {
      const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.30, sh, 7), matMoss);
      sm.position.set(sx, groundY(sx, sz) + sh/2 - sh*0.2, sz);
      scene.add(sm);
    });

    // Top-of-ramp marker — two taller stones flanking the exit col
    [[23, 66, 3.0], [21, 67, 2.8]].forEach(([sx, sz, sh]) => {
      const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, sh, 9), matDark);
      sm.position.set(sx, groundY(sx, sz) + sh/2 - sh*0.2, sz);
      scene.add(sm);
    });

    // Slope trees — spread across full ramp length
    [
      [12,  8, matAmber], [14, 16, matGold],
      [16, 24, matRust],  [18, 32, matAmber],
      [20, 40, matCopper],[19, 48, matGold],
      [21, 56, matRust],  [22, 62, matAmber],
    ].forEach(([tx, tz, lm], i) => {
      const gy = groundY(tx, tz);
      const h  = 4.8 + (i % 3) * 1.1;
      const cr = 2.4 + (i % 2) * 0.6;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.32, h, 9), matWood);
      tr.position.set(tx, gy + h/2 - h*0.25, tz);
      scene.add(tr);
      const can = new THREE.Mesh(new THREE.SphereGeometry(cr, 8, 6), lm);
      can.position.set(tx, gy + h*0.82 + cr*0.4, tz);
      scene.add(can);
      refs.foliage.push(can);
    });

    // Entry stones near arrival
    [[18,88,2.8],[22,86,3.0],[16,80,2.5],[20,76,2.6]].forEach(([rx,rz,rh]) => {
      const rm=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.40,rh,9),matMoss);
      rm.position.set(rx, groundY(rx,rz)+rh/2-rh*0.25, rz);
      scene.add(rm);
    });

    // Firelight
    const fireLight=new THREE.PointLight(0xffcc66,2.2,40);
    fireLight.position.set(MH_X, SY+7, MH_Z);
    scene.add(fireLight);
    const fireFill=new THREE.PointLight(0xffaa44,1.0,28);
    fireFill.position.set(EH_X, SY+5, EH_Z);
    scene.add(fireFill);
    // Soft council glow
    const councilGlow=new THREE.PointLight(0xfff0cc,0.6,18);
    councilGlow.position.set(CC_X, SY+3, CC_Z);
    scene.add(councilGlow);

    refs.fireLight=fireLight; refs.fireFill=fireFill;
    refs.councilGlow=councilGlow;
    refs.flames=[]; refs.embers=[];
    return refs;
  },

  onFrame(t, dt, refs) {
    if (!refs) return;
    refs.t=(refs.t||0)+dt;
    const T=refs.t;

    if (refs.streamBoxes) refs.streamBoxes.forEach((s,i)=>{
      s.material.opacity=0.80+Math.sin(T*1.4+i*0.7)*0.07;
    });
    if (refs.waterfallMeshes) refs.waterfallMeshes.forEach((wf,i)=>{
      wf.material.opacity=Math.max(0.25,wf.material.opacity+Math.sin(T*1.8+i*0.6)*dt*0.12);
    });
    if (refs.waterParticles) refs.waterParticles.forEach(p=>{
      p.position.y+=dt*0.28;
      p.position.x+=Math.sin(T*0.4+p._phase)*dt*0.06;
      p.material.opacity=0.25+Math.sin(T*0.8+p._phase)*0.22;
      if(p.position.y>p._startY+8) p.position.y=p._startY;
    });
    if (refs.mistParticles) refs.mistParticles.forEach((p,i)=>{
      p.material.opacity=Math.max(0.08,p.material.opacity+Math.sin(T*0.3+p._phase)*dt*0.06);
      p.position.y=p._startY+Math.sin(T*0.22+i)*0.7;
    });
    if (refs.foliage) refs.foliage.forEach((f,i)=>{
      f.rotation.z=Math.sin(T*0.55+i*0.9)*0.022;
      f.rotation.x=Math.sin(T*0.38+i*1.2)*0.014;
    });
    if(refs.fireLight)  refs.fireLight.intensity =2.0+Math.sin(T*1.1)*0.28;
    if(refs.fireFill)   refs.fireFill.intensity  =0.8+Math.sin(T*0.85+1.2)*0.15;
    if(refs.councilGlow)refs.councilGlow.intensity=0.55+Math.sin(T*0.7+0.5)*0.12;
  },
};

window.Rivendell = Rivendell;
