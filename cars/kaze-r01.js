// ==========================================================
// 車モデル: KAZE R-01
// Meshy AIで生成した .glb モデルを読み込んで使う方式に変更。
// (これまでのコードで組み立てる方式から切り替え)
//
// 【必要な準備】
// このファイルと同じリポジトリの models/ フォルダに
// kaze-r01.glb という名前でモデルを置いてください。
//   racing-game/
//   ├── index.html
//   ├── cars/kaze-r01.js  (このファイル)
//   └── models/kaze-r01.glb
//
// 【向きがおかしい場合】
// 車が横向き・後ろ向きに走って見えるときは、下の YAW_CORRECTION の
// 数値を Math.PI(180度) や Math.PI / 2(90度) に変えてください。
//
// 【互換性】
// window.CAR_MODELS.kazeR01 への登録方法、build() が返す値の形
// (group / paintMat / interiorGroup / steeringWheel / firstPersonOffset /
//  mirrorRenderTarget / mirrorCamera / updateMirrorCamera /
//  sideMirrorRTs / sideMirrorCams / updateSideMirrorCameras /
//  halfTrack / halfWheelbase / wheelRadius / collisionRadius)は
// これまでと同じにしてあるので、index.html 側の変更は不要です。
// ==========================================================

function buildKazeR01(paintColorHex) {
  const car = new THREE.Group();

  // モデルの向きを直したいときに書き換える角度(ラジアン)
  const YAW_CORRECTION = Math.PI / 2; // 横向きだったため90度回転して前向きにする

  // 実車寸法に合わせる目標値(1 Three.js unit = 1 メートル)
  const TARGET_LENGTH = 4.52;
  const groundClearance = 0.145;

  // 内装は.glb側でうまく生成できなかったため、手書きの簡易内装を用意する。
  // 外装(Meshyのモデル)とは別に、キャビンの位置に重ねて配置する。
  // 外装(model)にはYAW_CORRECTIONで向き補正をかけているので、内装も
  // 同じだけ回転させないと、外装と内装の向きがズレて「横向き」に見えてしまう。
  const interiorGroup = new THREE.Group();
  interiorGroup.rotation.y = YAW_CORRECTION;
  car.add(interiorGroup);

  const paintColor = paintColorHex !== undefined ? paintColorHex : 0x6d7175;
  const paintMat = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.55, roughness: 0.27 });

  // 物理・当たり判定で使う数値(これまでと同じ実車寸法ベース)
  const halfTrackFront = 0.845;
  const halfTrackRear = 0.835;
  const halfTrack = (halfTrackFront + halfTrackRear) / 2;
  const halfWheelbase = 1.36;
  const wheelRadius = (0.334 + 0.346) / 2;
  const collisionRadius = 1.9;

  const bPillarZ = -0.60;
  const cabinFrontZ = 0.50;
  const floorHeight = groundClearance + 0.145;
  // 実際にゲーム内の視点調整モードで確認していただいた、ちょうど良い位置
  const firstPersonOffset = new THREE.Vector3(-0.235, 0.751, 0.096);

  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.70 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.72 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.82 });
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.70, roughness: 0.25 });
  const pedalMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.4, roughness: 0.5 });

  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.17, 0.22), interiorMat);
  dashboard.position.set(-0.10, floorHeight + 0.50, cabinFrontZ - 0.30);
  interiorGroup.add(dashboard);

  // ハンドル(ゲーム側のステアリング角度に合わせて回転させるので、独立したGroupにする)
  const steeringWheel = new THREE.Group();
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.021, 12, 24), gripMat);
  steeringWheel.add(wheelRing);
  const centerBadge = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), badgeMat);
  centerBadge.position.z = 0.015;
  steeringWheel.add(centerBadge);
  steeringWheel.position.set(-0.32, floorHeight + 0.56, cabinFrontZ - 0.05);
  steeringWheel.rotation.x = -0.35;
  interiorGroup.add(steeringWheel);

  [-1, 1].forEach((sign) => {
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.02, 0.09), badgeMat);
    paddle.position.set(sign * 0.16, floorHeight + 0.54, cabinFrontZ + 0.03);
    interiorGroup.add(paddle);
  });

  function createSeat(x) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.09), seatMat);
    back.position.set(x, floorHeight + 0.46, bPillarZ + 0.35);
    back.rotation.x = -0.15;
    interiorGroup.add(back);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.16, 0.10), seatMat);
    head.position.set(x, floorHeight + 0.76, bPillarZ + 0.40);
    head.rotation.x = -0.15;
    interiorGroup.add(head);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.45), seatMat);
    base.position.set(x, floorHeight + 0.24, bPillarZ + 0.55);
    interiorGroup.add(base);
  }
  createSeat(-0.32);
  createSeat(0.32);

  const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.20), pedalMat);
  brakePedal.position.set(-0.38, floorHeight + 0.06, cabinFrontZ - 0.05);
  brakePedal.rotation.x = -0.5;
  interiorGroup.add(brakePedal);

  const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.18), pedalMat);
  accelPedal.position.set(-0.25, floorHeight + 0.06, cabinFrontZ - 0.07);
  accelPedal.rotation.x = -0.35;
  interiorGroup.add(accelPedal);

  const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.04, 1.0), interiorMat);
  floorPanel.position.set(-0.32, floorHeight, bPillarZ + 0.30);
  interiorGroup.add(floorPanel);

  // ==========================================================
  // ミラー(.glb側にミラー専用パーツが無いので、これまでと同じ仕組みで用意する)
  // ==========================================================
  const mirrorRenderTarget = new THREE.WebGLRenderTarget(256, 128);
  const mirrorCamera = new THREE.PerspectiveCamera(45, 256 / 128, 0.3, 500);
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
  [-1, 1].forEach(() => {
    const rt = new THREE.WebGLRenderTarget(160, 100);
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.repeat.x = -1;
    rt.texture.offset.x = 1;
    const cam = new THREE.PerspectiveCamera(45, 160 / 100, 0.3, 500);
    sideMirrorRTs.push(rt);
    sideMirrorCams.push(cam);
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

  // ==========================================================
  // .glbモデルの読み込み(非同期)
  // ==========================================================
  // 読み込みには少し時間がかかるため、carグループは先に空の状態で返し、
  // 読み込みが終わったらモデルをその中に追加する(ゲーム側の他の処理は
  // 空のグループのまま先に進められるので、特に変更は不要)
  if (typeof THREE.GLTFLoader !== 'function') {
    console.error('THREE.GLTFLoaderが読み込まれていません。index.htmlのscriptタグを確認してください。');
  } else {
    const loader = new THREE.GLTFLoader();
    if (typeof THREE.DRACOLoader === 'function') {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
      loader.setDRACOLoader(dracoLoader);
    }
    loader.load(
      'models/kaze-r01.glb',
      (gltf) => {
        const model = gltf.scene;
        model.rotation.y = YAW_CORRECTION;

        // モデルの元の単位・大きさが不明でも、全長がTARGET_LENGTHになるように
        // 自動で拡大縮小する(水平方向で一番長い辺を「全長」とみなす)
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const horizontalLength = Math.max(size.x, size.z);
        if (horizontalLength > 0) {
          const scale = TARGET_LENGTH / horizontalLength;
          model.scale.setScalar(scale);
        }

        // 中心をX/Z原点に、底面が地面(groundClearance付近)に接するように移動する
        const box2 = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box2.getCenter(center);
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box2.min.y;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // 車体(ボディ)らしいマテリアルを判定して塗装色を反映する。
            // マテリアル名に手がかりがあればそれを優先し、無ければ
            // 「暗すぎない色」を車体とみなす(タイヤ・ガラス・内装は暗い色が多いため)。
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (!mat || !mat.color) return;
              const name = (mat.name || '').toLowerCase();
              const looksLikeBody = /body|paint|car|main|exterior|shell/.test(name);
              const looksLikeExcluded = /glass|window|tire|tyre|wheel|rim|light|lamp|black|chrome/.test(name);
              const hsl = { h: 0, s: 0, l: 0 };
              mat.color.getHSL(hsl);
              const isLightEnough = hsl.l > 0.35; // 暗すぎる(タイヤ等)は除外
              if (looksLikeBody || (!looksLikeExcluded && isLightEnough)) {
                mat.color.set(paintColor);
                mat.needsUpdate = true;
              }
            });
          }
        });

        car.add(model);
        console.log('KAZE R-01(models/kaze-r01.glb)の読み込みに成功しました。');
      },
      undefined,
      (error) => {
        console.error('KAZE R-01(models/kaze-r01.glb)の読み込みに失敗しました。ファイルの場所とファイル名を確認してください。', error);
      }
    );
  }

  // 接地感を出すコンタクトシャドウ
  const shadowGeo = new THREE.CircleGeometry(2.55, 32);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.018;
  car.add(contactShadow);

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
    halfTrack,
    halfWheelbase,
    wheelRadius,
    collisionRadius
  };
}

window.CAR_MODELS = window.CAR_MODELS || {};
window.CAR_MODELS.kazeR01 = {
  label: 'KAZE R-01',
  defaultColor: 0x6d7175, // 参考画像のガンメタリック系グレー
  build: buildKazeR01
};
