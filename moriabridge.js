// moriabridge.js — Durin's Bridge, Moria
// Sequence: moriadoors (north, -Z) → cross south (+Z) → lothlorien
//
// Layout (-Z to +Z):
//   moriadoors arrival → NORTH HALL (spawn) → hallway → doorway arch at z≈-50
//                                                        bridge ramp at z≈-33
//                                                        BRIDGE CROWN (arched) z=-20 to +20
//                                                        bridge ramp at z≈+33
//                        narrow east-ledge → [transition +Z lothlorien]

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x0a0605,
    fogDensity:       0.018,
    fogType:          'exponential',
    skyColor:         0x060302,
    ambientColor:     0x100808,
    ambientIntensity: 1.0,
    moonColor:        0x4a2010,
    moonIntensity:    0.18,
    moonPosition:     { x: 0, y: 60, z: 0 },
    showStars:        false,
    extraLights: [
      // Balrog glow from deep north (behind the hall)
      { color: 0xcc3300, intensity: 0.55, x: 0,   y: 20,  z: -120 },
      // Chasm ember up-light
      { color: 0x551100, intensity: 0.28, x: 0,   y: -30, z: 0    },
      // Hall fill — north side where the player spawns
      { color: 0x6a3010, intensity: 0.20, x: 0,   y: 15,  z: -65  },
      // South-side ambient — faint glow near the ledge exit
      { color: 0x441a06, intensity: 0.12, x: 8,   y: 8,   z:  55  },
    ],
  },

  // ─── Terrain — near-flat; all visual structure comes from geometry ───────────
  hillHeight(x, z) {
    const n = window.api_noise2d(x * 0.06, z * 0.06);
    return n * 0.6;   // gentle surface texture only, no dramatic slopes
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    return [ lerp(0.07, 0.14, n), lerp(0.05, 0.09, n), lerp(0.04, 0.08, n) ];
  },

  onPath: (() => 0),

  // ─── Lore (book order: moriadoors north → lothlorien south) ─────────────────
  lorePoints: [
    {
      // Inside the north hall as the player approaches the bridge
      pos: { x: 0, z: -68 }, radius: 8,
      text: '"Doom, doom, doom the drums in the deep... They are coming."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      // North ramp / bridge mouth — Gandalf turns to face the Balrog
      pos: { x: 0, z: -30 }, radius: 6,
      text: '"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite: '— Gandalf the Grey, at the Bridge of Khazad-dûm',
    },
    {
      // Crown of the bridge
      pos: { x: 0, z: 0 }, radius: 5,
      text: '"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      // South ramp — Gandalf falls behind the fleeing Fellowship
      pos: { x: 0, z: 30 }, radius: 6,
      text: '"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      // On the narrow south ledge, walking toward Lothlórien
      pos: { x: 12, z: 45 }, radius: 6,
      text: '"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start / arrivals ─────────────────────────────────────────────────
  // North hall interior, facing south (yaw π = facing +Z)
  start: { x: 0, z: -68, yaw: Math.PI },

  arrivals: {
    // From moriadoors: inside the north hall, facing south toward the bridge
    moriadoors: { x: 0, z: -72, yaw: Math.PI },
    // From lothlorien: at the far (east) end of the narrow south ledge, facing west
    // yaw π*1.5 = facing -X (west), so player walks back toward the bridge
    lothlorien: { x: 22, z: 45, yaw: Math.PI * 1.5 },
  },

  // ─── Boundary ───────────────────────────────────────────────────────────────
  boundary: 110,

  // ─── Transitions ─────────────────────────────────────────────────────────────
  // North: back of the north hall (moriadoors side)
  // South: east end of the narrow south ledge (lothlorien side)
  transitions: [
    { trigger: { x: 0,  z: -82, radius: 7 }, to: 'moriadoors' },
    { trigger: { x: 24, z:  45, radius: 5 }, to: 'lothlorien' },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  walkables: [
    // ── NORTH HALL FLOOR (moriadoors spawn side) ──────────────────────────────
    { x: 0, z: -68, yaw: 0, length: 28, width: 30, yStart: 0.0, yEnd: 0.0 },

    // ── HALLWAY south of hall arch ────────────────────────────────────────────
    { x: 0, z: -52, yaw: 0, length: 10, width: 6,  yStart: 0.0, yEnd: 0.0 },

    // ── BRIDGE NORTH RAMP ─────────────────────────────────────────────────────
    { x: 0, z: -33, yaw: 0, length: 10, width: 2.2, yStart: 0.0, yEnd: 4.5 },

    // ── BRIDGE ARCH — 5 segments forming a gentle curve ───────────────────────
    { x: 0, z: -15, yaw: 0, length: 10, width: 1.4, yStart: 4.5, yEnd: 6.5 },
    { x: 0, z:  -5, yaw: 0, length: 10, width: 1.4, yStart: 6.5, yEnd: 8.0 },
    { x: 0, z:   0, yaw: 0, length: 10, width: 1.4, yStart: 8.0, yEnd: 8.0 },
    { x: 0, z:   5, yaw: 0, length: 10, width: 1.4, yStart: 8.0, yEnd: 6.5 },
    { x: 0, z:  15, yaw: 0, length: 10, width: 1.4, yStart: 6.5, yEnd: 4.5 },

    // ── BRIDGE SOUTH RAMP ─────────────────────────────────────────────────────
    { x: 0, z: 33, yaw: 0, length: 10, width: 2.2, yStart: 4.5, yEnd: 0.0 },

    // ── SOUTH LANDING — small flat area at bottom of ramp ────────────────────
    { x: 0, z: 42, yaw: 0, length:  8, width: 5.0, yStart: 0.0, yEnd: 0.0 },

    // ── NARROW EAST LEDGE (lothlorien side) ──────────────────────────────────
    // Runs east (+X) from x=0 to x=24, centred on z=45, width=5 (north-south)
    { x: 12, z: 45, yaw: Math.PI * 0.5, length: 24, width: 5, yStart: 0.0, yEnd: 0.0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  barriers: [
    // ── Chasm flanks — tight against 1.4-wide bridge ─────────────────────────
    { x: -7,  z:  0,  w: 11, d: 70, yaw: 0 },
    { x:  7,  z:  0,  w: 11, d: 70, yaw: 0 },

    // ── North hall side walls ─────────────────────────────────────────────────
    { x: -17, z: -68, w:  6, d: 34, yaw: 0 },
    { x:  17, z: -68, w:  6, d: 34, yaw: 0 },
    // Hall north back wall (also holds moriadoors transition)
    { x:   0, z: -87, w: 44, d:  6, yaw: 0 },

    // ── Hallway walls (z≈-52 corridor between hall and bridge) ───────────────
    { x: -5,  z: -52, w:  4, d: 12, yaw: 0 },
    { x:  5,  z: -52, w:  4, d: 12, yaw: 0 },

    // ── South landing walls (either side of ramp base) ────────────────────────
    { x: -5,  z: 42,  w:  4, d: 10, yaw: 0 },
    { x:  5,  z: 42,  w:  4, d: 10, yaw: 0 },

    // ── Narrow south ledge edges (centred on z=45) ────────────────────────────
    { x: 12, z: 51,  w: 30, d:  4, yaw: 0 },   // south edge of ledge
    { x: 12, z: 39,  w: 30, d:  4, yaw: 0 },   // north edge of ledge
    // West end cap (where ramp meets ledge)
    { x: -4, z: 45,  w:  6, d: 14, yaw: 0 },
  ],

  // ─── Scene ───────────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      torches:     [],   // [{ flames:[], embers, eGeo, ePOS, eVEL, eLIF, light }]
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
    const matStone = new THREE.MeshStandardMaterial({ color: 0x1c1614, roughness: 0.93, metalness: 0.04 });
    const matBridge = new THREE.MeshStandardMaterial({ color: 0x18120e, roughness: 0.95, metalness: 0.03 });
    const matVoid   = new THREE.MeshStandardMaterial({ color: 0x020101, roughness: 1.0,  metalness: 0.0  });
    const matCrack  = new THREE.MeshStandardMaterial({
      color: 0x330800, emissive: 0xaa1800, emissiveIntensity: 1.1,
      roughness: 0.8, transparent: true, opacity: 0.65,
    });
    const matFireCore = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 3.5, roughness: 0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xdd1100, emissiveIntensity: 2.0,
      roughness: 0.5, transparent: true, opacity: 0.70,
    });

    // ── Torch factory — sprite flames + ember particles, scaled for wall torches ─
    function makeFlameTexture(c1, c2) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 40, 2, 32, 32, 30);
      g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }

    function makeTorch(wx, wy, wz) {
      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.6, 7), matStone);
      pole.position.set(wx, wy + 0.8, wz);
      scene.add(pole);
      // Bowl
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.09, 0.22, 8), matStone);
      bowl.position.set(wx, wy + 1.71, wz);
      scene.add(bowl);

      const fireBase = wy + 1.82;

      // Flame sprites (smaller than campfire — scale ~0.4)
      const flames = [];
      [
        { tex: makeFlameTexture('rgba(255,240,180,0.95)', 'rgba(255,100,10,0.6)'),  sz: 0.38, speed: 1.2, phase: 0   },
        { tex: makeFlameTexture('rgba(255,160,30,0.85)',  'rgba(200,40,0,0.4)'),    sz: 0.30, speed: 0.9, phase: 1.0 },
        { tex: makeFlameTexture('rgba(255,200,80,0.7)',   'rgba(180,60,0,0.2)'),    sz: 0.46, speed: 1.5, phase: 2.1 },
      ].forEach(cfg => {
        const mat = new THREE.SpriteMaterial({
          map: cfg.tex, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const sp = new THREE.Sprite(mat);
        sp.position.set(wx, fireBase + cfg.sz * 0.5, wz);
        sp.scale.set(cfg.sz, cfg.sz * 1.6, 1);
        sp.userData = { baseY: sp.position.y, ...cfg };
        scene.add(sp);
        flames.push(sp);
      });

      // Embers — 30 particles (compact)
      const EC = 30;
      const eGeo = new THREE.BufferGeometry();
      const ePOS = new Float32Array(EC * 3);
      const eVEL = [];
      const eLIF = new Float32Array(EC);

      function resetE(i) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.12;
        ePOS[i*3]   = wx + Math.cos(a) * r;
        ePOS[i*3+1] = fireBase + 0.1 + Math.random() * 0.15;
        ePOS[i*3+2] = wz + Math.sin(a) * r;
        eVEL[i] = new THREE.Vector3(
          (Math.random() - 0.5) * 0.18,
          0.5 + Math.random() * 0.7,
          (Math.random() - 0.5) * 0.18,
        );
        eLIF[i] = Math.random();
      }
      for (let i = 0; i < EC; i++) resetE(i);
      eGeo.setAttribute('position', new THREE.BufferAttribute(ePOS, 3));

      const eMat = new THREE.PointsMaterial({
        color: 0xffaa22, size: 0.055, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      });
      const pts = new THREE.Points(eGeo, eMat);
      scene.add(pts);

      // Point light
      const light = new THREE.PointLight(0xff6622, 0.9, 10);
      light.position.set(wx, fireBase + 0.3, wz);
      scene.add(light);
      refs.chasmLights.push(light);

      refs.torches.push({ flames, pts, eGeo, ePOS, eVEL, eLIF, EC, resetE, fireBase, wx, wz, light });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE GEOMETRY — addSlab helper: single rotated box, no gaps
    // ═══════════════════════════════════════════════════════════════════════════
    const BD = 0.36;
    const addSlab = (zStart, zEnd, y0, y1, width) => {
      const dz = zEnd - zStart, dy = y1 - y0;
      const len = Math.sqrt(dz*dz + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, BD, len), matBridge);
      mesh.position.set(0, (y0+y1)/2, (zStart+zEnd)/2);
      mesh.rotation.x = -Math.atan2(dy, dz);
      mesh.castShadow = true;
      scene.add(mesh);
    };

    // North ramp
    addSlab(-33, -20, 0.0, 4.5, 2.2);
    // Arch — 5 segments
    addSlab(-20, -10, 4.5, 6.5, 1.4);
    addSlab(-10,   0, 6.5, 8.0, 1.4);
    addSlab(  0,   0, 8.0, 8.0, 1.4);   // crown (zero-length guard, visual only)
    addSlab(  0,  10, 8.0, 6.5, 1.4);
    addSlab( 10,  20, 6.5, 4.5, 1.4);
    // South ramp
    addSlab( 20,  33, 4.5, 0.0, 2.2);

    // Thin side kerbs on the narrow span only (no rails — just stone lip)
    const addKerb = (zStart, zEnd, y0, y1, side) => {
      const dz = zEnd - zStart, dy = y1 - y0;
      const len = Math.sqrt(dz*dz + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, len), matBridge);
      mesh.position.set(side * (1.4/2 + 0.09), (y0+y1)/2 + 0.14, (zStart+zEnd)/2);
      mesh.rotation.x = -Math.atan2(dy, dz);
      scene.add(mesh);
    };
    [-1, 1].forEach(s => {
      addKerb(-20, -10, 4.5, 6.5, s);
      addKerb(-10,   0, 6.5, 8.0, s);
      addKerb(  0,  10, 8.0, 6.5, s);
      addKerb( 10,  20, 6.5, 4.5, s);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM VOID — tall boxes, top at y=-8, deep enough that fog hides the bottom
    // ═══════════════════════════════════════════════════════════════════════════
    const CHASM_H  = 120;
    const CHASM_TOP = -8;
    const chasmWall = (cx, cz, w, d) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, CHASM_H, d), matVoid);
      m.position.set(cx, CHASM_TOP - CHASM_H/2, cz);
      scene.add(m);
    };
    chasmWall(-12, 0, 20, 64);   // west flank
    chasmWall( 12, 0, 20, 64);   // east flank
    // Floor — very deep, fog handles fade
    const floor = new THREE.Mesh(new THREE.BoxGeometry(50, 2, 68), matVoid);
    floor.position.set(0, CHASM_TOP - CHASM_H, 0);
    scene.add(floor);
    // Glowing crack
    const crack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 58), matCrack);
    crack.position.set(0, CHASM_TOP - CHASM_H + 1, 0);
    scene.add(crack);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH HALL — high-ceilinged entrance chamber (moriadoors side)
    // Hall floor at y=0, ceiling at y=30, z range -54 to -82, x range -20 to +20
    // ═══════════════════════════════════════════════════════════════════════════
    const HALL_Y_FLOOR = 0;
    const HALL_Y_CEIL  = 30;
    const HALL_ZN      = -82;   // north back wall of hall
    const HALL_ZS      = -50;   // south face (doorway side)
    const HALL_XW      = -20;
    const HALL_XE      =  20;
    const HALL_H       = HALL_Y_CEIL - HALL_Y_FLOOR;
    const WALL_T       = 1.4;

    // Floor
    const hallFloor = new THREE.Mesh(
      new THREE.BoxGeometry(HALL_XE-HALL_XW, 0.6, HALL_ZS-HALL_ZN), matStone
    );
    hallFloor.position.set(0, HALL_Y_FLOOR - 0.3, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallFloor);

    // Ceiling
    const hallCeil = new THREE.Mesh(
      new THREE.BoxGeometry(HALL_XE-HALL_XW + 4, 1.0, HALL_ZS-HALL_ZN + 4), matStone
    );
    hallCeil.position.set(0, HALL_Y_CEIL, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallCeil);

    // North back wall
    const hallWallN = new THREE.Mesh(new THREE.BoxGeometry(HALL_XE-HALL_XW+4, HALL_H+2, WALL_T), matStone);
    hallWallN.position.set(0, HALL_H/2, HALL_ZN);
    scene.add(hallWallN);

    // East & west walls
    const wallLen = HALL_ZS - HALL_ZN;
    const hallWallW = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, HALL_H+2, wallLen), matStone);
    hallWallW.position.set(HALL_XW, HALL_H/2, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallWallW);
    const hallWallE = hallWallW.clone();
    hallWallE.position.x = HALL_XE;
    scene.add(hallWallE);

    // ── Hall columns — pairs running north-south inside hall ───────────────────
    const COL_H = HALL_H + 2;
    const colPairs = [
      { x: -10, z: -58 }, { x: 10, z: -58 },
      { x: -10, z: -68 }, { x: 10, z: -68 },
      { x: -10, z: -78 }, { x: 10, z: -78 },
    ];
    colPairs.forEach(({ x, z }) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, COL_H, 9), matStone);
      col.position.set(x, COL_H/2, z);
      scene.add(col);
      // Capital block
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 2.4), matStone);
      cap.position.set(x, COL_H - 0.3, z);
      scene.add(cap);
    });

    // ── South face of hall — trapezoidal doorway arch (/-\) ───────────────────
    // The doorway is 4 units wide, 7 units tall at the centre.
    // Built from: left jamb, right jamb, two sloped lintels, centre keystone.
    const DOOR_W  = 4.2;   // door clear width
    const DOOR_H  = 7.0;   // door height at centre
    const ARCH_Y  = HALL_Y_FLOOR;
    const DOOR_Z  = HALL_ZS;   // z = -50

    // Solid wall panel south face (with hole — approximated by building around the opening)
    // Left panel
    const wallPanelW = (HALL_XE - HALL_XW - DOOR_W) / 2;   // ~7.9
    const wallPanelL = new THREE.Mesh(new THREE.BoxGeometry(wallPanelW, HALL_H, WALL_T), matStone);
    wallPanelL.position.set(HALL_XW + wallPanelW/2, HALL_H/2, DOOR_Z);
    scene.add(wallPanelL);
    const wallPanelR = wallPanelL.clone();
    wallPanelR.position.x = HALL_XE - wallPanelW/2;
    scene.add(wallPanelR);
    // Transom above door
    const transomH = HALL_H - DOOR_H;
    const transom = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, transomH, WALL_T), matStone);
    transom.position.set(0, DOOR_H + transomH/2, DOOR_Z);
    scene.add(transom);

    // Left jamb (vertical)
    const jambH = DOOR_H - 1.5;   // leaves room for the sloped lintel
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.45, jambH, WALL_T+0.2), matStone);
    jambL.position.set(-DOOR_W/2, ARCH_Y + jambH/2, DOOR_Z);
    scene.add(jambL);
    const jambR = jambL.clone();
    jambR.position.x = DOOR_W/2;
    scene.add(jambR);

    // Sloped lintels (/-\): two angled blocks meeting at centre keystone
    // Left lintel: rises from left jamb top-right to centre
    {
      const lx0 = -DOOR_W/2, ly0 = ARCH_Y + jambH;
      const lx1 =  0,        ly1 = ARCH_Y + DOOR_H;
      const dx = lx1-lx0, dy = ly1-ly0;
      const len = Math.sqrt(dx*dx + dy*dy);
      const ang = Math.atan2(dy, dx);
      const lintelL = new THREE.Mesh(new THREE.BoxGeometry(len, 0.45, WALL_T+0.2), matStone);
      lintelL.position.set((lx0+lx1)/2, (ly0+ly1)/2, DOOR_Z);
      lintelL.rotation.z = ang;
      scene.add(lintelL);
    }
    // Right lintel: descends from centre to right jamb
    {
      const lx0 =  0,        ly0 = ARCH_Y + DOOR_H;
      const lx1 =  DOOR_W/2, ly1 = ARCH_Y + jambH;
      const dx = lx1-lx0, dy = ly1-ly0;
      const len = Math.sqrt(dx*dx + dy*dy);
      const ang = Math.atan2(dy, dx);
      const lintelR = new THREE.Mesh(new THREE.BoxGeometry(len, 0.45, WALL_T+0.2), matStone);
      lintelR.position.set((lx0+lx1)/2, (ly0+ly1)/2, DOOR_Z);
      lintelR.rotation.z = ang;
      scene.add(lintelR);
    }
    // Keystone at peak
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, WALL_T+0.4), matStone);
    keystone.position.set(0, ARCH_Y + DOOR_H + 0.1, DOOR_Z);
    scene.add(keystone);

    // ── Short hallway south of the door arch (z -50 to -40) ───────────────────
    const HW_W = DOOR_W + 0.4;   // hallway width matches door
    const HW_ZN = DOOR_Z;
    const HW_ZS = -40;
    const HW_H  = DOOR_H + 1;

    // Hallway walls
    const hwWallL = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, HW_H, HW_ZS-HW_ZN), matStone);
    hwWallL.position.set(-HW_W/2, HW_H/2, (HW_ZN+HW_ZS)/2);
    scene.add(hwWallL);
    const hwWallR = hwWallL.clone();
    hwWallR.position.x = HW_W/2;
    scene.add(hwWallR);
    // Hallway ceiling
    const hwCeil = new THREE.Mesh(new THREE.BoxGeometry(HW_W, 0.6, HW_ZS-HW_ZN), matStone);
    hwCeil.position.set(0, HW_H, (HW_ZN+HW_ZS)/2);
    scene.add(hwCeil);
    // Hallway floor
    const hwFloor = new THREE.Mesh(new THREE.BoxGeometry(HW_W, 0.4, HW_ZS-HW_ZN), matStone);
    hwFloor.position.set(0, -0.2, (HW_ZN+HW_ZS)/2);
    scene.add(hwFloor);

    // ── Torches in the hall ────────────────────────────────────────────────────
    [
      [-14, -58], [14, -58],
      [-14, -68], [14, -68],
      [-14, -78], [14, -78],
    ].forEach(([tx, tz]) => makeTorch(tx, 0, tz));

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUTH SIDE — narrow east ledge leading to Lothlórien transition
    // The player exits the south ramp onto a small landing, then follows a
    // narrow ledge running east (+X) along z=45 to the transition at x=24.
    // ═══════════════════════════════════════════════════════════════════════════

    // Small landing slab at base of south ramp
    const landingSlab = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 8), matStone);
    landingSlab.position.set(0, -0.2, 42);
    scene.add(landingSlab);

    // Cavern wall face the ledge runs along (north face, z≈39)
    const ledgeCavernWall = new THREE.Mesh(new THREE.BoxGeometry(35, 18, WALL_T), matStone);
    ledgeCavernWall.position.set(12, 9, 39 - WALL_T/2);
    scene.add(ledgeCavernWall);

    // Ledge slab itself — runs east from x=0 to x=24, centred on z=45, width=5
    const LEDGE_Z  = 45;
    const LEDGE_ZH = 2.5;
    const LEDGE_XW = 0;
    const LEDGE_XE = 24;
    const ledgeSlab = new THREE.Mesh(
      new THREE.BoxGeometry(LEDGE_XE - LEDGE_XW, 0.4, LEDGE_ZH * 2), matStone
    );
    ledgeSlab.position.set((LEDGE_XW + LEDGE_XE) / 2, -0.2, LEDGE_Z);
    scene.add(ledgeSlab);

    // Low parapet on the south (outer/void) edge of the ledge
    const ledgeParapet = new THREE.Mesh(
      new THREE.BoxGeometry(LEDGE_XE - LEDGE_XW, 0.8, 0.3), matStone
    );
    ledgeParapet.position.set((LEDGE_XW + LEDGE_XE) / 2, 0.4, LEDGE_Z + LEDGE_ZH);
    scene.add(ledgeParapet);

    // Void underskirt below ledge
    const ledgeSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(LEDGE_XE - LEDGE_XW, 8, LEDGE_ZH * 2), matVoid
    );
    ledgeSkirt.position.set((LEDGE_XW + LEDGE_XE) / 2, -4.4, LEDGE_Z);
    scene.add(ledgeSkirt);

    // East end cap — solid wall at transition end of ledge
    const ledgeEndCap = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, 14, LEDGE_ZH * 2 + 4), matStone);
    ledgeEndCap.position.set(LEDGE_XE + WALL_T / 2, 7, LEDGE_Z);
    scene.add(ledgeEndCap);

    // Arch columns where the landing meets the ledge (x=0, z=45)
    {
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 8, 9), matStone);
      pL.position.set(0, 8 / 2 - 8 * 0.25, LEDGE_Z - LEDGE_ZH);
      scene.add(pL);
      const pR = pL.clone();
      pR.position.z = LEDGE_Z + LEDGE_ZH;
      scene.add(pR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, 0.4, LEDGE_ZH * 2 + 1.2), matStone);
      lintel.position.set(0, 7.2, LEDGE_Z);
      scene.add(lintel);
    }

    // Torches on the ledge — spaced along the east run
    [[6, LEDGE_Z - 2], [12, LEDGE_Z - 2], [18, LEDGE_Z - 2]].forEach(([tx, tz]) => {
      makeTorch(tx, 0, tz);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — deep north, behind the hall
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bigFire = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 7), matFireOuter.clone());
      bigFire.position.set(0, 6, -100);
      scene.add(bigFire);
      refs.balrogFire = bigFire;

      const inner = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 7), matFireCore);
      inner.position.set(0, 6.5, -100);
      scene.add(inner);

      const balrogLight = new THREE.PointLight(0xff2200, 2.2, 90);
      balrogLight.position.set(0, 10, -95);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      const balrogFill = new THREE.PointLight(0xff6600, 0.9, 65);
      balrogFill.position.set(0, 4, -75);
      scene.add(balrogFill);
      refs.balrogFill = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — deep below the bridge flanks
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [-8, -22], [-10, -8], [-8,  8], [-10, 20],
      [ 8,  18], [ 10,  4], [ 8,-12], [ 10,-26],
    ].forEach(([fx, fz]) => {
      const baseY = -55 + rnd(-5, 5);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.5, 1.0), 8, 6), matFireOuter.clone());
      outer.position.set(fx, baseY + rnd(1, 3), fz);
      scene.add(outer);

      const fl = new THREE.PointLight(0xff4400, rnd(0.3, 0.8), rnd(14, 24));
      fl.position.set(fx, baseY + 3, fz);
      scene.add(fl);
      refs.chasmLights.push(fl);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GANDALF STAFF — bridge crown
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.6, metalness: 0.15 });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7), staffMat);
      staff.position.set(0.3, 8.0 + 1.6, -0.5);
      staff.rotation.z = 0.04;
      scene.add(staff);

      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff, emissive: 0xaaccff, emissiveIntensity: 3.0, roughness: 0.2,
      });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), tipMat);
      tip.position.set(0.3, 8.0 + 3.25, -0.5);
      scene.add(tip);
      refs.staffTip = tip;

      const staffLight = new THREE.PointLight(0x8899cc, 0.75, 18);
      staffLight.position.copy(tip.position);
      scene.add(staffLight);
      refs.staffLight = staffLight;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FAR ENCLOSURE — pushed well beyond transitions so never visible at spawn
    // ═══════════════════════════════════════════════════════════════════════════
    // North back wall — behind the hall (beyond moriadoors transition at z=-82)
    const northFarWall = new THREE.Mesh(new THREE.BoxGeometry(200, 50, 4), matVoid);
    northFarWall.position.set(0, 25, -108);
    scene.add(northFarWall);

    // South void wall — behind the ledge's south parapet face
    const southFarWall = new THREE.Mesh(new THREE.BoxGeometry(60, 20, 4), matVoid);
    southFarWall.position.set(12, 10, 52);
    scene.add(southFarWall);

    // West side enclosure
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(4, 50, 210), matVoid);
    westWall.position.set(-95, 25, 0);
    scene.add(westWall);

    // East end wall — beyond transition at x=24
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 30), matVoid);
    eastWall.position.set(30, 10, 45);
    scene.add(eastWall);

    return refs;
  },

  // ─── Per-frame animation ──────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

    // ── Torch flame sprites + embers ──────────────────────────────────────────
    refs.torches.forEach((torch, ti) => {
      // Animate each flame sprite
      torch.flames.forEach(sp => {
        const u = sp.userData;
        const flicker = 0.85 + 0.2 * Math.sin(tt * u.speed * 5.0 + u.phase)
                             + 0.1 * Math.sin(tt * u.speed * 11.0 + u.phase * 2);
        sp.scale.set(u.sz * flicker, u.sz * 1.6 * flicker, 1);
        sp.position.y = u.baseY + 0.04 * Math.sin(tt * u.speed * 3.0 + u.phase);
      });

      // Tick embers
      const pos = torch.ePOS;
      for (let i = 0; i < torch.EC; i++) {
        torch.eLIF[i] -= dt * (0.6 + Math.random() * 0.4);
        if (torch.eLIF[i] <= 0) {
          torch.resetE(i);
        } else {
          const v = torch.eVEL[i];
          pos[i*3]   += v.x * dt;
          pos[i*3+1] += v.y * dt;
          pos[i*3+2] += v.z * dt;
          v.y -= 0.4 * dt;   // slight gravity
        }
      }
      torch.eGeo.attributes.position.needsUpdate = true;

      // Flicker torch light
      const tl = torch.light;
      if (tl._base === undefined) tl._base = tl.intensity;
      tl.intensity = tl._base * (0.75 + 0.32 * Math.sin(tt * 5.7 + ti * 2.1)
                                       + 0.12 * Math.sin(tt * 11.3 + ti * 0.9));
    });

    // ── Chasm point lights ────────────────────────────────────────────────────
    refs.chasmLights.forEach((light, i) => {
      if (light._base === undefined) light._base = light.intensity;
      light.intensity = light._base * (0.7 + 0.38 * Math.sin(tt * 4.8 + i * 1.9)
                                           + 0.12 * Math.sin(tt * 9.3 + i * 0.8));
    });

    // ── Balrog ────────────────────────────────────────────────────────────────
    if (refs.balrogGlow) {
      refs.balrogGlow.intensity = 2.2 * (0.72 + 0.38 * Math.sin(tt * 1.1) + 0.18 * Math.sin(tt * 2.7));
    }
    if (refs.balrogFill) {
      refs.balrogFill.intensity = 0.9 + 0.4 * Math.sin(tt * 1.6 + 0.4);
    }
    if (refs.balrogFire) {
      refs.balrogFire.scale.setScalar(0.88 + 0.18 * Math.sin(tt * 3.0) + 0.09 * Math.sin(tt * 6.5));
    }

    // ── Gandalf staff ─────────────────────────────────────────────────────────
    if (refs.staffTip) {
      refs.staffTip.material.emissiveIntensity = 3.0 * (0.82 + 0.22 * Math.sin(tt * 2.1) + 0.08 * Math.sin(tt * 5.3));
    }
    if (refs.staffLight) {
      refs.staffLight.intensity = 0.75 + 0.28 * Math.sin(tt * 2.0);
    }
  },

};

window.MoriaBridge = MoriaBridge;
