// moriabridge.js — Durin's Bridge, Moria
// Sequence: moriadoors → NORTH HALL → east passage → CHASM + BRIDGE → ledge → south corridor → lothlorien
//
// Coordinate layout (everything runs along +X = east):
//
//   HALL (x=-70→0, z=-20→+20)
//     ↓ doorway arch at x=0
//   PASSAGE (x=0→14, z=-3→+3)
//     ↓ opens into chasm space at x=14
//   CHASM SPACE (x=14→54)
//     north cavern wall z=-14
//     south cavern wall z=+14
//     BRIDGE at z=0, spans x=14→54 (yaw π/2, runs E-W)
//     chasm pit below bridge (±z from bridge, deep)
//     ↓ east side of chasm at x=54
//   LEDGE (x=54→72, z=0→+10, narrow south shelf)
//     ↓ south corridor at x=62, z=+10→+30
//   SOUTH CORRIDOR → daylight doorway → [lothlorien transition]

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x0a0605,
    fogDensity:       0.016,
    fogType:          'exponential',
    skyColor:         0x060302,
    ambientColor:     0x100808,
    ambientIntensity: 1.0,
    moonColor:        0x4a2010,
    moonIntensity:    0.18,
    moonPosition:     { x: -80, y: 60, z: 0 },
    showStars:        false,
    extraLights: [
      // Balrog glow from deep west (behind the hall, from moriadoors)
      { color: 0xcc3300, intensity: 0.55, x: -120, y: 20, z: 0   },
      // Chasm ember up-light
      { color: 0x551100, intensity: 0.28, x:   34, y:-30, z: 0   },
      // Hall fill
      { color: 0x6a3010, intensity: 0.20, x:  -35, y: 15, z: 0   },
      // Daylight spill from south corridor (lothlorien side)
      { color: 0x88ccaa, intensity: 0.35, x:   62, y:  8, z:  28 },
    ],
  },

  // ─── Terrain — flat; all structure from geometry ─────────────────────────────
  hillHeight(x, z) {
    return window.api_noise2d(x * 0.06, z * 0.06) * 0.4;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    return [ lerp(0.07, 0.14, n), lerp(0.05, 0.09, n), lerp(0.04, 0.08, n) ];
  },

  onPath: (() => 0),

  // ─── Lore (book order west→east, moriadoors→lothlorien) ─────────────────────
  lorePoints: [
    {
      pos: { x: -40, z: 0 }, radius: 8,
      text: '"Doom, doom, doom the drums in the deep... They are coming."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: 10, z: 0 }, radius: 6,
      text: '"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite: '— Gandalf the Grey, at the Bridge of Khazad-dûm',
    },
    {
      pos: { x: 34, z: 0 }, radius: 5,
      text: '"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: 58, z: 0 }, radius: 6,
      text: '"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: 62, z: 22 }, radius: 6,
      text: '"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start / arrivals ─────────────────────────────────────────────────
  // Spawn deep in hall, facing east (yaw π/2)
  start: { x: -55, z: 0, yaw: Math.PI * 0.5 },

  arrivals: {
    // From moriadoors: deep west end of hall, facing east
    moriadoors: { x: -60, z: 0, yaw: Math.PI * 0.5 },
    // From lothlorien: south corridor, facing north (back into the scene)
    lothlorien: { x: 62, z: 26, yaw: 0 },
  },

  // ─── Boundary ────────────────────────────────────────────────────────────────
  boundary: 110,

  // ─── Transitions ─────────────────────────────────────────────────────────────
  transitions: [
    { trigger: { x: -68, z: 0,  radius: 7 }, to: 'moriadoors' },
    { trigger: { x:  62, z: 30, radius: 6 }, to: 'lothlorien' },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  // Hall and passage run along X → yaw: Math.PI*0.5
  // Bridge runs along X → yaw: Math.PI*0.5
  // South corridor runs along Z → yaw: 0
  walkables: [
    // Hall floor (x=-70→0, centre x=-35, length 70, width 40)
    { x: -35, z: 0, yaw: Math.PI*0.5, length: 70, width: 40, yStart: 0, yEnd: 0 },

    // Passage (x=0→14, centre x=7, length 14, width 6)
    { x: 7, z: 0, yaw: Math.PI*0.5, length: 14, width: 6, yStart: 0, yEnd: 0 },

    // Bridge north ramp (x=14→20, rises 0→4)
    { x: 17, z: 0, yaw: Math.PI*0.5, length: 6,  width: 2.2, yStart: 0.0, yEnd: 4.0 },
    // Bridge arch seg 1 (x=20→28, rises 4→6.5)
    { x: 24, z: 0, yaw: Math.PI*0.5, length: 8,  width: 1.4, yStart: 4.0, yEnd: 6.5 },
    // Bridge arch seg 2 (x=28→34, rises 6.5→8)
    { x: 31, z: 0, yaw: Math.PI*0.5, length: 6,  width: 1.4, yStart: 6.5, yEnd: 8.0 },
    // Bridge crown (x=34→40, flat 8)
    { x: 37, z: 0, yaw: Math.PI*0.5, length: 6,  width: 1.4, yStart: 8.0, yEnd: 8.0 },
    // Bridge arch seg 3 (x=40→46, descends 8→6.5)
    { x: 43, z: 0, yaw: Math.PI*0.5, length: 6,  width: 1.4, yStart: 8.0, yEnd: 6.5 },
    // Bridge arch seg 4 (x=46→54, descends 6.5→4)
    { x: 50, z: 0, yaw: Math.PI*0.5, length: 8,  width: 1.4, yStart: 6.5, yEnd: 4.0 },
    // Bridge south ramp (x=54→60, descends 4→0)
    { x: 57, z: 0, yaw: Math.PI*0.5, length: 6,  width: 2.2, yStart: 4.0, yEnd: 0.0 },

    // East landing (x=54→70, z=-6→+6, small pad after bridge)
    { x: 62, z: 0, yaw: Math.PI*0.5, length: 16, width: 12, yStart: 0, yEnd: 0 },

    // South corridor (x=58→66, z=0→+30, runs along +Z)
    { x: 62, z: 16, yaw: 0, length: 32, width: 8, yStart: 0, yEnd: 0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  barriers: [
    // Hall north & south walls
    { x: -35, z: -22, w: 70, d: 4, yaw: 0 },
    { x: -35, z:  22, w: 70, d: 4, yaw: 0 },
    // Hall west back wall
    { x: -73, z: 0, w: 6, d: 48, yaw: 0 },

    // Passage walls
    { x: 7, z: -5, w: 14, d: 4, yaw: 0 },
    { x: 7, z:  5, w: 14, d: 4, yaw: 0 },

    // Chasm north and south flanks (along the bridge, z=±4 to ±14)
    { x: 34, z: -10, w: 50, d: 10, yaw: 0 },
    { x: 34, z:  10, w: 50, d: 10, yaw: 0 },

    // South corridor walls
    { x: 58, z: 16, w: 4, d: 32, yaw: 0 },
    { x: 66, z: 16, w: 4, d: 32, yaw: 0 },
    // South corridor far wall (beyond transition)
    { x: 62, z: 34, w: 16, d: 4, yaw: 0 },
  ],

  // ─── buildScene ──────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      torches:     [],
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
    const matStone  = new THREE.MeshStandardMaterial({ color: 0x1c1614, roughness: 0.93, metalness: 0.04 });
    const matBridge = new THREE.MeshStandardMaterial({ color: 0x18120e, roughness: 0.95, metalness: 0.03 });
    const matVoid   = new THREE.MeshStandardMaterial({ color: 0x020101, roughness: 1.0,  metalness: 0.0  });
    const matCrack  = new THREE.MeshStandardMaterial({
      color: 0x330800, emissive: 0xaa1800, emissiveIntensity: 1.1,
      roughness: 1.0, transparent: true, opacity: 0.65,
    });
    const matFireCore = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 3.5, roughness: 0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xdd1100, emissiveIntensity: 2.0,
      roughness: 0.5, transparent: true, opacity: 0.70,
    });
    // Glowing exit door material
    const matDaylight = new THREE.MeshStandardMaterial({
      color: 0x88ddaa, emissive: 0x55bb88, emissiveIntensity: 1.8,
      roughness: 0.6, transparent: true, opacity: 0.85,
    });

    // ── Torch factory ──────────────────────────────────────────────────────────
    function makeFlameTexture(c1, c2) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 40, 2, 32, 32, 30);
      g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }

    function makeTorch(wx, wy, wz) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.6, 7), matStone);
      pole.position.set(wx, wy + 0.8, wz);
      scene.add(pole);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.09, 0.22, 8), matStone);
      bowl.position.set(wx, wy + 1.71, wz);
      scene.add(bowl);

      const fireBase = wy + 1.82;
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
          (Math.random()-0.5)*0.18, 0.5+Math.random()*0.7, (Math.random()-0.5)*0.18
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

      const light = new THREE.PointLight(0xff6622, 0.9, 10);
      light.position.set(wx, fireBase + 0.3, wz);
      scene.add(light);

      refs.torches.push({ flames, pts, eGeo, ePOS, eVEL, eLIF, EC, resetE, light });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE — sloped slabs running east-west (along X axis)
    // addSlabX: x0→x1, y0→y1, width along Z
    // ═══════════════════════════════════════════════════════════════════════════
    const BD = 0.36;
    const addSlabX = (x0, x1, y0, y1, width) => {
      const dx = x1 - x0, dy = y1 - y0;
      const len = Math.sqrt(dx*dx + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, BD, width), matBridge);
      mesh.position.set((x0+x1)/2, (y0+y1)/2, 0);
      // Rotate around Z axis: positive angle tilts east end up
      mesh.rotation.z = Math.atan2(dy, dx);
      mesh.castShadow = true;
      scene.add(mesh);
    };

    addSlabX(14, 20, 0.0, 4.0, 2.2);   // west ramp
    addSlabX(20, 28, 4.0, 6.5, 1.4);   // arch seg 1
    addSlabX(28, 34, 6.5, 8.0, 1.4);   // arch seg 2
    addSlabX(34, 40, 8.0, 8.0, 1.4);   // crown
    addSlabX(40, 46, 8.0, 6.5, 1.4);   // arch seg 3
    addSlabX(46, 54, 6.5, 4.0, 1.4);   // arch seg 4
    addSlabX(54, 60, 4.0, 0.0, 2.2);   // east ramp

    // Side kerbs along the narrow span
    const addKerbX = (x0, x1, y0, y1, side) => {
      const dx = x1-x0, dy = y1-y0;
      const len = Math.sqrt(dx*dx + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.28, 0.18), matBridge);
      mesh.position.set((x0+x1)/2, (y0+y1)/2 + 0.14, side * (0.7 + 0.09));
      mesh.rotation.z = Math.atan2(dy, dx);
      scene.add(mesh);
    };
    [-1, 1].forEach(s => {
      addKerbX(20, 28, 4.0, 6.5, s);
      addKerbX(28, 34, 6.5, 8.0, s);
      addKerbX(34, 40, 8.0, 8.0, s);
      addKerbX(40, 46, 8.0, 6.5, s);
      addKerbX(46, 54, 6.5, 4.0, s);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM VOID — north and south flanks, top flush at y=0
    // Bridge at z=0; chasm extends ±z from it. Flanks cover x=14→60.
    // ═══════════════════════════════════════════════════════════════════════════
    const CHASM_H   = 110;
    const CHASM_TOP = 0;
    const CHASM_XW  = 12;
    const CHASM_XE  = 62;
    const CHASM_DX  = CHASM_XE - CHASM_XW;  // 50

    // North flank (z negative side)
    const chasmN = new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX, CHASM_H, 16), matVoid);
    chasmN.position.set((CHASM_XW+CHASM_XE)/2, CHASM_TOP - CHASM_H/2, -11);
    scene.add(chasmN);
    // South flank
    const chasmS = chasmN.clone();
    chasmS.position.z = 11;
    scene.add(chasmS);
    // Chasm floor
    const chasmFloor = new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX, 2, 36), matVoid);
    chasmFloor.position.set((CHASM_XW+CHASM_XE)/2, CHASM_TOP - CHASM_H - 1, 0);
    scene.add(chasmFloor);
    // Glowing crack
    const crack = new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX - 4, 0.3, 1.4), matCrack);
    crack.position.set((CHASM_XW+CHASM_XE)/2, CHASM_TOP - CHASM_H, 0);
    scene.add(crack);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH HALL — long spawn chamber, runs west-east (X axis)
    // x = -70 → 0,  z = -20 → +20,  ceiling y = 30
    // ═══════════════════════════════════════════════════════════════════════════
    const HALL_XW  = -70;
    const HALL_XE  =   0;
    const HALL_ZN  = -20;   // north wall of hall (in -Z direction)
    const HALL_ZS  =  20;   // south wall of hall
    const HALL_H   =  30;
    const WALL_T   =  1.4;
    const HALL_DX  = HALL_XE - HALL_XW;   // 70
    const HALL_DZ  = HALL_ZS - HALL_ZN;   // 40

    // Floor
    const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(HALL_DX, 0.6, HALL_DZ), matStone);
    hallFloor.position.set((HALL_XW+HALL_XE)/2, -0.3, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallFloor);
    // Ceiling
    const hallCeil = new THREE.Mesh(new THREE.BoxGeometry(HALL_DX+4, 1.2, HALL_DZ+4), matStone);
    hallCeil.position.set((HALL_XW+HALL_XE)/2, HALL_H, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallCeil);
    // West back wall (moriadoors side)
    const hallWallW = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, HALL_H+2, HALL_DZ+4), matStone);
    hallWallW.position.set(HALL_XW, HALL_H/2, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallWallW);
    // North wall
    const hallWallN = new THREE.Mesh(new THREE.BoxGeometry(HALL_DX, HALL_H+2, WALL_T), matStone);
    hallWallN.position.set((HALL_XW+HALL_XE)/2, HALL_H/2, HALL_ZN);
    scene.add(hallWallN);
    // South wall
    const hallWallS = hallWallN.clone();
    hallWallS.position.z = HALL_ZS;
    scene.add(hallWallS);

    // ── Hall columns — two rows, north and south, running east-west ────────────
    // North row: z=-14, south row: z=+14, columns at x intervals
    const COL_H = HALL_H + 2;
    const colXs = [-60, -50, -40, -30, -20, -10];
    colXs.forEach(cx => {
      [-14, 14].forEach(cz => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, COL_H, 9), matStone);
        col.position.set(cx, COL_H/2, cz);
        scene.add(col);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 2.6), matStone);
        cap.position.set(cx, COL_H - 0.35, cz);
        scene.add(cap);
      });
    });

    // ── Hall torches — between columns on both rows ────────────────────────────
    // Placed between column x positions, slightly inside the walls
    const torchXs = [-65, -55, -45, -35, -25, -15, -5];
    torchXs.forEach(tx => {
      makeTorch(tx, 0, -17);   // north row
      makeTorch(tx, 0,  17);   // south row
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EAST FACE OF HALL — trapezoidal doorway arch at x=0
    // Splayed: narrow at outside (x=0), wider at hall interior (x=-SPLAY_D)
    // ═══════════════════════════════════════════════════════════════════════════
    const DOOR_W_OUT = 6.0;   // opening width (Z) at outside face
    const DOOR_W_IN  = 9.0;   // opening width (Z) at hall side
    const DOOR_H     = 8.0;   // door height (peak of trapezoid)
    const DOOR_X     = HALL_XE;  // x = 0
    const SPLAY_D    = 3.0;   // splay depth along X

    // Wall panels flanking door opening (north and south of the door, at x=0)
    const doorPanelW = (HALL_DZ - DOOR_W_OUT) / 2;  // (40-6)/2 = 17
    // North panel
    const dpN = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, HALL_H, doorPanelW), matStone);
    dpN.position.set(DOOR_X, HALL_H/2, HALL_ZN + doorPanelW/2);
    scene.add(dpN);
    // South panel
    const dpS = dpN.clone();
    dpS.position.z = HALL_ZS - doorPanelW/2;
    scene.add(dpS);
    // Transom above door
    const transomH = HALL_H - DOOR_H;
    const transom = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, transomH, DOOR_W_OUT), matStone);
    transom.position.set(DOOR_X, DOOR_H + transomH/2, 0);
    scene.add(transom);

    // Splayed jambs — angled in Z-X plane, opening widens into the hall
    // Left (north) jamb: angled from z=-DOOR_W_OUT/2 at x=0 to z=-DOOR_W_IN/2 at x=-SPLAY_D
    const splayDZ = (DOOR_W_IN - DOOR_W_OUT) / 2;  // 1.5
    const splayAngle = Math.atan2(splayDZ, SPLAY_D);
    const jambLen = Math.sqrt(SPLAY_D*SPLAY_D + splayDZ*splayDZ) + 0.5;
    const jambH_g = DOOR_H - 2.0;

    [-1, 1].forEach(side => {
      const jm = new THREE.Mesh(new THREE.BoxGeometry(jambLen, jambH_g, WALL_T), matStone);
      jm.rotation.y = side * splayAngle;
      jm.position.set(DOOR_X - SPLAY_D/2, jambH_g/2, side * (DOOR_W_OUT/2 + splayDZ/2));
      scene.add(jm);
    });

    // Sloped lintels (/-\): meet at keystone above centre
    const jambTopY   = jambH_g;
    const keystoneY  = DOOR_H;
    // Left lintel: from z=-DOOR_W_OUT/2 at y=jambTopY to z=0 at y=keystoneY
    [
      { z0: -DOOR_W_OUT/2, z1: 0,             y0: jambTopY,  y1: keystoneY },
      { z0:  0,            z1:  DOOR_W_OUT/2, y0: keystoneY, y1: jambTopY  },
    ].forEach(({ z0, z1, y0, y1 }) => {
      const dz = z1-z0, dy = y1-y0;
      const len = Math.sqrt(dz*dz + dy*dy);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, 0.55, len), matStone);
      lm.position.set(DOOR_X, (y0+y1)/2, (z0+z1)/2);
      lm.rotation.x = -Math.atan2(dy, dz);
      scene.add(lm);
    });
    // Keystone
    const ks = new THREE.Mesh(new THREE.BoxGeometry(WALL_T+0.4, 1.1, 0.75), matStone);
    ks.position.set(DOOR_X, keystoneY + 0.2, 0);
    scene.add(ks);

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSAGE — narrow corridor from hall doorway to chasm space (x=0→14)
    // ═══════════════════════════════════════════════════════════════════════════
    const PASS_W  = DOOR_W_OUT + 0.6;  // 6.6, matches door width
    const PASS_XW = 0;
    const PASS_XE = 14;
    const PASS_DX = PASS_XE - PASS_XW;
    const PASS_H  = DOOR_H + 0.5;

    // North wall
    const passWN = new THREE.Mesh(new THREE.BoxGeometry(PASS_DX, PASS_H, WALL_T), matStone);
    passWN.position.set((PASS_XW+PASS_XE)/2, PASS_H/2, -PASS_W/2);
    scene.add(passWN);
    // South wall
    const passWS = passWN.clone(); passWS.position.z = PASS_W/2; scene.add(passWS);
    // Ceiling
    const passCeil = new THREE.Mesh(new THREE.BoxGeometry(PASS_DX, 0.6, PASS_W), matStone);
    passCeil.position.set((PASS_XW+PASS_XE)/2, PASS_H, 0); scene.add(passCeil);
    // Floor
    const passFloor = new THREE.Mesh(new THREE.BoxGeometry(PASS_DX, 0.4, PASS_W), matStone);
    passFloor.position.set((PASS_XW+PASS_XE)/2, -0.2, 0); scene.add(passFloor);

    // Torches flanking passage exit (at x≈12, either side)
    makeTorch(11, 0, -PASS_W/2 + 0.3);
    makeTorch(11, 0,  PASS_W/2 - 0.3);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM SPACE CAVERN WALLS — north and south walls bounding the bridge space
    // x=14→62, ceiling matches hall height
    // ═══════════════════════════════════════════════════════════════════════════
    const CAVN_H  = 30;
    const CAVN_DX = 50;   // x=12→62
    const CAVN_XC = 37;   // centre

    // North cavern wall
    const cavN = new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX, CAVN_H, WALL_T), matStone);
    cavN.position.set(CAVN_XC, CAVN_H/2, -14);
    scene.add(cavN);
    // South cavern wall
    const cavS = cavN.clone(); cavS.position.z = 14; scene.add(cavS);
    // Ceiling
    const cavCeil = new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX, 1.2, 30), matStone);
    cavCeil.position.set(CAVN_XC, CAVN_H, 0); scene.add(cavCeil);

    // Chasm torches — on north and south cavern walls, flanking the bridge
    [20, 28, 34, 40, 46, 54].forEach(tx => {
      makeTorch(tx, 0, -13);   // north wall
      makeTorch(tx, 0,  13);   // south wall
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EAST LANDING + SOUTH CORRIDOR
    // After crossing bridge at x≈60, open landing (x=58→70, z=-6→+14)
    // South corridor runs south from x=58→66, z=+12→+32
    // ═══════════════════════════════════════════════════════════════════════════
    const LAND_H = 20;

    // Landing floor
    const landFloor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 22), matStone);
    landFloor.position.set(62, -0.2, 4);
    scene.add(landFloor);
    // Landing north wall
    const landWN = new THREE.Mesh(new THREE.BoxGeometry(14, LAND_H, WALL_T), matStone);
    landWN.position.set(62, LAND_H/2, -6);
    scene.add(landWN);
    // Landing east wall
    const landWE = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, LAND_H, 22), matStone);
    landWE.position.set(70, LAND_H/2, 4);
    scene.add(landWE);
    // Landing ceiling
    const landCeil = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 22), matStone);
    landCeil.position.set(62, LAND_H, 4);
    scene.add(landCeil);

    // South corridor
    const CORR_W  = 8;
    const CORR_ZN = 12;
    const CORR_ZS = 32;
    const CORR_DZ = CORR_ZS - CORR_ZN;
    const CORR_H  = 14;

    const corrWW = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, CORR_H, CORR_DZ), matStone);
    corrWW.position.set(58, CORR_H/2, (CORR_ZN+CORR_ZS)/2);
    scene.add(corrWW);
    const corrWE = corrWW.clone(); corrWE.position.x = 66; scene.add(corrWE);
    const corrCeil = new THREE.Mesh(new THREE.BoxGeometry(CORR_W, 0.6, CORR_DZ), matStone);
    corrCeil.position.set(62, CORR_H, (CORR_ZN+CORR_ZS)/2); scene.add(corrCeil);
    const corrFloor = new THREE.Mesh(new THREE.BoxGeometry(CORR_W, 0.4, CORR_DZ), matStone);
    corrFloor.position.set(62, -0.2, (CORR_ZN+CORR_ZS)/2); scene.add(corrFloor);

    // Torches along corridor walls
    [14, 20, 26].forEach(tz => {
      makeTorch(59.2, 0, tz);
      makeTorch(64.8, 0, tz);
    });

    // Daylight doorway at south end (glowing rectangle — the Lothlórien light)
    const daylightPane = new THREE.Mesh(new THREE.BoxGeometry(CORR_W - 1, CORR_H - 2, 0.15), matDaylight);
    daylightPane.position.set(62, CORR_H/2 - 0.5, CORR_ZS);
    scene.add(daylightPane);
    // Doorway frame
    const frameB = new THREE.Mesh(new THREE.BoxGeometry(CORR_W + 0.4, 0.5, WALL_T), matStone);
    frameB.position.set(62, 0, CORR_ZS); scene.add(frameB);
    const frameT = frameB.clone(); frameT.position.y = CORR_H - 0.5; scene.add(frameT);
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.5, CORR_H, WALL_T), matStone);
    frameL.position.set(58.5, CORR_H/2, CORR_ZS); scene.add(frameL);
    const frameR = frameL.clone(); frameR.position.x = 65.5; scene.add(frameR);
    // Point light to cast daylight glow into corridor
    const daylightLight = new THREE.PointLight(0x88ffcc, 1.4, 28);
    daylightLight.position.set(62, 6, CORR_ZS - 2);
    scene.add(daylightLight);
    refs.staffLight = daylightLight;  // reuse staffLight slot for daylight (no staff here)

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — deep west behind the hall
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bigFire = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 7), matFireOuter.clone());
      bigFire.position.set(-90, 6, 0);
      scene.add(bigFire);
      refs.balrogFire = bigFire;

      const inner = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 7), matFireCore);
      inner.position.set(-90, 6.5, 0);
      scene.add(inner);

      const balrogLight = new THREE.PointLight(0xff2200, 2.2, 100);
      balrogLight.position.set(-80, 10, 0);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      const balrogFill = new THREE.PointLight(0xff6600, 0.9, 65);
      balrogFill.position.set(-60, 4, 0);
      scene.add(balrogFill);
      refs.balrogFill = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — deep below bridge flanks
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [22, -8], [28, -9], [34, -8], [40, -9], [48, -8],
      [22,  8], [30,  9], [36,  8], [44,  9], [50,  8],
    ].forEach(([fx, fz]) => {
      const baseY = -55 + rnd(-4, 4);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.5, 1.0), 8, 6), matFireOuter.clone());
      outer.position.set(fx, baseY + rnd(1, 3), fz);
      scene.add(outer);
      const fl = new THREE.PointLight(0xff4400, rnd(0.3, 0.8), rnd(14, 24));
      fl.position.set(fx, baseY + 3, fz);
      scene.add(fl);
      refs.chasmLights.push(fl);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GANDALF STAFF — bridge crown (x≈37, y=8+, z=0)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.6, metalness: 0.15 });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7), staffMat);
      staff.position.set(36, 8.0 + 1.6, 0.3);
      staff.rotation.z = 0.04;
      scene.add(staff);

      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff, emissive: 0xaaccff, emissiveIntensity: 3.0, roughness: 0.2,
      });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), tipMat);
      tip.position.set(36, 8.0 + 3.25, 0.3);
      scene.add(tip);
      refs.staffTip = tip;

      const staffPtLight = new THREE.PointLight(0x8899cc, 0.75, 18);
      staffPtLight.position.copy(tip.position);
      scene.add(staffPtLight);
      // Note: refs.staffLight is taken by daylightLight above; store separately
      refs.staffTipLight = staffPtLight;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FAR ENCLOSURE — void boxes sealing the world edges
    // ═══════════════════════════════════════════════════════════════════════════
    // West far wall (beyond moriadoors transition at x=-68)
    const wFar = new THREE.Mesh(new THREE.BoxGeometry(4, 50, 200), matVoid);
    wFar.position.set(-80, 25, 0); scene.add(wFar);
    // South far wall (beyond lothlorien corridor)
    const sFar = new THREE.Mesh(new THREE.BoxGeometry(30, 25, 4), matVoid);
    sFar.position.set(62, 12, 38); scene.add(sFar);
    // North far wall
    const nFar = new THREE.Mesh(new THREE.BoxGeometry(160, 40, 4), matVoid);
    nFar.position.set(0, 20, -28); scene.add(nFar);

    return refs;
  },

  // ─── Per-frame animation ──────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

    // Torches
    refs.torches.forEach((torch, ti) => {
      torch.flames.forEach(sp => {
        const u = sp.userData;
        const f = 0.85 + 0.2 * Math.sin(tt * u.speed * 5.0 + u.phase)
                       + 0.1 * Math.sin(tt * u.speed * 11.0 + u.phase * 2);
        sp.scale.set(u.sz * f, u.sz * 1.6 * f, 1);
        sp.position.y = u.baseY + 0.04 * Math.sin(tt * u.speed * 3.0 + u.phase);
      });
      const pos = torch.ePOS;
      for (let i = 0; i < torch.EC; i++) {
        torch.eLIF[i] -= dt * (0.6 + Math.random() * 0.4);
        if (torch.eLIF[i] <= 0) { torch.resetE(i); }
        else {
          const v = torch.eVEL[i];
          pos[i*3]   += v.x * dt; pos[i*3+1] += v.y * dt; pos[i*3+2] += v.z * dt;
          v.y -= 0.4 * dt;
        }
      }
      torch.eGeo.attributes.position.needsUpdate = true;
      const tl = torch.light;
      if (tl._base === undefined) tl._base = tl.intensity;
      tl.intensity = tl._base * (0.75 + 0.32 * Math.sin(tt * 5.7 + ti * 2.1)
                                       + 0.12 * Math.sin(tt * 11.3 + ti * 0.9));
    });

    // Chasm lights
    refs.chasmLights.forEach((light, i) => {
      if (light._base === undefined) light._base = light.intensity;
      light.intensity = light._base * (0.7 + 0.38 * Math.sin(tt * 4.8 + i * 1.9)
                                           + 0.12 * Math.sin(tt * 9.3 + i * 0.8));
    });

    // Balrog
    if (refs.balrogGlow)
      refs.balrogGlow.intensity = 2.2 * (0.72 + 0.38 * Math.sin(tt * 1.1) + 0.18 * Math.sin(tt * 2.7));
    if (refs.balrogFill)
      refs.balrogFill.intensity = 0.9 + 0.4 * Math.sin(tt * 1.6 + 0.4);
    if (refs.balrogFire)
      refs.balrogFire.scale.setScalar(0.88 + 0.18 * Math.sin(tt * 3.0) + 0.09 * Math.sin(tt * 6.5));

    // Gandalf staff tip
    if (refs.staffTip)
      refs.staffTip.material.emissiveIntensity = 3.0 * (0.82 + 0.22 * Math.sin(tt * 2.1) + 0.08 * Math.sin(tt * 5.3));
    if (refs.staffTipLight)
      refs.staffTipLight.intensity = 0.75 + 0.28 * Math.sin(tt * 2.0);

    // Daylight — gentle pulse (breeze outside)
    if (refs.staffLight)
      refs.staffLight.intensity = 1.4 + 0.15 * Math.sin(tt * 0.7);
  },

};

window.MoriaBridge = MoriaBridge;
