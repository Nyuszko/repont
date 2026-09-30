import './style.css';
import * as THREE from 'three';

// M1 scaffold: minimális 3D placeholder színtér — a teljes játék a következő mérföldköveken épül fel.

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
camera.position.set(6, 5, 8);
camera.lookAt(0, 1, 0);

scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x3a5f3a, 1.1));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.6);
sun.position.set(8, 12, 6);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Placeholder automata-test
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 2.4, 1),
  new THREE.MeshLambertMaterial({ color: 0x1b7a4e }),
);
box.position.y = 1.2;
scene.add(box);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
