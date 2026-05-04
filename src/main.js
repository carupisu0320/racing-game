import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// シーン・カメラ・レンダラー
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 空色
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 物理エンジン
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });

// 照明
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(50, 100, 50);
sun.castShadow = true;
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.4));

// ゲームループ
function animate() {
  requestAnimationFrame(animate);
  world.fixedStep();          // 物理演算
  updateCar();                // 車の位置を同期
  updateCamera();             // カメラ追従
  renderer.render(scene, camera);
}
animate();
