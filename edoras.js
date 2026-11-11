// edoras.js — Edoras, the Golden Hall of Rohan
// Sequence: fangorn <-> edoras <-> helmsdeep

const Edoras = {

  name:     'Edoras',
  subtitle:  'Meduseld · The Golden Hall of Rohan',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0xc8c0a0,
    fogType:          'linear',
    fogNear:          90,
    fogFar:           280,
    skyColor:         0x7aa0c8,
    ambientColor:     0x9090a0,
    ambientIntensity: 1.1,
    moonColor:        0xfff4d0,   // warm afternoon sun
    moonIntensity:    1.6,
    moonPosition:     { x: 60, y: 120, z: -40 },
    showStars:        false,
    extraLights: [
      { color: 0x8aaac8, intensity: 0.35, x: -80, y: 60, z: 80 },
      { color: 0xd4b870, intensity: 0.18, x: 0,   y: -10, z: 30 },
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    const dx = x, dz = z + 20;
    const hillGauss = 14.0 * Math.exp(-(dx*dx + dz*dz) / 450.0);

    const ex = x - 18, ez = z + 12;
    const spur = 3.5 * Math.exp(-(ex*ex + ez*ez) / 180.0);

    const plains  = 0.55 * fbm(x * 0.038, z * 0.038);
    const rolls   = 0.35 * noise(x * 0.09,  z * 0.09);
    const texture = 0.12 * noise(x * 0.28,  z * 0.28);

    const pathDist    = Math.abs(x) + Math.max(0, 2.0 - Math.abs(z - (-9)));
    const pathFlatten = Math.exp(-pathDist * pathDist / 8.0) *
                        Math.exp(-((z+9)*(z+9)) / 400.0) * 0.4;

    return hillGauss + spur + plains + rolls + texture - pathFlatten;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const dx = vx, dz = vz + 20;
    const dHill = Math.sqrt(dx*dx + dz*dz);
    const hillFraction = Math.max(0, 1.0 - dHill / 32.0);
    const heightT = Math.min(1, Math.max(0, (vy - 2.0) / 12.0));

    const n1 = noise2d(vx * 0.07, vz * 0.07);
    const n2 = noise2d(vx * 0.19, vz * 0.19);
    const n3 = noise2d(vx * 0.41, vz * 0.41);

    const grassR = lerp(0.30, 0.42, n1); const grassG = lerp(0.36, 0.46, n1); const grassB = lerp(0.14, 0.20, n2);
    const hillR  = lerp(0.52, 0.62, n2); const hillG  = lerp(0.50, 0.58, n1); const hillB  = lerp(0.16, 0.22, n3);
    const crownR = lerp(0.68, 0.76, n3); const crownG = lerp(0.60, 0.66, n1); const crownB = lerp(0.20, 0.26, n2);
    const rockR  = lerp(0.44, 0.52, n2); const rockG  = lerp(0.40, 0.46, n2); const rockB  = lerp(0.32, 0.36, n3);

    const steepT = Math.min(1, Math.max(0, (vy - 7.0) / 6.0)) * (0.3 + 0.7*n2);

    let r = lerp(grassR, hillR, hillFraction * 0.6 + heightT * 0.4);
    let g = lerp(grassG, hillG, hillFraction * 0.6 + heightT * 0.4);
    let b = lerp(grassB, hillB, hillFraction * 0.6 + heightT * 0.4);

    r = lerp(r, crownR, hillFraction * hillFraction * heightT);
    g = lerp(g, crownG, hillFraction * hillFraction * heightT);
    b = lerp(b, crownB, hillFraction * hillFraction * heightT);

    r = lerp(r, rockR, steepT * 0.45);
    g = lerp(g, rockG, steepT * 0.45);
    b = lerp(b, rockB, steepT * 0.45);

    // Paved causeway strip
    const roadMask = Math.max(0, 1.0 - Math.abs(vx) / 2.5) *
                     (vz > -22 && vz < 4 ? 1 : 0);
    const stoneR = lerp(0.50, 0.58, n3);
    const stoneG = lerp(0.46, 0.52, n2);
    const stoneB = lerp(0.38, 0.44, n1);
    r = lerp(r, stoneR, roadMask * 0.70);
    g = lerp(g, stoneG, roadMask * 0.70);
    b = lerp(b, stoneB, roadMask * 0.70);

    return [r, g, b];
  },

  onPath(x, z) {
    const segs = [
      [[0, 68], [0, 50]],
      [[0, 50], [-4, 35]],
      [[-4, 35], [-2, 20]],
      [[-2, 20], [0, 5]],
      [[0, 5], [0, -20]],
    ];
    const radius = 2.5;
    let minDist = Infinity;
    for (const [[ax, az], [bx, bz]] of segs) {
      const dx = bx - ax, dz = bz - az;
      const len2 = dx*dx + dz*dz;
      let t = ((x - ax)*dx + (z - az)*dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx - x;
      const pz = az + t*dz - z;
      minDist = Math.min(minDist, Math.sqrt(px*px + pz*pz));
    }
    return Math.max(0, 1.0 - minDist / radius);
  },

  // ─── Path ribbon waypoints ──────────────────────────────────────────────────
  pathWaypoints: [
    [  0,  68 ],
    [  0,  50 ],
    [ -4,  35 ],
    [ -2,  20 ],
    [  0,   5 ],
    [  0, -20 ],
  ],

  // ─── Lore points ───────────────────────────────────────────────────────────
  // Narrative order: sighting from afar → weapons demand at the gate →
  // Háma relents and judges the staff no weapon → Théoden in his hall →
  // Gandalf's revelation as the White
  lorePoints: [
    {
      pos:    { x: 0, z: 40 },
      radius: 6,
      text:   '"There stands Meduseld, the house of Éomund\'s son, and it is very great. It seems to me that a light comes from it, as if the sun itself had descended upon the hill."',
      cite:   '— Legolas, The Two Towers, III.6',
    },
    {
      // Outside the gate — Háma demands surrender of weapons
      pos:    { x: 0, z: 3 },
      radius: 5,
      text:   '"You must leave your weapons here, old man, and that staff too."',
      cite:   '— Háma, The Two Towers, III.6',
    },
    {
      // Inside the gate, before the doors — Háma judges the staff no weapon
      pos:    { x: 0, z: -9 },
      radius: 5,
      text:   '"It is not clear to me that the carrying of a staff is a warlike act. The staff in the hand of a wizard may be a help on the road. I will trust to your honour. Keep your staff."',
      cite:   '— Háma, The Two Towers, III.6',
    },
    {
      // Inside the hall — Théoden under Wormtongue's shadow
      pos:    { x: 0, z: -28 },
      radius: 6,
      text:   '"I know you, Gandalf Greyhame. Why should I welcome you, Gandalf Stormcrow? A just anger of the Mark is on you. Lesser men speak your praise, Gandalf, since the downfall of Saruman."',
      cite:   '— Théoden, The Two Towers, III.6',
    },
    {
      // Deep in the hall — Gandalf the White revealed
      pos:    { x: 0, z: -40 },
      radius: 5,
      text:   '"The wise speak only of what they know. I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass."',
      cite:   '— Gandalf, The Two Towers, III.6',
    },
  ],

  // ─── Walkable surfaces ──────────────────────────────────────────────────────
  // No walkable at the outer gate — player walks terrain through it.
  // Paved causeway from inner gate mouth up to hall crown, then the hall terrace.

  walkables: [
    // Lower causeway — z=+4 to z=-10, centre z=-3, length=14
    // yStart (local -Z, world z=+4): terrain+0.5 ≈ 5.1
    // yEnd   (local +Z, world z=-10): terrain+0.5 ≈ 11.6
    { x: 0, z: -3,  yaw: 0, length: 14, width: 4.5, yStart: 5.1,  yEnd: 11.6 },

    // Upper causeway — z=-10 to z=-20, centre z=-15, length=10
    { x: 0, z: -15, yaw: 0, length: 10, width: 4.5, yStart: 11.6, yEnd: 14.5 },

    // Meduseld terrace — z=-20 to z=-42, flat at y=15.5
    { x: 0, z: -31, yaw: 0, length: 22, width: 22,  yStart: 15.5, yEnd: 15.5 },
  ],

  barriers: [],

  // ─── Player start and arrivals ──────────────────────────────────────────────
  start: { x: 0, z: 55, yaw: 0 },   // at +Z end, facing -Z

  arrivals: {
    fangorn:   { x: 0, z: 60, yaw: 0        },  // arriving from +Z, facing -Z
    helmsdeep: { x: 0, z:-60, yaw: Math.PI  },  // arriving from -Z, facing +Z
  },

  // ─── Boundary and transitions ───────────────────────────────────────────────
  boundary: 85,

  transitions: [
    { trigger: { x: 0, z:  72, radius: 8 }, to: 'fangorn'   },
    { trigger: { x: 0, z: -68, radius: 8 }, to: 'helmsdeep' },
  ],

  // ─── Build scene ────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── Materials ─────────────────────────────────────────────────────────
    const mWood       = new THREE.MeshLambertMaterial({ color: 0x5c3e22 });
    const mWoodDark   = new THREE.MeshLambertMaterial({ color: 0x3e2812 });
    const mWoodDS     = new THREE.MeshLambertMaterial({ color: 0x3e2812, side: THREE.DoubleSide });
    const mGold       = new THREE.MeshLambertMaterial({ color: 0xc8a030, emissive: 0x1a0e00, emissiveIntensity: 0.3 });
    const mGoldRoof   = new THREE.MeshLambertMaterial({ color: 0xd4a832, emissive: 0x1a0a00, emissiveIntensity: 0.4 });
    const mThatch     = new THREE.MeshLambertMaterial({ color: 0x8a7030 });
    const mStone      = MAT.STONE;
    const mStoneDark  = MAT.STONE_DARK;
    const mWallExt    = new THREE.MeshLambertMaterial({ color: 0x8a7458 });
    const mWallInt    = new THREE.MeshLambertMaterial({ color: 0x7a6a4a, side: THREE.DoubleSide });
    const mFloorInt   = new THREE.MeshLambertMaterial({ color: 0x5a4830 });
    const mCeilInt    = new THREE.MeshLambertMaterial({ color: 0x4a3a28, side: THREE.DoubleSide });
    const mBanner     = new THREE.MeshLambertMaterial({ color: 0xb04010, side: THREE.DoubleSide });
    const mBannerGold = new THREE.MeshLambertMaterial({ color: 0xd4a800, side: THREE.DoubleSide });

    // ── Palisade ring ─────────────────────────────────────────────────────
    function addPalisadePost(x, z) {
      const h = 3.8 + Math.random() * 0.5;
      const r = 0.18 + Math.random() * 0.06;
      const geo = new THREE.CylinderGeometry(r * 0.6, r, h, 7);
      const mesh = new THREE.Mesh(geo, mWood);
      mesh.position.set(x, groundY(x, z) + h * 0.5 - h * 0.08, z);
      mesh.rotation.y = Math.random() * 0.3 - 0.15;
      scene.add(mesh);
    }

    const palisadeRx = 11, palisadeRz = 13;
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const px = Math.sin(angle) * palisadeRx;
      const pz = Math.cos(angle) * palisadeRz - 10;
      if (pz > -1 && pz < 3 && Math.abs(px) < 5) continue;
      addPalisadePost(px, pz);
    }

    // ── Outer gate — posts and lintel only, no doors (player walks through) ──
    const gateY = groundY(0, 0);
    for (const side of [-1, 1]) {
      const gx = side * 3.0;
      const postH = 5.5;
      const postGeo = new THREE.CylinderGeometry(0.35, 0.42, postH, 9);
      const post = new THREE.Mesh(postGeo, mWood);
      post.position.set(gx, gateY + postH * 0.5 - postH * 0.12, 0);
      scene.add(post);
      const capGeo = new THREE.BoxGeometry(0.9, 0.4, 0.9);
      const cap = new THREE.Mesh(capGeo, mStone);
      cap.position.set(gx, gateY + postH - postH * 0.12 + 0.2, 0);
      scene.add(cap);
    }
    const lintelGeo = new THREE.BoxGeometry(7.0, 0.55, 0.55);
    const lintel = new THREE.Mesh(lintelGeo, mWoodDark);
    lintel.position.set(0, gateY + 5.5 - 5.5 * 0.12 + 0.4, 0);
    scene.add(lintel);

    // ── Guard towers flanking gate ────────────────────────────────────────
    for (const side of [-1, 1]) {
      const tx = side * 5.5, tz = -1.5;
      const tY = groundY(tx, tz);
      const towerH = 7.0, towerR = 1.6;
      const towerGeo = new THREE.CylinderGeometry(towerR * 0.9, towerR, towerH, 9);
      const tower = new THREE.Mesh(towerGeo, mStone);
      tower.position.set(tx, tY + towerH * 0.5 - towerH * 0.12, tz);
      scene.add(tower);
      for (let m = 0; m < 7; m++) {
        const ma = (m / 7) * Math.PI * 2;
        const mx = tx + Math.sin(ma) * towerR * 0.85;
        const mz = tz + Math.cos(ma) * towerR * 0.85;
        const merGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
        const mer = new THREE.Mesh(merGeo, mStone);
        mer.position.set(mx, tY + towerH - towerH * 0.12 + 0.4, mz);
        scene.add(mer);
      }
      FX.makeTorch(tx + side * 0.6, tY + towerH - towerH * 0.12 - 0.5, tz, {
        color: 0xff9944, intensity: 1.2, range: 12, castShadow: false,
      });
    }

    // ── Paved causeway flagstones and balustrade ───────────────────────────
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const sz = 4 - t * 24;
      const sy = groundY(0, sz) + 0.3;
      const jx = (Math.random() - 0.5) * 0.3;
      const jy = (Math.random() - 0.5) * 0.08;
      const slabGeo = new THREE.BoxGeometry(4.2, 0.28, 1.6);
      const slab = new THREE.Mesh(slabGeo, mStone);
      slab.position.set(jx, sy + jy, sz);
      scene.add(slab);
    }
    for (let i = 0; i < 20; i++) {
      const bz = 3 - (i / 19) * 23;
      for (const side of [-1, 1]) {
        const bx = side * 2.6;
        const bpostH = 1.3;
        const bpostGeo = new THREE.CylinderGeometry(0.1, 0.13, bpostH, 7);
        const bpost = new THREE.Mesh(bpostGeo, mStone);
        bpost.position.set(bx, groundY(bx, bz) + bpostH * 0.5 + 0.3, bz);
        scene.add(bpost);
      }
    }

    // ── Meduseld — The Golden Hall ────────────────────────────────────────
    const hallX  = 0,   hallZ  = -30;
    const wallH  = 6.0, wallW  = 16,  wallD = 28;
    const wallT  = 0.5; // wall thickness
    const hallFloor = groundY(hallX, hallZ) + 1.5;

    // doorZ: south face of hall (player-facing side)
    const doorZ = hallZ + wallD / 2;   // = -16

    // Door opening dimensions
    const doorOpenW = 4.8, doorOpenH = 5.0;

    // ── Plinth ────────────────────────────────────────────────────────────
    const plinthGeo = new THREE.BoxGeometry(20, 1.5, 32);
    const plinth = new THREE.Mesh(plinthGeo, mStone);
    plinth.position.set(hallX, hallFloor - 0.5, hallZ);
    scene.add(plinth);

    // ── Exterior walls — south face has door opening, built from panels ───
    // South face: left panel, right panel, above-door panel
    const panelSideW = (wallW - doorOpenW) / 2;   // 5.6
    const panelAboveH = wallH - doorOpenH;          // 1.0

    // Left exterior panel
    {
      const geo = new THREE.BoxGeometry(panelSideW, wallH, wallT);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX - doorOpenW / 2 - panelSideW / 2, hallFloor + wallH / 2, doorZ);
      scene.add(m);
    }
    // Right exterior panel
    {
      const geo = new THREE.BoxGeometry(panelSideW, wallH, wallT);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX + doorOpenW / 2 + panelSideW / 2, hallFloor + wallH / 2, doorZ);
      scene.add(m);
    }
    // Above-door panel
    {
      const geo = new THREE.BoxGeometry(doorOpenW, panelAboveH, wallT);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX, hallFloor + doorOpenH + panelAboveH / 2, doorZ);
      scene.add(m);
    }

    // North wall (back), east wall, west wall — solid exterior boxes
    // North wall
    {
      const geo = new THREE.BoxGeometry(wallW, wallH, wallT);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX, hallFloor + wallH / 2, hallZ - wallD / 2);
      scene.add(m);
    }
    // East wall
    {
      const geo = new THREE.BoxGeometry(wallT, wallH, wallD);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX + wallW / 2, hallFloor + wallH / 2, hallZ);
      scene.add(m);
    }
    // West wall
    {
      const geo = new THREE.BoxGeometry(wallT, wallH, wallD);
      const m = new THREE.Mesh(geo, mWallExt);
      m.position.set(hallX - wallW / 2, hallFloor + wallH / 2, hallZ);
      scene.add(m);
    }

    // ── Interior surfaces (DoubleSide) ────────────────────────────────────
    // South interior face — same panelled layout as exterior
    {
      const geo = new THREE.BoxGeometry(panelSideW, wallH, wallT);
      const mL = new THREE.Mesh(geo, mWallInt);
      mL.position.set(hallX - doorOpenW / 2 - panelSideW / 2, hallFloor + wallH / 2, doorZ - wallT);
      scene.add(mL);
      const mR = new THREE.Mesh(geo, mWallInt);
      mR.position.set(hallX + doorOpenW / 2 + panelSideW / 2, hallFloor + wallH / 2, doorZ - wallT);
      scene.add(mR);
    }
    {
      const geo = new THREE.BoxGeometry(doorOpenW, panelAboveH, wallT);
      const m = new THREE.Mesh(geo, mWallInt);
      m.position.set(hallX, hallFloor + doorOpenH + panelAboveH / 2, doorZ - wallT);
      scene.add(m);
    }
    // North interior wall
    {
      const geo = new THREE.BoxGeometry(wallW, wallH, wallT);
      const m = new THREE.Mesh(geo, mWallInt);
      m.position.set(hallX, hallFloor + wallH / 2, hallZ - wallD / 2 + wallT);
      scene.add(m);
    }
    // East interior wall
    {
      const geo = new THREE.BoxGeometry(wallT, wallH, wallD);
      const m = new THREE.Mesh(geo, mWallInt);
      m.position.set(hallX + wallW / 2 - wallT, hallFloor + wallH / 2, hallZ);
      scene.add(m);
    }
    // West interior wall
    {
      const geo = new THREE.BoxGeometry(wallT, wallH, wallD);
      const m = new THREE.Mesh(geo, mWallInt);
      m.position.set(hallX - wallW / 2 + wallT, hallFloor + wallH / 2, hallZ);
      scene.add(m);
    }
    // Interior floor
    {
      const geo = new THREE.BoxGeometry(wallW - wallT * 2, 0.15, wallD);
      const m = new THREE.Mesh(geo, mFloorInt);
      m.position.set(hallX, hallFloor + 0.07, hallZ);
      scene.add(m);
    }
    // Ceiling (DoubleSide so player sees it from below)
    {
      const geo = new THREE.BoxGeometry(wallW - wallT * 2, 0.2, wallD);
      const m = new THREE.Mesh(geo, mCeilInt);
      m.position.set(hallX, hallFloor + wallH - 0.1, hallZ);
      scene.add(m);
    }

    // ── Interior columns — two rows of timber posts ───────────────────────
    for (const cz of [-22, -30, -38]) {
      for (const side of [-1, 1]) {
        const cx = side * 4.5;
        const colH = wallH - 0.3;
        const colGeo = new THREE.CylinderGeometry(0.3, 0.38, colH, 9);
        const col = new THREE.Mesh(colGeo, mWoodDark);
        col.position.set(cx, hallFloor + colH / 2, cz);
        scene.add(col);
        // Capital — small decorative block at top
        const capGeo = new THREE.BoxGeometry(0.9, 0.3, 0.9);
        const cap = new THREE.Mesh(capGeo, mGold);
        cap.position.set(cx, hallFloor + colH, cz);
        scene.add(cap);
      }
    }

    // ── Central hearth ────────────────────────────────────────────────────
    // Stone ring with fire at the heart of the hall
    const hearthZ = -30;
    const hearthY = hallFloor + 0.15;
    for (let i = 0; i < 10; i++) {
      const ha = (i / 10) * Math.PI * 2;
      const hr = 1.4;
      const stoneGeo = new THREE.SphereGeometry(0.28, 8, 6);
      const stone = new THREE.Mesh(stoneGeo, mStone);
      stone.position.set(
        hallX + Math.sin(ha) * hr,
        hearthY + 0.14,
        hearthZ + Math.cos(ha) * hr
      );
      scene.add(stone);
    }
    FX.makeFire(hallX, hearthY, hearthZ, {
      color: 0xff7020, intensity: 2.8, range: 16,
      flameScale: 0.9, emberCount: 60, emberSize: 0.07,
      castShadow: true,
    });

    // ── Throne dais — at the far end of the hall ──────────────────────────
    const throneZ = hallZ - wallD / 2 + 3.5;  // near north wall
    const daisH = 0.6, daisW = 6, daisD = 2.8;
    const daisGeo = new THREE.BoxGeometry(daisW, daisH, daisD);
    const dais = new THREE.Mesh(daisGeo, mStone);
    dais.position.set(hallX, hallFloor + daisH / 2, throneZ + daisD / 2);
    scene.add(dais);

    // Throne — high-backed chair
    const seatH = 0.5, seatW = 1.6, seatD = 1.4;
    const seatGeo = new THREE.BoxGeometry(seatW, seatH, seatD);
    const seat = new THREE.Mesh(seatGeo, mWoodDark);
    seat.position.set(hallX, hallFloor + daisH + seatH / 2, throneZ + 1.0);
    scene.add(seat);
    // Back
    const backGeo = new THREE.BoxGeometry(seatW, 2.4, 0.2);
    const back = new THREE.Mesh(backGeo, mWoodDark);
    back.position.set(hallX, hallFloor + daisH + seatH + 1.2, throneZ + 1.65);
    scene.add(back);
    // Arms
    for (const side of [-1, 1]) {
      const armGeo = new THREE.BoxGeometry(0.18, 0.5, seatD);
      const arm = new THREE.Mesh(armGeo, mWoodDark);
      arm.position.set(hallX + side * (seatW / 2 - 0.09), hallFloor + daisH + seatH + 0.25, throneZ + 1.0);
      scene.add(arm);
    }
    // Gold finials on throne back
    for (const side of [-1, 1]) {
      const finGeo = new THREE.SphereGeometry(0.14, 7, 5);
      const fin = new THREE.Mesh(finGeo, mGold);
      fin.position.set(hallX + side * seatW / 2, hallFloor + daisH + seatH + 2.4 + 0.14, throneZ + 1.65);
      scene.add(fin);
    }

    // ── Interior wall torches ─────────────────────────────────────────────
    for (const tz of [-22, -38]) {
      for (const side of [-1, 1]) {
        FX.makeTorch(hallX + side * (wallW / 2 - 0.9), hallFloor, tz, {
          color: 0xffaa55, intensity: 1.0, range: 10, castShadow: false,
        });
      }
    }

    // ── Roof ──────────────────────────────────────────────────────────────
    const roofBaseW = 19, roofRidgeW = 3, roofH = 5.0, roofD = 30;
    const roofVerts = new Float32Array([
      -roofBaseW/2, 0,      -roofD/2,
       roofBaseW/2, 0,      -roofD/2,
       roofBaseW/2, 0,       roofD/2,
      -roofBaseW/2, 0,       roofD/2,
      -roofRidgeW/2, roofH, -roofD/2,
       roofRidgeW/2, roofH, -roofD/2,
       roofRidgeW/2, roofH,  roofD/2,
      -roofRidgeW/2, roofH,  roofD/2,
    ]);
    const roofIdx = [
      0,1,5, 0,5,4,   // south gable
      3,7,6, 3,6,2,   // north gable
      1,2,6, 1,6,5,   // east slope
      0,4,7, 0,7,3,   // west slope
      4,5,6, 4,6,7,   // ridge cap
    ];
    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVerts, 3));
    roofGeo.setIndex(roofIdx);
    roofGeo.computeVertexNormals();
    const roof = new THREE.Mesh(roofGeo, mGoldRoof);
    roof.position.set(hallX, hallFloor + wallH, hallZ);
    scene.add(roof);

    // Ridgepole
    const ridgeGeo = new THREE.CylinderGeometry(0.22, 0.22, roofD + 2, 7);
    ridgeGeo.rotateX(Math.PI / 2);
    const ridge = new THREE.Mesh(ridgeGeo, mWoodDark);
    ridge.position.set(hallX, hallFloor + wallH + roofH + 0.1, hallZ);
    scene.add(ridge);

    // Gable finials
    for (const side of [-1, 1]) {
      const fz = hallZ + side * (roofD / 2 + 0.5);
      const finGeo = new THREE.SphereGeometry(0.5, 8, 6);
      const fin = new THREE.Mesh(finGeo, mGold);
      fin.position.set(hallX, hallFloor + wallH + roofH + 0.3, fz);
      scene.add(fin);
      const neckGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.2, 7);
      const neck = new THREE.Mesh(neckGeo, mGold);
      neck.position.set(hallX, hallFloor + wallH + roofH - 0.4, fz);
      neck.rotation.x = side * Math.PI * 0.15;
      scene.add(neck);
    }

    // Corner posts
    for (const [cx, cz] of [[-7,-16],[7,-16],[-7,-44],[7,-44]]) {
      const cpH = wallH + 1.5;
      const cpGeo = new THREE.CylinderGeometry(0.5, 0.6, cpH, 9);
      const cp = new THREE.Mesh(cpGeo, mWoodDark);
      cp.position.set(cx, hallFloor + cpH / 2, cz);
      scene.add(cp);
    }

    // ── Front steps ───────────────────────────────────────────────────────
    for (let s = 0; s < 3; s++) {
      const stepGeo = new THREE.BoxGeometry(8 - s * 0.8, 0.35, 0.9);
      const step = new THREE.Mesh(stepGeo, mStone);
      step.position.set(hallX, hallFloor - 0.35 * (3 - s) + 0.175, doorZ + (3 - s) * 0.9);
      scene.add(step);
    }

    // ── Animated hall doors ───────────────────────────────────────────────
    // Each door rotates around its hinge edge.
    // The pivot group is placed at the hinge (outer edge of door panel).
    // The door mesh is offset within the group so the hinge edge is at local x=0.
    // Open: pivot.rotation.y = ±openAngle (swings into hall, toward -Z)
    // Closed: pivot.rotation.y = 0

    const doorW = 2.3, doorH2 = doorOpenH, doorThk = 0.22;
    const openAngle = 1.25; // radians — swings door flush with side wall

    const doorPivots = [];

    for (const side of [-1, 1]) {
      // Hinge x: at the outer edge of the door opening
      const hingeX = side * (doorOpenW / 2);

      // Pivot group — positioned at hinge, at floor level
      const pivot = new THREE.Group();
      pivot.position.set(hingeX, hallFloor, doorZ);
      scene.add(pivot);
      doorPivots.push({ pivot, side });

      // Door mesh within pivot — hinge at local x=0, door extends inward (toward -side)
      const doorGeo = new THREE.BoxGeometry(doorW, doorH2, doorThk);
      const doorMesh = new THREE.Mesh(doorGeo, mWoodDS);
      // Offset so hinge edge sits at local x=0: centre is half-width away from hinge
      doorMesh.position.set(-side * doorW / 2, doorH2 / 2, 0);
      pivot.add(doorMesh);

      // Horizontal plank lines on door face
      for (let b = 0.4; b < doorH2 - 0.4; b += 0.65) {
        const plankGeo = new THREE.BoxGeometry(doorW + 0.02, 0.07, doorThk + 0.04);
        const plank = new THREE.Mesh(plankGeo, mWoodDark);
        plank.position.set(-side * doorW / 2, b, 0);
        pivot.add(plank);
      }

      // Door ring handle
      const ringGeo = new THREE.TorusGeometry(0.16, 0.035, 6, 10);
      const ring = new THREE.Mesh(ringGeo, mGold);
      ring.position.set(-side * (doorW - 0.35), doorH2 / 2, doorThk / 2 + 0.04);
      ring.rotation.y = Math.PI / 2;
      pivot.add(ring);
    }

    // ── Exterior torches flanking Meduseld doors ──────────────────────────
    for (const side of [-1, 1]) {
      FX.makeTorch(hallX + side * 4.2, hallFloor, doorZ + 0.5, {
        color: 0xffaa44, intensity: 1.1, range: 14, castShadow: true,
      });
    }

    // ── Interior light — warm glow from the hearth fire ───────────────────
    const hallLight = new THREE.PointLight(0xffcc66, 1.6, 22);
    hallLight.position.set(hallX, hallFloor + 2.5, hearthZ);
    scene.add(hallLight);

    // ── Banners flanking causeway ─────────────────────────────────────────
    function addBanner(x, z) {
      const poleH = 7.5;
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, poleH, 7);
      const pole = new THREE.Mesh(poleGeo, mWoodDark);
      pole.position.set(x, groundY(x, z) + poleH / 2, z);
      scene.add(pole);
      const bannerW = 1.4, bannerH = 2.2;
      const bannerGeo = new THREE.PlaneGeometry(bannerW, bannerH, 3, 1);
      const banner = new THREE.Mesh(bannerGeo, mBanner);
      banner.position.set(x + bannerW / 2, groundY(x, z) + poleH - bannerH / 2 - 0.3, z);
      scene.add(banner);
      const borderGeo = new THREE.PlaneGeometry(bannerW + 0.08, bannerH + 0.08);
      const border = new THREE.Mesh(borderGeo, mBannerGold);
      border.position.set(x + bannerW / 2, groundY(x, z) + poleH - bannerH / 2 - 0.3, z - 0.02);
      scene.add(border);
    }

    addBanner(-3.8, -6);  addBanner( 3.8, -6);
    addBanner(-3.8, -13); addBanner( 3.8, -13);
    addBanner(-4.5, doorZ + 4); addBanner( 4.5, doorZ + 4);

    // ── Town longhouses ───────────────────────────────────────────────────
    function addLonghouse(x, z, angle, len, wid) {
      const hy = groundY(x, z);
      const houseGeo = new THREE.BoxGeometry(wid, 3.0, len);
      const houseMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });
      const house = new THREE.Mesh(houseGeo, houseMat);
      house.position.set(x, hy + 1.5, z);
      house.rotation.y = angle;
      scene.add(house);
      const thatchGeo = new THREE.BoxGeometry(wid + 0.6, 1.6, len + 0.6);
      const thatch = new THREE.Mesh(thatchGeo, mThatch);
      thatch.position.set(x, hy + 3.0 + 0.7, z);
      thatch.rotation.y = angle;
      scene.add(thatch);
    }

    addLonghouse(-7,  -7,  0.3, 8, 3.5);
    addLonghouse( 7,  -6, -0.2, 7, 3.2);
    addLonghouse(-8, -16,  0.1, 9, 3.8);
    addLonghouse( 8, -15,  0.0, 6, 3.0);
    addLonghouse(-6, -24,  0.4, 7, 3.3);
    addLonghouse( 7, -22, -0.3, 8, 3.5);

    // ── Burial mounds ─────────────────────────────────────────────────────
    function addMound(x, z, r, h) {
      const moundGeo = new THREE.SphereGeometry(r, 12, 8);
      const moundMat = new THREE.MeshLambertMaterial({ color: 0x556040 });
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.scale.set(1, h / r, 1);
      mound.position.set(x, groundY(x, z) + h * 0.45, z);
      scene.add(mound);
    }

    addMound( 25, 30, 5.5, 2.8); addMound( 32, 18, 4.2, 2.1);
    addMound( 28,  5, 4.8, 2.4); addMound( 22, -5, 3.8, 1.9);
    addMound(-26, 22, 4.5, 2.2); addMound(-30, 10, 5.0, 2.5);

    // ── Grass tufts ───────────────────────────────────────────────────────
    for (let i = 0; i < 60; i++) {
      const gx = (Math.random() - 0.5) * 160;
      const gz = Math.random() * 80 + 10;
      if (Math.abs(gx) < 6 && gz < 60) continue;
      const gy = groundY(gx, gz);
      const tH = 0.6 + Math.random() * 0.9;
      const tGeo = new THREE.CylinderGeometry(0.05, 0.12, tH, 5);
      const tMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(0.55 + Math.random() * 0.15, 0.48 + Math.random() * 0.1, 0.12),
      });
      const tuft = new THREE.Mesh(tGeo, tMat);
      tuft.position.set(gx, gy + tH * 0.4, gz);
      tuft.rotation.z = (Math.random() - 0.5) * 0.4;
      tuft.rotation.x = (Math.random() - 0.5) * 0.3;
      scene.add(tuft);
    }

    // ── Hillside boulders ─────────────────────────────────────────────────
    for (let i = 0; i < 18; i++) {
      const bx = (Math.random() - 0.5) * 30 + (Math.random() > 0.5 ? 10 : -10);
      const bz = Math.random() * 40 - 25;
      const br = 0.4 + Math.random() * 0.9;
      const bGeo = new THREE.SphereGeometry(br, 10, 7);
      const bMat = Math.random() > 0.4 ? mStone : mStoneDark;
      const boulder = new THREE.Mesh(bGeo, bMat);
      boulder.position.set(bx, groundY(bx, bz) + br * 0.45, bz);
      boulder.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
      scene.add(boulder);
    }

    // ── Fangorn tree-line ─────────────────────────────────────────────────
    for (let i = 0; i < 22; i++) {
      const tx = (Math.random() - 0.5) * 180;
      const tz = 65 + Math.random() * 12;
      const ty = groundY(tx, tz);
      const treeH = 5 + Math.random() * 7;
      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, treeH, 7);
      const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x2a2015 }));
      trunk.position.set(tx, ty + treeH / 2, tz);
      scene.add(trunk);
      const crownR = 2.0 + Math.random() * 2.5;
      const crownGeo = new THREE.SphereGeometry(crownR, 8, 6);
      const crown = new THREE.Mesh(crownGeo, new THREE.MeshLambertMaterial({ color: 0x1e2a10 }));
      crown.position.set(tx, ty + treeH + crownR * 0.5, tz);
      scene.add(crown);
    }

    // ── Clouds ────────────────────────────────────────────────────────────
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf4f0e8, transparent: true, opacity: 0.82 });
    for (const [cx, cy, cz] of [[-60,55,-40],[40,50,-55],[-30,60,20],[70,48,30],[-80,52,55]]) {
      for (let p = 0; p < 3 + Math.floor(Math.random() * 3); p++) {
        const pr = 5 + Math.random() * 7;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 8, 6), cloudMat);
        puff.position.set(cx + (Math.random()-0.5)*14, cy + (Math.random()-0.5)*4, cz + (Math.random()-0.5)*10);
        puff.scale.y = 0.45 + Math.random() * 0.2;
        scene.add(puff);
      }
    }

    return { hallLight, doorPivots, doorZ, openAngle };
  },

  // ─── onFrame ────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // Hearth glow flicker
    if (refs.hallLight) {
      refs.hallLight.intensity = 1.4 + Math.sin(t * 2.1) * 0.14 + Math.sin(t * 3.7) * 0.07;
    }

    // Animate hall doors: open when player approaches within 10 units of doorZ
    if (refs.doorPivots) {
      const dz = refs.doorZ;
      const distToDoor = Math.sqrt(
        playerPos.x * playerPos.x + (playerPos.z - dz) * (playerPos.z - dz)
      );
      // Target angle: fully open when within 10 units, closed beyond 14
      const triggerInner = 10, triggerOuter = 14;
      const targetAngle = distToDoor < triggerInner ? refs.openAngle
                        : distToDoor > triggerOuter ? 0
                        : refs.openAngle * (1 - (distToDoor - triggerInner) / (triggerOuter - triggerInner));

      for (const { pivot, side } of refs.doorPivots) {
        // Smooth approach to target — 4 units/s felt speed
        const current = pivot.rotation.y;
        const target  = side * targetAngle;
        const delta   = target - current;
        pivot.rotation.y += delta * Math.min(1, dt * 4);
      }
    }
  },

};

window.Edoras = Edoras;
