// ==========================================================
// KAZE R-01 - Blueprint-traced Three.js procedural model
// Three.js r128 compatible
// 1 unit = 1 meter
// +Z = FRONT, +Y = UP, +/-X = LEFT/RIGHT
// ==========================================================

function buildKazeR01(paintColorHex) {
  const car = new THREE.Group();

  // --------------------------------------------------------
  // Materials
  // --------------------------------------------------------
  const paintColor = paintColorHex !== undefined ? paintColorHex : 0xaab0b6;
  const paintMat = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.58, roughness: 0.25, side: THREE.DoubleSide });
  const paintDarkMat = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.48, roughness: 0.32, side: THREE.DoubleSide });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x172a37, metalness: 0.20, roughness: 0.12, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111315, metalness: 0.42, roughness: 0.30 });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.52, roughness: 0.30 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x080909, metalness: 0.03, roughness: 0.90 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2b2f34, metalness: 0.90, roughness: 0.18 });
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x62666b, metalness: 0.92, roughness: 0.20 });
  const discMat = new THREE.MeshStandardMaterial({ color: 0x747474, metalness: 0.88, roughness: 0.37 });
  const frontCaliperMat = new THREE.MeshStandardMaterial({ color: 0x2458c7, metalness: 0.35, roughness: 0.34 });
  const rearCaliperMat = new THREE.MeshStandardMaterial({ color: 0x9b2525, metalness: 0.35, roughness: 0.34 });
  const frontLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdceeff, emissiveIntensity: 1.8, metalness: 0.10, roughness: 0.13 });
  const rearLightMat = new THREE.MeshStandardMaterial({ color: 0x6f0c0c, emissive: 0xff1515, emissiveIntensity: 1.5 });

  // --------------------------------------------------------
  // Exact blueprint dimensions
  // --------------------------------------------------------
  const L = 4.52;
  const W = 1.98;
  const H = 1.16;
  const halfW = W / 2;
  const frontAxleZ = 1.21;
  const rearAxleZ = -1.51;
  const halfWheelbase = 1.36;
  const frontTrack = 1.69;
  const rearTrack = 1.67;
  const frontWheelRadius = 0.334;
  const rearWheelRadius = 0.351;
  const frontWheelWidth = 0.241;
  const rearWheelWidth = 0.279;
  const groundClearance = 0.145;

  // --------------------------------------------------------
  // Generic geometry helpers
  // --------------------------------------------------------
  function meshFromVertices(vertices, material, indices) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (indices) geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function addBox(w, h, d, material, x, y, z, rotY = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  }

  // Closed rounded body loft. q = [normalized half-width, normalized height].
  function buildLoft(stations, crossSection, material) {
    const verts = [];
    const n = crossSection.length;
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      for (let p = 0; p < n; p++) {
        const q = crossSection[p];
        verts.push(q[0] * s.halfWidth, s.bottomY + q[1] * (s.topY - s.bottomY), s.z);
      }
    }
    const indices = [];
    for (let i = 0; i < stations.length - 1; i++) {
      for (let p = 0; p < n; p++) {
        const a = i * n + p;
        const b = i * n + ((p + 1) % n);
        const c = (i + 1) * n + p;
        const d = (i + 1) * n + ((p + 1) % n);
        indices.push(a, c, b, b, c, d);
      }
    }
    return meshFromVertices(verts, material, indices);
  }

  // Thin surface strip used only as a subtle crease, not as a separate floating decoration.
  function addCrease(sign) {
    const pts = [
      new THREE.Vector3(sign * 0.785, 0.545, 1.20),
      new THREE.Vector3(sign * 0.775, 0.525, 0.82),
      new THREE.Vector3(sign * 0.765, 0.505, 0.44),
      new THREE.Vector3(sign * 0.775, 0.500, 0.02),
      new THREE.Vector3(sign * 0.795, 0.515, -0.40),
      new THREE.Vector3(sign * 0.83, 0.555, -0.82),
      new THREE.Vector3(sign * 0.865, 0.61, -1.18)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.010, 5, false), paintDarkMat);
    line.castShadow = true;
    car.add(line);
  }

  function addSidePanelWithWheelOpening(sign, axleZ, radius, panelOuterHalfWidth, panelTopY, panelBottomY, panelDepth) {
    // Shape plane: U=Y, V=Z.  The wheel opening is a complete circle; the tire hides the lower portion,
    // giving the correct visible upper arch while keeping the fender physically connected to the body.
    const shape = new THREE.Shape();
    shape.moveTo(panelBottomY, axleZ - radius - 0.11);
    shape.lineTo(panelTopY, axleZ - radius - 0.11);
    shape.lineTo(panelTopY, axleZ + radius + 0.19);
    shape.lineTo(panelBottomY, axleZ + radius + 0.19);
    shape.closePath();

    const hole = new THREE.Path();
    hole.absellipse(panelBottomY + 0.16, axleZ, radius + 0.045, radius + 0.045, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.008, bevelThickness: 0.008 });
    geo.rotateY(sign > 0 ? Math.PI / 2 : -Math.PI / 2);
    const mesh = new THREE.Mesh(geo, paintMat);
    const x = sign * panelOuterHalfWidth;
    mesh.position.set(x, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  }

  function addShapeFacingSide(pointsYZ, material, x, depth = 0.022) {
    const shape = new THREE.Shape();
    pointsYZ.forEach((p, i) => {
      if (i === 0) shape.moveTo(p[0], p[1]);
      else shape.lineTo(p[0], p[1]);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    geo.rotateY(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  }

  // --------------------------------------------------------
  // 1. Main integrated body shell
  // --------------------------------------------------------
  const bodySection = [
    [0.00, 0.00], [0.52, 0.018], [0.83, 0.11], [0.97, 0.28],
    [1.00, 0.48], [0.94, 0.68], [0.70, 0.84], [0.00, 1.00],
    [-0.70, 0.84], [-0.94, 0.68], [-1.00, 0.48], [-0.97, 0.28],
    [-0.83, 0.11], [-0.52, 0.018]
  ];

  const stations = [
    { z: 2.26, halfWidth: 0.09, bottomY: 0.18, topY: 0.32 },
    { z: 2.12, halfWidth: 0.36, bottomY: 0.16, topY: 0.37 },
    { z: 1.88, halfWidth: 0.64, bottomY: 0.15, topY: 0.45 },
    { z: 1.62, halfWidth: 0.77, bottomY: 0.145, topY: 0.53 },
    { z: 1.42, halfWidth: 0.82, bottomY: 0.145, topY: 0.58 },
    { z: 1.21, halfWidth: 0.84, bottomY: 0.145, topY: 0.64 },
    { z: 0.92, halfWidth: 0.77, bottomY: 0.145, topY: 0.58 },
    { z: 0.48, halfWidth: 0.76, bottomY: 0.145, topY: 0.55 },
    { z: 0.04, halfWidth: 0.76, bottomY: 0.145, topY: 0.53 },
    { z: -0.36, halfWidth: 0.77, bottomY: 0.145, topY: 0.55 },
    { z: -0.68, halfWidth: 0.80, bottomY: 0.145, topY: 0.60 },
    { z: -0.98, halfWidth: 0.83, bottomY: 0.145, topY: 0.66 },
    { z: -1.22, halfWidth: 0.84, bottomY: 0.145, topY: 0.72 },
    { z: -1.51, halfWidth: 0.86, bottomY: 0.145, topY: 0.76 },
    { z: -1.80, halfWidth: 0.80, bottomY: 0.145, topY: 0.67 },
    { z: -2.02, halfWidth: 0.68, bottomY: 0.145, topY: 0.57 },
    { z: -2.20, halfWidth: 0.48, bottomY: 0.145, topY: 0.49 },
    { z: -2.26, halfWidth: 0.32, bottomY: 0.145, topY: 0.43 }
  ];
  car.add(buildLoft(stations, bodySection, paintMat));

  // --------------------------------------------------------
  // 2. Integrated front and rear fenders with real openings
  // --------------------------------------------------------
  const frontFender = addSidePanelWithWheelOpening(-1, frontAxleZ, frontWheelRadius, 0.86, 0.76, 0.25, 0.11);
  frontFender.scale.y = 0.98;
  const frontFenderR = addSidePanelWithWheelOpening(1, frontAxleZ, frontWheelRadius, 0.86, 0.76, 0.25, 0.11);
  frontFenderR.scale.y = 0.98;
  addSidePanelWithWheelOpening(-1, rearAxleZ, rearWheelRadius, 0.88, 0.80, 0.25, 0.12);
  addSidePanelWithWheelOpening(1, rearAxleZ, rearWheelRadius, 0.88, 0.80, 0.25, 0.12);

  // Subtle upper shoulder bridge so the fender is visibly connected into the hood/quarter.
  [-1, 1].forEach(sign => {
    addBox(0.12, 0.11, 1.00, paintDarkMat, sign * 0.83, 0.67, 0.78, sign * 0.035);
    addBox(0.14, 0.12, 0.92, paintDarkMat, sign * 0.86, 0.71, -1.06, -sign * 0.035);
  });

  // --------------------------------------------------------
  // 3. Door and one natural character crease
  // --------------------------------------------------------
  [-1, 1].forEach(sign => {
    addShapeFacingSide([
      [0.24, 0.23], [0.24, 0.58], [0.56, 0.70], [0.69, 0.59], [0.66, 0.28]
    ], paintDarkMat, sign * 0.785, 0.016);
    addCrease(sign);

    // Single door seam, kept very thin and aligned with the body line.
    const seamPts = [
      new THREE.Vector3(sign * 0.789, 0.25, 0.58),
      new THREE.Vector3(sign * 0.789, 0.43, 0.57),
      new THREE.Vector3(sign * 0.789, 0.58, 0.34),
      new THREE.Vector3(sign * 0.789, 0.54, -0.54)
    ];
    const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPts), 24, 0.0045, 5, false), blackMat);
    seam.castShadow = false;
    car.add(seam);
  });

  // Side intake behind door; flush with body.
  [-1, 1].forEach(sign => {
    const intake = new THREE.Shape();
    intake.moveTo(-0.18, -0.09);
    intake.lineTo(0.24, -0.05);
    intake.lineTo(0.30, 0.11);
    intake.lineTo(-0.10, 0.13);
    intake.closePath();
    const geo = new THREE.ExtrudeGeometry(intake, { depth: 0.030, bevelEnabled: false, steps: 1 });
    geo.rotateY(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, blackMat);
    mesh.position.set(sign * 0.795, 0.43, -0.72);
    mesh.castShadow = false;
    car.add(mesh);
  });

  // --------------------------------------------------------
  // 4. Front hood / fascia based on the front drawing
  // --------------------------------------------------------
  const hood = new THREE.Shape();
  hood.moveTo(-0.77, 0.33);
  hood.lineTo(-0.49, 0.52);
  hood.lineTo(-0.17, 0.59);
  hood.lineTo(0.17, 0.59);
  hood.lineTo(0.49, 0.52);
  hood.lineTo(0.77, 0.33);
  hood.lineTo(0.59, 0.25);
  hood.lineTo(0.24, 0.28);
  hood.lineTo(0, 0.31);
  hood.lineTo(-0.24, 0.28);
  hood.lineTo(-0.59, 0.25);
  hood.closePath();
  const hoodGeo = new THREE.ExtrudeGeometry(hood, { depth: 0.045, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.008, bevelThickness: 0.006 });
  hoodGeo.rotateX(Math.PI / 2);
  const hoodMesh = new THREE.Mesh(hoodGeo, paintMat);
  hoodMesh.position.set(0, 0.05, 2.17);
  hoodMesh.castShadow = true;
  car.add(hoodMesh);

  // Front grille and side air openings attached directly to fascia.
  addBox(1.10, 0.15, 0.055, blackMat, 0, 0.29, 2.30);
  addBox(0.38, 0.12, 0.060, carbonMat, -0.61, 0.30, 2.27, -0.07);
  addBox(0.38, 0.12, 0.060, carbonMat, 0.61, 0.30, 2.27, 0.07);

  // Thin swept headlights.
  [-1, 1].forEach(sign => {
    const shape = new THREE.Shape();
    shape.moveTo(0.02, 0.32);
    shape.lineTo(0.38, 0.40);
    shape.lineTo(0.59, 0.33);
    shape.lineTo(0.22, 0.29);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.024, bevelEnabled: false, steps: 1 });
    const lamp = new THREE.Mesh(geo, frontLightMat);
    lamp.position.set(sign * 0.03, 0, 2.34);
    lamp.scale.x = sign;
    lamp.rotation.x = -0.01;
    car.add(lamp);
  });

  // Front splitter.
  addBox(1.62, 0.045, 0.16, carbonMat, 0, groundClearance + 0.01, 2.37);
  addBox(0.72, 0.04, 0.10, carbonMat, 0, groundClearance + 0.07, 2.41);

  // Hood vents, connected to upper front surface.
  [-1, 1].forEach(sign => {
    addBox(0.22, 0.018, 0.38, blackMat, sign * 0.46, 0.47, 1.92, sign * 0.12);
  });

  // --------------------------------------------------------
  // 5. One-piece glass canopy; no second roof
  // --------------------------------------------------------
  const cabinSection = [
    [0.00, 0.00], [0.54, 0.06], [0.78, 0.30], [0.76, 0.62], [0.55, 0.84], [0.00, 1.00],
    [-0.55, 0.84], [-0.76, 0.62], [-0.78, 0.30], [-0.54, 0.06]
  ];
  const cabinStations = [
    { z: 0.82, halfWidth: 0.42, bottomY: 0.61, topY: 0.67 },
    { z: 0.55, halfWidth: 0.48, bottomY: 0.63, topY: 0.84 },
    { z: 0.22, halfWidth: 0.54, bottomY: 0.68, topY: 1.01 },
    { z: -0.12, halfWidth: 0.55, bottomY: 0.76, topY: 1.075 },
    { z: -0.45, halfWidth: 0.51, bottomY: 0.72, topY: 1.03 },
    { z: -0.75, halfWidth: 0.43, bottomY: 0.64, topY: 0.88 }
  ];
  car.add(buildLoft(cabinStations, cabinSection, glassMat));

  // Thin frames only. No extra roof panel.
  [-1, 1].forEach(sign => {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.44, 0.075), blackMat);
    aPillar.position.set(sign * 0.49, 0.82, 0.48);
    aPillar.rotation.x = -0.48;
    car.add(aPillar);

    const rearButtress = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.30, 0.075), blackMat);
    rearButtress.position.set(sign * 0.45, 0.80, -0.58);
    rearButtress.rotation.x = 0.32;
    car.add(rearButtress);
  });

  // Small roof centre trim, sitting on the single canopy, not creating another roof.
  addBox(0.34, 0.028, 0.50, blackMat, 0, 1.075, -0.05);

  // --------------------------------------------------------
  // 6. Mirrors
  // --------------------------------------------------------
  [-1, 1].forEach(sign => {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.085), blackMat);
    stalk.position.set(sign * 0.68, 0.72, 0.48);
    stalk.rotation.y = sign * 0.16;
    car.add(stalk);
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), blackMat);
    mirror.scale.set(0.075, 0.05, 0.13);
    mirror.position.set(sign * 0.78, 0.71, 0.45);
    car.add(mirror);
  });

  // --------------------------------------------------------
  // 7. Rear body, tail lamps, diffuser
  // --------------------------------------------------------
  addBox(1.28, 0.18, 0.08, paintDarkMat, 0, 0.49, -2.24);
  addBox(1.10, 0.038, 0.035, rearLightMat, 0, 0.60, -2.285);
  [-1, 1].forEach(sign => {
    addBox(0.30, 0.09, 0.045, rearLightMat, sign * 0.49, 0.57, -2.27);
  });
  addBox(1.38, 0.18, 0.28, carbonMat, 0, 0.17, -2.27);
  for (let i = -3; i <= 3; i++) addBox(0.024, 0.18, 0.27, blackMat, i * 0.20, 0.15, -2.28);

  // Flush exhausts.
  [-1, 1].forEach(sign => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.065, 20), rimMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(sign * 0.57, 0.34, -2.31);
    car.add(tip);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.07, 20), blackMat);
    inner.rotation.x = Math.PI / 2;
    inner.position.set(sign * 0.57, 0.34, -2.315);
    car.add(inner);
  });

  // Rear wing close to the reference side/top silhouette.
  const wingZ = -2.00;
  [-1, 1].forEach(sign => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.07), carbonMat);
    post.position.set(sign * 0.47, 0.82, wingZ);
    post.rotation.x = -0.12;
    car.add(post);
  });
  addBox(1.55, 0.045, 0.21, carbonMat, 0, 1.00, wingZ, 0);
  [-1, 1].forEach(sign => addBox(0.035, 0.18, 0.23, carbonMat, sign * 0.76, 1.00, wingZ));

  // --------------------------------------------------------
  // 8. Wheels / brakes
  // --------------------------------------------------------
  function buildWheel(radius, width, discRadius, caliperMaterial, sideSign) {
    const g = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 32, 1), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    g.add(tire);

    const rimRadius = radius * 0.66;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, 0.034, 8, 28), rimMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.x = sideSign > 0 ? width * 0.515 : -width * 0.515;
    g.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.071, 0.055, 16), spokeMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = sideSign > 0 ? width * 0.53 : -width * 0.53;
    g.add(hub);

    for (let i = 0; i < 10; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.025, rimRadius * 1.05, 0.045), spokeMat);
      spoke.rotation.y = Math.PI / 2;
      spoke.rotation.z = (i / 10) * Math.PI * 2;
      spoke.position.x = sideSign > 0 ? width * 0.535 : -width * 0.535;
      g.add(spoke);
    }

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discRadius, discRadius, 0.021, 32), discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = sideSign > 0 ? -width * 0.18 : width * 0.18;
    g.add(disc);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.050, discRadius * 0.66, discRadius * 0.30), caliperMaterial);
    caliper.position.set(disc.position.x, discRadius * 0.47, discRadius * 0.30);
    g.add(caliper);
    return g;
  }

  const wheelSpecs = [
    { x: -frontTrack / 2, z: frontAxleZ, r: frontWheelRadius, w: frontWheelWidth, d: 0.195, c: frontCaliperMat },
    { x:  frontTrack / 2, z: frontAxleZ, r: frontWheelRadius, w: frontWheelWidth, d: 0.195, c: frontCaliperMat },
    { x: -rearTrack / 2,  z: rearAxleZ,  r: rearWheelRadius,  w: rearWheelWidth,  d: 0.205, c: rearCaliperMat },
    { x:  rearTrack / 2,  z: rearAxleZ,  r: rearWheelRadius,  w: rearWheelWidth,  d: 0.205, c: rearCaliperMat }
  ];

  wheelSpecs.forEach(s => {
    const wheel = buildWheel(s.r, s.w, s.d, s.c, s.x);
    wheel.position.set(s.x, s.r, s.z);
    car.add(wheel);
  });

  // --------------------------------------------------------
  // 9. Interior / first-person API
  // --------------------------------------------------------
  const interiorGroup = new THREE.Group();
  car.add(interiorGroup);
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.70 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x25282c, roughness: 0.72 });
  const floorHeight = groundClearance + 0.145;
  const cabinFrontZ = 0.50;
  const bPillarZ = -0.58;

  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.15, 0.22), interiorMat);
  dashboard.position.set(-0.18, floorHeight + 0.48, cabinFrontZ - 0.28);
  interiorGroup.add(dashboard);

  const steeringWheel = new THREE.Group();
  steeringWheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.020, 12, 24), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.82 })));
  steeringWheel.position.set(-0.32, floorHeight + 0.55, cabinFrontZ - 0.04);
  steeringWheel.rotation.x = -0.35;
  interiorGroup.add(steeringWheel);

  function addSeat(x) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.09), seatMat);
    back.position.set(x, floorHeight + 0.45, bPillarZ + 0.35);
    back.rotation.x = -0.15;
    interiorGroup.add(back);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.15, 0.10), seatMat);
    head.position.set(x, floorHeight + 0.75, bPillarZ + 0.40);
    head.rotation.x = -0.15;
    interiorGroup.add(head);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.085, 0.45), seatMat);
    base.position.set(x, floorHeight + 0.22, bPillarZ + 0.55);
    interiorGroup.add(base);
  }
  addSeat(-0.32);
  addSeat(0.32);

  const firstPersonOffset = new THREE.Vector3(-0.32, floorHeight + 0.75, bPillarZ + 0.50);

  // Rear-view mirror API
  const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
  const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);
  const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.02), blackMat);
  mirrorFrame.position.set(0, floorHeight + 0.86, cabinFrontZ + 0.05);
  interiorGroup.add(mirrorFrame);
  const mirrorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), new THREE.MeshBasicMaterial({ map: mirrorRenderTarget.texture }));
  mirrorScreen.position.set(0, floorHeight + 0.86, cabinFrontZ + 0.04);
  mirrorScreen.rotation.y = Math.PI;
  interiorGroup.add(mirrorScreen);

  mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
  mirrorRenderTarget.texture.repeat.x = -1;
  mirrorRenderTarget.texture.offset.x = 1;

  function updateMirrorCamera() {
    const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
    mirrorCamera.position.copy(car.position).add(worldOffset);
    mirrorCamera.position.y += 0.15;
    const backYaw = car.rotation.y + Math.PI;
    const dir = new THREE.Vector3(Math.sin(backYaw), 0, Math.cos(backYaw));
    mirrorCamera.up.set(0, 1, 0);
    mirrorCamera.lookAt(mirrorCamera.position.clone().add(dir));
  }

  const sideMirrorRTs = [];
  const sideMirrorCams = [];
  [-1, 1].forEach((sign, idx) => {
    const rt = new THREE.WebGLRenderTarget(160, 100);
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.repeat.x = -1;
    rt.texture.offset.x = 1;
    const cam = new THREE.PerspectiveCamera(45, 160 / 100, 0.3, 500);
    sideMirrorRTs.push(rt);
    sideMirrorCams.push(cam);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.10), new THREE.MeshBasicMaterial({ map: rt.texture }));
    screen.position.set(sign * 0.77, floorHeight + 0.60, 0.49);
    screen.lookAt(-0.32, floorHeight + 0.75, bPillarZ + 0.50);
    screen.rotation.y += Math.PI;
    interiorGroup.add(screen);
  });

  function updateSideMirrorCameras() {
    [-1, 1].forEach((sign, idx) => {
      const cam = sideMirrorCams[idx];
      const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
      cam.position.copy(car.position).add(worldOffset);
      cam.position.y += 0.10;
      const yaw = car.rotation.y + Math.PI - sign * 0.60;
      const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      cam.up.set(0, 1, 0);
      cam.lookAt(cam.position.clone().add(dir));
    });
  }

  // Contact shadow
  const shadowGeo = new THREE.CircleGeometry(2.45, 32);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.30, depthWrite: false }));
  shadow.position.y = 0.018;
  car.add(shadow);

  return {
    group: car,
    paintMat,
    interiorGroup,
    steeringWheel,
    firstPersonOffset,
    mirrorRenderTarget,
    mirrorCamera,
    updateMirrorCamera,
    sideMirrorRTs,
    sideMirrorCams,
    updateSideMirrorCameras,
    halfTrack: (frontTrack + rearTrack) / 4,
    halfWheelbase,
    wheelRadius: (frontWheelRadius + rearWheelRadius) / 2,
    collisionRadius: 1.90
  };
}

window.CAR_MODELS = window.CAR_MODELS || {};
window.CAR_MODELS.kazeR01 = {
  label: 'KAZE R-01',
  defaultColor: 0xaab0b6,
  build: buildKazeR01
};
