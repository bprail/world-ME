// eregion.js — Eregion, Land of the Ring-makers
// Sequence: rivendell (north, -Z) <-> eregion <-> moriadoors (south, +Z)
//
// Coordinate reminder:
//   -Z = north  (toward Rivendell)
//   +Z = south  (toward Moria Doors)
//   +X = east   (Misty Mountains side)
//   yaw 0       = facing north (-Z)
//   yaw Math.PI = facing south (+Z)

const Eregion = {

  name:     'Eregion',
  subtitle: 'Land of the Ring-makers · The Forgotten Realm',

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  // Late dusk — the sun dropped behind the Misty Mountains to the west an
  // hour ago. The sky is deep indigo-violet overhead, with a warm bruised
  // amber-rose glow still bleeding along the western horizon (+X side).
  // Stars are just appearing. Fog is generous so terrain colour reads warm.
  atmosphere: {
    fogColor:         0x1e1008,   // warm amber-brown ground mist
    fogType:          'linear',
    fogNear:          70,
    fogFar:           220,
    skyColor:         0x0a0614,   // deep indigo — dusk not full night
    ambientColor:     0x180e08,   // warm amber ambient — residual sunset glow
    ambientIntensity: 1.7,
    // Setting sun — low on the western horizon, orange-gold
    moonColor:        0xd06020,   // warm orange, not deep red
    moonIntensity:    0.50,
    moonPosition:     { x: -80, y: 14, z: 60 },  // low west, behind and south
    showStars:        true,
    extraLights: [
      // Rose-amber western horizon glow
      { color: 0xc84010, intensity: 0.30, x: -100, y: 6,  z:  40 },
      // Cold blue from east / overhead — the night arriving
      { color: 0x1a1850, intensity: 0.25, x:  60,  y: 80, z: -40 },
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  hillHeight(x, z) {
    const fbm = window.api_fbm;

    // Broad rolling moorland
    const roll  = fbm(x * 0.018, z * 0.018) * 6.5;
    const rough = fbm(x * 0.07,  z * 0.07)  * 1.0;
    const wave  = fbm(x * 0.035, z * 0.035) * 2.8;

    // Shallow vale along the road corridor (x ≈ 0)
    const valeMask = Math.max(0, 1.0 - Math.abs(x) / 13.0);
    const vale     = -valeMask * valeMask * 3.0;

    // NO steep ridge ramp — mountains are geometry objects, not terrain

    return roll + rough + wave + vale;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Dusk moorland — tawny dead grass warmed by last light.
    // Keep mid-range values; the directional light does the final colouring.
    const height = vy;

    // Base: muted tawny grass
    const grassR = lerp(0.18, 0.28, noise2d(vx * 0.06, vz * 0.06));
    const grassG = lerp(0.14, 0.22, noise2d(vx * 0.05, vz * 0.07));
    const grassB = lerp(0.05, 0.10, noise2d(vx * 0.08, vz * 0.04));

    // High ground: dusty grey rock
    const rockR = lerp(0.22, 0.30, noise2d(vx * 0.04, vz * 0.03));
    const rockG = lerp(0.20, 0.26, noise2d(vx * 0.05, vz * 0.05));
    const rockB = lerp(0.18, 0.25, noise2d(vx * 0.03, vz * 0.04));

    // Vale floor: dark boggy earth
    const earthR = lerp(0.09, 0.14, noise2d(vx * 0.09, vz * 0.09));
    const earthG = lerp(0.08, 0.12, noise2d(vx * 0.07, vz * 0.08));
    const earthB = lerp(0.04, 0.08, noise2d(vx * 0.10, vz * 0.06));

    const rockBlend  = Math.min(1, Math.max(0, (height - 6) / 7.0));
    const earthBlend = Math.min(1, Math.max(0, 1.0 - Math.abs(vx) / 10.0))
                     * Math.min(1, Math.max(0, (4 - height) / 3.5));

    let r = lerp(grassR, rockR,  rockBlend);
    let g = lerp(grassG, rockG,  rockBlend);
    let b = lerp(grassB, rockB,  rockBlend);

    r = lerp(r, earthR, earthBlend);
    g = lerp(g, earthG, earthBlend);
    b = lerp(b, earthB, earthBlend);

    return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
  },

  // ─── Path ───────────────────────────────────────────────────────────────────
  // Road runs north (-Z) to south (+Z).
  // Gentle S-curve so it feels ancient and hand-worn, not surveyed.

  onPath(x, z) {
    // Progress 0 at z=-70 (north), 1 at z=+70 (south)
    const progress   = (z + 70) / 140.0;
    const centreline = Math.sin(progress * Math.PI) * 3.5;
    const dx         = x - centreline;
    const t          = 1.0 - Math.min(1, Math.abs(dx) / 2.5);
    return t * t;
  },

  pathWaypoints: [
    [  0.0,  -68],   // north — Rivendell end
    [  1.0,  -45],
    [  2.5,  -20],
    [  3.2,    0],
    [  2.0,   20],
    [  1.0,   45],
    [  0.0,   68],   // south — Moria Doors end
  ],

  // ─── Lore points ────────────────────────────────────────────────────────────
  // Lore off the main path — reward players who wander toward the fire and ruins.
  lorePoints: [
    {
      pos:    { x: -10, z: -32 },
      radius: 6,
      text:   '"Hollin, Hollin, I hear the stones lament. Deep they delved us, fair they wrought us, high they builded us; but they are gone."',
      cite:   '— The Fellowship of the Ring, Book II',
    },
    {
      pos:    { x: 14, z: -5 },
      radius: 5,
      text:   '"They dwelt here once, Elves of the Middle Days; and here they wrought the rings of power, and here their joy came to an end."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: -8, z: 25 },
      radius: 6,
      text:   '"The land is silent. Even the birds are hushed, and the sky holds its breath as the Misty Mountains gather the dark."',
      cite:   '— Companion lore',
    },
    {
      pos:    { x: 12, z: 50 },
      radius: 5,
      text:   '"Regret, Pippin. They passed these hills ten thousand years ago. They lived here once, and the land knew them."',
      cite:   '— Legolas, The Fellowship of the Ring',
    },
    {
      // Near the campfire — slightly off path to invite exploration
      pos:    { x: -8, z: 8 },
      radius: 5,
      text:   '"By the small fire they kept, none spoke for a long while. The Red Eye was ever in their thought."',
      cite:   '— Companion lore',
    },
  ],

  // ─── Player start and arrivals ──────────────────────────────────────────────
  // Arriving from Rivendell (north, -Z): spawn at north edge, face south (+Z) → yaw Math.PI
  // Arriving from Moria (south, +Z):     spawn at south edge, face north (-Z) → yaw 0
  start: { x: 0, z: -65, yaw: Math.PI },

  arrivals: {
    rivendell:  { x: 0, z: -65, yaw: Math.PI },  // face south toward Moria
    moriadoors: { x: 0, z:  65, yaw: 0        },  // face north toward Rivendell
  },

  // ─── Boundary and transitions ───────────────────────────────────────────────
  boundary: 88,

  transitions: [
    { trigger: { x: 0, z: -78, radius: 9 }, to: 'rivendell'  },
    { trigger: { x: 0, z:  78, radius: 9 }, to: 'moriadoors' },
  ],

  // ─── Walkables ──────────────────────────────────────────────────────────────
  // Minimal — only what matches real visible geometry.
  walkables: [],

  // ─── Build scene ────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    // ── Helper ──────────────────────────────────────────────────────────────
    function place(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ────────────────────────────────────────────────────────────
    const mossyStone  = new THREE.MeshStandardMaterial({ color: 0x3a3428, roughness: 0.95 });
    const darkStone   = new THREE.MeshStandardMaterial({ color: 0x282018, roughness: 0.98 });
    const slateStone  = new THREE.MeshStandardMaterial({ color: 0x423c34, roughness: 0.92 });
    const elvishStn   = new THREE.MeshStandardMaterial({ color: 0x524840, roughness: 0.88, metalness: 0.03 });
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 1.0 });
    const mistMat     = new THREE.MeshStandardMaterial({
      color: 0x2a1808, transparent: true, opacity: 0.12,
      roughness: 1.0, depthWrite: false,
    });

    // ── MISTY MOUNTAINS ─────────────────────────────────────────────────────
    // East side (+X). Placed at x = 50–70 so they clear the playable terrain.
    // Wide flat-topped BoxGeometry ridge slabs, buried so no floating base.
    // Spires sit on top of ridge boxes — NOT standalone cones.
    // Dark but not fully black so they read against the dusk sky.
    const ridgeDefs = [
      { x: 58, z: -60, w: 30, h: 44, d: 24 },
      { x: 62, z: -30, w: 26, h: 56, d: 20 },
      { x: 55, z:   0, w: 32, h: 50, d: 26 },
      { x: 60, z:  30, w: 28, h: 48, d: 22 },
      { x: 64, z:  58, w: 24, h: 40, d: 18 },
      { x: 52, z: -48, w: 20, h: 36, d: 16 },
    ];

    ridgeDefs.forEach(({ x, z, w, h, d }, i) => {
      const sampleX = Math.min(85, x);
      const gy      = groundY(sampleX, z);
      // Bury box so bottom ~35% is below terrain
      place(new THREE.BoxGeometry(w, h, d), mountainMat,
        x, gy + h * 0.65, z,
        0, i * 0.15, 0);
    });

    // Spires: tall narrow cylinders planted INTO the ridge tops
    // (yStart well below ridge top so only the tip reads as a peak)
    const spireDefs = [
      { x: 60, z: -30, h: 32, rb: 3.5, rt: 0.4, ridgeH: 56 },
      { x: 54, z:   0, h: 28, rb: 3.0, rt: 0.5, ridgeH: 50 },
      { x: 61, z:  30, h: 26, rb: 2.8, rt: 0.6, ridgeH: 48 },
    ];

    spireDefs.forEach(({ x, z, h, rb, rt, ridgeH }, i) => {
      const sampleX = Math.min(85, x);
      const gy      = groundY(sampleX, z);
      // Ridge top is at gy + ridgeH * 0.65 + ridgeH * 0.5
      const ridgeTop = gy + ridgeH * 0.65 + ridgeH * 0.5;
      // Plant spire so its bottom half is inside the ridge
      place(new THREE.CylinderGeometry(rt, rb, h, 9), mountainMat,
        x, ridgeTop + h * 0.25, z,
        0, i * 0.6, 0);
    });

    // ── BOULDERS ─────────────────────────────────────────────────────────────
    const boulders = [
      [-18, -36, 4.0], [-22, -18, 3.2], [-16,  -8, 2.5],
      [-24,  18, 5.0], [-20,  30, 3.6], [-28,  44, 4.4],
      [-15,  58, 2.8],
      [ 14, -40, 3.0], [ 20, -24, 4.1], [ 12,  -6, 2.6],
      [ 18,  20, 5.1], [ 14,  34, 3.4],
      [-10, -52, 2.2], [ 8, -54, 2.9],
      [ -8,  62, 2.7], [ 8,   60, 3.3],
    ];

    boulders.forEach(([bx, bz, r], i) => {
      const gy  = groundY(bx, bz);
      const mat = (i % 3 === 0) ? mossyStone : darkStone;
      place(new THREE.SphereGeometry(r, 10, 7), mat,
        bx, gy + r * 0.45, bz,
        0.1 * Math.sin(i), i * 1.37, 0);
      if (i % 2 === 0) {
        [0.9, -0.7].forEach((dx, j) => {
          const sr = 0.28 + j * 0.12;
          place(new THREE.SphereGeometry(sr, 8, 6), darkStone,
            bx + dx, groundY(bx + dx, bz + 0.5) + sr * 0.3, bz + 0.5);
        });
      }
    });

    // ── STANDING WAYSTONE ───────────────────────────────────────────────────
    // West of road, z ≈ -35 (northern half, first thing seen arriving from Rivendell)
    {
      const bx = -9, bz = -35;
      const gy = groundY(bx, bz);
      // Shaft — tapered cylinder
      place(new THREE.CylinderGeometry(0.28, 0.40, 5.5, 9), elvishStn,
        bx, gy + 5.5 * 0.5 - 5.5 * 0.22, bz, 0.04, 0.3, 0);
      // Cap
      place(new THREE.CylinderGeometry(0.55, 0.30, 0.45, 9), slateStone,
        bx, gy + 5.5 - 5.5 * 0.22 + 0.22, bz, 0.04, 0.3, 0);
      // Base slab
      place(new THREE.BoxGeometry(1.2, 0.35, 1.2), mossyStone, bx, gy + 0.18, bz);
    }

    // ── TOPPLED WAYSTONE ────────────────────────────────────────────────────
    // East of road, z ≈ -22
    {
      const bx = 10, bz = -22;
      const gy = groundY(bx, bz);
      place(new THREE.CylinderGeometry(0.25, 0.36, 4.2, 9), slateStone,
        bx, gy + 0.38, bz,
        0, 0.7, Math.PI * 0.5 + 0.14);
      // Broken cap piece nearby
      place(new THREE.CylinderGeometry(0.48, 0.28, 0.44, 9), slateStone,
        bx + 2.2, gy + 0.22, bz + 0.6,
        0.3, 1.1, 0.2);
    }

    // ── RUINED WALL ─────────────────────────────────────────────────────────
    // West of road, z ≈ 25
    {
      const wx = -15, wz = 25;
      const gy = groundY(wx, wz);
      place(new THREE.BoxGeometry(8.0, 1.8, 0.9), mossyStone, wx, gy + 0.9 - 0.1, wz, 0, 0.06, 0);
      // Tumbled end section
      place(new THREE.BoxGeometry(3.0, 0.9, 0.85), darkStone,
        wx + 4.5, gy + 0.45, wz + 0.3, 0.08, 0.15, 0.12);
      // Corner buttress cylinder
      place(new THREE.CylinderGeometry(0.50, 0.65, 2.4, 9), elvishStn,
        wx - 4.2, gy + 2.4 * 0.5 - 2.4 * 0.2, wz, 0, 0.2, 0);
      // Scattered wall rubble
      [[wx+2, wz+1.5, 0.35],[wx-1, wz+2, 0.28],[wx+5.5, wz-0.5, 0.40]].forEach(([rx,rz,sr],j) => {
        place(new THREE.SphereGeometry(sr, 8, 6), darkStone,
          rx, groundY(rx, rz) + sr * 0.3, rz, 0, j * 1.2, 0);
      });
    }

    // ── BROKEN ELVISH ARCH ──────────────────────────────────────────────────
    // Over / beside the road at z ≈ -8. One pier stands; the other has
    // collapsed. The arch ring survives on the standing side, broken at mid-span.
    {
      const ax = 0, az = -8;
      const gy  = groundY(ax, az);
      const pierH = 5.0;
      const archR = 3.2;   // radius of arch centreline from road centre

      // ── West pier (standing, -X side) ───────────────────────────────────
      const pierX = ax - archR;
      place(new THREE.CylinderGeometry(0.55, 0.72, pierH, 9), mossyStone,
        pierX, gy + pierH * 0.5 - pierH * 0.18, az, 0, 0.1, 0);
      // Capital on top of standing pier
      place(new THREE.BoxGeometry(1.4, 0.5, 1.4), elvishStn,
        pierX, gy + pierH - pierH * 0.18 + 0.25, az, 0, 0.1, 0);

      // ── East pier (collapsed, +X side) ──────────────────────────────────
      const pierXe = ax + archR;
      // Main shaft fallen northward
      place(new THREE.CylinderGeometry(0.52, 0.68, pierH * 0.85, 9), darkStone,
        pierXe, gy + 0.45, az - 1.5,
        0, 0.2, Math.PI * 0.5 - 0.25);
      // Broken base stump still in ground
      place(new THREE.CylinderGeometry(0.58, 0.70, 1.0, 9), darkStone,
        pierXe, gy + 1.0 * 0.5 - 1.0 * 0.18, az, 0, 0.2, 0);

      // ── Arch ring — TorusGeometry, half-arc on the standing side ────────
      // A Torus with arc = Math.PI gives a semicircle.
      // We rotate it so the flat ends point down (toward the pier tops),
      // then translate it to sit on the standing pier's capital.
      // Use arc = Math.PI * 0.55 to show just the surviving portion.
      const torusR      = archR;          // matches pier spacing
      const torusTube   = 0.28;
      const archArcFull = Math.PI;        // full semicircle
      const archArcHalf = Math.PI * 0.55; // surviving broken half

      // Full arch on the standing (west) pier side
      const archGeo = new THREE.TorusGeometry(torusR, torusTube, 8, 18, archArcFull);
      // Torus by default lies in XY plane, arc starts at +X going CCW.
      // We want it to span across X (road width) rising in Y.
      // Rotate 90° around Z so the arc rises in Y, centred on the road.
      const archMesh = place(archGeo, mossyStone,
        ax,                                         // centred on road
        gy + pierH - pierH * 0.18 + 0.25,          // at capital top
        az,
        0, 0, Math.PI * 0.5);                       // arc rises in Y
      // The torus centre is at road centre; its arc spans left-right.
      // With rotation Z=PI/2, arc starts pointing -Y and sweeps through +X to +Y.
      // Adjust: rotate around Y 90° so it spans across Z (road width) → X axis
      archMesh.rotation.y = Math.PI * 0.5;
      archMesh.rotation.z = 0;
      archMesh.rotation.x = -Math.PI * 0.5;

      // Broken stub — the eastern half of the arch, fallen
      const brokenGeo = new THREE.TorusGeometry(torusR, torusTube * 0.9, 8, 10, Math.PI * 0.45);
      const brokenMesh = place(brokenGeo, darkStone,
        ax + archR * 0.5, gy + 0.5, az + 0.8,
        0.8, 0.4, 0.6);

      // Keystone block on the ground near road centre
      place(new THREE.BoxGeometry(0.9, 0.6, 0.7), slateStone,
        ax + 0.4, gy + 0.30, az - 0.5, 0.2, 0.5, 0.15);

      // Lintel chunk — rectangular block that formed the flat top, now on ground
      place(new THREE.BoxGeometry(2.2, 0.55, 0.75), elvishStn,
        ax - 1.0, gy + 0.28, az + 0.4, 0.15, 0.3, 0.1);
    }

    // ── CAMPFIRE ────────────────────────────────────────────────────────────
    // Off the path to the west — visible from a distance, invites exploration.
    const fireX = -7, fireZ = 6;
    const fireBase = groundY(fireX, fireZ) + 0.12;

    const fireLight = new THREE.PointLight(0xff6820, 7.0, 13, 2);
    fireLight.position.set(fireX, fireBase + 1.0, fireZ);
    fireLight.castShadow = true;
    fireLight.shadow.mapSize.set(512, 512);
    scene.add(fireLight);

    const fireFill = new THREE.PointLight(0xff4400, 0.5, 18, 2);
    fireFill.position.set(fireX, fireBase + 0.5, fireZ);
    scene.add(fireFill);

    // Campfire stones
    [
      [0.0,0.55,0.18],[0.85,0.68,0.22],[1.9,0.56,0.15],[2.8,0.63,0.20],
      [3.9,0.48,0.25],[4.8,0.70,0.16],[5.6,0.58,0.21],[6.3,0.43,0.14],
    ].forEach(([a, r, sr]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(sr, 10, 7), MAT.STONE);
      m.position.set(fireX + Math.cos(a)*r, fireBase + sr*0.55, fireZ + Math.sin(a)*r);
      m.scale.y = 0.7 + Math.random() * 0.3;
      m.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.4);
      scene.add(m);
    });

    // Log cross
    for (let i = 0; i < 2; i++) {
      const l = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 1.0, 6),
        new THREE.MeshLambertMaterial({ color: 0x2a1a0c }),
      );
      l.position.set(fireX, fireBase + 0.14, fireZ);
      l.rotation.z = Math.PI / 2;
      l.rotation.y = i * Math.PI / 2;
      scene.add(l);
    }

    // Flame sprites
    function makeFlameTexture(c1, c2) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(32, 40, 2, 32, 32, 30);
      g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    }

    const flameCfgs = [
      { tex: makeFlameTexture('rgba(255,240,180,0.95)','rgba(255,100,10,0.6)'),  sz:1.1,  speed:1.2, phase:0   },
      { tex: makeFlameTexture('rgba(255,160,30,0.85)', 'rgba(200,40,0,0.4)'),   sz:0.85, speed:0.9, phase:1   },
      { tex: makeFlameTexture('rgba(255,200,80,0.7)',  'rgba(180,60,0,0.2)'),   sz:1.3,  speed:1.5, phase:2.1 },
    ];

    const flames = flameCfgs.map(cfg => {
      const mat = new THREE.SpriteMaterial({
        map: cfg.tex, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const sp = new THREE.Sprite(mat);
      sp.position.set(fireX, fireBase + cfg.sz * 0.5, fireZ);
      sp.scale.set(cfg.sz, cfg.sz * 1.6, 1);
      sp.userData = { baseY: sp.position.y, ...cfg };
      scene.add(sp);
      return sp;
    });

    // Embers
    const EC   = 120;
    const eGeo = new THREE.BufferGeometry();
    const ePOS = new Float32Array(EC * 3);
    const eVEL = [];
    const eLIF = new Float32Array(EC);

    function resetEmber(i) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.3;
      ePOS[i*3]   = fireX + Math.cos(a)*r;
      ePOS[i*3+1] = fireBase + 0.4 + Math.random()*0.3;
      ePOS[i*3+2] = fireZ + Math.sin(a)*r;
      eVEL[i] = new THREE.Vector3(
        (Math.random()-0.5)*0.5, 1.2+Math.random()*1.8, (Math.random()-0.5)*0.5);
      eLIF[i] = Math.random();
    }
    for (let i = 0; i < EC; i++) resetEmber(i);
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePOS, 3));
    const eMat = new THREE.PointsMaterial({
      color:0xffaa22, size:0.08, transparent:true, opacity:0.9,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    });
    const emberPoints = new THREE.Points(eGeo, eMat);
    scene.add(emberPoints);

    // ── GROUND MIST ─────────────────────────────────────────────────────────
    const mistGeo  = new THREE.PlaneGeometry(28, 140);
    const mistMesh = new THREE.Mesh(mistGeo, mistMat);
    mistMesh.rotation.x = -Math.PI / 2;
    mistMesh.position.set(2, groundY(0, 0) + 0.4, 0);
    scene.add(mistMesh);

    // ── GRASS TUFTS ─────────────────────────────────────────────────────────
    const tuftMat = new THREE.MeshStandardMaterial({ color: 0x1e1a10, roughness: 1.0 });
    [[-6,-48],[8,-50],[-12,-30],[14,-28],[-9,-15],[11,5],[-7,22],[13,38],[-5,50]].forEach(([tx,tz]) => {
      for (let b = 0; b < 4; b++) {
        const bx = tx + (Math.random()-0.5)*1.8;
        const bz = tz + (Math.random()-0.5)*1.8;
        const h  = 0.55 + Math.random()*0.45;
        const bg = groundY(bx, bz);
        const m  = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, h, 5), tuftMat);
        m.position.set(bx, bg + h*0.5 - h*0.1, bz);
        m.rotation.set((Math.random()-0.5)*0.3, Math.random()*Math.PI, 0);
        scene.add(m);
      }
    });

    return { fireLight, fireFill, flames, emberPoints, eGeo, ePOS, eVEL, eLIF, resetEmber, mistMesh, EC };
  },

  // ─── On Frame ───────────────────────────────────────────────────────────────
  onFrame(t, dt, refs) {
    if (!refs) return;
    const { fireLight, fireFill, flames, emberPoints, eGeo, ePOS, eVEL, eLIF, resetEmber, mistMesh, EC } = refs;

    const flicker = 1.0 + Math.sin(t*7.3)*0.22 + Math.sin(t*13.1)*0.10 + Math.sin(t*3.7)*0.08;
    if (fireLight) fireLight.intensity = 7.0 * flicker;
    if (fireFill)  fireFill.intensity  = 0.5 * (0.9 + Math.sin(t*9.7)*0.15);

    if (flames) {
      flames.forEach(sp => {
        if (!sp) return;
        const { baseY, speed, phase, sz } = sp.userData;
        const s = 0.85 + Math.sin(t * speed * 6.0 + phase) * 0.18;
        sp.scale.set(sz * s, sz * s * 1.6, 1);
        sp.position.y = baseY + Math.sin(t * speed * 4.0 + phase) * 0.05;
      });
    }

    if (emberPoints && eGeo) {
      const dtCap = Math.min(dt, 0.05);
      for (let i = 0; i < EC; i++) {
        eLIF[i] -= dtCap * 0.6;
        if (eLIF[i] <= 0) { resetEmber(i); continue; }
        ePOS[i*3]   += eVEL[i].x * dtCap;
        ePOS[i*3+1] += eVEL[i].y * dtCap;
        ePOS[i*3+2] += eVEL[i].z * dtCap;
        eVEL[i].y   -= 0.3 * dtCap;
      }
      eGeo.attributes.position.needsUpdate = true;
    }

    if (mistMesh) mistMesh.material.opacity = 0.10 + Math.sin(t * 0.4) * 0.02;
  },

};

window.Eregion = Eregion;
