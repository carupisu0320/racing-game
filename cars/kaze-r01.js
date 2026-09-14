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

  // 内装は.glbに含まれていないので、ゲーム側が参照するダミーの
  // グループ・マテリアルを用意しておく(無いとエラーになるため)
  const interiorGroup = new THREE.Group();
  car.add(interiorGroup);
  const steeringWheel = new THREE.Group();
  interiorGroup.add(steeringWheel);

  // 外装(.glbの本体)だけを後から表示/非表示できるように、参照用の
  // オブジェクトを用意しておく。.glbはこの関数の戻り値を返した後、
  // 非同期で読み込みが終わってから中身(model)が入るため、
  // プリミティブな値ではなく「入れ物」ごと返すことで、後から
  // 中身が更新されても参照側(index.html)が最新の状態を見られるようにする。
  const exteriorModelRef = { model: null };

  const paintColor = paintColorHex !== undefined ? paintColorHex : 0xaab0b6;
  const paintMat = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.55, roughness: 0.27 });

  // 物理・当たり判定で使う数値(これまでと同じ実車寸法ベース)
  const halfTrackFront = 0.845;
  const halfTrackRear = 0.835;
  const halfTrack = (halfTrackFront + halfTrackRear) / 2;
  const halfWheelbase = 1.36;
  const wheelRadius = (0.334 + 0.346) / 2;
  const collisionRadius = 1.9;

  const bPillarZ = -0.60;
  const firstPersonOffset = new THREE.Vector3(-0.32, groundClearance + 0.145 + 0.76, bPillarZ + 0.50);

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
        model.updateMatrixWorld(true);

        // 一人称視点の目の位置。自動推定(レイキャストで中央値の高さを探す方式)は
        // このモデルではうまく機能せず、フロントトランク付近に着地してしまったため、
        // 分かりやすい手動調整の数値に切り替えた。
        // ここの3つの値だけを見ながら、実際の見え方に合わせて調整してください。
        //   EYE_X: 左右位置(0=中央)
        //   EYE_Y: 地面からの高さ(m、実車の目線として自然な値から開始)
        //   EYE_Z: 前後位置(0=バウンディングボックスの中心。＋方向がノーズ側か
        //          テール側かは実際に試すまで分からないため、ズレていたら符号を
        //          反転するか、値を大きく/小さくして探ってください)
        const EYE_X = -0.243;
        const EYE_Y = 0.726;
        const EYE_Z = 0.626; // 視点調整モードで確認いただいたちょうど良い位置

        firstPersonOffset.set(EYE_X, EYE_Y, EYE_Z);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // 塗装色の上書きはしない: 今回のモデルはボディ・ガラス・タイヤの
            // 色分けがテクスチャに焼き込まれているため、ここで色を上書きすると
            // 全体が一色に塗り潰されて、その色分けが台無しになってしまう。
            // (このモデルでは「プレイヤーが塗装色を選べる」機能は使えない)
          }
        });

        car.add(model);
        exteriorModelRef.model = model;
        console.log('KAZE R-01(models/kaze-r01.glb)の読み込みに成功しました。');

        // ==========================================================
        // 内装(ハンドル+ダッシュボード、Meshyで別途生成したもの)を読み込む。
        // 【重要】内装の位置は、視点(EYE_X/Y/Z)とは切り離して、車体側に
        // 固定の位置(CABIN_Y / CABIN_Z)を使う。視点だけを動かしても
        // ダッシュボードやハンドルがズレて動いてしまわないようにするため。
        // ズレていたら CABIN_Y / CABIN_Z を直接、微調整してください。
        // ==========================================================
        const INTERIOR_TARGET_WIDTH = 1.25; // ダッシュボードの目標横幅(m)
        const CABIN_X = -0.285; // 内装・ハンドル共通の左右位置(指定いただいた座標)
        const CABIN_Y = 0.660; // 内装・ハンドル共通の高さ(指定いただいた座標)
        const CABIN_Z = 1.302; // 内装・ハンドル共通の前後位置(指定いただいた座標)

        loader.load(
          'models/kaze-r01-interior.glb',
          (interiorGltf) => {
            const interior = interiorGltf.scene;

            const iBox = new THREE.Box3().setFromObject(interior);
            const iSize = new THREE.Vector3();
            iBox.getSize(iSize);
            if (iSize.x > 0) {
              interior.scale.setScalar(INTERIOR_TARGET_WIDTH / iSize.x);
            }

            const iBox2 = new THREE.Box3().setFromObject(interior);
            const iCenter = new THREE.Vector3();
            iBox2.getCenter(iCenter);
            interior.position.x -= iCenter.x;
            interior.position.y -= iCenter.y;
            interior.position.z -= iCenter.z;

            // ここまでで内装モデルの中心が原点(0,0,0)に来ているので、
            // あとは車体側の固定位置(CABIN_Y / CABIN_Z)へオフセットするだけでよい。
            interior.position.x = CABIN_X;
            interior.position.y = CABIN_Y;
            interior.position.z = CABIN_Z;

            // 内装は外装とは別のAI生成なので、外装用のYAW_CORRECTIONを
            // そのまま使い回すのではなく、内装専用の角度を用意した。
            // 横向きになる場合は、この値を Math.PI / 2 や -Math.PI / 2、
            // Math.PI(180度)などに変えて試してください。
            const INTERIOR_YAW_CORRECTION = 0;
            interior.rotation.y = INTERIOR_YAW_CORRECTION;

            interior.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            // 今回のモデルはシート+ダッシュボードのみ(ハンドル無し)。
            // 回転させる必要が無いので、そのままinteriorGroupに追加する。
            interiorGroup.add(interior);
            console.log('内装(シート+ダッシュボード)の読み込みに成功しました。');

            // ==========================================================
            // ロールケージ風フレーム(フロントガラスの枠・屋根・サイド)を
            // 単純な図形で自作する。AIでの生成が何度も車全体になって
            // しまったため、ここは確実に位置を制御できる方法にした。
            // ==========================================================
            const cageMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, metalness: 0.6, roughness: 0.4 });
            const barRadius = 0.025;

            const cageHalfWidth = 0.68;
            const floorY = CABIN_Y - 0.30; // 内装の足元あたり
            const roofY = CABIN_Y + 0.28;
            const windshieldZ = CABIN_Z + 0.35;
            const rearZ = CABIN_Z - 0.55 - 0.55;

            function addBar(x1, y1, z1, x2, y2, z2) {
              const a = new THREE.Vector3(x1, y1, z1);
              const b = new THREE.Vector3(x2, y2, z2);
              const len = a.distanceTo(b);
              const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(barRadius, barRadius, len, 8),
                cageMat
              );
              bar.position.copy(a).add(b).multiplyScalar(0.5);
              bar.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                b.clone().sub(a).normalize()
              );
              bar.castShadow = true;
              interiorGroup.add(bar);
            }

            // フロントガラスの枠(縦2本+上1本)
            // ※ご要望により、屋根・枠の表示は一旦オフにしています。
            //   再度表示したくなったら、下のコメントを外してください。
            // addBar(-cageHalfWidth, floorY + 0.55, windshieldZ, -cageHalfWidth, roofY, windshieldZ);
            // addBar(cageHalfWidth, floorY + 0.55, windshieldZ, cageHalfWidth, roofY, windshieldZ);
            // addBar(-cageHalfWidth, roofY, windshieldZ, cageHalfWidth, roofY, windshieldZ);

            // 屋根(前後を繋ぐ2本+リア側の横棒)
            // addBar(-cageHalfWidth, roofY, windshieldZ, -cageHalfWidth, roofY, rearZ);
            // addBar(cageHalfWidth, roofY, windshieldZ, cageHalfWidth, roofY, rearZ);
            // addBar(-cageHalfWidth, roofY, rearZ, cageHalfWidth, roofY, rearZ);

            // サイド(ドア枠、左右それぞれ縦1本)
            // addBar(-cageHalfWidth, floorY + 0.50, rearZ, -cageHalfWidth, roofY, rearZ);
            // addBar(cageHalfWidth, floorY + 0.50, rearZ, cageHalfWidth, roofY, rearZ);

            // ==========================================================
            // ハンドルも単純な図形で自作する。steeringWheelグループに
            // 入れるので、既存のステアリング操作の回転アニメーションが
            // そのまま効く。
            // ==========================================================
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
            const hubMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.4 });

            const wheelRing = new THREE.Mesh(
              new THREE.TorusGeometry(0.16, 0.018, 10, 24),
              wheelMat
            );
            steeringWheel.add(wheelRing);

            const wheelHub = new THREE.Mesh(
              new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12),
              hubMat
            );
            wheelHub.rotation.x = Math.PI / 2;
            steeringWheel.add(wheelHub);

            [0, 1, 2].forEach((i) => {
              const angle = (i / 3) * Math.PI * 2;
              const spoke = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.13, 0.015),
                wheelMat
              );
              spoke.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, 0);
              spoke.rotation.z = angle + Math.PI / 2;
              steeringWheel.add(spoke);
            });

            steeringWheel.rotation.x = -0.35; // ハンドルらしく少し傾ける
            steeringWheel.position.set(
              CABIN_X,
              CABIN_Y,
              CABIN_Z
            );
          },
          undefined,
          (interiorError) => {
            console.warn('内装(models/kaze-r01-interior.glb)が見つからないか読み込みに失敗しました。内装なしで続行します。', interiorError);
          }
        );
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
    exteriorModelRef,
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
  defaultColor: 0xaab0b6,
  build: buildKazeR01
};
