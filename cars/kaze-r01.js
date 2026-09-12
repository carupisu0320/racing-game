// ==========================================================
// KAZE R-01 - Three.js procedural sports car model
// 1 Three.js unit = 1 meter
// Coordinate: +Z = front, +Y = up, +/-X = left/right
//
// Design goals:
// - approx. 4.92m x 2.14m x 1.25m
// - Wheelbase 2.72m
// - Front track 1.69m / Rear track 1.67m
// - Low-midship supercar proportions
// - Strong single character line flowing:
//   front fender -> door -> rear fender
// - Avoid the "boxes stacked together" appearance
// - Compatible with the existing CAR_MODELS/loadCarModel system
// ==========================================================

function buildKazeR01(paintColorHex) {
  const car = new THREE.Group();

  // --------------------------------------------------------
  // Materials
  // --------------------------------------------------------
  const paintColor = paintColorHex !== undefined ? paintColorHex : 0xaab0b6;

  const paintMat = new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.55,
    roughness: 0.27,
    side: THREE.DoubleSide
  });

  const paintDarkMat = new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.50,
    roughness: 0.32,
    side: THREE.DoubleSide
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x101a22,
    metalness: 0.25,
    roughness: 0.12,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.45,
    roughness: 0.34
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x191b1f,
    metalness: 0.50,
    roughness: 0.34
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x090909,
    metalness: 0.05,
    roughness: 0.88
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x292c30,
    metalness: 0.88,
    roughness: 0.18
  });

  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0x55585d,
    metalness: 0.90,
    roughness: 0.22
  });

  const discMat = new THREE.MeshStandardMaterial({
    color: 0x696969,
    metalness: 0.88,
    roughness: 0.38
  });

  const frontCaliperMat = new THREE.MeshStandardMaterial({
    color: 0x2458c7,
    metalness: 0.35,
    roughness: 0.35
  });

  const rearCaliperMat = new THREE.MeshStandardMaterial({
    color: 0x9a2424,
    metalness: 0.35,
    roughness: 0.35
  });

  const frontLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdceeff,
    emissiveIntensity: 1.7,
    metalness: 0.15,
    roughness: 0.16
  });

  const rearLightMat = new THREE.MeshStandardMaterial({
    color: 0x7a1010,
    emissive: 0xff2020,
    emissiveIntensity: 1.5
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xe44b4b,
    emissive: 0x4a0808,
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.28
  });

  // --------------------------------------------------------
  // Dimensions
  // --------------------------------------------------------
  const L = 4.92;
  const W = 2.14;
  const H = 1.25;

  const halfLen = L / 2;
  const halfTrackFront = 0.895;
  const halfTrackRear = 0.885;

  // Slightly higher than the previous version so the body
  // does not look like it is scraping the road.
  const groundClearance = 0.155;

  // Drawing X positions from the original specification:
  // front axle = 1.05m from nose, rear axle = 3.77m from nose.
  const frontAxleZ = 1.37;
  const rearAxleZ = -1.47;

  const frontWheelRadius = 0.370;
  const rearWheelRadius = 0.382;

  // --------------------------------------------------------
  // Helpers
  // --------------------------------------------------------

  function meshFromVertices(vertices, material, indices) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    if (indices) geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Longitudinal loft.
  // Each station describes width and upper/lower body height.
  // The cross-section is deliberately rounded rather than rectangular.
  function buildLoft(stations, crossSection, material) {
    const positions = [];
    const uvs = [];
    const n = crossSection.length;

    for (let s = 0; s < stations.length; s++) {
      const st = stations[s];

      for (let p = 0; p < n; p++) {
        const q = crossSection[p];

        positions.push(
          q[0] * st.halfWidth,
          st.bottomY + q[1] * (st.topY - st.bottomY),
          st.z
        );

        uvs.push(
          p / n,
          s / Math.max(1, stations.length - 1)
        );
      }
    }

    const indices = [];

    for (let s = 0; s < stations.length - 1; s++) {
      for (let p = 0; p < n; p++) {
        const a = s * n + p;
        const b = s * n + ((p + 1) % n);
        const c = (s + 1) * n + p;
        const d = (s + 1) * n + ((p + 1) % n);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    return meshFromVertices(positions, material, indices);
  }

  // A smooth strip made from longitudinal stations.
  // Used for the single body-surface character line.
  function buildSurfaceStrip(stations, material) {
    const positions = [];
    const indices = [];

    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];

      // The strip has a shallow center ridge:
      // outer edge -> ridge -> inner edge.
      positions.push(s.xOuter, s.yOuter, s.z);
      positions.push(s.xRidge, s.yRidge, s.z);
      positions.push(s.xInner, s.yInner, s.z);
    }

    for (let i = 0; i < stations.length - 1; i++) {
      const a = i * 3;
      const b = (i + 1) * 3;

      indices.push(a, b, a + 1);
      indices.push(a + 1, b, b + 1);

      indices.push(a + 1, b + 1, a + 2);
      indices.push(a + 2, b + 1, b + 2);
    }

    return meshFromVertices(positions, material, indices);
  }

  function addBox(w, h, d, material, x, y, z, rotY = 0) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  }

  function addTrapezoidPanel(widthFront, widthRear, height, depth, material, x, y, z) {
    const hwf = widthFront / 2;
    const hwr = widthRear / 2;
    const hh = height / 2;
    const hd = depth / 2;

    const vertices = [
      -hwf, -hh, -hd,
       hwf, -hh, -hd,
       hwf,  hh, -hd,
      -hwf,  hh, -hd,

      -hwr, -hh,  hd,
       hwr, -hh,  hd,
       hwr,  hh,  hd,
      -hwr,  hh,  hd
    ];

    const indices = [
      0,1,2, 0,2,3,
      4,6,5, 4,7,6,
      0,4,5, 0,5,1,
      3,2,6, 3,6,7,
      1,5,6, 1,6,2,
      0,3,7, 0,7,4
    ];

    const mesh = meshFromVertices(vertices, material, indices);
    mesh.position.set(x, y, z);
    car.add(mesh);
    return mesh;
  }

  // --------------------------------------------------------
  // 1. Main lower body
  // --------------------------------------------------------
  const bodyCrossSection = [
    [0.00, 0.00],
    [0.54, 0.015],
    [0.83, 0.10],
    [0.97, 0.28],
    [1.00, 0.48],
    [0.94, 0.68],
    [0.70, 0.84],
    [0.00, 1.00],
    [-0.70, 0.84],
    [-0.94, 0.68],
    [-1.00, 0.48],
    [-0.97, 0.28],
    [-0.83, 0.10],
    [-0.54, 0.015]
  ];

  // Wider at both axles, narrower through the door/sill,
  // but without abrupt width changes.
  const bodyStations = [
    { z:  2.46, halfWidth: 0.06, bottomY: groundClearance, topY: 0.30 },
    { z:  2.30, halfWidth: 0.34, bottomY: groundClearance, topY: 0.34 },
    { z:  2.02, halfWidth: 0.61, bottomY: groundClearance, topY: 0.40 },
    { z:  1.70, halfWidth: 0.78, bottomY: groundClearance, topY: 0.49 },
    { z:  1.48, halfWidth: 0.86, bottomY: groundClearance, topY: 0.61 },
    { z:  1.37, halfWidth: 0.94, bottomY: groundClearance, topY: 0.72 },
    { z:  1.10, halfWidth: 0.84, bottomY: groundClearance, topY: 0.66 },
    { z:  0.70, halfWidth: 0.82, bottomY: groundClearance, topY: 0.62 },
    { z:  0.30, halfWidth: 0.84, bottomY: groundClearance, topY: 0.60 },
    { z: -0.10, halfWidth: 0.85, bottomY: groundClearance, topY: 0.60 },
    { z: -0.48, halfWidth: 0.87, bottomY: groundClearance, topY: 0.63 },
    { z: -0.82, halfWidth: 0.94, bottomY: groundClearance, topY: 0.70 },
    { z: -1.12, halfWidth: 1.00, bottomY: groundClearance, topY: 0.79 },
    { z: -1.47, halfWidth: 1.06, bottomY: groundClearance, topY: 0.84 },
    { z: -1.76, halfWidth: 0.93, bottomY: groundClearance, topY: 0.70 },
    { z: -2.05, halfWidth: 0.77, bottomY: groundClearance, topY: 0.59 },
    { z: -2.28, halfWidth: 0.58, bottomY: groundClearance, topY: 0.52 },
    { z: -2.46, halfWidth: 0.40, bottomY: groundClearance, topY: 0.45 }
  ];
  const body = buildLoft(bodyStations, bodyCrossSection, paintMat);
  car.add(body);

  // --------------------------------------------------------
  // 2. Shoulder/fender volume
  // --------------------------------------------------------
  // A second very shallow loft sits on top of the main body.
  // This creates real volume around the wheels instead of
  // attaching rectangular fender pieces.
  const shoulderCrossSection = [
    [0.00, 0.00],
    [0.45, 0.02],
    [0.78, 0.10],
    [0.95, 0.30],
    [1.00, 0.55],
    [0.86, 0.80],
    [0.00, 1.00],
    [-0.86, 0.80],
    [-1.00, 0.55],
    [-0.95, 0.30],
    [-0.78, 0.10],
    [-0.45, 0.02]
  ];

  const shoulderStations = [
    { z:  1.64, halfWidth: 0.79, bottomY: 0.50, topY: 0.64 },
    { z:  1.48, halfWidth: 0.84, bottomY: 0.51, topY: 0.76 },
    { z:  1.37, halfWidth: 0.91, bottomY: 0.51, topY: 0.88 },
    { z:  1.12, halfWidth: 0.82, bottomY: 0.50, topY: 0.69 },
    { z: -0.78, halfWidth: 0.87, bottomY: 0.50, topY: 0.70 },
    { z: -1.12, halfWidth: 0.96, bottomY: 0.51, topY: 0.82 },
    { z: -1.47, halfWidth: 1.05, bottomY: 0.51, topY: 0.94 },
    { z: -1.80, halfWidth: 0.91, bottomY: 0.50, topY: 0.72 }
  ];
  const shoulder = buildLoft(
    shoulderStations,
    shoulderCrossSection,
    paintDarkMat
  );
  car.add(shoulder);

  // --------------------------------------------------------
  // 3. Strong SINGLE character line
  // --------------------------------------------------------
  // This is intentionally a shallow raised surface, not a black
  // decorative stripe. It starts high on the front fender,
  // passes through the door, and rises again into the rear fender.
  //
  // Both sides use the same path, so the car reads as one design
  // instead of several unrelated panels.
  //
  // z: front -> rear
  // x: outside side of the body
  // y: body surface height
  function addCharacterLine(sign) {
    const stations = [
      { z:  1.60, xOuter: sign * 0.79, xRidge: sign * 0.825, xInner: sign * 0.79, yOuter: 0.60, yRidge: 0.625, yInner: 0.60 },
      { z:  1.38, xOuter: sign * 0.86, xRidge: sign * 0.90, xInner: sign * 0.86, yOuter: 0.67, yRidge: 0.70, yInner: 0.67 },
      { z:  1.10, xOuter: sign * 0.82, xRidge: sign * 0.855, xInner: sign * 0.82, yOuter: 0.61, yRidge: 0.635, yInner: 0.61 },
      { z:  0.72, xOuter: sign * 0.81, xRidge: sign * 0.845, xInner: sign * 0.81, yOuter: 0.575, yRidge: 0.60, yInner: 0.575 },
      { z:  0.34, xOuter: sign * 0.82, xRidge: sign * 0.855, xInner: sign * 0.82, yOuter: 0.57, yRidge: 0.595, yInner: 0.57 },
      { z: -0.05, xOuter: sign * 0.83, xRidge: sign * 0.865, xInner: sign * 0.83, yOuter: 0.575, yRidge: 0.60, yInner: 0.575 },
      { z: -0.43, xOuter: sign * 0.84, xRidge: sign * 0.88, xInner: sign * 0.84, yOuter: 0.59, yRidge: 0.62, yInner: 0.59 },
      { z: -0.80, xOuter: sign * 0.88, xRidge: sign * 0.925, xInner: sign * 0.88, yOuter: 0.64, yRidge: 0.675, yInner: 0.64 },
      { z: -1.12, xOuter: sign * 0.94, xRidge: sign * 0.985, xInner: sign * 0.94, yOuter: 0.70, yRidge: 0.735, yInner: 0.70 },
      { z: -1.45, xOuter: sign * 0.97, xRidge: sign * 1.02, xInner: sign * 0.97, yOuter: 0.77, yRidge: 0.81, yInner: 0.77 },
      { z: -1.72, xOuter: sign * 0.88, xRidge: sign * 0.92, xInner: sign * 0.88, yOuter: 0.68, yRidge: 0.71, yInner: 0.68 }
    ];
    car.add(buildSurfaceStrip(stations, paintMat));

    // Signature accent: one thin red line following the same body crease.
    const pts = stations.map(s => new THREE.Vector3(s.xRidge, s.yRidge + 0.008, s.z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const accent = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, 0.012, 6, false),
      accentMat
    );
    accent.castShadow = false;
    car.add(accent);
  }

  addCharacterLine(-1);
  addCharacterLine(1);

  // --------------------------------------------------------
  // 4. Lower side sill
  // --------------------------------------------------------
  [-1, 1].forEach(sign => {
    const sill = addTrapezoidPanel(
      0.25, 0.34, 0.13, 1.28,
      carbonMat,
      sign * 0.82,
      groundClearance + 0.06,
      -0.05
    );

    sill.rotation.y = 0;
  });

  // --------------------------------------------------------
  // 5. Side intake
  // --------------------------------------------------------
  // Recessed dark opening behind the door.
  [-1, 1].forEach(sign => {
    const intakeShape = new THREE.Shape();
    intakeShape.moveTo(-0.25, -0.11);
    intakeShape.lineTo(0.23, -0.08);
    intakeShape.lineTo(0.30, 0.09);
    intakeShape.lineTo(-0.16, 0.13);
    intakeShape.lineTo(-0.25, -0.11);

    const intake = new THREE.Mesh(
      new THREE.ShapeGeometry(intakeShape),
      blackMat
    );

    intake.scale.set(0.72, 1.0, 1.0);
    intake.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
    intake.rotation.z = 0.08;
    intake.position.set(
      sign * 0.86,
      0.40,
      -0.67
    );

    car.add(intake);

    // Intake roof/lip
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.035, 0.46),
      carbonMat
    );
    lip.position.set(sign * 0.88, 0.55, -0.67);
    lip.rotation.y = sign * 0.12;
    car.add(lip);
  });

  // --------------------------------------------------------
  // 6. Cabin
  // --------------------------------------------------------
  const cabinCrossSection = [
    [0.00, 0.00],
    [0.55, 0.06],
    [0.82, 0.30],
    [0.78, 0.63],
    [0.56, 0.86],
    [0.00, 1.00],
    [-0.56, 0.86],
    [-0.78, 0.63],
    [-0.82, 0.30],
    [-0.55, 0.06]
  ];

  const cabinStations = [
    { z:  0.92, halfWidth: 0.43, bottomY: 0.66, topY: 0.71 },
    { z:  0.62, halfWidth: 0.53, bottomY: 0.66, topY: 0.94 },
    { z:  0.28, halfWidth: 0.56, bottomY: 0.72, topY: 1.06 },
    { z: -0.12, halfWidth: 0.58, bottomY: 0.90, topY: 1.10 },
    { z: -0.50, halfWidth: 0.54, bottomY: 0.86, topY: 1.05 },
    { z: -0.84, halfWidth: 0.47, bottomY: 0.74, topY: 0.96 },
    { z: -1.02, halfWidth: 0.36, bottomY: 0.66, topY: 0.82 }
  ];
  const cabin = buildLoft(cabinStations, cabinCrossSection, glassMat);
  car.add(cabin);

  // Roof: the cabin loft itself is the single roof/glass volume.
  // Do not add a second rectangular roof panel here.

  // A-pillars, kept thin so the cabin remains visually low.
  [-1, 1].forEach(sign => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.48, 0.07),
      blackMat
    );
    pillar.position.set(sign * 0.55, 0.87, 0.34);
    pillar.rotation.x = -0.38;
    car.add(pillar);
  });

  // Rear buttresses
  [-1, 1].forEach(sign => {
    const buttress = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.34, 0.10),
      blackMat
    );
    buttress.position.set(sign * 0.51, 0.86, -0.79);
    buttress.rotation.x = 0.28;
    car.add(buttress);
  });

  // --------------------------------------------------------
  // 7. Front nose / splitter / headlights
  // --------------------------------------------------------
  // Low, wide front fascia. The center stays narrow while the corners
  // flare outward toward the front wheels.
  const frontFasciaShape = new THREE.Shape();
  frontFasciaShape.moveTo(-0.78, 0.18);
  frontFasciaShape.lineTo(-0.54, 0.39);
  frontFasciaShape.lineTo(-0.18, 0.48);
  frontFasciaShape.lineTo(0.18, 0.48);
  frontFasciaShape.lineTo(0.54, 0.39);
  frontFasciaShape.lineTo(0.78, 0.18);
  frontFasciaShape.lineTo(0.63, 0.08);
  frontFasciaShape.lineTo(0.26, 0.04);
  frontFasciaShape.lineTo(0, 0.075);
  frontFasciaShape.lineTo(-0.26, 0.04);
  frontFasciaShape.lineTo(-0.63, 0.08);
  frontFasciaShape.closePath();

  const frontFascia = new THREE.Mesh(
    new THREE.ShapeGeometry(frontFasciaShape),
    paintMat
  );
  frontFascia.position.set(0, 0.10, 2.39);
  car.add(frontFascia);

  // Central black opening and two smaller side openings.
  const centerOpeningShape = new THREE.Shape();
  centerOpeningShape.moveTo(-0.34, 0.13);
  centerOpeningShape.lineTo(0.34, 0.13);
  centerOpeningShape.lineTo(0.25, 0.03);
  centerOpeningShape.lineTo(-0.25, 0.03);
  centerOpeningShape.closePath();

  const centerOpening = new THREE.Mesh(
    new THREE.ShapeGeometry(centerOpeningShape),
    blackMat
  );
  centerOpening.position.set(0, 0.10, 2.405);
  car.add(centerOpening);

  [-1, 1].forEach(sign => {
    const sideOpeningShape = new THREE.Shape();
    sideOpeningShape.moveTo(0, 0.10);
    sideOpeningShape.lineTo(0.23, 0.18);
    sideOpeningShape.lineTo(0.19, 0.04);
    sideOpeningShape.lineTo(0.04, 0.02);
    sideOpeningShape.closePath();

    const sideOpening = new THREE.Mesh(
      new THREE.ShapeGeometry(sideOpeningShape),
      blackMat
    );
    sideOpening.position.set(sign * 0.58, 0.10, 2.405);
    sideOpening.scale.x = sign;
    car.add(sideOpening);
  });

  // Thin, swept LED headlights.
  [-1, 1].forEach(sign => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.36);
    shape.lineTo(0.46, 0.42);
    shape.lineTo(0.58, 0.34);
    shape.lineTo(0.19, 0.30);
    shape.closePath();

    const lamp = new THREE.Mesh(new THREE.ShapeGeometry(shape), frontLightMat);
    lamp.position.set(sign * 0.05, 0.0, 2.415);
    lamp.scale.x = sign;
    car.add(lamp);

    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.014, 0.022),
      frontLightMat
    );
    led.position.set(sign * 0.46, 0.365, 2.40);
    led.rotation.y = sign * 0.18;
    car.add(led);
  });

  // Low front splitter.
  addBox(1.62, 0.045, 0.16, carbonMat, 0, groundClearance + 0.015, 2.42);

  // --------------------------------------------------------
  // 8. Proper wheel arches
  // --------------------------------------------------------
  // The tire is NOT buried inside a solid body anymore.
  // The body side is kept slightly narrower and a real curved
  // painted arch is placed around the upper half of each tire.
  // This is much closer to a real fender silhouette.
  function addWheelArch(sign, axleZ, radius, rear = false) {
    // The old version placed a white tube far outside the tire, which
    // looked like a floating hoop. Keep the wheel opening tight to the
    // tire instead. This is only a subtle painted lip.
    const wheelWidth = rear ? 0.279 : 0.241;
    const outerX = sign * ((rear ? halfTrackRear : halfTrackFront) + wheelWidth * 0.52 + 0.012);
    const archRadius = radius + (rear ? 0.018 : 0.016);
    const points = [];
    const startA = Math.PI * 0.88;
    const endA = Math.PI * 0.12;
    const count = 18;

    for (let i = 0; i <= count; i++) {
      const a = startA + (endA - startA) * (i / count);
      points.push(new THREE.Vector3(
        outerX,
        radius + Math.sin(a) * archRadius,
        axleZ + Math.cos(a) * archRadius
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const lip = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.018, 6, false),
      paintDarkMat
    );
    lip.castShadow = true;
    lip.receiveShadow = true;
    car.add(lip);
  }

  [-1, 1].forEach(sign => {
    addWheelArch(sign, frontAxleZ, frontWheelRadius, false);
    addWheelArch(sign, rearAxleZ, rearWheelRadius, true);
  });

  // --------------------------------------------------------
  // 9. Rear body / diffuser / tail
  // --------------------------------------------------------
  // Wide black rear fascia, thin full-width lamp and a deep diffuser.
  addBox(1.58, 0.22, 0.08, blackMat, 0, 0.42, -2.40);

  addBox(1.38, 0.045, 0.045, rearLightMat, 0, 0.60, -2.445);

  // Outer rear vents
  [-1, 1].forEach(sign => {
    addBox(0.30, 0.24, 0.055, blackMat, sign * 0.72, 0.34, -2.43);
  });

  // Four large diffuser fins
  addBox(1.48, 0.20, 0.34, carbonMat, 0, 0.12, -2.30);
  for (let i = -3; i <= 3; i++) {
    addBox(0.024, 0.20, 0.34, blackMat, i * 0.20, 0.11, -2.30);
  }

  // Twin round exhaust outlets
  [-1, 1].forEach(sign => {
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.065, 20),
      rimMat
    );
    tip.rotation.x = Math.PI / 2;
    tip.position.set(sign * 0.62, 0.33, -2.45);
    car.add(tip);

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.070, 0.070, 0.068, 20),
      blackMat
    );
    inner.rotation.x = Math.PI / 2;
    inner.position.set(sign * 0.62, 0.33, -2.452);
    car.add(inner);
  });

  // --------------------------------------------------------
  // 10. Rear wing
  // --------------------------------------------------------
  const wingZ = -2.18;
  const wingY = 1.00;

  [-1, 1].forEach(sign => {
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.36, 0.075),
      carbonMat
    );
    strut.position.set(sign * 0.52, 0.79, wingZ);
    strut.rotation.x = -0.16;
    car.add(strut);
  });

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.045, 0.22),
    carbonMat
  );
  wing.position.set(0, wingY, wingZ);
  wing.rotation.x = -0.10;
  wing.castShadow = true;
  car.add(wing);

  [-1, 1].forEach(sign => {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.19, 0.27),
      carbonMat
    );
    plate.position.set(sign * 0.84, wingY, wingZ);
    car.add(plate);
  });

  // --------------------------------------------------------
  // 11. Mirrors
  // --------------------------------------------------------
  [-1, 1].forEach(sign => {
    const stalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.035, 0.08),
      blackMat
    );
    stalk.position.set(sign * 0.74, 0.81, 0.56);
    stalk.rotation.y = sign * 0.18;
    car.add(stalk);

    const mirror = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 5),
      blackMat
    );
    mirror.scale.set(0.09, 0.055, 0.16);
    mirror.position.set(sign * 0.90, 0.80, 0.53);
    car.add(mirror);
  });

  // --------------------------------------------------------
  // 12. Wheels
  // --------------------------------------------------------
  function buildWheel(radius, width, rimRadius, discRadius, caliperMaterial, sideSign) {
    const group = new THREE.Group();

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 28, 1),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    group.add(tire);

    // Outer rim ring
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(rimRadius, 0.035, 8, 24),
      rimMat
    );
    rim.rotation.y = Math.PI / 2;
    rim.position.x = sideSign > 0 ? width * 0.51 : -width * 0.51;
    group.add(rim);

    // Center hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.055, 16),
      spokeMat
    );
    hub.rotation.z = Math.PI / 2;
    hub.position.x = sideSign > 0 ? width * 0.53 : -width * 0.53;
    group.add(hub);

    // Five spokes, rotated into the wheel plane
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, rimRadius * 1.20, 0.055),
        spokeMat
      );
      spoke.rotation.z = (i / 5) * Math.PI * 2;
      spoke.rotation.y = Math.PI / 2;
      spoke.position.x = sideSign > 0 ? width * 0.535 : -width * 0.535;
      group.add(spoke);
    }

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(discRadius, discRadius, 0.022, 32),
      discMat
    );
    disc.rotation.z = Math.PI / 2;
    disc.position.x = sideSign > 0 ? -width * 0.20 : width * 0.20;
    group.add(disc);

    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, discRadius * 0.72, discRadius * 0.35),
      caliperMaterial
    );
    caliper.position.set(
      disc.position.x,
      discRadius * 0.50,
      discRadius * 0.35
    );
    group.add(caliper);

    return group;
  }

  const wheelSpecs = [
    {
      x: -halfTrackFront,
      z: frontAxleZ,
      radius: frontWheelRadius,
      width: 0.241,
      disc: 0.195,
      caliper: frontCaliperMat
    },
    {
      x: halfTrackFront,
      z: frontAxleZ,
      radius: frontWheelRadius,
      width: 0.241,
      disc: 0.195,
      caliper: frontCaliperMat
    },
    {
      x: -halfTrackRear,
      z: rearAxleZ,
      radius: rearWheelRadius,
      width: 0.279,
      disc: 0.185,
      caliper: rearCaliperMat
    },
    {
      x: halfTrackRear,
      z: rearAxleZ,
      radius: rearWheelRadius,
      width: 0.279,
      disc: 0.185,
      caliper: rearCaliperMat
    }
  ];

  wheelSpecs.forEach(spec => {
    const wheel = buildWheel(
      spec.radius,
      spec.width,
      spec.radius * 0.64,
      spec.disc,
      spec.caliper,
      spec.x
    );

    wheel.position.set(spec.x, spec.radius, spec.z);
    car.add(wheel);
  });

  // --------------------------------------------------------
  // 13. Interior / first-person view
  // --------------------------------------------------------
  const interiorGroup = new THREE.Group();
  car.add(interiorGroup);

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x17191c,
    roughness: 0.70
  });

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x24272b,
    roughness: 0.72
  });

  const floorHeight = groundClearance + 0.145;
  const cabinFrontZ = 0.56;
  const bPillarZ = -0.62;

  const dashboard = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.17, 0.22),
    interiorMat
  );
  dashboard.position.set(-0.10, floorHeight + 0.50, cabinFrontZ - 0.30);
  interiorGroup.add(dashboard);

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.82
  });

  const badgeMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc0,
    metalness: 0.70,
    roughness: 0.25
  });

  const steeringWheel = new THREE.Group();

  const wheelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.021, 12, 24),
    gripMat
  );
  steeringWheel.add(wheelRing);

  const centerBadge = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 16),
    badgeMat
  );
  centerBadge.position.z = 0.015;
  steeringWheel.add(centerBadge);

  steeringWheel.position.set(
    -0.32,
    floorHeight + 0.56,
    cabinFrontZ - 0.05
  );
  steeringWheel.rotation.x = -0.35;
  interiorGroup.add(steeringWheel);

  [-1, 1].forEach(sign => {
    const paddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.02, 0.09),
      badgeMat
    );
    paddle.position.set(
      sign * 0.16,
      floorHeight + 0.54,
      cabinFrontZ + 0.03
    );
    interiorGroup.add(paddle);
  });

  function createSeat(x) {
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.48, 0.09),
      seatMat
    );
    back.position.set(x, floorHeight + 0.46, bPillarZ + 0.35);
    back.rotation.x = -0.15;
    interiorGroup.add(back);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.16, 0.10),
      seatMat
    );
    head.position.set(x, floorHeight + 0.76, bPillarZ + 0.40);
    head.rotation.x = -0.15;
    interiorGroup.add(head);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.09, 0.45),
      seatMat
    );
    base.position.set(x, floorHeight + 0.24, bPillarZ + 0.55);
    interiorGroup.add(base);
  }

  createSeat(-0.32);
  createSeat(0.32);

  const pedalMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    metalness: 0.4,
    roughness: 0.5
  });

  const brakePedal = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.03, 0.20),
    pedalMat
  );
  brakePedal.position.set(
    -0.38,
    floorHeight + 0.06,
    cabinFrontZ - 0.05
  );
  brakePedal.rotation.x = -0.5;
  interiorGroup.add(brakePedal);

  const accelPedal = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.03, 0.18),
    pedalMat
  );
  accelPedal.position.set(
    -0.25,
    floorHeight + 0.06,
    cabinFrontZ - 0.07
  );
  accelPedal.rotation.x = -0.35;
  interiorGroup.add(accelPedal);

  const floorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.20, 0.04, 1.0),
    interiorMat
  );
  floorPanel.position.set(
    -0.32,
    floorHeight,
    bPillarZ + 0.30
  );
  interiorGroup.add(floorPanel);

  const firstPersonOffset = new THREE.Vector3(
    -0.32,
    floorHeight + 0.76,
    bPillarZ + 0.50
  );

  // --------------------------------------------------------
  // 14. Rear-view mirrors used by the existing game
  // --------------------------------------------------------
  const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
  const mirrorCamera = new THREE.PerspectiveCamera(
    45,
    256 / 128,
    0.3,
    500
  );

  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.08, 0.02),
    blackMat
  );
  mirrorFrame.position.set(
    0,
    floorHeight + 0.86,
    cabinFrontZ + 0.05
  );
  interiorGroup.add(mirrorFrame);

  mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
  mirrorRenderTarget.texture.repeat.x = -1;
  mirrorRenderTarget.texture.offset.x = 1;

  const mirrorScreenMat = new THREE.MeshBasicMaterial({
    map: mirrorRenderTarget.texture
  });

  const mirrorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.06),
    mirrorScreenMat
  );
  mirrorScreen.position.set(
    0,
    floorHeight + 0.86,
    cabinFrontZ + 0.04
  );
  mirrorScreen.rotation.y = Math.PI;
  interiorGroup.add(mirrorScreen);

  function updateMirrorCamera() {
    const worldOffset = firstPersonOffset
      .clone()
      .applyQuaternion(car.quaternion);

    mirrorCamera.position.copy(car.position).add(worldOffset);
    mirrorCamera.position.y += 0.15;

    const backYaw = car.rotation.y + Math.PI;
    const dir = new THREE.Vector3(
      Math.sin(backYaw),
      0,
      Math.cos(backYaw)
    );

    mirrorCamera.up.set(0, 1, 0);
    mirrorCamera.lookAt(
      mirrorCamera.position.clone().add(dir)
    );
  }

  const sideMirrorRTs = [];
  const sideMirrorCams = [];

  [-1, 1].forEach((sign, idx) => {
    const rt = new THREE.WebGLRenderTarget(160, 100);
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.repeat.x = -1;
    rt.texture.offset.x = 1;

    const cam = new THREE.PerspectiveCamera(
      45,
      160 / 100,
      0.3,
      500
    );

    sideMirrorRTs.push(rt);
    sideMirrorCams.push(cam);

    const screenMat = new THREE.MeshBasicMaterial({
      map: rt.texture
    });

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.10),
      screenMat
    );

    screen.position.set(
      sign * 0.85,
      groundClearance + 0.62,
      0.62
    );

    screen.lookAt(
      -0.32,
      floorHeight + 0.76,
      bPillarZ + 0.50
    );

    screen.rotation.y += Math.PI;
    interiorGroup.add(screen);
  });

  function updateSideMirrorCameras() {
    [-1, 1].forEach((sign, idx) => {
      const cam = sideMirrorCams[idx];

      const worldOffset = firstPersonOffset
        .clone()
        .applyQuaternion(car.quaternion);

      cam.position.copy(car.position).add(worldOffset);
      cam.position.y += 0.10;

      const yaw =
        car.rotation.y +
        Math.PI -
        sign * 0.60;

      const dir = new THREE.Vector3(
        Math.sin(yaw),
        0,
        Math.cos(yaw)
      );

      cam.up.set(0, 1, 0);
      cam.lookAt(
        cam.position.clone().add(dir)
      );
    });
  }

  // --------------------------------------------------------
  // 15. Contact shadow
  // --------------------------------------------------------
  const shadowGeo = new THREE.CircleGeometry(2.55, 32);
  shadowGeo.rotateX(-Math.PI / 2);

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });

  const contactShadow = new THREE.Mesh(
    shadowGeo,
    shadowMat
  );
  contactShadow.position.y = 0.018;
  car.add(contactShadow);

  // --------------------------------------------------------
  // API expected by index.html
  // --------------------------------------------------------
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

    halfTrack: (halfTrackFront + halfTrackRear) / 2,
    halfWheelbase: 1.42,
    wheelRadius: (frontWheelRadius + rearWheelRadius) / 2,

    collisionRadius: 2.10
  };
}

// ----------------------------------------------------------
// Register with the existing vehicle system.
// ----------------------------------------------------------
window.CAR_MODELS = window.CAR_MODELS || {};

window.CAR_MODELS.kazeR01 = {
  label: 'KAZE R-01',
  defaultColor: 0xaab0b6,
  build: buildKazeR01
};
