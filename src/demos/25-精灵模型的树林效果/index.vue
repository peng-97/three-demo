<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">树木数量:</span>
      <input type="range" v-model="treeCount" min="20" max="200" step="10" class="control-range">
      <span class="panel-value">{{ treeCount }}</span>
      <button @click="regenerateForest" class="control-btn">重新生成</button>
      <span class="panel-label">风力:</span>
      <input type="range" v-model="windStrength" min="0" max="2" step="0.1" class="control-range">
      <span class="panel-value">{{ windStrength.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const treeCount = ref(80)
const windStrength = ref(0.5)

let scene, camera, renderer, animationId, controls
let trees = []

function createTreeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = '#5d4037'
  ctx.fillRect(118, 350, 20, 160)
  
  const gradient = ctx.createRadialGradient(128, 200, 0, 128, 200, 150)
  gradient.addColorStop(0, '#81c784')
  gradient.addColorStop(0.5, '#4caf50')
  gradient.addColorStop(1, '#2e7d32')
  ctx.fillStyle = gradient
  
  ctx.beginPath()
  ctx.moveTo(128, 50)
  ctx.lineTo(50, 250)
  ctx.lineTo(206, 250)
  ctx.closePath()
  ctx.fill()
  
  ctx.beginPath()
  ctx.moveTo(128, 100)
  ctx.lineTo(30, 320)
  ctx.lineTo(226, 320)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 10; i++) {
    const x = 80 + Math.random() * 96
    const y = 100 + Math.random() * 150
    ctx.beginPath()
    ctx.arc(x, y, 3 + Math.random() * 4, 0, Math.PI * 2)
    ctx.fill()
  }
  
  return new THREE.CanvasTexture(canvas)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(30, 20, 30)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(20, 30, 20)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(100, 100)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x7cb342 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const treeTexture = createTreeTexture()
  generateForest(treeTexture)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)
}

function generateForest(texture) {
  trees.forEach(tree => {
    scene.remove(tree)
  })
  trees = []

  for (let i = 0; i < treeCount.value; i++) {
    const material = new THREE.SpriteMaterial({ map: texture })
    const tree = new THREE.Sprite(material)
    
    const angle = Math.random() * Math.PI * 2
    const radius = 5 + Math.random() * 40
    tree.position.set(
      Math.cos(angle) * radius,
      3,
      Math.sin(angle) * radius
    )
    
    const scale = 3 + Math.random() * 4
    tree.scale.set(scale, scale * 2, 1)
    tree.userData.originalScale = tree.scale.clone()
    tree.userData.offset = Math.random() * 100
    tree.userData.swaySpeed = 0.5 + Math.random() * 1
    
    trees.push(tree)
    scene.add(tree)
  }
}

function regenerateForest() {
  const treeTexture = createTreeTexture()
  generateForest(treeTexture)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  trees.forEach(tree => {
    const sway = Math.sin(time * tree.userData.swaySpeed + tree.userData.offset) * windStrength.value * 0.1
    tree.position.x = tree.position.x + sway * 0.01
    tree.scale.x = tree.userData.originalScale.x * (1 + sway * 0.1)
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
