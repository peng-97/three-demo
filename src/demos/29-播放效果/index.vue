<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="triggerEffect" class="control-btn">触发特效</button>
      <button @click="switchEffect" class="control-btn">切换效果: {{ currentEffect }}</button>
      <span class="panel-label">粒子数:</span>
      <input type="range" v-model="particleCount" min="50" max="500" step="10" class="control-range">
      <span class="panel-value">{{ particleCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const particleCount = ref(200)
const currentEffect = ref('爆炸')

let scene, camera, renderer, animationId, controls
let activeParticles = []
let effectIndex = 0
const effects = ['爆炸', '波形', '烟花', '喷泉']

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 8, 20)
  camera.lookAt(0, 3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 1, 50)
  pointLight.position.set(10, 10, 10)
  scene.add(pointLight)

  const gridHelper = new THREE.GridHelper(40, 40, 0x333366, 0x1a1a33)
  scene.add(gridHelper)

  const floorGeometry = new THREE.PlaneGeometry(40, 40)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, metalness: 0.3, roughness: 0.8 })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)
}

function createParticleTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.5, color + 'aa')
  gradient.addColorStop(1, color + '00')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function createExplosion() {
  const colors = ['#ff6b6b', '#ff9f43', '#feca57', '#ff6b6b']
  const particles = []
  
  for (let i = 0; i < particleCount.value; i++) {
    const material = new THREE.SpriteMaterial({
      map: createParticleTexture(colors[Math.floor(Math.random() * colors.length)]),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    const size = 0.3 + Math.random() * 0.5
    sprite.scale.set(size, size, size)
    sprite.position.set(0, 3, 0)
    scene.add(sprite)
    
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const speed = 2 + Math.random() * 5
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 2,
        Math.sin(phi) * Math.sin(theta) * speed
      ),
      gravity: -9.8,
      lifetime: 1.5 + Math.random() * 1,
      age: 0,
      startScale: size
    })
  }
  activeParticles.push(...particles)
}

function createWave() {
  const colors = ['#4ecdc4', '#45b7d1', '#667eea']
  const particles = []
  
  for (let i = 0; i < particleCount.value; i++) {
    const x = (Math.random() - 0.5) * 30
    const z = (Math.random() - 0.5) * 30
    const material = new THREE.SpriteMaterial({
      map: createParticleTexture(colors[Math.floor(Math.random() * colors.length)]),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    const size = 0.2 + Math.random() * 0.4
    sprite.scale.set(size, size, size)
    sprite.position.set(x, 0, z)
    scene.add(sprite)
    
    particles.push({
      mesh: sprite,
      originalX: x,
      originalZ: z,
      phase: Math.random() * Math.PI * 2,
      amplitude: 1 + Math.random() * 2,
      frequency: 1 + Math.random() * 2,
      lifetime: 3,
      age: 0
    })
  }
  activeParticles.push(...particles)
}

function createFireworks() {
  const colors = ['#ff6b6b', '#feca57', '#ff9f43', '#4ecdc4', '#667eea', '#c56cf0']
  const particles = []
  const centerX = (Math.random() - 0.5) * 15
  const centerZ = (Math.random() - 0.5) * 15
  
  for (let i = 0; i < particleCount.value; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const material = new THREE.SpriteMaterial({
      map: createParticleTexture(color),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    const size = 0.2 + Math.random() * 0.3
    sprite.scale.set(size, size, size)
    sprite.position.set(centerX, 0.5, centerZ)
    scene.add(sprite)
    
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.5
    const speed = 3 + Math.random() * 4
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 3,
        Math.sin(phi) * Math.sin(theta) * speed
      ),
      gravity: -9.8,
      lifetime: 2 + Math.random() * 1,
      age: 0,
      startScale: size
    })
  }
  activeParticles.push(...particles)
}

function createFountain() {
  const colors = ['#4ecdc4', '#667eea', '#ffffff']
  const particles = []
  
  for (let i = 0; i < particleCount.value; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const material = new THREE.SpriteMaterial({
      map: createParticleTexture(color),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    const size = 0.15 + Math.random() * 0.25
    sprite.scale.set(size, size, size)
    
    const theta = Math.random() * Math.PI * 2
    const radius = Math.random() * 0.5
    sprite.position.set(
      Math.cos(theta) * radius,
      0.2,
      Math.sin(theta) * radius
    )
    scene.add(sprite)
    
    const speed = 4 + Math.random() * 3
    const horizontalSpeed = 0.5 + Math.random() * 1
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(
        Math.cos(theta) * horizontalSpeed,
        speed,
        Math.sin(theta) * horizontalSpeed
      ),
      gravity: -8,
      lifetime: 2 + Math.random() * 1,
      age: 0,
      startScale: size,
      delay: Math.random() * 1.5
    })
  }
  activeParticles.push(...particles)
}

function triggerEffect() {
  switch (effectIndex) {
    case 0: createExplosion(); break
    case 1: createWave(); break
    case 2: createFireworks(); break
    case 3: createFountain(); break
  }
}

function switchEffect() {
  effectIndex = (effectIndex + 1) % effects.length
  currentEffect.value = effects[effectIndex]
}

let lastTime = 0
function animate(timestamp = 0) {
  animationId = requestAnimationFrame(animate)
  const delta = (timestamp - lastTime) / 1000
  lastTime = timestamp
  
  if (delta && delta < 1) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i]
      p.age += delta
      
      if (p.age >= p.lifetime) {
        scene.remove(p.mesh)
        p.mesh.material.dispose()
        p.mesh.material.map.dispose()
        activeParticles.splice(i, 1)
        continue
      }
      
      if (p.velocity) {
        if (p.delay && p.age < p.delay) continue
        p.velocity.y += p.gravity * delta
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta))
        const scale = p.startScale * (1 - p.age / p.lifetime)
        p.mesh.scale.set(scale, scale, scale)
        p.mesh.material.opacity = 1 - p.age / p.lifetime
      } else if (p.phase !== undefined) {
        const waveY = Math.sin((p.age * p.frequency + p.phase)) * p.amplitude
        p.mesh.position.y = waveY
        p.mesh.material.opacity = 1 - p.age / p.lifetime
      }
    }
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
