import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function createCar(scene, world) {
  // 見た目（Three.js）
  const bodyMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.6, 4),
    new THREE.MeshPhongMaterial({ color: 0xff3333 })
  );
  scene.add(bodyMesh);

  // 物理ボディ（Cannon.js）
  const body = new CANNON.Body({
    mass: 150,
    shape: new CANNON.Box(new CANNON.Vec3(1, 0.3, 2)),
    position: new CANNON.Vec3(0, 1, 0),
  });
  world.addBody(body);

  // キーボード入力
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);

  function update() {
    const force = 800;
    const torque = 200;

    if (keys['ArrowUp'])    body.applyLocalForce(new CANNON.Vec3(0, 0, -force), CANNON.Vec3.ZERO);
    if (keys['ArrowDown'])  body.applyLocalForce(new CANNON.Vec3(0, 0,  force), CANNON.Vec3.ZERO);
    if (keys['ArrowLeft'])  body.applyTorque(new CANNON.Vec3(0,  torque, 0));
    if (keys['ArrowRight']) body.applyTorque(new CANNON.Vec3(0, -torque, 0));

    // 物理→見た目を同期
    bodyMesh.position.copy(body.position);
    bodyMesh.quaternion.copy(body.quaternion);
  }

  return { mesh: bodyMesh, body, update };
}
