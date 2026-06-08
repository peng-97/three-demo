// 双场景渲染
const mainRenderer = new THREE.WebGLRenderer()
const minimapRenderer = new THREE.WebGLRenderer()

// 主场景和相机
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera()

// 小地图场景和相机
const minimapScene = new THREE.Scene()
const minimapCamera = new THREE.OrthographicCamera(-30, 30, 30, -30, 0.1, 1000)
minimapCamera.position.set(0, 50, 0)
minimapCamera.lookAt(0, 0, 0)

// 渲染循环
function animate() {
  mainRenderer.render(scene, camera)
  minimapRenderer.render(minimapScene, minimapCamera)
}

// 键盘控制
const keys = {}
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true)
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false)

if (keys['w']) player.position.z -= speed
