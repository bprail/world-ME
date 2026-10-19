// moriabridgeofdurin.js — Durin's Bridge, Moria
// Sequence: moriadoors <-> moriabridge <-> lothlorien

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x0a0608,
    fogDensity:       0.022,
    fogType:          'exponential',
    skyColor:         0x060304,
    ambientColor:     0x0d0608,
    ambientIntensity: 1.2,
    moonColor:        0x4a2010,   // deep orange-red: firelight tint from chasm
    moonIntensity:    0.28,
    moonPosition:     { x: 0, y: 60, z: 0 },   // directly above — fills the void
    showStars:        false,      // interior cavern
    extraLights: [
      // Balrog fire glow — warm red from the far end
      { color: 0xcc3300, intensity: 0.55, x: 0,   y: 25,  z: -80 },
      // Chasm ember glow — faint orange from below
      { color: 0x441100, intensity: 0.35, x: 0,   y: -20, z: 0   },
      // Rim scatter — so the bridge sides catch some light
      { color: 0x7a3a18, intensity: 0.20, x: 40,  y: 10,  z: -10 },
      { color: 0x7a3a18, intensity: 0.20, x: -40, y: 10,  z: -10 },
    ],
  },

  // ─── Terrain ───────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm  = window.api_fbm(x * 0.04, z * 0.04);
    const n2d  = window.api_noise2d(x * 0.09, z * 0.09);

    // Two large ledge platforms: south (z > 20) and north (z < -20)
    // The chasm floor sinks sharply in the middle band
    const southLedge = Math.max(0, (z - 20) * 0.55);
    const northLedge = Math.max(0, (-z - 20) * 0.55);
    const ledge = southLedge + northLedge;

    // Chasm dip — terrain drops steeply between z=-20 and z=20
    const chasmDip = Math.max(0, 1 - Math.abs(z) / 22) * 28;

    // Rough cavern floor under each ledge
    const roughness = (fbm * 0.6 + n2d * 0.4) * 1.8;

    return ledge + roughness - chasmDip;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Base: dark basalt grey
    const n = noise2d(vx * 0.07, vz * 0.07);
    // Warm ember tint where terrain is low (the chasm rim gets a reddish cast)
    const chasmProx = Math.max(0, 1 - Math.abs(vz) / 30);
    const r = lerp(0.08, 0.22, n) + chasmProx * 0.08;
    const g = lerp(0.05, 0.11, n) + chasmProx * 0.02;
    const b = lerp(0.05, 0.10, n);
    return [r, g, b];
  },

  onPath(x, z) {
    // Path runs straight along x≈0, from south ledge across the bridge to north ledge
    const distFromCentre = Math.abs(x);
    const onBridgeLane = distFromCentre < 2.0 ? 1 - distFromCentre / 2.0 : 0;
    return onBridgeLane;
  },

  // ─── Path waypoints ────────────────────────────────────────────────────────
  pathWaypoints: [
    [  0,  68 ],   // south start — moriadoors arrival end
    [  0,  40 ],
    [  0,  22 ],   // south rim
    [  0,   0 ],   // bridge midpoint over chasm
    [  0, -22 ],   // north rim
    [  0, -40 ],
    [  0, -68 ],   // north end — lothlorien transition
  ],

  // ─── Lore points ───────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 2, z: 50 },
      radius: 7,
      text:   '"The Bridge of Khazad-dûm! I am a servant of the Secret Fire, wielder of the flame of Anor."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos:    { x: -3, z: 18 },
      radius: 6,
      text:   '"The Bridge was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: 2, z: 0 },
      radius: 6,
      text:   '"Fly, you fools!" — with those words he fell into shadow, and the Fellowship was broken in grief.',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: -2, z: -18 },
      radius: 6,
      text:   '"A Balrog: a demon of the ancient world... a thing of shadow and flame, a Balrog of Morgoth."',
      cite:   '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos:    { x: 3, z: -50 },
      radius: 7,
      text:   '"You cannot pass! I am the wielder of the flame of Anor, and by it I will not let you pass!"',
      cite:   '— Gandalf the Grey, at Durin\'s Bridge',
    },
  ],

  // ─── Player start / arrivals ───────────────────────────────────────────────
  start: { x: 0, z: 60, yaw: Math.PI },   // facing north toward the bridge

  arrivals: {
    moriadoors:  { x: 0, z: 62, yaw: Math.PI         },  // arriving from south (Doors of Durin)
    lothlorien:  { x: 0, z: -62, yaw: 0              },  // arriving from north (Lothlórien)
  },

  // ─── Boundary and transitions ──────────────────────────────────────────────
  boundary: 90,

  transitions: [
    {
      trigger: { x: 0, z: 75, radius: 9 },
      to: 'moriadoors',
    },
    {
      trigger: { x: 0, z: -75, radius: 9 },
      to: 'lothlorien',
    },
  ],

  // ─── Walkable elevated surfaces ────────────────────────────────────────────
  // The bridge itself — a narrow span across the chasm.
  // Five segments: south approach ramp, flat south ledge approach, the true span (three pieces), north side.
  walkables: [
    // South ledge approach — terrain is already elevated; just a gentle raised walkway
    { x:0, z: 30, yaw:0, length:14, width:4.0, yStart:3.2, yEnd:3.5 },

    // South ramp — rises from ledge level up to the bridge lip
    { x:0, z: 18, yaw:0, length:10, width:3.5, yStart:3.5, yEnd:6.0 },

    // Bridge span — southern half (rises very slightly toward centre — old lore says it bows upward)
    { x:0, z:  9, yaw:0, length:14, width:3.0, yStart:6.0, yEnd:7.2 },

    // Bridge crown — the narrow highest point
    { x:0, z:  0, yaw:0, length: 6, width:3.0, yStart:7.2, yEnd:7.2 },

    // Bridge span — northern half (descends from crown)
    { x:0, z: -9, yaw:0, length:14, width:3.0, yStart:7.2, yEnd:6.0 },

    // North ramp — descends to north ledge level
    { x:0, z:-18, yaw:0, length:10, width:3.5, yStart:6.0, yEnd:3.5 },

    // North ledge approach
    { x:0, z:-30, yaw:0, length:14, width:4.0, yStart:3.5, yEnd:3.2 },
  ],

  // ─── Barriers (chasm — no-go zones flanking the bridge) ───────────────────
  barriers: [
    // Chasm left (west) flank — wide region the player cannot enter
    { x: -14, z: 0, w: 20, d: 60, yaw: 0 },
    // Chasm right (east) flank
    { x:  14, z: 0, w: 20, d: 60, yaw: 0 },

    // Hard walls at the far southern cavern edge
    { x: 0, z:  86, w: 180, d: 6, yaw: 0 },
    // Hard walls at the far northern cavern edge
    { x: 0, z: -86, w: 180, d: 6, yaw: 0 },
  ],

  // ─── Scene construction ────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      chasmFires:    [],
      chasmLights:   [],
      bridgeFire:    null,
      bridgeLight:   null,
      balrogGlow:    null,
      time:          0,
    };

    // ── Helper: random in range ──────────────────────────────────────────────
    const rnd = (a, b) => a + Math.random() * (b - a);

    // ── Materials ────────────────────────────────────────────────────────────
    const matBridgeStone = new THREE.MeshStandardMaterial({
      color:     0x1a1210,
      roughness: 0.92,
      metalness: 0.06,
    });
    const matRimStone = new THREE.MeshStandardMaterial({
      color:     0x141010,
      roughness: 0.95,
      metalness: 0.04,
    });
    const matFireCore = new THREE.MeshStandardMaterial({
      color:     0xff6600,
      emissive:  0xff4400,
      emissiveIntensity: 3.5,
      roughness: 0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color:     0xff2200,
      emissive:  0xdd1100,
      emissiveIntensity: 2.0,
      roughness: 0.5,
      transparent: true,
      opacity: 0.72,
    });
    const matEmber = new THREE.MeshStandardMaterial({
      color:     0xffaa00,
      emissive:  0xff8800,
      emissiveIntensity: 1.8,
      roughness: 0.4,
    });
    const matChasm = new THREE.MeshStandardMaterial({
      color:     0x060202,
      roughness: 1.0,
      metalness: 0.0,
    });
    const matGlowRed = new THREE.MeshStandardMaterial({
      color:     0x330800,
      emissive:  0xcc2200,
      emissiveIntensity: 1.4,
      roughness: 0.7,
      transparent: true,
      opacity: 0.6,
    });
    const matColGrey = new THREE.MeshStandardMaterial({
      color:     0x1c1614,
      roughness: 0.88,
      metalness: 0.08,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // THE BRIDGE — narrow stone span across the chasm
    // ═══════════════════════════════════════════════════════════════════════
    const bridgeDef = [
      // { z, halfLen, topW, sideH } — matches walkable segments
      { zc:  30, halfLen: 7,  topW: 4.0, sideH: 0.6, yTop: 3.4  },
      { zc:  18, halfLen: 5,  topW: 3.5, sideH: 0.7, yTop: 5.0  },
      { zc:   9, halfLen: 7,  topW: 3.0, sideH: 0.5, yTop: 6.6  },
      { zc:   0, halfLen: 3,  topW: 3.0, sideH: 0.5, yTop: 7.2  },
      { zc:  -9, halfLen: 7,  topW: 3.0, sideH: 0.5, yTop: 6.6  },
      { zc: -18, halfLen: 5,  topW: 3.5, sideH: 0.7, yTop: 5.0  },
      { zc: -30, halfLen: 7,  topW: 4.0, sideH: 0.6, yTop: 3.4  },
    ];

    bridgeDef.forEach(seg => {
      const len = seg.halfLen * 2;
      // Top surface slab
      const slabGeo = new THREE.BoxGeometry(seg.topW, 0.35, len);
      const slab = new THREE.Mesh(slabGeo, matBridgeStone);
      slab.position.set(0, seg.yTop, seg.zc);
      slab.castShadow = true;
      scene.add(slab);

      // Side kerb left
      const kerbGeo = new THREE.BoxGeometry(0.32, seg.sideH, len);
      const kerbL = new THREE.Mesh(kerbGeo, matRimStone);
      kerbL.position.set(-(seg.topW / 2 + 0.16), seg.yTop - seg.sideH / 2 + 0.18, seg.zc);
      scene.add(kerbL);
      const kerbR = kerbL.clone();
      kerbR.position.x = seg.topW / 2 + 0.16;
      scene.add(kerbR);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CHASM VOID WALLS — tall dark geometry descending below the bridge
    // ═══════════════════════════════════════════════════════════════════════
    // Left chasm wall
    const chasmWallGeo = new THREE.BoxGeometry(18, 60, 56);
    const chasmL = new THREE.Mesh(chasmWallGeo, matChasm);
    chasmL.position.set(-14, -22, 0);
    scene.add(chasmL);
    const chasmR = chasmL.clone();
    chasmR.position.x = 14;
    scene.add(chasmR);

    // Chasm floor — very deep
    const chasmFloorGeo = new THREE.BoxGeometry(60, 2, 60);
    const chasmFloor = new THREE.Mesh(chasmFloorGeo, matChasm);
    chasmFloor.position.set(0, -55, 0);
    scene.add(chasmFloor);

    // Glowing chasm crack along the bottom — faint reddish strip
    const crackGeo = new THREE.BoxGeometry(2.2, 0.4, 52);
    const crack = new THREE.Mesh(crackGeo, matGlowRed);
    crack.position.set(0, -54, 0);
    scene.add(crack);

    // ═══════════════════════════════════════════════════════════════════════
    // CAVERN WALLS — rough back walls bounding the space
    // ═══════════════════════════════════════════════════════════════════════
    const wallH = 70;
    const wallGeo = new THREE.BoxGeometry(180, wallH, 4);
    // South cavern back wall
    const wallS = new THREE.Mesh(wallGeo, matChasm);
    wallS.position.set(0, wallH / 2 - 10, 86);
    scene.add(wallS);
    // North cavern back wall (the gate to Lothlórien lies beyond)
    const wallN = wallS.clone();
    wallN.position.z = -86;
    scene.add(wallN);

    // Side walls — very wide slabs
    const sideWallGeo = new THREE.BoxGeometry(4, wallH, 180);
    const wallE = new THREE.Mesh(sideWallGeo, matChasm);
    wallE.position.set(86, wallH / 2 - 10, 0);
    scene.add(wallE);
    const wallW = wallE.clone();
    wallW.position.x = -86;
    scene.add(wallW);

    // Ceiling slab
    const ceilGeo = new THREE.BoxGeometry(180, 4, 180);
    const ceil = new THREE.Mesh(ceilGeo, matChasm);
    ceil.position.set(0, 68, 0);
    scene.add(ceil);

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTH LEDGE — rocky platform where the Fellowship stands
    // ═══════════════════════════════════════════════════════════════════════
    {
      // Main ledge slab
      const ledgeGeo = new THREE.BoxGeometry(38, 4, 28);
      const ledge = new THREE.Mesh(ledgeGeo, matBridgeStone);
      ledge.position.set(0, groundY(0, 50) + 1.8, 50);
      ledge.castShadow = true;
      scene.add(ledge);

      // Broken columns flanking the bridge entrance — CylinderGeometry, not Box
      const colPositions = [
        [-4.5, 22], [4.5, 22],   // bridge mouth
        [-6,   35], [6,  35],    // mid ledge
        [-7,   48], [7,  48],    // back of ledge
      ];
      colPositions.forEach(([cx, cz]) => {
        const h = rnd(5, 11);
        const geo = new THREE.CylinderGeometry(0.55, 0.70, h, 9);
        const col = new THREE.Mesh(geo, matColGrey);
        const gy = groundY(cx, cz);
        col.position.set(cx, gy + h / 2 - h * 0.25, cz);
        col.rotation.z = rnd(-0.06, 0.06);
        col.castShadow = true;
        scene.add(col);

        // Rubble chunk at base
        const rGeo = new THREE.SphereGeometry(rnd(0.3, 0.7), 8, 6);
        const rb = new THREE.Mesh(rGeo, MAT.STONE);
        rb.position.set(cx + rnd(-1, 1), gy + 0.25, cz + rnd(-1, 1));
        scene.add(rb);
      });

      // Scatter boulders on south ledge
      for (let i = 0; i < 14; i++) {
        const bx = rnd(-16, 16);
        const bz = rnd(36, 70);
        const s  = rnd(0.4, 1.4);
        const geo = new THREE.SphereGeometry(s, 10, 7);
        const b = new THREE.Mesh(geo, MAT.STONE_DARK);
        b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
        b.castShadow = true;
        scene.add(b);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH LEDGE — the far side (Lothlórien passage)
    // ═══════════════════════════════════════════════════════════════════════
    {
      const ledgeGeo = new THREE.BoxGeometry(38, 4, 28);
      const ledge = new THREE.Mesh(ledgeGeo, matBridgeStone);
      ledge.position.set(0, groundY(0, -50) + 1.8, -50);
      ledge.castShadow = true;
      scene.add(ledge);

      // Columns — partially collapsed
      const colPositions = [
        [-4.5, -22], [4.5, -22],
        [-6,   -35], [6,   -35],
        [-7,   -48], [7,   -48],
      ];
      colPositions.forEach(([cx, cz]) => {
        const h = rnd(4, 9);
        const geo = new THREE.CylinderGeometry(0.55, 0.70, h, 9);
        const col = new THREE.Mesh(geo, matColGrey);
        const gy = groundY(cx, cz);
        col.position.set(cx, gy + h / 2 - h * 0.25, cz);
        col.rotation.z = rnd(-0.09, 0.09);
        col.castShadow = true;
        scene.add(col);
      });

      // North ledge boulders
      for (let i = 0; i < 12; i++) {
        const bx = rnd(-16, 16);
        const bz = rnd(-70, -36);
        const s  = rnd(0.4, 1.2);
        const geo = new THREE.SphereGeometry(s, 10, 7);
        const b = new THREE.Mesh(geo, MAT.STONE_DARK);
        b.position.set(bx, groundY(bx, bz) + s * 0.45, bz);
        b.castShadow = true;
        scene.add(b);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHASM FIRES — scattered flame columns rising from the deep
    // ═══════════════════════════════════════════════════════════════════════
    const chasmFirePositions = [
      // Left chasm wall fires
      [-8, -30], [-11, -10], [-9, 10], [-10, 28],
      // Right chasm wall fires
      [ 8,  25], [ 11,  5], [  9,-15], [ 10,-32],
      // Very deep floor fires (barely visible, glow only)
      [-3, -8], [3, 12], [0, -20], [1, 5],
    ];

    chasmFirePositions.forEach(([fx, fz]) => {
      const baseY = -42 + rnd(-4, 4);
      const h = rnd(2.5, 6.0);

      // Outer flame — larger, translucent
      const outerGeo = new THREE.SphereGeometry(rnd(0.6, 1.1), 8, 6);
      const outer = new THREE.Mesh(outerGeo, matFireOuter.clone());
      outer.position.set(fx, baseY + h * 0.5, fz);
      scene.add(outer);

      // Core — bright
      const coreGeo = new THREE.SphereGeometry(rnd(0.25, 0.5), 8, 6);
      const core = new THREE.Mesh(coreGeo, matFireCore);
      core.position.set(fx, baseY + h * 0.6, fz);
      scene.add(core);

      // Point light — animated in onFrame
      const light = new THREE.PointLight(0xff4400, rnd(0.5, 1.1), rnd(14, 24));
      light.position.set(fx, baseY + h * 0.7, fz);
      scene.add(light);

      refs.chasmFires.push(outer);
      refs.chasmLights.push(light);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BRIDGE TORCH FIRES — flanking the bridge on the ledge sides
    // ═══════════════════════════════════════════════════════════════════════
    const torchPositions = [
      // South ledge torches
      [-5.5, 22], [5.5, 22],
      [-5.5, 35], [5.5, 35],
      // North ledge torches
      [-5.5,-22], [5.5,-22],
      [-5.5,-35], [5.5,-35],
    ];

    torchPositions.forEach(([tx, tz]) => {
      const gy = groundY(tx, tz);

      // Torch bracket — thin cylinder
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 2.0, 7);
      const pole = new THREE.Mesh(poleGeo, matColGrey);
      pole.position.set(tx, gy + 1.0, tz);
      scene.add(pole);

      // Bowl
      const bowlGeo = new THREE.CylinderGeometry(0.22, 0.12, 0.3, 8);
      const bowl = new THREE.Mesh(bowlGeo, matColGrey);
      bowl.position.set(tx, gy + 2.15, tz);
      scene.add(bowl);

      // Flame blob
      const flameGeo = new THREE.SphereGeometry(0.18, 8, 6);
      const flame = new THREE.Mesh(flameGeo, matFireCore);
      flame.position.set(tx, gy + 2.45, tz);
      scene.add(flame);
      refs.chasmFires.push(flame);

      // Small point light
      const tl = new THREE.PointLight(0xff6622, 0.9, 10);
      tl.position.set(tx, gy + 2.6, tz);
      scene.add(tl);
      refs.chasmLights.push(tl);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // BALROG APPROACH FIRE — dramatic red glow from the north passage
    // ═══════════════════════════════════════════════════════════════════════
    {
      // A large fire mass behind the north archway (beyond transition)
      const bigFireGeo = new THREE.SphereGeometry(2.8, 10, 7);
      const bigFire = new THREE.Mesh(bigFireGeo, matFireOuter.clone());
      bigFire.position.set(0, groundY(0, -72) + 5, -74);
      scene.add(bigFire);
      refs.bridgeFire = bigFire;

      // Inner core
      const innerGeo = new THREE.SphereGeometry(1.2, 10, 7);
      const inner = new THREE.Mesh(innerGeo, matFireCore);
      inner.position.set(0, groundY(0, -72) + 5.5, -74);
      scene.add(inner);

      // Balrog atmospheric light — strong red from the north
      const balrogLight = new THREE.PointLight(0xff2200, 2.2, 70);
      balrogLight.position.set(0, groundY(0, -72) + 10, -70);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      // Fill light from balrog — secondary orange
      const balrogFill = new THREE.PointLight(0xff6600, 1.0, 50);
      balrogFill.position.set(0, 5, -55);
      scene.add(balrogFill);
      refs.bridgeLight = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GANDALF STAND MARKER — glowing white spot on bridge crown
    // ═══════════════════════════════════════════════════════════════════════
    {
      const staffGeo = new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7);
      const staffMat = new THREE.MeshStandardMaterial({
        color: 0x8888aa,
        roughness: 0.6,
        metalness: 0.15,
      });
      const staff = new THREE.Mesh(staffGeo, staffMat);
      staff.position.set(0.3, 7.2 + 1.6, 0);   // standing on bridge crown
      staff.rotation.z = 0.04;
      scene.add(staff);

      // Staff tip glow
      const tipGeo = new THREE.SphereGeometry(0.13, 8, 6);
      const tipMat = new THREE.MeshStandardMaterial({
        color:    0xddeeff,
        emissive: 0xaaccff,
        emissiveIntensity: 3.0,
        roughness: 0.2,
      });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(0.3, 7.2 + 3.3, 0);
      scene.add(tip);
      refs.staffTip = tip;

      // Soft white light from Gandalf's staff
      const staffLight = new THREE.PointLight(0x8899cc, 0.7, 18);
      staffLight.position.set(0.3, 7.2 + 3.3, 0);
      scene.add(staffLight);
      refs.staffLight = staffLight;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ARCHWAYS — rough stone arches at each ledge entrance to the bridge
    // ═══════════════════════════════════════════════════════════════════════
    const buildArch = (zPos, flip) => {
      const gy = groundY(0, zPos);
      // Left pier
      const pierGeo = new THREE.CylinderGeometry(0.5, 0.65, 6, 9);
      const pierL = new THREE.Mesh(pierGeo, matColGrey);
      pierL.position.set(-3.0, gy + 3 - 6 * 0.25, zPos);
      pierL.castShadow = true;
      scene.add(pierL);
      const pierR = pierL.clone();
      pierR.position.x = 3.0;
      scene.add(pierR);

      // Lintel
      const lintelGeo = new THREE.BoxGeometry(7.5, 0.5, 0.9);
      const lintel = new THREE.Mesh(lintelGeo, matBridgeStone);
      lintel.position.set(0, gy + 5.8, zPos);
      scene.add(lintel);
    };

    buildArch(22, false);
    buildArch(-22, true);

    // ═══════════════════════════════════════════════════════════════════════
    // FALLEN STONE RUBBLE — scattered near bridge ends
    // ═══════════════════════════════════════════════════════════════════════
    const rubbleZones = [
      [rnd(-12,-5), rnd(30,45)],  [rnd(5,13), rnd(28,42)],
      [rnd(-13,-4), rnd(-30,-44)],[rnd(4,12), rnd(-29,-43)],
      [rnd(-3,3),   rnd(42,60)],  [rnd(-3,3), rnd(-43,-60)],
    ];
    rubbleZones.forEach(([rx, rz]) => {
      const s = rnd(0.3, 0.9);
      const geo = new THREE.SphereGeometry(s, 8, 6);
      const rb = new THREE.Mesh(geo, MAT.STONE_DARK);
      rb.position.set(rx, groundY(rx, rz) + s * 0.45, rz);
      rb.castShadow = true;
      scene.add(rb);
    });

    return refs;
  },

  // ─── Per-frame animation ───────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

    // Animate chasm fire blobs — flicker scale and position
    refs.chasmFires.forEach((fire, i) => {
      const flicker = 0.88 + 0.22 * Math.sin(tt * 4.1 + i * 1.37)
                             + 0.10 * Math.sin(tt * 7.3 + i * 2.61);
      fire.scale.setScalar(flicker);
      fire.position.y += Math.sin(tt * 2.3 + i * 1.1) * 0.003;
    });

    // Animate chasm fire lights — intensity flicker
    refs.chasmLights.forEach((light, i) => {
      const base  = light.intensity;
      const flick = 0.80 + 0.28 * Math.sin(tt * 5.7 + i * 2.03)
                         + 0.12 * Math.sin(tt * 11.1 + i * 0.77);
      light.intensity = (base < 1.4 ? 0.6 : 0.6) + flick * (base < 1.4 ? 0.5 : 1.2);
    });

    // Balrog glow — slow heaving pulse (the Balrog stirs)
    if (refs.balrogGlow) {
      const pulse = 0.75 + 0.35 * Math.sin(tt * 1.3)
                        + 0.15 * Math.sin(tt * 2.9);
      refs.balrogGlow.intensity = 2.2 * pulse;
    }
    if (refs.bridgeLight) {
      refs.bridgeLight.intensity = 1.0 + 0.4 * Math.sin(tt * 1.7 + 0.5);
    }
    if (refs.bridgeFire) {
      const bs = 0.90 + 0.18 * Math.sin(tt * 3.1) + 0.09 * Math.sin(tt * 6.7);
      refs.bridgeFire.scale.setScalar(bs);
    }

    // Gandalf staff tip — flickers slightly with cool blue-white light
    if (refs.staffTip) {
      const sf = 0.85 + 0.2 * Math.sin(tt * 2.0) + 0.08 * Math.sin(tt * 5.5);
      refs.staffTip.material.emissiveIntensity = 3.0 * sf;
    }
    if (refs.staffLight) {
      refs.staffLight.intensity = 0.7 + 0.25 * Math.sin(tt * 2.1);
    }
  },

};

window.MoriaBridge = MoriaBridge;
