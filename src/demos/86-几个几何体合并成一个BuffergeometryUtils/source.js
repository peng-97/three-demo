// 基础Three.js场景设置
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
camera.position.set(0, 3, 8)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)

// 创建几何体和材质
const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16)
const material = new THREE.MeshStandardMaterial({
  color: 0x667eea,
  metalness: 0.3,
  roughness: 0.7
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// 添加光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 10, 7)
scene.add(directionalLight)

// 动画循环
function animate() {
  requestAnimationFrame(animate)
  mesh.rotation.y += 0.01
  renderer.render(scene, camera)
}
animate()
