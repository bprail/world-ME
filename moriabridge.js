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
      { color: 0x88ccaa, intensity: 0.40, x:   62, y:  8, z:  40 },  // lothlorien spill
    ],
  },

  hillHeight(x, z) {
    return window.api_noise2d(x * 0.06, z * 0.06) * 0.4;
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
    { pos:{x:64,z:5}, radius:6,
      text:'"Fly, you fools!" he cried, and was gone. The bridge cracked and fell. In the fire and the smoke Gandalf fell, and the shadow went down into darkness.',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring' },
    { pos:{x:62,z:30}, radius:6,
      text:'"They stood at last on the eastern side of the Misty Mountains, and Aragorn said nothing, for he wept."',
      cite:'— J.R.R. Tolkien, The Fellowship of the Ring' },
  ],

  // Facing east = yaw 3π/2
  start: { x: -50, z: 0, yaw: Math.PI * 1.5 },

  arrivals: {
    moriadoors: { x: -55, z: 0, yaw: Math.PI * 1.5 },   // deep in hall, face east
    lothlorien: { x:  62, z: 44, yaw: Math.PI * 0.5 },   // ante-room, face west
  },

  boundary: 120,

  transitions: [
    { trigger: { x: -70, z:  0, radius: 7 }, to: 'moriadoors' },
    { trigger: { x:  62, z: 50, radius: 6 }, to: 'lothlorien' },
  ],

  // walkable yaw: π*1.5 = runs east-west (along X); yaw:0 = runs north-south (along Z)
  walkables: [
    // Hall (x=-70→0, centre=-35, length=70, width=40)
    { x:-35, z:0, yaw:Math.PI*1.5, length:70, width:40, yStart:0, yEnd:0 },

    // Passage (x=0→20, centre=10, length=20)
    { x:10,  z:0, yaw:Math.PI*1.5, length:20, width:7,  yStart:0, yEnd:0 },

    // Flat approach before ramp (x=20→24)
    { x:22,  z:0, yaw:Math.PI*1.5, length:4,  width:4,  yStart:0, yEnd:0 },

    // Bridge west ramp (x=24→32, rises 0→4)
    { x:28,  z:0, yaw:Math.PI*1.5, length:8,  width:2.2, yStart:0.0, yEnd:4.0 },
    // Arch seg 1 (x=32→39, rises 4→6.5)
    { x:35.5,z:0, yaw:Math.PI*1.5, length:7,  width:1.4, yStart:4.0, yEnd:6.5 },
    // Arch seg 2 (x=39→44, rises 6.5→8)
    { x:41.5,z:0, yaw:Math.PI*1.5, length:5,  width:1.4, yStart:6.5, yEnd:8.0 },
    // Crown (x=44→48, flat 8)
    { x:46,  z:0, yaw:Math.PI*1.5, length:4,  width:1.4, yStart:8.0, yEnd:8.0 },
    // Arch seg 3 (x=48→53, descends 8→6.5)
    { x:50.5,z:0, yaw:Math.PI*1.5, length:5,  width:1.4, yStart:8.0, yEnd:6.5 },
    // Arch seg 4 (x=53→60, descends 6.5→4)
    { x:56.5,z:0, yaw:Math.PI*1.5, length:7,  width:1.4, yStart:6.5, yEnd:4.0 },
    // East ramp (x=60→66, descends 4→0)
    { x:63,  z:0, yaw:Math.PI*1.5, length:6,  width:2.2, yStart:4.0, yEnd:0.0 },

    // East landing (x=60→72, z=0→14)
    { x:66,  z:7, yaw:0,           length:14, width:14, yStart:0, yEnd:0 },

    // South corridor (x=58→66, z=14→32, centre z=23)
    { x:62,  z:23, yaw:0,          length:18, width:8,  yStart:0, yEnd:0 },

    // Ante-room (x=56→68, z=32→46, centre x=62 z=39)
    { x:62,  z:39, yaw:0,          length:14, width:12, yStart:0, yEnd:0 },
  ],

  barriers: [
    // Hall north & south walls
    { x:-35, z:-22, w:74, d:4, yaw:0 },
    { x:-35, z: 22, w:74, d:4, yaw:0 },
    // Hall west back wall
    { x:-73, z:0, w:6, d:48, yaw:0 },

    // Passage north & south walls
    { x:10, z:-5,  w:22, d:4, yaw:0 },
    { x:10, z: 5,  w:22, d:4, yaw:0 },

    // Chasm north flank (z < -2, bridge is at z=0 width 1.4 so edge at z=-0.7)
    { x:44, z:-9,  w:48, d:14, yaw:0 },
    // Chasm south flank
    { x:44, z: 9,  w:48, d:14, yaw:0 },

    // North blocking wall at east bridge exit (forces player south)
    { x:64, z:-7,  w:10, d:14, yaw:0 },

    // East landing south void edge
    { x:66, z:15,  w:14, d:3,  yaw:0 },
    // East landing east wall
    { x:73, z:7,   w:4,  d:14, yaw:0 },

    // South corridor walls
    { x:57, z:23,  w:4,  d:20, yaw:0 },
    { x:67, z:23,  w:4,  d:20, yaw:0 },

    // Ante-room walls
    { x:55, z:39,  w:4,  d:16, yaw:0 },
    { x:69, z:39,  w:4,  d:16, yaw:0 },
    { x:62, z:47,  w:16, d:4,  yaw:0 },
  ],

  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      torches:      [],
      chasmLights:  [],
      balrogGlow:   null,
      balrogFill:   null,
      balrogFire:   null,
      staffTip:     null,
      staffTipLight:null,
      daylightLight:null,
      time:         0,
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
    const matFireCore = new THREE.MeshStandardMaterial({
      color:0xff6600, emissive:0xff4400, emissiveIntensity:3.5, roughness:0.3,
    });
    const matFireOuter = new THREE.MeshStandardMaterial({
      color:0xff2200, emissive:0xdd1100, emissiveIntensity:2.0,
      roughness:0.5, transparent:true, opacity:0.70,
    });

    // ── Torch factory ──────────────────────────────────────────────────────────
    function makeFlameTexture(c1, c2) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32,40,2,32,32,30);
      g.addColorStop(0,c1); g.addColorStop(0.5,c2); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(cv);
    }

    function makeTorch(wx, wy, wz) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.065,1.6,7), matStone);
      pole.position.set(wx, wy+0.8, wz); scene.add(pole);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.09,0.22,8), matStone);
      bowl.position.set(wx, wy+1.71, wz); scene.add(bowl);
      const fireBase = wy + 1.82;
      const flames = [];
      [
        {tex:makeFlameTexture('rgba(255,240,180,0.95)','rgba(255,100,10,0.6)'), sz:0.38,speed:1.2,phase:0},
        {tex:makeFlameTexture('rgba(255,160,30,0.85)', 'rgba(200,40,0,0.4)'),  sz:0.30,speed:0.9,phase:1.0},
        {tex:makeFlameTexture('rgba(255,200,80,0.7)',  'rgba(180,60,0,0.2)'),  sz:0.46,speed:1.5,phase:2.1},
      ].forEach(cfg => {
        const mat = new THREE.SpriteMaterial({map:cfg.tex,transparent:true,
          blending:THREE.AdditiveBlending,depthWrite:false});
        const sp = new THREE.Sprite(mat);
        sp.position.set(wx, fireBase+cfg.sz*0.5, wz);
        sp.scale.set(cfg.sz, cfg.sz*1.6, 1);
        sp.userData = {baseY:sp.position.y,...cfg};
        scene.add(sp); flames.push(sp);
      });
      const EC=30; const eGeo=new THREE.BufferGeometry();
      const ePOS=new Float32Array(EC*3), eVEL=[], eLIF=new Float32Array(EC);
      function resetE(i){
        const a=Math.random()*Math.PI*2, r=Math.random()*0.12;
        ePOS[i*3]=wx+Math.cos(a)*r; ePOS[i*3+1]=fireBase+0.1+Math.random()*0.15; ePOS[i*3+2]=wz+Math.sin(a)*r;
        eVEL[i]=new THREE.Vector3((Math.random()-0.5)*0.18,0.5+Math.random()*0.7,(Math.random()-0.5)*0.18);
        eLIF[i]=Math.random();
      }
      for(let i=0;i<EC;i++) resetE(i);
      eGeo.setAttribute('position',new THREE.BufferAttribute(ePOS,3));
      const eMat=new THREE.PointsMaterial({color:0xffaa22,size:0.055,transparent:true,opacity:0.9,
        blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
      scene.add(new THREE.Points(eGeo,eMat));
      const light=new THREE.PointLight(0xff6622,0.9,10);
      light.position.set(wx,fireBase+0.3,wz); scene.add(light);
      refs.torches.push({flames,eGeo,ePOS,eVEL,eLIF,EC,resetE,light});
    }

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
    addSlabX(60, 66, 4.0, 0.0, 2.2);

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
    // CHASM VOID — flanks close against bridge, top at y=1 (above terrain)
    // Bridge at z=0, width 1.4 → edge at z=±0.7
    // Flank blocks: z=±(2.5 → 16), covering full gap to cavern wall
    // ═══════════════════════════════════════════════════════════════════════════
    const CHASM_H=110, CHASM_TOP=1;
    const CHASM_X0=22, CHASM_X1=68, CHASM_DX=CHASM_X1-CHASM_X0;
    // Each flank: inner edge at z=±1.8, outer edge at z=±16 → width=14.2, centre z=±8.9
    const mkChasm=(cz)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX,CHASM_H,14),matVoid);
      m.position.set((CHASM_X0+CHASM_X1)/2, CHASM_TOP-CHASM_H/2, cz);
      scene.add(m);
    };
    mkChasm(-9); mkChasm(9);  // north and south flanks
    // Floor
    const cf=new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX,2,22),matVoid);
    cf.position.set((CHASM_X0+CHASM_X1)/2,CHASM_TOP-CHASM_H-1,0); scene.add(cf);
    // Glowing crack
    const ck=new THREE.Mesh(new THREE.BoxGeometry(CHASM_DX-4,0.3,1.4),matCrack);
    ck.position.set((CHASM_X0+CHASM_X1)/2,CHASM_TOP-CHASM_H,0); scene.add(ck);

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
      makeTorch(tx,0,-17);
      makeTorch(tx,0, 17);
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

    // Passage torches — near exit at x≈18
    makeTorch(17,0,-PASS_W/2+0.3);
    makeTorch(17,0, PASS_W/2-0.3);
    // And midway
    makeTorch(8,0,-PASS_W/2+0.3);
    makeTorch(8,0, PASS_W/2-0.3);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM SPACE CAVERN WALLS — x=20→68, z=±14→±16 (tight against chasm flanks)
    // ═══════════════════════════════════════════════════════════════════════════
    const CAVN_H=30, CAVN_DX=50, CAVN_XC=44;
    const cvN=new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX,CAVN_H,WALL_T),matStone);
    cvN.position.set(CAVN_XC,CAVN_H/2,-16); scene.add(cvN);
    const cvS=cvN.clone(); cvS.position.z=16; scene.add(cvS);
    // Ceiling over chasm space
    const cvC=new THREE.Mesh(new THREE.BoxGeometry(CAVN_DX,1.2,34),matStone);
    cvC.position.set(CAVN_XC,CAVN_H,0); scene.add(cvC);

    // West wall of chasm space (between passage exit and bridge — x=20)
    const chasmWestWall=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CAVN_H,32),matStone);
    chasmWestWall.position.set(20,CAVN_H/2,0); scene.add(chasmWestWall);
    // Opening in west wall for passage (z=-PASS_W/2 to +PASS_W/2, y=0 to PASS_H)
    // Achieved by two panels above and to the sides of the opening
    // Side panels (north of passage opening)
    const cwPN=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CAVN_H,(16-PASS_W/2)-0.5),matStone);
    cwPN.position.set(20,CAVN_H/2,(-16+(16-PASS_W/2)/2+0.5)); scene.add(cwPN);
    const cwPS=cwPN.clone(); cwPS.position.z=-cwPN.position.z; scene.add(cwPS);
    // Panel above passage opening
    const cwPA=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CAVN_H-PASS_H,PASS_W),matStone);
    cwPA.position.set(20,PASS_H+(CAVN_H-PASS_H)/2,0); scene.add(cwPA);

    // Chasm-space torches — on west wall (x=20), north and south of passage opening
    makeTorch(20.2,0,-10);
    makeTorch(20.2,0, 10);
    makeTorch(20.2,0,-5);
    makeTorch(20.2,0, 5);

    // North wall blocking east bridge exit (x=62→72, z=-16→0)
    const blockN=new THREE.Mesh(new THREE.BoxGeometry(12,CAVN_H,16),matStone);
    blockN.position.set(67,CAVN_H/2,-8); scene.add(blockN);

    // ═══════════════════════════════════════════════════════════════════════════
    // EAST LANDING — x=60→72, z=0→14, h=20
    // ═══════════════════════════════════════════════════════════════════════════
    const LAND_H=20;
    const landF=new THREE.Mesh(new THREE.BoxGeometry(14,0.4,14),matStone);
    landF.position.set(66,-0.2,7); scene.add(landF);
    const landE=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,LAND_H,14),matStone);
    landE.position.set(73,LAND_H/2,7); scene.add(landE);
    const landC=new THREE.Mesh(new THREE.BoxGeometry(14,0.8,14),matStone);
    landC.position.set(66,LAND_H,7); scene.add(landC);

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUTH CORRIDOR — x=58→66, z=14→32
    // ═══════════════════════════════════════════════════════════════════════════
    const CORR_H=14;
    const cWW=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,CORR_H,18),matStone);
    cWW.position.set(58,CORR_H/2,23); scene.add(cWW);
    const cWE=cWW.clone(); cWE.position.x=66; scene.add(cWE);
    const cC=new THREE.Mesh(new THREE.BoxGeometry(8,0.6,18),matStone);
    cC.position.set(62,CORR_H,23); scene.add(cC);
    const cF=new THREE.Mesh(new THREE.BoxGeometry(8,0.4,18),matStone);
    cF.position.set(62,-0.2,23); scene.add(cF);
    [16,22,28].forEach(tz=>{
      makeTorch(59.2,0,tz);
      makeTorch(64.8,0,tz);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ANTE-ROOM (Lothlórien light chamber) — x=56→68, z=32→46
    // A small bright room. Doorway at z=32 (south end of corridor) lets light spill
    // obliquely back north into the corridor. No glowing pane — just geometry + light.
    // ═══════════════════════════════════════════════════════════════════════════
    const ANT_H=14;
    // Floor
    const antF=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,14),matStone);
    antF.position.set(62,-0.2,39); scene.add(antF);
    // Ceiling
    const antC=new THREE.Mesh(new THREE.BoxGeometry(12,0.6,14),matStone);
    antC.position.set(62,ANT_H,39); scene.add(antC);
    // West wall
    const antWW=new THREE.Mesh(new THREE.BoxGeometry(WALL_T,ANT_H,14),matStone);
    antWW.position.set(56,ANT_H/2,39); scene.add(antWW);
    // East wall
    const antWE=antWW.clone(); antWE.position.x=68; scene.add(antWE);
    // North wall with doorway opening (matches corridor width of 8, centred on x=62)
    // Left panel (x=56→58)
    const antNL=new THREE.Mesh(new THREE.BoxGeometry(2,ANT_H,WALL_T),matStone);
    antNL.position.set(57,ANT_H/2,32); scene.add(antNL);
    // Right panel (x=66→68)
    const antNR=antNL.clone(); antNR.position.x=67; scene.add(antNR);
    // Transom above doorway
    const antNT=new THREE.Mesh(new THREE.BoxGeometry(8,ANT_H-CORR_H,WALL_T),matStone);
    antNT.position.set(62,CORR_H+(ANT_H-CORR_H)/2,32); scene.add(antNT);
    // South far wall (beyond transition)
    const antWS=new THREE.Mesh(new THREE.BoxGeometry(12,ANT_H,WALL_T),matStone);
    antWS.position.set(62,ANT_H/2,46); scene.add(antWS);

    // Bright daylight point light inside the ante-room — casts oblique light through doorway
    const daylightLight=new THREE.PointLight(0xaaffcc,3.0,30);
    daylightLight.position.set(62,5,42);
    scene.add(daylightLight);
    refs.daylightLight=daylightLight;

    // A secondary cooler fill inside ante-room
    const daylightFill=new THREE.PointLight(0x88ddaa,1.2,20);
    daylightFill.position.set(62,8,38);
    scene.add(daylightFill);

    // ═══════════════════════════════════════════════════════════════════════════
    // BALROG FIRE — deep west
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const bf=new THREE.Mesh(new THREE.SphereGeometry(3.5,10,7),matFireOuter.clone());
      bf.position.set(-90,6,0); scene.add(bf); refs.balrogFire=bf;
      const bi=new THREE.Mesh(new THREE.SphereGeometry(1.6,10,7),matFireCore);
      bi.position.set(-90,6.5,0); scene.add(bi);
      const bl=new THREE.PointLight(0xff2200,2.2,100);
      bl.position.set(-80,10,0); scene.add(bl); refs.balrogGlow=bl;
      const bfl=new THREE.PointLight(0xff6600,0.9,65);
      bfl.position.set(-60,4,0); scene.add(bfl); refs.balrogFill=bfl;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHASM FIRES
    // ═══════════════════════════════════════════════════════════════════════════
    [[28,-7],[34,-8],[42,-7],[50,-8],[56,-7],
     [28, 7],[36, 8],[44, 7],[52, 8],[58, 7]].forEach(([fx,fz])=>{
      const baseY=-55+rnd(-4,4);
      const fo=new THREE.Mesh(new THREE.SphereGeometry(rnd(0.5,1.0),8,6),matFireOuter.clone());
      fo.position.set(fx,baseY+rnd(1,3),fz); scene.add(fo);
      const fl=new THREE.PointLight(0xff4400,rnd(0.3,0.8),rnd(14,24));
      fl.position.set(fx,baseY+3,fz); scene.add(fl);
      refs.chasmLights.push(fl);
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
    mkVoid(62,15,54,20,30,4);     // south far wall (beyond ante-room)

    return refs;
  },

  onFrame(t, dt, refs, playerPos) {
    refs.time += dt;
    const tt = refs.time;

    refs.torches.forEach((torch,ti)=>{
      torch.flames.forEach(sp=>{
        const u=sp.userData;
        const f=0.85+0.2*Math.sin(tt*u.speed*5+u.phase)+0.1*Math.sin(tt*u.speed*11+u.phase*2);
        sp.scale.set(u.sz*f,u.sz*1.6*f,1);
        sp.position.y=u.baseY+0.04*Math.sin(tt*u.speed*3+u.phase);
      });
      const pos=torch.ePOS;
      for(let i=0;i<torch.EC;i++){
        torch.eLIF[i]-=dt*(0.6+Math.random()*0.4);
        if(torch.eLIF[i]<=0){torch.resetE(i);}
        else{
          const v=torch.eVEL[i];
          pos[i*3]+=v.x*dt; pos[i*3+1]+=v.y*dt; pos[i*3+2]+=v.z*dt;
          v.y-=0.4*dt;
        }
      }
      torch.eGeo.attributes.position.needsUpdate=true;
      const tl=torch.light;
      if(tl._base===undefined) tl._base=tl.intensity;
      tl.intensity=tl._base*(0.75+0.32*Math.sin(tt*5.7+ti*2.1)+0.12*Math.sin(tt*11.3+ti*0.9));
    });

    refs.chasmLights.forEach((l,i)=>{
      if(l._base===undefined) l._base=l.intensity;
      l.intensity=l._base*(0.7+0.38*Math.sin(tt*4.8+i*1.9)+0.12*Math.sin(tt*9.3+i*0.8));
    });

    if(refs.balrogGlow)
      refs.balrogGlow.intensity=2.2*(0.72+0.38*Math.sin(tt*1.1)+0.18*Math.sin(tt*2.7));
    if(refs.balrogFill)
      refs.balrogFill.intensity=0.9+0.4*Math.sin(tt*1.6+0.4);
    if(refs.balrogFire)
      refs.balrogFire.scale.setScalar(0.88+0.18*Math.sin(tt*3.0)+0.09*Math.sin(tt*6.5));
    if(refs.staffTip)
      refs.staffTip.material.emissiveIntensity=3.0*(0.82+0.22*Math.sin(tt*2.1)+0.08*Math.sin(tt*5.3));
    if(refs.staffTipLight)
      refs.staffTipLight.intensity=0.75+0.28*Math.sin(tt*2.0);
    if(refs.daylightLight)
      refs.daylightLight.intensity=3.0+0.3*Math.sin(tt*0.6);
  },

};

window.MoriaBridge = MoriaBridge;
