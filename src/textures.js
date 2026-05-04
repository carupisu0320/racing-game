export function createTrack(scene, world) {
  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshPhongMaterial({ color: 0x228b22 }) // 草
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 地面の物理
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // 道路（シンプルな直線コース）
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.1, 100),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
  );
  scene.add(road);
}
