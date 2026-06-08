<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="autoRotate">
        <span>自动旋转</span>
      </label>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="rotateSpeed" min="0" max="2" step="0.01" class="control-range">
      <span class="panel-value">{{ rotateSpeed.toFixed(2) }}</span>
      <span class="panel-label">FOV:</span>
      <input type="range" v-model="fov" min="30" max="100" step="1" class="control-range">
      <span class="panel-value">{{ fov }}</span>
      <button @click="resetView" class="control-btn">重置视角</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const autoRotate = ref(true)
const rotateSpeed = ref(0.25)
const fov = ref(70)

let scene, camera, renderer, animationId, controls
let sphereMesh, clock
let panoramaTexture

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createPanoramaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
  sky.addColorStop(0, '#05051a')
  sky.addColorStop(0.55, '#1a1a2e')
  sky.addColorStop(1, '#0b1026')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 1.4
    const a = 0.1 + Math.random() * 0.7
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const band = ctx.createLinearGradient(0, canvas.height * 0.62, 0, canvas.height)
  band.addColorStop(0, 'rgba(233,69,96,0)')
  band.addColorStop(0.2, 'rgba(233,69,96,0.25)')
  band.addColorStop(1, 'rgba(233,69,96,0.0)')
  ctx.fillStyle = band
  ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38)

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * canvas.width
    const y = canvas.height * (0.15 + Math.random() * 0.6)
    const w = 20 + Math.random() * 120
    const h = 4 + Math.random() * 10
    ctx.fillStyle = `rgba(102,126,234,${0.03 + Math.random() * 0.06})`
    ctx.fillRect(x, y, w, h)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  sphereMesh?.geometry?.dispose?.()
  sphereMesh?.material?.dispose?.()
  panoramaTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(fov.value, container.value.clientWidth / container.value.clientHeight, 0.01, 200)
  camera.position.set(0, 0, 0.1)
  camera.lookAt(0, 0, -1)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = false
  controls.enableZoom = false
  controls.target.set(0, 0, 0)

  panoramaTexture = createPanoramaTexture()
  const sphereGeometry = new THREE.SphereGeometry(60, 80, 40)
  const sphereMaterial = new THREE.MeshBasicMaterial({
    map: panoramaTexture,
    side: THREE.BackSide
  })
  sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
  scene.add(sphereMesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (autoRotate.value) {
    sphereMesh.rotation.y += delta * rotateSpeed.value
  }
  controls.update()
  renderer.render(scene, camera)
}

function resetView() {
  camera.position.set(0, 0, 0.1)
  camera.lookAt(0, 0, -1)
  controls.target.set(0, 0, 0)
  controls.update()
}

watch(fov, () => {
  if (!camera) return
  camera.fov = fov.value
  camera.updateProjectionMatrix()
})
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
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-range { width: 130px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
