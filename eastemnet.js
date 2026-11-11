// eastemnet.js — The Eastemnet, Plains of Rohan
// Sequence: Amon Hen <-> Eastemnet <-> Fangorn
// Time of day: Day — the Three Hunters run across the sun-baked plains

const Eastemnet = {

  name:     'The Eastemnet',
  subtitle: 'Plains of Rohan · Day Three of the Hunt',

  // ─── onLoad ─────────────────────────────────────────────────────────────────
  async onLoad() {
    // No async data needed — all geometry is procedural.
    // Placeholder retained so the hook is present if pre-computation is added later.
  },

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0xa8b8c8,
    fogDensity:       0.004,
    fogType:          'linear',
    fogNear:          120,
    fogFar:           420,
    skyColor:         0x7aa0c8,
    ambientColor:     0xc8b890,
    ambientIntensity: 1.1,
    moonColor:        0xfff4d0,    // sun — high warm white
    moonIntensity:    1.1,
    moonPosition:     { x: 60, y: 160, z: -80 },
    showStars:        false,
    extraLights: [
      { color: 0xd0c090, intensity: 0.5, x: -80, y:  60, z:  60 },   // fill from south-west
      { color: 0x9ab0c8, intensity: 0.25, x:  40, y:  20, z:  80 },  // sky bounce from behind
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  // Broad rolling grassland — gentle undulating ridges running east-west,
  // slight rise toward Fangorn's eave in the north.  A shallow vale cuts
  // through the centre where the path runs; two low drumlin humps flank it.

  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Large-scale rolling plain — slow waves east-west
    const roll  = fbm(x * 0.012, z * 0.008) * 7.0;

    // Medium undulation — gives the grass a breathing quality
    const mid   = fbm(x * 0.03,  z * 0.025) * 3.0;

    // Fine surface roughness
    const fine  = noise(x * 0.09, z * 0.09) * 0.6;

    // Shallow central vale along z — path corridor sits slightly lower
    const valleyShape = Math.exp(-0.5 * Math.pow(x / 22.0, 2));
    const valleyDip   = -1.8 * valleyShape;

    // Gradual rise toward +Z (Fangorn eave)
    const northRise = Math.max(0, z * 0.045);

    // Two low drumlins flanking the vale — left and right
    const drumR = 2.8 * Math.exp(-((x - 28) * (x - 28)) / 320 - ((z + 10) * (z + 10)) / 500);
    const drumL = 2.4 * Math.exp(-((x + 32) * (x + 32)) / 280 - ((z - 5)  * (z - 5))  / 420);

    return roll + mid + fine + valleyDip + northRise + drumR + drumL;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n = noise2d(vx * 0.06, vz * 0.06);
    const n2 = noise2d(vx * 0.14 + 3.1, vz * 0.14 - 1.7);

    // Base palette: sun-dried tawny grass, pale sage, ochre
    const tawny  = [0.56, 0.48, 0.25];
    const sage   = [0.44, 0.52, 0.28];
    const ochre  = [0.62, 0.52, 0.22];
    const loam   = [0.38, 0.32, 0.20];

    let col = lerp(tawny[0], sage[0], n);
    let cog = lerp(tawny[1], sage[1], n);
    let cob = lerp(tawny[2], sage[2], n);

    // Blend in ochre patches
    const ot = Math.max(0, n2 - 0.55) * 2.2;
    col = lerp(col, ochre[0], ot);
    cog = lerp(cog, ochre[1], ot);
    cob = lerp(cob, ochre[2], ot);

    // Darken in vale / lower ground
    const depth = Math.max(0, -vy * 0.08);
    col = lerp(col, loam[0], Math.min(depth, 0.5));
    cog = lerp(cog, loam[1], Math.min(depth, 0.5));
    cob = lerp(cob, loam[2], Math.min(depth, 0.5));

    return [col, cog, cob];
  },

  onPath(x, z) {
    // The path of the Three Hunters — winds gently through the vale,
    // following the natural low ground, curving slightly east mid-plain.
    const waypoints = [
      [0,    62],
      [2,    40],
      [-4,   20],
      [3,     0],
      [-2,  -20],
      [5,   -40],
      [0,   -62],
    ];
    // Evaluate signed distance to nearest segment
    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const ax = waypoints[i][0],     az = waypoints[i][1];
      const bx = waypoints[i+1][0],   bz = waypoints[i+1][1];
      const dx = bx - ax,             dz = bz - az;
      const lenSq = dx*dx + dz*dz;
      let t = ((x - ax)*dx + (z - az)*dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t*dx - x;
      const pz = az + t*dz - z;
      const d  = Math.sqrt(px*px + pz*pz);
      if (d < minDist) minDist = d;
    }
    const r = 2.5;
    return Math.max(0, 1 - minDist / r);
  },

  // ─── Path waypoints ─────────────────────────────────────────────────────────
  pathWaypoints: [
    [  0,  62 ],   // arriving from Amon Hen (+Z end)
    [  2,  40 ],
    [ -4,  20 ],
    [  3,   0 ],   // mid-plain — riders encounter
    [ -2, -20 ],
    [  5, -40 ],
    [  0, -62 ],   // approaching Fangorn (-Z end)
  ],

  // ─── Lore points ────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0,  z: 55 },
      radius: 6,
      text:   '"Their trail is not hard to find," said Aragorn. "It runs straight as a bowstring."',
      cite:   '— Aragorn, The Two Towers, III.1',
    },
    {
      pos:    { x: 18, z: 30 },
      radius: 5,
      text:   '"There lie the woods of Fangorn," said Legolas. "What do you feel, Gimli? Cold or not, there is something there."',
      cite:   '— Legolas, The Two Towers, III.2',
    },
    {
      pos:    { x: -6, z: 5 },
      radius: 6,
      text:   '"We have not ridden through the night for nothing," said Éomer. "There is old work here as well as new. Here are signs of Orcs."',
      cite:   '— Éomer, The Two Towers, III.2',
    },
    {
      pos:    { x: 10, z: -12 },
      radius: 5,
      text:   '"We slew many, but we found no hobbits among them. I cannot think what has become of them. They had not the might to escape the Orcs by running. But how do you know of Halflings?"',
      cite:   '— Éomer, The Two Towers, III.2',
    },
    {
      pos:    { x: -14, z: -32 },
      radius: 5,
      text:   '"Then there is hope yet," said Legolas. He stooped and from the trampled grass picked up a thing that glinted in the sunlight. It was a small leaf-shaped brooch.',
      cite:   '— The Two Towers, III.3',
    },
    {
      pos:    { x: 4, z: -52 },
      radius: 6,
      text:   '"There is Fangorn," said Legolas, pointing ahead. "Strangest of all the forests of Middle-earth. I have heard of it, but never thus have I seen it."',
      cite:   '— Legolas, The Two Towers, III.2',
    },
  ],

  // ─── Start & arrivals ───────────────────────────────────────────────────────
  start: { x: 0, z: 62, yaw: 0 },   // at +Z end, facing -Z (toward Fangorn)

  arrivals: {
    amonhen:  { x:  0, z:  62, yaw: 0         },  // arriving from +Z, facing -Z
    fangorn:  { x:  0, z: -62, yaw: Math.PI   },  // arriving from -Z, facing +Z
  },

  // ─── Boundary & transitions ─────────────────────────────────────────────────
  boundary: 88,

  transitions: [
    {
      trigger: { x: 0, z:  78, radius: 10 },
      to: 'amonhen',
    },
    {
      trigger: { x: 0, z: -78, radius: 10 },
      to: 'fangorn',
    },
  ],

  // ─── Walkables ──────────────────────────────────────────────────────────────
  // Flat open plain — no elevated walkables needed.
  walkables: [],

  // ─── Barriers ───────────────────────────────────────────────────────────────
  barriers: [],

  // ─── buildScene ─────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {

    // ── Helpers ──────────────────────────────────────────────────────────────

    const rock = (x, z, r, mat) => {
      const g = new THREE.SphereGeometry(r, 10, 7);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, groundY(x, z) + r * 0.45, z);
      m.rotation.set(
        Math.random() * 0.4,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4
      );
      scene.add(m);
    };

    const rubble = (x, z, r, mat) => {
      const g = new THREE.SphereGeometry(r, 8, 6);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, groundY(x, z) + r * 0.4, z);
      m.rotation.set(Math.random()*0.6, Math.random()*Math.PI*2, Math.random()*0.6);
      scene.add(m);
    };

    // ── Standing stone — lone sentinel on the right drumlin ──────────────────
    // A single lichen-covered menhir visible from far away
    const standingStone = (x, z, h, r) => {
      const g = new THREE.CylinderGeometry(r * 0.6, r, h, 9);
      const m = new THREE.Mesh(g, MAT.STONE_MOSS);
      m.position.set(x, groundY(x, z) + h / 2 - h * 0.25, z);
      m.rotation.y = Math.random() * Math.PI * 2;
      scene.add(m);
    };

    standingStone(26, -8,  6.5, 0.6);    // tall sentinel on east drumlin
    standingStone(28,  2,  3.8, 0.45);   // companion stone
    standingStone(23, -4,  4.2, 0.5);    // third of the cluster

    // ── Scattered fieldstones around the menhirs ─────────────────────────────
    const stoneMat = MAT.STONE_MOSS;
    const darkMat  = MAT.STONE_DARK;

    for (const [sx, sz] of [
      [22,  -6], [29, -11], [24,  4], [30,  5], [19, -2],
      [27,  -6], [31,  0],  [21, -9], [25,  8],
    ]) {
      rock(sx, sz, 0.4 + Math.random() * 0.5, stoneMat);
    }

    // ── Scattered rubble along the path edges — sign of the pursuit ──────────
    for (const [rx, rz] of [
      [-7, 48], [9, 38], [-5, 25], [8, 10],
      [-10, -5], [6, -18], [-8, -30], [9, -45],
    ]) {
      rubble(rx, rz, 0.2 + Math.random() * 0.3, darkMat);
    }

    // ── The 'leaf' brooch — Lothlórien clasp left by a hobbit ────────────────
    // A gleaming disc near a lore trigger, slightly elevated for visibility
    const leafGeo = new THREE.SphereGeometry(0.22, 10, 7);
    const leafMat = new THREE.MeshStandardMaterial({
      color:     0xd4c070,
      metalness: 0.85,
      roughness: 0.25,
      emissive:  0xb0a040,
      emissiveIntensity: 0.4,
    });
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.position.set(-14, groundY(-14, -32) + 0.28, -32);
    scene.add(leafMesh);

    // Small point light to make it catch the eye
    const leafGlow = new THREE.PointLight(0xd0c060, 1.4, 6);
    leafGlow.position.copy(leafMesh.position);
    scene.add(leafGlow);

    // ── Rohirrim camp remnants — ashes, ring of stones ────────────────────────
    // North of centre — where Éomer's éored rested before dawn
    const campX = 3, campZ = 5;
    const ashMat = new THREE.MeshStandardMaterial({ color: 0x303028, roughness: 0.95 });
    const ashGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.12, 12);
    const ash    = new THREE.Mesh(ashGeo, ashMat);
    ash.position.set(campX, groundY(campX, campZ) + 0.06, campZ);
    scene.add(ash);

    // Ring of fire-stones
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const cx  = campX + Math.cos(ang) * 1.8;
      const cz  = campZ + Math.sin(ang) * 1.8;
      rock(cx, cz, 0.18 + Math.random() * 0.12, MAT.STONE);
    }

    // Dead campfire — no active FX (the éored has ridden on)
    // The char is enough — a live fire here would mislead the narrative.

    // ── Orc-pile remnant — charred mound north-east ───────────────────────────
    // Éomer's éored drove the Uruk-hai against the Entwash — charred debris
    const pileMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.98 });
    for (const [px, pz, pr] of [
      [18, 20, 0.55], [20, 22, 0.42], [17, 23, 0.38],
      [21, 19, 0.30], [19, 21, 0.25], [16, 21, 0.20],
    ]) {
      const g = new THREE.SphereGeometry(pr, 8, 6);
      const m = new THREE.Mesh(g, pileMat);
      m.position.set(px, groundY(px, pz) + pr * 0.3, pz);
      scene.add(m);
    }

    // ── Fangorn tree-line — ancient entwood silhouettes on the horizon ─────────
    // Simple dark massive cylinders suggestion old trees at the -Z edge
    const treeMat = new THREE.MeshStandardMaterial({
      color:    0x1a2010,
      roughness: 1.0,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color:    0x1e2a12,
      roughness: 1.0,
    });

    const fangornTree = (x, z, h, r) => {
      // Trunk
      const tg = new THREE.CylinderGeometry(r * 0.35, r * 0.55, h * 0.55, 9);
      const tm = new THREE.Mesh(tg, treeMat);
      const ty = groundY(x, z);
      tm.position.set(x, ty + h * 0.55 * 0.5 - h * 0.55 * 0.15, z);
      scene.add(tm);

      // Canopy — SphereGeometry for rounded ancient crown
      const cg = new THREE.SphereGeometry(r, 10, 7);
      const cm = new THREE.Mesh(cg, canopyMat);
      cm.position.set(x, ty + h * 0.55 * 0.78 + r * 0.5, z);
      cm.scale.y = 1.3;
      scene.add(cm);
    };

    // First rank — right at the -Z edge
    for (let i = -6; i <= 6; i++) {
      const tx = i * 10 + (Math.random() - 0.5) * 4;
      const tz = -70 + (Math.random() - 0.5) * 6;
      const th = 14 + Math.random() * 8;
      const tr = 3.5 + Math.random() * 2.0;
      fangornTree(tx, tz, th, tr);
    }

    // Second rank — slightly staggered
    for (let i = -5; i <= 5; i++) {
      const tx = i * 12 + (Math.random() - 0.5) * 5;
      const tz = -80 + (Math.random() - 0.5) * 5;
      const th = 16 + Math.random() * 10;
      const tr = 4.0 + Math.random() * 2.5;
      fangornTree(tx, tz, th, tr);
    }

    // ── Long grass tufts — SphereGeometry flattened as clumps ────────────────
    const grassMat = new THREE.MeshStandardMaterial({
      color:    0x8a8440,
      roughness: 1.0,
    });
    const grassPositions = [
      [-18, 55], [12, 50], [-8, 44], [22, 35], [-15, 28],
      [30, 15],  [-26, 8], [14, -8], [-20,-18], [25,-28],
      [-10,-38], [18,-48], [-22,-58],
    ];
    for (const [gx, gz] of grassPositions) {
      for (let j = 0; j < 4; j++) {
        const ox = gx + (Math.random() - 0.5) * 5;
        const oz = gz + (Math.random() - 0.5) * 5;
        const g  = new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 8, 6);
        const m  = new THREE.Mesh(g, grassMat);
        m.scale.set(1 + Math.random() * 0.5, 0.35 + Math.random() * 0.25, 1 + Math.random() * 0.5);
        m.position.set(ox, groundY(ox, oz) + 0.1, oz);
        scene.add(m);
      }
    }

    // ── Sparse boulders — glacial erratics ────────────────────────────────────
    for (const [bx, bz, br] of [
      [-34,  38, 1.2], [ 38,  12, 0.9], [-30, -14, 1.4],
      [ 36, -26, 1.0], [-28, -44, 0.8], [ 32,  44, 1.1],
      [-40,   0, 1.6], [ 40, -50, 0.7],
    ]) {
      rock(bx, bz, br, MAT.STONE);
      // small companion
      rock(bx + (Math.random()-0.5)*2.5, bz + (Math.random()-0.5)*2.5,
           br * 0.5, MAT.STONE_DARK);
    }

    // ── Rider tracks — shallow darker path marking (cosmetic only) ────────────
    // Narrow dark slab along the horse-trail crossing at z≈8 east-west
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x4a4228, roughness: 1.0 });
    for (let i = -4; i <= 4; i++) {
      const tx = i * 8;
      const g  = new THREE.BoxGeometry(1.6, 0.05, 2.0);
      const m  = new THREE.Mesh(g, trackMat);
      m.position.set(tx, groundY(tx, 8) + 0.03, 8);
      scene.add(m);
    }

    return {};
  },

  // ─── onFrame ─────────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // No animated elements in this location — open plains, daytime.
    // The leaf brooch glow is static; could pulse gently here if desired.
  },
};

window.Eastemnet = Eastemnet;
