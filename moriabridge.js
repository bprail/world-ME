// moriabridge.js — Durin's Bridge, Moria
// Sequence: moriadoors (north, -Z) → cross south (+Z) → lothlorien
//
// Layout:
//   [moriadoors transition z=-100] ← NORTH HALL (spawn, z=-52 to -100) ← splayed arch at z=-52
//   hallway z=-52 to -40 → open chasm space → bridge ramp z=-33
//   BRIDGE CROWN (arched) z=-20 to +20
//   bridge ramp z=+20 to +33 → flat east alcove (z=38, runs +X to x=28)
//   [lothlorien transition x=28, z=38]

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
      { color: 0xcc3300, intensity: 0.55, x: 0,  y: 20, z: -130 },  // balrog deep north
      { color: 0x551100, intensity: 0.28, x: 0,  y: -30, z: 0   },  // chasm ember up-light
      { color: 0x6a3010, intensity: 0.20, x: 0,  y: 15,  z: -75 },  // hall fill
      { color: 0x441a06, intensity: 0.14, x: 14, y: 6,   z: 40  },  // south alcove fill
    ],
  },

  // ─── Terrain — near-flat; geometry provides all structure ───────────────────
  hillHeight(x, z) {
    return window.api_noise2d(x * 0.06, z * 0.06) * 0.5;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    return [ lerp(0.07, 0.14, n), lerp(0.05, 0.09, n), lerp(0.04, 0.08, n) ];
  },

  onPath: (() => 0),

  // ─── Lore (book order: north hall → bridge → south alcove) ──────────────────
  lorePoints: [
    {
      pos: { x: 0, z: -82 }, radius: 8,
      text: '"Doom, doom, doom the drums in the deep... They are coming."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: 0, z: -36 }, radius: 6,
      text: '"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite: '— Gandalf the Grey, at the Bridge of Khazad-dûm',
    },
    {
      pos: { x: 0, z: 0 }, radius: 5,
      text: '"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: 0, z: 36 }, radius: 6,
      text: '"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
    {
      pos: { x: 16, z: 38 }, radius: 6,
      text: '"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring',
    },
  ],

  // ─── Player start / arrivals ─────────────────────────────────────────────────
  start: { x: 0, z: -88, yaw: Math.PI },

  arrivals: {
    moriadoors: { x: 0,  z: -92, yaw: Math.PI       },  // deep in hall, face south
    lothlorien: { x: 26, z:  38, yaw: Math.PI * 1.5 },  // east end of alcove, face west
  },

  // ─── Boundary ────────────────────────────────────────────────────────────────
  boundary: 120,

  // ─── Transitions ─────────────────────────────────────────────────────────────
  transitions: [
    { trigger: { x: 0,  z: -98, radius: 7 }, to: 'moriadoors' },
    { trigger: { x: 28, z:  38, radius: 5 }, to: 'lothlorien' },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  // All yaw:0 segments run N-S along Z. The east alcove uses yaw:π*0.5 (E-W).
  // Walkable z-centres and lengths are derived directly from the addSlab endpoints.
  walkables: [
    // North hall floor (z=-52 to -100, centre=-76, length=48)
    { x: 0, z: -76, yaw: 0, length: 48, width: 32, yStart: 0.0, yEnd: 0.0 },

    // Hallway (z=-52 to -40, centre=-46, length=12)
    { x: 0, z: -46, yaw: 0, length: 12, width: 5.5, yStart: 0.0, yEnd: 0.0 },

    // Flat approach from hallway exit to bridge ramp base (z=-40 to -33)
    { x: 0, z: -36, yaw: 0, length:  8, width: 5.5, yStart: 0.0, yEnd: 0.0 },

    // Bridge north ramp (z=-33 to -20, centre=-26.5, length=13)
    { x: 0, z: -26.5, yaw: 0, length: 13, width: 2.2, yStart: 0.0, yEnd: 4.5 },

    // Bridge arch — 5 segments (z=-20→+20 in 10-unit steps)
    { x: 0, z: -15, yaw: 0, length: 10, width: 1.4, yStart: 4.5, yEnd: 6.5 },
    { x: 0, z:  -5, yaw: 0, length: 10, width: 1.4, yStart: 6.5, yEnd: 8.0 },
    { x: 0, z:   5, yaw: 0, length: 10, width: 1.4, yStart: 8.0, yEnd: 6.5 },
    { x: 0, z:  15, yaw: 0, length: 10, width: 1.4, yStart: 6.5, yEnd: 4.5 },

    // Bridge south ramp (z=+20 to +33, centre=+26.5, length=13)
    { x: 0, z: 26.5, yaw: 0, length: 13, width: 2.2, yStart: 4.5, yEnd: 0.0 },

    // South alcove — flat floor running east from x=0 to x=28, centred on z=38
    // Represented as two walkables: the N-S approach pad then the E-W run
    { x: 0,  z: 38, yaw: 0,            length:  8, width: 8,  yStart: 0.0, yEnd: 0.0 },
    { x: 16, z: 38, yaw: Math.PI * 0.5, length: 24, width: 8, yStart: 0.0, yEnd: 0.0 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  barriers: [
    // Chasm flanks — only over the chasm band (z=-28 to +28)
    // Inner edge at x=±1.6 (bridge half-width 0.7 + small margin)
    { x: -8, z: 0, w: 13, d: 56, yaw: 0 },
    { x:  8, z: 0, w: 13, d: 56, yaw: 0 },

    // North hall side walls
    { x: -18, z: -76, w: 4, d: 52, yaw: 0 },
    { x:  18, z: -76, w: 4, d: 52, yaw: 0 },
    // Hall north back wall
    { x:   0, z: -103, w: 44, d: 6, yaw: 0 },

    // Hallway walls
    { x: -4, z: -46, w: 3, d: 14, yaw: 0 },
    { x:  4, z: -46, w: 3, d: 14, yaw: 0 },

    // South alcove — back wall (north side at z=34) and east end wall
    { x: 14, z: 34, w: 36, d: 3, yaw: 0 },   // north wall of alcove
    { x: 14, z: 42, w: 36, d: 3, yaw: 0 },   // south wall of alcove
    { x: 30, z: 38, w:  3, d: 12, yaw: 0 },  // east end wall (beyond transition)
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
      roughness: 0.8, transparent: true, opacity: 0.65,
    });
    const matFireCore = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 3.5, roughness: 0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xdd1100, emissiveIntensity: 2.0,
      roughness: 0.5, transparent: true, opacity: 0.70,
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

      const light = new THREE.PointLight(0xff6622, 0.9, 10);
      light.position.set(wx, fireBase + 0.3, wz);
      scene.add(light);

      refs.torches.push({ flames, pts, eGeo, ePOS, eVEL, eLIF, EC, resetE, light });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE — sloped slabs via addSlab helper
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

    addSlab(-33, -20, 0.0, 4.5, 2.2);   // north ramp
    addSlab(-20, -10, 4.5, 6.5, 1.4);   // arch seg 1
    addSlab(-10,   0, 6.5, 8.0, 1.4);   // arch seg 2
    addSlab(  0,  10, 8.0, 6.5, 1.4);   // arch seg 3 (crown → south)
    addSlab( 10,  20, 6.5, 4.5, 1.4);   // arch seg 4
    addSlab( 20,  33, 4.5, 0.0, 2.2);   // south ramp

    // Thin side kerbs along the narrow span
    const addKerb = (zStart, zEnd, y0, y1, side) => {
      const dz = zEnd - zStart, dy = y1 - y0;
      const len = Math.sqrt(dz*dz + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, len), matBridge);
      mesh.position.set(side * (0.7 + 0.09), (y0+y1)/2 + 0.14, (zStart+zEnd)/2);
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
    // CHASM VOID — walls flush with ground (top at y=0), deep enough for fog fade
    // Width covers from x=±2 outward; d=56 matches chasm band z=±28
    // ═══════════════════════════════════════════════════════════════════════════
    const CHASM_H   = 110;
    const CHASM_TOP = 0;    // top of chasm walls at ground level, no terrain gap
    const chasmWall = (cx, cz, w, d) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, CHASM_H, d), matVoid);
      m.position.set(cx, CHASM_TOP - CHASM_H / 2, cz);
      scene.add(m);
    };
    chasmWall(-9, 0, 16, 68);   // west flank
    chasmWall( 9, 0, 16, 68);   // east flank

    // Chasm floor — very deep
    const chasmFloor = new THREE.Mesh(new THREE.BoxGeometry(36, 2, 72), matVoid);
    chasmFloor.position.set(0, CHASM_TOP - CHASM_H - 1, 0);
    scene.add(chasmFloor);

    // Glowing crack
    const crack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 60), matCrack);
    crack.position.set(0, CHASM_TOP - CHASM_H, 0);
    scene.add(crack);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH HALL — longer entrance chamber (z=-52 to z=-100), ceiling y=30
    // ═══════════════════════════════════════════════════════════════════════════
    const HALL_ZN   = -100;
    const HALL_ZS   = -52;   // south face = doorway z
    const HALL_XW   = -18;
    const HALL_XE   =  18;
    const HALL_H    = 30;
    const WALL_T    = 1.4;
    const HALL_W    = HALL_XE - HALL_XW;  // 36
    const HALL_D    = HALL_ZS - HALL_ZN;  // 48

    // Floor slab
    const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.6, HALL_D), matStone);
    hallFloor.position.set(0, -0.3, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallFloor);
    // Ceiling slab
    const hallCeil = new THREE.Mesh(new THREE.BoxGeometry(HALL_W+4, 1.2, HALL_D+4), matStone);
    hallCeil.position.set(0, HALL_H, (HALL_ZN+HALL_ZS)/2);
    scene.add(hallCeil);
    // North back wall
    const hallWallN = new THREE.Mesh(new THREE.BoxGeometry(HALL_W+4, HALL_H+2, WALL_T), matStone);
    hallWallN.position.set(0, HALL_H/2, HALL_ZN);
    scene.add(hallWallN);
    // East & west walls
    const hwallGeo = new THREE.BoxGeometry(WALL_T, HALL_H+2, HALL_D);
    const hwallL = new THREE.Mesh(hwallGeo, matStone);
    hwallL.position.set(HALL_XW, HALL_H/2, (HALL_ZN+HALL_ZS)/2);
    scene.add(hwallL);
    const hwallR = hwallL.clone(); hwallR.position.x = HALL_XE; scene.add(hwallR);

    // Hall columns — 4 pairs
    const COL_H = HALL_H + 2;
    [[-12,-64],[12,-64], [-12,-76],[12,-76], [-12,-88],[12,-88], [-12,-97],[12,-97]].forEach(([cx,cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, COL_H, 9), matStone);
      col.position.set(cx, COL_H/2, cz);
      scene.add(col);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 2.6), matStone);
      cap.position.set(cx, COL_H - 0.35, cz);
      scene.add(cap);
    });

    // Hall torches — on the side walls between columns
    [[-16,-64],[16,-64], [-16,-76],[16,-76], [-16,-88],[16,-88]].forEach(([tx,tz]) => makeTorch(tx, 0, tz));

    // ═══════════════════════════════════════════════════════════════════════════
    // DOORWAY ARCH — splayed/sloped walls at hall south face (z = HALL_ZS = -52)
    // The opening is narrow at the outside face and widens toward the hall.
    // Achieved by two wedge-shaped wall sections rotated in Y.
    // ═══════════════════════════════════════════════════════════════════════════
    const DOOR_W_OUT = 4.2;   // opening width at outside face
    const DOOR_W_IN  = 7.0;   // opening width at hall side (splayed reveal)
    const DOOR_H     = 8.0;   // door height at centre keystone
    const DOOR_Z     = HALL_ZS;
    const SPLAY_D    = 3.0;   // depth of the splayed passage

    // Splay angle: half-width difference over depth
    const splayAngle = Math.atan2((DOOR_W_IN - DOOR_W_OUT) / 2, SPLAY_D);

    // Left splayed jamb — a box rotated so its face angles outward
    const jambW = Math.sqrt(SPLAY_D*SPLAY_D + ((DOOR_W_IN-DOOR_W_OUT)/2)**2) + 1.0;
    const jambH_geom = DOOR_H - 1.8;   // height of the straight part below the lintel slope

    const makeJamb = (side) => {
      // Vertical jamb fill
      const j = new THREE.Mesh(new THREE.BoxGeometry(jambW, jambH_geom, WALL_T + 0.1), matStone);
      j.rotation.y = side * splayAngle;
      const ox = side * (DOOR_W_OUT/2 + jambW/2 * Math.cos(splayAngle) - 0.3);
      j.position.set(ox, jambH_geom/2, DOOR_Z - SPLAY_D/2);
      scene.add(j);
    };
    makeJamb(-1); makeJamb(1);

    // Wall panels flanking the door (straight vertical, outside the splay)
    const panelW = (HALL_W - DOOR_W_OUT) / 2 - 0.5;
    [-1, 1].forEach(side => {
      // Outer solid wall panel
      const p = new THREE.Mesh(new THREE.BoxGeometry(panelW, HALL_H, WALL_T), matStone);
      p.position.set(side * (DOOR_W_OUT/2 + panelW/2), HALL_H/2, DOOR_Z);
      scene.add(p);
      // Transom fill above door on each side already handled by the transom block below
    });
    // Transom above door
    const transomH = HALL_H - DOOR_H;
    const transom = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W_OUT, transomH, WALL_T), matStone);
    transom.position.set(0, DOOR_H + transomH/2, DOOR_Z);
    scene.add(transom);

    // Sloped lintels (/-\): left rises, right descends, meeting at keystone
    const jambTopY = jambH_geom;
    const keystoneY = DOOR_H;
    [[- DOOR_W_OUT/2, 0], [0, DOOR_W_OUT/2]].forEach(([x0, x1], idx) => {
      const y0 = idx === 0 ? jambTopY : keystoneY;
      const y1 = idx === 0 ? keystoneY : jambTopY;
      const dx = x1-x0, dy = y1-y0;
      const len = Math.sqrt(dx*dx + dy*dy);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, WALL_T+0.2), matStone);
      mesh.position.set((x0+x1)/2, (y0+y1)/2, DOOR_Z);
      mesh.rotation.z = Math.atan2(dy, dx);
      scene.add(mesh);
    });
    // Keystone
    const ks = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, WALL_T+0.4), matStone);
    ks.position.set(0, keystoneY + 0.1, DOOR_Z);
    scene.add(ks);

    // ═══════════════════════════════════════════════════════════════════════════
    // HALLWAY — z=-52 to z=-40, narrow tunnel between arch and chasm space
    // ═══════════════════════════════════════════════════════════════════════════
    const HW_W  = DOOR_W_OUT + 0.6;
    const HW_ZN = DOOR_Z;       // -52
    const HW_ZS = -40;
    const HW_H  = DOOR_H + 0.5;
    const HW_D  = HW_ZS - HW_ZN; // 12 (positive = south)

    const hwGeoW = new THREE.BoxGeometry(WALL_T, HW_H, HW_D);
    const hwL = new THREE.Mesh(hwGeoW, matStone);
    hwL.position.set(-HW_W/2, HW_H/2, (HW_ZN+HW_ZS)/2);
    scene.add(hwL);
    const hwR = hwL.clone(); hwR.position.x = HW_W/2; scene.add(hwR);
    const hwCeil = new THREE.Mesh(new THREE.BoxGeometry(HW_W, 0.6, HW_D), matStone);
    hwCeil.position.set(0, HW_H, (HW_ZN+HW_ZS)/2); scene.add(hwCeil);
    const hwFloor = new THREE.Mesh(new THREE.BoxGeometry(HW_W, 0.4, HW_D), matStone);
    hwFloor.position.set(0, -0.2, (HW_ZN+HW_ZS)/2); scene.add(hwFloor);

    // ── Torches flanking the hallway exit into the chasm space ────────────────
    // Mounted on the hallway walls near z=-40, visible as the player emerges
    [[-HW_W/2 - 0.1, -44], [HW_W/2 + 0.1, -44]].forEach(([tx, tz]) => makeTorch(tx, 0, tz));

    // ── Chasm-side torches on the cavern walls flanking the bridge approach ───
    // Mounted on the broad cavern walls, left and right, z=-38 to -34
    [[-12, -38], [12, -38], [-12, -34], [12, -34]].forEach(([tx, tz]) => makeTorch(tx, 0, tz));

    // ═══════════════════════════════════════════════════════════════════════════
    // CAVERN SPACE — walls bounding the chasm and bridge area
    // West and east walls run the full N-S length of the open chasm space
    // ═══════════════════════════════════════════════════════════════════════════
    const CAVERN_H   = 35;
    const CAVERN_ZN  = -40;   // where hallway ends
    const CAVERN_ZS  =  40;   // where south alcove begins
    const CAVERN_D   = CAVERN_ZS - CAVERN_ZN;  // 80
    const CAVERN_XW  = -18;
    const CAVERN_XE  =  18;

    const cavWallGeo = new THREE.BoxGeometry(WALL_T, CAVERN_H, CAVERN_D);
    const cavWallW = new THREE.Mesh(cavWallGeo, matStone);
    cavWallW.position.set(CAVERN_XW, CAVERN_H/2, (CAVERN_ZN+CAVERN_ZS)/2);
    scene.add(cavWallW);
    const cavWallE = cavWallW.clone(); cavWallE.position.x = CAVERN_XE; scene.add(cavWallE);

    // Ceiling over chasm space
    const cavCeil = new THREE.Mesh(new THREE.BoxGeometry(CAVERN_XE-CAVERN_XW+4, 1.2, CAVERN_D), matStone);
    cavCeil.position.set(0, CAVERN_H, (CAVERN_ZN+CAVERN_ZS)/2);
    scene.add(cavCeil);

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUTH ALCOVE — flat ledge to the east after crossing the bridge
    // Player exits south ramp at z≈+33, turns right (+X), follows alcove to x=28
    // ═══════════════════════════════════════════════════════════════════════════
    const ALC_Z   = 38;     // z-centre of the alcove
    const ALC_ZH  = 4;      // half-width N-S = 4 → 8 total
    const ALC_XW  = -2;     // west edge (slightly west of bridge centreline)
    const ALC_XE  = 30;     // east end (beyond transition trigger at x=28)
    const ALC_H   = 14;     // ceiling height
    const ALC_D   = ALC_XE - ALC_XW;  // 32

    // Floor
    const alcFloor = new THREE.Mesh(new THREE.BoxGeometry(ALC_D, 0.4, ALC_ZH*2), matStone);
    alcFloor.position.set((ALC_XW+ALC_XE)/2, -0.2, ALC_Z);
    scene.add(alcFloor);

    // North wall (the cavern face the player walks alongside)
    const alcWallN = new THREE.Mesh(new THREE.BoxGeometry(ALC_D, ALC_H, WALL_T), matStone);
    alcWallN.position.set((ALC_XW+ALC_XE)/2, ALC_H/2, ALC_Z - ALC_ZH);
    scene.add(alcWallN);

    // South wall (void side — lower parapet)
    const alcParapet = new THREE.Mesh(new THREE.BoxGeometry(ALC_D, 1.0, WALL_T), matStone);
    alcParapet.position.set((ALC_XW+ALC_XE)/2, 0.5, ALC_Z + ALC_ZH);
    scene.add(alcParapet);

    // Ceiling
    const alcCeil = new THREE.Mesh(new THREE.BoxGeometry(ALC_D, 0.6, ALC_ZH*2), matStone);
    alcCeil.position.set((ALC_XW+ALC_XE)/2, ALC_H, ALC_Z);
    scene.add(alcCeil);

    // East end wall (beyond transition)
    const alcEndWall = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, ALC_H, ALC_ZH*2+2), matStone);
    alcEndWall.position.set(ALC_XE, ALC_H/2, ALC_Z);
    scene.add(alcEndWall);

    // Void underskirt below alcove parapet
    const alcSkirt = new THREE.Mesh(new THREE.BoxGeometry(ALC_D, 8, ALC_ZH*2), matVoid);
    alcSkirt.position.set((ALC_XW+ALC_XE)/2, -4.4, ALC_Z);
    scene.add(alcSkirt);

    // Torches along the north wall of the alcove
    [[6, ALC_Z-ALC_ZH+0.2], [14, ALC_Z-ALC_ZH+0.2], [22, ALC_Z-ALC_ZH+0.2]].forEach(([tx, tz]) => {
      makeTorch(tx, 0, tz);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — deep north, behind the hall
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bigFire = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 7), matFireOuter.clone());
      bigFire.position.set(0, 6, -115);
      scene.add(bigFire);
      refs.balrogFire = bigFire;

      const inner = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 7), matFireCore);
      inner.position.set(0, 6.5, -115);
      scene.add(inner);

      const balrogLight = new THREE.PointLight(0xff2200, 2.2, 100);
      balrogLight.position.set(0, 10, -108);
      scene.add(balrogLight);
      refs.balrogGlow = balrogLight;

      const balrogFill = new THREE.PointLight(0xff6600, 0.9, 70);
      balrogFill.position.set(0, 4, -85);
      scene.add(balrogFill);
      refs.balrogFill = balrogFill;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — deep below the bridge, visible on both flanks
    // ═══════════════════════════════════════════════════════════════════════════
    [
      [-8, -22], [-10, -8], [-8,  8], [-10,  20],
      [ 8,  18], [ 10,  4], [ 8, -12], [ 10, -26],
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
    // GANDALF STAFF — bridge crown, facing north toward Balrog
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.6, metalness: 0.15 });
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.2, 7), staffMat);
      staff.position.set(0.3, 8.0 + 1.6, -1);
      staff.rotation.z = 0.04;
      scene.add(staff);

      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xddeeff, emissive: 0xaaccff, emissiveIntensity: 3.0, roughness: 0.2,
      });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), tipMat);
      tip.position.set(0.3, 8.0 + 3.25, -1);
      scene.add(tip);
      refs.staffTip = tip;

      const staffLight = new THREE.PointLight(0x8899cc, 0.75, 18);
      staffLight.position.copy(tip.position);
      scene.add(staffLight);
      refs.staffLight = staffLight;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FAR ENCLOSURE — void boxes beyond the playable edges
    // ═══════════════════════════════════════════════════════════════════════════
    // North back wall (beyond hall, beyond moriadoors transition at z=-98)
    const nWall = new THREE.Mesh(new THREE.BoxGeometry(200, 50, 4), matVoid);
    nWall.position.set(0, 25, -112); scene.add(nWall);

    // West enclosure
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(4, 50, 220), matVoid);
    wWall.position.set(-95, 25, 0); scene.add(wWall);

    // East end wall beyond alcove
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(4, 20, 20), matVoid);
    eWall.position.set(36, 10, ALC_Z); scene.add(eWall);

    return refs;
  },

  // ─── Per-frame animation ──────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

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
        if (torch.eLIF[i] <= 0) {
          torch.resetE(i);
        } else {
          const v = torch.eVEL[i];
          pos[i*3]   += v.x * dt;
          pos[i*3+1] += v.y * dt;
          pos[i*3+2] += v.z * dt;
          v.y -= 0.4 * dt;
        }
      }
      torch.eGeo.attributes.position.needsUpdate = true;

      const tl = torch.light;
      if (tl._base === undefined) tl._base = tl.intensity;
      tl.intensity = tl._base * (0.75 + 0.32 * Math.sin(tt * 5.7 + ti * 2.1)
                                       + 0.12 * Math.sin(tt * 11.3 + ti * 0.9));
    });

    refs.chasmLights.forEach((light, i) => {
      if (light._base === undefined) light._base = light.intensity;
      light.intensity = light._base * (0.7 + 0.38 * Math.sin(tt * 4.8 + i * 1.9)
                                           + 0.12 * Math.sin(tt * 9.3 + i * 0.8));
    });

    if (refs.balrogGlow) {
      refs.balrogGlow.intensity = 2.2 * (0.72 + 0.38 * Math.sin(tt * 1.1) + 0.18 * Math.sin(tt * 2.7));
    }
    if (refs.balrogFill) {
      refs.balrogFill.intensity = 0.9 + 0.4 * Math.sin(tt * 1.6 + 0.4);
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
