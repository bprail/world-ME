// moriabridge.js — Durin's Bridge, Moria
// Layout runs west→east along +X axis.
// Yaw convention: 0=north(-Z), π/2=west(-X), π=south(+Z), 3π/2=east(+X)
//
//  [moriadoors, x≈-85] ← HALL (x=-70→0) ← arch at x=0
//  PASSAGE (x=0→20) → open chasm space → bridge ramp at x=22
//  BRIDGE (x=22→62) over chasm
//  north wall blocks x=62,z<0 → player turns south onto LANDING (x=54→70,z=0→14)
//  SOUTH CORRIDOR (x=58→66,z=14→32) → ANTE-ROOM (z=32→46) → [lothlorien, z≈50]

const MoriaBridge = {

  name:     "Durin's Bridge",
  subtitle: "Moria · The Bridge of Khazad-dûm",

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
      { color: 0xcc3300, intensity: 0.55, x: -120, y: 20, z:   0 },  // balrog west
      { color: 0x551100, intensity: 0.28, x:   42, y:-30, z:   0 },  // chasm ember
      { color: 0x6a3010, intensity: 0.20, x:  -35, y: 15, z:   0 },  // hall fill
      { color: 0x88ccaa, intensity: 0.40, x:   74, y:  8, z:  36 },  // lothlorien spill
    ],
  },

  hillHeight(x, z) {
    const noise = window.api_noise2d(x * 0.06, z * 0.06) * 0.5;
    // Chasm band: x=22→68, z=±9 — terrain drops sharply into the void
    const inChasmX = x > 28 && x < 68;
    const chasmZFade = Math.max(0, 1 - Math.abs(z) / 9);   // 1 at z=0, 0 at z=±9
    const chasmXFade = inChasmX
      ? Math.min(1, Math.min(x - 22, 68 - x) / 4)          // ramp in over 4 units at each edge
      : 0;
    const chasmDrop = chasmZFade * chasmXFade * 30;         // max 30 units deep
    return noise - chasmDrop;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.08, vz * 0.08);
    return [ lerp(0.07, 0.14, n), lerp(0.05, 0.09, n), lerp(0.04, 0.08, n) ];
  },

  onPath: (() => 0),

  lorePoints: [
    { pos:{x:-40,z:0}, radius:8,
      text:'"Doom, doom, doom the drums in the deep... They are coming."',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring, Book II' },
    { pos:{x:14,z:0}, radius:6,
      text:'"You cannot pass! I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn."',
      cite:'— Gandalf the Grey, at the Bridge of Khazad-dûm' },
    { pos:{x:42,z:0}, radius:5,
      text:'"The Bridge of Khazad-dûm was slender and had no rail or curb. It spanned the chasm with one curving spring of fifty feet."',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring' },
    { pos:{x:70,z:2}, radius:6,
      text:'"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring' },
    { pos:{x:74,z:22}, radius:6,
      text:'"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring' },
  ],

  // Facing east = yaw 3π/2
  start: { x: -50, z: 0, yaw: Math.PI * 1.5 },

  arrivals: {
    moriadoors: { x: -55, z: 0, yaw: Math.PI * 1.5 },   // deep in hall, face east
    lothlorien: { x:  74, z: 15, yaw: 0 },   // corridor, face north into the scene (light behind)
  },

  boundary: 120,

  transitions: [
    { trigger: { x: -70, z:  0, radius: 7 }, to: 'moriadoors' },
    { trigger: { x:  74, z: 26, radius: 4 }, to: 'lothlorien' },
  ],

  // Only the elevated bridge needs walkables — everything else is ground-level terrain.
  // All segments use width:2.2 throughout so walkable coverage is seamless.
  // yaw π*1.5 = segment runs east-west (along X axis).
  walkables: [
    // Bridge west ramp (x=24→32, rises 0→4)
    { x:28,   z:0, yaw:Math.PI*1.5, length:8, width:2.2, yStart:0.0, yEnd:4.0 },
    // Arch seg 1 (x=32→39, rises 4→6.5)
    { x:35.5, z:0, yaw:Math.PI*1.5, length:7, width:2.2, yStart:4.0, yEnd:6.5 },
    // Arch seg 2 (x=39→44, rises 6.5→8)
    { x:41.5, z:0, yaw:Math.PI*1.5, length:5, width:2.2, yStart:6.5, yEnd:8.0 },
    // Crown (x=44→48, flat 8)
    { x:46,   z:0, yaw:Math.PI*1.5, length:4, width:2.2, yStart:8.0, yEnd:8.0 },
    // Arch seg 3 (x=48→53, descends 8→6.5)
    { x:50.5, z:0, yaw:Math.PI*1.5, length:5, width:2.2, yStart:8.0, yEnd:6.5 },
    // Arch seg 4 (x=53→60, descends 6.5→4)
    { x:56.5, z:0, yaw:Math.PI*1.5, length:7, width:2.2, yStart:6.5, yEnd:4.0 },
    // East ramp (x=60→68, descends 4→0)
    { x:64,   z:0, yaw:Math.PI*1.5, length:8, width:2.2, yStart:4.0, yEnd:0.0 },
  ],

  // Barriers flush with walkable edges: half-width 1.1 → inner edge at z=±1.1
  // centre z = ±(1.1 + 7) = ±8.1, d=14 → inner edge exactly at ±1.1, no gap.
  barriers: [
    // Chasm north flank — covers x=24→68
    { x:46, z:-8.1, w:44, d:14, yaw:0 },
    // Chasm south flank — covers x=24→68
    { x:46, z: 8.1, w:44, d:14, yaw:0 },
  ],

  buildScene(THREE, scene, groundY, MAT, FX) {

    const refs = {
      staffTip:      null,
      staffTipLight: null,
      daylightLight: null,
      time:          0,
    };

    const rnd = (a, b) => a + Math.random() * (b - a);

    // ── Materials ──────────────────────────────────────────────────────────────
    const matStone  = new THREE.MeshStandardMaterial({ color:0x1c1614, roughness:0.93, metalness:0.04 });
    const matBridge = new THREE.MeshStandardMaterial({ color:0x18120e, roughness:0.95, metalness:0.03 });
    const matVoid   = new THREE.MeshStandardMaterial({ color:0x020101, roughness:1.0,  metalness:0.0  });
    const matCrack  = new THREE.MeshStandardMaterial({
      color:0x330800, emissive:0xaa1800, emissiveIntensity:1.1, roughness:1.0,
      transparent:true, opacity:0.65,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // BRIDGE — slabs along X axis, rotate around Z
    // ═══════════════════════════════════════════════════════════════════════════
    const BD = 0.36;
    const addSlabX = (x0, x1, y0, y1, width) => {
      const dx=x1-x0, dy=y1-y0, len=Math.sqrt(dx*dx+dy*dy);
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,BD,width),matBridge);
      mesh.position.set((x0+x1)/2,(y0+y1)/2,0);
      mesh.rotation.z=Math.atan2(dy,dx);
      mesh.castShadow=true; scene.add(mesh);
    };
    addSlabX(24, 32, 0.0, 4.0, 2.2);
    addSlabX(32, 39, 4.0, 6.5, 1.4);
    addSlabX(39, 44, 6.5, 8.0, 1.4);
    addSlabX(44, 48, 8.0, 8.0, 1.4);
    addSlabX(48, 53, 8.0, 6.5, 1.4);
    addSlabX(53, 60, 6.5, 4.0, 1.4);
    addSlabX(60, 68, 4.0, 0.0, 2.2);

    // Side kerbs
    const addKerbX = (x0,x1,y0,y1,side) => {
      const dx=x1-x0,dy=y1-y0,len=Math.sqrt(dx*dx+dy*dy);
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,0.28,0.18),matBridge);
      mesh.position.set((x0+x1)/2,(y0+y1)/2+0.14,side*(0.7+0.09));
      mesh.rotation.z=Math.atan2(dy,dx); scene.add(mesh);
    };
    [-1,1].forEach(s=>{
      addKerbX(32,39,4.0,6.5,s); addKerbX(39,44,6.5,8.0,s);
      addKerbX(44,48,8.0,8.0,s); addKerbX(48,53,8.0,6.5,s);
      addKerbX(53,60,6.5,4.0,s);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM — two-component design:
    //   1. The terrain mesh naturally drops (hillHeight returns ~-30 in chasm band)
    //   2. A pitch-black void box near the bottom hides the terrain floor,
    //      making the chasm read as bottomless. Fog handles the fade above it.
    //
    // The terrain drop is handled in hillHeight — no side wall boxes needed.
    // We only need thin void side-wall boxes to prevent seeing through the
    // terrain mesh sides, and the bottom void box.
    // ═══════════════════════════════════════════════════════════════════════════
    const CHASM_X0=28, CHASM_X1=68, CHASM_DX=CHASM_X1-CHASM_X0;
    const CHASM_DROP = -28;   // terrain bottom of chasm (matches hillHeight minimum)

    // No side wall boxes — terrain drop handles the chasm sides naturally.

    // Bottom void box — pitch black, sits just above the terrain floor.
    // Blocks the view of the actual terrain bottom so it looks like infinite depth.
    // Positioned so its TOP is at CHASM_DROP + a few units (the fog handles the rest).
    const VOID_BOX_TOP = CHASM_DROP + 4;  // top of void box, slightly above terrain bottom
    const VOID_BOX_H   = 30;              // tall enough that fog fully hides the lower edge
    const voidBox = new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX + 4, VOID_BOX_H, 22), matVoid);
    voidBox.position.set((CHASM_X0+CHASM_X1)/2, VOID_BOX_TOP - VOID_BOX_H/2, 0);
    scene.add(voidBox);

    // Glowing crack on top of the void box — ember light from below
    const ck=new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX-4, 0.3, 1.4), matCrack);
    ck.position.set((CHASM_X0+CHASM_X1)/2, VOID_BOX_TOP, 0);
    scene.add(ck);

    // ═══════════════════════════════════════════════════════════════════════════
    // NORTH HALL — x=-70→0, z=-20→+20, ceiling y=30
    // ═══════════════════════════════════════════════════════════════════════════
    const HALL_H=30, WALL_T=1.4;
    // Floor
    const hf=new THREE.Mesh(new THREE.BoxGeometry(70,0.6,40),matStone);
    hf.position.set(-35,-0.3,0); scene.add(hf);
    // Ceiling
    const hc=new THREE.Mesh(new THREE.BoxGeometry(74,1.2,44),matStone);
    hc.position.set(-35,HALL_H,0); scene.add(hc);
    // West back wall
    const hwW=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,HALL_H+2,44),matStone);
    hwW.position.set(-70,HALL_H/2,0); scene.add(hwW);
    // North wall
    const hwN=new THREE.Mesh(new THREE.BoxGeometry(70,HALL_H+2,WALL_T),matStone);
    hwN.position.set(-35,HALL_H/2,-20); scene.add(hwN);
    // South wall
    const hwS=hwN.clone(); hwS.position.z=20; scene.add(hwS);

    // Columns — two rows (z=±13), six pairs along X
    const COL_H=HALL_H+2;
    [-60,-50,-40,-30,-20,-10].forEach(cx=>{
      [-13,13].forEach(cz=>{
        const col=new THREE.Mesh(new THREE.CylinderGeometry(0.8,1.1,COL_H,9),matStone);
        col.position.set(cx,COL_H/2,cz); scene.add(col);
        const cap=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.7,2.6),matStone);
        cap.position.set(cx,COL_H-0.35,cz); scene.add(cap);
      });
    });

    // Hall torches — on north (z≈-17) and south (z≈+17) walls between columns
    [-65,-55,-45,-35,-25,-15,-5].forEach(tx=>{
      FX.makeTorch(tx, 0, -17);
      FX.makeTorch(tx, 0,  17);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EAST HALL FACE — trapezoidal arch doorway at x=0
    // Face is the Z-Y plane. Lintels slope in Z (rotate around X axis).
    // Splayed jambs widen from DOOR_W_OUT at x=0 to DOOR_W_IN at x=-SPLAY_D.
    // ═══════════════════════════════════════════════════════════════════════════
    const DOOR_W_OUT=6.0, DOOR_W_IN=9.0, DOOR_H=8.5;
    const SPLAY_D=3.5;
    const splayDZ=(DOOR_W_IN-DOOR_W_OUT)/2;           // 1.5
    const splayAng=Math.atan2(splayDZ, SPLAY_D);      // angle in X-Z plane
    const jambLen=Math.sqrt(SPLAY_D*SPLAY_D+splayDZ*splayDZ)+0.8;
    const jambH_g=DOOR_H-2.2;

    // Side wall panels left of opening (north side, z < -DOOR_W_OUT/2)
    const panelDZ=(20-DOOR_W_OUT/2);  // from -20 to -3
    const dpN=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,HALL_H,panelDZ),matStone);
    dpN.position.set(0,HALL_H/2,(-20+(-DOOR_W_OUT/2))/2); scene.add(dpN);
    const dpS=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,HALL_H,panelDZ),matStone);
    dpS.position.set(0,HALL_H/2,(20+(DOOR_W_OUT/2))/2); scene.add(dpS);
    // Transom above door
    const transomH=HALL_H-DOOR_H;
    const tr=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,transomH,DOOR_W_OUT),matStone);
    tr.position.set(0,DOOR_H+transomH/2,0); scene.add(tr);

    // Splayed jambs — boxes rotated in Y so inner face angles into the hall
    [-1,1].forEach(side=>{
      const jm=new THREE.Mesh(new THREE.BoxGeometry(jambLen,jambH_g,WALL_T),matStone);
      jm.rotation.y=side*splayAng;
      jm.position.set(-SPLAY_D/2, jambH_g/2, side*(DOOR_W_OUT/2+splayDZ/2));
      scene.add(jm);
    });

    // Sloped lintels (/-\) — rotate around X axis since door face is Z-Y plane
    const jambTopY=jambH_g, keystoneY=DOOR_H;
    [
      {z0:-DOOR_W_OUT/2, z1:0,            y0:jambTopY,  y1:keystoneY},
      {z0:0,             z1:DOOR_W_OUT/2, y0:keystoneY, y1:jambTopY },
    ].forEach(({z0,z1,y0,y1})=>{
      const dz=z1-z0, dy=y1-y0, len=Math.sqrt(dz*dz+dy*dy);
      const lm=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,0.55,len),matStone);
      lm.position.set(0,(y0+y1)/2,(z0+z1)/2);
      lm.rotation.x=-Math.atan2(dy,dz);   // slopes in Z-Y plane
      scene.add(lm);
    });
    // Keystone
    const ks=new THREE.Mesh(new THREE.BoxGeometry(WALL_T+0.4,1.2,0.8),matStone);
    ks.position.set(0,keystoneY+0.3,0); scene.add(ks);

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSAGE — x=0→20, width=DOOR_W_OUT, ceiling=DOOR_H+0.5
    // ═══════════════════════════════════════════════════════════════════════════
    const PASS_W=DOOR_W_OUT+0.6, PASS_H=DOOR_H+0.5, PASS_DX=20;
    const pN=new THREE.Mesh(new THREE.BoxGeometry(PASS_DX,PASS_H,WALL_T),matStone);
    pN.position.set(10,PASS_H/2,-PASS_W/2); scene.add(pN);
    const pS=pN.clone(); pS.position.z=PASS_W/2; scene.add(pS);
    const pC=new THREE.Mesh(new THREE.BoxGeometry(PASS_DX,0.6,PASS_W),matStone);
    pC.position.set(10,PASS_H,0); scene.add(pC);
    const pF=new THREE.Mesh(new THREE.BoxGeometry(PASS_DX,0.4,PASS_W),matStone);
    pF.position.set(10,-0.2,0); scene.add(pF);

    // Passage torches
    FX.makeTorch(17, 0, -PASS_W/2+0.3);
    FX.makeTorch(17, 0,  PASS_W/2-0.3);
    FX.makeTorch( 8, 0, -PASS_W/2+0.3);
    FX.makeTorch( 8, 0,  PASS_W/2-0.3);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM SPACE CAVERN WALLS — x=20→68, z=±16
    // North and south walls run the full length including the ground strip x=20→28.
    // ═══════════════════════════════════════════════════════════════════════════
    const CAVN_H=30;
    // North cavern wall (x=20→68, 48 units long)
    const CAVN_XC=43.5, CAVN_DX=52;
    const cvN=new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX,CAVN_H,WALL_T),matStone);
    cvN.position.set(CAVN_XC,CAVN_H/2,-16); scene.add(cvN);
    const cvS=cvN.clone(); cvS.position.z=16; scene.add(cvS);
    // Ceiling over chasm space
    const cvC=new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX,1.2,34),matStone);
    cvC.position.set(CAVN_XC,CAVN_H,0); scene.add(cvC);

    // West wall of chasm space at x=20 — has opening for passage.
    // Built as three panels: north of opening, south of opening, above opening.
    const cwPN=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CAVN_H,(16-PASS_W/2)-0.5),matStone);
    cwPN.position.set(19,CAVN_H/2,-16+(16-PASS_W/2)/2-0.25); scene.add(cwPN);
    const cwPS=cwPN.clone(); cwPS.position.z=-cwPN.position.z; scene.add(cwPS);
    const cwPA=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CAVN_H-PASS_H,PASS_W),matStone);
    cwPA.position.set(19,PASS_H+(CAVN_H-PASS_H)/2,0); scene.add(cwPA);

    // Chasm-space torches — on west wall, flanking passage opening
    FX.makeTorch(20.2, 0, -10);
    FX.makeTorch(20.2, 0,  10);
    FX.makeTorch(20.2, 0,  -5);
    FX.makeTorch(20.2, 0,   5);

    // North wall blocking east bridge exit — west face flush with chasm east edge (x=68)
    // Spans x=68→80, z=-16→-2. South face at z=-2 clears the bridge.
    const blockN=new THREE.Mesh(new THREE.BoxGeometry(12,CAVN_H,14),matStone);
    blockN.position.set(74,CAVN_H/2,-9); scene.add(blockN);

    // ═══════════════════════════════════════════════════════════════════════════
    // EAST LANDING + CORRIDOR + ANTE-ROOM
    // All shifted east of the chasm (chasm east edge x≈68+8=76 inner).
    // Landing: x=68→80, z=-2→+10 (butts against north blocking wall at z=-2)
    // Corridor: x=70→78, z=10→28 (runs south, width=8)
    // Ante-room: x=68→80, z=28→42
    // ═══════════════════════════════════════════════════════════════════════════
    const LAND_H=20;
    const CORR_H=14;
    const ANT_H=14;

    // ── Landing (x=68→80, z=-2→+10) ─────────────────────────────────────────
    const landF=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,12),matStone);
    landF.position.set(74,-0.2,4); scene.add(landF);
    // East wall of landing
    const landE=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,LAND_H,12),matStone);
    landE.position.set(80,LAND_H/2,4); scene.add(landE);
    // Ceiling
    const landC=new THREE.Mesh(new THREE.BoxGeometry(12,0.8,12),matStone);
    landC.position.set(74,LAND_H,4); scene.add(landC);

    // ── South corridor (x=70→78, z=10→28, centre z=19) ──────────────────────
    const cWW=new THREE.Mesh(new THREE.BoxGeometry(WALL_T*2,CORR_H,18),matStone);
    cWW.position.set(68,CORR_H/2,19); scene.add(cWW);
    const cWE=cWW.clone(); cWE.position.x=78; scene.add(cWE);
    const cC=new THREE.Mesh(new THREE.BoxGeometry(8,0.6,18),matStone);
    cC.position.set(74,CORR_H,19); scene.add(cC);
    const cF=new THREE.Mesh(new THREE.BoxGeometry(8,0.4,18),matStone);
    cF.position.set(74,-0.2,19); scene.add(cF);
    //[12,18,24].forEach(tz=>{
    //  FX.makeTorch(71.2, 0, tz);
    //  FX.makeTorch(76.8, 0, tz);
    //});

    // ── Ante-room (x=68→80, z=28→42) ────────────────────────────────────────
    const antF=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,14),matStone);
    antF.position.set(74,-0.2,35); scene.add(antF);
    const antC=new THREE.Mesh(new THREE.BoxGeometry(12,0.6,14),matStone);
    antC.position.set(74,ANT_H,35); scene.add(antC);
    const antWW=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,ANT_H,14),matStone);
    antWW.position.set(68,ANT_H/2,35); scene.add(antWW);
    const antWE=antWW.clone(); antWE.position.x=80; scene.add(antWE);
    // North wall of ante-room — doorway opening matches corridor width (8), centred x=74
    const antNL=new THREE.Mesh(new THREE.BoxGeometry(6,ANT_H,WALL_T),matStone);
    antNL.position.set(69,ANT_H/2,28); scene.add(antNL);
    const antNR=antNL.clone(); antNR.position.x=79; scene.add(antNR);
    const antNT=new THREE.Mesh(new THREE.BoxGeometry(8,ANT_H-CORR_H,WALL_T),matStone);
    antNT.position.set(74,CORR_H+(ANT_H-CORR_H)/2,28); scene.add(antNT);
    // South far wall
    const antWS=new THREE.Mesh(new THREE.BoxGeometry(12,ANT_H,WALL_T),matStone);
    antWS.position.set(74,ANT_H/2,42); scene.add(antWS);

    // SpotLight aimed from deep in ante-room northward through the doorway —
    // creates a visible shaft on the corridor floor and walls.
    // Position: high up in ante-room (x=74, y=12, z=40)
    // Target: low on the corridor floor north of doorway (x=74, y=0, z=18)
    // This diagonal aim (high south → low north) mimics sunlight entering obliquely.
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(72, 0, 24);
    scene.add(spotTarget);

    const daylightSpot = new THREE.SpotLight(0xaaffcc, 18.0);
    daylightSpot.position.set(74, 12, 30);
    daylightSpot.target = spotTarget;
    daylightSpot.angle = Math.PI * 0.06;     // narrow beam
    daylightSpot.penumbra = 0.08;            // soft edge
    daylightSpot.distance = 50;
    daylightSpot.castShadow = false;
    scene.add(daylightSpot);
    refs.daylightLight = daylightSpot;

    // Ambient fill inside ante-room so it reads as bright/exterior
    //const anteFill = new THREE.PointLight(0x88ffcc, 1.5, 18);
    //anteFill.position.set(74, 5, 36);
    //scene.add(anteFill);

    // Floor pool at the base of the shaft — warm scatter where light hits ground
    //const floorPool = new THREE.PointLight(0xccffdd, 0.8, 10);
    //floorPool.position.set(74, 0.3, 20);
    //scene.add(floorPool);

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — deep west, behind the hall
    // ═══════════════════════════════════════════════════════════════════════════
    FX.makeFire(-90, 6, 0, { color:0xff2200, intensity:2.2, range:100, flameScale:3.5, emberCount:120 });

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES — deep below bridge, on both flanks
    // ═══════════════════════════════════════════════════════════════════════════
    [[28,-7],[34,-8],[42,-7],[50,-8],[56,-7],
     [28, 7],[36, 8],[44, 7],[52, 8],[58, 7]].forEach(([fx,fz])=>{
      const baseY = -55 + rnd(-4, 4);
      FX.makeFire(fx, baseY + rnd(1,3), fz, {
        color:      0xff4400,
        intensity:  rnd(0.3, 0.8),
        range:      rnd(14, 24),
        flameScale: rnd(0.5, 1.0),
        emberCount: 20,
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GANDALF STAFF — bridge crown (x≈46)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const sm=new THREE.MeshStandardMaterial({color:0x8888aa,roughness:0.6,metalness:0.15});
      const st=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.07,3.2,7),sm);
      st.position.set(45,8.0+1.6,0.3); st.rotation.z=0.04; scene.add(st);
      const tm=new THREE.MeshStandardMaterial({color:0xddeeff,emissive:0xaaccff,emissiveIntensity:3.0,roughness:0.2});
      const tip=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,6),tm);
      tip.position.set(45,8.0+3.25,0.3); scene.add(tip); refs.staffTip=tip;
      const tl=new THREE.PointLight(0x8899cc,0.75,18);
      tl.position.copy(tip.position); scene.add(tl); refs.staffTipLight=tl;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FAR ENCLOSURE
    // ═══════════════════════════════════════════════════════════════════════════
    const mkVoid=(x,y,z,w,h,d)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matVoid);
      m.position.set(x,y,z); scene.add(m);
    };
    mkVoid(-82,25,0,4,50,180);    // west far wall
    mkVoid(0,25,-30,160,50,4);    // north far wall
    mkVoid(74,15,46,16,30,4);     // south far wall (beyond ante-room)
    mkVoid(84,15,20,4,30,50);     // east far wall (beyond landing/corridor)

    return refs;
  },

  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;
    // FX system handles all torch and fire animation automatically.
    // Only manually animate the Gandalf staff tip and the Lothlórien daylight.
    if (refs.staffTip)
      refs.staffTip.material.emissiveIntensity = 3.0 * (0.82 + 0.22*Math.sin(tt*2.1) + 0.08*Math.sin(tt*5.3));
    if (refs.staffTipLight)
      refs.staffTipLight.intensity = 0.75 + 0.28*Math.sin(tt*2.0);
    if (refs.daylightLight)
      refs.daylightLight.intensity = 3.0 + 0.3*Math.sin(tt*0.6);
  },

};

window.MoriaBridge = MoriaBridge;
