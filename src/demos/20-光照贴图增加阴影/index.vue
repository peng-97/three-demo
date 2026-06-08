<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">贴图类型:</span>
      <select v-model="mapType" class="control-select" @change="updateMaterial">
        <option value="light">光照贴图</option>
        <option value="specular">高光贴图</option>
        <option value="env">环境贴图</option>
      </select>
      <button @click="toggleAnimation" class="control-btn">{{ animating ? '暂停' : '播放' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const mapType = ref('light')
const animating = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, time = 0

function createLightMapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 150)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.3, '#ffff00')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  
  return new THREE.CanvasTexture(canvas)
}

function createSpecularMapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const radius = Math.random() * 30 + 10
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#000000')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  
  return new THREE.CanvasTexture(canvas)
}

function createEnvMap() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
  skyGradient.addColorStop(0, '#87CEEB')
  skyGradient.addColorStop(0.5, '#98D8C8')
  skyGradient.addColorStop(1, '#7FCDCD')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, 1024, 512)
  
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 200
    const r = Math.random() * 60 + 30
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const pointLight = new THREE.PointLight(0xff6b6b, 1)
  pointLight.position.set(3, 3, 3)
  scene.add(pointLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 128, 32)
  const lightMap = createLightMapTexture()
  const material = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    lightMap: lightMap,
    lightMapIntensity: 1,
    metalness: 0.1,
    roughness: 0.5
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 1
  scene.add(mesh)

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64)
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    metalness: 0.9,
    roughness: 0.1
  })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(-4, 1.5, 0)
  scene.add(sphere)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function updateMaterial() {
  const lightMap = createLightMapTexture()
  const specularMap = createSpecularMapTexture()
  const envMap = createEnvMap()
  
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      if (mapType.value === 'light') {
        child.material.lightMap = lightMap
        child.material.lightMapIntensity = 1
        child.material.envMap = null
      } else if (mapType.value === 'specular') {
        child.material.lightMap = null
        child.material.metalnessMap = specularMap
        child.material.roughnessMap = specularMap
        child.material.envMap = null
      } else {
        child.material.lightMap = null
        child.material.envMap = envMap
        child.material.envMapIntensity = 1
      }
      child.material.needsUpdate = true
    }
  })
}

function toggleAnimation() {
  animating.value = !animating.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (animating.value && mesh) {
    mesh.rotation.y += 0.01
    mesh.rotation.x += 0.005
  }
  
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

.control-select {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.control-btn {
  padding: 10px 20px;
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
