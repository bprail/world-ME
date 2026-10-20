// prancingponyinn.js — The Prancing Pony (interior)
// Accessed from Bree courtyard; exit returns to Bree.
// A warm, smoky common room: low beams, a great hearth, booths, trestle tables.
// Time: night / firelit interior

const PrancingPonyInn = {

  name:     'The Prancing Pony',
  subtitle: 'Common Room · Bree',

  // ─── Atmosphere ───────────────────────────────────────────────────────────
  // Interior: warm firelight, heavy smoke, no sky visible
  atmosphere: {
    fogColor:         0x1a1008,       // smoky orange-brown
    fogType:          'linear',
    fogNear:          12,
    fogFar:           45,
    skyColor:         0x0a0804,
    ambientColor:     0x1a1008,
    ambientIntensity: 1.2,
    moonColor:        0x4a3010,       // very dim — interior, no moon
    moonIntensity:    0.08,
    moonPosition:     { x: 0, y: 50, z: 0 },
    showStars:        false,
    extraLights: [
      // Warm fill from hearth side
      { color: 0x6a3808, intensity: 0.5, x: -8, y: 4, z: -4 },
      // Cool secondary from exterior cracks / window
      { color: 0x181c20, intensity: 0.2, x: 0, y: 12, z: 6 },
    ],
  },

  // ─── Terrain — flat flagstone floor ───────────────────────────────────────
  hillHeight(x, z) {
    // Perfectly flat interior floor — slight unevenness from old flagstones
    return window.api_noise2d(x * 0.8, z * 0.8) * 0.06;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Old flagstone — dark grey-brown
    const stone = [0.20, 0.17, 0.13];
    const grout = [0.14, 0.12, 0.10];
    const n = noise2d(vx * 0.5, vz * 0.5);
    return [
      lerp(grout[0], stone[0], n),
      lerp(grout[1], stone[1], n),
      lerp(grout[2], stone[2], n),
    ];
  },

  onPath: () => 0,
  pathWaypoints: [],

  // ─── Lore ─────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: -7, z: -4 },
      radius: 5,
      text:   '"In a corner, away from the fire, sat a tall man with his hood drawn down over his face. On the table in front of him were two foaming mugs."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: 0, z: 8 },
      radius: 5,
      text:   '"The common room of the Prancing Pony was a fine room. The fire was burning brightly, and candles were lit on the many tables."',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: 8, z: 2 },
      radius: 4,
      text:   '"Mr. Underhill!" cried Butterbur. "Now who could have thought of it? Not the name I expected. But come in, come in!"',
      cite:   '— The Fellowship of the Ring, Book I',
    },
    {
      pos:    { x: -4, z: -12 },
      radius: 4,
      text:   '"All that is gold does not glitter, not all those who wander are lost…" — a crumpled letter from Gandalf lay on the table.',
      cite:   '— The Fellowship of the Ring, Book I',
    },
  ],

  // ─── Player start & arrivals ───────────────────────────────────────────────
  // Door is at south end of room (z ≈ +14), player enters facing -Z (into room)
  start: { x: 0, z: 13, yaw: 0 }, // at door, facing -Z (into common room)

  arrivals: {
    bree: { x: 0, z: 13, yaw: 0 }, // arriving from Bree, facing -Z into room
  },

  // ─── Boundary & transitions ────────────────────────────────────────────────
  boundary: 26,

  transitions: [
    {
      // Player walks out the door and a few steps into darkness before transitioning
      trigger: { x: 0, z: 21, radius: 3 },
      to: 'bree',
    },
  ],

  // ─── Walkable elevated surfaces ───────────────────────────────────────────
  walkables: [
    // Low raised hearth platform
    { x: -8, z: -4, yaw: 0, length: 5, width: 5, yStart: 0.35, yEnd: 0.35 },
    // Stage / corner platform (where Strider sits, slightly elevated)
    { x: -9, z: -13, yaw: 0, length: 5, width: 5, yStart: 0.5, yEnd: 0.5 },
  ],

  barriers: [
    // Back wall — block walking through it
    { x: 0, z: -18, w: 26, d: 2, yaw: 0 },
    // East wall
    { x: 14, z: 0, w: 2, d: 36, yaw: 0 },
    // West wall
    { x: -14, z: 0, w: 2, d: 36, yaw: 0 },
    // Front wall either side of door — door gap kept clear so player can walk out
    { x: -8, z: 17, w: 10, d: 2, yaw: 0 },
    { x:  8, z: 17, w: 10, d: 2, yaw: 0 },
    // Side walls extended to new boundary
    // (east/west wall barriers already cover full depth)
  ],

  // ─── buildScene ───────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx !== undefined) m.rotation.set(rx, ry, rz);
      if (sx !== undefined) m.scale.set(sx, sy, sz);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    const rng = (() => { let s = 77; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; }; })();

    // ── materials ──────────────────────────────────────────────────────────
    const matStone    = new THREE.MeshLambertMaterial({ color: 0x282018 });
    const matTimber   = new THREE.MeshLambertMaterial({ color: 0x1e1408 });
    const matDarkWood = new THREE.MeshLambertMaterial({ color: 0x170e06 });
    const matTable    = new THREE.MeshLambertMaterial({ color: 0x2a1c0c });
    const matBench    = new THREE.MeshLambertMaterial({ color: 0x1e1408 });
    const matWallPlank= new THREE.MeshLambertMaterial({ color: 0x1a1206 });
    const matCandle   = new THREE.MeshLambertMaterial({ color: 0xe8e0d0, emissive: 0xffd060, emissiveIntensity: 0.6 });
    const matFireback = new THREE.MeshLambertMaterial({ color: 0x3a2010 });
    const matMugClay  = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
    const matShutter  = new THREE.MeshLambertMaterial({ color: 0x1a1208 });
    const matWaxFloor = new THREE.MeshLambertMaterial({ color: 0x1c1610 });
    const matWinGlow  = new THREE.MeshLambertMaterial({ color: 0x4a3010, emissive: 0x3a2000, emissiveIntensity: 0.5 });
    const matHoodedCloak = new THREE.MeshLambertMaterial({ color: 0x181412 });
    const matBartop   = new THREE.MeshLambertMaterial({ color: 0x2e1c08 });

    // ══════════════════════════════════════════════════════════════════════════
    // ROOM SHELL — walls, floor, ceiling
    // ══════════════════════════════════════════════════════════════════════════

    // Floor (flagstones — using terrain but add a flat overlay slab)
    const geoFloor = new THREE.BoxGeometry(24, 0.2, 34);
    addMesh(geoFloor, matWaxFloor, 0, -0.1, 0, 0, 0, 0);

    // Ceiling (low, beamed)
    const geoCeiling = new THREE.BoxGeometry(26, 0.4, 36);
    addMesh(geoCeiling, matTimber, 0, 5.4, 0, 0, 0, 0);

    // Back wall (north/-Z)
    const geoWallBack = new THREE.BoxGeometry(26, 7, 0.6);
    addMesh(geoWallBack, matStone, 0, 3.0, -17, 0, 0, 0);

    // East wall
    const geoWallE = new THREE.BoxGeometry(0.6, 7, 36);
    addMesh(geoWallE, matStone, 13, 3.0, 0, 0, 0, 0);

    // West wall
    addMesh(geoWallE, matStone, -13, 3.0, 0, 0, 0, 0);

    // Front wall (south/+Z) — two sections with door gap
    const geoFrontWall = new THREE.BoxGeometry(9, 7, 0.6);
    addMesh(geoFrontWall, matStone, -8,  3.0, 16, 0, 0, 0);
    addMesh(geoFrontWall, matStone,  8,  3.0, 16, 0, 0, 0);
    // Door lintel
    const geoLintel = new THREE.BoxGeometry(6, 1.2, 0.6);
    addMesh(geoLintel, matTimber, 0, 5.2, 16, 0, 0, 0);
    // Door frame posts
    const geoDPost = new THREE.CylinderGeometry(0.2, 0.22, 4.8, 9);
    addMesh(geoDPost, matTimber, -2.8, 2.6, 16, 0, 0, 0);
    addMesh(geoDPost, matTimber,  2.8, 2.6, 16, 0, 0, 0);

    // Wainscoting panels on walls
    const geoWain = new THREE.BoxGeometry(3.8, 1.4, 0.15);
    for (let pi = 0; pi < 5; pi++) {
      const px = -10 + pi * 5;
      addMesh(geoWain, matWallPlank, px, 1.0, -16.7, 0, 0, 0);
      addMesh(geoWain, matWallPlank, px, 1.0,  15.7, 0, 0, 0);
    }
    // East/west wainscoting
    const geoWainSide = new THREE.BoxGeometry(0.15, 1.4, 3.8);
    for (let pi = 0; pi < 7; pi++) {
      const pz = -15 + pi * 5;
      addMesh(geoWainSide, matWallPlank, -12.7, 1.0, pz, 0, 0, 0);
      addMesh(geoWainSide, matWallPlank,  12.7, 1.0, pz, 0, 0, 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CEILING BEAMS — exposed timber
    // ══════════════════════════════════════════════════════════════════════════
    const geoBeamX = new THREE.BoxGeometry(26, 0.5, 0.4);   // cross beams
    const geoBeamZ = new THREE.BoxGeometry(0.4, 0.5, 36);   // long ridge beams
    const beamZs = [-12, -6, 0, 6, 12];
    for (const bz of beamZs) {
      addMesh(geoBeamX, matDarkWood, 0, 5.1, bz, 0, 0, 0);
    }
    addMesh(geoBeamZ, matDarkWood, -5, 5.1, 0, 0, 0, 0);
    addMesh(geoBeamZ, matDarkWood,  5, 5.1, 0, 0, 0, 0);

    // Hanging rings / pot hooks on beams
    const geoHook = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    addMesh(geoHook, matDarkWood, -4, 4.7, -6, 0, 0, 0);
    addMesh(geoHook, matDarkWood,  4, 4.7,  0, 0, 0, 0);

    // ══════════════════════════════════════════════════════════════════════════
    // GREAT HEARTH — west wall, central feature
    // ══════════════════════════════════════════════════════════════════════════
    const hearthX = -9;
    const hearthZ = -4;
    const hGY = groundY(hearthX, hearthZ);

    // Hearthstone surround
    const geoHearthSurround = new THREE.BoxGeometry(5.5, 5, 0.7);
    addMesh(geoHearthSurround, matStone, hearthX, hGY + 2.8, hearthZ - 0.05, 0, 0, 0);
    // Fireplace opening recess
    const geoFirebox = new THREE.BoxGeometry(3.5, 3.0, 0.8);
    const matFirebox = new THREE.MeshLambertMaterial({ color: 0x0e0808 });
    addMesh(geoFirebox, matFirebox, hearthX, hGY + 1.7, hearthZ + 0.3, 0, 0, 0);
    // Mantel shelf
    const geoMantel = new THREE.BoxGeometry(6, 0.35, 0.9);
    addMesh(geoMantel, matTimber, hearthX, hGY + 4.3, hearthZ, 0, 0, 0);
    // Hearth platform (raised slab)
    const geoHearthSlab = new THREE.BoxGeometry(4.5, 0.3, 1.8);
    addMesh(geoHearthSlab, matStone, hearthX, hGY + 0.25, hearthZ + 1.0, 0, 0, 0);

    // The fire itself — placed on the hearth slab, clear of the firebox recess
    FX.makeFire(hearthX, hGY + 0.4, hearthZ + 2.2, {
      color:      0xff6010,
      intensity:  4.2,
      range:      20,
      flameScale: 1.2,
      emberCount: 90,
      emberSize:  0.07,
      castShadow: true,
    });

    // Iron pot hook swing arm (suggestion)
    const geoPotArm = new THREE.BoxGeometry(0.1, 0.1, 1.8);
    addMesh(geoPotArm, matDarkWood, hearthX - 0.5, hGY + 2.8, hearthZ + 0.8, 0, 0, 0.2);

    // ══════════════════════════════════════════════════════════════════════════
    // TRESTLE TABLES AND BENCHES — filling the common room
    // ══════════════════════════════════════════════════════════════════════════
    const geoTable  = new THREE.BoxGeometry(4.5, 0.2, 1.8);
    const geoTableL = new THREE.CylinderGeometry(0.12, 0.14, 2.0, 9);  // leg
    const geoBench  = new THREE.BoxGeometry(4.5, 0.18, 0.7);
    const geoBenchL = new THREE.CylinderGeometry(0.09, 0.1, 1.5, 9);

    function buildTrestle(tx, tz, ty) {
      const tgy = groundY(tx, tz) + ty;
      // Table
      addMesh(geoTable, matTable, tx, tgy + 2.0, tz, 0, 0, 0);
      // Four legs
      addMesh(geoTableL, matDarkWood, tx - 1.8, tgy + 1.1, tz - 0.6, 0, 0, 0);
      addMesh(geoTableL, matDarkWood, tx + 1.8, tgy + 1.1, tz - 0.6, 0, 0, 0);
      addMesh(geoTableL, matDarkWood, tx - 1.8, tgy + 1.1, tz + 0.6, 0, 0, 0);
      addMesh(geoTableL, matDarkWood, tx + 1.8, tgy + 1.1, tz + 0.6, 0, 0, 0);
      // Benches each side
      addMesh(geoBench, matBench, tx, tgy + 1.5, tz - 1.4, 0, 0, 0);
      addMesh(geoBench, matBench, tx, tgy + 1.5, tz + 1.4, 0, 0, 0);
      addMesh(geoBenchL, matDarkWood, tx - 1.8, tgy + 0.85, tz - 1.4, 0, 0, 0);
      addMesh(geoBenchL, matDarkWood, tx + 1.8, tgy + 0.85, tz - 1.4, 0, 0, 0);
      addMesh(geoBenchL, matDarkWood, tx - 1.8, tgy + 0.85, tz + 1.4, 0, 0, 0);
      addMesh(geoBenchL, matDarkWood, tx + 1.8, tgy + 0.85, tz + 1.4, 0, 0, 0);
    }

    // Main room tables
    buildTrestle( 3, -2,  0);
    buildTrestle( 3,  5,  0);
    buildTrestle( 3, -9,  0);
    buildTrestle( 3,-14,  0);

    // A candle on each table
    const geoCandleStick = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 9);
    const geoCandleFlame = new THREE.SphereGeometry(0.1, 8, 6);
    const tableCandles = [[3,-2],[3,5],[3,-9],[3,-14]];
    for (const [cx, cz] of tableCandles) {
      const cgy = groundY(cx, cz);
      addMesh(geoCandleStick, matCandle, cx, cgy + 2.3, cz, 0, 0, 0);
      // tiny glow sphere at tip
      addMesh(geoCandleFlame, new THREE.MeshLambertMaterial({
        color: 0xffe070, emissive: 0xffc030, emissiveIntensity: 1.2,
      }), cx, cgy + 2.65, cz, 0, 0, 0);
      FX.makeFire(cx, cgy + 2.6, cz, {
        color: 0xffe040, intensity: 0.5, range: 4, flameScale: 0.18,
        emberCount: 8, emberSize: 0.04, castShadow: false,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STRIDER'S CORNER — dark corner booth, east side, back of room
    // ══════════════════════════════════════════════════════════════════════════
    const striderX = -9;
    const striderZ = -13;
    const sGY = groundY(striderX, striderZ);

    // Corner settle (high-backed bench)
    const geoSettle = new THREE.BoxGeometry(4, 3.8, 0.6);
    addMesh(geoSettle, matDarkWood, striderX, sGY + 2.0, striderZ - 0.3, 0, 0, 0);
    // Bench seat
    addMesh(geoBench, matBench, striderX, sGY + 1.4, striderZ + 1.2, 0, 0, 0);
    // Small corner table
    const geoSmTable = new THREE.BoxGeometry(2.5, 0.18, 2.0);
    addMesh(geoSmTable, matTable, striderX, sGY + 2.0, striderZ + 1.5, 0, 0, 0);
    // Two mugs on the table
    const geoMug = new THREE.CylinderGeometry(0.18, 0.16, 0.4, 9);
    addMesh(geoMug, matMugClay, striderX - 0.4, sGY + 2.28, striderZ + 1.2, 0, 0, 0);
    addMesh(geoMug, matMugClay, striderX + 0.4, sGY + 2.28, striderZ + 1.8, 0, 0, 0);

    // Strider figure (simplified: cloaked shape)
    const geoCloak = new THREE.CylinderGeometry(0.4, 0.6, 2.2, 9);
    const geoHood  = new THREE.SphereGeometry(0.42, 10, 7);
    addMesh(geoCloak, matHoodedCloak, striderX - 0.3, sGY + 1.5, striderZ + 0.8, 0, 0, 0);
    addMesh(geoHood,  matHoodedCloak, striderX - 0.3, sGY + 2.65, striderZ + 0.7, 0, 0, 0);

    // Pipe smoke — very faint fire placed near Strider for ember glow
    // (subtle ember colour, nearly invisible — just a glow hint)
    FX.makeFire(striderX - 0.3, sGY + 2.9, striderZ + 0.7, {
      color: 0x8040a0, intensity: 0.15, range: 3, flameScale: 0.12,
      emberCount: 5, emberSize: 0.03, castShadow: false,
    });

    // ══════════════════════════════════════════════════════════════════════════
    // BAR COUNTER — east side of room
    // ══════════════════════════════════════════════════════════════════════════
    const barX = 8;
    const barZ = 2;
    const barGY = groundY(barX, barZ);

    const geoBar = new THREE.BoxGeometry(1.2, 3.5, 10);
    addMesh(geoBar, matStone, barX + 5.4, barGY + 1.85, barZ, 0, 0, 0);
    // Bar top
    const geoBarTop = new THREE.BoxGeometry(1.6, 0.2, 10.5);
    addMesh(geoBarTop, matBartop, barX + 5.3, barGY + 3.7, barZ, 0, 0, 0);
    // Barrels behind the bar
    const geoBarrel = new THREE.CylinderGeometry(0.6, 0.65, 1.3, 10);
    addMesh(geoBarrel, matDarkWood, barX + 10.5, barGY + 0.75, barZ - 3, 0, 0.2, 0);
    addMesh(geoBarrel, matDarkWood, barX + 10.5, barGY + 0.75, barZ,     0, 0.4, 0);
    addMesh(geoBarrel, matDarkWood, barX + 10.5, barGY + 0.75, barZ + 3, 0, 0.1, 0);
    addMesh(geoBarrel, matDarkWood, barX + 10.5, barGY + 2.1,  barZ - 1.5, 0, 0.3, 0);
    addMesh(geoBarrel, matDarkWood, barX + 10.5, barGY + 2.1,  barZ + 1.5, 0, 0.0, 0);

    // Shelf on east wall with tankards
    const geoShelf = new THREE.BoxGeometry(0.2, 0.15, 6);
    addMesh(geoShelf, matTimber, 12.6, barGY + 3.5, barZ, 0, 0, 0);
    const geoTankard = new THREE.CylinderGeometry(0.15, 0.13, 0.35, 9);
    for (let ti = 0; ti < 5; ti++) {
      addMesh(geoTankard, matMugClay, 12.55, barGY + 3.76, barZ - 2 + ti, 0, rng()*0.3, 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TORCHES ON WALLS
    // ══════════════════════════════════════════════════════════════════════════
    const wallTorches = [
      [  0, -16, 3.5, false],   // back wall centre
      [ -8, -16, 3.5, false],   // back wall left
      [  8, -16, 3.5, false],   // back wall right
      [-12.6, -6,  3.5, false], // west wall
      [-12.6,  6,  3.5, false], // west wall
      [ 12.6, -6,  3.5, false], // east wall
      [  0,  15.5, 3.5, false], // above door
    ];
    for (const [tx, tz, ty, cs] of wallTorches) {
      FX.makeTorch(tx, groundY(tx, tz), tz, {
        color: 0xffb040, intensity: 1.0, range: 11, castShadow: cs,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WINDOWS — shuttered against rain, with amber glow leaking through
    // ══════════════════════════════════════════════════════════════════════════
    const geoWinBox = new THREE.BoxGeometry(0.2, 1.4, 1.8);
    const geoShutter = new THREE.BoxGeometry(0.15, 1.4, 0.8);
    // East wall windows
    addMesh(geoWinBox,  matWinGlow,  12.8, 3.0, -8, 0, 0, 0);
    addMesh(geoShutter, matShutter,  12.8, 3.0, -8.5, 0, -0.3, 0);
    addMesh(geoShutter, matShutter,  12.8, 3.0, -7.5, 0,  0.3, 0);
    addMesh(geoWinBox,  matWinGlow,  12.8, 3.0,  4, 0, 0, 0);
    addMesh(geoShutter, matShutter,  12.8, 3.0,  3.5, 0, -0.3, 0);
    addMesh(geoShutter, matShutter,  12.8, 3.0,  4.5, 0,  0.3, 0);

    // ══════════════════════════════════════════════════════════════════════════
    // MISCELLANEOUS PROPS — mugs, a cape hook, antler on wall
    // ══════════════════════════════════════════════════════════════════════════
    // Antler rack on back wall (suggestion using thin boxes)
    const geoAntler = new THREE.BoxGeometry(0.15, 0.12, 1.4);
    addMesh(geoAntler, matDarkWood, -1.5, 4.8, -16.7, 0, 0.4, 0.3);
    addMesh(geoAntler, matDarkWood,  1.5, 4.8, -16.7, 0, -0.4, -0.3);
    addMesh(geoAntler, matDarkWood,  0,   4.6, -16.7, 0, 0, 0);

    // Cloaks on pegs near door
    const geoCloakPeg = new THREE.BoxGeometry(0.12, 0.12, 0.4);
    addMesh(geoCloakPeg, matTimber, -5, 3.5, 15.7, 0, 0, 0);
    addMesh(geoCloakPeg, matTimber, -3, 3.5, 15.7, 0, 0, 0);

    return {};
  },

  onFrame(t, dt, refs, playerPos) {
    // FX handles fires and torches automatically.
  },
};

window.PrancingPonyInn = PrancingPonyInn;
