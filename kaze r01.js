// ==========================================================
// 車モデル: KAZE R-01(架空のミッドシップスーパーカー)
// 提供いただいた諸元(全長4,520mm・全幅1,980mm・全高1,160mm・
// ホイールベース2,720mm・前後トレッド1,690/1,670mm)を1/1000で
// メートル換算し、低く・幅広く・リアウイングを備えたミッドシップの
// シルエットになるよう、sports-car.jsとは別形状で組み立てている。
// 実在車種を模さないオリジナルデザイン。
// ==========================================================
function buildKazeR01(paintColorHex) {
const car = new THREE.Group();

// 内装専用グループ(2シーターなので座席は前列のみ)
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

// 角を面取り(チャンファー)したボックス形状を作るヘルパー(sports-car.jsと同じ考え方)
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

// 諸元(mm)をメートルに換算した基本寸法
const carLength = 4.52;   // 全長 4,520mm
const halfLen = carLength / 2;
const wheelbase = 2.72;   // ホイールベース 2,720mm
const halfWheelbase = wheelbase / 2;
const halfTrackFront = 0.845; // 前トレッド 1,690mm の半分
const halfTrackRear = 0.835;  // 後トレッド 1,670mm の半分

// 全高1,160mm・最低地上高110mmの、低くワイドなミッドシップシルエット
const groundClearance = 0.11;

// シャシー(車体下部、低くワイドな1本の低いブロック)
const chassis = new THREE.Mesh(createChamferedBox(2.0, 0.34, carLength - 0.3, 0.1), paintMat);
chassis.position.set(0, groundClearance + 0.17, 0);
chassis.castShadow = true;
car.add(chassis);

// フロントフェンダー・リアフェンダー(張り出したブリスターフェンダー。リアはさらに幅広)
const frontFenderMat = paintMat;
[-1, 1].forEach((sign) => {
  const frontFender = new THREE.Mesh(createChamferedBox(0.22, 0.4, 1.1, 0.06), frontFenderMat);
  frontFender.position.set(sign * 1.02, groundClearance + 0.32, halfWheelbase - 0.15);
  frontFender.castShadow = true;
  car.add(frontFender);

  const rearFender = new THREE.Mesh(createChamferedBox(0.3, 0.46, 1.3, 0.07), frontFenderMat);
  rearFender.position.set(sign * 1.06, groundClearance + 0.35, -halfWheelbase + 0.1);
  rearFender.castShadow = true;
  car.add(rearFender);
});

// フロントノーズ(低く鋭いウェッジ形状。2段の高さで先端に向かって低くする)
const noseBack = new THREE.Mesh(createChamferedBox(1.85, 0.3, 0.8, 0.06), paintMat);
noseBack.position.set(0, groundClearance + 0.34, halfLen - 1.0);
noseBack.castShadow = true;
car.add(noseBack);

const noseFront = new THREE.Mesh(createChamferedBox(1.75, 0.2, 0.55, 0.05), paintMat);
noseFront.position.set(0, groundClearance + 0.27, halfLen - 0.35);
noseFront.rotation.x = -0.12; // 先端が少し下がるように傾ける
noseFront.castShadow = true;
car.add(noseFront);

// フロントスプリッター(ノーズ下端の張り出し)
const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.3), carbonMat);
splitter.position.set(0, groundClearance + 0.05, halfLen - 0.1);
car.add(splitter);

// キャビン(低いルーフ+傾斜の強いウィンドウ)
const cabinTop = new THREE.Mesh(createChamferedBox(1.35, 0.1, 1.7, 0.05), roofMat);
cabinTop.position.set(0, groundClearance + 1.02, 0.15);
cabinTop.castShadow = true;
car.add(cabinTop);

// フロントガラス(強く傾斜)
const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.62, 0.05), glassMat);
windshield.position.set(0, groundClearance + 0.78, 0.95);
windshield.rotation.x = -0.62;
car.add(windshield);

// 側面窓(左右2枚)
[-0.72, 0.72].forEach((x) => {
  const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.5), glassMat);
  sideWindow.position.set(x, groundClearance + 0.86, 0.1);
  car.add(sideWindow);
});

// Aピラー
[-0.68, 0.68].forEach((x) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.08), roofMat);
  pillar.position.set(x, groundClearance + 0.78, 0.95);
  pillar.rotation.x = -0.62;
  car.add(pillar);
});

// エンジンフード(ミッドシップなので、キャビン後方が盛り上がったエンジンデッキになる)
const engineDeck = new THREE.Mesh(createChamferedBox(1.55, 0.34, 1.5, 0.08), paintMat);
engineDeck.position.set(0, groundClearance + 0.5, -1.1);
engineDeck.castShadow = true;
car.add(engineDeck);

// エンジンデッキの吸気ルーバー(冷却用スリット、装飾)
for (let i = -2; i <= 2; i++) {
  const louver = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.06), trimMat);
  louver.position.set(0, groundClearance + 0.68, -0.6 + i * 0.18);
  car.add(louver);
}

// リアガラス(エンジンデッキ上のルーバー付きガラス)
const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.06), glassMat);
rearWindow.position.set(0, groundClearance + 0.92, -0.55);
rearWindow.rotation.x = 0.55;
car.add(rearWindow);

// リアパネル・バンパー
const rearPanel = new THREE.Mesh(createChamferedBox(1.9, 0.42, 0.4, 0.08), paintMat);
rearPanel.position.set(0, groundClearance + 0.32, -halfLen + 0.2);
rearPanel.castShadow = true;
car.add(rearPanel);

// リアディフューザー(下部、フィン付き)
const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.3), carbonMat);
diffuser.position.set(0, groundClearance + 0.05, -halfLen + 0.05);
car.add(diffuser);
for (let i = -2; i <= 2; i++) {
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.3), trimMat);
  fin.position.set(i * 0.35, groundClearance + 0.08, -halfLen + 0.05);
  car.add(fin);
}

// 可変リアウイング(2本の支柱で持ち上げた大型ウイング。固定角度で表現)
const wingStrutMat = carbonMat;
[-0.55, 0.55].forEach((x) => {
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.12), wingStrutMat);
  strut.position.set(x, groundClearance + 0.78, -halfLen + 0.55);
  car.add(strut);
});
const rearWing = new THREE.Mesh(createChamferedBox(1.5, 0.05, 0.42, 0.02), carbonMat);
rearWing.position.set(0, groundClearance + 0.98, -halfLen + 0.5);
rearWing.rotation.x = -0.15;
rearWing.castShadow = true;
car.add(rearWing);
// ウイングのエンドプレート(左右)
[-0.75, 0.75].forEach((x) => {
  const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.42), carbonMat);
  endPlate.position.set(x, groundClearance + 0.98, -halfLen + 0.5);
  car.add(endPlate);
});

// サイドインテーク(リアタイヤ前方、エンジン冷却用の大きな開口)
[-1, 1].forEach((sign) => {
  const intakeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.5), trimMat);
  intakeFrame.position.set(sign * 1.0, groundClearance + 0.42, -0.35);
  car.add(intakeFrame);
});

// ドアミラー
[-1.05, 1.05].forEach((x) => {
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.26), roofMat);
  mirror.position.set(x, groundClearance + 0.74, 0.85);
  car.add(mirror);
});

// ヘッドライト(細いLEDストリップ状。鋭い印象にする)
[-0.7, 0.7].forEach((x) => {
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), trimMat);
  housing.position.set(x, groundClearance + 0.4, halfLen - 0.05);
  car.add(housing);

  const light = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.07), lightMatFront);
  light.position.set(x, groundClearance + 0.4, halfLen - 0.03);
  car.add(light);
});

// テールライト(横一文字のライトバー)
const tailHousing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.05), trimMat);
tailHousing.position.set(0, groundClearance + 0.52, -halfLen + 0.03);
car.add(tailHousing);
const tailLight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), lightMatRear);
tailLight.position.set(0, groundClearance + 0.52, -halfLen + 0.02);
car.add(tailLight);

// ホイール(前後で幅・直径の異なるステアード仕様。19x9.5J+265/35R19(前) / 20x11J+305/30R20(後))
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.85, roughness: 0.2 });
const spokeMat = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8, roughness: 0.25 });

function buildWheel(radius, width, rimRadius) {
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
  wheelGroup.add(caliper);
  return wheelGroup;
}

const frontWheelRadius = 0.33, frontWheelWidth = 0.27;
const rearWheelRadius = 0.345, rearWheelWidth = 0.32;
const wheelSpecs = [
  { x: -halfTrackFront, z: halfWheelbase, radius: frontWheelRadius, width: frontWheelWidth },
  { x: halfTrackFront, z: halfWheelbase, radius: frontWheelRadius, width: frontWheelWidth },
  { x: -halfTrackRear, z: -halfWheelbase, radius: rearWheelRadius, width: rearWheelWidth },
  { x: halfTrackRear, z: -halfWheelbase, radius: rearWheelRadius, width: rearWheelWidth }
];
wheelSpecs.forEach((spec) => {
  const wheelGroup = buildWheel(spec.radius, spec.width, spec.radius * 0.62);
  wheelGroup.position.set(spec.x, spec.radius, spec.z);
  car.add(wheelGroup);
});

// サイドスカート
[-1.0, 1.0].forEach((x) => {
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, carLength - 1.6), trimMat);
  skirt.position.set(x, groundClearance + 0.16, 0);
  car.add(skirt);
});

// 接地感を出すコンタクトシャドウ
const shadowGeo = new THREE.CircleGeometry(2.6, 24);
shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false });
const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
contactShadow.position.y = 0.015;
car.add(contactShadow);

// ==========================================================
// 車内(一人称視点用。2シーターなので座席は前列のみ)
// ==========================================================
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.7 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.75 });

// ダッシュボード
const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.22), interiorMat);
dashboard.position.set(-0.1, groundClearance + 0.66, 0.65);
interiorGroup.add(dashboard);

// ハンドル(低くスポーティな位置。センターにシンプルな丸バッジ)
const gripMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 });
const badgeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.7, roughness: 0.25 });

const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 12, 24), gripMat);
const steeringWheel = new THREE.Group();
steeringWheel.add(wheelRing);
const centerBadge = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), badgeMat);
centerBadge.position.z = 0.015;
steeringWheel.add(centerBadge);
steeringWheel.position.set(-0.32, groundClearance + 0.72, 0.42);
steeringWheel.rotation.x = -0.35;
interiorGroup.add(steeringWheel);

// シフトパドル風の小さなレバー(左右。DCTなのでパドルシフトのイメージ)
[-1, 1].forEach((sign) => {
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.09), badgeMat);
  paddle.position.set(sign * 0.16, groundClearance + 0.7, 0.5);
  interiorGroup.add(paddle);
});

// 座席(運転席・助手席のみ。低いバケットシート風)
function createSeat(x) {
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.09), seatMat);
  seatBack.position.set(x, groundClearance + 0.62, -0.15);
  seatBack.rotation.x = -0.15;
  interiorGroup.add(seatBack);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), seatMat);
  headrest.position.set(x, groundClearance + 0.92, -0.1);
  headrest.rotation.x = -0.15;
  interiorGroup.add(headrest);

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.45), seatMat);
  seatBase.position.set(x, groundClearance + 0.4, 0.05);
  interiorGroup.add(seatBase);
}
createSeat(-0.32);
createSeat(0.32);

// ペダル
const pedalMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.4, roughness: 0.5 });
const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.2), pedalMat);
brakePedal.position.set(-0.38, groundClearance + 0.22, 0.42);
brakePedal.rotation.x = -0.5;
interiorGroup.add(brakePedal);

const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.18), pedalMat);
accelPedal.position.set(-0.25, groundClearance + 0.22, 0.4);
accelPedal.rotation.x = -0.35;
interiorGroup.add(accelPedal);

// フロアパネル
const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.0), interiorMat);
floorPanel.position.set(-0.32, groundClearance + 0.16, 0.15);
interiorGroup.add(floorPanel);

// 一人称視点のカメラ位置の基準(低く座るミッドシップらしい着座姿勢)
const firstPersonOffset = new THREE.Vector3(-0.32, groundClearance + 0.92, -0.05);

// バックミラー(ルームミラー+サイドミラー2枚)
const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);

const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), trimMat);
mirrorFrame.position.set(0, groundClearance + 1.05, 0.85);
interiorGroup.add(mirrorFrame);

mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
mirrorRenderTarget.texture.repeat.x = -1;
mirrorRenderTarget.texture.offset.x = 1;
const mirrorScreenMat = new THREE.MeshBasicMaterial({ map: mirrorRenderTarget.texture });
const mirrorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), mirrorScreenMat);
mirrorScreen.position.set(0, groundClearance + 1.05, 0.84);
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

// サイドミラー(左右)
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
  screen.position.set(sign * 1.0, groundClearance + 0.7, 0.8);
  screen.lookAt(-0.32, groundClearance + 0.92, -0.05);
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
    // 物理・当たり判定で使う、この車のサイズに合わせた数値
    // (前後トレッドが微妙に異なるが、物理計算は左右対称の1つの値のみ扱うため平均値を使う)
    halfTrack: (halfTrackFront + halfTrackRear) / 2,
    halfWheelbase: halfWheelbase,
    wheelRadius: (frontWheelRadius + rearWheelRadius) / 2,
    collisionRadius: 1.9 // 全幅1,980mmに合わせ、やや大きめの当たり判定にする
  };
}

window.CAR_MODELS = window.CAR_MODELS || {};
window.CAR_MODELS.kazeR01 = {
  label: 'KAZE R-01',
  defaultColor: 0xaab0b6, // KAZE Silver
  build: buildKazeR01
};
