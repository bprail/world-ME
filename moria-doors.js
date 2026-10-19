// moria-doors.js — Doors of Durin (West-gate of Moria)
// Sequence: Eregion ← [moria-doors] → Moria (Durin's Bridge)
// Night scene: dark mountain tarn, narrow cliff-side path, glowing inscription,
//              antechamber revealed when doors swing open.

const MoriaDoors = {
  name: 'The Doors of Durin',
  subtitle: 'West-gate of Moria · The Walls of Moria',

  // ─── Atmosphere ────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:         0x010408,
    fogDensity:       0.013,
    fogType:          'exponential',
    skyColor:         0x010306,
    ambientColor:     0x0d1a28,
    ambientIntensity: 1.6,
    // Moon comes from the south-east, low angle, so it rakes across
    // the north-facing cliff wall and the door face directly.
    moonColor:        0x5a7899,
    moonIntensity:    0.55,
    moonPosition:     { x: 40, y: 80, z: 120 },   // south-east, low — rakes cliff face
    showStars:        true,
    extraLights:      [],   // no extra directionals — they bounce off the pool
  },

  // ─── Terrain ───────────────────────────────────────────────────────────────
  // Layout (bird's eye, north = -Z):
  //
  //   West  |  tarn (large, x=-5...-55, z=-10...40)  |  ledge (x=8..14)  |  East cliff
  //   South approach from Eregion at z=+60
  //   North cliff face at z≈-18 with the doors centred at x=0
  //   Antechamber carved behind the cliff: z=-18 to -42, x=-8 to +8
  //
  // The terrain mesh naturally rises north (cliffRise) and east (shoulderRise).
  // The antechamber is punched flat in the terrain north of the doors —
  // actual floor/ceiling geometry is added in buildScene.

  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // ── large tarn basin ─────────────────────────────────────────────────────
    // Centre at x=-28, z=14. East radius deliberately short (rx=26) so the
    // pool edge stops well west of the ledge path (x≈11) and the door apron.
    // The water plane is large enough to fill the whole west half visually.
    const pcx = x - (-28), pcz = z - 14;
    const poolRX = 30, poolRZ = 50;
    const poolEllipse = (pcx / poolRX) * (pcx / poolRX) + (pcz / poolRZ) * (pcz / poolRZ);
    const poolFloor   = -2.2;
    const poolBlend   = Math.max(0, 1 - poolEllipse);
    const poolDip     = poolBlend * poolBlend * poolFloor;

    // ── north cliff rise ──────────────────────────────────────────────────────
    const cliffBase = -14;
    const cliffRise = z < cliffBase
      ? Math.pow(Math.abs(z - cliffBase) * 0.20, 1.5) * 1.6
      : 0;

    // ── east cliff shoulder ───────────────────────────────────────────────────
    const shoulderRise = x > 20
      ? Math.pow((x - 20) * 0.16, 1.8) * 2.4
      : 0;

    // ── rocky base noise ──────────────────────────────────────────────────────
    const rough = fbm(x * 0.09, z * 0.09) * 1.6
                + fbm(x * 0.21, z * 0.21) * 0.55
                + noise(x * 0.38, z * 0.38) * 0.22;

    // ── ledge path: flat strip x≈11, z=-6..58 ────────────────────────────────
    const ledgeDx = Math.abs(x - 11);
    const southSlope = z > 20 ? (z - 20) * 0.04 : 0;

    let h = rough * 0.5 + cliffRise + shoulderRise + poolDip + southSlope;

    // Clamp deep inside pool basin
    if (poolEllipse < 0.6) {
      h = Math.min(h, poolFloor + 0.3);
    }

    // ── ledge path corridor: always above water level ─────────────────────────
    if (ledgeDx < 3.5 && z > -18 && z < 58) {
      // Flat ledge with slight natural variation, always >= 0.5 above water Y(-1.6)
      h = Math.max(rough * 0.5 + southSlope + 0.4, 0.5);
    }

    // ── door apron: wide flat shelf in front of the cliff face ────────────────
    // x=-8..8, z=-5..-18 — guaranteed solid ground above pool level
    if (x > -8 && x < 8 && z < -5 && z > -18) {
      h = Math.max(h, 0.5);
    }

    // ── antechamber zone ──────────────────────────────────────────────────────
    if (x > -10 && x < 10 && z < -18 && z > -44) {
      h = 0.2;
    }

    return h;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const n  = noise2d(vx * 0.15, vz * 0.15);
    const n2 = noise2d(vx * 0.41, vz * 0.37);

    const slate  = [0.18, 0.20, 0.26];
    const seam   = [0.09, 0.10, 0.14];
    const wet    = [0.10, 0.13, 0.19];
    const lichen = [0.22, 0.26, 0.16];

    const px = vx - (-28), pz = vz - 14;
    const poolDist = Math.sqrt(px * px + pz * pz);
    const wetness  = Math.max(0, 1 - poolDist / 48);

    let r = lerp(slate[0], seam[0], n2 * 0.5);
    let g = lerp(slate[1], seam[1], n2 * 0.5);
    let b = lerp(slate[2], seam[2], n2 * 0.5);

    r = lerp(r, wet[0], wetness * 0.7);
    g = lerp(g, wet[1], wetness * 0.7);
    b = lerp(b, wet[2], wetness * 0.7);

    if (vy > 1.2 && n > 0.65 && poolDist > 38) {
      const lf = (n - 0.65) / 0.35;
      r = lerp(r, lichen[0], lf * 0.5);
      g = lerp(g, lichen[1], lf * 0.5);
      b = lerp(b, lichen[2], lf * 0.5);
    }

    return [r, g, b];
  },

  onPath(x, z) {
    let cx;
    if (z >= -5) {
      cx = 11;
    } else {
      const t = Math.max(0, Math.min(1, (-5 - z) / 8));
      cx = 11 + (0 - 11) * t;
    }
    const dx = Math.abs(x - cx);
    return Math.max(0, 1 - dx / 2.5);
  },

  pathWaypoints: [
    [11,  68],
    [11,  48],
    [11,  28],
    [11,  10],
    [11,  -2],
    [ 6,  -8],
    [ 0, -14],
  ],

  // ─── Lore ──────────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 11, z: 44 },
      radius: 6,
      text:   '"The road climbed on. And now they could see the dark water lying still at the foot of the cliff, and beyond it the smooth grey face of the mountain wall."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: 11, z: 22 },
      radius: 6,
      text:   '"Before them, at the foot of a steep fall of rock, lay the dark still water. Out of the shadows the doors stood; invisible, not a crack or hinge showing."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: 9, z: 2 },
      radius: 5,
      text:   '"Gandalf stood before the rock and stared at the smooth grey face. Slowly, under his gaze, the faint design glimmered like moonlight on misty water: an arch with two trees, and a star above."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
    {
      pos:    { x: 2, z: -14 },
      radius: 6,
      text:   '"The Doors of Durin, Lord of Moria. Speak, friend, and enter."',
      cite:   '— The Fellowship of the Ring, Book II, Ch. 4',
    },
  ],

  // ─── Player positions ───────────────────────────────────────────────────────
  start: { x: 11, z: 55, yaw: 0 },

  arrivals: {
    eregion:       { x: 11, z: 55, yaw: 0 },
    moriabridge:   { x:  0, z: -38, yaw: Math.PI },  // deep inside antechamber
  },

  boundary: 95,

  // ─── Transitions ────────────────────────────────────────────────────────────
  transitions: [
    {
      trigger: { x: 11, z: 82, radius: 6 },
      to: 'eregion',
    },
    {
      // Trigger well inside the antechamber — player must walk through the open doors
      trigger: { x: 0, z: -40, radius: 5 },
      to: 'moriabridge',
    },
  ],

  // ─── Walkables ──────────────────────────────────────────────────────────────
  walkables: [
    // Ledge path east of tarn
    { x: 11, z: 42, yaw: 0, length: 30, width: 5, yStart: 0.45, yEnd: 0.55 },
    { x: 11, z: 18, yaw: 0, length: 28, width: 5, yStart: 0.40, yEnd: 0.45 },
    { x: 11, z: -2, yaw: 0, length: 16, width: 5, yStart: 0.40, yEnd: 0.42 },
    // Curve west to door apron
    { x: 5.5, z: -8,  yaw: 0.38, length: 14, width: 4.5, yStart: 0.40, yEnd: 0.38 },
    // Apron directly in front of the doors
    { x: 0, z: -15, yaw: 0, length: 6, width: 9, yStart: 0.38, yEnd: 0.38 },
    // ── Antechamber floor (flat, slightly above terrain zero) ─────────────────
    // Runs from just behind the door plane (z=-18) back to z=-44
    // Width 16 spans x=-8 to x=+8, matching the chamber walls in buildScene
    { x: 0, z: -31, yaw: 0, length: 26, width: 16, yStart: 0.35, yEnd: 0.35 },
  ],

  // ─── Scene ──────────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT) {

    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
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
    const matChamber = new THREE.MeshStandardMaterial({
      color: 0x080a0d, roughness: 0.97, metalness: 0.03,
      side: THREE.BackSide,   // cave interior — normals face inward
    });
    const matChamberFloor = new THREE.MeshStandardMaterial({
      color: 0x0c0e12, roughness: 0.95, metalness: 0.04,
    });
    const matInscription = new THREE.MeshStandardMaterial({
      color: 0xb8d4ff, emissive: new THREE.Color(0x3a6aaa),
      emissiveIntensity: 0, roughness: 0.3, metalness: 0.4,
      transparent: true, opacity: 0,
    });
    const matInscriptionLeaf = new THREE.MeshStandardMaterial({
      color: 0x88aadd, emissive: new THREE.Color(0x2255aa),
      emissiveIntensity: 0, roughness: 0.35, metalness: 0.3,
      transparent: true, opacity: 0,
    });
    const matWater = new THREE.MeshStandardMaterial({
      color: 0x020810, roughness: 0.03, metalness: 0.0,
      transparent: true, opacity: 0.90,
    });
    const matRubble = new THREE.MeshStandardMaterial({
      color: 0x0d1018, roughness: 0.97, metalness: 0.02,
    });

    // ── Large tarn ────────────────────────────────────────────────────────────
    // PlaneGeometry covers the full west half of the scene.
    // Y = -1.6: the basin terrain is clamped to max -1.7 inside the pool,
    // so the water surface is always visible above the rock floor.
    // The plane is intentionally oversized — the pool edges are masked by
    // terrain rising above the water level at the ellipse boundary.
    const waterGeo = new THREE.PlaneGeometry(110, 110, 1, 1);
    const water    = new THREE.Mesh(waterGeo, matWater);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-28, -1.6, 14);
    water.receiveShadow = true;
    scene.add(water);

    // Mist plane just above water surface
    const mistMat = new THREE.MeshStandardMaterial({
      color: 0x060d18, transparent: true, opacity: 0.14,
      roughness: 1, metalness: 0, depthWrite: false,
    });
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(116, 116, 1, 1), mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(-28, -1.1, 14);
    scene.add(mist);

    // ── Cliff face — main mountain wall slab ──────────────────────────────────
    // Wide enough to hide the scene edge; centred behind the doors at z=-22
    // Cliff is split: a lower section (full width) + upper section, so the door
    // opening is a real gap and not just painted on.
    const cliffW  = 90;
    const cliffH  = 80;

    // Lower wall — fills everything except the door gap
    // Left of door gap
    addMesh(new THREE.BoxGeometry((cliffW / 2) - 3.2 - 1.8, cliffH, 10),
      matCliff, -(cliffW / 4) - 1.8 + 3.2 / 2, cliffH / 2 - 2, -22);
    // Right of door gap
    addMesh(new THREE.BoxGeometry((cliffW / 2) - 3.2 - 1.8, cliffH, 10),
      matCliff,  (cliffW / 4) + 1.8 - 3.2 / 2, cliffH / 2 - 2, -22);
    // Above the door arch (full width, higher up)
    addMesh(new THREE.BoxGeometry(cliffW, cliffH - 14, 10),
      matCliff, 0, cliffH / 2 - 2 + 14, -22);

    // East and west buttress walls flanking the cliff
    addMesh(new THREE.BoxGeometry(18, 70, 55), matCliff, -48, 30, -10);
    addMesh(new THREE.BoxGeometry(18, 70, 55), matCliff,  48, 30, -10);

    // ── Antechamber ───────────────────────────────────────────────────────────
    // A rectangular cave room behind the doors, x=-8..+8, z=-18..-44, h=10
    // Walls use BackSide material so they appear as an interior space.
    // The door frame and closed doors block the view; opening reveals the chamber.

    const chamW = 16;   // east-west
    const chamD = 26;   // north-south depth  (z=-18 to z=-44)
    const chamH = 10;   // interior height
    const chamCX = 0;
    const chamCZ = -31; // centre of chamber depth
    const chamFloorY = 0.35;
    const chamCeilY  = chamFloorY + chamH;

    // Floor slab (visible top face)
    addMesh(new THREE.BoxGeometry(chamW, 0.5, chamD),
      matChamberFloor, chamCX, chamFloorY - 0.25, chamCZ);

    // Ceiling
    addMesh(new THREE.BoxGeometry(chamW + 0.4, 0.6, chamD + 0.4),
      matCliff, chamCX, chamCeilY + 0.3, chamCZ);

    // North back wall (far end of chamber)
    addMesh(new THREE.BoxGeometry(chamW, chamH, 0.8),
      matCliff, chamCX, chamFloorY + chamH / 2, -44);

    // East wall
    addMesh(new THREE.BoxGeometry(0.8, chamH, chamD),
      matCliff, chamCX + chamW / 2, chamFloorY + chamH / 2, chamCZ);

    // West wall
    addMesh(new THREE.BoxGeometry(0.8, chamH, chamD),
      matCliff, chamCX - chamW / 2, chamFloorY + chamH / 2, chamCZ);

    // South wall of chamber = the cliff face itself (already present).
    // We add a thin inner face at z=-18 with the door hole cut out:
    // Left panel
    addMesh(new THREE.BoxGeometry(chamW / 2 - 3.2, chamH, 0.7),
      matCliff, chamCX - chamW / 4 - 1.6, chamFloorY + chamH / 2, -18);
    // Right panel
    addMesh(new THREE.BoxGeometry(chamW / 2 - 3.2, chamH, 0.7),
      matCliff, chamCX + chamW / 4 + 1.6, chamFloorY + chamH / 2, -18);
    // Lintel above door opening on inner face
    addMesh(new THREE.BoxGeometry(chamW, chamH - 10.2, 0.7),
      matCliff, chamCX, chamFloorY + chamH - (chamH - 10.2) / 2, -18);

    // Scattered rubble on chamber floor
    const chamberRubble = [
      [-3, -22, 0.28], [2, -25, 0.22], [-5, -30, 0.35],
      [4, -34, 0.25],  [-2, -38, 0.30],[3, -28, 0.20],
      [-4, -40, 0.26], [5, -22, 0.18],
    ];
    for (const [rx, rz, rr] of chamberRubble) {
      addMesh(new THREE.SphereGeometry(rr, 8, 6), matRubble,
        rx, chamFloorY + rr * 0.25, rz);
    }

    // Dim light deep in the chamber — just enough to show the space
    // (faint blue-green, as if phosphorescent lichen or distant Moria glow)
    const chamberLight = new THREE.PointLight(0x0a1a10, 0.35, 30);
    chamberLight.position.set(0, chamFloorY + 3, -36);
    scene.add(chamberLight);

    // ── Door frame / arch ─────────────────────────────────────────────────────
    const doorX = 0, doorZ = -17;
    const doorW = 6.4, doorH = 10.2;
    const doorY = groundY(doorX, doorZ) + doorH / 2;

    // Lintel
    addMesh(new THREE.BoxGeometry(doorW + 3.6, 1.4, 2.4),
      matDoorFrame, doorX, doorY + doorH / 2 + 0.5, doorZ);
    // Side jambs
    addMesh(new THREE.BoxGeometry(1.8, doorH + 2, 2.4),
      matDoorFrame, doorX - doorW / 2 - 1.0, doorY, doorZ);
    addMesh(new THREE.BoxGeometry(1.8, doorH + 2, 2.4),
      matDoorFrame, doorX + doorW / 2 + 1.0, doorY, doorZ);

    // Arch voussoirs
    const archR   = doorW / 2 + 0.2;
    const archCY  = doorY + doorH / 2;
    const archSegs = 10;
    for (let i = 0; i < archSegs; i++) {
      const a0 = Math.PI * (i / archSegs);
      const a1 = Math.PI * ((i + 1) / archSegs);
      const am  = (a0 + a1) / 2;
      const ax  = Math.cos(am) * archR;
      const ay  = Math.sin(am) * archR;
      const len = archR * (a1 - a0) + 0.05;
      const bm  = new THREE.Mesh(
        new THREE.BoxGeometry(len * 1.1, 1.2, 2.4), matDoorFrame);
      bm.position.set(doorX - ax, archCY + ay, doorZ);
      bm.rotation.z = -(am - Math.PI / 2);
      bm.castShadow = true;
      scene.add(bm);
    }

    // ── Inscription: all glowing elements live on the door leaves ─────────────
    // We use a shared invisible group parented to the scene just to collect refs;
    // actual meshes are added to pivotLeft / pivotRight below after pivots exist.
    // (inscriptionGroup is kept as a ref handle for onFrame material animation.)
    const inscriptionGroup = new THREE.Group();
    scene.add(inscriptionGroup); // empty — just a ref anchor

    // ── Door leaves with tree glyphs ──────────────────────────────────────────
    const doorLeafGeo = new THREE.BoxGeometry(doorW / 2, doorH, 0.45);

    const pivotLeft  = new THREE.Object3D();
    const pivotRight = new THREE.Object3D();
    pivotLeft.position.set(doorX - doorW / 2, doorY, doorZ);
    pivotRight.position.set(doorX + doorW / 2, doorY, doorZ);

    const doorLeft  = new THREE.Mesh(doorLeafGeo, matDoorLeaf);
    const doorRight = new THREE.Mesh(doorLeafGeo, matDoorLeaf);
    doorLeft.position.set(doorW / 4, 0, 0);
    doorRight.position.set(-doorW / 4, 0, 0);
    doorLeft.castShadow  = doorRight.castShadow  = true;
    doorLeft.receiveShadow = doorRight.receiveShadow = true;
    pivotLeft.add(doorLeft);
    pivotRight.add(doorRight);
    scene.add(pivotLeft);
    scene.add(pivotRight);

    // All inscription glyphs live in door-leaf local space so they swing open
    // with the doors. localX is the leaf centre from its pivot origin.
    // side: +1 = left door (pivot at -doorW/2), -1 = right door (pivot at +doorW/2)
    function addLeafGlyphs(pivot, localX, doorSide) {
      const gz       = 0.27;   // just proud of the door face
      const halfW    = doorW / 2;
      const halfH    = doorH / 2;
      const bottomY  = -halfH + 0.6;
      const trunkH   = 2.8;

      // ── Tree (trunk + branches) ─────────────────────────────────────────────
      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, trunkH, 0.14), matInscriptionLeaf);
      trunk.position.set(localX, bottomY + trunkH / 2, gz);
      pivot.add(trunk);

      const branchAngles = [0.42, 0.68, 0.92, 1.12, 1.28];
      for (const ba of branchAngles) {
        const blen = (1.4 - ba * 0.55) * 0.85;
        for (const bside of [-1, 1]) {
          const b = new THREE.Mesh(
            new THREE.BoxGeometry(blen, 0.14, 0.12), matInscriptionLeaf);
          b.position.set(
            localX + bside * Math.cos(ba) * blen * 0.5,
            bottomY + ba * 1.15 + 0.5, gz);
          b.rotation.z = bside * ba;
          pivot.add(b);
        }
      }

      // ── Arch outline — this leaf's half of the arch ─────────────────────────
      // The full arch spans -doorW/2 to +doorW/2 in world X.
      // In this leaf's local space the pivot is at world x = doorX ± doorW/2,
      // so the arch centre in local x is ∓doorW/2 (the seam).
      // We draw the 9 segments that fall on this leaf's half.
      const archOutR  = doorW / 2 + 0.8;   // slightly wider than door half
      const archCentreLocalX = -doorSide * halfW; // seam in local x
      const archCentreLocalY =  halfH;            // top of door in local y
      const archSegsH = 9; // half the arch (0..PI covers the full top)
      // doorSide +1 → left door → draw segments from PI to 0 (left half)
      // doorSide -1 → right door → draw segments from 0 to PI (right half)
      const a0Start = doorSide === 1 ? Math.PI * 0.5 : 0;
      const a0End   = doorSide === 1 ? Math.PI       : Math.PI * 0.5;
      for (let i = 0; i < archSegsH; i++) {
        const a0 = a0Start + (a0End - a0Start) * (i / archSegsH);
        const a1 = a0Start + (a0End - a0Start) * ((i + 1) / archSegsH);
        const am  = (a0 + a1) / 2;
        const ax  = Math.cos(am) * archOutR;
        const ay  = Math.sin(am) * archOutR;
        const len = archOutR * (a1 - a0) + 0.04;
        const sm  = new THREE.Mesh(
          new THREE.BoxGeometry(len * 1.05, 0.20, 0.15), matInscription);
        sm.position.set(archCentreLocalX - ax, archCentreLocalY + ay, gz - 0.02);
        sm.rotation.z = -(am - Math.PI / 2);
        pivot.add(sm);
      }

      // ── Rune strokes along outer edge of this leaf ──────────────────────────
      const runeEdgeX = localX + doorSide * (halfW * 0.6);
      for (let i = 0; i < 5; i++) {
        const ry = -halfH + 1.2 + i * 1.6;
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.9, 0.13), matInscription);
        sm.position.set(runeEdgeX, ry, gz - 0.01);
        pivot.add(sm);
      }

      // ── Star of Durin — only on left door, centred at the seam ─────────────
      // Placed at eye height (~1.5 units above bottom of door) on the inner edge
      if (doorSide === 1) {
        const starLocalX = archCentreLocalX;   // seam side
        const starLocalY = halfH * 0.55;       // upper-mid of door — eye level ~1.6m
        const starPts = 7;
        for (let i = 0; i < starPts; i++) {
          const a   = (i / starPts) * Math.PI * 2 - Math.PI / 2;
          const len = i % 2 === 0 ? 0.55 : 0.32;
          const rm  = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, len, 0.12), matInscription);
          rm.position.set(
            starLocalX + Math.cos(a) * (len * 0.5 + 0.03),
            starLocalY + Math.sin(a) * (len * 0.5 + 0.03),
            gz);
          rm.rotation.z = a + Math.PI / 2;
          pivot.add(rm);
        }
      }
    }

    addLeafGlyphs(pivotLeft,   doorW / 4,  1);   // left door,  doorSide=+1
    addLeafGlyphs(pivotRight, -doorW / 4, -1);   // right door, doorSide=-1

    // ── Static cliff-face fill: PointLight close to door, can't reach pool ───
    // Radius 22 means it dies out well before x=-28 (pool is ~30 units west).
    const cliffFill = new THREE.PointLight(0x3a5570, 0.5, 22);
    cliffFill.position.set(doorX, doorY, doorZ + 8);
    scene.add(cliffFill);

    // ── Proximity lights (gated by distance in onFrame) ───────────────────────
    const doorGlow  = new THREE.PointLight(0x4466cc, 0, 20);
    doorGlow.position.set(doorX, doorY, doorZ + 1.5);
    scene.add(doorGlow);

    const innerGlow = new THREE.PointLight(0x223355, 0, 28);
    innerGlow.position.set(doorX, doorY, doorZ - 6);
    scene.add(innerGlow);

    // ── Pool-edge boulders — ring around the ellipse perimeter ───────────────
    // Pool: centre x=-28, z=14, rx=30 east-west, rz=50 north-south
    const boulders = [
      [-60, 14, 1.4], [-56, -4, 1.2], [-58, 32, 1.5],
      [-50, 50, 1.1], [-36, 60, 1.0], [-20, 62, 0.9],
      [ -4, 58, 1.0], [  6, 44, 0.9], [  6, 26, 1.1],
      [  4,  8, 1.0], [  2, -8, 1.2], [-10,-18, 1.3],
      [-24,-22, 1.4], [-40,-16, 1.2], [-56,  0, 1.1],
      [-58, 28, 1.0], [-42, 58, 0.9], [-18,-20, 1.0],
    ];
    for (const [bx, bz, br] of boulders) {
      const by = groundY(bx, bz) + br * 0.45;
      addMesh(new THREE.SphereGeometry(br, 10, 7), matWetRock, bx, by, bz);
    }

    // ── Ledge rubble ──────────────────────────────────────────────────────────
    const rubble = [
      [14, 50, 0.4], [16, 44, 0.3], [13, 38, 0.5],
      [15, 30, 0.35],[14, 22, 0.4], [16, 16, 0.3],
      [ 8, 48, 0.3], [ 7, 34, 0.35],[ 9, 20, 0.3],
      [14,  6, 0.4], [13,  0, 0.3], [12, -4, 0.35],
    ];
    for (const [rx, rz, rr] of rubble) {
      const ry = groundY(rx, rz) + rr * 0.25;
      addMesh(new THREE.SphereGeometry(rr, 8, 6), matRubble, rx, ry, rz);
    }

    // ── Paving slabs in front of doors ───────────────────────────────────────
    const slabSeeds = [
      [ 0,-11], [-2,-9], [2,-9], [-1,-7], [1,-7], [3,-8], [5,-10], [-3,-11],
    ];
    // Use a simple deterministic pseudo-random to avoid Math.random() per-frame variance
    let seed = 42;
    function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
    for (const [sx, sz] of slabSeeds) {
      const sy = groundY(sx, sz) + 0.08;
      const w  = 1.2 + rng() * 0.9;
      const d  = 0.9 + rng() * 0.7;
      addMesh(new THREE.BoxGeometry(w, 0.18, d), MAT.STONE,
        sx, sy, sz, 0, rng() * Math.PI, 0);
    }

    // ── Fallen column ─────────────────────────────────────────────────────────
    addMesh(new THREE.CylinderGeometry(0.55, 0.65, 5.5, 9), MAT.STONE_DARK,
      -8, groundY(-8, -6) + 0.55, -6, 0, 0, Math.PI / 2);

    // ── Watcher ripples ───────────────────────────────────────────────────────
    const rippleMat  = new THREE.MeshStandardMaterial({
      color: 0x0a1828, transparent: true, opacity: 0,
      roughness: 0.4, depthWrite: false,
    });
    const rippleMat2 = rippleMat.clone();
    const rippleRing  = new THREE.Mesh(new THREE.TorusGeometry(4,  0.12, 6, 44), rippleMat);
    const rippleRing2 = new THREE.Mesh(new THREE.TorusGeometry(7,  0.10, 6, 44), rippleMat2);
    rippleRing.rotation.x  = -Math.PI / 2;
    rippleRing2.rotation.x = -Math.PI / 2;
    rippleRing.position.set(-30, -1.55, 12);
    rippleRing2.position.set(-30, -1.52, 12);
    scene.add(rippleRing);
    scene.add(rippleRing2);

    // ── Refs ──────────────────────────────────────────────────────────────────
    return {
      doorGlow, innerGlow,
      inscriptionGroup,
      matInscription, matInscriptionLeaf,
      pivotLeft, pivotRight,
      water, mistMat,
      rippleRing, rippleMat,
      rippleRing2, rippleMat2,
      _doorsOpen: false,
      _doorsOpenAmt: 0,
      _glowAmt: 0,
    };
  },

  onFrame(t, dt, refs, playerPos) {
    if (!refs) return;

    const doorX = 0, doorZ = -17;
    const dx = playerPos.x - doorX;
    const dz = playerPos.z - doorZ;
    const distToDoor = Math.sqrt(dx * dx + dz * dz);

    // ── Inscription glow ──────────────────────────────────────────────────────
    const targetGlow = distToDoor < 20
      ? Math.max(0, Math.min(1, (20 - distToDoor) / 14))
      : 0;
    refs._glowAmt += (targetGlow - refs._glowAmt) * Math.min(1, dt * 1.2);
    const g = refs._glowAmt;

    refs.matInscription.opacity           = g * 0.92;
    refs.matInscription.emissiveIntensity  = g * 2.8 + Math.sin(t * 0.7) * g * 0.3;
    refs.matInscriptionLeaf.opacity        = g * 0.80;
    refs.matInscriptionLeaf.emissiveIntensity = g * 2.0 + Math.sin(t * 0.9 + 1.2) * g * 0.25;

    refs.doorGlow.intensity  = g * 1.0;
    refs.innerGlow.intensity = g * 0.6;

    // ── Door swing ────────────────────────────────────────────────────────────
    if (distToDoor < 5.5 && !refs._doorsOpen) refs._doorsOpen = true;
    refs._doorsOpenAmt += ((refs._doorsOpen ? 1 : 0) - refs._doorsOpenAmt)
                          * Math.min(1, dt * 0.5);
    const openAngle = refs._doorsOpenAmt * Math.PI * 0.48;
    refs.pivotLeft.rotation.y  = -openAngle;
    refs.pivotRight.rotation.y =  openAngle;

    // ── Water shimmer ─────────────────────────────────────────────────────────
    refs.water.material.opacity = 0.88 + Math.sin(t * 0.31) * 0.03
                                       + Math.sin(t * 0.77) * 0.02;

    // ── Watcher ripples ───────────────────────────────────────────────────────
    const rCycle  = 14;
    const r1Phase = (t % rCycle) / rCycle;
    const r2Phase = ((t + rCycle * 0.5) % rCycle) / rCycle;

    refs.rippleRing.scale.set(1 + r1Phase * 2.4, 1, 1 + r1Phase * 2.4);
    refs.rippleMat.opacity  = 0.24 * Math.sin(r1Phase * Math.PI);

    refs.rippleRing2.scale.set(1 + r2Phase * 3.0, 1, 1 + r2Phase * 3.0);
    refs.rippleMat2.opacity = 0.16 * Math.sin(r2Phase * Math.PI);
  },
};

window.MoriaDoors = MoriaDoors;
