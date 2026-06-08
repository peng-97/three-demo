// 基础Three.js示例
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x667eea });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();