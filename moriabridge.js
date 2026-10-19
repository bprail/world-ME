// moriabridge.js — Durin's Bridge, Moria
// Sequence: moriadoors (north, -Z) → cross south (+Z) → lothlorien

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x0a0605,
    fogDensity:       0.020,
    fogType:          'exponential',
    skyColor:         0x060302,
    ambientColor:     0x0d0608,
    ambientIntensity: 1.1,
    moonColor:        0x4a2010,
    moonIntensity:    0.22,
    moonPosition:     { x: 0, y: 60, z: 0 },
    showStars:        false,
    extraLights: [
      // Balrog fire glow from the north (-Z)
      { color: 0xcc3300, intensity: 0.60, x: 0,   y: 20,  z: -80 },
      // Chasm ember glow from below
      { color: 0x441100, intensity: 0.30, x: 0,   y: -20, z: 0   },
      // Side rim scatter
      { color: 0x7a3a18, intensity: 0.18, x:  40, y: 8,   z: 0   },
      { color: 0x7a3a18, intensity: 0.18, x: -40, y: 8,   z: 0   },
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  // Ledges rise gently beyond the chasm band. The chasm centre drops sharply.
  hillHeight(x, z) {
    const fbm = window.api_fbm(x * 0.04, z * 0.04);
    const n2d = window.api_noise2d(x * 0.09, z * 0.09);

    const northLedge = Math.max(0, (-z - 20) * 0.55);
    const southLedge = Math.max(0, (z  - 20) * 0.55);
    const ledge      = northLedge + southLedge;
    const chasmDip   = Math.max(0, 1 - Math.abs(z) / 22) * 30;
    const roughness  = (fbm * 0.6 + n2d * 0.4) * 1.8;

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

  onPath: (() => 0),

  // ─── Lore (book order: moriadoors -Z → lothlorien +Z) ───────────────────────
  lorePoints: [
    {
      pos: { x: 2, z: -52 }, radius: 7,
      text: '"Doom, doom, doom the drums in the deep... They are coming."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: -2, z: -20 }, radius: 6,
      text: '"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite: '— Gandalf the Grey, at the Bridge of Khazad-dûm',
    },
    {
      pos: { x: 1, z: 0 }, radius: 5,
      text: '"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: -1, z: 20 }, radius: 6,
      text: '"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: 2, z: 52 }, radius: 7,
      text: '"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start / arrivals ─────────────────────────────────────────────────
  start: { x: 0, z: -55, yaw: Math.PI },

  arrivals: {
    moriadoors: { x: 0, z: -58, yaw: Math.PI },
    lothlorien: { x: 0, z:  58, yaw: 0       },
  },

  // ─── Boundary and transitions ────────────────────────────────────────────────
  boundary: 90,

  transitions: [
    { trigger: { x: 0, z: -72, radius: 9 }, to: 'moriadoors' },
    { trigger: { x: 0, z:  72, radius: 9 }, to: 'lothlorien' },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  // Continuous span: ledge approaches + ramps + crown. Width 1.8 on the span.
  // yStart = Y at local -Z end (north), yEnd = Y at local +Z end (south).
  walkables: [
    // North ledge (moriadoors side)
    { x:0, z:-42, yaw:0, length:20, width:5.0, yStart:3.0, yEnd:3.0 },
    // North ramp up
    { x:0, z:-26, yaw:0, length:12, width:2.4, yStart:3.0, yEnd:7.0 },
    // Crown span — very slightly bowed, treat as flat at 7.0
    { x:0, z:  0, yaw:0, length:40, width:1.8, yStart:7.0, yEnd:7.0 },
    // South ramp down
    { x:0, z: 26, yaw:0, length:12, width:2.4, yStart:7.0, yEnd:3.0 },
    // South ledge (lothlorien side)
    { x:0, z: 42, yaw:0, length:20, width:5.0, yStart:3.0, yEnd:3.0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  // Tight flanks — inner edge at x ± 2.0 (bridge half-width 0.9 + tiny margin)
  barriers: [
    { x: -8,  z: 0,   w: 12, d: 56, yaw: 0 },   // west chasm
    { x:  8,  z: 0,   w: 12, d: 56, yaw: 0 },   // east chasm
    { x:  0,  z: -84, w: 180, d: 6, yaw: 0 },   // north back wall
    { x:  0,  z:  84, w: 180, d: 6, yaw: 0 },   // south back wall
  ],

  // ─── Scene ───────────────────────────────────────────────────────────────────
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
      color: 0x040101, roughness: 1.0, metalness: 0.0,
    });
    const matCrack = new THREE.MeshStandardMaterial({
      color: 0x330800, emissive: 0xaa1800, emissiveIntensity: 1.2,
      roughness: 0.7, transparent: true, opacity: 0.7,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE — built as three continuous meshes: north ramp, crown, south ramp.
    // Each is a single BoxGeometry rotated to slope, so there are no step gaps.
    // ═══════════════════════════════════════════════════════════════════════════

    const BW_SPAN  = 1.8;   // bridge width on the narrow span
    const BW_RAMP  = 2.4;   // slightly wider on approach ramps
    const BW_LEDGE = 5.0;   // ledge platform width
    const BD       = 0.38;  // slab depth (thickness)

    // Helper: place a sloped slab between two endpoints in Z.
    // y0 = surface Y at zStart, y1 = surface Y at zEnd.
    const addSlab = (zStart, zEnd, y0, y1, width) => {
      const dz     = zEnd - zStart;
      const dy     = y1 - y0;
      const len    = Math.sqrt(dz * dz + dy * dy);
      const angle  = Math.atan2(dy, dz);   // pitch about X axis
      const midZ   = (zStart + zEnd) / 2;
      const midY   = (y0 + y1) / 2;

      const geo  = new THREE.BoxGeometry(width, BD, len);
      const mesh = new THREE.Mesh(geo, matBridge);
      mesh.position.set(0, midY, midZ);
      mesh.rotation.x = -angle;            // positive angle pitches south end up
      mesh.castShadow = true;
      scene.add(mesh);
    };

    // North ledge platform — flat, wide
    addSlab(-52, -32, 3.0, 3.0, BW_LEDGE);

    // North ramp — rises from y=3 to y=7 over z=-32 to z=-20
    addSlab(-32, -20, 3.0, 7.0, BW_RAMP);

    // Crown span — flat at y=7, full width of the bridge
    addSlab(-20,  20, 7.0, 7.0, BW_SPAN);

    // South ramp — descends from y=7 to y=3 over z=20 to z=32
    addSlab( 20,  32, 7.0, 3.0, BW_RAMP);

    // South ledge platform — flat, wide
    addSlab( 32,  52, 3.0, 3.0, BW_LEDGE);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM VOID — walls and floor entirely BELOW y=0 so they never clip bridge.
    // Top of chasm side walls sits at y = -1 (just below ground/bridge level).
    // ═══════════════════════════════════════════════════════════════════════════

    // Side chasm walls — tall downward slabs, top at y=-1
    const chasmWallH = 65;
    const chasmWallGeo = new THREE.BoxGeometry(22, chasmWallH, 46);
    const chasmWL = new THREE.Mesh(chasmWallGeo, matVoid);
    chasmWL.position.set(-14, -1 - chasmWallH / 2, 0);
    scene.add(chasmWL);
    const chasmWR = chasmWL.clone();
    chasmWR.position.x = 14;
    scene.add(chasmWR);

    // Chasm floor — far below
    const floorGeo = new THREE.BoxGeometry(60, 2, 60);
    const floor = new THREE.Mesh(floorGeo, matVoid);
    floor.position.set(0, -67, 0);
    scene.add(floor);

    // Glowing crack along the floor
    const crack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 44), matCrack);
    crack.position.set(0, -66, 0);
    scene.add(crack);

    // Thin front-face cap on each wall so there is a clean cliff edge at y=-1
    // (prevents the top face of the wall box being visible above bridge)
    // — handled purely by positioning the wall top at y=-1, well below bridge deck.

    // ═══════════════════════════════════════════════════════════════════════════
    // CAVERN ENCLOSURE — back walls and ceiling pushed well back so they
    // are never in frame at the spawn points (transitions at z=±72).
    // ═══════════════════════════════════════════════════════════════════════════

    const wallH = 90;
    // North back wall at z = -105 (transition trigger is at z = -72)
    const wallGeoZ = new THREE.BoxGeometry(200, wallH, 6);
    const wallN = new THREE.Mesh(wallGeoZ, matVoid);
    wallN.position.set(0, wallH / 2 - 15, -105);
    scene.add(wallN);

    // South back wall at z = +105
    const wallS = wallN.clone();
    wallS.position.z = 105;
    scene.add(wallS);

    // East/west cavern walls
    const wallGeoX = new THREE.BoxGeometry(6, wallH, 220);
    const wallE = new THREE.Mesh(wallGeoX, matVoid);
    wallE.position.set(95, wallH / 2 - 15, 0);
    scene.add(wallE);
    const wallW = wallE.clone();
    wallW.position.x = -95;
    scene.add(wallW);

    // Ceiling — high enough to never intrude on view
    const ceilGeo = new THREE.BoxGeometry(200, 6, 220);
    const ceil = new THREE.Mesh(ceilGeo, matVoid);
    ceil.position.set(0, 82, 0);
    scene.add(ceil);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH LEDGE — moriadoors side: columns, arch, boulders
    // ═══════════════════════════════════════════════════════════════════════════
    [[-3.5, -32], [3.5, -32], [-6, -42], [6, -42], [-7, -52], [7, -52]].forEach(([cx, cz]) => {
      const h = rnd(6, 13);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, h, 9), matCol);
      col.position.set(cx, groundY(cx, cz) + h / 2 - h * 0.25, cz);
      col.rotation.z = rnd(-0.05, 0.05);
      col.castShadow = true;
      scene.add(col);
      const r = rnd(0.25, 0.6);
      const rb = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), MAT.STONE_DARK);
      rb.position.set(cx + rnd(-0.8, 0.8), groundY(cx, cz) + r * 0.45, cz + rnd(-0.8, 0.8));
      scene.add(rb);
    });

    // Arch at north bridge mouth — piers either side of the ramp entry
    {
      const gy = groundY(0, -32);
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 8, 9), matCol);
      pL.position.set(-3.0, gy + 8 / 2 - 8 * 0.25, -32);
      scene.add(pL);
      const pR = pL.clone(); pR.position.x = 3.0; scene.add(pR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.5, 0.9), matBridge);
      lintel.position.set(0, gy + 7.0, -32);
      scene.add(lintel);
    }

    for (let i = 0; i < 16; i++) {
      const bx = rnd(-18, 18); const bz = rnd(-75, -35);
      const s = rnd(0.35, 1.3);
      const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), MAT.STONE_DARK);
      b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
      b.castShadow = true;
      scene.add(b);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUTH LEDGE — lothlorien side: columns, arch, boulders
    // ═══════════════════════════════════════════════════════════════════════════
    [[-3.5, 32], [3.5, 32], [-6, 42], [6, 42], [-7, 52], [7, 52]].forEach(([cx, cz]) => {
      const h = rnd(5, 10);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, h, 9), matCol);
      col.position.set(cx, groundY(cx, cz) + h / 2 - h * 0.25, cz);
      col.rotation.z = rnd(-0.08, 0.08);
      col.castShadow = true;
      scene.add(col);
    });

    {
      const gy = groundY(0, 32);
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 8, 9), matCol);
      pL.position.set(-3.0, gy + 8 / 2 - 8 * 0.25, 32);
      scene.add(pL);
      const pR = pL.clone(); pR.position.x = 3.0; scene.add(pR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.5, 0.9), matBridge);
      lintel.position.set(0, gy + 7.0, 32);
      scene.add(lintel);
    }

    for (let i = 0; i < 12; i++) {
      const bx = rnd(-18, 18); const bz = rnd(35, 75);
      const s = rnd(0.35, 1.1);
      const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 7), MAT.STONE_DARK);
      b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
      b.castShadow = true;
      scene.add(b);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — north (-Z), the pursuit direction
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bigFire = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 7), matFireOuter.clone());
      bigFire.position.set(0, groundY(0, -80) + 6, -82);
      scene.add(bigFire);
      refs.balrogFire = bigFire;

      const inner = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 7), matFireCore);
      inner.position.set(0, groundY(0, -80) + 6.5, -82);
      scene.add(inner);

      const balrogLight = new THREE.PointLight(0xff2200, 2.4, 85);
      balrogLight.position.set(0, 12, -75);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      const balrogFill = new THREE.PointLight(0xff6600, 1.1, 60);
      balrogFill.position.set(0, 5, -60);
      scene.add(balrogFill);
      refs.balrogFill = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — rising from the deep on both flanks
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [-7, -26], [-9, -10], [-8,  8], [-10,  22],
      [ 7,  20], [ 9,   4], [ 8,-16], [  9, -28],
      [-2,  -6], [ 2,  10], [ 0, -18],[  1,   4],
    ].forEach(([fx, fz]) => {
      const baseY = -50 + rnd(-4, 4);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.5, 1.0), 8, 6), matFireOuter.clone());
      outer.position.set(fx, baseY + rnd(1, 3), fz);
      scene.add(outer);
      refs.chasmFires.push(outer);

      const core = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.2, 0.45), 8, 6), matFireCore);
      core.position.set(fx, baseY + rnd(1.5, 3.5), fz);
      scene.add(core);

      const fl = new THREE.PointLight(0xff4400, rnd(0.4, 1.0), rnd(12, 22));
      fl.position.set(fx, baseY + rnd(2, 4), fz);
      scene.add(fl);
      refs.chasmLights.push(fl);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TORCHES — on the ledges only, not on the rail-less bridge span
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [-5, -40], [5, -40], [-5, -52], [5, -52],
      [-5,  40], [5,  40], [-5,  52], [5,  52],
    ].forEach(([tx, tz]) => {
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
    // GANDALF STAFF — bridge crown, facing north toward Balrog
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.6, metalness: 0.15 });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7), staffMat);
      staff.position.set(0.3, 7.0 + 1.6, -0.5);
      staff.rotation.z = 0.04;
      scene.add(staff);

      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff, emissive: 0xaaccff, emissiveIntensity: 3.0, roughness: 0.2,
      });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), tipMat);
      tip.position.set(0.3, 7.0 + 3.25, -0.5);
      scene.add(tip);
      refs.staffTip = tip;

      const staffLight = new THREE.PointLight(0x8899cc, 0.75, 18);
      staffLight.position.copy(tip.position);
      scene.add(staffLight);
      refs.staffLight = staffLight;
    }

    // Scattered rubble near ramp bases
    [
      [rnd(-10,-4), rnd(32,46)], [rnd(4,10), rnd(31,44)],
      [rnd(-10,-4), rnd(-32,-46)],[rnd(4,10), rnd(-31,-44)],
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

    refs.chasmFires.forEach((fire, i) => {
      const f = 0.88 + 0.22 * Math.sin(tt * 4.1 + i * 1.37)
                      + 0.10 * Math.sin(tt * 7.3 + i * 2.61);
      fire.scale.setScalar(f);
    });

    refs.chasmLights.forEach((light, i) => {
      if (light._base === undefined) light._base = light.intensity;
      const f = 0.75 + 0.32 * Math.sin(tt * 5.7 + i * 2.03)
                      + 0.12 * Math.sin(tt * 11.1 + i * 0.77);
      light.intensity = light._base * f;
    });

    if (refs.balrogGlow) {
      const p = 0.72 + 0.38 * Math.sin(tt * 1.1) + 0.18 * Math.sin(tt * 2.7);
      refs.balrogGlow.intensity = 2.4 * p;
    }
    if (refs.balrogFill) {
      refs.balrogFill.intensity = 1.1 + 0.4 * Math.sin(tt * 1.6 + 0.4);
    }
    if (refs.balrogFire) {
      refs.balrogFire.scale.setScalar(0.88 + 0.18 * Math.sin(tt * 3.0) + 0.09 * Math.sin(tt * 6.5));
    }
    if (refs.staffTip) {
      refs.staffTip.material.emissiveIntensity = 3.0 * (0.82 + 0.22 * Math.sin(tt * 2.1) + 0.08 * Math.sin(tt * 5.3));
    }
    if (refs.staffLight) {
      refs.staffLight.intensity = 0.75 + 0.28 * Math.sin(tt * 2.0);
    }
  },

};

window.MoriaBridge = MoriaBridge;
