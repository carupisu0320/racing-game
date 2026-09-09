// ==========================================================
// 車モデル: KAZE R-01(架空のミッドシップスーパーカー)
//
// 提供いただいた詳細図面(前端0mm〜後端4,520mmのX軸、左右Y軸、
// 地上高Z軸)の座標をそのままメートル換算し、このファイル内の
// ローカル座標(前方向= +Z、左右= X、高さ= Y)に変換して配置している。
// 変換式: localX = shtY/1000, localY = shtZ/1000, localZ = halfLen - shtX/1000
// (shtX/Y/Zが図面側のX/Y/Z、単位mm)
// 実在車種を模さないオリジナルデザイン。
// ==========================================================
function buildKazeR01(paintColorHex) {
const car = new THREE.Group();

const interiorGroup = new THREE.Group();
car.add(interiorGroup);

const paintMat = new THREE.MeshStandardMaterial({ color: paintColorHex !== undefined ? paintColorHex : 0xaab0b6, metalness: 0.6, roughness: 0.22 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.5, roughness: 0.35 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x141a1e, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.4 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x121212, metalness: 0.3, roughness: 0.5 });
const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, metalness: 0.4, roughness: 0.4 });
const lightMatFront = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.2 });
const lightMatRear = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0xff2222, emissiveIntensity: 1.1 });
const calipeMat = new THREE.MeshStandardMaterial({ color: 0x2255cc });

function createChamferedBox(width, height, depth, chamfer) {
  const w = width / 2;
  const h = height / 2;
  const c = Math.min(chamfer, w * 0.9, h * 0.9);
  const shape = new THREE.Shape();
  shape.moveTo(-w + c, -h);
  shape.lineTo(w - c, -h);
  shape.lineTo(w, -h + c);
  shape.lineTo(w, h - c);
  shape.lineTo(w - c, h);
  shape.lineTo(-w + c, h);
  shape.lineTo(-w, h - c);
  shape.lineTo(-w, -h + c);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// ==========================================================
// 図面座標(mm)→このファイルのローカル座標(m)への変換
// 図面: X=前端0〜後端4520(前後) / Y=左右(中心0) / Z=地上高
// ローカル: Z=前方向(前端が+) / X=左右 / Y=高さ
// ==========================================================
const carLength = 4.520;
const halfLen = carLength / 2; // 2.26
function pt(shtX, shtY, shtZ) {
  return { x: shtY / 1000, y: shtZ / 1000, z: halfLen - shtX / 1000 };
}

// 主要基準点(図面の「1.基準点」表)
const pFrontTip = pt(0, 0, 470);
const pFrontAxle = pt(1050, 0, 330);
const pCabinFront = pt(1620, 0, 720);
const pAPillarBase = pt(1680, 690, 640);
const pBPillar = pt(2450, 720, 650);
const pRearAxle = pt(3770, 0, 330);
const pRearEnd = pt(4520, 0, 500);

const halfWheelbase = (pFrontAxle.z - pRearAxle.z) / 2; // 2,720mmホイールベースの半分
const halfTrackFront = 0.845; // 前トレッド1,690mmの半分
const halfTrackRear = 0.835;  // 後トレッド1,670mmの半分
const groundClearance = 0.11; // 最低地上高110mm
const fenderHalfWidth = 0.99; // フェンダー最大幅(全幅1,980mmの半分)

// ----------------------------------------------------------
// 1. 車体下部(サイドシル・フロア)
// ----------------------------------------------------------
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(1.65, 0.05, 3.9),
  paintMat
);
floor.position.set(0, groundClearance + 0.025, -0.2);
car.add(floor);

[-1, 1].forEach((sign) => {
  const sillCenterZ = pAPillarBase.z - 0.2;
  const sillFront = new THREE.Mesh(createChamferedBox(0.09, 0.22, 0.6, 0.02), trimMat);
  sillFront.position.set(sign * fenderHalfWidth * 0.86, groundClearance + 0.11, sillCenterZ + 0.65);
  car.add(sillFront);

  const sillMid = new THREE.Mesh(createChamferedBox(0.145, 0.22, 0.85, 0.03), trimMat);
  sillMid.position.set(sign * fenderHalfWidth * 0.9, groundClearance + 0.11, sillCenterZ - 0.1);
  car.add(sillMid);

  const sillRear = new THREE.Mesh(createChamferedBox(0.09, 0.22, 0.5, 0.02), trimMat);
  sillRear.position.set(sign * fenderHalfWidth * 0.86, groundClearance + 0.11, sillCenterZ - 0.85);
  car.add(sillRear);
});

// ----------------------------------------------------------
// 2. フロントノーズ・ボンネット
// ----------------------------------------------------------
const noseTip = new THREE.Mesh(createChamferedBox(1.73, 0.28, 0.62, 0.08), paintMat);
noseTip.position.set(0, groundClearance + 0.15, pFrontTip.z - 0.31);
noseTip.castShadow = true;
car.add(noseTip);

const hood = new THREE.Mesh(createChamferedBox(1.52, 0.16, 1.15, 0.06), paintMat);
hood.position.set(0, groundClearance + 0.35, pFrontTip.z - 0.62 - 1.15 / 2 + 0.15);
hood.castShadow = true;
car.add(hood);

const frontBumper = new THREE.Mesh(createChamferedBox(1.93, 0.42, 0.2, 0.06), trimMat);
frontBumper.position.set(0, groundClearance + 0.21, pFrontTip.z - 0.05);
car.add(frontBumper);

const grille = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.145, 0.06), new THREE.MeshStandardMaterial({ color: 0x050505 }));
grille.position.set(0, groundClearance + 0.16, pFrontTip.z - 0.02);
car.add(grille);

[-1, 1].forEach((sign) => {
  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.21, 0.1), new THREE.MeshStandardMaterial({ color: 0x050505 }));
  intake.position.set(sign * 0.62, groundClearance + 0.18, pFrontTip.z - 0.05);
  intake.rotation.y = sign * 0.35;
  car.add(intake);
});

const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.93, 0.03, 0.15), carbonMat);
splitter.position.set(0, groundClearance + 0.005, pFrontTip.z + 0.05);
car.add(splitter);

[-1, 1].forEach((sign) => {
  const angle = sign * (18 * Math.PI / 180);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.075, 0.06), trimMat);
  housing.position.set(sign * 0.72, groundClearance + 0.43, pFrontTip.z - 0.28);
  housing.rotation.y = angle;
  car.add(housing);

  for (let i = 0; i < 4; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.008, 0.045), lightMatFront);
    led.position.set(sign * 0.72, groundClearance + 0.4 + i * 0.012, pFrontTip.z - 0.26);
    led.rotation.y = angle;
    car.add(led);
  }
});

// ----------------------------------------------------------
// 3. フロントフェンダー(ホイールアーチ)
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const fenderFront = new THREE.Mesh(createChamferedBox(0.26, 0.5, 1.05, 0.06), paintMat);
  fenderFront.position.set(sign * (fenderHalfWidth - 0.13), groundClearance + 0.34, pFrontAxle.z - 0.1);
  fenderFront.castShadow = true;
  car.add(fenderFront);
});

// ----------------------------------------------------------
// 4. キャビン(Aピラー・ルーフ・ウィンドウ)
// ----------------------------------------------------------
const windshieldBottom = pt(1560, 0, 690);
const windshieldTop = pt(1920, 0, 1080);

const windshieldHeight = Math.hypot(windshieldTop.y - windshieldBottom.y, windshieldTop.z - windshieldBottom.z);
const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.26, windshieldHeight, 0.05), glassMat);
windshield.position.set(0, (windshieldBottom.y + windshieldTop.y) / 2, (windshieldBottom.z + windshieldTop.z) / 2);
windshield.rotation.x = -34 * Math.PI / 180;
car.add(windshield);

[-1, 1].forEach((sign) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.075, windshieldHeight, 0.075), roofMat);
  pillar.position.set(sign * pAPillarBase.x, (windshieldBottom.y + windshieldTop.y) / 2, (windshieldBottom.z + windshieldTop.z) / 2);
  pillar.rotation.x = -34 * Math.PI / 180;
  car.add(pillar);
});

const roof = new THREE.Mesh(createChamferedBox(1.52, 0.05, 1.28, 0.05), roofMat);
roof.position.set(0, 1.16 - 0.025, pCabinFront.z - 1.28 / 2 + 0.1);
roof.castShadow = true;
car.add(roof);

[-1, 1].forEach((sign) => {
  const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, pAPillarBase.z - pBPillar.z), glassMat);
  sideWindow.position.set(sign * pAPillarBase.x, 0.9, (pAPillarBase.z + pBPillar.z) / 2);
  car.add(sideWindow);
});

[-1, 1].forEach((sign) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.62, 0.055), roofMat);
  pillar.position.set(sign * pBPillar.x, pBPillar.y + 0.1, pBPillar.z);
  car.add(pillar);
});

const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.06), glassMat);
rearWindow.position.set(0, 0.98, pBPillar.z - 0.55);
rearWindow.rotation.x = 0.55;
car.add(rearWindow);
for (let i = -2; i <= 2; i++) {
  const louver = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.32, 0.35), trimMat);
  louver.position.set(i * 0.16, 1.0, pBPillar.z - 0.55);
  louver.rotation.x = 0.55;
  car.add(louver);
}

// ----------------------------------------------------------
// 5. ドア(シャットライン・ハンドル・エアインテーク)
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const doorFrontZ = pAPillarBase.z + 0.15;
  const doorRearZ = doorFrontZ - 1.22;
  const doorMidZ = (doorFrontZ + doorRearZ) / 2;
  const doorBottom = 0.34, doorTop = 1.03;

  const frontShutline = new THREE.Mesh(new THREE.BoxGeometry(0.015, doorTop - doorBottom, 0.02), trimMat);
  frontShutline.position.set(sign * (fenderHalfWidth - 0.005), (doorTop + doorBottom) / 2, doorFrontZ);
  car.add(frontShutline);

  const rearShutline = new THREE.Mesh(new THREE.BoxGeometry(0.015, doorTop - doorBottom, 0.02), trimMat);
  rearShutline.position.set(sign * (fenderHalfWidth - 0.005), (doorTop + doorBottom) / 2, doorRearZ);
  car.add(rearShutline);

  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16), trimMat);
  doorHandle.position.set(sign * fenderHalfWidth, 0.62, doorMidZ);
  car.add(doorHandle);

  const intakeZ = halfLen - 2650 / 1000;
  const intakeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.18), trimMat);
  intakeFrame.position.set(sign * 0.87, 0.53, intakeZ);
  car.add(intakeFrame);
});

// ----------------------------------------------------------
// 6. リアフェンダー・サイドスカート
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const fenderRear = new THREE.Mesh(createChamferedBox(0.32, 0.55, 1.3, 0.07), paintMat);
  fenderRear.position.set(sign * (fenderHalfWidth - 0.16), groundClearance + 0.36, pRearAxle.z);
  fenderRear.castShadow = true;
  car.add(fenderRear);
});

// ----------------------------------------------------------
// 7. エンジンカバー(ミッドシップ、Bピラー後方〜リアエンドの間)
// ----------------------------------------------------------
const engineDeck = new THREE.Mesh(createChamferedBox(0.9, 0.16, 1.2, 0.05), paintMat);
engineDeck.position.set(0, 0.72, pBPillar.z - 0.6 - 0.35);
engineDeck.castShadow = true;
car.add(engineDeck);
for (let i = -2; i <= 2; i++) {
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.18), trimMat);
  slit.position.set(i * 0.16, 0.81, pBPillar.z - 0.6 - 0.35);
  car.add(slit);
}

[-1, 1].forEach((sign) => {
  const cover = new THREE.Mesh(createChamferedBox(0.35, 0.4, 1.5, 0.08), paintMat);
  cover.position.set(sign * (fenderHalfWidth - 0.32), groundClearance + 0.34, pBPillar.z - 0.9);
  cover.castShadow = true;
  car.add(cover);
});

// ----------------------------------------------------------
// 8. リアエンド(バンパー・テールランプ・ディフューザー)
// ----------------------------------------------------------
const rearBumper = new THREE.Mesh(createChamferedBox(1.98, 0.52, 0.25, 0.08), paintMat);
rearBumper.position.set(0, groundClearance + 0.26, pRearEnd.z + 0.13);
rearBumper.castShadow = true;
car.add(rearBumper);

const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.09, 0.05), trimMat);
tailHousing.position.set(0, groundClearance + 0.5, pRearEnd.z + 0.03);
car.add(tailHousing);
const tailLight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.065, 0.06), lightMatRear);
tailLight.position.set(0, groundClearance + 0.5, pRearEnd.z + 0.02);
car.add(tailLight);

const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.28, 0.3), carbonMat);
diffuser.position.set(0, groundClearance + 0.14, pRearEnd.z + 0.02);
car.add(diffuser);
for (let i = -2.5; i <= 2.5; i++) {
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.3), trimMat);
  fin.position.set(i * 0.15, groundClearance + 0.06, pRearEnd.z + 0.02);
  car.add(fin);
}

// ----------------------------------------------------------
// 9. 可変リアウイング(全幅1,650mm・支柱間隔1,150mm・可動角0〜15°)
// ----------------------------------------------------------
const wingHalfWidth = 0.825;
const strutHalfSpacing = 0.575;
const wingZ = pRearEnd.z + 0.35;
const wingBaseY = groundClearance + 0.62;
[-1, 1].forEach((sign) => {
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), carbonMat);
  strut.position.set(sign * strutHalfSpacing, wingBaseY + 0.09, wingZ);
  car.add(strut);
});
const rearWing = new THREE.Mesh(createChamferedBox(1.65, 0.042, 0.32, 0.015), carbonMat);
rearWing.position.set(0, wingBaseY + 0.18, wingZ);
rearWing.rotation.x = -8 * Math.PI / 180;
rearWing.castShadow = true;
car.add(rearWing);
[-1, 1].forEach((sign) => {
  const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.32), carbonMat);
  endPlate.position.set(sign * wingHalfWidth, wingBaseY + 0.18, wingZ);
  car.add(endPlate);
});

// ----------------------------------------------------------
// 10. ドアミラー
// ----------------------------------------------------------
[-1, 1].forEach((sign) => {
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.09, 0.185), roofMat);
  mirror.position.set(sign * (fenderHalfWidth + 0.05), 0.78, pAPillarBase.z + 0.1);
  car.add(mirror);
});

const shadowGeo = new THREE.CircleGeometry(2.6, 24);
shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false });
const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
contactShadow.position.y = 0.015;
car.add(contactShadow);

// ----------------------------------------------------------
// 11. ホイール(前19×9.5J+265/35R19 / 後20×11J+305/30R20)
// ----------------------------------------------------------
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.85, roughness: 0.2 });
const spokeMat = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8, roughness: 0.25 });

function buildWheel(radius, width, rimRadius, sideSign) {
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

  const caliper = new THREE.Mesh(new THREE.CylinderGeometry(rimRadius * 0.62, rimRadius * 0.62, 0.09, 12), calipeMat);
  caliper.rotation.z = Math.PI / 2;
  caliper.position.x = sideSign > 0 ? -0.09 : 0.09;
  wheelGroup.add(caliper);
  return wheelGroup;
}

const frontWheelRadius = 0.334, frontWheelWidth = 0.241;
const rearWheelRadius = 0.346, rearWheelWidth = 0.279;
const wheelSpecs = [
  { x: -halfTrackFront, z: pFrontAxle.z, radius: frontWheelRadius, width: frontWheelWidth },
  { x: halfTrackFront, z: pFrontAxle.z, radius: frontWheelRadius, width: frontWheelWidth },
  { x: -halfTrackRear, z: pRearAxle.z, radius: rearWheelRadius, width: rearWheelWidth },
  { x: halfTrackRear, z: pRearAxle.z, radius: rearWheelRadius, width: rearWheelWidth }
];
wheelSpecs.forEach((spec) => {
  const wheelGroup = buildWheel(spec.radius, spec.width, spec.radius * 0.62, spec.x);
  wheelGroup.position.set(spec.x, spec.radius, spec.z);
  car.add(wheelGroup);
});

// ==========================================================
// 車内(一人称視点用。2ドア・2シーターなので座席は前列のみ)
// ==========================================================
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.7 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.75 });
const floorHeight = groundClearance + 0.145;

const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.22), interiorMat);
dashboard.position.set(-0.1, floorHeight + 0.5, pCabinFront.z - 0.5);
interiorGroup.add(dashboard);

const gripMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 });
const badgeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.7, roughness: 0.25 });

const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 12, 24), gripMat);
const steeringWheel = new THREE.Group();
steeringWheel.add(wheelRing);
const centerBadge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), badgeMat);
centerBadge.position.z = 0.015;
steeringWheel.add(centerBadge);
steeringWheel.position.set(-0.32, floorHeight + 0.56, pCabinFront.z - 0.25);
steeringWheel.rotation.x = -0.35;
interiorGroup.add(steeringWheel);

[-1, 1].forEach((sign) => {
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.09), badgeMat);
  paddle.position.set(sign * 0.16, floorHeight + 0.54, pCabinFront.z - 0.17);
  interiorGroup.add(paddle);
});

function createSeat(x) {
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.09), seatMat);
  seatBack.position.set(x, floorHeight + 0.46, pBPillar.z + 0.35);
  seatBack.rotation.x = -0.15;
  interiorGroup.add(seatBack);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), seatMat);
  headrest.position.set(x, floorHeight + 0.76, pBPillar.z + 0.4);
  headrest.rotation.x = -0.15;
  interiorGroup.add(headrest);

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.45), seatMat);
  seatBase.position.set(x, floorHeight + 0.24, pBPillar.z + 0.55);
  interiorGroup.add(seatBase);
}
createSeat(-0.32);
createSeat(0.32);

const pedalMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.4, roughness: 0.5 });
const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.2), pedalMat);
brakePedal.position.set(-0.38, floorHeight + 0.06, pCabinFront.z - 0.25);
brakePedal.rotation.x = -0.5;
interiorGroup.add(brakePedal);

const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.18), pedalMat);
accelPedal.position.set(-0.25, floorHeight + 0.06, pCabinFront.z - 0.27);
accelPedal.rotation.x = -0.35;
interiorGroup.add(accelPedal);

const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.0), interiorMat);
floorPanel.position.set(-0.32, floorHeight, pBPillar.z + 0.3);
interiorGroup.add(floorPanel);

const firstPersonOffset = new THREE.Vector3(-0.32, floorHeight + 0.76, pBPillar.z + 0.5);

const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);

const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), trimMat);
mirrorFrame.position.set(0, floorHeight + 0.86, pCabinFront.z - 0.15);
interiorGroup.add(mirrorFrame);

mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
mirrorRenderTarget.texture.repeat.x = -1;
mirrorRenderTarget.texture.offset.x = 1;
const mirrorScreenMat = new THREE.MeshBasicMaterial({ map: mirrorRenderTarget.texture });
const mirrorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), mirrorScreenMat);
mirrorScreen.position.set(0, floorHeight + 0.86, pCabinFront.z - 0.16);
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
  screen.position.set(sign * (fenderHalfWidth + 0.05), 0.7, pAPillarBase.z);
  screen.lookAt(-0.32, floorHeight + 0.76, pBPillar.z + 0.5);
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
