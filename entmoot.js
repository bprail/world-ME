// entmoot.js — Derndingle, the Hidden Dell of the Entmoot
// Sequence: fangorn <-> entmoot <-> isengard
// Daytime forest clearing, thick dark encircling trees, descended into from +Z (south)

const Entmoot = {

  name:     'Derndingle',
  subtitle: 'The Hidden Dell · Place of Entmoot',

  // ─── Atmosphere ──────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x5a7040,   // green-grey forest haze
    fogType:          'linear',
    fogNear:          55,
    fogFar:           200,
    skyColor:         0x7a9050,   // dappled canopy green-grey
    ambientColor:     0x4a5c30,
    ambientIntensity: 1.2,
    moonColor:        0xd0c890,   // warm afternoon sun filtering through canopy
    moonIntensity:    0.65,
    moonPosition:     { x: 60, y: 120, z: -40 },
    showStars:        false,
    extraLights: [
      // secondary fill — sky reflected off the dell floor
      { color: 0x8aaa60, intensity: 0.35, x: -40, y: 60, z: 50 },
      // soft backlight through canopy
      { color: 0x607040, intensity: 0.20, x:  20, y: 80, z: 80 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────────
  // Derndingle: a wide round depression — bowl-shaped clearing in the forest.
  // The path descends from the south (+Z) rim down into the bowl centre, then
  // climbs out the north (-Z) rim toward Isengard.
  // Dense dark tree-wall rings the edge at ~55–70 units out.

  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Radial distance from centre
    const r = Math.sqrt(x * x + z * z);

    // ── Bowl shape ──────────────────────────────────────────────────────────
    // The clearing floor: flat depression ~0 to -2 at centre
    // Rises to form a rim at r ≈ 42, then climbs steeply into the tree-wall
    const bowlFloor   = -2.0 * Math.max(0, 1 - (r / 38) * (r / 38));
    const rimRise     = r > 30 ? Math.pow((r - 30) / 22, 1.6) * 9.0  : 0;
    const treeWall    = r > 48 ? Math.pow((r - 48) / 14, 2.0) * 18.0 : 0;
    const base        = bowlFloor + rimRise + treeWall;

    // ── Entry paths: gentle troughs cut into the rim ─────────────────────
    // South entry (+Z) — Fangorn side
    const southAngle  = Math.atan2(x, z);              // 0 at +Z
    const southBlend  = Math.max(0, 1 - Math.abs(southAngle) / 0.28);
    const southTrough = r > 38 ? -southBlend * Math.min((r - 38) / 16, 1) * 7.0 : 0;

    // West exit (-X) — Isengard side
    const westAngle   = Math.atan2(z, -x);             // 0 at -X
    const westBlend   = Math.max(0, 1 - Math.abs(westAngle) / 0.26);
    const westTrough  = r > 38 ? -westBlend * Math.min((r - 38) / 16, 1) * 6.5 : 0;

    // ── Fine detail ─────────────────────────────────────────────────────────
    const detail  = fbm(x * 0.07, z * 0.07) * 0.9
                  + noise(x * 0.18, z * 0.18) * 0.4;

    // Smooth detail to near-zero in the deep bowl floor
    const floorDamp = Math.min(1, r / 22);
    const h = base + southTrough + westTrough + detail * floorDamp;

    // Hard clamp: never expose sub-terrain at edge of world mesh
    return Math.max(h, -3.5);
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const r = Math.sqrt(vx * vx + vz * vz);

    // ── Palette ──────────────────────────────────────────────────────────────
    const floorGrass = [0.28, 0.38, 0.14];   // deep clearing grass
    const mossGrass  = [0.22, 0.32, 0.12];   // darker moss patches
    const rootDark   = [0.16, 0.20, 0.09];   // root-shadow near trees
    const earthBrown = [0.30, 0.22, 0.12];   // bare earth path
    const rimMoss    = [0.18, 0.26, 0.11];   // mossy rim stone

    const n1 = noise2d(vx * 0.11, vz * 0.11);
    const n2 = noise2d(vx * 0.27, vz * 0.23);

    // South path corridor colouring
    const southAngle = Math.atan2(vx, vz);
    const pathSouth  = Math.max(0, 1 - Math.abs(southAngle) / 0.22) * Math.max(0, Math.min(1, (r - 20) / 28));

    // West path
    const westAngle  = Math.atan2(vz, -vx);
    const pathWest   = Math.max(0, 1 - Math.abs(westAngle) / 0.20) * Math.max(0, Math.min(1, (r - 20) / 28));

    const pathBlend  = Math.min(1, pathSouth + pathWest);

    // Base: grass blended with moss by noise
    let col = [
      lerp(floorGrass[0], mossGrass[0], n1),
      lerp(floorGrass[1], mossGrass[1], n1),
      lerp(floorGrass[2], mossGrass[2], n1),
    ];

    // Dark root zone near tree wall
    if (r > 42) {
      const t = Math.min(1, (r - 42) / 20);
      col = [
        lerp(col[0], rootDark[0], t * (0.6 + n2 * 0.4)),
        lerp(col[1], rootDark[1], t * (0.6 + n2 * 0.4)),
        lerp(col[2], rootDark[2], t * (0.6 + n2 * 0.4)),
      ];
    }

    // Rim moss patches
    if (vy > 2.5) {
      const t = Math.min(1, (vy - 2.5) / 5) * (0.5 + n2 * 0.5);
      col = [
        lerp(col[0], rimMoss[0], t),
        lerp(col[1], rimMoss[1], t),
        lerp(col[2], rimMoss[2], t),
      ];
    }

    // Earth path
    if (pathBlend > 0.05) {
      col = [
        lerp(col[0], earthBrown[0], pathBlend * 0.55),
        lerp(col[1], earthBrown[1], pathBlend * 0.55),
        lerp(col[2], earthBrown[2], pathBlend * 0.55),
      ];
    }

    return col;
  },

  // Path: enters south (+Z, ~z=55) → spirals gently into bowl centre → exits west (-X, ~x=-55)
  onPath(x, z) {
    // Segment 1: south entry — straight descent from +Z rim into bowl
    // Segment 2: curve through bowl floor
    // Segment 3: exit west

    function distToSegment(px, pz, ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
      return Math.sqrt((px - ax - t * dx) ** 2 + (pz - az - t * dz) ** 2);
    }

    // Waypoints mirroring pathWaypoints below
    const segs = [
      [[  0, 55], [  0, 30]],
      [[  0, 30], [  0,  8]],
      [[  0,  8], [-10,  0]],
      [[-10,  0], [-28, -4]],
      [[-28, -4], [-50, -6]],
      [[-50, -6], [-55, -6]],
    ];

    let minD = Infinity;
    for (const [[ax, az], [bx, bz]] of segs) {
      const d = distToSegment(x, z, ax, az, bx, bz);
      if (d < minD) minD = d;
    }

    const radius = 2.5;
    return minD < radius ? Math.max(0, 1 - minD / radius) : 0;
  },

  pathWaypoints: [
    [  0,  55],   // south rim entry (+Z end) — coming from Fangorn
    [  0,  30],
    [  0,   8],   // near bowl centre
    [-10,   0],   // pivot west-northwest through the moot floor
    [-28,  -4],
    [-50,  -6],
    [-55,  -6],   // west rim exit (-X end) — heading toward Isengard
  ],

  // ─── Player start & arrivals ─────────────────────────────────────────────────
  start: { x: 0, z: 50, yaw: 0 },   // at +Z end, facing -Z (into the dell)

  arrivals: {
    fangorn:  { x:  0, z:  52, yaw: 0            },  // arriving from +Z, facing -Z
    isengard: { x: -52, z: -6, yaw: Math.PI * 1.5 }, // arriving from -X, facing +X
  },

  // ─── Boundary & transitions ──────────────────────────────────────────────────
  boundary: 72,

  transitions: [
    {
      trigger: { x:  0, z: 63, radius: 8 },
      to: 'fangorn',
    },
    {
      trigger: { x: -63, z: -6, radius: 8 },
      to: 'isengard',
    },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  // The Entmoot clearing is terrain-only — no elevated walkables needed.
  walkables: [],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  // Block the player from wandering into the impenetrable tree-wall
  barriers: [],

  // ─── Lore points ─────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: 40 },
      radius: 6,
      text:   '"Hrum, Hoom! Do not be hasty, that is my motto. But if I am angry, something might change. The Ents have not troubled about the wars of Men and Wizards for a long time. But this is no Orc-work. Saruman must have a mind of metal and wheels."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: 0, z: 12 },
      radius: 6,
      text:   'At the centre of Derndingle — the hidden dell — Merry and Pippin waited on the outskirts as the Ents gathered. The great assembly of tree-herds had not been held in an age. Their deep voices rolled and boomed, slow as root-growth, through three long days.',
      cite:   '— The Two Towers, III.4',
    },
    {
      pos:    { x: 10, z: -4 },
      radius: 5,
      text:   '"We have been too hasty." Then Treebeard stood tall again, and his eyes opened, and his voice rang out through the glade: "I am not altogether on anybody\'s side, because nobody is altogether on my side, if you understand me: nobody cares for the woods as I care for them, not even Elves nowadays."',
      cite:   '— Treebeard, The Two Towers, III.4',
    },
    {
      pos:    { x: -20, z: -2 },
      radius: 6,
      text:   'The Entmoot reached its decision. The drumming song of the Ents filled the forest as they broke from the dell, marching west. "We go to war," Treebeard said. For the first time in long years, the Shepherds of the Trees went to the aid of the world.',
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

    // ── Helper: random spread around a point ──────────────────────────────
    const rng = (function() {
      let s = 1337;
      return function() {
        s ^= s << 13; s ^= s >> 17; s ^= s << 5;
        return ((s >>> 0) / 4294967296);
      };
    }());

    // ── 1. ENCIRCLING TREE-WALL ───────────────────────────────────────────
    // Dense ring of old Fangorn trees around the clearing rim, r ≈ 48–68
    // Uses CylinderGeometry for trunks (avoid BoxGeometry stripe artefact).
    // Canopy spheres layered on top.

    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2a1e0e, side: THREE.FrontSide });
    const canopyDarkMat  = new THREE.MeshLambertMaterial({ color: 0x1a2a0a, side: THREE.FrontSide });
    const canopyMossMat  = new THREE.MeshLambertMaterial({ color: 0x243214, side: THREE.FrontSide });
    const canopyDeepMat  = new THREE.MeshLambertMaterial({ color: 0x0e1a06, side: THREE.FrontSide });

    const NUM_TREES = 68;
    for (let i = 0; i < NUM_TREES; i++) {
      const angle  = (i / NUM_TREES) * Math.PI * 2 + rng() * 0.12;
      const radius = 50 + rng() * 18;
      const tx     = Math.sin(angle) * radius;
      const tz     = Math.cos(angle) * radius;

      // Skip a gap at the south entry and west exit
      const southGap = Math.abs(Math.atan2(tx, tz))        < 0.18;  // +Z corridor
      const westGap  = Math.abs(Math.atan2(tz, -tx))       < 0.16;  // -X corridor
      if (southGap || westGap) continue;

      const gy   = groundY(tx, tz);
      const h    = 14 + rng() * 10;
      const rBot = 0.6 + rng() * 0.4;
      const rTop = rBot * 0.6;

      // Trunk
      const tGeo = new THREE.CylinderGeometry(rTop, rBot, h, 9);
      const tMesh = new THREE.Mesh(tGeo, trunkMat);
      tMesh.position.set(tx, gy + h / 2 - h * 0.18, tz);
      tMesh.rotation.x = (rng() - 0.5) * 0.08;
      tMesh.rotation.z = (rng() - 0.5) * 0.08;
      scene.add(tMesh);

      // Canopy — 2–3 sphere clusters
      const nCan = 2 + Math.floor(rng() * 2);
      const canMats = [canopyDarkMat, canopyMossMat, canopyDeepMat];
      for (let c = 0; c < nCan; c++) {
        const cr   = 3.5 + rng() * 2.8;
        const cGeo = new THREE.SphereGeometry(cr, 10, 7);
        const cMesh = new THREE.Mesh(cGeo, canMats[Math.floor(rng() * 3)]);
        cMesh.position.set(
          tx + (rng() - 0.5) * 3,
          gy + h - cr * 0.5 + c * 1.8 + rng() * 2,
          tz + (rng() - 0.5) * 3
        );
        scene.add(cMesh);
      }

      // Prominent gnarled root-flares at base (flat slabs)
      if (rng() > 0.55) {
        for (let r = 0; r < 3; r++) {
          const ra    = angle + (r / 3) * Math.PI * 2 + rng() * 0.4;
          const rLen  = 1.0 + rng() * 0.8;
          const rGeo  = new THREE.BoxGeometry(0.4, 0.3, rLen);
          const rMesh = new THREE.Mesh(rGeo, trunkMat);
          rMesh.position.set(
            tx + Math.sin(ra) * rLen * 0.5,
            gy + 0.1,
            tz + Math.cos(ra) * rLen * 0.5
          );
          rMesh.rotation.y = ra;
          scene.add(rMesh);
        }
      }
    }

    // ── 2. INNER RING — elder Ent-standing-trees ──────────────────────────
    // A handful of especially ancient trees standing just inside the clearing
    // at r ≈ 34–42, spaced so the Entmoot floor stays open.
    const elderTrunkMat   = new THREE.MeshLambertMaterial({ color: 0x1e1408, side: THREE.FrontSide });
    const elderCanopyMat  = new THREE.MeshLambertMaterial({ color: 0x1c280c, side: THREE.FrontSide });

    const ELDER_COUNT = 14;
    for (let i = 0; i < ELDER_COUNT; i++) {
      const angle  = (i / ELDER_COUNT) * Math.PI * 2 + 0.2 + rng() * 0.1;
      const radius = 34 + rng() * 8;
      const tx     = Math.sin(angle) * radius;
      const tz     = Math.cos(angle) * radius;

      const southGap = Math.abs(Math.atan2(tx, tz))  < 0.26;
      const westGap  = Math.abs(Math.atan2(tz, -tx)) < 0.24;
      if (southGap || westGap) continue;

      const gy = groundY(tx, tz);
      const h  = 18 + rng() * 8;
      const rB = 0.9 + rng() * 0.5;

      const tGeo  = new THREE.CylinderGeometry(rB * 0.5, rB, h, 9);
      const tMesh = new THREE.Mesh(tGeo, elderTrunkMat);
      tMesh.position.set(tx, gy + h / 2 - h * 0.22, tz);
      scene.add(tMesh);

      const cr    = 4.5 + rng() * 2;
      const cGeo  = new THREE.SphereGeometry(cr, 10, 7);
      const cMesh = new THREE.Mesh(cGeo, elderCanopyMat);
      cMesh.position.set(tx + (rng() - 0.5) * 2, gy + h - cr * 0.3, tz + (rng() - 0.5) * 2);
      scene.add(cMesh);
    }

    // ── 3. FLOOR DETAIL — mossy boulders and root humps ──────────────────
    // Scattered stones around the clearing floor (r < 30), ancient and mossy
    const stoneMat  = new THREE.MeshLambertMaterial({ color: 0x3a3c2a, side: THREE.FrontSide });
    const mossMat   = new THREE.MeshLambertMaterial({ color: 0x2a3618, side: THREE.FrontSide });

    const BOULDER_COUNT = 24;
    for (let i = 0; i < BOULDER_COUNT; i++) {
      const angle  = rng() * Math.PI * 2;
      const radius = 8 + rng() * 24;
      const bx     = Math.sin(angle) * radius;
      const bz     = Math.cos(angle) * radius;

      // Keep clear of path centreline
      const pathBlend = Math.max(
        Math.max(0, 1 - Math.abs(Math.atan2(bx, bz)) / 0.20)  * (radius > 15 ? 1 : 0),
        Math.max(0, 1 - Math.abs(Math.atan2(bz, -bx)) / 0.18) * (radius > 15 ? 1 : 0)
      );
      if (pathBlend > 0.5) continue;

      const gy   = groundY(bx, bz);
      const s    = 0.4 + rng() * 1.0;
      const bGeo = new THREE.SphereGeometry(s, 10, 7);
      const mat  = rng() > 0.5 ? mossMat : stoneMat;
      const bMesh = new THREE.Mesh(bGeo, mat);
      bMesh.position.set(bx, gy + s * 0.45, bz);
      bMesh.rotation.y = rng() * Math.PI * 2;
      scene.add(bMesh);
    }

    // ── 4. ENTMOOT MARKER — Treebeard's speaking stone ───────────────────
    // A single large ancient stone at the floor centre — the Ents stood around it.
    const markerMat = new THREE.MeshLambertMaterial({ color: 0x484830, side: THREE.FrontSide });
    const mGeo  = new THREE.CylinderGeometry(1.4, 1.8, 2.2, 9);
    const mMesh = new THREE.Mesh(mGeo, markerMat);
    const mGY   = groundY(0, 0);
    mMesh.position.set(0, mGY + 1.1 - 2.2 * 0.18, 0);
    scene.add(mMesh);

    // Moss cap slab on top
    const capGeo  = new THREE.BoxGeometry(3.4, 0.2, 3.4);
    const capMesh = new THREE.Mesh(capGeo, mossMat);
    capMesh.position.set(0, mGY + 2.3, 0);
    capMesh.rotation.y = 0.3;
    scene.add(capMesh);

    // ── 5. PATH SIDE DETAILS — small stones lining the entry paths ────────
    // Pairs of markers at intervals along the south entry path
    const pathMarkerMat = new THREE.MeshLambertMaterial({ color: 0x3c3828, side: THREE.FrontSide });
    const pathZ = [48, 40, 32];
    for (const pz of pathZ) {
      for (const side of [-1.8, 1.8]) {
        const gy = groundY(side, pz);
        const h  = 0.6 + Math.abs(side) * 0.1;
        const pGeo  = new THREE.CylinderGeometry(0.2, 0.3, h, 7);
        const pMesh = new THREE.Mesh(pGeo, pathMarkerMat);
        pMesh.position.set(side, gy + h / 2 - h * 0.2, pz);
        scene.add(pMesh);
      }
    }

    // ── 6. UNDERSTORY FERNS / LOW BRUSH ───────────────────────────────────
    // Simple flat cross-planes for low ground cover at the bowl rim
    const fernMat = new THREE.MeshLambertMaterial({
      color:       0x1e3010,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     0.88,
    });

    const FERN_COUNT = 60;
    for (let i = 0; i < FERN_COUNT; i++) {
      const angle  = rng() * Math.PI * 2;
      const radius = 28 + rng() * 22;
      const fx     = Math.sin(angle) * radius;
      const fz     = Math.cos(angle) * radius;

      const southGap = Math.abs(Math.atan2(fx, fz))  < 0.14;
      const westGap  = Math.abs(Math.atan2(fz, -fx)) < 0.14;
      if (southGap || westGap) continue;

      const gy   = groundY(fx, fz);
      const s    = 0.6 + rng() * 0.8;
      const fGeo = new THREE.PlaneGeometry(s * 2, s * 1.2);

      for (let p = 0; p < 2; p++) {
        const fMesh = new THREE.Mesh(fGeo, fernMat);
        fMesh.position.set(fx, gy + s * 0.5, fz);
        fMesh.rotation.y = p * Math.PI * 0.5 + rng() * 0.4;
        scene.add(fMesh);
      }
    }

    // ── 7. AMBIENT DAPPLED LIGHT POOLS ───────────────────────────────────
    // A few dim point lights in the bowl to suggest canopy light shafts
    const shaftColors = [0x9ab870, 0x88a860, 0xa0c078];
    const shaftPositions = [
      [  8,  12], [ -9,   5], [  4, -10], [ -6,  22],
    ];
    for (let i = 0; i < shaftPositions.length; i++) {
      const [sx, sz] = shaftPositions[i];
      const gy = groundY(sx, sz);
      const light = new THREE.PointLight(shaftColors[i % shaftColors.length], 0.28, 22);
      light.position.set(sx, gy + 6, sz);
      scene.add(light);
    }

    // ── 8. ENT FIGURES — the Moot assembly ───────────────────────────────
    // A ring of Ents standing in the bowl at r ≈ 10–20, facing the centre stone.
    // Each Ent is a THREE.Group: legs (pair of cylinders), torso, two arms,
    // head-crown (branchy sphere cluster). The group pivot is at foot level so
    // the whole figure sways naturally around its base in onFrame.
    //
    // We also add Treebeard himself — slightly taller, standing at the stone.

    const entBodyMat  = new THREE.MeshLambertMaterial({ color: 0x3a2a0e });  // dark bark
    const entMossMat  = new THREE.MeshLambertMaterial({ color: 0x2e3c14 });  // moss-covered crown
    const entBranchMat= new THREE.MeshLambertMaterial({ color: 0x2a1e08 });  // darker limbs

    // Build one Ent group.  scale=1 is "regular" Ent; scale≈1.25 for Treebeard.
    function makeEnt(scale, facingAngle) {
      const g = new THREE.Group();
      // Rotate the whole figure to face the centre (angle = atan2(x,z) of its position)
      g.rotation.y = facingAngle + Math.PI; // +PI so it faces inward

      const H = scale; // height unit

      // ── Legs (two thick tapered cylinders) ──────────────────────────
      for (const side of [-1, 1]) {
        const legGeo = new THREE.CylinderGeometry(0.22 * H, 0.30 * H, 3.0 * H, 9);
        const leg    = new THREE.Mesh(legGeo, entBodyMat);
        leg.position.set(side * 0.35 * H, 1.5 * H, 0);
        g.add(leg);
      }

      // ── Torso ───────────────────────────────────────────────────────
      const torsoGeo = new THREE.CylinderGeometry(0.55 * H, 0.65 * H, 3.5 * H, 9);
      const torso    = new THREE.Mesh(torsoGeo, entBodyMat);
      torso.position.set(0, 4.75 * H, 0);
      g.add(torso);

      // ── Arms (long angled cylinders, raised slightly as if gesturing) ─
      for (const side of [-1, 1]) {
        const armGeo = new THREE.CylinderGeometry(0.12 * H, 0.18 * H, 3.2 * H, 7);
        const arm    = new THREE.Mesh(armGeo, entBranchMat);
        // Pivot arm group so rotation bends it outward and slightly upward
        const armPivot = new THREE.Group();
        arm.position.set(0, 1.6 * H, 0);         // arm hangs from pivot
        armPivot.add(arm);
        armPivot.position.set(side * 0.70 * H, 5.8 * H, 0);
        armPivot.rotation.z = side * 0.55;        // spread outward
        armPivot.rotation.x = -0.20;              // lean slightly forward
        g.add(armPivot);

        // Finger branches at arm tip
        for (let f = 0; f < 3; f++) {
          const fGeo = new THREE.CylinderGeometry(0.04 * H, 0.07 * H, 1.0 * H, 6);
          const fMesh= new THREE.Mesh(fGeo, entBranchMat);
          const fAngle = (f / 3) * Math.PI * 0.9 - 0.3;
          fMesh.position.set(
            side * Math.sin(fAngle) * 0.6 * H,
            arm.position.y + 1.6 * H + 0.5 * H,
            Math.cos(fAngle) * 0.5 * H
          );
          fMesh.rotation.z = side * (0.3 + f * 0.15);
          armPivot.add(fMesh);
        }
      }

      // ── Neck / head stump ───────────────────────────────────────────
      const neckGeo = new THREE.CylinderGeometry(0.30 * H, 0.45 * H, 1.0 * H, 9);
      const neck    = new THREE.Mesh(neckGeo, entBodyMat);
      neck.position.set(0, 7.0 * H, 0);
      g.add(neck);

      // ── Head crown — branching sphere cluster ───────────────────────
      const headPositions = [
        [0, 0, 0, 1.0],       // central mass
        [0.5, 0.6, 0.2, 0.7], // branch left
        [-0.4, 0.5, 0.1, 0.65],
        [0.1, 0.9, -0.3, 0.55],
        [-0.2, 0.8, 0.4, 0.5],
      ];
      for (const [hx, hy, hz, hr] of headPositions) {
        const hGeo  = new THREE.SphereGeometry(hr * H, 10, 7);
        const hMesh = new THREE.Mesh(hGeo, entMossMat);
        hMesh.position.set(hx * H, 7.6 * H + hy * H, hz * H);
        g.add(hMesh);
      }

      // ── Eyes — two small dark indentations (flattened spheres) ──────
      for (const side of [-1, 1]) {
        const eyeGeo  = new THREE.SphereGeometry(0.11 * H, 7, 5);
        const eyeMesh = new THREE.Mesh(eyeGeo, new THREE.MeshLambertMaterial({ color: 0x0a0a06 }));
        eyeMesh.position.set(side * 0.26 * H, 7.7 * H, 0.9 * H);
        eyeMesh.scale.z = 0.4;
        g.add(eyeMesh);
      }

      return g;
    }

    // Place a ring of 9 Ents around the moot floor
    const ENT_COUNT  = 9;
    const ENT_RADIUS = 15;
    refs.entGroups   = [];

    for (let i = 0; i < ENT_COUNT; i++) {
      // Spread around 270° — leave the west exit quadrant clear
      const sweep = Math.PI * 1.5;
      const startAngle = Math.PI * 0.25;   // start just past south-entry gap
      const angle  = startAngle + (i / (ENT_COUNT - 1)) * sweep;
      const ex     = Math.sin(angle) * (ENT_RADIUS + (rng() - 0.5) * 4);
      const ez     = Math.cos(angle) * (ENT_RADIUS + (rng() - 0.5) * 4);
      const gy     = groundY(ex, ez);
      const scale  = 0.80 + rng() * 0.30;
      const facingAngle = Math.atan2(ex, ez);  // face toward centre (origin)

      const entG = makeEnt(scale, facingAngle);
      entG.position.set(ex, gy, ez);

      // Per-Ent sway metadata stored on the group for onFrame
      entG.userData.swayPhase  = rng() * Math.PI * 2;
      entG.userData.swaySpeed  = 0.18 + rng() * 0.12;
      entG.userData.swayAmt    = 0.012 + rng() * 0.010;
      entG.userData.baseRotY   = entG.rotation.y;

      scene.add(entG);
      refs.entGroups.push(entG);
    }

    // ── Treebeard — largest, standing at the speaking stone ─────────
    {
      const tbScale = 1.30;
      const tbG     = makeEnt(tbScale, 0);    // faces -Z (south, toward new arrivals)
      tbG.position.set(0, groundY(0, 3) + 0, 3);  // just behind the stone
      tbG.userData.swayPhase = 0.0;
      tbG.userData.swaySpeed = 0.14;
      tbG.userData.swayAmt   = 0.008;
      tbG.userData.baseRotY  = tbG.rotation.y;
      scene.add(tbG);
      refs.treebeard = tbG;
      refs.entGroups.push(tbG);
    }

    return refs;
  },

  // ─── onArrive ────────────────────────────────────────────────────────────────
  onArrive(fromKey, refs) {
    // Nothing dynamic to trigger on arrival
  },

  // ─── onFrame ─────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // Sway each Ent figure — slow, ponderous rocking as if deep in thought.
    // Each has an independent phase and speed so the ring moves like a grove
    // of old trees in a very light wind, not a synchronised chorus.
    if (!refs.entGroups) return;
    for (const g of refs.entGroups) {
      const { swayPhase, swaySpeed, swayAmt, baseRotY } = g.userData;
      // Primary side-to-side sway (rotation around Y gives a hip-sway effect)
      const sway = Math.sin(t * swaySpeed + swayPhase) * swayAmt;
      // Secondary fore-aft lean — slower, smaller
      const lean = Math.sin(t * swaySpeed * 0.6 + swayPhase + 1.1) * swayAmt * 0.4;
      g.rotation.y = baseRotY + sway;
      g.rotation.z = lean;
    }
  },
};

window.Entmoot = Entmoot;
