// moriabridge.js — Durin's Bridge, Moria
// Sequence: moriadoors (north, -Z) → cross south (+Z) → lothlorien

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x0a0605,
    fogDensity:       0.024,
    fogType:          'exponential',
    skyColor:         0x060302,
    ambientColor:     0x0d0608,
    ambientIntensity: 1.1,
    moonColor:        0x4a2010,
    moonIntensity:    0.22,
    moonPosition:     { x: 0, y: 60, z: 0 },
    showStars:        false,
    extraLights: [
      // Balrog fire glow from the north (-Z) — the direction they came from
      { color: 0xcc3300, intensity: 0.60, x: 0,   y: 20,  z: -80 },
      // Chasm ember glow from below
      { color: 0x441100, intensity: 0.30, x: 0,   y: -20, z: 0   },
      // Side rim scatter
      { color: 0x7a3a18, intensity: 0.18, x:  40, y: 8,   z: 0   },
      { color: 0x7a3a18, intensity: 0.18, x: -40, y: 8,   z: 0   },
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm = window.api_fbm(x * 0.04, z * 0.04);
    const n2d = window.api_noise2d(x * 0.09, z * 0.09);

    // North ledge: z < -20  (moriadoors side)
    const northLedge = Math.max(0, (-z - 20) * 0.55);
    // South ledge: z > 20   (lothlorien side)
    const southLedge = Math.max(0, (z  - 20) * 0.55);
    const ledge = northLedge + southLedge;

    // Chasm dip in the middle band |z| < 22
    const chasmDip = Math.max(0, 1 - Math.abs(z) / 22) * 30;

    const roughness = (fbm * 0.6 + n2d * 0.4) * 1.8;

    return ledge + roughness - chasmDip;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.07, vz * 0.07);
    const chasmProx = Math.max(0, 1 - Math.abs(vz) / 30);
    const r = lerp(0.08, 0.22, n) + chasmProx * 0.08;
    const g = lerp(0.05, 0.11, n) + chasmProx * 0.02;
    const b = lerp(0.05, 0.10, n);
    return [r, g, b];
  },

  // No visible path ribbon for this location
  onPath: (() => 0),

  // ─── Lore points ─────────────────────────────────────────────────────────────
  // In book order walking south (+Z): moriadoors (-Z) → lothlorien (+Z)
  lorePoints: [
    {
      // Approaching the bridge from Moria — the Fellowship hears the Balrog
      pos:    { x: 2, z: -52 },
      radius: 7,
      text:   '"Doom, doom, doom the drums in the deep... They are coming."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      // North end of the bridge — Gandalf turns to face the Balrog
      pos:    { x: -2, z: -20 },
      radius: 6,
      text:   '"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite:   '— Gandalf the Grey, at the Bridge of Khazad-dûm',
    },
    {
      // Crown of the bridge — the physical span
      pos:    { x: 1, z: 0 },
      radius: 5,
      text:   '"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      // South end — Gandalf falls with the Balrog
      pos:    { x: -1, z: 20 },
      radius: 6,
      text:   '"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      // South ledge — the Fellowship emerges into daylight beyond
      pos:    { x: 2, z: 52 },
      radius: 7,
      text:   '"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start / arrivals ─────────────────────────────────────────────────
  // Direct URL load: spawn on north ledge facing south (into the scene, toward +Z)
  start: { x: 0, z: -60, yaw: Math.PI },

  arrivals: {
    // Coming from moriadoors (north, -Z side): spawn at north ledge, face south
    moriadoors: { x: 0, z: -62, yaw: Math.PI },
    // Coming from lothlorien (south, +Z side): spawn at south ledge, face north
    lothlorien: { x: 0, z:  62, yaw: 0       },
  },

  // ─── Boundary and transitions ────────────────────────────────────────────────
  boundary: 90,

  transitions: [
    {
      trigger: { x: 0, z: -76, radius: 9 },
      to: 'moriadoors',
    },
    {
      trigger: { x: 0, z:  76, radius: 9 },
      to: 'lothlorien',
    },
  ],

  // ─── Walkable elevated surfaces ──────────────────────────────────────────────
  // Bridge runs along Z axis. Width 2.0 — narrow, as in the book.
  // yStart = Y at local -Z end, yEnd = Y at local +Z end.
  // Segments ordered north to south (-Z to +Z).
  walkables: [
    // North ledge approach (moriadoors side)
    { x:0, z:-30, yaw:0, length:16, width:4.0, yStart:3.2, yEnd:3.5 },
    // North ramp up to bridge lip
    { x:0, z:-18, yaw:0, length:10, width:2.5, yStart:3.5, yEnd:6.5 },
    // Bridge span north half — slight bow upward
    { x:0, z: -8, yaw:0, length:14, width:2.0, yStart:6.5, yEnd:7.5 },
    // Bridge crown
    { x:0, z:  0, yaw:0, length: 6, width:2.0, yStart:7.5, yEnd:7.5 },
    // Bridge span south half
    { x:0, z:  8, yaw:0, length:14, width:2.0, yStart:7.5, yEnd:6.5 },
    // South ramp down to ledge
    { x:0, z: 18, yaw:0, length:10, width:2.5, yStart:6.5, yEnd:3.5 },
    // South ledge approach (lothlorien side)
    { x:0, z: 30, yaw:0, length:16, width:4.0, yStart:3.5, yEnd:3.2 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  // Chasm flanks: tight against bridge width (bridge is 2 units wide = ±1 from x=0).
  // Barriers start at x=±1.8 so there is no gap to fall through.
  // Also hard back-walls at cavern edges.
  barriers: [
    // West chasm flank
    { x: -10, z: 0, w: 16, d: 60, yaw: 0 },
    // East chasm flank
    { x:  10, z: 0, w: 16, d: 60, yaw: 0 },
    // North cavern back wall
    { x: 0, z: -87, w: 180, d: 6, yaw: 0 },
    // South cavern back wall
    { x: 0, z:  87, w: 180, d: 6, yaw: 0 },
  ],

  // ─── Scene construction ───────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      chasmFires:  [],
      chasmLights: [],
      balrogGlow:  null,
      balrogFill:  null,
      balrogFire:  null,
      staffTip:    null,
      staffLight:  null,
      time:        0,
    };

    const rnd = (a, b) => a + Math.random() * (b - a);

    // ── Materials ──────────────────────────────────────────────────────────────
    const matBridge = new THREE.MeshStandardMaterial({
      color: 0x1c1410, roughness: 0.93, metalness: 0.05,
    });
    const matKerb = new THREE.MeshStandardMaterial({
      color: 0x141010, roughness: 0.96, metalness: 0.03,
    });
    const matCol = new THREE.MeshStandardMaterial({
      color: 0x1a1614, roughness: 0.90, metalness: 0.06,
    });
    const matFireCore = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 3.5, roughness: 0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xdd1100, emissiveIntensity: 2.0,
      roughness: 0.5, transparent: true, opacity: 0.70,
    });
    const matVoid = new THREE.MeshStandardMaterial({
      color: 0x050202, roughness: 1.0, metalness: 0.0,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE GEOMETRY — narrow stone span, no rails (book-accurate)
    // ═══════════════════════════════════════════════════════════════════════════
    // Matches walkable segments. Width 2.0 on the span, wider on the ramps/ledges.
    const bridgeSegs = [
      { zc: -30, halfLen: 8,  topW: 4.0, sideH: 0.7, yTop: 3.35 },
      { zc: -18, halfLen: 5,  topW: 2.5, sideH: 0.5, yTop: 5.0  },
      { zc:  -8, halfLen: 7,  topW: 2.0, sideH: 0.4, yTop: 7.0  },
      { zc:   0, halfLen: 3,  topW: 2.0, sideH: 0.4, yTop: 7.5  },
      { zc:   8, halfLen: 7,  topW: 2.0, sideH: 0.4, yTop: 7.0  },
      { zc:  18, halfLen: 5,  topW: 2.5, sideH: 0.5, yTop: 5.0  },
      { zc:  30, halfLen: 8,  topW: 4.0, sideH: 0.7, yTop: 3.35 },
    ];

    bridgeSegs.forEach(seg => {
      const len = seg.halfLen * 2;
      // Top slab
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(seg.topW, 0.32, len),
        matBridge
      );
      slab.position.set(0, seg.yTop, seg.zc);
      slab.castShadow = true;
      scene.add(slab);

      // Side kerb strips — only on the narrow span sections
      if (seg.topW <= 2.5) {
        const kGeo = new THREE.BoxGeometry(0.28, seg.sideH, len);
        const kL = new THREE.Mesh(kGeo, matKerb);
        kL.position.set(-(seg.topW / 2 + 0.14), seg.yTop - seg.sideH / 2 + 0.16, seg.zc);
        scene.add(kL);
        const kR = kL.clone();
        kR.position.x *= -1;
        scene.add(kR);
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM VOID GEOMETRY — dark walls and floor filling the abyss
    // ═══════════════════════════════════════════════════════════════════════════
    // West and east chasm walls
    const chasmWallGeo = new THREE.BoxGeometry(20, 70, 52);
    const chasmWL = new THREE.Mesh(chasmWallGeo, matVoid);
    chasmWL.position.set(-14, -28, 0);
    scene.add(chasmWL);
    const chasmWR = chasmWL.clone();
    chasmWR.position.x = 14;
    scene.add(chasmWR);

    // Chasm floor — far below
    const floorGeo = new THREE.BoxGeometry(60, 2, 60);
    const chasmFloor = new THREE.Mesh(floorGeo, matVoid);
    chasmFloor.position.set(0, -58, 0);
    scene.add(chasmFloor);

    // Glowing crack along the chasm floor — ember red
    const crackMat = new THREE.MeshStandardMaterial({
      color: 0x330800, emissive: 0xaa1800, emissiveIntensity: 1.2,
      roughness: 0.7, transparent: true, opacity: 0.7,
    });
    const crackGeo = new THREE.BoxGeometry(1.8, 0.3, 48);
    const crack = new THREE.Mesh(crackGeo, crackMat);
    crack.position.set(0, -57, 0);
    scene.add(crack);

    // ═══════════════════════════════════════════════════════════════════════════
    // CAVERN WALLS, CEILING, BACK WALLS
    // ═══════════════════════════════════════════════════════════════════════════
    const wallH = 75;
    const wallGeoZ = new THREE.BoxGeometry(180, wallH, 5);
    const wallN = new THREE.Mesh(wallGeoZ, matVoid);
    wallN.position.set(0, wallH / 2 - 12, -87);
    scene.add(wallN);
    const wallS = wallN.clone();
    wallS.position.z = 87;
    scene.add(wallS);

    const wallGeoX = new THREE.BoxGeometry(5, wallH, 180);
    const wallE = new THREE.Mesh(wallGeoX, matVoid);
    wallE.position.set(88, wallH / 2 - 12, 0);
    scene.add(wallE);
    const wallW = wallE.clone();
    wallW.position.x = -88;
    scene.add(wallW);

    const ceilGeo = new THREE.BoxGeometry(180, 5, 180);
    const ceil = new THREE.Mesh(ceilGeo, matVoid);
    ceil.position.set(0, 72, 0);
    scene.add(ceil);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH LEDGE — moriadoors side (-Z). Columns, rubble, archway.
    // ═══════════════════════════════════════════════════════════════════════════
    {
      // Ledge platform slab
      const ledgeGeo = new THREE.BoxGeometry(42, 4, 32);
      const ledge = new THREE.Mesh(ledgeGeo, matBridge);
      ledge.position.set(0, groundY(0, -50) + 1.8, -50);
      scene.add(ledge);

      // Columns flanking the bridge mouth on the north ledge
      [[-3.5, -22], [3.5, -22], [-6, -34], [6, -34], [-7, -47], [7, -47]].forEach(([cx, cz]) => {
        const h = rnd(6, 12);
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.65, h, 9),
          matCol
        );
        col.position.set(cx, groundY(cx, cz) + h / 2 - h * 0.25, cz);
        col.rotation.z = rnd(-0.05, 0.05);
        col.castShadow = true;
        scene.add(col);
        // Rubble at base
        const r = rnd(0.25, 0.6);
        const rb = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), MAT.STONE_DARK);
        rb.position.set(cx + rnd(-0.8, 0.8), groundY(cx, cz) + r * 0.45, cz + rnd(-0.8, 0.8));
        scene.add(rb);
      });

      // Arch at bridge mouth (north side) — z = -22
      {
        const gy = groundY(0, -22);
        const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 7, 9), matCol);
        pL.position.set(-2.8, gy + 7 / 2 - 7 * 0.25, -22);
        scene.add(pL);
        const pR = pL.clone(); pR.position.x = 2.8; scene.add(pR);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.5, 0.9), matBridge);
        lintel.position.set(0, gy + 6.2, -22);
        scene.add(lintel);
      }

      // Scattered boulders on north ledge
      for (let i = 0; i < 16; i++) {
        const bx = rnd(-18, 18); const bz = rnd(-72, -35);
        const s = rnd(0.35, 1.3);
        const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), MAT.STONE_DARK);
        b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
        b.castShadow = true;
        scene.add(b);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUTH LEDGE — lothlorien side (+Z). Columns, rubble, archway.
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const ledgeGeo = new THREE.BoxGeometry(42, 4, 32);
      const ledge = new THREE.Mesh(ledgeGeo, matBridge);
      ledge.position.set(0, groundY(0, 50) + 1.8, 50);
      scene.add(ledge);

      [[-3.5, 22], [3.5, 22], [-6, 34], [6, 34], [-7, 47], [7, 47]].forEach(([cx, cz]) => {
        const h = rnd(5, 10);
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.65, h, 9),
          matCol
        );
        col.position.set(cx, groundY(cx, cz) + h / 2 - h * 0.25, cz);
        col.rotation.z = rnd(-0.08, 0.08);
        col.castShadow = true;
        scene.add(col);
      });

      // Arch at bridge mouth (south side) — z = 22
      {
        const gy = groundY(0, 22);
        const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 7, 9), matCol);
        pL.position.set(-2.8, gy + 7 / 2 - 7 * 0.25, 22);
        scene.add(pL);
        const pR = pL.clone(); pR.position.x = 2.8; scene.add(pR);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.5, 0.9), matBridge);
        lintel.position.set(0, gy + 6.2, 22);
        scene.add(lintel);
      }

      for (let i = 0; i < 12; i++) {
        const bx = rnd(-18, 18); const bz = rnd(35, 72);
        const s = rnd(0.35, 1.1);
        const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), MAT.STONE_DARK);
        b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
        b.castShadow = true;
        scene.add(b);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — from the north (-Z), the direction they came from
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bigFireGeo = new THREE.SphereGeometry(3.2, 10, 7);
      const bigFire = new THREE.Mesh(bigFireGeo, matFireOuter.clone());
      bigFire.position.set(0, groundY(0, -74) + 6, -76);
      scene.add(bigFire);
      refs.balrogFire = bigFire;

      const innerGeo = new THREE.SphereGeometry(1.5, 10, 7);
      const inner = new THREE.Mesh(innerGeo, matFireCore);
      inner.position.set(0, groundY(0, -74) + 6.5, -76);
      scene.add(inner);

      // Primary Balrog light — strong pulsing red from north
      const balrogLight = new THREE.PointLight(0xff2200, 2.4, 80);
      balrogLight.position.set(0, 12, -72);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      // Secondary fill — orange, shorter range
      const balrogFill = new THREE.PointLight(0xff6600, 1.1, 55);
      balrogFill.position.set(0, 5, -58);
      scene.add(balrogFill);
      refs.balrogFill = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — flames rising from the deep on both sides
    // ═══════════════════════════════════════════════════════════════════════════
    const chasmFirePos = [
      [-7, -28], [-9, -12], [-8, 8], [-10, 24],
      [ 7,  22], [ 9,   6], [ 8,-14], [ 9,-30],
      // Deep floor fires
      [-2, -6], [2, 10], [0, -18], [1, 4],
    ];

    chasmFirePos.forEach(([fx, fz]) => {
      const baseY = -44 + rnd(-4, 4);
      const outerGeo = new THREE.SphereGeometry(rnd(0.5, 1.0), 8, 6);
      const outer = new THREE.Mesh(outerGeo, matFireOuter.clone());
      outer.position.set(fx, baseY + rnd(1, 3), fz);
      scene.add(outer);
      refs.chasmFires.push(outer);

      const coreGeo = new THREE.SphereGeometry(rnd(0.2, 0.45), 8, 6);
      const core = new THREE.Mesh(coreGeo, matFireCore);
      core.position.set(fx, baseY + rnd(1.5, 3.5), fz);
      scene.add(core);

      const fl = new THREE.PointLight(0xff4400, rnd(0.4, 1.0), rnd(12, 22));
      fl.position.set(fx, baseY + rnd(2, 4), fz);
      scene.add(fl);
      refs.chasmLights.push(fl);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TORCHES on ledges (not on the bridge itself — no rails, no torches)
    // ═══════════════════════════════════════════════════════════════════════════
    [[-5, -35], [5, -35], [-5, -48], [5, -48],
     [-5,  35], [5,  35], [-5,  48], [5,  48]].forEach(([tx, tz]) => {
      const gy = groundY(tx, tz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.0, 7), matCol);
      pole.position.set(tx, gy + 1.0, tz);
      scene.add(pole);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.28, 8), matCol);
      bowl.position.set(tx, gy + 2.14, tz);
      scene.add(bowl);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), matFireCore);
      flame.position.set(tx, gy + 2.42, tz);
      scene.add(flame);
      refs.chasmFires.push(flame);
      const tl = new THREE.PointLight(0xff6622, 0.85, 10);
      tl.position.set(tx, gy + 2.6, tz);
      scene.add(tl);
      refs.chasmLights.push(tl);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GANDALF STAFF — on the bridge crown, facing north to oppose the Balrog
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const staffMat = new THREE.MeshStandardMaterial({
        color: 0x8888aa, roughness: 0.6, metalness: 0.15,
      });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7), staffMat);
      // Placed just north of crown centre, leaning very slightly toward Balrog
      staff.position.set(0.3, 7.5 + 1.6, -0.5);
      staff.rotation.z = 0.04;
      scene.add(staff);

      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff, emissive: 0xaaccff, emissiveIntensity: 3.0, roughness: 0.2,
      });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), tipMat);
      tip.position.set(0.3, 7.5 + 3.25, -0.5);
      scene.add(tip);
      refs.staffTip = tip;

      const staffLight = new THREE.PointLight(0x8899cc, 0.75, 18);
      staffLight.position.copy(tip.position);
      scene.add(staffLight);
      refs.staffLight = staffLight;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RUBBLE near bridge ends
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [rnd(-10,-4), rnd(28,42)], [rnd(4,10), rnd(26,40)],
      [rnd(-10,-4), rnd(-28,-42)],[rnd(4,10), rnd(-27,-40)],
      [rnd(-3, 3),  rnd(44,60)], [rnd(-3, 3), rnd(-44,-60)],
    ].forEach(([rx, rz]) => {
      const s = rnd(0.25, 0.8);
      const rb = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), MAT.STONE_DARK);
      rb.position.set(rx, groundY(rx, rz) + s * 0.45, rz);
      rb.castShadow = true;
      scene.add(rb);
    });

    return refs;
  },

  // ─── Per-frame animation ──────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

    // Chasm fire flicker
    refs.chasmFires.forEach((fire, i) => {
      const f = 0.88 + 0.22 * Math.sin(tt * 4.1 + i * 1.37)
                      + 0.10 * Math.sin(tt * 7.3 + i * 2.61);
      fire.scale.setScalar(f);
    });

    // Chasm light flicker — store base intensities first call
    refs.chasmLights.forEach((light, i) => {
      if (light._base === undefined) light._base = light.intensity;
      const f = 0.75 + 0.32 * Math.sin(tt * 5.7 + i * 2.03)
                      + 0.12 * Math.sin(tt * 11.1 + i * 0.77);
      light.intensity = light._base * f;
    });

    // Balrog glow — slow heaving pulse
    if (refs.balrogGlow) {
      const p = 0.72 + 0.38 * Math.sin(tt * 1.1) + 0.18 * Math.sin(tt * 2.7);
      refs.balrogGlow.intensity = 2.4 * p;
    }
    if (refs.balrogFill) {
      refs.balrogFill.intensity = 1.1 + 0.4 * Math.sin(tt * 1.6 + 0.4);
    }
    if (refs.balrogFire) {
      const bs = 0.88 + 0.18 * Math.sin(tt * 3.0) + 0.09 * Math.sin(tt * 6.5);
      refs.balrogFire.scale.setScalar(bs);
    }

    // Gandalf staff — cool counterpoint flicker
    if (refs.staffTip) {
      refs.staffTip.material.emissiveIntensity = 3.0 * (0.82 + 0.22 * Math.sin(tt * 2.1) + 0.08 * Math.sin(tt * 5.3));
    }
    if (refs.staffLight) {
      refs.staffLight.intensity = 0.75 + 0.28 * Math.sin(tt * 2.0);
    }
  },

};

window.MoriaBridge = MoriaBridge;
