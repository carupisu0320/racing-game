// ==========================================================
// 車モデル: KAZE R-01(架空のミッドシップスーパーカー)
//
// 「箱を組み合わせただけ」の見た目にならないよう、車体は
// BoxGeometryの積み重ねではなく、鼻先からテールまでの断面(幅・高さ)を
// 何点かの「ステーション」として定義し、それを滑らかに繋いだ
// 1枚のカスタムBufferGeometry(ロフト面)として作っている。
// キャビン(ガラス+ルーフ)も同じ手法の別ロフトを、車体の上に重ねている。
//
// 座標系: このゲームの物理コード(index.html側)は、
//   car.quaternionに(0,0,1)を掛けた方向を「前進方向」として使っており、
//   ローカルZ軸のプラス方向が車の前方、ローカルY軸が高さ、
//   ローカルX軸が左右(進行方向に向かって左がマイナス)になっている。
// 本ファイルの寸法もすべてこの座標系(前方向=+Z、上方向=+Y)で統一し、
// 図面のX(前端0〜後端4,520mm)は「halfLen - 図面X/1000」としてローカルZに、
// 図面Yはそのままローカルステアリング幅(mm/1000)としてローカルXに変換している。
//
// 実在車種を模さないオリジナルデザイン。
// ==========================================================
function buildKazeR01(paintColorHex) {
const car = new THREE.Group();

const interiorGroup = new THREE.Group();
car.add(interiorGroup);

const paintColor = paintColorHex !== undefined ? paintColorHex : 0xaab0b6;
const paintMat = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.55, roughness: 0.28, side: THREE.DoubleSide });
const cabinMat = new THREE.MeshStandardMaterial({ color: 0x12161a, metalness: 0.3, roughness: 0.15, side: THREE.DoubleSide });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.5, roughness: 0.35 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x121212, metalness: 0.3, roughness: 0.5 });
const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, metalness: 0.4, roughness: 0.4 });
const lightMatFront = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.2 });
const lightMatRear = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0xff2222, emissiveIntensity: 1.1 });
const calipeMatFront = new THREE.MeshStandardMaterial({ color: 0x2255cc });
const calipeMatRear = new THREE.MeshStandardMaterial({ color: 0x992222 });
const discMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.5 });

// 諸元(1 Three.js unit = 1 m)
const carLength = 4.52;
const halfLen = carLength / 2; // 2.26
const halfWheelbase = 1.36;    // ホイールベース2,720mmの半分
const halfTrackFront = 0.845;  // 前トレッド1,690mmの半分
const halfTrackRear = 0.835;   // 後トレッド1,670mmの半分
const groundClearance = 0.11;  // 最低地上高110mm
// フロントアクスルは前端から1.05m、リアアクスルは前端から3.77m
const frontAxleZ = halfLen - 1.05; // = 1.21
const rearAxleZ = halfLen - 3.77;  // = -1.51

// ----------------------------------------------------------
// ロフト(断面を繋いで滑らかな曲面を作る)のための共通関数
// ----------------------------------------------------------
// stations: [{ z, halfWidth, bottomY, topY }, ...] を鼻→テールの順で並べる
// crossSection: [[fx, fy], ...] 断面形状(fx: -1〜1で左右、fy: 0〜1で下→上)を反時計回りに一周ぶん
function buildLoft(stations, crossSection, material) {
  const positions = [];
  const uvs = [];
  const ringCount = stations.length;
  const pointsPerRing = crossSection.length;

  stations.forEach((st, si) => {
    crossSection.forEach(([fx, fy], pi) => {
      const x = fx * st.halfWidth;
      const y = st.bottomY + fy * (st.topY - st.bottomY);
      positions.push(x, y, st.z);
      uvs.push(pi / pointsPerRing, si / Math.max(1, ringCount - 1));
    });
  });

  const indices = [];
  for (let si = 0; si < ringCount - 1; si++) {
    for (let pi = 0; pi < pointsPerRing; pi++) {
      const a = si * pointsPerRing + pi;
      const b = si * pointsPerRing + ((pi + 1) % pointsPerRing);
      const c = (si + 1) * pointsPerRing + pi;
      const d = (si + 1) * pointsPerRing + ((pi + 1) % pointsPerRing);
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// 車体断面(ボディ本体用): 平らな底面 → 丸みを帯びた側面 → すぼまる肩口 → 平らな上面、
// を1周ぶんの点で表現する(角を作らず、なめらかに繋がるようにするのが目的)
const bodyCrossSection = [
  [0.0, 0.0], [0.55, 0.02], [0.92, 0.15], [1.0, 0.45],
  [0.9, 0.75], [0.55, 0.95], [0.0, 1.0],
  [-0.55, 0.95], [-0.9, 0.75], [-1.0, 0.45],
  [-0.92, 0.15], [-0.55, 0.02]
];

// ----------------------------------------------------------
// 1. 車体本体(ロワーボディ)のロフト
//    鼻先 → フロントフェンダー(前輪位置で最大幅) → ドア(くびれ) →
//    リアフェンダー(後輪位置で最大幅) → テール、まで1本の面でつなぐ
// ----------------------------------------------------------
const gc = groundClearance;
// ボディ本体はホイールの内側(タイヤ幅の内側)に収まる幅に抑える。
// フェンダーの「盛り上がり」自体は、この後で追加するアーチ状の
// 別パーツ(タイヤの上側だけを覆う)で表現し、タイヤの真横は
// ボディでふさがない(実車のホイールアーチと同じ考え方)。
const bodyStations = [
  { z: halfLen,            halfWidth: 0.10, bottomY: gc, topY: gc + 0.30 }, // 鼻先端(尖らせる)
  { z: halfLen - 0.30,     halfWidth: 0.62, bottomY: gc, topY: gc + 0.34 }, // フロントバンパー
  { z: halfLen - 0.68,     halfWidth: 0.78, bottomY: gc, topY: gc + 0.42 }, // ボンネット付け根
  { z: frontAxleZ + 0.34,  halfWidth: 0.72, bottomY: gc, topY: gc + 0.46 }, // フロントフェンダー手前
  { z: frontAxleZ,         halfWidth: 0.68, bottomY: gc, topY: gc + 0.5 },  // フロントホイール位置(タイヤより内側)
  { z: frontAxleZ - 0.34,  halfWidth: 0.72, bottomY: gc, topY: gc + 0.48 }, // フロントフェンダー奥
  { z: 0.75,               halfWidth: 0.74, bottomY: gc, topY: gc + 0.60 }, // カウル/フロントガラス基部
  { z: 0.10,               halfWidth: 0.82, bottomY: gc, topY: gc + 0.54 }, // ドア中央(くびれ)
  { z: -0.55,              halfWidth: 0.86, bottomY: gc, topY: gc + 0.56 }, // サイドインテーク付近
  { z: rearAxleZ + 0.36,   halfWidth: 0.74, bottomY: gc, topY: gc + 0.5 },  // リアフェンダー手前
  { z: rearAxleZ,          halfWidth: 0.70, bottomY: gc, topY: gc + 0.52 }, // リアホイール位置(タイヤより内側)
  { z: rearAxleZ - 0.36,   halfWidth: 0.74, bottomY: gc, topY: gc + 0.5 },  // リアフェンダー奥
  { z: -1.95,              halfWidth: 0.60, bottomY: gc, topY: gc + 0.46 }, // リアハンチ
  { z: -halfLen,           halfWidth: 0.40, bottomY: gc, topY: gc + 0.42 }  // テールエンド
];
const bodyLoft = buildLoft(bodyStations, bodyCrossSection, paintMat);
car.add(bodyLoft);

// フェンダーアーチ(タイヤの上側だけを覆う、太い円弧状の縁)。
// タイヤの真横は覆わないので、真横から見てもタイヤが隠れたり
// ボディにめり込んだりせず、上からしっかり張り出して見える。
function buildFenderArch(wheelRadius, tubeRadius, centerX, centerZ) {
  const arcAngle = Math.PI * 1.05; // 下側(接地側)を大きく開けた円弧
  const geo = new THREE.TorusGeometry(wheelRadius + tubeRadius * 0.7, tubeRadius, 10, 24, arcAngle);
  const arch = new THREE.Mesh(geo, paintMat);
  arch.rotation.y = Math.PI / 2; // ホイールと同じ向き(X軸を中心にした円)に合わせる
  arch.rotation.x = Math.PI / 2 + (Math.PI * 2 - arcAngle) / 2; // 円弧の開口部を真下に向ける
  arch.position.set(centerX, wheelRadius, centerZ);
  arch.castShadow = true;
  return arch;
}

// ----------------------------------------------------------
// 2. キャビン(ガラス+ルーフ)のロフト。ロワーボディの上に重ねる
//    カウル(低い)→ フロントガラス(寝かせて立ち上がる)→ ルーフ → リアガラス、まで1本の面
// ----------------------------------------------------------
const cabinCrossSection = [
  [0.0, 0.0], [0.65, 0.05], [0.98, 0.4], [0.7, 0.85], [0.0, 1.0],
  [-0.7, 0.85], [-0.98, 0.4], [-0.65, 0.05]
];
const cabinStations = [
  { z: 0.78,  halfWidth: 0.58, bottomY: gc + 0.55, topY: gc + 0.62 }, // カウル(フロントガラス下端)
  { z: 0.20,  halfWidth: 0.66, bottomY: gc + 0.60, topY: gc + 1.02 }, // フロントガラス上端/ルーフ前端(寝かせた角度はここの傾きで表現)
  { z: -0.55, halfWidth: 0.66, bottomY: gc + 1.00, topY: gc + 1.05 }, // ルーフ後端
  { z: -1.05, halfWidth: 0.50, bottomY: gc + 0.62, topY: gc + 0.82 }  // リアガラス下端(エンジンルーム上)
];
const cabinLoft = buildLoft(cabinStations, cabinCrossSection, cabinMat);
car.add(cabinLoft);

// ----------------------------------------------------------
// 3. フロントノーズ細部(スプリッター・グリル・エアインテーク)
// ----------------------------------------------------------
const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.14), carbonMat);
splitter.position.set(0, gc + 0.01, halfLen + 0.02);
car.add(splitter);

const grille = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.06), new THREE.MeshStandardMaterial({ color: 0x050505 }));
grille.position.set(0, gc + 0.16, halfLen - 0.02);
car.add(grille);

[-1, 1].forEach((sign) => {
  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x050505 }));
  intake.position.set(sign * 0.58, gc + 0.18, halfLen - 0.15);
  intake.rotation.y = sign * 0.3;
  car.add(intake);
});

// ヘッドライト(薄型LED。ノーズ側面に沿わせる)
[-1, 1].forEach((sign) => {
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.05), trimMat);
  housing.position.set(sign * 0.62, gc + 0.36, halfLen - 0.32);
  housing.rotation.y = sign * 0.18;
  car.add(housing);
  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.007, 0.04), lightMatFront);
    led.position.set(sign * 0.62, gc + 0.33 + i * 0.011, halfLen - 0.3);
    led.rotation.y = sign * 0.18;
    car.add(led);
  }
});

// ----------------------------------------------------------
// 4. ドア(シャットライン・ハンドル・サイドエアインテーク)
//    ボディはロフトで一体化しているので、ここでは「継ぎ目の線」と
//    「凹んだインテーク」だけを面に貼り付けて表現する
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const doorX = 0.83;
  const frontShutline = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.4, 0.015), trimMat);
  frontShutline.position.set(sign * doorX, gc + 0.42, 0.62);
  car.add(frontShutline);

  const rearShutline = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.4, 0.015), trimMat);
  rearShutline.position.set(sign * doorX, gc + 0.42, -0.55);
  car.add(rearShutline);

  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.16), trimMat);
  doorHandle.position.set(sign * doorX, gc + 0.6, 0.05);
  car.add(doorHandle);

  // ドア後方の大型サイドエアインテーク(リアフェンダー手前)。
  // 前を浅く・後ろを深くえぐるように角度を付け、単なる黒い板ではなく
  // ボディに切り込まれた開口部に見えるようにする
  const intakeGroup = new THREE.Group();
  const intakeOuter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.48), trimMat);
  intakeOuter.position.set(0, 0, 0);
  intakeGroup.add(intakeOuter);
  const intakeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.36), new THREE.MeshStandardMaterial({ color: 0x030303 }));
  intakeSlot.position.set(sign * 0.02, 0, 0.02);
  intakeGroup.add(intakeSlot);
  intakeGroup.position.set(sign * 0.79, gc + 0.42, -0.9);
  intakeGroup.rotation.y = sign * 0.12; // 前方がボディに沿い、後方がえぐれて見える角度
  car.add(intakeGroup);
});

// ----------------------------------------------------------
// 5. リアエンド(バンパー・テールランプ・ディフューザー)
// ----------------------------------------------------------
const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.12), trimMat);
rearBumper.position.set(0, gc + 0.26, -halfLen + 0.06);
car.add(rearBumper);

const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.05), trimMat);
tailHousing.position.set(0, gc + 0.44, -halfLen + 0.02);
car.add(tailHousing);
const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.055, 0.055), lightMatRear);
tailLight.position.set(0, gc + 0.44, -halfLen + 0.015);
car.add(tailLight);

const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.22, 0.26), carbonMat);
diffuser.position.set(0, gc + 0.11, -halfLen + 0.02);
car.add(diffuser);
for (let i = -1.5; i <= 1.5; i++) {
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.09, 0.26), trimMat);
  fin.position.set(i * 0.14, gc + 0.05, -halfLen + 0.02);
  car.add(fin);
}

// ----------------------------------------------------------
// 6. 可変リアウイング(薄いブレード+スイープしたステーで、
//    「板を1枚置いただけ」に見えないようにする)
// ----------------------------------------------------------
const wingHalfWidth = 0.72;
const strutHalfSpacing = 0.46;
const wingZ = -halfLen + 0.32;
const wingBaseY = gc + 0.56;
[-1, 1].forEach((sign) => {
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.09), carbonMat);
  strut.position.set(sign * strutHalfSpacing, wingBaseY + 0.08, wingZ + 0.04);
  strut.rotation.x = -0.25; // 後方へスイープさせ、リアボディとの一体感を出す
  car.add(strut);
});
const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.03, 0.26), carbonMat);
rearWing.position.set(0, wingBaseY + 0.16, wingZ);
rearWing.rotation.x = -8 * Math.PI / 180;
rearWing.castShadow = true;
car.add(rearWing);
[-1, 1].forEach((sign) => {
  const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.32), carbonMat);
  endPlate.position.set(sign * wingHalfWidth, wingBaseY + 0.18, wingZ);
  car.add(endPlate);
});

// ----------------------------------------------------------
// 7. ドアミラー(ボディに沿わせた小型のスポーツミラー)
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), roofMat);
  stalk.position.set(sign * 0.76, gc + 0.68, 0.68);
  car.add(stalk);
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.15), roofMat);
  mirror.position.set(sign * 0.85, gc + 0.66, 0.62);
  car.add(mirror);
});

// 接地感を出すコンタクトシャドウ
const shadowGeo = new THREE.CircleGeometry(2.6, 24);
shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false });
const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
contactShadow.position.y = 0.015;
car.add(contactShadow);

// ----------------------------------------------------------
// 8. ホイール・ブレーキ(前19×9.5J+265/35R19+390mmディスク / 後20×11J+305/30R20+370mmディスク)
// ----------------------------------------------------------
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.85, roughness: 0.2 });
const spokeMat = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8, roughness: 0.25 });

function buildWheel(radius, width, rimRadius, discRadius, calipeMat, sideSign) {
  const wheelGroup = new THREE.Group();

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 22), wheelMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, 0.05, 8, 16), rimMat);
  rim.rotation.y = Math.PI / 2;
  wheelGroup.add(rim);

  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, rimRadius * 1.3, 0.045), spokeMat);
    spoke.rotation.x = (i / 5) * Math.PI * 2;
    spoke.rotation.y = Math.PI / 2;
    wheelGroup.add(spoke);
  }

  // ブレーキディスク(リムの内側、タイヤと同軸の薄い円盤)
  const discX = sideSign > 0 ? -width * 0.32 : width * 0.32;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(discRadius, discRadius, 0.02, 28), discMat);
  disc.rotation.z = Math.PI / 2;
  disc.position.x = discX;
  wheelGroup.add(disc);

  // ブレーキキャリパー(ディスクの前上部を挟む箱)
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, discRadius * 0.75, discRadius * 0.42), calipeMat);
  caliper.position.set(discX, discRadius * 0.55, discRadius * 0.55);
  wheelGroup.add(caliper);

  return wheelGroup;
}

const frontWheelRadius = 0.334, frontWheelWidth = 0.241, frontDiscRadius = 0.195; // 265/35ZR19, 390mmディスク
const rearWheelRadius = 0.346, rearWheelWidth = 0.279, rearDiscRadius = 0.185;    // 305/30ZR20, 370mmディスク
const wheelSpecs = [
  { x: -halfTrackFront, z: frontAxleZ, radius: frontWheelRadius, width: frontWheelWidth, disc: frontDiscRadius, caliper: calipeMatFront },
  { x: halfTrackFront, z: frontAxleZ, radius: frontWheelRadius, width: frontWheelWidth, disc: frontDiscRadius, caliper: calipeMatFront },
  { x: -halfTrackRear, z: rearAxleZ, radius: rearWheelRadius, width: rearWheelWidth, disc: rearDiscRadius, caliper: calipeMatRear },
  { x: halfTrackRear, z: rearAxleZ, radius: rearWheelRadius, width: rearWheelWidth, disc: rearDiscRadius, caliper: calipeMatRear }
];
wheelSpecs.forEach((spec) => {
  const wheelGroup = buildWheel(spec.radius, spec.width, spec.radius * 0.62, spec.disc, spec.caliper, spec.x);
  wheelGroup.position.set(spec.x, spec.radius, spec.z);
  car.add(wheelGroup);

  const arch = buildFenderArch(spec.radius, 0.11, spec.x, spec.z);
  car.add(arch);
});

// ==========================================================
// 車内(一人称視点用。2ドア・2シーターなので座席は前列のみ)
// ==========================================================
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.7 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.75 });
const floorHeight = gc + 0.145; // フロア高さ145mm
const cabinFrontZ = 0.5;
const bPillarZ = -0.6;

const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.22), interiorMat);
dashboard.position.set(-0.1, floorHeight + 0.5, cabinFrontZ - 0.3);
interiorGroup.add(dashboard);

const gripMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 });
const badgeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.7, roughness: 0.25 });

const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 12, 24), gripMat);
const steeringWheel = new THREE.Group();
steeringWheel.add(wheelRing);
const centerBadge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), badgeMat);
centerBadge.position.z = 0.015;
steeringWheel.add(centerBadge);
steeringWheel.position.set(-0.32, floorHeight + 0.56, cabinFrontZ - 0.05);
steeringWheel.rotation.x = -0.35;
interiorGroup.add(steeringWheel);

[-1, 1].forEach((sign) => {
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.09), badgeMat);
  paddle.position.set(sign * 0.16, floorHeight + 0.54, cabinFrontZ + 0.03);
  interiorGroup.add(paddle);
});

function createSeat(x) {
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.09), seatMat);
  seatBack.position.set(x, floorHeight + 0.46, bPillarZ + 0.35);
  seatBack.rotation.x = -0.15;
  interiorGroup.add(seatBack);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), seatMat);
  headrest.position.set(x, floorHeight + 0.76, bPillarZ + 0.4);
  headrest.rotation.x = -0.15;
  interiorGroup.add(headrest);

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.45), seatMat);
  seatBase.position.set(x, floorHeight + 0.24, bPillarZ + 0.55);
  interiorGroup.add(seatBase);
}
createSeat(-0.32);
createSeat(0.32);

const pedalMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.4, roughness: 0.5 });
const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.2), pedalMat);
brakePedal.position.set(-0.38, floorHeight + 0.06, cabinFrontZ - 0.05);
brakePedal.rotation.x = -0.5;
interiorGroup.add(brakePedal);

const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.18), pedalMat);
accelPedal.position.set(-0.25, floorHeight + 0.06, cabinFrontZ - 0.07);
accelPedal.rotation.x = -0.35;
interiorGroup.add(accelPedal);

const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.0), interiorMat);
floorPanel.position.set(-0.32, floorHeight, bPillarZ + 0.3);
interiorGroup.add(floorPanel);

const firstPersonOffset = new THREE.Vector3(-0.32, floorHeight + 0.76, bPillarZ + 0.5);

const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);

const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), trimMat);
mirrorFrame.position.set(0, floorHeight + 0.86, cabinFrontZ + 0.05);
interiorGroup.add(mirrorFrame);

mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
mirrorRenderTarget.texture.repeat.x = -1;
mirrorRenderTarget.texture.offset.x = 1;
const mirrorScreenMat = new THREE.MeshBasicMaterial({ map: mirrorRenderTarget.texture });
const mirrorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), mirrorScreenMat);
mirrorScreen.position.set(0, floorHeight + 0.86, cabinFrontZ + 0.04);
mirrorScreen.rotation.y = Math.PI;
interiorGroup.add(mirrorScreen);

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

  const screenMat = new THREE.MeshBasicMaterial({ map: rt.texture });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.1), screenMat);
  screen.position.set(sign * 0.85, gc + 0.62, 0.62);
  screen.lookAt(-0.32, floorHeight + 0.76, bPillarZ + 0.5);
  screen.rotation.y += Math.PI;
  interiorGroup.add(screen);
});

function updateSideMirrorCameras() {
  [-1, 1].forEach((sign, idx) => {
    const cam = sideMirrorCams[idx];
    const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
    cam.position.copy(car.position).add(worldOffset);
    cam.position.y += 0.1;

    const yaw = car.rotation.y + Math.PI - sign * 0.6;
    const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    cam.up.set(0, 1, 0);
    cam.lookAt(cam.position.clone().add(dir));
  });
}

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
    halfWheelbase: halfWheelbase,
    wheelRadius: (frontWheelRadius + rearWheelRadius) / 2,
    collisionRadius: 1.9
  };
}

window.CAR_MODELS = window.CAR_MODELS || {};
window.CAR_MODELS.kazeR01 = {
  label: 'KAZE R-01',
  defaultColor: 0xaab0b6,
  build: buildKazeR01
};
