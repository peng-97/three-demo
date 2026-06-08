<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="addSprite" class="control-btn">添加精灵</button>
      <button @click="clearSprites" class="control-btn">清除所有</button>
      <span class="panel-label">精灵大小:</span>
      <input type="range" v-model="spriteSize" min="0.2" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ spriteSize.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const spriteSize = ref(1)

let scene, camera, renderer, animationId, controls
let sprites = [], spriteMaterial

function createSpriteTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.7, color + 'cc')
  gradient.addColorStop(1, color + '00')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(128, 128, 50, 0, Math.PI * 2)
  ctx.fill()
  
  const gradient2 = ctx.createRadialGradient(100, 100, 0, 100, 100, 40)
  gradient2.addColorStop(0, '#ffffff')
  gradient2.addColorStop(1, '#ffffff00')
  ctx.fillStyle = gradient2
  ctx.beginPath()
  ctx.arc(100, 100, 40, 0, Math.PI * 2)
  ctx.fill()
  
  return new THREE.CanvasTexture(canvas)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 10, 20)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  const colors = ['#ff6b6b', '#4ecdc4', '#667eea', '#f9ca24', '#a8e6cf', '#c56cf0']
  for (let i = 0; i < 15; i++) {
    const color = colors[i % colors.length]
    const texture = createSpriteTexture(color)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 8 + 1,
      (Math.random() - 0.5) * 20
    )
    sprite.scale.set(spriteSize.value, spriteSize.value, 1)
    sprites.push(sprite)
    scene.add(sprite)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function addSprite() {
  const colors = ['#ff6b6b', '#4ecdc4', '#667eea', '#f9ca24', '#a8e6cf', '#c56cf0']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const texture = createSpriteTexture(color)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 8 + 1,
    (Math.random() - 0.5) * 20
  )
  sprite.scale.set(spriteSize.value, spriteSize.value, 1)
  sprites.push(sprite)
  scene.add(sprite)
}

function clearSprites() {
  sprites.forEach(sprite => {
    scene.remove(sprite)
    sprite.material.dispose()
    sprite.material.map.dispose()
  })
  sprites = []
}

watch(spriteSize, () => {
  sprites.forEach(sprite => {
    sprite.scale.set(spriteSize.value, spriteSize.value, 1)
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  sprites.forEach((sprite, i) => {
    sprite.position.y = 3 + Math.sin(time + i * 0.5) * 2
    sprite.position.x += Math.sin(time * 0.5 + i) * 0.01
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
