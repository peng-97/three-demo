<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模式:</span>
      <select v-model="mode" class="control-select" @change="updateMaterial">
        <option value="normal">法线贴图</option>
        <option value="bump">凹凸贴图</option>
        <option value="both">两者结合</option>
      </select>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="intensity" min="0" max="2" step="0.1" @input="updateMaterial" class="control-range">
      <span class="panel-value">{{ intensity.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const mode = ref('normal')
const intensity = ref(1)

let scene, camera, renderer, animationId, controls
let mesh, normalMap, bumpMap

function createNoiseTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const imageData = ctx.createImageData(256, 256)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 256
    const y = Math.floor((i / 4) / 256)
    const value = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 128
    imageData.data[i] = value
    imageData.data[i + 1] = value
    imageData.data[i + 2] = value
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  
  return new THREE.CanvasTexture(canvas)
}

function createNormalMap() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const imageData = ctx.createImageData(256, 256)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 256
    const y = Math.floor((i / 4) / 256)
    const value = (Math.sin(x * 0.2) * Math.cos(y * 0.2) + 1) * 0.5
    imageData.data[i] = 128 + Math.sin(x * 0.2) * 127
    imageData.data[i + 1] = 128 + Math.cos(y * 0.2) * 127
    imageData.data[i + 2] = 255
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  
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

  const pointLight = new THREE.PointLight(0xffffff, 1.5)
  pointLight.position.set(5, 5, 5)
  scene.add(pointLight)

  const pointLight2 = new THREE.PointLight(0x667eea, 1)
  pointLight2.position.set(-5, 5, -5)
  scene.add(pointLight2)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  normalMap = createNormalMap()
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(2, 2)

  bumpMap = createNoiseTexture()
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.repeat.set(4, 4)

  const geometry = new THREE.SphereGeometry(2, 64, 64)
  const material = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(intensity.value, intensity.value),
    metalness: 0.3,
    roughness: 0.7
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 0.5
  scene.add(mesh)

  const planeGeometry = new THREE.PlaneGeometry(6, 6)
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(intensity.value, intensity.value),
    metalness: 0.2,
    roughness: 0.8
  })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.position.set(4, 1.5, 0)
  plane.rotation.y = -0.3
  scene.add(plane)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function updateMaterial() {
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      if (mode.value === 'normal') {
        child.material.normalMap = normalMap
        child.material.bumpMap = null
        child.material.normalScale.set(intensity.value, intensity.value)
      } else if (mode.value === 'bump') {
        child.material.normalMap = null
        child.material.bumpMap = bumpMap
        child.material.bumpScale = intensity.value
      } else {
        child.material.normalMap = normalMap
        child.material.bumpMap = bumpMap
        child.material.normalScale.set(intensity.value * 0.5, intensity.value * 0.5)
        child.material.bumpScale = intensity.value * 0.5
      }
      child.material.needsUpdate = true
    }
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (mesh) {
    mesh.rotation.y += 0.005
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

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  min-width: 50px;
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

.control-range {
  width: 100px;
  cursor: pointer;
}
</style>
