// =============================================================
//  argonath.js — The Argonath, Gates of Gondor
//  Sequence: Caras Galadhon <-> Anduin (Argonath) <-> Amon Hen
//  Time: Daytime
// =============================================================

const Argonath = {

  name: 'The Argonath',
  subtitle: 'Gates of Gondor · Nen Hithoel',

  // -----------------------------------------------------------
  // Atmosphere — bright overcast river-valley day
  // -----------------------------------------------------------
  atmosphere: {
    fogColor:        0x9ab0c8,
    fogType:         'linear',
    fogNear:         80,
    fogFar:          320,
    skyColor:        0x7aa4c0,
    ambientColor:    0x8899aa,
    ambientIntensity: 1.6,
    moonColor:       0xfff8ee,   // "sun" directional
    moonIntensity:   1.1,
    moonPosition:    { x: 80, y: 140, z: -60 },
    showStars:       false,
    extraLights: [
      { color: 0xaac8e8, intensity: 0.5, x: -80, y: 60,  z:  40 }, // sky fill from west
      { color: 0xfff0d8, intensity: 0.3, x:  40, y: 20,  z:  80 }, // warm bounce off water
    ],
  },

  // -----------------------------------------------------------
  // Terrain
  //   River channel runs N-S through x ≈ -8..+8
  //   Steep rocky cliffs rise to east and west of channel
  //   South opens into Nen Hithoel lake (flat water plane)
  //   West shore is gently flat between z=20..60 for landing
  //   Statues stand at x ≈ ±16, z ≈ -5 (just south of narrows)
  // -----------------------------------------------------------
  hillHeight(x, z) {
    const fbm   = window.api_fbm;
    const noise  = window.api_noise2d;

    // ---- River / lake mask ---------------------------------
    // North section (z < -10): narrow channel, width ~16
    // South section (z >= -10): lake, open flat
    const inNorth = z < -10;
    const channelHalfW = inNorth ? 9 : 40;   // river vs lake
    const distFromCentre = Math.abs(x);

    // Smooth transition from channel to lake
    const transition = Math.max(0, Math.min(1, (-10 - z) / 20)); // 0 at z=-10, 1 at z=-30
    const effectiveHalfW = inNorth
      ? 9
      : 9 + (40 - 9) * Math.min(1, (z + 10) / 30);

    // Water level is Y=0
    const waterY = 0.0;

    // How far outside the navigable channel are we?
    const overhang = distFromCentre - effectiveHalfW;

    if (overhang < 0) {
      // On the water — slight bed noise for interest but stays at 0
      return waterY + fbm(x * 0.08, z * 0.08) * 0.15;
    }

    // ---- West landing flat (x < 0, z > 10) ----------------
    const isWestShore = (x < -effectiveHalfW && x > -38 && z > 10 && z < 70);
    if (isWestShore) {
      const flatness = Math.max(0, 1 - Math.abs(x + 22) / 14);
      const baseH = 0.8 + overhang * 0.05;
      return baseH + fbm(x * 0.12, z * 0.12) * 0.5 * (1 - flatness * 0.7);
    }

    // ---- Cliff faces — steep rise from channel edge --------
    const cliffRise = Math.min(overhang * 2.4, 55);
    const cliffNoise = fbm(x * 0.07, z * 0.07) * 3.5
                     + noise(x * 0.18, z * 0.18) * 1.2;

    // Statue plinths create extra ledge bulge near z=-5
    const statueBulge = Math.max(0, 1 - Math.abs(z + 5) / 12) * 4.0;

    return waterY + cliffRise + cliffNoise + statueBulge;
  },

  vertexColor(vx, vy, vz, noise2d, lerp) {
    // Stone / cliff palette for gorge walls
    const stone    = [0.42, 0.40, 0.38];
    const darkRock = [0.28, 0.26, 0.24];
    const wetRock  = [0.22, 0.24, 0.26];
    const grass    = [0.32, 0.40, 0.26];
    const sand     = [0.55, 0.52, 0.42];
    const water    = [0.16, 0.28, 0.40];

    const n = noise2d(vx * 0.09, vz * 0.09);
    const n2 = noise2d(vx * 0.22, vz * 0.22);

    if (vy < 0.6) {
      // Water bed / shore — blueish wet rock
      const t = Math.min(1, vy / 0.6);
      return [
        lerp(water[0], wetRock[0], t) + n2 * 0.04,
        lerp(water[1], wetRock[1], t) + n2 * 0.04,
        lerp(water[2], wetRock[2], t) + n2 * 0.03,
      ];
    }
    if (vy < 2.5) {
      // Low shore / sand
      const t = (vy - 0.6) / 1.9;
      return [
        lerp(wetRock[0], sand[0], t) + n * 0.05,
        lerp(wetRock[1], sand[1], t) + n * 0.04,
        lerp(wetRock[2], sand[2], t) + n * 0.03,
      ];
    }
    if (vy < 12) {
      // Mid cliff
      const t = (vy - 2.5) / 9.5;
      const mix = lerp(stone[0], darkRock[0], t + n * 0.3);
      return [
        mix + n2 * 0.06,
        lerp(stone[1], darkRock[1], t + n * 0.3) + n2 * 0.05,
        lerp(stone[2], darkRock[2], t + n * 0.3) + n2 * 0.04,
      ];
    }
    // High cliff / top
    const hasGrass = n > 0.55;
    return hasGrass
      ? [grass[0] + n2 * 0.06, grass[1] + n2 * 0.08, grass[2] + n2 * 0.04]
      : [darkRock[0] + n * 0.05, darkRock[1] + n * 0.04, darkRock[2] + n * 0.03];
  },

  onPath(x, z) {
    // Path is the river centreline itself — a broad ribbon for the boat
    const inNorth = z < -10;
    const channelW = inNorth ? 7 : 30;
    const dist = Math.abs(x);
    const fade = Math.max(0, 1 - dist / channelW);
    return fade * fade;
  },

  // Path waypoints — sailing south along the river/lake
  pathWaypoints: [
    [  0, -65 ],  // -Z end (north, arriving from Caras Galadhon)
    [  1, -40 ],
    [ -1, -20 ],
    [  0,  -5 ],  // through the Argonath statues
    [  0,  20 ],
    [  0,  55 ],  // +Z end (south, toward Amon Hen landing)
  ],

  // -----------------------------------------------------------
  // Lore points
  // -----------------------------------------------------------
  lorePoints: [
    {
      pos: { x: 0, z: 50 },
      radius: 7,
      text: '"The Company had been four days on the river when the land changed. The Emyn Muil were behind them now, and the great brown flood of Anduin rolled on between them."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: 0, z: -5 },
      radius: 6,
      text: '"Then Frodo saw them: two great kings of stone, still with blurred eyes and crannied brows, looking down upon the river... it seemed to him that their hands were raised in warning."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: -22, z: 25 },
      radius: 5,
      text: '"So passed the evening, and the Fellowship went on through the night, and the pale day found them at last upon the western shore of Nen Hithoel."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
    {
      pos: { x: 0, z: -45 },
      radius: 6,
      text: '"They had come through the Argonath and their hearts were troubled. Nen Hithoel lay before them, still and grey, and beyond it the shadow of Amon Hen."',
      cite: '— J.R.R. Tolkien, The Fellowship of the Ring, Book II',
    },
  ],

  // -----------------------------------------------------------
  // Player start and arrivals
  // -----------------------------------------------------------
  start: { x: 0, z: -68, yaw: Math.PI },  // at -Z end (north), facing +Z (south into scene)

  arrivals: {
    carasgaladhon: { x:  0,   z: -68, yaw: Math.PI        }, // arriving from -Z (north), facing +Z (south into scene)
    amonhen:       { x: -22,  z:  30, yaw: Math.PI * 1.5  }, // arriving from -X (west shore), facing +X (east into scene)
  },

  // -----------------------------------------------------------
  // Boundary and transitions
  // -----------------------------------------------------------
  boundary: 90,

  transitions: [
    {
      // North exit — back toward Caras Galadhon, at -Z end
      trigger: { x: 0, z: -78, radius: 8 },
      to: 'carasgaladhon',
    },
    {
      // West shore landing — to Amon Hen
      trigger: { x: -22, z: 38, radius: 7 },
      to: 'amonhen',
    },
  ],

  // -----------------------------------------------------------
  // Walkables — none needed: player rides on boat which sits on
  // the water plane (Y=0).  The flat west landing is handled by
  // terrain.  No elevated bridges here.
  // -----------------------------------------------------------
  walkables: [],

  // -----------------------------------------------------------
  // Barriers — keep player in the navigable channel / lake area
  // and off the sheer cliff faces
  // -----------------------------------------------------------
  barriers: [
    // East cliff — broad band, full length of scene
    { x:  40, z:  0, w: 24, d: 180, yaw: 0 },
    // West cliff — but leave gap for landing zone (z > 10, x > -38)
    { x: -50, z: -30, w: 22, d: 120, yaw: 0 }, // south-west cliff
    { x: -50, z:  60, w: 22, d:  60, yaw: 0 }, // north-west cliff
    // North boundary above the river entry
    { x:   0, z:  88, w: 180, d: 14, yaw: 0 },
    // South boundary below the lake
    { x:   0, z: -82, w: 180, d: 14, yaw: 0 },
  ],

  // -----------------------------------------------------------
  // buildScene
  // -----------------------------------------------------------
  buildScene(THREE, scene, groundY, MAT) {

    const refs = {
      boat: null,
      boatLight: null,
      waterMesh: null,
      waterTime: 0,
      rippleMeshes: [],
      statueGlowL: null,
      statueGlowR: null,
    };

    // ---- Shared materials ----------------------------------
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6a6560, roughness: 0.92, metalness: 0.05,
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x3a3530, roughness: 0.95, metalness: 0.03,
    });
    const mossedMat = new THREE.MeshStandardMaterial({
      color: 0x4a5040, roughness: 0.97, metalness: 0.0,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a4030, roughness: 0.93, metalness: 0.0,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a60,
      roughness: 0.05,
      metalness: 0.55,
      transparent: true,
      opacity: 0.82,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xaaccff, emissiveIntensity: 0.35,
      roughness: 0.8, metalness: 0.0,
    });

    // =====================================================
    // WATER PLANE — covers the full navigable area
    // =====================================================
    {
      const waterGeo = new THREE.PlaneGeometry(180, 180, 32, 32);
      waterGeo.rotateX(-Math.PI / 2);
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(0, 0.05, 0);
      water.receiveShadow = true;
      scene.add(water);
      refs.waterMesh = water;
    }

    // =====================================================
    // BOAT — simple flat-bottomed river boat
    // The player stands on this; onFrame moves it to playerPos XZ
    // =====================================================
    const boatGroup = new THREE.Group();
    {
      // Hull — slightly curved box
      const hullGeo = new THREE.BoxGeometry(2.8, 0.6, 6.0);
      const hull = new THREE.Mesh(hullGeo, woodMat);
      hull.castShadow = true;
      boatGroup.add(hull);

      // Raised bow (front, -Z)
      const bowGeo = new THREE.CylinderGeometry(0.3, 1.2, 1.0, 9);
      const bow = new THREE.Mesh(bowGeo, woodMat);
      bow.position.set(0, 0.3, -3.2);
      bow.rotation.x = Math.PI / 2;
      bow.castShadow = true;
      boatGroup.add(bow);

      // Raised stern (+Z)
      const sternGeo = new THREE.CylinderGeometry(0.3, 1.2, 0.8, 9);
      const stern = new THREE.Mesh(sternGeo, woodMat);
      stern.position.set(0, 0.25, 3.2);
      stern.rotation.x = Math.PI / 2;
      stern.castShadow = true;
      boatGroup.add(stern);

      // Gunwale rails — left and right planks
      const gunGeo = new THREE.BoxGeometry(0.18, 0.3, 5.8);
      const gunL = new THREE.Mesh(gunGeo, darkStoneMat);
      gunL.position.set(-1.3, 0.45, 0);
      boatGroup.add(gunL);
      const gunR = gunL.clone();
      gunR.position.set(1.3, 0.45, 0);
      boatGroup.add(gunR);

      // Central thwart seat
      const thwartGeo = new THREE.BoxGeometry(2.2, 0.12, 0.5);
      const thwart = new THREE.Mesh(thwartGeo, woodMat);
      thwart.position.set(0, 0.36, 0);
      boatGroup.add(thwart);

      // Oar (decorative, leaned on gunwale)
      const oarShaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 5.0, 6);
      const oarShaft = new THREE.Mesh(oarShaftGeo, woodMat);
      oarShaft.position.set(1.2, 0.6, 0.5);
      oarShaft.rotation.z = 0.3;
      oarShaft.rotation.y = 0.2;
      boatGroup.add(oarShaft);

      const oarBladeGeo = new THREE.BoxGeometry(0.3, 0.08, 1.0);
      const oarBlade = new THREE.Mesh(oarBladeGeo, woodMat);
      oarBlade.position.set(1.7, 1.5, 0.2);
      oarBlade.rotation.z = 0.3;
      boatGroup.add(oarBlade);
    }
    boatGroup.position.set(0, 0.35, 60);
    scene.add(boatGroup);
    refs.boat = boatGroup;

    // Soft point light on the boat (daytime — keep subtle)
    const boatLight = new THREE.PointLight(0xfff4e0, 0.3, 10);
    boatLight.position.set(0, 1.5, 0);
    boatGroup.add(boatLight);
    refs.boatLight = boatLight;

    // =====================================================
    // ARGONATH STATUES
    // Two colossal kings flanking the river at z ≈ -5
    // Left (east) x ≈ +18, Right (west) x ≈ -18
    // They rise from rock pedestals carved into the cliff face
    // =====================================================
    function buildStatue(sx) {
      const g = new THREE.Group();
      const side = sx > 0 ? 1 : -1;

      // --- Pedestal base carved from cliff ----------------
      const pedGeo = new THREE.BoxGeometry(8, 6, 6);
      const ped = new THREE.Mesh(pedGeo, darkStoneMat);
      ped.position.set(0, 3, 0);
      ped.castShadow = true;
      ped.receiveShadow = true;
      g.add(ped);

      // Pedestal steps
      for (let s = 0; s < 3; s++) {
        const stepGeo = new THREE.BoxGeometry(8 - s * 0.8, 0.5, 6 + s * 0.8);
        const step = new THREE.Mesh(stepGeo, mossedMat);
        step.position.set(0, 6.25 + s * 0.5, 0);
        step.castShadow = true;
        g.add(step);
      }

      // --- Legs -------------------------------------------
      const legGeo = new THREE.CylinderGeometry(1.0, 1.3, 9, 9);
      const legL = new THREE.Mesh(legGeo, stoneMat);
      legL.position.set(-1.2, 12.5, 0.4);
      legL.castShadow = true;
      g.add(legL);
      const legR = legL.clone();
      legR.position.set(1.2, 12.5, 0.4);
      g.add(legR);

      // --- Torso ------------------------------------------
      const torsoGeo = new THREE.CylinderGeometry(1.8, 2.0, 10, 9);
      const torso = new THREE.Mesh(torsoGeo, stoneMat);
      torso.position.set(0, 22, 0);
      torso.castShadow = true;
      g.add(torso);

      // --- Belt / tabard detail ---------------------------
      const beltGeo = new THREE.CylinderGeometry(2.05, 2.05, 0.6, 9);
      const belt = new THREE.Mesh(beltGeo, darkStoneMat);
      belt.position.set(0, 18.2, 0);
      g.add(belt);

      // --- Cloak / mantle behind torso --------------------
      const cloakGeo = new THREE.CylinderGeometry(2.1, 1.4, 12, 9);
      const cloak = new THREE.Mesh(cloakGeo, mossedMat);
      cloak.position.set(0, 22, -0.8);
      cloak.scale.x = 0.85;
      cloak.castShadow = true;
      g.add(cloak);

      // --- Shoulders / pauldrons -------------------------
      for (let s of [-1, 1]) {
        const pGeo = new THREE.SphereGeometry(1.1, 9, 7);
        const p = new THREE.Mesh(pGeo, stoneMat);
        p.position.set(s * 2.0, 26.5, 0);
        p.scale.y = 0.7;
        p.castShadow = true;
        g.add(p);
      }

      // --- Arms -------------------------------------------
      // Raised warning arm (toward the river — inner side)
      const armUpGeo = new THREE.CylinderGeometry(0.55, 0.7, 8, 9);
      const armUp = new THREE.Mesh(armUpGeo, stoneMat);
      // Inner side: -side in X so it's always toward channel
      armUp.position.set(-side * 1.4, 30, 0.5);
      armUp.rotation.z = side * 0.45;   // angled outward / upward
      armUp.rotation.x = -0.3;
      armUp.castShadow = true;
      g.add(armUp);

      // Forearm — horizontal, extended toward river
      const foreGeo = new THREE.CylinderGeometry(0.45, 0.55, 5, 9);
      const fore = new THREE.Mesh(foreGeo, stoneMat);
      fore.position.set(-side * 1.8, 33.5, 1.5);
      fore.rotation.z = side * 0.9;
      fore.rotation.x = -0.6;
      fore.castShadow = true;
      g.add(fore);

      // Resting arm (outer side, lower)
      const armDnGeo = new THREE.CylinderGeometry(0.55, 0.7, 9, 9);
      const armDn = new THREE.Mesh(armDnGeo, stoneMat);
      armDn.position.set(side * 1.6, 25, 0);
      armDn.rotation.z = -side * 0.15;
      armDn.castShadow = true;
      g.add(armDn);

      // Axe / scepter in lower hand (simplified)
      const sceptreGeo = new THREE.CylinderGeometry(0.12, 0.12, 9, 6);
      const sceptre = new THREE.Mesh(sceptreGeo, darkStoneMat);
      sceptre.position.set(side * 2.2, 22, 0.4);
      sceptre.rotation.z = -side * 0.1;
      g.add(sceptre);
      const sceptreHeadGeo = new THREE.SphereGeometry(0.4, 8, 6);
      const sceptreHead = new THREE.Mesh(sceptreHeadGeo, darkStoneMat);
      sceptreHead.position.set(side * 2.3, 17.2, 0.5);
      g.add(sceptreHead);

      // --- Neck and head -----------------------------------
      const neckGeo = new THREE.CylinderGeometry(0.7, 0.9, 2.0, 9);
      const neck = new THREE.Mesh(neckGeo, stoneMat);
      neck.position.set(0, 28, 0);
      g.add(neck);

      const headGeo = new THREE.SphereGeometry(1.6, 10, 7);
      const head = new THREE.Mesh(headGeo, stoneMat);
      head.position.set(0, 30.5, 0);
      head.scale.y = 1.15;
      head.castShadow = true;
      g.add(head);

      // Beard
      const beardGeo = new THREE.CylinderGeometry(0.3, 0.9, 2.5, 9);
      const beard = new THREE.Mesh(beardGeo, darkStoneMat);
      beard.position.set(0, 28.4, 0.8);
      beard.rotation.x = 0.3;
      g.add(beard);

      // Crown / helm
      const helmBaseGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.5, 14);
      const helmBase = new THREE.Mesh(helmBaseGeo, darkStoneMat);
      helmBase.position.set(0, 32.0, 0);
      helmBase.castShadow = true;
      g.add(helmBase);

      const crownGeo = new THREE.CylinderGeometry(0.6, 1.5, 2.4, 9);
      const crown = new THREE.Mesh(crownGeo, darkStoneMat);
      crown.position.set(0, 33.4, 0);
      crown.castShadow = true;
      g.add(crown);

      // Crown spikes (simplified as thin cylinders)
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spikeGeo = new THREE.CylinderGeometry(0.08, 0.15, 1.2, 6);
        const spike = new THREE.Mesh(spikeGeo, darkStoneMat);
        spike.position.set(
          Math.cos(angle) * 0.9, 34.9, Math.sin(angle) * 0.9
        );
        g.add(spike);
      }

      // --- Weathering cracks and moss patches (small dark boxes) --
      for (let i = 0; i < 8; i++) {
        const crackGeo = new THREE.BoxGeometry(
          0.15 + Math.random() * 0.2,
          0.06,
          0.8 + Math.random() * 1.5
        );
        const crack = new THREE.Mesh(crackGeo, mossedMat);
        const h = 8 + Math.random() * 20;
        crack.position.set(
          (Math.random() - 0.5) * 3.5,
          h,
          (Math.random() - 0.5) * 2.0
        );
        crack.rotation.y = Math.random() * Math.PI;
        g.add(crack);
      }

      return g;
    }

    // Place statues — pedestal base sits on the cliff ledge
    // Both statues face north (-Z, upstream), warning those approaching from +Z.
    // Inside buildStatue the face/arm details point along local +Z,
    // so rotation.y = Math.PI maps local +Z → world -Z (north).
    const szE = -5;
    const statueEast = buildStatue(1);
    statueEast.position.set(18, groundY(18, szE), szE);
    statueEast.rotation.y = Math.PI; // local +Z → world -Z (facing north)
    scene.add(statueEast);

    const szW = -5;
    const statueWest = buildStatue(-1);
    statueWest.position.set(-18, groundY(-18, szW), szW);
    statueWest.rotation.y = Math.PI; // local +Z → world -Z (facing north)
    scene.add(statueWest);

    // Subtle glow lights to make statues read in the scene
    const glowE = new THREE.PointLight(0xd0c8b8, 0.5, 35);
    glowE.position.set(18, 20, szE);
    scene.add(glowE);
    refs.statueGlowL = glowE;

    const glowW = new THREE.PointLight(0xd0c8b8, 0.5, 35);
    glowW.position.set(-18, 20, szW);
    scene.add(glowW);
    refs.statueGlowR = glowW;

    // =====================================================
    // CLIFF FACE DETAILS — rock outcroppings along the gorge walls
    // =====================================================
    function addRockCluster(cx, cz, count, seed) {
      let s = seed;
      const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
      for (let i = 0; i < count; i++) {
        const ox = cx + (rand() - 0.5) * 10;
        const oz = cz + (rand() - 0.5) * 14;
        const r  = 0.8 + rand() * 2.2;
        const geo = new THREE.SphereGeometry(r, 10, 7);
        const mat = rand() > 0.5 ? stoneMat : darkStoneMat;
        const m = new THREE.Mesh(geo, mat);
        const gy = groundY(ox, oz);
        m.position.set(ox, gy + r * 0.45, oz);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
      }
    }

    // East bank rocks
    addRockCluster( 20, -20, 10, 101);
    addRockCluster( 22,  10, 8,  202);
    addRockCluster( 18,  40, 7,  303);
    addRockCluster( 25, -45, 9,  404);

    // West bank rocks
    addRockCluster(-20, -20, 9,  505);
    addRockCluster(-22,  10, 7,  606);
    addRockCluster(-18,  40, 8,  707);
    addRockCluster(-24, -45, 8,  808);

    // =====================================================
    // SHORE BOULDERS — at the west landing area
    // =====================================================
    function addShoreBoulder(bx, bz, r) {
      const geo = new THREE.SphereGeometry(r, 10, 7);
      const m = new THREE.Mesh(geo, stoneMat);
      const gy = groundY(bx, bz);
      m.position.set(bx, gy + r * 0.45, bz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }

    // Scatter boulders along west landing beach z=15..55
    const shorePositions = [
      [-13, 18, 1.1], [-15, 24, 0.8], [-12, 32, 1.3], [-14, 42, 0.9],
      [-16, 50, 1.0], [-11, 58, 0.7], [-18, 35, 1.2], [-17, 20, 0.6],
    ];
    for (const [bx, bz, r] of shorePositions) addShoreBoulder(bx, bz, r);

    // =====================================================
    // DEAD TREES on cliff tops — sparse, wind-scoured
    // =====================================================
    function addDeadTree(tx, tz) {
      const gy = groundY(tx, tz);
      const h  = 4 + Math.random() * 3;
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, h, 7);
      const trunk = new THREE.Mesh(trunkGeo, darkStoneMat);
      trunk.position.set(tx, gy + h / 2 - h * 0.1, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Bare branches
      for (let b = 0; b < 3; b++) {
        const bh = 1.5 + Math.random() * 1.5;
        const branchGeo = new THREE.CylinderGeometry(0.04, 0.09, bh, 5);
        const branch = new THREE.Mesh(branchGeo, darkStoneMat);
        const angle = (b / 3) * Math.PI * 2 + Math.random() * 0.5;
        branch.position.set(
          tx + Math.cos(angle) * 0.8,
          gy + h * 0.75 + bh * 0.3,
          tz + Math.sin(angle) * 0.8
        );
        branch.rotation.z = Math.cos(angle) * 0.7;
        branch.rotation.x = Math.sin(angle) * 0.5;
        scene.add(branch);
      }
    }

    const treeSpots = [
      [28, -30], [30, 5], [26, -55], [27, 35],
      [-28, -25], [-30, 0], [-26, -50], [-29, 30],
      [32, -10], [-32, -10],
    ];
    for (const [tx, tz] of treeSpots) addDeadTree(tx, tz);

    // =====================================================
    // RUINED GONDORIAN STONEWORK at statue bases
    // Fallen column drums, broken paving slabs
    // =====================================================
    function addRuin(rx, rz) {
      // Fallen column drum
      const drumGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.7, 9);
      const drum = new THREE.Mesh(drumGeo, stoneMat);
      const gy = groundY(rx, rz);
      drum.position.set(rx, gy + 0.35, rz);
      drum.rotation.z = 0.4 + Math.random() * 0.3;
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);

      // Paving slab
      const slabGeo = new THREE.BoxGeometry(1.8, 0.18, 1.2);
      const slab = new THREE.Mesh(slabGeo, mossedMat);
      slab.position.set(rx + 1.0, gy + 0.09, rz + 0.5);
      slab.rotation.y = Math.random() * 0.4;
      slab.receiveShadow = true;
      scene.add(slab);
    }

    // Ruins near each statue base (on the water-adjacent shore)
    addRuin( 11, -8);
    addRuin( 13, -3);
    addRuin( 10, -14);
    addRuin(-11, -8);
    addRuin(-13, -3);
    addRuin(-10, -14);

    // =====================================================
    // WATERFALL — thin cascade on east cliff face, z ≈ -40
    // =====================================================
    {
      // Cascade planes (several overlapping semi-transparent planes)
      const fallMat = new THREE.MeshStandardMaterial({
        color: 0x88bbdd,
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
        metalness: 0.2,
        side: THREE.DoubleSide,
      });
      const fallGeo = new THREE.PlaneGeometry(2.5, 14);
      const fall = new THREE.Mesh(fallGeo, fallMat);
      fall.position.set(14, 8, -40);
      fall.rotation.y = -0.3;
      scene.add(fall);
      refs.waterfall = fall;

      // Splash pool at base — flat disc
      const poolMat = new THREE.MeshStandardMaterial({
        color: 0x5599bb, transparent: true, opacity: 0.7, roughness: 0.05, metalness: 0.4,
      });
      const poolGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 12);
      const pool = new THREE.Mesh(poolGeo, poolMat);
      const poolGY = groundY(14, -40);
      pool.position.set(14, poolGY + 0.08, -40);
      scene.add(pool);
    }

    // =====================================================
    // MIST WISPS — low fog particles over the water
    // (flat discs with additive alpha, animated in onFrame)
    // =====================================================
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xaaccdd,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mistMeshes = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const r     = 5 + Math.random() * 30;
      const mx    = Math.cos(angle) * r * 0.4;
      const mz    = -10 + Math.sin(angle) * r;
      const sz    = 4 + Math.random() * 8;
      const geo   = new THREE.PlaneGeometry(sz, sz * 0.4);
      const mist  = new THREE.Mesh(geo, mistMat.clone());
      mist.position.set(mx, 0.3 + Math.random() * 0.8, mz);
      mist.rotation.x = -Math.PI / 2;
      mist.rotation.z = Math.random() * Math.PI;
      mist.userData.driftSpeed = 0.05 + Math.random() * 0.08;
      mist.userData.driftAngle = Math.random() * Math.PI * 2;
      scene.add(mist);
      mistMeshes.push(mist);
    }
    refs.mistMeshes = mistMeshes;

    // =====================================================
    // BIRDS — small dark specks circling the cliff tops
    // (very simple: pairs of tiny flat triangles)
    // =====================================================
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
    const birds = [];
    for (let i = 0; i < 12; i++) {
      const wing = new THREE.Group();
      for (let s of [-1, 1]) {
        const wGeo = new THREE.BufferGeometry();
        const verts = new Float32Array([0, 0, 0,  s * 0.6, 0.15, -0.1,  s * 0.3, 0, 0.3]);
        wGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        const w = new THREE.Mesh(wGeo, birdMat);
        wing.add(w);
      }
      wing.userData.orbitR     = 18 + Math.random() * 12;
      wing.userData.orbitY     = 35 + Math.random() * 20;
      wing.userData.orbitSpeed = 0.18 + Math.random() * 0.12;
      wing.userData.phase      = Math.random() * Math.PI * 2;
      wing.userData.bobPhase   = Math.random() * Math.PI * 2;
      scene.add(wing);
      birds.push(wing);
    }
    refs.birds = birds;

    return refs;
  },

  // -----------------------------------------------------------
  // onFrame
  // -----------------------------------------------------------
  onFrame(t, dt, refs, playerPos) {

    // ---- BOAT follows player XZ, always on water (Y=0.35) --
    if (refs.boat) {
      // Smooth lerp so the boat doesn't teleport
      const bx = refs.boat.position.x;
      const bz = refs.boat.position.z;
      const tx = playerPos.x;
      const tz = playerPos.z;
      refs.boat.position.x += (tx - bx) * Math.min(1, dt * 8);
      refs.boat.position.z += (tz - bz) * Math.min(1, dt * 8);
      refs.boat.position.y = 0.35 + Math.sin(t * 0.7) * 0.04 + Math.sin(t * 1.3) * 0.02;

      // Gentle rock
      refs.boat.rotation.x = Math.sin(t * 0.8) * 0.012;
      refs.boat.rotation.z = Math.sin(t * 0.6 + 0.5) * 0.015;

      // Yaw the boat to face the direction of travel
      const dx = tx - bx;
      const dz = tz - bz;
      if (dx * dx + dz * dz > 0.001) {
        const targetYaw = Math.atan2(dx, dz);
        let curYaw = refs.boat.rotation.y;
        // Shortest-path lerp
        let diff = targetYaw - curYaw;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        refs.boat.rotation.y += diff * Math.min(1, dt * 4);
      }
    }

    // ---- WATER surface ripple (UV offset simulation via Y-verts)
    if (refs.waterMesh) {
      // Shift the water's emissive intensity slightly
      refs.waterMesh.material.opacity = 0.78 + Math.sin(t * 0.5) * 0.04;
    }

    // ---- MIST drift ------------------------------------
    if (refs.mistMeshes) {
      for (const mist of refs.mistMeshes) {
        const spd = mist.userData.driftSpeed;
        const ang = mist.userData.driftAngle + t * spd * 0.1;
        mist.position.x += Math.cos(ang) * spd * dt * 0.4;
        mist.position.z += Math.sin(ang) * spd * dt * 0.4;
        mist.material.opacity = 0.04 + Math.sin(t * spd + mist.userData.driftAngle) * 0.03;
        // Keep mist over the lake/river region
        if (mist.position.z > 75 || mist.position.z < -75) {
          mist.position.z *= -0.5;
        }
      }
    }

    // ---- BIRDS orbit the cliffs ------------------------
    if (refs.birds) {
      for (const bird of refs.birds) {
        const angle = t * bird.userData.orbitSpeed + bird.userData.phase;
        bird.position.x = Math.cos(angle) * bird.userData.orbitR;
        bird.position.z = Math.sin(angle) * bird.userData.orbitR - 5;
        bird.position.y = bird.userData.orbitY + Math.sin(t * 1.4 + bird.userData.bobPhase) * 1.5;
        bird.rotation.y = -angle + Math.PI * 0.5;
        // Wing flap
        bird.children[0].rotation.z =  Math.sin(t * 6 + bird.userData.phase) * 0.4;
        if (bird.children[1]) bird.children[1].rotation.z = -Math.sin(t * 6 + bird.userData.phase) * 0.4;
      }
    }

    // ---- Statue glow — gentle pulse in river light ----
    if (refs.statueGlowL) {
      const pulse = 0.45 + Math.sin(t * 0.3) * 0.05;
      refs.statueGlowL.intensity = pulse;
      refs.statueGlowR.intensity = pulse;
    }

    // ---- Waterfall shimmer ----------------------------
    if (refs.waterfall) {
      refs.waterfall.material.opacity = 0.5 + Math.sin(t * 2.1) * 0.06;
    }
  },

};

window.Argonath = Argonath;
