// moria-doors.js — Doors of Durin (West-gate of Moria)
// Sequence: Eregion ← [moria-doors] → Moria (Durin's Bridge)
// Night scene: dark mountain tarn, narrow cliff-side path, glowing inscription

const MoriaDoors = {
  name: 'The Doors of Durin',
  subtitle: 'West-gate of Moria · The Walls of Moria',

  // ─── Atmosphere ──────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x010408,
    fogDensity:       0.014,
    fogType:          'exponential',
    skyColor:         0x010306,
    ambientColor:     0x050a12,
    ambientIntensity: 1.2,
    moonColor:        0x3a5070,
    moonIntensity:    0.28,
    moonPosition:     { x: -120, y: 160, z: 80 },
    showStars:        true,
    extraLights: [
      // Faint cold fill from the east — reflected off the tarn
      { color: 0x1a2a3a, intensity: 0.18, x: 80, y: 40, z: -20 },
    ],
  },

  // ─── Terrain ─────────────────────────────────────────────────────────────
  // Layout:
  //   +Z (south) = player arrives from Eregion
  //   -Z (north) = cliff face / doors
  //   The tarn (Mirrormere's dark cousin, the pool of Moria) occupies centre-west
  //   A narrow ledge path runs along the east side of the pool
  //   Sheer cliff rises to the east; the mountain wall is to the north

  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // --- pool basin (west-centre, radius ~28, centre at x=-10, z=10) ---
    const px = x - (-10), pz = z - 10;
    const poolDist = Math.sqrt(px * px + pz * pz);
    const poolFloor = -3.2;                     // deep basin
    const poolEdge  = 28;
    const poolBlend = Math.max(0, 1 - poolDist / poolEdge);
    const poolDip   = poolBlend * poolBlend * poolBlend * poolFloor;

    // --- cliff face terrain (rises steeply to the north) ---
    // Mountain wall: tall cliff from z=-10 northward, centred around x=-5
    const cliffBase = -12;
    const cliffRise = z < cliffBase
      ? Math.pow(Math.abs(z - cliffBase) * 0.22, 1.6) * 1.4
      : 0;

    // --- east cliff shoulder (rises steeply for x > 20) ---
    const shoulderRise = x > 18
      ? Math.pow((x - 18) * 0.18, 1.8) * 2.2
      : 0;

    // --- rocky base texture ---
    const rough = fbm(x * 0.09, z * 0.09) * 1.6
                + fbm(x * 0.21, z * 0.21) * 0.55
                + noise(x * 0.38, z * 0.38) * 0.22;

    // --- the narrow ledge path stays relatively flat ---
    // Ledge runs along x ~ 8..14, z from -5 to 55
    const ledgeCx = 11;
    const ledgeDx = Math.abs(x - ledgeCx);
    const ledgeZ  = z > -8 && z < 58 ? 1 : 0;
    const ledgeFlat = ledgeZ * Math.max(0, 1 - ledgeDx / 4) * (-rough * 0.3);

    // --- southern approach: gently slopes down toward the tarn ---
    const southSlope = z > 20 ? (z - 20) * 0.04 : 0;

    let h = rough * 0.5 + cliffRise + shoulderRise + poolDip + southSlope + ledgeFlat;

    // Flatten the ledge path itself
    if (ledgeDx < 3.5 && z > -6 && z < 56) {
      const groundRef = rough * 0.5 + southSlope;
      h = groundRef + 0.4;  // slightly raised ledge
    }

    return h;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Dark wet slate / schist with occasional lichen
    const n = noise2d(vx * 0.15, vz * 0.15);
    const n2 = noise2d(vx * 0.41, vz * 0.37);

    // Base: very dark blue-grey slate
    const slate  = [0.09, 0.10, 0.13];
    // Occasional darker seam
    const seam   = [0.04, 0.05, 0.07];
    // Pool edge: wet dark rock
    const wet    = [0.05, 0.07, 0.10];
    // Lichen patches
    const lichen = [0.12, 0.14, 0.09];

    // Pool proximity
    const px = vx - (-10), pz = vz - 10;
    const poolDist = Math.sqrt(px * px + pz * pz);
    const wetness  = Math.max(0, 1 - poolDist / 32);

    let r = lerp(slate[0], seam[0], n2 * 0.5);
    let g = lerp(slate[1], seam[1], n2 * 0.5);
    let b = lerp(slate[2], seam[2], n2 * 0.5);

    // Wet darkening near pool
    r = lerp(r, wet[0], wetness * 0.7);
    g = lerp(g, wet[1], wetness * 0.7);
    b = lerp(b, wet[2], wetness * 0.7);

    // Lichen on higher ground away from pool
    if (vy > 1.2 && n > 0.65 && poolDist > 20) {
      const lf = (n - 0.65) / 0.35;
      r = lerp(r, lichen[0], lf * 0.5);
      g = lerp(g, lichen[1], lf * 0.5);
      b = lerp(b, lichen[2], lf * 0.5);
    }

    return [r, g, b];
  },

  // Narrow path along the ledge east of the tarn, approaching the cliff face
  onPath(x, z) {
    // Path centreline: x=11, runs z=60 (south approach) down to z=-5 (doors)
    // Then a slight jog west to x=2 as it reaches the cliff face (z=-5 to -12)
    let cx;
    if (z >= -5) {
      cx = 11;
    } else {
      // Curve gently toward the door centreline (x≈0) as z → -12
      const t = Math.max(0, Math.min(1, (-5 - z) / 7));
      cx = lerp2(11, 0, t);
    }
    function lerp2(a, b, t) { return a + (b - a) * t; }
    const dx = Math.abs(x - cx);
    return Math.max(0, 1 - dx / 2.5);
  },

  pathWaypoints: [
    [11,  68],   // arrives from Eregion to the south
    [11,  48],
    [11,  28],
    [11,  10],
    [11,  -2],
    [ 6,  -8],   // gentle curve toward door centre
    [ 0, -14],   // path ends at the door
  ],

  // ─── Lore ─────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 0, z: -14 },
      radius: 7,
      text:   '"The Doors of Durin, Lord of Moria. Speak, friend, and enter."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: -10, z: 10 },
      radius: 6,
      text:   '"Before them, at the foot of a steep fall of rock, lay the dark still water of the Mirrormere, or Kheled-zâram in the Dwarvish tongue. Out of the shadows the doors stood; invisible, not a crack or hinge showing."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: 11, z: 40 },
      radius: 5,
      text:   '"Long lists of their labours and their wars were graven on the rock. But all that could be read was: HERE ARE THE HALLS OF THE DWARVES. DURIN\'S FOLK. BUILT IN THE DEEPS OF TIME."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: -22, z: -8 },
      radius: 5,
      text:   '"Gandalf stood before the rock and stared at the smooth grey face. Then slowly, under his gaze, the faint design glimmered like moonlight on misty water: an arch with two trees, and a star above."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
  ],

  // ─── Player positions ─────────────────────────────────────────────────────
  start: { x: 11, z: 60, yaw: Math.PI },   // facing north toward the cliff

  arrivals: {
    eregion:       { x: 11, z: 62, yaw: Math.PI },       // from south
    'moria-bridge':{ x:  0, z: -20, yaw: Math.PI * 0.5 }, // emerging from inside
  },

  boundary: 90,

  // ─── Transitions ──────────────────────────────────────────────────────────
  transitions: [
    {
      // South: back to Eregion
      trigger: { x: 11, z: 74, radius: 8 },
      to: 'eregion',
    },
    {
      // North: through the open doors into Moria
      // Only active when doors are open — gating logic handled via doorsOpen flag
      trigger: { x: 0, z: -20, radius: 6 },
      to: 'moria-bridge',
    },
  ],

  // ─── Walkables ────────────────────────────────────────────────────────────
  walkables: [
    // Narrow ledge path along east side of pool (keeps player above the waterline)
    { x: 11, z: 42, yaw: 0, length: 30, width: 5, yStart: 0.45, yEnd: 0.55 },
    { x: 11, z: 18, yaw: 0, length: 28, width: 5, yStart: 0.40, yEnd: 0.45 },
    { x: 11, z: -2, yaw: 0, length: 16, width: 5, yStart: 0.40, yEnd: 0.42 },
    // Gentle curve west toward the doors
    { x: 5.5, z: -8,  yaw: 0.38, length: 14, width: 4.5, yStart: 0.40, yEnd: 0.38 },
    // Apron before the doors
    { x: 0,   z: -15, yaw: 0, length: 6, width: 8, yStart: 0.38, yEnd: 0.38 },
  ],

  // ─── Scene ────────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    // ── helpers ──────────────────────────────────────────────────────────────
    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      if (sx !== undefined) m.scale.set(sx, sy || sx, sz || sx);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // ── Materials ─────────────────────────────────────────────────────────────
    const matCliff = new THREE.MeshStandardMaterial({
      color: 0x0a0c0f, roughness: 0.98, metalness: 0.04,
    });
    const matWetRock = new THREE.MeshStandardMaterial({
      color: 0x080b10, roughness: 0.88, metalness: 0.06,
    });
    const matDoorFrame = new THREE.MeshStandardMaterial({
      color: 0x1c2028, roughness: 0.92, metalness: 0.08,
    });
    const matDoorLeaf = new THREE.MeshStandardMaterial({
      color: 0x141820, roughness: 0.85, metalness: 0.12,
    });
    // Inscription glyph material — starts invisible, lit by proximity
    const matInscription = new THREE.MeshStandardMaterial({
      color:     0xb8d4ff,
      emissive:  new THREE.Color(0x3a6aaa),
      emissiveIntensity: 0,
      roughness: 0.3,
      metalness: 0.4,
      transparent: true,
      opacity: 0,
    });
    const matInscriptionLeaf = new THREE.MeshStandardMaterial({
      color:     0x88aadd,
      emissive:  new THREE.Color(0x2255aa),
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0.3,
      transparent: true,
      opacity: 0,
    });

    // Water material
    const matWater = new THREE.MeshStandardMaterial({
      color: 0x020508,
      roughness: 0.02,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
    });

    // Debris/rubble
    const matRubble = new THREE.MeshStandardMaterial({
      color: 0x0d1018, roughness: 0.97, metalness: 0.02,
    });

    // ── Tarn (the black pool) ─────────────────────────────────────────────────
    // Flat disc centred at x=-10, z=10, just below terrain zero
    const waterGeo = new THREE.CircleGeometry(27, 40);
    const water    = new THREE.Mesh(waterGeo, matWater);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-10, -3.05, 10);
    water.receiveShadow = true;
    scene.add(water);

    // Shallow mist plane above the water
    const mistMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, transparent: true, opacity: 0.18,
      roughness: 1, metalness: 0,
      depthWrite: false,
    });
    const mistGeo = new THREE.CircleGeometry(29, 36);
    const mist    = new THREE.Mesh(mistGeo, mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(-10, -2.6, 10);
    scene.add(mist);

    // ── The Cliff Face / Mountain Wall ────────────────────────────────────────
    // A massive dark slab behind the doors (north face, z ≈ -18)
    const cliffGeo = new THREE.BoxGeometry(80, 90, 12);
    const cliff    = addMesh(cliffGeo, matCliff, -5, 38, -24);

    // Side buttress walls (east and west flanking cliff)
    const buttressGeo = new THREE.BoxGeometry(14, 70, 50);
    addMesh(buttressGeo, matCliff, -38, 30, -8);   // west
    addMesh(buttressGeo, matCliff,  28, 30, -8);   // east

    // ── The Arch of the Doors ─────────────────────────────────────────────────
    // Door opening is ~6 wide, ~10 tall, centred at x=0, z=-17
    // We carve the appearance with geometry layering (no CSG needed — just frame pieces)

    const doorX  =  0;
    const doorZ  = -17;
    const doorW  =  6.4;
    const doorH  = 10.2;
    const doorY  = groundY(doorX, doorZ) + doorH / 2;

    // Frame: top lintel slab
    addMesh(new THREE.BoxGeometry(doorW + 3.6, 1.4, 2), matDoorFrame,
      doorX, doorY + doorH / 2 + 0.5, doorZ);

    // Frame: side jambs
    addMesh(new THREE.BoxGeometry(1.6, doorH + 2, 2), matDoorFrame,
      doorX - doorW / 2 - 0.9, doorY, doorZ);
    addMesh(new THREE.BoxGeometry(1.6, doorH + 2, 2), matDoorFrame,
      doorX + doorW / 2 + 0.9, doorY, doorZ);

    // Arch curve (approximated with cylinder slices)
    const archR  = doorW / 2 + 0.2;
    const archCY = doorY + doorH / 2;
    const archSegs = 10;
    for (let i = 0; i < archSegs; i++) {
      const a0 = Math.PI * (i / archSegs);
      const a1 = Math.PI * ((i + 1) / archSegs);
      const ax  = Math.cos((a0 + a1) / 2) * archR;
      const ay  = Math.sin((a0 + a1) / 2) * archR;
      const len = archR * (a1 - a0) + 0.05;
      const angle = -(a0 + a1) / 2 + Math.PI / 2;
      const block = new THREE.BoxGeometry(len * 1.1, 1.2, 2);
      const bm    = new THREE.Mesh(block, matDoorFrame);
      bm.position.set(doorX - ax, archCY + ay, doorZ);
      bm.rotation.z = -angle;
      bm.castShadow = true;
      scene.add(bm);
    }

    // ── Inscription glyphs (Tengwar stars, trees, arch outlines) ──────────────
    // We build simple stand-in geometry for the glowing markings.
    // Group that will be animated for glow intensity.
    const inscriptionGroup = new THREE.Group();

    // Arch outline (thin flat strips following the arch shape)
    const archOutlineR = archR + 0.5;
    const archOutlineSegs = 18;
    for (let i = 0; i < archOutlineSegs; i++) {
      const a0 = Math.PI * (i / archOutlineSegs);
      const a1 = Math.PI * ((i + 1) / archOutlineSegs);
      const ax  = Math.cos((a0 + a1) / 2) * archOutlineR;
      const ay  = Math.sin((a0 + a1) / 2) * archOutlineR;
      const len = archOutlineR * (a1 - a0) + 0.04;
      const angle = -(a0 + a1) / 2 + Math.PI / 2;
      const sliver = new THREE.BoxGeometry(len * 1.05, 0.22, 0.18);
      const sm     = new THREE.Mesh(sliver, matInscription);
      sm.position.set(doorX - ax, archCY + ay, doorZ - 0.9);
      sm.rotation.z = -angle;
      inscriptionGroup.add(sm);
    }

    // Inscription side lines (vertical beside the jambs)
    for (let side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const gy = doorY - doorH / 2 + 1 + i * 1.5;
        const sliver = new THREE.BoxGeometry(0.18, 1.1, 0.18);
        const sm     = new THREE.Mesh(sliver, matInscription);
        sm.position.set(doorX + side * (doorW / 2 + 2.2), gy, doorZ - 0.9);
        inscriptionGroup.add(sm);
      }
    }

    // Star of Durin (seven-pointed — approximated with two overlapping diamonds)
    const starY = archCY + archR + 1.4;
    const starPoints = 7;
    for (let i = 0; i < starPoints; i++) {
      const a   = (i / starPoints) * Math.PI * 2 - Math.PI / 2;
      const len = i % 2 === 0 ? 1.1 : 0.65;
      const ray = new THREE.BoxGeometry(0.16, len, 0.16);
      const rm  = new THREE.Mesh(ray, matInscription);
      rm.position.set(
        doorX + Math.cos(a) * (len * 0.5 + 0.05),
        starY  + Math.sin(a) * (len * 0.5 + 0.05),
        doorZ - 0.9
      );
      rm.rotation.z = a + Math.PI / 2;
      inscriptionGroup.add(rm);
    }

    // Two trees flanking the door (stylised branching lines)
    function addTree(cx, treeY) {
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 3.0, 0.18), matInscription);
      trunk.position.set(cx, treeY + 1.4, doorZ - 0.9);
      inscriptionGroup.add(trunk);
      // Branches — 5 per side
      const branchAngles = [0.4, 0.65, 0.9, 1.1, 1.3];
      for (const ba of branchAngles) {
        for (const side of [-1, 1]) {
          const blen = (1.5 - ba * 0.6) * 0.8;
          const b = new THREE.Mesh(
            new THREE.BoxGeometry(blen, 0.16, 0.15), matInscription);
          const bx = cx + side * Math.cos(ba) * blen * 0.5;
          const by = treeY + ba * 1.2 + 0.4;
          b.position.set(bx, by, doorZ - 0.9);
          b.rotation.z = side * ba;
          inscriptionGroup.add(b);
        }
      }
    }
    addTree(-1.8, doorY - doorH / 2 + 0.5);
    addTree( 1.8, doorY - doorH / 2 + 0.5);

    scene.add(inscriptionGroup);

    // ── Door Leaves (the two physical stone halves) ───────────────────────────
    // Left and right halves, pivoted at x = ±doorW/2, z = doorZ
    // They will swing open when the player is very close.

    const doorLeafGeo = new THREE.BoxGeometry(doorW / 2, doorH, 0.4);

    const doorLeft  = new THREE.Mesh(doorLeafGeo, matDoorLeaf);
    const doorRight = new THREE.Mesh(doorLeafGeo, matDoorLeaf);

    // Pivot the doors at their outer edge
    // We'll parent each leaf to a pivot group so rotation opens them outward
    const pivotLeft  = new THREE.Object3D();
    const pivotRight = new THREE.Object3D();

    pivotLeft.position.set(doorX - doorW / 2, doorY, doorZ);
    pivotRight.position.set(doorX + doorW / 2, doorY, doorZ);

    doorLeft.position.set(doorW / 4, 0, 0);
    doorRight.position.set(-doorW / 4, 0, 0);

    pivotLeft.add(doorLeft);
    pivotRight.add(doorRight);
    scene.add(pivotLeft);
    scene.add(pivotRight);

    // Leaf inscription overlay (glowing runes on the door surface itself)
    const leafGlyphGeo = new THREE.BoxGeometry(2.4, 6.0, 0.22);
    const leafGlyphL   = new THREE.Mesh(leafGlyphGeo, matInscriptionLeaf);
    const leafGlyphR   = new THREE.Mesh(leafGlyphGeo, matInscriptionLeaf);
    leafGlyphL.position.set(doorW / 4,  0, 0.3);
    leafGlyphR.position.set(-doorW / 4, 0, 0.3);
    pivotLeft.add(leafGlyphL);
    pivotRight.add(leafGlyphR);

    // ── Ambient door glow light (proximity-activated, starts at 0) ───────────
    const doorGlow = new THREE.PointLight(0x4466cc, 0, 18);
    doorGlow.position.set(doorX, doorY, doorZ + 1);
    scene.add(doorGlow);

    // Backfill glow (inside, so opening looks like depth)
    const innerGlow = new THREE.PointLight(0x223355, 0, 22);
    innerGlow.position.set(doorX, doorY, doorZ - 4);
    scene.add(innerGlow);

    // ── Scattered boulders around the pool edge ───────────────────────────────
    const boulderPositions = [
      [-28,  -5, 1.3], [-24,   2, 1.0], [-32,  12, 1.5],
      [-26,  22, 1.1], [-18,  30, 0.9], [-10,  34, 1.2],
      [  2,  32, 0.85],[ 16,  24, 1.0], [ 20,  14, 0.7],
      [ 18,   0, 1.1], [ 14, -10, 0.8], [  4, -14, 0.6],
      [-14, -12, 1.4], [-22, -8,  1.0], [-30, -2,  1.3],
    ];
    for (const [bx, bz, br] of boulderPositions) {
      const by = groundY(bx, bz) + br * 0.45;
      addMesh(new THREE.SphereGeometry(br, 10, 7), matWetRock, bx, by, bz);
    }

    // ── Rocky rubble flanking the path ────────────────────────────────────────
    const rubbleChunks = [
      [14, 50, 0.4], [16, 44, 0.3], [13, 38, 0.5],
      [15, 30, 0.35],[14, 22, 0.4], [16, 16, 0.3],
      [ 8, 48, 0.3], [ 7, 34, 0.35],[ 9, 20, 0.3],
      [14,  6, 0.4], [13,  0, 0.3], [12, -4, 0.35],
    ];
    for (const [rx, rz, rr] of rubbleChunks) {
      const ry = groundY(rx, rz) + rr * 0.25;
      addMesh(new THREE.SphereGeometry(rr, 8, 6), matRubble, rx, ry, rz);
    }

    // ── Flat stones / slabs forming rough paving near the door ───────────────
    const slabPositions = [
      [ 0, -11], [-2, -9], [2, -9],
      [-1, -7 ], [ 1, -7], [3, -8],
      [ 5, -10], [-3,-11],
    ];
    for (const [sx, sz] of slabPositions) {
      const sy = groundY(sx, sz) + 0.08;
      const w  = 1.2 + Math.random() * 0.9;
      const d  = 0.9 + Math.random() * 0.7;
      addMesh(new THREE.BoxGeometry(w, 0.18, d), MAT.STONE,
        sx, sy, sz, 0, Math.random() * Math.PI, 0);
    }

    // ── Large fallen column ───────────────────────────────────────────────────
    {
      const cx = -8, cz = -6;
      const cy = groundY(cx, cz) + 0.8;
      addMesh(new THREE.CylinderGeometry(0.55, 0.65, 5.5, 9), MAT.STONE_DARK,
        cx, cy, cz, 0, 0, Math.PI / 2); // lying on its side
    }

    // ── Old iron torch bracket (unlit) ────────────────────────────────────────
    {
      const tx = 8, tz = -5;
      const ty = groundY(tx, tz) + 3.2;
      addMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 6), matRubble, tx, ty, tz);
      addMesh(new THREE.CylinderGeometry(0.12, 0.08, 0.3, 6), matRubble, tx, ty + 0.38, tz);
    }

    // ── Ripple ring on the water surface (for the Watcher) ───────────────────
    // Static thin torus — onFrame will pulse its opacity
    const rippleMat = new THREE.MeshStandardMaterial({
      color: 0x0a1520, transparent: true, opacity: 0, roughness: 0.4,
      depthWrite: false,
    });
    const rippleMat2 = rippleMat.clone();
    const rippleRing  = new THREE.Mesh(new THREE.TorusGeometry(4, 0.12, 6, 40), rippleMat);
    const rippleRing2 = new THREE.Mesh(new THREE.TorusGeometry(7, 0.10, 6, 40), rippleMat2);
    rippleRing.rotation.x  = -Math.PI / 2;
    rippleRing2.rotation.x = -Math.PI / 2;
    rippleRing.position.set(-14, -2.95, 6);
    rippleRing2.position.set(-14, -2.92, 6);
    scene.add(rippleRing);
    scene.add(rippleRing2);

    // ── Return refs for onFrame ───────────────────────────────────────────────
    return {
      doorGlow,
      innerGlow,
      inscriptionGroup,
      matInscription,
      matInscriptionLeaf,
      pivotLeft,
      pivotRight,
      leafGlyphL,
      leafGlyphR,
      water,
      rippleRing,
      rippleMat,
      rippleRing2,
      rippleMat2,
      // track door state
      _doorsOpen: false,
      _doorsOpenAmt: 0,   // 0 = closed, 1 = open (animated)
      _glowAmt: 0,
    };
  },

  onFrame(t, dt, refs, playerPos) {
    if (!refs) return;

    // ── Proximity glow: use playerPos THREE.Vector3 passed by engine ──────────
    const doorX = 0, doorZ = -17;
    const dx    = playerPos.x - doorX;
    const dz    = playerPos.z - doorZ;
    const distToDoor = Math.sqrt(dx * dx + dz * dz);

    // Glow appears within 18 units, full strength within 6 units
    const targetGlow = distToDoor < 18
      ? Math.max(0, Math.min(1, (18 - distToDoor) / 12))
      : 0;

    refs._glowAmt = refs._glowAmt + (targetGlow - refs._glowAmt) * Math.min(1, dt * 1.2);
    const g = refs._glowAmt;

    // Inscription group — opacity and emissive
    refs.matInscription.opacity          = g * 0.92;
    refs.matInscription.emissiveIntensity = g * 2.8 + Math.sin(t * 0.7) * g * 0.3;

    refs.matInscriptionLeaf.opacity           = g * 0.7;
    refs.matInscriptionLeaf.emissiveIntensity = g * 1.8 + Math.sin(t * 0.9 + 1.2) * g * 0.2;

    refs.doorGlow.intensity  = g * 0.9;
    refs.innerGlow.intensity = g * 0.5;

    // ── Door opening: if very close AND player is pressing forward ─────────────
    // Doors open when within 5 units (you've found the word: mellon)
    const doorsActivated = distToDoor < 5.5;
    if (doorsActivated && !refs._doorsOpen) {
      refs._doorsOpen = true;
    }

    const targetOpenAmt = refs._doorsOpen ? 1 : 0;
    refs._doorsOpenAmt += (targetOpenAmt - refs._doorsOpenAmt) * Math.min(1, dt * 0.55);

    const openAngle = refs._doorsOpenAmt * Math.PI * 0.48; // ~86° swing
    refs.pivotLeft.rotation.y  = -openAngle;
    refs.pivotRight.rotation.y =  openAngle;

    // ── Water shimmer (subtle Y ripple in UV, using water position) ───────────
    // No UV offset available on standard mat; we animate the mist opacity instead
    // to suggest light playing on the surface
    if (refs.water && refs.water.material) {
      refs.water.material.opacity = 0.85 + Math.sin(t * 0.31) * 0.03
                                        + Math.sin(t * 0.77) * 0.02;
    }

    // ── Watcher ripples ───────────────────────────────────────────────────────
    // Two slow-expanding rings, offset in phase
    const rCycle = 12; // seconds per ripple pulse
    const r1Phase = (t % rCycle) / rCycle;
    const r2Phase = ((t + rCycle * 0.5) % rCycle) / rCycle;

    // Ring 1
    refs.rippleRing.scale.set(1 + r1Phase * 2.2, 1, 1 + r1Phase * 2.2);
    refs.rippleMat.opacity = 0.22 * Math.sin(r1Phase * Math.PI) * (0.5 + 0.5 * g);

    // Ring 2
    refs.rippleRing2.scale.set(1 + r2Phase * 2.8, 1, 1 + r2Phase * 2.8);
    refs.rippleMat2.opacity = 0.15 * Math.sin(r2Phase * Math.PI) * (0.5 + 0.5 * g);
  },
};

window.MoriaDoors = MoriaDoors;
