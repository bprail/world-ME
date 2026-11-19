// isengard.js  —  The Ruined Ring of Isengard
// After the Ent-moot, after Helm's Deep: Merry and Pippin preside over the wreckage.
// Three arcs converge here: Fangorn / Entmoot (from -Z), Helm's Deep keep (from +X),
// then onward to Dunharrow (toward -Z, far side of Orthanc).

const Isengard = {

  name:     'Isengard',
  subtitle:  'The Ring of Isengard · Nan Curunír',

  // ─── Atmosphere ─────────────────────────────────────────────────────────────
  atmosphere: {
    fogColor:        0xb0b8b0,
    fogType:         'linear',
    fogNear:         80,
    fogFar:          300,
    skyColor:        0x8fa8a0,     // overcast grey-green, post-flood sky
    ambientColor:    0x9aa8a0,
    ambientIntensity: 1.2,
    moonColor:       0xd8ddd8,     // pale diffuse sun through thin cloud
    moonIntensity:   0.55,
    moonPosition:    { x: 60, y: 120, z: -80 },
    showStars:       false,
    extraLights: [
      { color: 0xb8c8c0, intensity: 0.35, x: -80, y: 60, z: 60 },   // fill from south-west
      { color: 0xa0b0a8, intensity: 0.20, x:   0, y: 20, z: 100 },  // soft back-light
    ],
  },

  // ─── Terrain ────────────────────────────────────────────────────────────────
  // Isengard's floor was flattened by the Númenóreans and later drowned by the Ents.
  // We show it as a broad, nearly flat bowl with shallow puddles in the low ground,
  // rising gently toward the outer walls (implied by terrain fade at boundary).
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise = window.api_noise2d;

    // Shallow bowl — lowest at centre, gentle rise toward rim
    const dist  = Math.sqrt(x * x + z * z);
    const bowl  = Math.max(0, (dist / 70) * 1.8 - 0.4);   // flat inside, slopes near edge

    // Fine rubble and mud texture
    const mud   = fbm(x * 0.15, z * 0.15) * 0.6;
    const pebble = noise(x * 0.4, z * 0.4) * 0.25;

    // Shallow water pooling in the very centre (slight dip)
    const centreDip = Math.max(0, 0.4 - dist * 0.015);

    return bowl + mud + pebble - centreDip;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    const dist = Math.sqrt(vx * vx + vz * vz);

    // Mud / silt base — grey-brown left by receding flood
    const mud   = [0.38, 0.33, 0.28];
    // Wet dark earth closer to centre
    const dark  = [0.22, 0.20, 0.18];
    // Rubble / crushed stone
    const stone = [0.52, 0.50, 0.47];

    const n1 = noise2d(vx * 0.12, vz * 0.12);
    const n2 = noise2d(vx * 0.35, vz * 0.35);

    // Blend: central puddle-mud grades to rubble toward the outer ring
    const tDist   = Math.min(1, dist / 65);
    const tNoise  = n1 * 0.6 + n2 * 0.4;

    let r = lerp(lerp(dark[0], mud[0], tNoise), stone[0], tDist);
    let g = lerp(lerp(dark[1], mud[1], tNoise), stone[1], tDist);
    let b = lerp(lerp(dark[2], mud[2], tNoise), stone[2], tDist);

    // Slight green algal tint in low wet areas near centre
    const wet = Math.max(0, 1 - dist / 20) * 0.12;
    g += wet;

    return [
      Math.min(1, Math.max(0, r)),
      Math.min(1, Math.max(0, g)),
      Math.min(1, Math.max(0, b)),
    ];
  },

  // No path ribbon — the floor is open and players navigate by landmarks
  onPath: () => 0,
  pathWaypoints: [],

  // ─── Player start & arrivals ─────────────────────────────────────────────────
  // Scene centre is roughly (0, 0); Orthanc stands at (0, -15).
  // helmsdeep inner keep  → arrives from +X end, faces -X (toward centre)
  // entmoot               → arrives from -Z end, faces +Z (into the flooded ring)
  // dunharrow             → arrives from +Z end, faces -Z (toward Orthanc beyond)

  start:    { x: 0, z: 60, yaw: 0 },   // at +Z end, facing -Z toward Orthanc

  arrivals: {
    helmsdeepkeep: { x:  72, z:  0, yaw: Math.PI * 1.5 },  // arriving from +X, facing -X
    entmoot:       { x:   0, z: -60, yaw: Math.PI       },  // arriving from -Z, facing +Z
    dunharrow:     { x:   0, z:  60, yaw: 0             },  // arriving from +Z, facing -Z
  },

  // ─── Boundary & transitions ──────────────────────────────────────────────────
  boundary: 88,

  transitions: [
    {
      trigger: { x:  80, z:  0, radius: 9 },
      to: 'helmsdeepkeep',
    },
    {
      trigger: { x:   0, z: -78, radius: 9 },
      to: 'entmoot',
    },
    {
      trigger: { x:   0, z:  78, radius: 9 },
      to: 'dunharrow',
    },
  ],

  // ─── Walkables ───────────────────────────────────────────────────────────────
  // Broad stone causeway leading to the base of Orthanc, raised above the flood mud.
  walkables: [
    // South causeway from gate rubble to Orthanc base
    { x: 0, z: 25,  yaw: 0, length: 20, width: 6, yStart: 1.4, yEnd: 1.4 },
    { x: 0, z:  5,  yaw: 0, length: 20, width: 6, yStart: 1.4, yEnd: 1.4 },
    { x: 0, z: -12, yaw: 0, length: 14, width: 6, yStart: 1.4, yEnd: 1.4 },
    // East causeway stub — where the company arrived from Helm's Deep
    { x: 35, z: 5,  yaw: Math.PI * 0.5, length: 24, width: 5, yStart: 1.2, yEnd: 1.2 },
    // Hobbit feast terrace — collapsed wall section near gate, used as a table
    { x: 20, z: 44, yaw: 0, length: 8, width: 10, yStart: 1.8, yEnd: 1.8 },
  ],

  // ─── Barriers ────────────────────────────────────────────────────────────────
  // Keep the player out of the flooded channel that rings Orthanc
  barriers: [
    // Flooded moat ring around Orthanc (approximated as four barriers)
    { x:  -9, z: -15, w: 4, d: 32, yaw: 0 },
    { x:   9, z: -15, w: 4, d: 32, yaw: 0 },
    { x:   0, z: -32, w: 22, d: 4, yaw: 0 },
    { x:   0, z:   2, w: 22, d: 4, yaw: 0 },
  ],

  // ─── Lore points ─────────────────────────────────────────────────────────────
  lorePoints: [
    {
      pos:    { x: 20, z: 44 },
      radius: 6,
      text:   '"Welcome to Isengard!" said Merry. He stepped forward as if to bar their way, but Théoden was riding foremost, and the hobbit bowed before him.',
      cite:   '— The Two Towers, III.8',
    },
    {
      pos:    { x: 24, z: 35 },
      radius: 5,
      text:   '"We are the door-wardens," said Pippin. "Meriadoc, my colleague, has gone to find out more about the state of the country. We have had a very busy time ... but on the whole things went well for our side."',
      cite:   '— Pippin, The Two Towers, III.8',
    },
    {
      pos:    { x: 10, z: 46 },
      radius: 5,
      text:   'There in the main porch of the gate-house they found the two hobbits seated; behind them a small fire was burning and there were fragments of food and broken vessels beside them.',
      cite:   '— The Two Towers, III.8',
    },
    {
      pos:    { x: 0, z: 32 },
      radius: 6,
      text:   '"We sat down and took stock of our supplies, and I am afraid we used your cup … and your plate … and your food — but we made some shift to do better for the guests that came to us in the end."',
      cite:   '— Merry, The Two Towers, III.9',
    },
    {
      pos:    { x: 0, z: 15 },
      radius: 6,
      text:   'All about and between the pits and mounds of shattered stone the floods from Isen had washed. Pools and rivulets ran among the ruins; the bottom of the great bowl still gleamed with wet mud.',
      cite:   '— The Two Towers, III.8',
    },
    {
      pos:    { x: -20, z: 10 },
      radius: 6,
      text:   '"We were all astonished," said Merry, "when the Ents came. We had almost given up hope of escape. Then we heard Treebeard´s voice: Hoom! Come, Ents! And the trees came."',
      cite:   '— Merry, The Two Towers, III.9',
    },
    {
      pos:    { x: 0, z: -5 },
      radius: 7,
      text:   'Then Treebeard made a great shout, and the Ents rushed forward through the breach and tore asunder the iron gates. And even as they broke in, the flood came. The Ents had stopped the river Isen and turned its waters.',
      cite:   '— The Two Towers, III.9',
    },
    {
      pos:    { x: 0, z: -18 },
      radius: 7,
      text:   'Standing menacing and alone, the tower of Orthanc — its rock gleaming as if it were wet — reared above the ruins, its three horns jutting to the sky. The Ents could not break it.',
      cite:   '— The Two Towers, III.8',
    },
    {
      pos:    { x: 0, z: -38 },
      radius: 6,
      text:   '"I am not a conjurer of cheap tricks!" snarled the voice from above. And then it changed, and they heard it, pleading, honeyed, persuasive: "Come now, let us speak of wisdom."',
      cite:   '— Saruman, The Two Towers, III.10',
    },
    {
      pos:    { x: 32, z: 20 },
      radius: 6,
      text:   'Gandalf spoke then, and his voice was cold and hard: "Saruman, you have become a fool. And yet in one thing you have not deceived me: you do not know your own mind."',
      cite:   '— Gandalf, The Two Towers, III.10',
    },
    {
      pos:    { x: -30, z: 30 },
      radius: 6,
      text:   'He cast something down from above. It smote the stair before Gandalf's horse, and the horse reared and neighed. The stone broke asunder, and there in the shadow lay a crystal ball that gleamed like a star.',
      cite:   '— The Two Towers, III.11',
    },
  ],

  // ─── Build Scene ─────────────────────────────────────────────────────────────
  buildScene(THREE, scene, groundY, MAT, FX) {
    const refs = {};

    // ── Helpers ──────────────────────────────────────────────────────────────

    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    // Material palette
    const matBlack   = new THREE.MeshLambertMaterial({ color: 0x1a1a1e });            // Orthanc
    matBlack.side    = THREE.DoubleSide;
    const matWall    = new THREE.MeshLambertMaterial({ color: 0x5a5850 });            // outer ring wall
    const matWallMoss= new THREE.MeshLambertMaterial({ color: 0x484c3e });            // mossy broken wall
    const matRubble  = new THREE.MeshLambertMaterial({ color: 0x706860 });            // scattered stone
    const matMud     = new THREE.MeshLambertMaterial({ color: 0x3a3228 });            // flooded mud
    const matWater   = new THREE.MeshLambertMaterial({                                // shallow water plane
      color:   0x4a6870,
      transparent: true,
      opacity: 0.72,
    });
    const matWood    = new THREE.MeshLambertMaterial({ color: 0x5c4030 });            // smashed beams
    const matCause   = new THREE.MeshLambertMaterial({ color: 0x706a62 });            // causeway slabs

    // ── Orthanc — four-pronged black tower ───────────────────────────────────
    // Base: a broad, slightly flared base platform
    addMesh(new THREE.CylinderGeometry(7.0, 8.5, 4, 12), matBlack,
            0, groundY(0, -15) + 2, -15);

    // Main shaft — four-sided through CylinderGeometry with many segments
    // We approximate the four fused pillars as a single faceted cylinder
    addMesh(new THREE.CylinderGeometry(3.8, 5.0, 60, 4), matBlack,
            0, groundY(0, -15) + 34, -15);

    // Upper section narrows
    addMesh(new THREE.CylinderGeometry(2.5, 3.8, 20, 4), matBlack,
            0, groundY(0, -15) + 64, -15, 0, Math.PI * 0.25, 0);

    // Three jutting horn-prongs at the top (tapered cylinders)
    const hornGeo = new THREE.CylinderGeometry(0.3, 1.0, 10, 5);
    addMesh(hornGeo, matBlack,  0,  groundY(0, -15) + 78, -15);                // centre horn
    addMesh(hornGeo, matBlack, -3.5, groundY(0, -15) + 75, -15, 0.2, 0, -0.3);  // left horn
    addMesh(hornGeo, matBlack,  3.5, groundY(0, -15) + 75, -15, 0.2, 0,  0.3);  // right horn

    // ── Orthanc window ledge (where Saruman stands) ───────────────────────────
    addMesh(new THREE.BoxGeometry(5, 0.6, 1.4), matBlack,
            0, groundY(0, -15) + 42, -11.8);

    // ── Orthanc water-moat ────────────────────────────────────────────────────
    // Shallow flooded area surrounding the base
    const moatGeo = new THREE.RingGeometry(8, 14, 32);
    const moat = new THREE.Mesh(moatGeo, matWater);
    moat.rotation.x = -Math.PI * 0.5;
    moat.position.set(0, groundY(0, -15) + 0.15, -15);
    moat.receiveShadow = true;
    scene.add(moat);
    refs.moat = moat;

    // ── Central flooded floor — broad shallow pool ────────────────────────────
    const floodGeo = new THREE.CircleGeometry(55, 40);
    const flood    = new THREE.Mesh(floodGeo, matWater);
    flood.rotation.x = -Math.PI * 0.5;
    flood.position.set(0, groundY(0, 0) + 0.08, 5);
    flood.receiveShadow = true;
    scene.add(flood);
    refs.flood = flood;

    // ── Causeway slabs ────────────────────────────────────────────────────────
    for (let z = 40; z > -20; z -= 7) {
      const slabGeo = new THREE.BoxGeometry(5.5, 0.4, 5.5);
      addMesh(slabGeo, matCause, 0, groundY(0, z) + 1.4, z);
    }
    // East causeway slabs
    for (let xi = 15; xi < 50; xi += 7) {
      const slabGeo = new THREE.BoxGeometry(5.5, 0.4, 5.5);
      addMesh(slabGeo, matCause, xi, groundY(xi, 5) + 1.2, 5);
    }

    // ── Outer ring wall — broken arc visible on the west and south ───────────
    // We place wall segments as short CylinderGeometry columns + BoxGeometry tops
    function wallSegment(cx, cz, angle, len, h) {
      const geo = new THREE.BoxGeometry(len, h, 2.8);
      const m   = new THREE.Mesh(geo, matWall);
      m.position.set(cx, groundY(cx, cz) + h * 0.5, cz);
      m.rotation.y = angle;
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
    }

    const R    = 70;    // ring radius
    const segs = 18;
    // Build about 65% of the ring (the rest torn away by Ents)
    for (let i = 0; i < segs; i++) {
      const frac = i / segs;
      // Skip the gate gap (north, around z+) and large breach areas
      const skipGate   = (frac > 0.85 || frac < 0.05);    // northern gate: torn open
      const skipBreachA= (frac > 0.38 && frac < 0.50);    // eastern breach
      const skipBreachB= (frac > 0.60 && frac < 0.72);    // south-east breach
      if (skipGate || skipBreachA || skipBreachB) continue;

      const theta = (frac * Math.PI * 2);
      const cx    = Math.sin(theta) * R;
      const cz    = Math.cos(theta) * R;
      // Vary height to suggest broken / tumbled sections
      const h     = 5 + Math.sin(i * 2.3) * 2 + Math.cos(i * 1.7) * 1.5;
      const segLen = 14 + Math.sin(i * 1.1) * 2;
      wallSegment(cx, cz, theta, segLen, h);
    }

    // ── Rubble and fallen blocks across the floor ─────────────────────────────
    const rubblePositions = [
      // Around the north gate breach
      [ 10, 55], [-12, 60], [ 5, 68], [-8, 52],
      // East breach rubble
      [ 55, 30], [ 62, 18], [ 50, 40], [ 60, -5],
      // Central scattered debris
      [-18, 20], [ 22, -5], [-10, -8], [ 30, 15],
      [ 15, -25], [-25, 30], [ 8, 38], [-35, 15],
      [-40, -10], [ 38, -18],
      // Near Orthanc base — Wormtongue's palantír drop zone
      [-5, -10], [ 7, -6], [-3, -22],
    ];

    rubblePositions.forEach(([rx, rz]) => {
      const s   = 0.8 + Math.random() * 1.8;
      const geo = new THREE.SphereGeometry(s, 8, 6);
      addMesh(geo, matRubble, rx, groundY(rx, rz) + s * 0.45, rz,
              Math.random() * 0.4, Math.random() * Math.PI, 0);
    });

    // ── Smashed beams / timber — remnants of Saruman's machinery ─────────────
    const beamPositions = [
      [-22, 40], [ 18, 48], [-15, 15], [ 28, -8],
    ];
    beamPositions.forEach(([bx, bz], idx) => {
      const len = 6 + idx * 1.5;
      const geo = new THREE.CylinderGeometry(0.35, 0.5, len, 7);
      const m   = new THREE.Mesh(geo, matWood);
      m.position.set(bx, groundY(bx, bz) + 0.5, bz);
      m.rotation.set(Math.PI * 0.5, (idx * 0.9), 0.1 * idx);
      m.castShadow    = true;
      m.receiveShadow = true;
      scene.add(m);
    });

    // ── Hobbit feast terrace — collapsed wall slab near the gate ─────────────
    // A large flat slab they're using as a table
    addMesh(new THREE.BoxGeometry(10, 0.6, 7), matCause,
            20, groundY(20, 44) + 1.8, 44);

    // Stumps / barrels on the terrace
    const barrelGeo = new THREE.CylinderGeometry(0.6, 0.65, 1.2, 10);
    addMesh(barrelGeo, matWood,  18, groundY(18, 42) + 2.5, 42);
    addMesh(barrelGeo, matWood,  22, groundY(22, 46) + 2.5, 46);

    // Broken pipe-weed crates (small boxes)
    const crateGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
    addMesh(crateGeo, matWood, 24, groundY(24, 44) + 2.3, 44);
    addMesh(crateGeo, matWood, 16, groundY(16, 44) + 2.3, 44);

    // Campfire — the hobbit meal fire
    FX.makeFire(20, groundY(20, 48) + 0.1, 48, {
      color:      0xff7820,
      intensity:  2.8,
      range:      12,
      flameScale: 0.65,
      emberCount: 50,
      castShadow: true,
    });

    // ── Pillars of the White Hand — toppled ───────────────────────────────────
    // The great pillar bearing Saruman's White Hand sigil lies fallen
    const pillarGeo = new THREE.CylinderGeometry(1.0, 1.2, 18, 9);
    const pillar    = new THREE.Mesh(pillarGeo, matWall);
    pillar.position.set(-8, groundY(-8, 50) + 1.5, 50);
    pillar.rotation.set(Math.PI * 0.5, 0.3, 0);
    pillar.castShadow    = true;
    pillar.receiveShadow = true;
    scene.add(pillar);

    // ── Orthanc staircase — broad stone steps up the base ─────────────────────
    for (let s = 0; s < 5; s++) {
      const stepGeo = new THREE.BoxGeometry(5 - s * 0.3, 0.5, 1.0);
      addMesh(stepGeo, matBlack,
              0,
              groundY(0, -15) + 4 + s * 0.5,
              -15 + 8 - s * 1.0);
    }

    // ── A few standing torches near Orthanc (guttered) ────────────────────────
    // These torches have burned out — no FX, just the blackened poles
    const torchPoleGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.5, 7);
    [[-4.5, -8], [4.5, -8], [-4.5, -22], [4.5, -22]].forEach(([tx, tz]) => {
      addMesh(torchPoleGeo, matBlack, tx, groundY(tx, tz) + 1.75, tz);
      // Blackened bowl on top
      const bowlGeo = new THREE.SphereGeometry(0.22, 7, 5);
      addMesh(bowlGeo, matBlack, tx, groundY(tx, tz) + 3.6, tz);
    });

    // ── Eastern road — the Helm's Deep approach ───────────────────────────────
    // A line of shattered paving stones leading from the east gap
    for (let xi = 42; xi < 76; xi += 9) {
      const paveGeo = new THREE.BoxGeometry(7, 0.25, 7);
      addMesh(paveGeo, matCause, xi, groundY(xi, 0) + 0.3, 0 + (Math.random() - 0.5) * 2);
    }

    // ── Broken gate arch — north entrance ─────────────────────────────────────
    // Left pillar
    addMesh(new THREE.CylinderGeometry(1.8, 2.0, 12, 9), matWall,
            -6, groundY(-6, 70) + 6, 70);
    // Right pillar
    addMesh(new THREE.CylinderGeometry(1.8, 2.0, 12, 9), matWall,
             6, groundY(6, 70) + 6, 70);
    // Fallen lintel across the gap
    addMesh(new THREE.BoxGeometry(16, 1.4, 2), matWall,
            0, groundY(0, 68) + 1.5, 68, 0, 0, 0.08);

    return refs;
  },

  // ─── onArrive ─────────────────────────────────────────────────────────────
  onArrive(fromKey, refs) {
    // Nothing scene-specific to trigger; the flood and fires are already alive.
  },

  // ─── onFrame ──────────────────────────────────────────────────────────────
  onFrame(t, dt, refs, playerPos) {
    // Gently animate water surface opacity — the shallow flood ripples
    if (refs.flood) {
      refs.flood.material.opacity = 0.65 + Math.sin(t * 0.7) * 0.07;
    }
    if (refs.moat) {
      refs.moat.material.opacity = 0.68 + Math.sin(t * 0.9 + 1.2) * 0.07;
    }
  },

};

window.Isengard = Isengard;
