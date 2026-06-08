<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="changeShape" class="control-btn">切换形状</button>
      <span class="panel-label">环境强度:</span>
      <input type="range" v-model="envIntensity" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ envIntensity.toFixed(1) }}</span>
      <span class="panel-label">金属度:</span>
      <input type="range" v-model="metalness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ metalness.toFixed(2) }}</span>
      <span class="panel-label">粗糙度:</span>
      <input type="range" v-model="roughness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ roughness.toFixed(2) }}</span>
      <button @click="toggleSpin" class="control-btn">{{ spinning ? '暂停旋转' : '开始旋转' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const envIntensity = ref(1.2)
const metalness = ref(1)
const roughness = ref(0.1)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, currentShapeIndex = 0, clock
let envTexture

const shapes = [
  () => new THREE.SphereGeometry(1.4, 64, 64),
  () => new THREE.TorusKnotGeometry(1.1, 0.35, 160, 32),
  () => new THREE.BoxGeometry(2, 2, 2),
  () => new THREE.CapsuleGeometry(0.8, 1.6, 8, 24)
]

function createEnvironmentTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
  skyGradient.addColorStop(0, '#0b1026')
  skyGradient.addColorStop(0.6, '#1a1a2e')
  skyGradient.addColorStop(1, '#e94560')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height * 0.85
    const r = Math.random() * 1.2
    const a = 0.15 + Math.random() * 0.65
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const glowGradient = ctx.createRadialGradient(820, 130, 10, 820, 130, 220)
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  mesh?.geometry?.dispose?.()
  mesh?.material?.dispose?.()
  envTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  envTexture = createEnvironmentTexture()
  scene.background = envTexture
  scene.environment = envTexture

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 2.8, 7.5)
  camera.lookAt(0, 1.2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1.2, 0)

  const geometry = shapes[currentShapeIndex]()
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: metalness.value,
    roughness: roughness.value,
    envMapIntensity: envIntensity.value
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 1.2
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function changeShape() {
  currentShapeIndex = (currentShapeIndex + 1) % shapes.length
  const newGeometry = shapes[currentShapeIndex]()
  mesh.geometry.dispose()
  mesh.geometry = newGeometry
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    mesh.rotation.y += delta * 0.6
    mesh.rotation.x += delta * 0.25
  }
  controls.update()
  renderer.render(scene, camera)
}

function toggleSpin() {
  spinning.value = !spinning.value
}

function applyMaterial() {
  if (!mesh) return
  mesh.material.envMapIntensity = envIntensity.value
  mesh.material.metalness = metalness.value
  mesh.material.roughness = roughness.value
  mesh.material.needsUpdate = true
}

watch([envIntensity, metalness, roughness], applyMaterial)
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
.panel-value { color: white; font-weight: 700; min-width: 44px; text-align: right; }
.control-range { width: 110px; cursor: pointer; }
</style>
