<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="addSprites" class="control-btn">添加精灵</button>
      <button @click="clearSprites" class="control-btn">清除</button>
      <button @click="toggleRain" class="control-btn">{{ isRaining ? '停止' : '下雨' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, controls
let sprites = [], isRaining = false, rainDrops = []

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 15)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function addSprites() {
  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf]
  for (let i = 0; i < 20; i++) {
    const material = new THREE.SpriteMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.8
    })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(
      (Math.random() - 0.5) * 15,
      Math.random() * 8 + 1,
      (Math.random() - 0.5) * 15
    )
    const scale = Math.random() * 0.5 + 0.3
    sprite.scale.set(scale, scale, scale)
    sprites.push(sprite)
    scene.add(sprite)
  }
}

function clearSprites() {
  sprites.forEach(s => scene.remove(s))
  rainDrops.forEach(r => scene.remove(r))
  sprites = []
  rainDrops = []
  isRaining = false
}

function toggleRain() {
  isRaining = !isRaining
  if (isRaining) {
    for (let i = 0; i < 100; i++) {
      const material = new THREE.SpriteMaterial({ 
        color: 0x7ec8e3,
        transparent: true,
        opacity: 0.6
      })
      const sprite = new THREE.Sprite(material)
      sprite.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 20,
        (Math.random() - 0.5) * 30
      )
      sprite.scale.set(0.1, 0.4, 0.1)
      sprite.userData.speed = Math.random() * 0.2 + 0.1
      rainDrops.push(sprite)
      scene.add(sprite)
    }
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (isRaining) {
    rainDrops.forEach(drop => {
      drop.position.y -= drop.userData.speed
      if (drop.position.y < 0) {
        drop.position.y = 20
      }
    })
  }
  
  controls.update()
  renderer.render(scene, camera)
}
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