<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleCamera" class="control-btn">切换相机</button>
      <button @click="animateCamera" class="control-btn">{{ isAnimating ? '停止漫游' : '开始漫游' }}</button>
      <button @click="resetCamera" class="control-btn">重置</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0.2" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, renderer, animationId, controls
let perspectiveCamera, orthographicCamera, currentCamera, meshes = []
const isAnimating = ref(false)
const speed = ref(1)
let animationProgress = 0
let clock
const target = new THREE.Vector3(0, 0, 0)
const orthographicWidth = 20

function onResize() {
  if (!container.value || !renderer || !perspectiveCamera || !orthographicCamera) return
  const aspect = container.value.clientWidth / container.value.clientHeight
  perspectiveCamera.aspect = aspect
  perspectiveCamera.updateProjectionMatrix()

  orthographicCamera.left = (-orthographicWidth * aspect) / 2
  orthographicCamera.right = (orthographicWidth * aspect) / 2
  orthographicCamera.top = orthographicWidth / 2
  orthographicCamera.bottom = -orthographicWidth / 2
  orthographicCamera.updateProjectionMatrix()

  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  meshes.forEach((m) => {
    m.geometry?.dispose?.()
    m.material?.dispose?.()
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  const aspect = container.value.clientWidth / container.value.clientHeight
  perspectiveCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  perspectiveCamera.position.set(0, 5, 10)
  perspectiveCamera.lookAt(target)

  orthographicCamera = new THREE.OrthographicCamera(
    (-orthographicWidth * aspect) / 2, 
    (orthographicWidth * aspect) / 2, 
    orthographicWidth / 2, 
    -orthographicWidth / 2, 
    0.1, 
    1000
  )
  orthographicCamera.position.set(0, 5, 10)
  orthographicCamera.lookAt(target)

  currentCamera = perspectiveCamera

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf]
  const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.ConeGeometry(0.5, 1, 32),
    new THREE.TorusGeometry(0.5, 0.2, 16, 100)
  ]

  for (let i = 0; i < 20; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)].clone()
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.5,
      metalness: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 15,
      Math.random() * 3 + 0.5,
      (Math.random() - 0.5) * 15
    )
    meshes.push(mesh)
    scene.add(mesh)
  }

  controls = new OrbitControls(currentCamera, renderer.domElement)
  controls.enableDamping = true
  controls.target.copy(target)
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function toggleCamera() {
  currentCamera = currentCamera === perspectiveCamera ? orthographicCamera : perspectiveCamera
  controls?.dispose?.()
  controls = new OrbitControls(currentCamera, renderer.domElement)
  controls.enableDamping = true
  controls.target.copy(target)
  controls.update()
}

function animateCamera() {
  isAnimating.value = !isAnimating.value
  animationProgress = 0
}

function resetCamera() {
  currentCamera.position.set(0, 5, 10)
  currentCamera.lookAt(target)
  isAnimating.value = false
  animationProgress = 0
  controls.target.copy(target)
  controls.update()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const delta = clock.getDelta()
  if (isAnimating.value) {
    animationProgress += delta * speed.value
    const t = animationProgress
    const radius = 15
    const y = 5 + Math.sin(t * 1.6) * 3
    currentCamera.position.x = Math.cos(t) * radius
    currentCamera.position.y = y
    currentCamera.position.z = Math.sin(t) * radius
    currentCamera.lookAt(target)
  }
  
  meshes.forEach((mesh, i) => {
    mesh.rotation.y += 0.01 + i * 0.001
  })
  
  controls.update()
  renderer.render(scene, currentCamera)
}
</script>

<style scoped>
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.demo-container {
  flex: 1;
}
.control-panel {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}
.control-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 40px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
</style>
