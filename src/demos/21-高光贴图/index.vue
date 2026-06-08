<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">金属度:</span>
      <input type="range" v-model="metalness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ metalness.toFixed(2) }}</span>
      <span class="panel-label">粗糙度:</span>
      <input type="range" v-model="roughness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ roughness.toFixed(2) }}</span>
      <button @click="toggleLight" class="control-btn">{{ lightOn ? '关灯' : '开灯' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const metalness = ref(0.5)
const roughness = ref(0.5)
const lightOn = ref(true)

let scene, camera, renderer, animationId, controls
let meshes = [], pointLight, directionalLight

function createSpecularTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.5, '#aaaaaa')
  gradient.addColorStop(1, '#333333')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const r = Math.random() * 20 + 5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  
  return new THREE.CanvasTexture(canvas)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  pointLight = new THREE.PointLight(0xff6b6b, 1.5, 20)
  pointLight.position.set(3, 3, 3)
  scene.add(pointLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const specularTexture = createSpecularTexture()

  const geometry1 = new THREE.SphereGeometry(1.2, 64, 64)
  const material1 = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    metalness: metalness.value,
    roughness: roughness.value,
    metalnessMap: specularTexture
  })
  const mesh1 = new THREE.Mesh(geometry1, material1)
  mesh1.position.set(-3, 1.5, 0)
  meshes.push(mesh1)
  scene.add(mesh1)

  const geometry2 = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 32)
  const material2 = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    metalness: metalness.value,
    roughness: roughness.value,
    metalnessMap: specularTexture
  })
  const mesh2 = new THREE.Mesh(geometry2, material2)
  mesh2.position.set(0, 1.5, 0)
  meshes.push(mesh2)
  scene.add(mesh2)

  const geometry3 = new THREE.CylinderGeometry(0.8, 0.8, 2, 64)
  const material3 = new THREE.MeshStandardMaterial({
    color: 0xf9ca24,
    metalness: metalness.value,
    roughness: roughness.value,
    metalnessMap: specularTexture
  })
  const mesh3 = new THREE.Mesh(geometry3, material3)
  mesh3.position.set(3, 1.5, 0)
  meshes.push(mesh3)
  scene.add(mesh3)

  const floorGeometry = new THREE.PlaneGeometry(30, 30)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function toggleLight() {
  lightOn.value = !lightOn.value
  directionalLight.visible = lightOn.value
  pointLight.visible = lightOn.value
}

watch([metalness, roughness], () => {
  meshes.forEach(mesh => {
    mesh.material.metalness = metalness.value
    mesh.material.roughness = roughness.value
    mesh.material.needsUpdate = true
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  pointLight.position.x = Math.sin(time) * 4
  pointLight.position.z = Math.cos(time) * 4
  
  meshes.forEach((mesh, i) => {
    mesh.rotation.y += 0.01 + i * 0.002
  })
  
  controls.update()
  renderer.render(scene, camera)
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
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  min-width: 50px;
}

.control-range {
  width: 100px;
  cursor: pointer;
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
</style>
