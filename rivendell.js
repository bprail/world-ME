// =============================================================
//  rivendell.js  —  The Last Homely House East of the Sea
//  Sequence: Weathertop ↔ Rivendell
//  Tone: bright autumn day, deep valley, waterfall, stream, halls
// =============================================================

const Rivendell = {
  name:     'Rivendell',
  subtitle: 'Imladris · The Last Homely House',

  // -----------------------------------------------------------
  //  ATMOSPHERE  — golden autumn midday
  // -----------------------------------------------------------
  atmosphere: {
    fogType:         'linear',
    fogColor:          0xc4d8b0,   // pale celadon — valley air, leaf-filtered
    fogNear:           80,
    fogFar:            280,
    skyColor:          0x8ec8e8,   // clear autumn blue
    ambientColor:      0xd8c89a,   // warm diffuse gold — autumn light
    ambientIntensity:  1.7,
    moonColor:         0xfff3cc,   // sun — warm white-gold
    moonIntensity:     1.4,
    moonPosition:      { x: 60, y: 130, z: 50 },  // high midday, slightly south
    extraLights: [
      // Soft skylight fill from north — keeps valley floor readable
      { color: 0x90b8c8, intensity: 0.45, x: -40, y: 60, z: -100 },
      // Warm bounce off autumn canopy
      { color: 0xc8a050, intensity: 0.25, x: 20, y: -10, z: 30 },
    ],
    showStars: false,
  },

  // -----------------------------------------------------------
  //  TERRAIN
  //  Deep V-valley running roughly E-W (Z axis).
  //  Valley floor at y ≈ -14.  Cliff-shoulders rise steeply.
  //  Stream channel cut along z = 0 ± 6.
  //  Waterfall at far west end (z ≈ -110).
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const noise  = api_fbm;
    const n2     = api_noise2d;

    // Valley profile — steep parabolic walls
    const vDist  = Math.abs(x);                        // distance from valley centreline
    const valley = Math.min(vDist * vDist * 0.028, 32); // 0 at floor, 32 at shoulder

    // East end rises toward the entry ridge (transition from Weathertop road)
    const eastRise = Math.max(0, (z - 70) * 0.18);

    // West end waterfall cliff — ground rises sharply
    const westCliff = Math.max(0, (-z - 95) * 0.35);

    // Base plateau that the valley cuts into
    const basePlat = 4 + noise(x * 0.012, z * 0.012) * 10;

    // Stream channel — narrow trough along centre
    const streamDist = Math.abs(x - 2);               // stream offset 2 units east of dead-centre
    const streamCut  = Math.max(0, 1.8 - streamDist) * 3.5;

    // High-frequency surface detail
    const detail = noise(x * 0.08, z * 0.08) * 1.8
                 + n2(x * 0.18, z * 0.18) * 0.7;

    return basePlat + valley + eastRise + westCliff - streamCut + detail - 10;
  },

  // -----------------------------------------------------------
  //  VERTEX COLOUR
  //  Valley floor: lush grass greens + autumn gold near edges
  //  Stream banks: dark wet earth
  //  Upper slopes: rock grey with lichen
  //  Waterfall cliff: pale granite
  // -----------------------------------------------------------
  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Slope factor: steeper = more rock
    const slopeRaw = vy / (Math.abs(vx) * 0.028 + 1);
    const slope    = Math.max(0, Math.min(1, (vy + 4) / 22));

    // Autumn gold infusion — warms the mid-slopes
    const goldN = noise2d(vx * 0.06, vz * 0.06);
    const gold  = Math.max(0, goldN - 0.35) * 2.2;

    // Stream proximity darkens soil
    const streamProx = Math.max(0, 1 - Math.abs(vx - 2) / 5);

    // Lush valley floor grass (bright green)
    const r0 = lerp(0.28, 0.55, gold);
    const g0 = lerp(0.52, 0.52, gold);
    const b0 = lerp(0.18, 0.22, gold);

    // Rocky upper slope (grey-brown)
    const r1 = 0.52 + noise2d(vx * 0.15, vz * 0.15) * 0.08;
    const g1 = 0.48 + noise2d(vx * 0.2,  vz * 0.1)  * 0.06;
    const b1 = 0.43;

    // Blend by slope
    let r = lerp(r0, r1, slope);
    let g = lerp(g0, g1, slope);
    let b = lerp(b0, b1, slope);

    // Dark wet stream bank
    r = lerp(r, 0.18, streamProx * 0.5);
    g = lerp(g, 0.20, streamProx * 0.5);
    b = lerp(b, 0.13, streamProx * 0.5);

    // Pale cliff top at far west
    const cliffFac = Math.max(0, Math.min(1, (-vz - 85) / 20));
    r = lerp(r, 0.72, cliffFac * slope);
    g = lerp(g, 0.70, cliffFac * slope);
    b = lerp(b, 0.65, cliffFac * slope);

    return [r, g, b];
  },

  // -----------------------------------------------------------
  //  PATH PROXIMITY
  //  Two segments:
  //   1. Entry descent — east ridge (z≈85) winding down to valley floor
  //   2. Valley traverse — along floor to the Elven halls (z≈-70)
  // -----------------------------------------------------------
  onPath(x, z) {
    // Segment 1 — winding descent, x drifts from 22 → 8 as z goes 85→20
    if (z > 20) {
      const t    = (z - 20) / 65;
      const cx   = lerp(8, 22, t);                      // lerp = api_lerp
      const dist = Math.hypot(x - cx, 0);
      return Math.max(0, 1 - dist / 5);
    }
    // Segment 2 — valley floor, hugging east bank of stream (x ≈ 8)
    if (z >= -70) {
      const dist = Math.abs(x - 8);
      return Math.max(0, 1 - dist / 4.5);
    }
    // Short approach path to the halls
    if (z >= -88) {
      const t    = (-z - 70) / 18;
      const cx   = api_lerp(8, 14, t);
      const dist = Math.hypot(x - cx, 0);
      return Math.max(0, 1 - dist / 4);
    }
    return 0;
  },

  // -----------------------------------------------------------
  //  PATH WAYPOINTS
  //  Player arrives from east (Weathertop direction), descends,
  //  walks along valley stream, arrives at the hall entrance.
  // -----------------------------------------------------------
  pathWaypoints: [
    [22, 85],    // entry ridge
    [18, 70],
    [14, 55],
    [10, 38],
    [ 8, 20],    // valley floor reached
    [ 8,  5],
    [ 8, -15],
    [ 8, -30],
    [ 9, -48],
    [10, -62],
    [13, -72],   // approach bend toward halls
    [16, -80],
  ],

  // -----------------------------------------------------------
  //  LORE POINTS
  // -----------------------------------------------------------
  lorePoints: [
    {
      pos: { x: 20, z: 75 },
      radius: 10,
      text: '"I will take the Ring," he said, "though I do not know the way." — The Council of Elrond had not yet been called, but the road to it began here, at the first sight of the valley.',
      cite: 'The Fellowship of the Ring, Book II'
    },
    {
      pos: { x: 8, z: 0 },
      radius: 8,
      text: 'The Bruinen murmured over smooth stones, fed by a dozen falls from the high moorland above. In autumn the valley blazed gold and copper between its ancient walls of stone.',
      cite: 'The Fellowship of the Ring, Book II'
    },
    {
      pos: { x: -2, z: -100 },
      radius: 12,
      text: 'A waterfall leapt from a high ledge and fell in white veils into the head of the vale. Here the Elves had sung since the Second Age, and the rock itself seemed to remember their voices.',
      cite: 'The Fellowship of the Ring, Book II'
    },
    {
      pos: { x: 16, z: -78 },
      radius: 9,
      text: '"Welcome to the house of Elrond!" the voice said. Light spilled from many windows into the cool evening air, and music drifted down the terraced paths.',
      cite: 'The Fellowship of the Ring, Book II'
    },
  ],

  // -----------------------------------------------------------
  //  BOUNDARY & TRANSITIONS
  // -----------------------------------------------------------
  boundary: 140,

  start: { x: 22, z: 88, yaw: Math.PI },
  
  transitions: [
    {
      trigger: { x: 22, z: 100, radius: 14 },
      to: 'Weathertop'
    },
  ],

  arrivals: {
    'Weathertop': { x: 22, z: 88, yaw: Math.PI },   // facing west, into valley
  },

  // -----------------------------------------------------------
  //  BUILD SCENE
  // -----------------------------------------------------------
  buildScene(THREE, scene, groundY, MAT) {
    const refs = {
      waterParticles: [],
      waterfall: null,
      streamSurfaces: [],
      foliage: [],
      t: 0,
    };

    // ---- shared colours ----
    const matGold = new THREE.MeshLambertMaterial({ color: 0xd4a030, side: THREE.FrontSide });
    const matRust = new THREE.MeshLambertMaterial({ color: 0xb85828 });
    const matLeaf = new THREE.MeshLambertMaterial({ color: 0xe8b840, side: THREE.DoubleSide });
    const matDarkLeaf = new THREE.MeshLambertMaterial({ color: 0xc07020 });
    const matWater  = new THREE.MeshLambertMaterial({ color: 0x5598b8, transparent: true, opacity: 0.72 });
    const matFoam   = new THREE.MeshLambertMaterial({ color: 0xddeeff, transparent: true, opacity: 0.85 });
    const matStone  = MAT.STONE;
    const matMoss   = MAT.STONE_MOSS;
    const matDark   = MAT.STONE_DARK;
    const matWood   = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    const matElven  = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });  // pale Elven stonework
    const matRoof   = new THREE.MeshLambertMaterial({ color: 0x607848 });  // green living roof

    // Helper: place object with buried offset
    function place(mesh, x, z, yBury) {
      const gy = groundY(x, z);
      mesh.position.set(x, gy + yBury, z);
      scene.add(mesh);
    }

    // =====================================================
    //  AUTUMN TREES  — valley sides
    // =====================================================
    const treeData = [
      // West valley walls — dense
      [-18, -5], [-22, 10], [-26, -20], [-30, 5],
      [-20, 30], [-28, 40], [-24, -35],
      [-16, -50], [-22, -55], [-26, -42],
      // East wall
      [26, 0], [30, 15], [28, -10], [32, 30],
      [24, -25], [30, -40], [28, -55],
      // Valley floor — scattered along stream banks
      [-8, 10], [-10, -20], [-6, -35],
      [14, 25], [16, -5], [12, -40],
      // Entry ridge — sparser
      [22, 60], [16, 52], [28, 65],
    ];

    const leafMats = [matGold, matRust, matLeaf, matDarkLeaf];
    treeData.forEach(([tx, tz], i) => {
      const gy = groundY(tx, tz);
      const h  = 4.5 + (i % 5) * 1.2;
      const lm = leafMats[i % leafMats.length];

      // Trunk
      const trunkGeo  = new THREE.CylinderGeometry(0.22, 0.34, h, 9);
      const trunk     = new THREE.Mesh(trunkGeo, matWood);
      trunk.position.set(tx, gy + h / 2 - h * 0.25, tz);
      scene.add(trunk);

      // Canopy — two overlapping spheres for fullness
      const cr  = 2.4 + (i % 3) * 0.6;
      const canGeo  = new THREE.SphereGeometry(cr, 8, 6);
      const canopy  = new THREE.Mesh(canGeo, lm);
      canopy.position.set(tx, gy + h * 0.78 + cr * 0.5, tz);
      scene.add(canopy);

      // Second smaller sphere, offset slightly
      const c2Geo = new THREE.SphereGeometry(cr * 0.7, 8, 6);
      const c2    = new THREE.Mesh(c2Geo, lm);
      c2.position.set(tx + (i % 2 ? 0.8 : -0.8), gy + h * 0.92 + cr * 0.5, tz + 0.4);
      scene.add(c2);

      refs.foliage.push(canopy, c2);
    });

    // =====================================================
    //  STREAM SURFACE — flat ribbon planes along valley floor
    //  Stream runs roughly x ≈ 2-4, z from 85 down to -90
    // =====================================================
    for (let sz = -88; sz < 82; sz += 8) {
      const gy    = groundY(2, sz) + 0.06;
      const wGeo  = new THREE.PlaneGeometry(3.5, 8.5);
      wGeo.rotateX(-Math.PI / 2);
      const surf  = new THREE.Mesh(wGeo, matWater);
      surf.position.set(2, gy, sz + 4);
      scene.add(surf);
      refs.streamSurfaces.push(surf);
    }

    // =====================================================
    //  WATERFALL — west cliff face (z ≈ -100)
    // =====================================================
    // Cliff wall — tall cylinder stack as a rough face
    for (let ci = 0; ci < 4; ci++) {
      const cGeo  = new THREE.CylinderGeometry(3 - ci * 0.3, 3.5 - ci * 0.3, 8, 9);
      const cMesh = new THREE.Mesh(cGeo, ci < 2 ? matDark : matStone);
      const cx    = -2 + ci * 0.8;
      const cz    = -98;
      cMesh.position.set(cx, groundY(cx, cz) + 4 + ci * 7.5, cz);
      scene.add(cMesh);
    }

    // Waterfall sheet — tall thin box-ish plane
    const wfGeo = new THREE.PlaneGeometry(5, 20);
    const wf    = new THREE.Mesh(wfGeo, matWater);
    wf.position.set(0, groundY(0, -98) + 12, -99);
    wf.rotation.y = 0.1;
    scene.add(wf);
    refs.waterfall = wf;

    // Foam splash pool at base
    const splashGeo = new THREE.SphereGeometry(3.5, 10, 7);
    const splash    = new THREE.Mesh(splashGeo, matFoam);
    splash.scale.y  = 0.18;
    splash.position.set(0, groundY(0, -96) + 0.12, -96);
    scene.add(splash);

    // Mist particles — simple small spheres that bob
    for (let pi = 0; pi < 18; pi++) {
      const angle  = (pi / 18) * Math.PI * 2;
      const pr     = 1.5 + Math.random() * 2.5;
      const pGeo   = new THREE.SphereGeometry(0.35 + Math.random() * 0.3, 6, 4);
      const pMesh  = new THREE.Mesh(pGeo, matFoam);
      pMesh.position.set(
        Math.cos(angle) * pr,
        groundY(0, -96) + 0.5 + Math.random() * 2,
        -96 + Math.sin(angle) * pr
      );
      pMesh._phase = Math.random() * Math.PI * 2;
      pMesh._r     = pr;
      pMesh._angle = angle;
      scene.add(pMesh);
      refs.waterParticles.push(pMesh);
    }

    // =====================================================
    //  STREAM BOULDERS — scattered along banks
    // =====================================================
    const boulderSeeds = [
      [-3, 5, 1.1], [6, -8, 0.9], [-4, -22, 1.4], [7, 18, 0.8],
      [-2, -42, 1.0], [5, -55, 1.2], [-5, 35, 0.75], [8, -30, 1.3],
    ];
    boulderSeeds.forEach(([bx, bz, bs]) => {
      const bGeo  = new THREE.SphereGeometry(bs, 10, 7);
      const b     = new THREE.Mesh(bGeo, Math.random() > 0.5 ? matMoss : matStone);
      b.position.set(bx, groundY(bx, bz) + bs * 0.45, bz);
      b.rotation.y = Math.random() * Math.PI;
      scene.add(b);
    });

    // =====================================================
    //  ROCKY VALLEY WALLS — angular chunks on mid-slopes
    // =====================================================
    const wallChunks = [
      [-20, 8, 1.6], [-24, -18, 2.0], [-18, -35, 1.4],
      [24, 12, 1.8],  [28, -22, 1.5],  [26, 40, 1.3],
      [-22, 50, 2.2], [30, -8, 1.7],
    ];
    wallChunks.forEach(([wx, wz, ws]) => {
      const wGeo = new THREE.SphereGeometry(ws, 8, 6);
      const wm   = new THREE.Mesh(wGeo, matDark);
      wm.position.set(wx, groundY(wx, wz) + ws * 0.45, wz);
      wm.scale.set(1, 0.7 + Math.random() * 0.4, 1.1 + Math.random() * 0.3);
      wm.rotation.y = Math.random() * Math.PI;
      scene.add(wm);
    });

    // =====================================================
    //  ELVEN HALLS — simple suggestion, east end of valley
    //  Three structures: main hall, a wing, a terrace
    // =====================================================

    // Main hall — tall elongated cylinder for the great tower
    const towerGeo = new THREE.CylinderGeometry(2.8, 3.2, 14, 9);
    const tower    = new THREE.Mesh(towerGeo, matElven);
    const towerX   = 18, towerZ = -82;
    tower.position.set(towerX, groundY(towerX, towerZ) + 14 / 2 - 14 * 0.25, towerZ);
    scene.add(tower);

    // Tower roof — low cone approximated with cylinder
    const roofGeo  = new THREE.CylinderGeometry(0.3, 3.2, 4, 9);
    const roof     = new THREE.Mesh(roofGeo, matRoof);
    roof.position.set(towerX, groundY(towerX, towerZ) + 14 - 14 * 0.25 + 1.5, towerZ);
    scene.add(roof);

    // Hall wing — lower wide cylinder
    const wingGeo  = new THREE.CylinderGeometry(4.5, 4.8, 6, 9);
    const wing     = new THREE.Mesh(wingGeo, matElven);
    const wingX = 12, wingZ = -77;
    wing.position.set(wingX, groundY(wingX, wingZ) + 6 / 2 - 6 * 0.25, wingZ);
    scene.add(wing);

    const wingRoofGeo = new THREE.CylinderGeometry(0.5, 4.8, 3, 9);
    const wingRoof    = new THREE.Mesh(wingRoofGeo, matRoof);
    wingRoof.position.set(wingX, groundY(wingX, wingZ) + 6 - 6 * 0.25 + 0.8, wingZ);
    scene.add(wingRoof);

    // Terrace pillars — a small colonnade at the approach
    for (let pi = 0; pi < 4; pi++) {
      const pGeo  = new THREE.CylinderGeometry(0.28, 0.32, 5, 9);
      const pil   = new THREE.Mesh(pGeo, matElven);
      const px    = 13 + pi * 1.4;
      const pz    = -72;
      pil.position.set(px, groundY(px, pz) + 5 / 2 - 5 * 0.25, pz);
      scene.add(pil);
    }

    // Terrace lintel
    const lintelGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 9);
    lintelGeo.rotateZ(Math.PI / 2);
    const lintel    = new THREE.Mesh(lintelGeo, matElven);
    const lx = 15.6, lz = -72;
    lintel.position.set(lx, groundY(lx, lz) + 5 - 5 * 0.1, lz);
    scene.add(lintel);

    // =====================================================
    //  ENTRY RIDGE — standing stones mark the descent path
    // =====================================================
    const ridgeStones = [
      [18, 80], [24, 78], [20, 70], [16, 68],
    ];
    ridgeStones.forEach(([rx, rz], ri) => {
      const h    = 2.8 + ri * 0.4;
      const rGeo = new THREE.CylinderGeometry(0.3, 0.45, h, 9);
      const rMesh= new THREE.Mesh(rGeo, matMoss);
      rMesh.position.set(rx, groundY(rx, rz) + h / 2 - h * 0.25, rz);
      rMesh.rotation.y = ri * 0.4;
      scene.add(rMesh);
    });

    // =====================================================
    //  BRIDGE — simple stone arch over the stream mid-valley
    // =====================================================
    const bridgeZ = -10;
    const bridgeX = 2;
    // Two piers
    [[-2.4, bridgeZ], [6.4, bridgeZ]].forEach(([px, pz]) => {
      const pgGeo = new THREE.CylinderGeometry(0.5, 0.65, 3, 9);
      const pier  = new THREE.Mesh(pgGeo, matStone);
      pier.position.set(px, groundY(px, pz) + 1.5, pz);
      scene.add(pier);
    });
    // Deck
    const deckGeo = new THREE.CylinderGeometry(0.45, 0.45, 9.5, 9);
    deckGeo.rotateZ(Math.PI / 2);
    const deck    = new THREE.Mesh(deckGeo, matStone);
    deck.position.set(2, groundY(2, bridgeZ) + 2.8, bridgeZ);
    scene.add(deck);

    // =====================================================
    //  FIRELIGHT — Elven hall window glow (warm point light)
    // =====================================================
    const fireLight = new THREE.PointLight(0xffcc66, 1.8, 30);
    fireLight.position.set(towerX, groundY(towerX, towerZ) + 8, towerZ + 2);
    scene.add(fireLight);

    const fireFill = new THREE.PointLight(0xffaa44, 0.6, 18);
    fireFill.position.set(wingX, groundY(wingX, wingZ) + 5, wingZ + 2);
    scene.add(fireFill);

    // Placeholder refs (no actual fire/embers — hall glows suffice)
    refs.fireLight = fireLight;
    refs.fireFill  = fireFill;
    refs.flames    = [];
    refs.embers    = [];

    return refs;
  },

  // -----------------------------------------------------------
  //  ON FRAME — animate water, mist, hall glow
  // -----------------------------------------------------------
  onFrame(t, dt, refs) {
    if (!refs) return;
    refs.t = (refs.t || 0) + dt;
    const T = refs.t;

    // Stream surfaces — gentle ripple via opacity
    if (refs.streamSurfaces) {
      refs.streamSurfaces.forEach((s, i) => {
        s.material.opacity = 0.62 + Math.sin(T * 1.8 + i * 0.7) * 0.09;
      });
    }

    // Waterfall — drift the sheet slightly
    if (refs.waterfall) {
      refs.waterfall.position.x = Math.sin(T * 0.4) * 0.15;
      refs.waterfall.material.opacity = 0.68 + Math.sin(T * 2.1) * 0.09;
    }

    // Mist particles — rise slowly and drift
    if (refs.waterParticles) {
      refs.waterParticles.forEach((p) => {
        p.position.y += dt * 0.35;
        p.position.x += Math.sin(T * 0.5 + p._phase) * dt * 0.08;
        p.material.opacity = 0.45 + Math.sin(T * 0.9 + p._phase) * 0.25;
        // Reset when they drift too high
        if (p.position.y > p._baseY + 5 || !p._baseY) {
          p._baseY = p.position.y;
        }
        if (p.position.y > (p._startY || p.position.y) + 6) {
          p.position.y -= 5.5;
        }
        if (!p._startY) p._startY = p.position.y;
      });
    }

    // Foliage — very gentle sway
    if (refs.foliage) {
      refs.foliage.forEach((f, i) => {
        f.rotation.z = Math.sin(T * 0.6 + i * 0.9) * 0.025;
        f.rotation.x = Math.sin(T * 0.4 + i * 1.1) * 0.015;
      });
    }

    // Hall glow — breathe slowly
    if (refs.fireLight) {
      refs.fireLight.intensity = 1.6 + Math.sin(T * 1.2) * 0.25;
    }
    if (refs.fireFill) {
      refs.fireFill.intensity  = 0.55 + Math.sin(T * 0.9 + 1.1) * 0.12;
    }
  },
};

window.Rivendell = Rivendell;
