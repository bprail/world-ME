// entmoot.js — Derndingle, the Hidden Dell of the Entmoot
// Sequence: fangorn <-> entmoot <-> isengard
// Daytime forest clearing, thick dark encircling trees, descended into from +Z (south)

const Entmoot = {

  name:     'Derndingle',
  subtitle: 'The Hidden Dell · Place of Entmoot',

  // ─── Atmosphere ──────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x4a6030,   // deep forest green haze — oppressive outside the clearing
    fogType:          'linear',
    fogNear:          40,
    fogFar:           160,
    skyColor:         0x6a8848,   // green-grey canopy sky — only a small patch overhead
    ambientColor:     0x3a5020,
    ambientIntensity: 1.3,
    moonColor:        0xc8c480,   // dappled afternoon sun
    moonIntensity:    0.70,
    moonPosition:     { x: 60, y: 130, z: -50 },
    showStars:        false,
    extraLights: [
      { color: 0x7a9850, intensity: 0.30, x: -50, y: 70, z:  40 },
      { color: 0x506030, intensity: 0.18, x:  30, y: 90, z:  70 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    const r = Math.sqrt(x * x + z * z);

    // Bowl shape — flat depression in the clearing, rising to a rim, then steep
    const bowlFloor = -2.5 * Math.max(0, 1 - (r / 40) * (r / 40));
    const rimRise   = r > 32 ? Math.pow((r - 32) / 20, 1.5) * 10.0 : 0;
    const treeWall  = r > 55 ? Math.pow((r - 55) / 12, 2.0) * 22.0 : 0;
    const base      = bowlFloor + rimRise + treeWall;

    // Entry troughs cut into the rim
    const southAngle  = Math.atan2(x, z);
    const southBlend  = Math.max(0, 1 - Math.abs(southAngle) / 0.26);
    const southTrough = r > 38 ? -southBlend * Math.min((r - 38) / 18, 1) * 8.0 : 0;

    const westAngle   = Math.atan2(z, -x);
    const westBlend   = Math.max(0, 1 - Math.abs(westAngle) / 0.24);
    const westTrough  = r > 38 ? -westBlend * Math.min((r - 38) / 18, 1) * 7.5 : 0;

    const detail    = fbm(x * 0.07, z * 0.07) * 0.9 + noise(x * 0.18, z * 0.18) * 0.4;
    const floorDamp = Math.min(1, r / 24);

    return Math.max(base + southTrough + westTrough + detail * floorDamp, -4.0);
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const r = Math.sqrt(vx * vx + vz * vz);

    // Bright grassy green in the bowl, darkening to shadowed root-ground at tree-wall
    const brightGrass = [0.32, 0.52, 0.14];  // vivid clearing grass
    const dappleGrass = [0.26, 0.44, 0.12];  // slightly darker patches
    const shadedGrass = [0.18, 0.30, 0.10];  // near tree line
    const rootDark    = [0.12, 0.18, 0.06];  // deep tree shadow
    const earthBrown  = [0.28, 0.22, 0.12];  // bare earth path

    const n1 = noise2d(vx * 0.10, vz * 0.10);
    const n2 = noise2d(vx * 0.26, vz * 0.22);

    // Path colouring follows new waypoint bends (computed same as onPath)
    function distToSeg(px, pz, ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.sqrt((px-ax)**2 + (pz-az)**2);
      const t = Math.max(0, Math.min(1, ((px-ax)*dx + (pz-az)*dz) / lenSq));
      return Math.sqrt((px - ax - t*dx)**2 + (pz - az - t*dz)**2);
    }
    const pathSegs = [
      [[0,55],[0,40]],[[0,40],[3,28]],[[3,28],[6,18]],
      [[6,18],[8,8]], [[8,8],[4,0]],  [[4,0],[-6,-4]],
      [[-6,-4],[-16,-2]],[[-16,-2],[-24,0]],
      [[-24,0],[-34,-3]],[[-34,-3],[-50,-5]],[[-50,-5],[-55,-5]],
    ];
    let minPathD = Infinity;
    for (const [[ax,az],[bx,bz]] of pathSegs) {
      const d = distToSeg(vx, vz, ax, az, bx, bz);
      if (d < minPathD) minPathD = d;
    }
    const pathBlend = minPathD < 2.5 ? Math.max(0, 1 - minPathD / 2.5) : 0;

    // Base grass blended with dapple noise
    let col = [
      lerp(brightGrass[0], dappleGrass[0], n1),
      lerp(brightGrass[1], dappleGrass[1], n1),
      lerp(brightGrass[2], dappleGrass[2], n1),
    ];

    // Shade near the tree wall
    if (r > 38) {
      const t = Math.min(1, (r - 38) / 24);
      const dark = t > 0.5 ? rootDark : shadedGrass;
      const tt   = t > 0.5 ? (t - 0.5) * 2 : t * 2;
      col = [
        lerp(col[0], dark[0], tt * (0.5 + n2 * 0.5)),
        lerp(col[1], dark[1], tt * (0.5 + n2 * 0.5)),
        lerp(col[2], dark[2], tt * (0.5 + n2 * 0.5)),
      ];
    }

    // Earth path
    if (pathBlend > 0.05) {
      col = [
        lerp(col[0], earthBrown[0], pathBlend * 0.5),
        lerp(col[1], earthBrown[1], pathBlend * 0.5),
        lerp(col[2], earthBrown[2], pathBlend * 0.5),
      ];
    }

    return col;
  },

  // ─── Path ────────────────────────────────────────────────────────────────────
  // Winds: south entry → east of centre (past lore 1 at z=40, lore 2 at z=12) →
  // curves around the stone → west past lore 3 (10,-4), lore 4 (-20,-2), lore 5 (-44,-5)
  onPath(x, z) {
    function distToSeg(px, pz, ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.sqrt((px-ax)**2 + (pz-az)**2);
      const t = Math.max(0, Math.min(1, ((px-ax)*dx + (pz-az)*dz) / lenSq));
      return Math.sqrt((px - ax - t*dx)**2 + (pz - az - t*dz)**2);
    }
    const segs = [
      [[0,55],[0,40]],[[0,40],[3,28]],[[3,28],[6,18]],
      [[6,18],[8,8]], [[8,8],[4,0]],  [[4,0],[-6,-4]],
      [[-6,-4],[-16,-2]],[[-16,-2],[-24,0]],
      [[-24,0],[-34,-3]],[[-34,-3],[-50,-5]],[[-50,-5],[-55,-5]],
    ];
    let minD = Infinity;
    for (const [[ax,az],[bx,bz]] of segs) {
      const d = distToSeg(x, z, ax, az, bx, bz);
      if (d < minD) minD = d;
    }
    const radius = 2.5;
    return minD < radius ? Math.max(0, 1 - minD / radius) : 0;
  },

  pathWaypoints: [
    [  0,  55],  // south rim entry
    [  0,  40],  // first lore point (Treebeard's warning)
    [  3,  28],
    [  6,  18],
    [  8,   8],  // approaching stone
    [  4,   0],  // near second lore (centre)
    [ -6,  -4],  // past the stone, Treebeard's speech
    [-16,  -2],
    [-24,   0],  // lore 4 — the decision
    [-34,  -3],
    [-50,  -5],  // lore 5 — marching song
    [-55,  -5],  // west rim exit toward Isengard
  ],

  // ─── Player start & arrivals ─────────────────────────────────────────────────
  start: { x: 0, z: 50, yaw: 0 },   // at +Z end, facing -Z

  arrivals: {
    fangorn:  { x:   0, z:  52, yaw: 0             },  // arriving from +Z, facing -Z
    isengard: { x: -52, z:  -5, yaw: Math.PI * 1.5 },  // arriving from -X, facing +X
  },

  // ─── Boundary & transitions ──────────────────────────────────────────────────
  boundary: 72,

  transitions: [
    { trigger: { x:   0, z:  63, radius: 8 }, to: 'fangorn'  },
    { trigger: { x: -63, z:  -5, radius: 8 }, to: 'isengard' },
  ],

  walkables: [],
  barriers:  [],

  // ─── Lore points ─────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 40 },
      radius: 6,
      text:   '"Hrum, Hoom! Do not be hasty, that is my motto. But if I am angry, something might change. The Ents have not troubled about the wars of Men and Wizards for a long time. But this is no Orc-work. Saruman must have a mind of metal and wheels."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: 6, z: 12 },
      radius: 6,
      text:   'At the centre of Derndingle — the hidden dell — Merry and Pippin waited on the outskirts as the Ents gathered. The great assembly of tree-herds had not been held in an age. Their deep voices rolled and boomed, slow as root-growth, through three long days.',
      cite:   '— The Two Towers, III.4',
    },
    {
      pos:    { x: -6, z: -4 },
      radius: 5,
      text:   '"I am not altogether on anybody\'s side, because nobody is altogether on my side, if you understand me: nobody cares for the woods as I care for them, not even Elves nowadays."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: -24, z: 0 },
      radius: 6,
      text:   'The Entmoot reached its decision. The drumming song of the Ents filled the forest as they broke from the dell, marching west. For the first time in long years, the Shepherds of the Trees went to the aid of the world.',
      cite:   '— The Two Towers, III.4',
    },
    {
      pos:    { x: -44, z: -5 },
      radius: 6,
      text:   '"We march now. We march to Isengard! With merry ring, or with mournful roar — we come, we come with rolling drums: ta-runda runda runda rom!"',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
  ],

  // ─── buildScene ──────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {
    const refs = {};

    // Deterministic RNG
    const rng = (function() {
      let s = 1337;
      return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
    }());

    const trunkMat      = new THREE.MeshLambertMaterial({ color: 0x251808 });
    const canopyDark    = new THREE.MeshLambertMaterial({ color: 0x0e1a06 });
    const canopyMoss    = new THREE.MeshLambertMaterial({ color: 0x182808 });
    const canopyMid     = new THREE.MeshLambertMaterial({ color: 0x142010 });
    const canopyMats    = [canopyDark, canopyMoss, canopyMid];

    // ── 1. OUTER TREE-WALL (r ≈ 58–80) ───────────────────────────────────
    // Pushed well out; large canopies to close off the sky at the edges.
    const NUM_OUTER = 90;
    for (let i = 0; i < NUM_OUTER; i++) {
      const angle  = (i / NUM_OUTER) * Math.PI * 2 + rng() * 0.14;
      const radius = 60 + rng() * 18;
      const tx = Math.sin(angle) * radius;
      const tz = Math.cos(angle) * radius;

      const southGap = Math.abs(Math.atan2(tx, tz))  < 0.16;
      const westGap  = Math.abs(Math.atan2(tz, -tx)) < 0.14;
      if (southGap || westGap) continue;

      const gy   = groundY(tx, tz);
      const h    = 18 + rng() * 14;
      const rBot = 0.7 + rng() * 0.5;
      const rTop = rBot * 0.55;

      const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 9), trunkMat);
      tMesh.position.set(tx, gy + h / 2 - h * 0.18, tz);
      tMesh.rotation.x = (rng() - 0.5) * 0.07;
      tMesh.rotation.z = (rng() - 0.5) * 0.07;
      scene.add(tMesh);

      // Large canopy spheres — spread wide to close gaps
      const nCan = 3 + Math.floor(rng() * 2);
      for (let c = 0; c < nCan; c++) {
        const cr    = 5 + rng() * 4;
        const cMesh = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 7), canopyMats[Math.floor(rng() * 3)]);
        cMesh.position.set(
          tx + (rng() - 0.5) * 5,
          gy + h - cr * 0.4 + c * 2.5 + rng() * 2,
          tz + (rng() - 0.5) * 5
        );
        scene.add(cMesh);
      }
    }

    // ── 2. INNER TREE-WALL (r ≈ 42–56) — denser ring just inside outer ───
    // These are the trees the player sees as the main encircling wall.
    const NUM_INNER = 70;
    for (let i = 0; i < NUM_INNER; i++) {
      const angle  = (i / NUM_INNER) * Math.PI * 2 + 0.08 + rng() * 0.12;
      const radius = 44 + rng() * 12;
      const tx = Math.sin(angle) * radius;
      const tz = Math.cos(angle) * radius;

      const southGap = Math.abs(Math.atan2(tx, tz))  < 0.20;
      const westGap  = Math.abs(Math.atan2(tz, -tx)) < 0.18;
      if (southGap || westGap) continue;

      const gy   = groundY(tx, tz);
      const h    = 14 + rng() * 10;
      const rBot = 0.55 + rng() * 0.4;

      const tMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rBot * 0.55, rBot, h, 9), trunkMat);
      tMesh.position.set(tx, gy + h / 2 - h * 0.20, tz);
      tMesh.rotation.z = (rng() - 0.5) * 0.10;
      scene.add(tMesh);

      const nCan = 2 + Math.floor(rng() * 2);
      for (let c = 0; c < nCan; c++) {
        const cr    = 4 + rng() * 3;
        const cMesh = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 7), canopyMats[Math.floor(rng() * 3)]);
        cMesh.position.set(
          tx + (rng() - 0.5) * 3,
          gy + h - cr * 0.4 + c * 2 + rng() * 1.5,
          tz + (rng() - 0.5) * 3
        );
        scene.add(cMesh);
      }

      // Root flares
      if (rng() > 0.5) {
        for (let rf = 0; rf < 3; rf++) {
          const ra   = angle + (rf / 3) * Math.PI * 2 + rng() * 0.4;
          const rLen = 1.0 + rng() * 0.9;
          const rMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, rLen), trunkMat);
          rMesh.position.set(tx + Math.sin(ra) * rLen * 0.5, gy + 0.1, tz + Math.cos(ra) * rLen * 0.5);
          rMesh.rotation.y = ra;
          scene.add(rMesh);
        }
      }
    }

    // ── 3. DARK FOREST CURTAINS ───────────────────────────────────────────
    // Large vertical planes standing just inside the outer tree ring, forming a
    // near-solid dark wall that blots out the sky beyond the clearing.
    // Multiple overlapping panels at slightly different radii and angles give depth.
    const curtainMat = new THREE.MeshLambertMaterial({
      color:       0x0a1206,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     0.82,
    });
    const curtainMat2 = new THREE.MeshLambertMaterial({
      color:       0x060e04,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     0.70,
    });

    const NUM_CURTAINS = 36;
    for (let i = 0; i < NUM_CURTAINS; i++) {
      const angle   = (i / NUM_CURTAINS) * Math.PI * 2;
      const nextAng = ((i + 1) / NUM_CURTAINS) * Math.PI * 2;
      const midAng  = (angle + nextAng) / 2;

      // Skip gaps
      const southGap = Math.abs(Math.atan2(Math.sin(midAng), Math.cos(midAng))) < 0.22;
      const westAng  = midAng - Math.PI * 0.5;
      const westGap  = Math.abs(Math.atan2(Math.sin(westAng), Math.cos(westAng)))  < 0.20;
      if (southGap || westGap) continue;

      // Panel width spans the arc between two adjacent tree positions
      const arcLen = 2 * Math.PI * 56 / NUM_CURTAINS * 1.4;  // slight overlap
      const panH   = 28 + rng() * 10;
      const radius = 54 + rng() * 6;
      const cx     = Math.sin(midAng) * radius;
      const cz     = Math.cos(midAng) * radius;
      const gy     = groundY(cx, cz);

      for (let layer = 0; layer < 2; layer++) {
        const layerR = radius + layer * 8;
        const lx     = Math.sin(midAng) * layerR;
        const lz     = Math.cos(midAng) * layerR;
        const lgy    = groundY(lx, lz);
        const mat    = layer === 0 ? curtainMat : curtainMat2;

        const panGeo  = new THREE.PlaneGeometry(arcLen, panH);
        const panMesh = new THREE.Mesh(panGeo, mat);
        panMesh.position.set(lx, lgy + panH / 2 - 1, lz);
        // Rotate panel to face the clearing centre
        panMesh.rotation.y = -midAng;
        scene.add(panMesh);
      }
    }

    // ── 4. SPEAKING STONE — flush with the ground, grey ──────────────────
    // Nearly flat, just breaking the surface — ancient and worn almost smooth.
    const stoneMat  = new THREE.MeshLambertMaterial({ color: 0x707268 });
    const stoneMat2 = new THREE.MeshLambertMaterial({ color: 0x5a5c54 });
    const mGY       = groundY(0, 0);

    // Main slab — very low cylinder, flush with ground
    const slabGeo  = new THREE.CylinderGeometry(2.8, 3.2, 0.35, 11);
    const slabMesh = new THREE.Mesh(slabGeo, stoneMat);
    slabMesh.position.set(0, mGY + 0.14, 0);
    slabMesh.rotation.y = 0.4;
    scene.add(slabMesh);

    // A few smaller outlying stones, also nearly flush
    const outliers = [[3.8, 1.2, 0.6], [-3.2, 0.8, 0.5], [1.5, -3.5, 0.55], [-2.8, -2.2, 0.45]];
    for (const [ox, oz, os] of outliers) {
      const oGY  = groundY(ox, oz);
      const oGeo = new THREE.CylinderGeometry(os * 0.7, os, 0.22, 9);
      const oMesh = new THREE.Mesh(oGeo, stoneMat2);
      oMesh.position.set(ox, oGY + 0.09, oz);
      oMesh.rotation.y = rng() * Math.PI;
      scene.add(oMesh);
    }

    // ── 5. FLOOR BOULDERS — mossy, near tree wall ─────────────────────────
    const bossMat = new THREE.MeshLambertMaterial({ color: 0x2e3820 });
    const BOULDERS = 20;
    for (let i = 0; i < BOULDERS; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 22 + rng() * 18;
      const bx  = Math.sin(ang) * rad;
      const bz  = Math.cos(ang) * rad;
      const gy  = groundY(bx, bz);
      const s   = 0.5 + rng() * 0.9;
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), bossMat);
      bMesh.position.set(bx, gy + s * 0.42, bz);
      scene.add(bMesh);
    }

    // ── 6. UNDERSTORY — fern cross-planes at the rim ─────────────────────
    const fernMat = new THREE.MeshLambertMaterial({
      color: 0x1a2e0a, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
    });
    const FERNS = 55;
    for (let i = 0; i < FERNS; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 30 + rng() * 20;
      const fx  = Math.sin(ang) * rad;
      const fz  = Math.cos(ang) * rad;
      if (Math.abs(Math.atan2(fx, fz)) < 0.14) continue;
      if (Math.abs(Math.atan2(fz, -fx)) < 0.12) continue;
      const gy = groundY(fx, fz);
      const s  = 0.7 + rng() * 0.9;
      const fGeo = new THREE.PlaneGeometry(s * 2.2, s * 1.3);
      for (let p = 0; p < 2; p++) {
        const fMesh = new THREE.Mesh(fGeo, fernMat);
        fMesh.position.set(fx, gy + s * 0.5, fz);
        fMesh.rotation.y = p * Math.PI * 0.5 + rng() * 0.5;
        scene.add(fMesh);
      }
    }

    // ── 7. DAPPLED LIGHT POOLS ────────────────────────────────────────────
    const shaftCols = [0x90b060, 0x80a050, 0x98b868];
    const shafts    = [[8, 12], [-9, 5], [4, -10], [-6, 22], [14, -6]];
    for (let i = 0; i < shafts.length; i++) {
      const [sx, sz] = shafts[i];
      const gy = groundY(sx, sz);
      const l  = new THREE.PointLight(shaftCols[i % shaftCols.length], 0.30, 24);
      l.position.set(sx, gy + 7, sz);
      scene.add(l);
    }

    // ── 8. ENT FIGURES ────────────────────────────────────────────────────
    // Ents: each is a THREE.Group pivoting at foot level.
    // Sway uses rotation.z (lean) as primary — visibly large side tilt.

    const entBodyMat   = new THREE.MeshLambertMaterial({ color: 0x3a2a0e });
    const entMossMat   = new THREE.MeshLambertMaterial({ color: 0x2e3c14 });
    const entBranchMat = new THREE.MeshLambertMaterial({ color: 0x2a1e08 });
    const eyeMat       = new THREE.MeshLambertMaterial({ color: 0x0a0a06 });

    function makeEnt(scale, facingAngle) {
      const g = new THREE.Group();
      g.rotation.y = facingAngle + Math.PI;  // face inward
      const H = scale;

      // Legs
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22*H, 0.30*H, 3.0*H, 9), entBodyMat);
        leg.position.set(side * 0.35*H, 1.5*H, 0);
        g.add(leg);
      }

      // Torso
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55*H, 0.65*H, 3.5*H, 9), entBodyMat);
      torso.position.set(0, 4.75*H, 0);
      g.add(torso);

      // Arms
      for (const side of [-1, 1]) {
        const armPivot = new THREE.Group();
        armPivot.position.set(side * 0.70*H, 5.8*H, 0);
        armPivot.rotation.z = side * 0.55;
        armPivot.rotation.x = -0.20;
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12*H, 0.18*H, 3.2*H, 7), entBranchMat);
        arm.position.set(0, 1.6*H, 0);
        armPivot.add(arm);
        for (let f = 0; f < 3; f++) {
          const fAngle = (f / 3) * Math.PI * 0.9 - 0.3;
          const fMesh  = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04*H, 0.07*H, 1.0*H, 6), entBranchMat);
          fMesh.position.set(
            side * Math.sin(fAngle) * 0.6*H,
            arm.position.y + 1.6*H + 0.5*H,
            Math.cos(fAngle) * 0.5*H
          );
          fMesh.rotation.z = side * (0.3 + f * 0.15);
          armPivot.add(fMesh);
        }
        g.add(armPivot);
      }

      // Neck
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30*H, 0.45*H, 1.0*H, 9), entBodyMat);
      neck.position.set(0, 7.0*H, 0);
      g.add(neck);

      // Head crown
      for (const [hx, hy, hz, hr] of [
        [0, 0, 0, 1.0], [0.5, 0.6, 0.2, 0.7], [-0.4, 0.5, 0.1, 0.65],
        [0.1, 0.9, -0.3, 0.55], [-0.2, 0.8, 0.4, 0.5],
      ]) {
        const hMesh = new THREE.Mesh(new THREE.SphereGeometry(hr*H, 10, 7), entMossMat);
        hMesh.position.set(hx*H, 7.6*H + hy*H, hz*H);
        g.add(hMesh);
      }

      // Eyes
      for (const side of [-1, 1]) {
        const eMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11*H, 7, 5), eyeMat);
        eMesh.position.set(side * 0.26*H, 7.7*H, 0.9*H);
        eMesh.scale.z = 0.4;
        g.add(eMesh);
      }

      return g;
    }

    // Ring of 9 Ents at r ≈ 14–20, spread across 270°, leave west exit clear
    refs.entGroups = [];
    const ENT_COUNT  = 9;
    const ENT_RADIUS = 16;
    const sweep      = Math.PI * 1.5;
    const startAng   = Math.PI * 0.25;

    for (let i = 0; i < ENT_COUNT; i++) {
      const angle = startAng + (i / (ENT_COUNT - 1)) * sweep;
      const ex    = Math.sin(angle) * (ENT_RADIUS + (rng() - 0.5) * 4);
      const ez    = Math.cos(angle) * (ENT_RADIUS + (rng() - 0.5) * 4);
      const gy    = groundY(ex, ez);
      const scale = 0.80 + rng() * 0.30;
      const faceY = Math.atan2(ex, ez);

      const entG = makeEnt(scale, faceY);
      entG.position.set(ex, gy, ez);
      entG.userData.swayPhase  = rng() * Math.PI * 2;
      entG.userData.swaySpeed  = 0.20 + rng() * 0.14;
      entG.userData.swayAmt    = 0.10 + rng() * 0.08;   // large lean — clearly visible
      entG.userData.baseRotY   = entG.rotation.y;
      entG.userData.baseRotZ   = 0;
      scene.add(entG);
      refs.entGroups.push(entG);
    }

    // Treebeard — tallest, at the stone, faces south (-Z direction = yaw 0)
    {
      const tbG = makeEnt(1.35, 0);
      tbG.position.set(0, groundY(0, 3.5), 3.5);
      tbG.userData.swayPhase = 1.2;
      tbG.userData.swaySpeed = 0.15;
      tbG.userData.swayAmt   = 0.07;
      tbG.userData.baseRotY  = tbG.rotation.y;
      tbG.userData.baseRotZ  = 0;
      scene.add(tbG);
      refs.treebeard = tbG;
      refs.entGroups.push(tbG);
    }

    return refs;
  },

  // ─── onArrive ────────────────────────────────────────────────────────────────
  onArrive(fromKey, refs) {},

  // ─── onFrame ─────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    if (!refs.entGroups) return;

    for (const g of refs.entGroups) {
      const { swayPhase, swaySpeed, swayAmt, baseRotY } = g.userData;

      // Primary sway: rotation.z = visible side-to-side lean of the whole body.
      // This is the most perceptible motion — the top of a 10-unit Ent travels
      // swayAmt * 10 world units at the tip, so 0.10 rad ≈ 1 unit visible arc.
      const leanZ = Math.sin(t * swaySpeed + swayPhase) * swayAmt;

      // Secondary: very slight Y twist, makes it feel less mechanical
      const twistY = Math.sin(t * swaySpeed * 0.7 + swayPhase + 0.9) * swayAmt * 0.25;

      // Fore-aft: small nod, independent phase
      const leanX = Math.sin(t * swaySpeed * 0.5 + swayPhase + 2.1) * swayAmt * 0.18;

      g.rotation.z = leanZ;
      g.rotation.y = baseRotY + twistY;
      g.rotation.x = leanX;
    }
  },
};

window.Entmoot = Entmoot;
