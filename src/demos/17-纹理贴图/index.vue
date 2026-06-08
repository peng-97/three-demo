<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">纹理类型:</span>
      <select v-model="textureType" class="control-select" @change="updateTexture">
        <option value="gradient">渐变纹理</option>
        <option value="checker">棋盘格</option>
        <option value="noise">噪声纹理</option>
        <option value="stripe">条纹纹理</option>
      </select>
      <span class="panel-label">重复:</span>
      <input type="range" v-model="repeat" min="1" max="10" step="1" @input="updateTexture" class="control-range">
      <span class="panel-value">{{ repeat }}x</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const textureType = ref('gradient')
const repeat = ref(3)

let scene, camera, renderer, animationId, controls
let mesh, currentTexture

function createGradientTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createLinearGradient(0, 0, 256, 256)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(0.5, '#764ba2')
  gradient.addColorStop(1, '#f093fb')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  
  return new THREE.CanvasTexture(canvas)
}

function createCheckerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const size = 32
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#333' : '#fff'
      ctx.fillRect(x * size, y * size, size, size)
    }
  }
  
  return new THREE.CanvasTexture(canvas)
}

function createNoiseTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const imageData = ctx.createImageData(256, 256)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() * 255
    imageData.data[i] = value
    imageData.data[i + 1] = value
    imageData.data[i + 2] = value
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  
  return new THREE.CanvasTexture(canvas)
}

function createStripeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  for (let i = 0; i < 256; i += 32) {
    ctx.fillStyle = i % 64 === 0 ? '#ff6b6b' : '#4ecdc4'
    ctx.fillRect(i, 0, 32, 256)
  }
  
  return new THREE.CanvasTexture(canvas)
}

function getTexture() {
  switch (textureType.value) {
    case 'gradient': return createGradientTexture()
    case 'checker': return createCheckerTexture()
    case 'noise': return createNoiseTexture()
    case 'stripe': return createStripeTexture()
    default: return createGradientTexture()
  }
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const texture = getTexture()
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat.value, repeat.value)

  const geometry = new THREE.BoxGeometry(3, 3, 3)
  const material = new THREE.MeshStandardMaterial({ map: texture })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 1.5
  scene.add(mesh)

  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
  const sphereMaterial = new THREE.MeshStandardMaterial({ map: texture })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(-4, 1, 0)
  scene.add(sphere)

  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32)
  const cylinderMaterial = new THREE.MeshStandardMaterial({ map: texture })
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial)
  cylinder.position.set(4, 1.5, 0)
  scene.add(cylinder)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function updateTexture() {
  const texture = getTexture()
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat.value, repeat.value)
  
  scene.traverse((child) => {
    if (child.isMesh && child.material.map) {
      child.material.map = texture
      child.material.needsUpdate = true
    }
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (mesh) {
    mesh.rotation.y += 0.01
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
