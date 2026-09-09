// ==========================================================
// 車モデル: オリジナルデザインのスポーツクーペ風シルエット
// 白ボディ + 黒ルーフ + 黒ホイールの、実在車種を模さないオリジナル形状
//
// このファイル単体で1台分の車を組み立てる。index.html側から
// buildSportsCar(paintColorHex) を呼び出すと、車のGroupと、
// 物理・カメラ・ミラーで使う各種パーツの参照をまとめて返す。
// ==========================================================
function buildSportsCar(paintColorHex) {
const car = new THREE.Group();

// 内装専用グループ(ダッシュボード・ハンドル・シートなど)
// 三人称視点では非表示にし、外から見た時に変な見た目にならないようにする
const interiorGroup = new THREE.Group();
car.add(interiorGroup);

const paintMat = new THREE.MeshStandardMaterial({ color: paintColorHex !== undefined ? paintColorHex : 0xf5f5f5, metalness: 0.5, roughness: 0.25 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.6, roughness: 0.3 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2226, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.45 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.3, roughness: 0.5 });
const lightMatFront = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 1.1 });
const lightMatRear = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0xff2222, emissiveIntensity: 1.0 });
const calipeMat = new THREE.MeshStandardMaterial({ color: 0xcc1111 });

// 角を面取り(チャンファー)したボックス形状を作るヘルパー
// 断面(幅×高さ)の四隅を斜めにカットした形をZ方向(車の前後方向)に押し出す。
// 直角の箱よりもカクカクした印象を抑えられる。
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

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
    curveSegments: 1
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// 車体を「シャシー・ボンネット・キャビン・ガラス」に分けて
// 隙間なく積み重ねる方式にすることで、形の崩れを防ぐ
// 実在車種を模さない範囲で、より自然な全長・全幅バランスに調整
const carLength = 4.6;
const halfLen = carLength / 2;

// 車高を少しだけ上げるためのリフト量(タイヤの大きさ・位置はそのまま)
const bodyLift = 0.12;

// シャシー(車体下部、全長にわたる低いブロック。角は面取り済み)
// タイヤが少しだけ覗く、実車に近い自然な幅にしてある
const chassis = new THREE.Mesh(createChamferedBox(2.2, 0.5, carLength, 0.12), paintMat);
chassis.position.set(0, 0.35 + bodyLift, 0);
chassis.castShadow = true;
car.add(chassis);

// 側面パネル(シャシー上端とボンネット/窓下端の間を埋める。
// これがないと車体側面(特に前輪上のフェンダー部分)に穴が空いて背景が透けて見える)
[-1, 1].forEach((sign) => {
  const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, carLength - 0.3), paintMat);
  sidePanel.position.set(sign * 1.05, 0.72 + bodyLift, 0);
  sidePanel.castShadow = true;
  car.add(sidePanel);
});

// ボンネット(前方、少し低め。角は面取り済み。シャシーに少し食い込ませて継ぎ目を隠す)
const hood = new THREE.Mesh(createChamferedBox(1.9, 0.36, 1.3, 0.08), paintMat);
hood.position.set(0, 0.68 + bodyLift, halfLen - 0.65);
hood.castShadow = true;
car.add(hood);

// キャビン(屋根)
// 天井は薄いパネルだけにして、車内(頭上)に実際の空間を確保する
// (以前は分厚い箱で頭上まで塗りつぶしてしまい、一人称視点のカメラが埋まる原因になっていた)
const cabinTop = new THREE.Mesh(createChamferedBox(1.65, 0.12, 2.7, 0.06), roofMat);
cabinTop.position.set(0, 1.75 + bodyLift, -0.3);
cabinTop.castShadow = true;
car.add(cabinTop);

// 側面窓(左右2枚。薄い板状にして、車内から見た時に分厚く見えないようにする。屋根まで届く高さ)
[-0.83, 0.83].forEach((x) => {
  const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 2.7), glassMat);
  sideWindow.position.set(x, 1.33 + bodyLift, -0.3);
  car.add(sideWindow);
});

// フロントガラス(ボンネットとキャビンをつなぐ傾斜ガラス。屋根まで届く高さ)
const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.2, 0.05), glassMat);
windshield.position.set(0, 1.3 + bodyLift, 1.0);
windshield.rotation.x = -0.45;
car.add(windshield);

// Aピラー(フロントガラスの側辺に沿わせた柱。屋根まで届く高さ)
[-0.82, 0.82].forEach((x) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.1), roofMat);
  pillar.position.set(x, 1.3 + bodyLift, 1.0);
  pillar.rotation.x = -0.45;
  car.add(pillar);
});

// ドアの内張り(内側パネル+アームレスト+取っ手。車内から見てドアだと分かるようにする)
[-1, 1].forEach((sign) => {
  const doorTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 1.2), trimMat);
  doorTrim.position.set(sign * 0.72, 0.86 + bodyLift, -0.1);
  interiorGroup.add(doorTrim);

  const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.5), roofMat);
  armrest.position.set(sign * 0.74, 1.02 + bodyLift, -0.1);
  interiorGroup.add(armrest);

  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.18), trimMat);
  doorHandle.position.set(sign * 0.72, 0.95 + bodyLift, 0.25);
  interiorGroup.add(doorHandle);
});

// リアガラス(テールゲート、ほぼ垂直に近い角度)
const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.9, 0.5), glassMat);
rearWindow.position.set(0, 1.3 + bodyLift, -1.75);
rearWindow.rotation.x = 0.2;
car.add(rearWindow);

// リアパネル(テールゲートの下・バンパーの上を埋める車体パネル。
// このパネルが無いと車体に穴が空いて背景が透けて見え、テールライトも浮いて見えてしまう)
const rearPanel = new THREE.Mesh(createChamferedBox(1.9, 0.5, 0.6, 0.1), paintMat);
rearPanel.position.set(0, 0.82 + bodyLift, -1.95);
rearPanel.castShadow = true;
car.add(rearPanel);

// フロント・リアバンパーのトリム
const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.35, 0.25), trimMat);
frontBumper.position.set(0, 0.35 + bodyLift, halfLen - 0.1);
car.add(frontBumper);

const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.32, 0.25), trimMat);
rearBumper.position.set(0, 0.35 + bodyLift, -(halfLen - 0.1));
car.add(rearBumper);

// サイドミラー
[-1.1, 1.1].forEach((x) => {
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.3), roofMat);
  mirror.position.set(x, 1.05 + bodyLift, 1.0);
  car.add(mirror);
});

// ヘッドライト(黒い縁取り+発光部分。ボンネット幅の内側に収める)
[-0.6, 0.6].forEach((x) => {
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.08), trimMat);
  housing.position.set(x, 0.72 + bodyLift, halfLen - 0.02);
  car.add(housing);

  const light = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.1), lightMatFront);
  light.position.set(x, 0.72 + bodyLift, halfLen - 0.02);
  car.add(light);
});

// テールライト(黒い縁取り+発光部分。リアパネル幅の内側に収める)
[-0.66, 0.66].forEach((x) => {
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.06), trimMat);
  housing.position.set(x, 0.85 + bodyLift, -(halfLen - 0.02));
  car.add(housing);

  const light = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.22, 0.08), lightMatRear);
  light.position.set(x, 0.85 + bodyLift, -(halfLen - 0.02));
  car.add(light);
});

// ホイール(黒リム + 赤いブレーキキャリパー、ホイールベースも車体に合わせて調整)
const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.32, 20);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });
const rimGeo = new THREE.TorusGeometry(0.28, 0.06, 8, 16);
const caliperGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.1, 12);

// ホイールを車体幅(シャシー半幅1.1)よりわずかに外側に出し、タイヤが少し覗く自然な見た目にする
const wheelPositions = [
  [-1.05, 0.46, 1.55], [1.05, 0.46, 1.55],
  [-1.05, 0.46, -1.55], [1.05, 0.46, -1.55]
];
wheelPositions.forEach(([x, y, z]) => {
  const wheelGroup = new THREE.Group();

  const tire = new THREE.Mesh(wheelGeo, wheelMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 }));
  rim.rotation.y = Math.PI / 2;
  wheelGroup.add(rim);

  // スポーク(放射状の細い板を5本)
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.75, roughness: 0.25 });
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.05), spokeMat);
    spoke.rotation.x = (i / 5) * Math.PI * 2;
    spoke.rotation.y = Math.PI / 2;
    wheelGroup.add(spoke);
  }

  const caliper = new THREE.Mesh(caliperGeo, calipeMat);
  caliper.rotation.z = Math.PI / 2;
  caliper.position.x = x > 0 ? -0.08 : 0.08;
  wheelGroup.add(caliper);

  wheelGroup.position.set(x, y, z);
  car.add(wheelGroup);
});

// サイドスカート(下部の黒トリム。地面に近い部分を引き締める)
[-1.11, 1.11].forEach((x) => {
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, carLength - 1.4), trimMat);
  skirt.position.set(x, 0.18 + bodyLift, 0);
  car.add(skirt);
});

// ショルダーライン(ドア中央あたりの陰影を作る帯。ボディと同色だがわずかに濃い)
const shoulderMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.5, roughness: 0.3 });
[-1.105, 1.105].forEach((x) => {
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, carLength - 1.6), shoulderMat);
  shoulder.position.set(x, 0.62 + bodyLift, -0.1);
  car.add(shoulder);
});

// リアスポイラー(テールゲート上端の小さなリップ)
const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.28), roofMat);
spoiler.position.set(0, 1.42 + bodyLift, -1.55);
spoiler.castShadow = true;
car.add(spoiler);

// フロントリップ(バンパー下端の張り出し)
const frontLip = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 0.18), trimMat);
frontLip.position.set(0, 0.16 + bodyLift, halfLen - 0.02);
car.add(frontLip);

// 接地感を出すためのコンタクトシャドウ(車体真下に淡い影の円盤)
const shadowGeo = new THREE.CircleGeometry(2.6, 24);
shadowGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
contactShadow.position.y = 0.02;
car.add(contactShadow);

// ==========================================================
// 車内(一人称視点用。ブランドを模さないシンプルなオリジナルデザイン)
// ==========================================================
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });

// ダッシュボード
const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.25), interiorMat);
dashboard.position.set(-0.15, 1.05 + bodyLift, 0.75);
interiorGroup.add(dashboard);


// ハンドル(レーシングホイール風。太めのグリップ+センターの丸いバッジ+ボタン。ロゴなしのオリジナルデザイン)
const gripMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.85 });
const wheelPlateMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.4 });
const badgeMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.7, roughness: 0.25 });
const buttonMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });

const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 12, 24), gripMat);
const steeringWheel = new THREE.Group();
steeringWheel.add(wheelRing);

// センターの丸いプレート+バッジ(ロゴなし)
// (中央の丸いプレートは削除。T字エンブレムのみ)

// センターのT字形エンブレム(丸いバッジの代わり)
// 端に向かって太くなる(先端が広がる)棒状の形状を作るヘルパー
// lengthは棒の長さ(ローカルY方向)、minThickは中央部の太さ、maxThickは端の太さ
function createFlaredBar(length, minThick, maxThick, depth) {
  const halfLen = length / 2;
  const narrowY = halfLen * 0.35; // 中央の細い部分の範囲

  const shape = new THREE.Shape();
  shape.moveTo(-maxThick / 2, -halfLen);
  shape.lineTo(-minThick / 2, -narrowY);
  shape.lineTo(-minThick / 2, narrowY);
  shape.lineTo(-maxThick / 2, halfLen);
  shape.lineTo(maxThick / 2, halfLen);
  shape.lineTo(minThick / 2, narrowY);
  shape.lineTo(minThick / 2, -narrowY);
  shape.lineTo(maxThick / 2, -halfLen);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// 縦棒(横棒から突き出ないよう短めにし、端に向かって太くなる)
const tBarVertical = new THREE.Mesh(createFlaredBar(0.16, 0.07, 0.12, 0.03), badgeMat);
tBarVertical.position.set(0, -0.09, 0.01);
steeringWheel.add(tBarVertical);

// 横棒(中央に配置。端に向かって太くなる)
const tBarHorizontal = new THREE.Mesh(createFlaredBar(0.34, 0.07, 0.12, 0.03), badgeMat);
tBarHorizontal.rotation.z = Math.PI / 2;
tBarHorizontal.position.set(0, 0, 0.01);
steeringWheel.add(tBarHorizontal);

// (3本スポークは削除。T字パーツのみ残す)

// (飾りボタンは削除)

steeringWheel.position.set(-0.35, 1.08 + bodyLift, 0.5);
steeringWheel.rotation.x = -0.3;
interiorGroup.add(steeringWheel);

// スティック式のシフター(ハンドルの右側、コンソール上に設置)
const shifterBaseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
const shifterKnobMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.3 });

const shifterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.04, 12), shifterBaseMat);
const shifterStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.16, 10), shifterBaseMat);
shifterStick.position.y = 0.1;
const shifterKnob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), shifterKnobMat);
shifterKnob.position.y = 0.18;

const gearShifter = new THREE.Group();
gearShifter.add(shifterBase);
gearShifter.add(shifterStick);
gearShifter.add(shifterKnob);
gearShifter.position.set(0.05, 0.82 + bodyLift, 0.55);
interiorGroup.add(gearShifter);

// 座席(背もたれ+座面+ヘッドレスト)を作る関数。運転席・助手席・後部座席2つで使い回す
function createSeat(x, z) {
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.1), seatMat);
  seatBack.position.set(x, 1.05 + bodyLift, z - 0.2);
  seatBack.rotation.x = -0.1;
  interiorGroup.add(seatBack);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.12), seatMat);
  headrest.position.set(x, 1.42 + bodyLift, z - 0.13);
  headrest.rotation.x = -0.1;
  interiorGroup.add(headrest);

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.5), seatMat);
  seatBase.position.set(x, 0.78 + bodyLift, z);
  interiorGroup.add(seatBase);
}

// 運転席・助手席(前列)
createSeat(-0.35, -0.35);
createSeat(0.35, -0.35);

// 後部座席2つ
createSeat(-0.35, -1.3);
createSeat(0.35, -1.3);

// ペダル(アクセル・ブレーキ。足元、ハンドルの下あたりに配置)
const pedalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });
const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.22), pedalMat);
brakePedal.position.set(-0.42, 0.62 + bodyLift, 0.5);
brakePedal.rotation.x = -0.5;
interiorGroup.add(brakePedal);

const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.2), pedalMat);
accelPedal.position.set(-0.28, 0.62 + bodyLift, 0.48);
accelPedal.rotation.x = -0.35;
interiorGroup.add(accelPedal);

// フロアパネル(足元。無いと床が透けて見えるため追加)
const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 1.3), interiorMat);
floorPanel.position.set(-0.35, 0.5 + bodyLift, 0.2);
interiorGroup.add(floorPanel);

// 一人称視点のカメラ位置の基準(運転席に座った目線あたり)
const firstPersonOffset = new THREE.Vector3(-0.35, 1.32 + bodyLift, -0.05);

// バックミラー(ルームミラー+サイドミラー2枚。実際に後方の映像を描画して映す)
const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);

const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.02), trimMat);
mirrorFrame.position.set(0, 1.5 + bodyLift, 0.95);
interiorGroup.add(mirrorFrame);

mirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
mirrorRenderTarget.texture.repeat.x = -1;
mirrorRenderTarget.texture.offset.x = 1;
const mirrorScreenMat = new THREE.MeshBasicMaterial({ map: mirrorRenderTarget.texture });
const mirrorScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), mirrorScreenMat);
mirrorScreen.position.set(0, 1.5 + bodyLift, 0.94);
mirrorScreen.rotation.y = Math.PI; // 車の後方(-z)を向くように反転
interiorGroup.add(mirrorScreen);

function updateMirrorCamera() {
  const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
  mirrorCamera.position.copy(car.position).add(worldOffset);
  mirrorCamera.position.y += 0.15;

  const backYaw = car.rotation.y + Math.PI; // 車の後ろ向き
  const dir = new THREE.Vector3(Math.sin(backYaw), 0, Math.cos(backYaw));
  mirrorCamera.up.set(0, 1, 0);
  mirrorCamera.lookAt(mirrorCamera.position.clone().add(dir));
}

// サイドミラー(左右。斜め後方を映す簡易版)
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
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.11), screenMat);
  screen.position.set(sign * 0.92, 1.05 + bodyLift, 0.92);
  // 運転席のだいたいの位置を向かせ、正面(+Z面)がそちらを向くよう180度反転
  screen.lookAt(-0.35, 1.32 + bodyLift, -0.05);
  screen.rotation.y += Math.PI;
  interiorGroup.add(screen);
});

function updateSideMirrorCameras() {
  [-1, 1].forEach((sign, idx) => {
    const cam = sideMirrorCams[idx];
    const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
    cam.position.copy(car.position).add(worldOffset);
    cam.position.y += 0.1;

    // やや斜め後方(ドア側)を向く
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
    halfTrack: 1.05,
    halfWheelbase: 1.55,
    wheelRadius: 0.46,
    collisionRadius: 1.7
  };
}

window.CAR_MODELS = window.CAR_MODELS || {};
window.CAR_MODELS.sports = {
  label: 'スポーツカー',
  defaultColor: 0xf5f5f5,
  build: buildSportsCar
};
