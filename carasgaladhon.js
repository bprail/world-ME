// carasgaladhon.js — Caras Galadhon, the City of the Trees
// Sequence: Lothlórien → Caras Galadhon → Anduin
// Time: Golden daytime, autumn

const CarasGaladhon = {

  name: 'Caras Galadhon',
  subtitle: 'City of the Trees · Lórien',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:        0xc8a85a,
    fogType:         'linear',
    fogNear:         70,
    fogFar:          260,
    skyColor:        0x8ca8c0,
    ambientColor:    0xb89050,
    ambientIntensity: 1.6,
    moonColor:       0xffe090,   // warm golden sun
    moonIntensity:   1.1,
    moonPosition:    { x: 60, y: 140, z: -80 },
    showStars:       false,
    extraLights: [
      // soft fill from beneath the canopy
      { color: 0xd4a030, intensity: 0.55, x: -40, y: 20,  z:  60 },
      // cool sky bounce
      { color: 0x88aac0, intensity: 0.22, x:  10, y: -30, z: -20 },
    ],
  },

  // ─── Terrain ───────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const n  = window.api_fbm(x * 0.04, z * 0.04);
    const n2 = window.api_fbm(x * 0.09 + 4, z * 0.09 + 4);
    // gentle undulation, slight central bowl for the Mirror glade
    const bowl = Math.max(0, 1 - Math.sqrt(x * x + (z + 22) * (z + 22)) / 18) * -1.2;
    return n * 2.8 + n2 * 0.9 + bowl;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    const n2 = noise2d(vx * 0.18 + 7, vz * 0.18 + 7);
    // golden-leaf floor base
    const gold   = [0.62, 0.44, 0.10];
    const amber  = [0.70, 0.34, 0.06];
    const duff   = [0.38, 0.28, 0.10];
    const moss   = [0.28, 0.32, 0.10];
    let c = [
      lerp(gold[0], amber[0], n),
      lerp(gold[1], amber[1], n),
      lerp(gold[2], amber[2], n),
    ];
    // mix in dark duff in hollows
    const t2 = Math.max(0, n2 - 0.4) * 1.6;
    c = [lerp(c[0], duff[0], t2), lerp(c[1], duff[1], t2), lerp(c[2], duff[2], t2)];
    // subtle moss patches
    const tm = Math.max(0, noise2d(vx * 0.13, vz * 0.13) - 0.6) * 1.4;
    c = [lerp(c[0], moss[0], tm * 0.4), lerp(c[1], moss[1], tm * 0.4), lerp(c[2], moss[2], tm * 0.4)];
    return c;
  },

  onPath(x, z) {
    // Main path: from +Z arrival (z≈60) curving west then south to Mirror glade
    const waypoints = [
      [0,   60],
      [0,   30],
      [-8,  10],
      [-12, -10],
      [-10, -22],  // Mirror glade
    ];
    let minD = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [ax, az] = waypoints[i];
      const [bx, bz] = waypoints[i + 1];
      const dx = bx - ax, dz = bz - az;
      const len2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
      const px = ax + t * dx, pz = az + t * dz;
      const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
      if (d < minD) minD = d;
    }
    return Math.max(0, 1 - minD / 2.4);
  },

  // ─── Path waypoints ────────────────────────────────────────────────────────
  pathWaypoints: [
    [0,    60],
    [0,    30],
    [-8,   10],
    [-12, -10],
    [-10, -22],
  ],

  // ─── Lore ──────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos: { x: 0, z: 50 },
      radius: 6,
      text: '"At the hill\'s foot Frodo found Aragorn, standing still and silent as a tree; but in his hand was a small cloth in which lay a few crumbs of lembas."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 7',
    },
    {
      pos: { x: 14, z: 0 },
      radius: 6,
      text: '"They dwelt in the tree-city of Caras Galadhon, in halls of leaves, and no footstep of enemy had ever come there."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 7',
    },
    {
      pos: { x: 0, z: -8 },
      radius: 7,
      text: '"At the crown of the hill was a wide space of level ground; the great trunk of a mallorn-tree rose there, and its wide-spread branches bore lamps of silver light."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 7',
    },
    {
      pos: { x: -10, z: -22 },
      radius: 5,
      text: '"In the evening Galadriel came to where Frodo sat, and she brought a mirror of silver upon a pedestal. She filled it with water from a silver ewer."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 7',
    },
    {
      pos: { x: -10, z: -22 },
      radius: 3,
      text: '"I give you the light of Eärendil, our most beloved star. May it be a light to you in dark places, when all other lights go out."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 8',
    },
    {
      pos: { x: 20, z: -50 },
      radius: 6,
      text: '"They had ridden on the river for many miles, and the mountains of the west were far away. On either side the banks were clothed in trees, and the light of the setting sun gleamed on the great stream."',
      cite: '— The Fellowship of the Ring, Book II, Ch. 9',
    },
  ],

  // ─── Walkables — great tree spiral steps + flet ────────────────────────────
  // yStart/yEnd are absolute world Y. hillHeight is called here (module-load
  // time) to bake the terrain offset in — groundY is not available yet but
  // hillHeight is on the same object and returns the same value.
  get walkables() {
    const gy = this.hillHeight(0, -8); // terrain Y at the great tree base
    // Step heights relative to terrain, then shifted to absolute world Y:
    //   step 1:  0.5 → 3.5   (rises  3 units)
    //   step 2:  3.5 → 6.5   (rises  3 units)
    //   step 3:  6.5 → 9.5   (rises  3 units)
    //   step 4:  9.5 → 12.5  (rises  3 units)
    //   flet:   13.0 flat     (matches top of step 4)
    return [
      { x:  3, z:  -5, yaw: 0.4, length: 7, width: 2.2, yStart: gy +  0.5, yEnd: gy +  3.5 },
      { x:  5, z: -10, yaw: 1.0, length: 7, width: 2.2, yStart: gy +  3.5, yEnd: gy +  6.5 },
      { x:  2, z: -14, yaw: 1.6, length: 7, width: 2.2, yStart: gy +  6.5, yEnd: gy +  9.5 },
      { x: -3, z: -11, yaw: 2.2, length: 7, width: 2.2, yStart: gy +  9.5, yEnd: gy + 12.5 },
      { x:  0, z:  -8, yaw: 0,   length: 8, width: 8,   yStart: gy + 13.0, yEnd: gy + 13.0 },
    ];
  },

  // ─── Barriers ──────────────────────────────────────────────────────────────
  barriers: [
    // Keep player off the steep north and south terrain edges
    { x: 0, z:  82, w: 200, d: 8,  yaw: 0 },
    { x: 0, z: -82, w: 200, d: 8,  yaw: 0 },
    // Thin chasm ring around the Mirror glade edge (symbolic)
    // none needed — Mirror is in a bowl, not a cliff
  ],

  // ─── Player start & arrivals ───────────────────────────────────────────────
  start: { x: 0, z: 60, yaw: 0 },   // at +Z end, facing -Z (into city)

  arrivals: {
    lothlorien: { x:  0, z:  60, yaw: 0           },  // arriving from +Z, facing -Z
    argonath:     { x: 20, z: -60, yaw: Math.PI * 1.5 }, // arriving from -X side, facing +X → no, from east
    // Anduin is to the east (+X); arriving from there means coming from +X, facing -X
  },

  // ─── Boundary & transitions ────────────────────────────────────────────────
  boundary: 82,

  transitions: [
    {
      trigger: { x: 0, z: 72, radius: 8 },
      to: 'lothlorien',
    },
    {
      trigger: { x: 30, z: -55, radius: 8 },
      to: 'argonath',
    },
  ],

  // ─── Build scene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {
    const refs = {};

    // ── Helpers ──────────────────────────────────────────────────────────────
    function rng(seed) {
      // simple deterministic LCG
      let s = seed | 0;
      return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    }

    function addMesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ─────────────────────────────────────────────────────────────
    const matBark = new THREE.MeshLambertMaterial({ color: 0x5a3a18 });
    const matBarkPale = new THREE.MeshLambertMaterial({ color: 0x8c7040 });
    const matLeafGold = new THREE.MeshLambertMaterial({ color: 0xe8b030, transparent: true, opacity: 0.92 });
    const matLeafAmber = new THREE.MeshLambertMaterial({ color: 0xc86818, transparent: true, opacity: 0.88 });
    const matLeafPale = new THREE.MeshLambertMaterial({ color: 0xf0d050, transparent: true, opacity: 0.90 });
    const matSilver = new THREE.MeshLambertMaterial({ color: 0xc8d8e0 });
    const matMirrorWater = new THREE.MeshLambertMaterial({ color: 0x8ab8d0, transparent: true, opacity: 0.82, emissive: 0x204060, emissiveIntensity: 0.4 });
    const matMirrorBasin = new THREE.MeshLambertMaterial({ color: 0x707890 });
    const matFletWood = new THREE.MeshLambertMaterial({ color: 0x7a5c28 });
    const matRopeStone = MAT.STONE;
    const matLamp = new THREE.MeshLambertMaterial({ color: 0xfff0c0, emissive: 0xffe080, emissiveIntensity: 1.0 });
    const matLeafFall = new THREE.MeshLambertMaterial({ color: 0xd0880c, transparent: true, opacity: 0.70 });

    const leafMats = [matLeafGold, matLeafAmber, matLeafPale];

    // ── Mallorn forest ────────────────────────────────────────────────────────
    // Positions: distributed around the area, avoiding the great tree (0,-8) and Mirror (-10,-22)
    const mallornData = [
      // [x, z, trunkH, trunkR, canopyR, leafMatIdx]
      // Entrance grove
      [ 8,  55, 22, 0.55, 7,  0], [-8,  52, 20, 0.5,  6,  1],
      [14,  42, 24, 0.60, 8,  2], [-13, 44, 21, 0.52, 7,  0],
      [18,  32, 26, 0.58, 9,  1], [-16, 35, 23, 0.55, 8,  2],
      // Mid city
      [20,  18, 25, 0.56, 8,  0], [-20, 20, 22, 0.50, 7,  1],
      [24,   5, 27, 0.60, 9,  2], [-22, 8,  24, 0.55, 8,  0],
      [22, -10, 25, 0.58, 8,  1], [-24,-6,  23, 0.52, 7,  2],
      // Southern quarter
      [16, -28, 22, 0.50, 7,  0], [-18,-30, 24, 0.56, 8,  1],
      [22, -40, 26, 0.60, 9,  2], [-20,-42, 22, 0.50, 7,  0],
      [10, -50, 20, 0.48, 6,  1], [-12,-52, 21, 0.50, 7,  2],
      [28, -20, 24, 0.55, 8,  0], [-28,-18, 23, 0.52, 7,  1],
      [30, -35, 25, 0.58, 8,  2], [-30,-38, 24, 0.55, 8,  0],
      // Outer ring
      [36,  10, 28, 0.62, 9,  1], [-35, 14, 26, 0.58, 9,  2],
      [38, -10, 27, 0.60, 9,  0], [-38,-8,  25, 0.55, 8,  1],
      [35,  30, 29, 0.62,10,  2], [-34, 28, 27, 0.58, 9,  0],
      [35, -50, 24, 0.55, 8,  1], [-36,-48, 26, 0.58, 9,  2],
    ];

    const trunkGeo8 = new THREE.CylinderGeometry(0.3, 0.5, 1, 9);

    mallornData.forEach(([tx, tz, th, tr, cr, lmi], i) => {
      const gy = groundY(tx, tz);
      // Trunk — pale silver-grey mallorn bark
      const tGeo = new THREE.CylinderGeometry(tr * 0.7, tr, th, 9);
      const tMat = (i % 3 === 0) ? matBark : matBarkPale;
      addMesh(tGeo, tMat, tx, gy + th / 2 - th * 0.15, tz);
      // Canopy — two overlapping spheres for volume
      const lm = leafMats[lmi];
      const c1 = new THREE.SphereGeometry(cr, 10, 7);
      addMesh(c1, lm, tx, gy + th - cr * 0.3, tz);
      const c2 = new THREE.SphereGeometry(cr * 0.72, 10, 7);
      addMesh(c2, leafMats[(lmi + 1) % 3], tx + cr * 0.2, gy + th + cr * 0.35, tz - cr * 0.2);
      // Hanging lamp — small glowing sphere in canopy
      const lampGeo = new THREE.SphereGeometry(0.22, 7, 5);
      addMesh(lampGeo, matLamp, tx + (i % 2 ? 1 : -1) * cr * 0.4, gy + th - 2, tz + (i % 3 === 0 ? 1 : -1) * cr * 0.3);
    });

    // ── The Great Mallorn — tall central tree with flet ───────────────────────
    {
      const gx = 0, gz = -8;
      const gy = groundY(gx, gz);
      const greatH = 45;
      const greatR = 1.6;

      // Main trunk — three stacked cylinders tapering
      const tGeo1 = new THREE.CylinderGeometry(greatR * 0.75, greatR, 18, 9);
      addMesh(tGeo1, matBarkPale, gx, gy + 9, gz);
      const tGeo2 = new THREE.CylinderGeometry(greatR * 0.55, greatR * 0.75, 16, 9);
      addMesh(tGeo2, matBarkPale, gx, gy + 26, gz);
      const tGeo3 = new THREE.CylinderGeometry(greatR * 0.3, greatR * 0.55, 12, 9);
      addMesh(tGeo3, matBarkPale, gx, gy + 40, gz);

      // Flet platform at ~13 units above ground (matches walkable top)
      const fletY = gy + 13;
      const fletGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.4, 12);
      addMesh(fletGeo, matFletWood, gx, fletY + 0.2, gz);
      // Railing posts around flet
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        const px = gx + Math.cos(ang) * 4.2;
        const pz = gz + Math.sin(ang) * 4.2;
        const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
        addMesh(postGeo, matFletWood, px, fletY + 0.8, pz);
      }

      // Spiral stair visible geometry — thin slabs matching the walkables
      const stepData = [
        { x: 3,   z: -5,  yaw: 0.4,  len: 7, yBase: 0.5 + gy },
        { x: 5,   z: -10, yaw: 1.0,  len: 7, yBase: 3.5 + gy },
        { x: 2,   z: -14, yaw: 1.6,  len: 7, yBase: 6.5 + gy },
        { x: -3,  z: -11, yaw: 2.2,  len: 7, yBase: 9.5 + gy },
      ];
      stepData.forEach(s => {
        const sGeo = new THREE.BoxGeometry(2.0, 0.28, s.len);
        const sm = new THREE.Mesh(sGeo, matFletWood);
        sm.position.set(s.x, s.yBase + (s.len * 0.4), s.z);
        sm.rotation.y = s.yaw;
        sm.castShadow = true;
        scene.add(sm);
      });

      // Great canopy — multiple overlapping spheres
      const canopyY = gy + greatH - 8;
      [[0, 0, 14, 0], [8, 3, 10, 1], [-7, 2, 11, 2], [3, 6, 9, 0], [-4, -3, 10, 1]].forEach(([ox, oy, r, lmi]) => {
        const cGeo = new THREE.SphereGeometry(r, 10, 7);
        addMesh(cGeo, leafMats[lmi], gx + ox, canopyY + oy, gz);
      });

      // Great tree lamps — several glowing spheres hung in branches
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const r = 6 + (i % 2) * 3;
        const lGeo = new THREE.SphereGeometry(0.32, 7, 5);
        addMesh(lGeo, matLamp, gx + Math.cos(ang) * r, canopyY - 4 + (i % 3) * 2, gz + Math.sin(ang) * r);
      }

      // Flet torches — four corners of the platform, FX-managed
      const fletTorchOpts = { color: 0xffc050, intensity: 1.1, range: 12 };
      for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI * 2 + Math.PI * 0.25;
        FX.makeTorch(
          gx + Math.cos(ang) * 3.8,
          fletY,
          gz + Math.sin(ang) * 3.8,
          fletTorchOpts
        );
      }
    }

    // ── Path torches — pairs flanking the main path ───────────────────────────
    // One pair at each waypoint transition, set back ~2.5 units either side
    {
      const pathTorchOpts = { color: 0xffaa33, intensity: 0.85, range: 10 };
      const pairs = [
        // [path-centre-x, path-centre-z, side-offset-along-X]
        [  0,  48,  2.5 ],   // entrance
        [  0,  28,  2.5 ],
        [ -8,  10,  2.5 ],
        [-12, -10,  2.5 ],
      ];
      pairs.forEach(([px, pz, off]) => {
        FX.makeTorch( px + off, groundY(px + off, pz), pz, pathTorchOpts);
        FX.makeTorch( px - off, groundY(px - off, pz), pz, pathTorchOpts);
      });
    }

    // ── City gate torches — tall pair flanking the +Z entrance ───────────────
    {
      const gateOpts = { color: 0xffb040, intensity: 1.3, range: 14 };
      FX.makeTorch(  5, groundY( 5, 62), 62, gateOpts);
      FX.makeTorch( -5, groundY(-5, 62), 62, gateOpts);
    }

    // ── Mirror of Galadriel glade ─────────────────────────────────────────────
    {
      const mx = -10, mz = -22;
      const mgy = groundY(mx, mz);

      // Pedestal — stack of cylinders
      const pedBase = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 9);
      addMesh(pedBase, matMirrorBasin, mx, mgy + 0.2, mz);
      const pedMid = new THREE.CylinderGeometry(0.55, 0.7, 1.0, 9);
      addMesh(pedMid, matMirrorBasin, mx, mgy + 0.9, mz);
      const pedCup = new THREE.CylinderGeometry(1.0, 0.55, 0.35, 9);
      addMesh(pedCup, matSilver, mx, mgy + 1.57, mz);

      // Water surface — slightly concave disc
      const waterGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.06, 24);
      addMesh(waterGeo, matMirrorWater, mx, mgy + 1.72, mz);
      refs.mirrorWater = scene.children[scene.children.length - 1];

      // Blue-white magical glow above the mirror — proximity-reactive, kept in refs
      refs.mirrorLight = new THREE.PointLight(0xa0c8e8, 1.6, 14);
      refs.mirrorLight.position.set(mx, mgy + 3, mz);
      scene.add(refs.mirrorLight);

      // Glade torches — three silver-flame torches around the mirror pedestal;
      // slightly cooler colour to evoke elven light rather than common fire
      const gladeTorchOpts = { color: 0xc8d8ff, intensity: 0.75, range: 9 };
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + Math.PI * 0.5;
        const tx = mx + Math.cos(ang) * 3.5;
        const tz = mz + Math.sin(ang) * 3.5;
        FX.makeTorch(tx, groundY(tx, tz), tz, gladeTorchOpts);
      }

      // Glade trees — ring of smaller mallorns framing the glade
      const gladeR = 12;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const tx = mx + Math.cos(ang) * gladeR;
        const tz = mz + Math.sin(ang) * gladeR;
        const tgy = groundY(tx, tz);
        const th = 14 + (i % 3) * 3;
        const tGeo = new THREE.CylinderGeometry(0.35, 0.5, th, 9);
        addMesh(tGeo, matBarkPale, tx, tgy + th / 2 - th * 0.12, tz);
        const cGeo = new THREE.SphereGeometry(5 + (i % 2), 10, 7);
        addMesh(cGeo, leafMats[i % 3], tx, tgy + th - 1, tz);
      }

      // Silver ewer beside the mirror
      const ewerGeo = new THREE.CylinderGeometry(0.15, 0.22, 0.55, 9);
      addMesh(ewerGeo, matSilver, mx + 0.9, mgy + 0.38, mz - 0.3);
    }

    // ── Fallen leaves on ground — scattered flat discs ────────────────────────
    {
      const r = rng(42);
      for (let i = 0; i < 120; i++) {
        const lx = (r() - 0.5) * 130;
        const lz = (r() - 0.5) * 130;
        if (Math.abs(lx) > 75 || Math.abs(lz) > 75) continue;
        const lgy = groundY(lx, lz);
        const sz = 0.3 + r() * 0.9;
        const leafGeo = new THREE.CylinderGeometry(sz, sz, 0.04, 6);
        const lMat = leafMats[Math.floor(r() * 3)];
        const m = new THREE.Mesh(leafGeo, lMat);
        m.position.set(lx, lgy + 0.03, lz);
        m.rotation.y = r() * Math.PI * 2;
        scene.add(m);
      }
    }

    // ── Root buttresses around great tree ─────────────────────────────────────
    {
      const gx = 0, gz = -8;
      const gy = groundY(gx, gz);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const rx = gx + Math.cos(ang) * 2.8;
        const rz = gz + Math.sin(ang) * 2.8;
        const rgy = groundY(rx, rz);
        const rootGeo = new THREE.BoxGeometry(0.55, 1.1, 3.2);
        const rm = new THREE.Mesh(rootGeo, matBark);
        rm.position.set(rx, rgy + 0.3, rz);
        rm.rotation.y = ang;
        rm.rotation.z = 0.18;
        rm.castShadow = true;
        scene.add(rm);
      }
    }

    // ── Scattered boulders / mossy stones ─────────────────────────────────────
    {
      const r = rng(77);
      for (let i = 0; i < 22; i++) {
        const bx = (r() - 0.5) * 120;
        const bz = (r() - 0.5) * 120;
        if (Math.abs(bx) > 70 || Math.abs(bz) > 70) continue;
        const bgy = groundY(bx, bz);
        const s = 0.5 + r() * 1.4;
        const bGeo = new THREE.SphereGeometry(s, 10, 7);
        const bMat = (i % 3 === 0) ? MAT.STONE_MOSS : MAT.STONE;
        addMesh(bGeo, bMat, bx, bgy + s * 0.45, bz);
      }
    }

    // ── City wall suggestion — low curved stone sections at perimeter ──────────
    {
      const wallR = 55;
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const wx = Math.cos(ang) * wallR;
        const wz = Math.sin(ang) * wallR;
        const wgy = groundY(wx, wz);
        const wGeo = new THREE.BoxGeometry(5, 2.5, 1.2);
        const wm = new THREE.Mesh(wGeo, MAT.STONE_DARK);
        wm.position.set(wx, wgy + 1.25, wz);
        wm.rotation.y = ang + Math.PI * 0.5;
        wm.castShadow = true;
        wm.receiveShadow = true;
        scene.add(wm);
        // Battlement
        const bGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const bm1 = new THREE.Mesh(bGeo, MAT.STONE_DARK);
        bm1.position.set(wx + Math.cos(ang + Math.PI * 0.5) * 1.5, wgy + 2.9, wz + Math.sin(ang + Math.PI * 0.5) * 1.5);
        scene.add(bm1);
        const bm2 = new THREE.Mesh(bGeo, MAT.STONE_DARK);
        bm2.position.set(wx - Math.cos(ang + Math.PI * 0.5) * 1.5, wgy + 2.9, wz - Math.sin(ang + Math.PI * 0.5) * 1.5);
        scene.add(bm2);
      }
    }

    return refs;
  },

  // ─── onFrame ───────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // Mirror light — slow cool shimmer
    if (refs.mirrorLight) {
      refs.mirrorLight.intensity = 1.4 + Math.sin(t * 1.3 + 1.2) * 0.4;
      // Brighten as player approaches mirror
      const dx = playerPos.x - (-10);
      const dz = playerPos.z - (-22);
      const dist = Math.sqrt(dx * dx + dz * dz);
      const prox = Math.max(0, 1 - dist / 12);
      refs.mirrorLight.intensity += prox * 0.8;
    }
  },
};

window.CarasGaladhon = CarasGaladhon;
