<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleCamera" class="control-btn">{{ isPerspective ? '正射投影' : '透视投影' }}</button>
      <span v-if="isPerspective" class="panel-label">视场角 (FOV):</span>
      <input v-if="isPerspective" type="range" v-model="fov" min="10" max="120" step="1" class="control-range">
      <span v-if="isPerspective" class="panel-value">{{ fov }}°</span>
      <span v-if="!isPerspective" class="panel-label">缩放:</span>
      <input v-if="!isPerspective" type="range" v-model="zoom" min="1" max="20" step="0.5" class="control-range">
      <span v-if="!isPerspective" class="panel-value">{{ zoom.toFixed(1) }}x</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const isPerspective = ref(true)
const fov = ref(60)
const zoom = ref(10)

let scene, perspectiveCamera, orthographicCamera, currentCamera, renderer, animationId, controls
let meshes = []

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  const aspect = container.value.clientWidth / container.value.clientHeight

  perspectiveCamera = new THREE.PerspectiveCamera(fov.value, aspect, 0.1, 1000)
  perspectiveCamera.position.set(0, 10, 20)
  perspectiveCamera.lookAt(0, 0, 0)

  const frustumSize = zoom.value
  orthographicCamera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    1000
  )
  orthographicCamera.position.set(0, 10, 20)
  orthographicCamera.lookAt(0, 0, 0)

  currentCamera = perspectiveCamera

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]
  const geometries = [
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.CylinderGeometry(0.7, 0.7, 1.5, 32),
    new THREE.TorusGeometry(0.7, 0.25, 16, 100),
    new THREE.ConeGeometry(0.8, 1.5, 32),
    new THREE.OctahedronGeometry(1)
  ]

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col
      const geo = geometries[idx % geometries.length]
      const color = colors[idx % colors.length]
      const mat = new THREE.MeshStandardMaterial({ color: color })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(col * 4 - 8, 1, row * 4 - 6)
      meshes.push(mesh)
      scene.add(mesh)
    }
  }

  controls = new OrbitControls(currentCamera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)
}

function toggleCamera() {
  isPerspective.value = !isPerspective.value
  currentCamera = isPerspective.value ? perspectiveCamera : orthographicCamera
  controls.object = currentCamera
  controls.update()
}

watch(fov, () => {
  perspectiveCamera.fov = fov.value
  perspectiveCamera.updateProjectionMatrix()
})

watch(zoom, () => {
  const aspect = container.value.clientWidth / container.value.clientHeight
  const frustumSize = zoom.value
  orthographicCamera.left = -frustumSize * aspect / 2
  orthographicCamera.right = frustumSize * aspect / 2
  orthographicCamera.top = frustumSize / 2
  orthographicCamera.bottom = -frustumSize / 2
  orthographicCamera.updateProjectionMatrix()
})

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  meshes.forEach((mesh, i) => {
    mesh.rotation.y = time + i * 0.2
    mesh.rotation.x = Math.sin(time + i * 0.3) * 0.3
  })
  
  controls.update()
  renderer.render(scene, currentCamera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  min-width: 50px;
}

.control-range {
  width: 100px;
  cursor: pointer;
}

.control-btn {
  padding: 6px 12px;
  font-size: 0.85rem;
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
</style>
