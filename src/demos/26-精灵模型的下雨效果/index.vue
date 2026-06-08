<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">雨滴数量:</span>
      <input type="range" v-model="dropCount" min="100" max="2000" step="100" @input="updateDrops" />
      <span class="panel-value">{{ dropCount }}</span>
      <button @click="toggleRain" class="control-btn">{{ isRaining ? '停止' : '开始' }}</button>
      <button @click="reset" class="control-btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const dropCount = ref(500)
const isRaining = ref(true)

let scene, camera, renderer, animationId, controls
let rainGroup, clock

function createRainTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 32)
  gradient.addColorStop(0, 'rgba(200, 220, 255, 0)')
  gradient.addColorStop(0.5, 'rgba(200, 220, 255, 1)')
  gradient.addColorStop(1, 'rgba(200, 220, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(6, 0, 4, 32)
  
  return new THREE.CanvasTexture(canvas)
}

function createRainDrop(texture) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const sprite = new THREE.Sprite(material)
  
  sprite.position.set(
    (Math.random() - 0.5) * 40,
    Math.random() * 30 + 10,
    (Math.random() - 0.5) * 40
  )
  
  const scale = Math.random() * 0.5 + 0.3
  sprite.scale.set(scale * 0.3, scale, 1)
  
  sprite.userData.speed = Math.random() * 15 + 10
  sprite.userData.initialY = sprite.position.y
  
  return sprite
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 20, 50)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 8, 15)
  camera.lookAt(0, 5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
  scene.add(ambientLight)

  const groundGeometry = new THREE.PlaneGeometry(40, 40)
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222233,
    roughness: 0.9,
    metalness: 0.1
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(40, 40, 0x333355, 0x222233)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)

  rainGroup = new THREE.Group()
  scene.add(rainGroup)

  const texture = createRainTexture()
  for (let i = 0; i < dropCount.value; i++) {
    rainGroup.add(createRainDrop(texture))
  }

  clock = new THREE.Clock()
}

function updateDrops() {
  const currentCount = rainGroup.children.length
  const texture = createRainTexture()
  
  if (dropCount.value > currentCount) {
    for (let i = currentCount; i < dropCount.value; i++) {
      rainGroup.add(createRainDrop(texture))
    }
  } else if (dropCount.value < currentCount) {
    for (let i = currentCount - 1; i >= dropCount.value; i--) {
      rainGroup.remove(rainGroup.children[i])
    }
  }
}

function toggleRain() {
  isRaining.value = !isRaining.value
}

function reset() {
  const texture = createRainTexture()
  rainGroup.clear()
  for (let i = 0; i < dropCount.value; i++) {
    rainGroup.add(createRainDrop(texture))
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const delta = clock.getDelta()
  
  if (isRaining.value) {
    rainGroup.children.forEach(sprite => {
      sprite.position.y -= sprite.userData.speed * delta
      
      if (sprite.position.y < 0) {
        sprite.position.y = sprite.userData.initialY
        sprite.position.x = (Math.random() - 0.5) * 40
        sprite.position.z = (Math.random() - 0.5) * 40
      }
    })
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
  min-width: 40px;
}

.control-panel input[type="range"] {
  width: 150px;
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
