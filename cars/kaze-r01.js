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

  // 一人称視点のときに外装(Meshyのモデル)を非表示にするための参照
  let exteriorModel = null;

  function updateMirrorCamera() {
    const worldOffset = firstPersonOffset.clone().applyQuaternion(car.quaternion);
    mirrorCamera.position.copy(car.position).add(worldOffset);
    mirrorCamera.position.y += 0.15;

    const backYaw = car.rotation.y + Math.PI;
    const dir = new THREE.Vector3(Math.sin(backYaw), 0, Math.cos(backYaw));
    mirrorCamera.up.set(0, 1, 0);
    mirrorCamera.lookAt(mirrorCamera.position.clone().add(dir));

    // 一人称視点のときは外装(車体)を非表示にする(内側から見た自分の車体で
    // 視界が塞がれてしまうため)。反対に三人称のときは内装を非表示にする。
    // (index.html側で「interiorGroup.visible = true」を毎回セットしているが、
    //  ここで毎フレーム上書きすることでKAZEだけこの挙動にできる)
    const isFirstPerson = (window.cameraMode === 'firstPerson');
    if (exteriorModel) {
      exteriorModel.visible = !isFirstPerson;
    }
    interiorGroup.visible = isFirstPerson;
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
        const EYE_X = -0.35;
        const EYE_Y = 1.44;
        const EYE_Z = -0.05; // sports-car.jsの内装に合わせた視点位置(I/J/K/L/U/Oで微調整できます)

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
        exteriorModel = model;
        exteriorModelRef.model = model;
        console.log('KAZE R-01(models/kaze-r01.glb)の読み込みに成功しました。');

        // ==========================================================
        // 内装は、sports-car.jsと全く同じ手書きのものを使う
        // (AI生成の内装モデルは使わないことになったため)。
        // KAZEは2ドア・2シーターなので、シートは前列2つだけにしている。
        // ==========================================================
        const bodyLift = 0.12; // sports-car.jsの数値に合わせるための下駄

        const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });

        const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.25), interiorMat);
        dashboard.position.set(-0.15, 1.05 + bodyLift, 0.75);
        interiorGroup.add(dashboard);

        // ハンドル(太めのグリップ+センターのT字バッジ)
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.85 });
        const wheelPlateMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });
        const badgeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.7, roughness: 0.25 });

        const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 12, 24), gripMat);
        steeringWheel.add(wheelRing);

        const wheelPlate = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), wheelPlateMat);
        wheelPlate.position.z = 0.012;
        steeringWheel.add(wheelPlate);

        function createFlaredBar(length, width, thickness) {
          const shape = new THREE.Shape();
          const hw = width / 2;
          shape.moveTo(-thickness / 2, -length / 2);
          shape.lineTo(thickness / 2, -length / 2);
          shape.lineTo(thickness / 2, length / 2 - hw);
          shape.lineTo(hw, length / 2);
          shape.lineTo(-hw, length / 2);
          shape.lineTo(-thickness / 2, length / 2 - hw);
          shape.closePath();
          return new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false });
        }

        const tBarVertical = new THREE.Mesh(createFlaredBar(0.16, 0.05, 0.018), badgeMat);
        tBarVertical.position.set(0, -0.03, 0.008);
        tBarVertical.rotation.z = Math.PI;
        steeringWheel.add(tBarVertical);

        const tBarHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.012), badgeMat);
        tBarHorizontal.position.set(0, 0.03, 0.008);
        steeringWheel.add(tBarHorizontal);

        steeringWheel.position.set(-0.35, 1.08 + bodyLift, 0.5);
        steeringWheel.rotation.x = -0.3;

        // シフトレバー
        const shifterBaseMat = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.6 });
        const shifterKnobMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        const gearShifter = new THREE.Group();
        const shifterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 12), shifterBaseMat);
        gearShifter.add(shifterBase);
        const shifterStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), shifterBaseMat);
        shifterStick.position.y = 0.1;
        gearShifter.add(shifterStick);
        const shifterKnob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), shifterKnobMat);
        shifterKnob.position.y = 0.19;
        gearShifter.add(shifterKnob);
        gearShifter.position.set(0.05, 0.82 + bodyLift, 0.55);
        interiorGroup.add(gearShifter);

        // 座席(2ドア・2シーターなので前列のみ)
        function createSeat(x, z) {
          const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.09), seatMat);
          seatBack.position.set(x, 1.05 + bodyLift, z - 0.2);
          seatBack.rotation.x = -0.12;
          interiorGroup.add(seatBack);

          const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), seatMat);
          headrest.position.set(x, 1.42 + bodyLift, z - 0.15);
          interiorGroup.add(headrest);

          const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.45), seatMat);
          seatBase.position.set(x, 0.78 + bodyLift, z + 0.05);
          interiorGroup.add(seatBase);
        }
        createSeat(-0.35, -0.35);
        createSeat(0.35, -0.35);

        // ペダル
        const pedalMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.4, roughness: 0.5 });
        const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.2), pedalMat);
        brakePedal.position.set(-0.42, 0.62 + bodyLift, 0.5);
        brakePedal.rotation.x = -0.5;
        interiorGroup.add(brakePedal);

        const accelPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.18), pedalMat);
        accelPedal.position.set(-0.28, 0.62 + bodyLift, 0.48);
        accelPedal.rotation.x = -0.35;
        interiorGroup.add(accelPedal);

        // フロアパネル(車内全体を覆う大きさに拡大)
        const floorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 2.6), interiorMat);
        floorPanel.position.set(0, 0.5 + bodyLift, -0.3);
        interiorGroup.add(floorPanel);

        // ==========================================================
        // 窓・ドア・屋根・前後の壁(一人称のときは外装=Meshyのモデルを非表示に
        // しているため、こちらのinteriorGroup側に入れないと何も見えなくなって
        // しまう。タイヤ以外の「囲まれている感じ」が出るよう一通り追加する。
        // ==========================================================
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.6, roughness: 0.3 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2226, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.45 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });

        // フロントの壁(ダッシュボードより低い、足元の壁だけにする。
        // 高くするとフロントガラス越しの景色を塞いでしまうため)
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.05), paintMat);
        frontWall.position.set(0, 0.84 + bodyLift, 0.95);
        interiorGroup.add(frontWall);

        // リアの壁(トランク側をふさぐ。天井を下げたのでこちらも低くする)
        const rearWall = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 0.05), paintMat);
        rearWall.position.set(0, 0.9 + bodyLift, -1.55);
        interiorGroup.add(rearWall);

        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.2, 0.05), glassMat);
        windshield.position.set(0, 1.15 + bodyLift, 1.0);
        windshield.rotation.x = -0.45;
        interiorGroup.add(windshield);

        const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.9, 0.5), glassMat);
        rearWindow.position.set(0, 1.1 + bodyLift, -1.75);
        rearWindow.rotation.x = 0.2;
        interiorGroup.add(rearWindow);

        // 屋根(天井)を低くする
        const roofPanel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 2.2), roofMat);
        roofPanel.position.set(0, 1.55 + bodyLift, -0.3);
        interiorGroup.add(roofPanel);

        [-1, 1].forEach((sign) => {
          // サイドウィンドウ(天井を下げた分、位置も高さも少し下げる)
          const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 2.7), glassMat);
          sideWindow.position.set(sign * 0.85, 1.13 + bodyLift, -0.3);
          interiorGroup.add(sideWindow);

          // サイド下部の壁(ドア下端〜床をふさぐ)
          const sideWallLower = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 2.7), paintMat);
          sideWallLower.position.set(sign * 0.85, 0.65 + bodyLift, -0.3);
          interiorGroup.add(sideWallLower);

          // ドア(内側のトリム・アームレスト・ハンドル)
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

  // ==========================================================
  // KAZE専用: 一人称視点の座標をゲーム内で調整できるモード。
  // I/K:前後  J/L:左右  U/O:上下 (Shiftを押しながらで大きく動く)
  // car.parentで「今このKAZEインスタンスが実際にシーンに
  // 追加されているか(=現在選ばれている車かどうか)」を見ているので、
  // 他の車(sports-car.js)に切り替えているときは何も起こらない。
  // ==========================================================
  let eyeAdjustOverlay = document.getElementById('kazeEyeAdjustOverlay');
  if (!eyeAdjustOverlay) {
    eyeAdjustOverlay = document.createElement('div');
    eyeAdjustOverlay.id = 'kazeEyeAdjustOverlay';
    eyeAdjustOverlay.style.cssText =
      'position:absolute; top:60px; left:10px; background:rgba(0,0,0,0.6); color:#fff;' +
      'font-family:sans-serif; font-size:13px; padding:8px 12px; border-radius:6px;' +
      'z-index:20; display:none; pointer-events:none; white-space:pre;';
    document.body.appendChild(eyeAdjustOverlay);
  }

  function updateEyeAdjustOverlay() {
    eyeAdjustOverlay.textContent =
      '【視点調整モード】I/K:前後 J/L:左右 U/O:上下 (Shiftで大きく動く)\n' +
      'x=' + firstPersonOffset.x.toFixed(3) +
      ' y=' + firstPersonOffset.y.toFixed(3) +
      ' z=' + firstPersonOffset.z.toFixed(3);
  }

  window.addEventListener('keydown', (e) => {
    if (!car.parent) return; // KAZEが今アクティブな車でなければ何もしない
    const step = e.shiftKey ? 0.05 : 0.01;
    let moved = true;
    switch (e.key.toLowerCase()) {
      case 'i': firstPersonOffset.z += step; break;
      case 'k': firstPersonOffset.z -= step; break;
      case 'j': firstPersonOffset.x -= step; break;
      case 'l': firstPersonOffset.x += step; break;
      case 'u': firstPersonOffset.y += step; break;
      case 'o': firstPersonOffset.y -= step; break;
      default: moved = false;
    }
    if (moved) {
      eyeAdjustOverlay.style.display = 'block';
      updateEyeAdjustOverlay();
    }
  });

  // 車を切り替えてKAZEが非アクティブになったら、表示を隠す
  setInterval(() => {
    if (!car.parent && eyeAdjustOverlay.style.display !== 'none') {
      eyeAdjustOverlay.style.display = 'none';
    }
  }, 300);

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
