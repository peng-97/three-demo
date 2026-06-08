<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">颜色:</span>
      <select v-model="beamColor" class="control-select">
        <option value="#00ffff">青色</option>
        <option value="#ff4d6d">粉色</option>
        <option value="#ffd166">金色</option>
        <option value="#6c5ce7">紫色</option>
      </select>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="intensity" min="0" max="2" step="0.01" class="control-range">
      <span class="panel-value">{{ intensity.toFixed(2) }}</span>
      <span class="panel-label">高度:</span>
      <input type="range" v-model="height" min="3" max="20" step="0.5" class="control-range">
      <span class="panel-value">{{ height.toFixed(1) }}</span>
      <span class="panel-label">半径:</span>
      <input type="range" v-model="radius" min="0.5" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ radius.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="pulse">
        <span>呼吸</span>
      </label>
      <button @click="toggleSpin" class="control-btn">{{ spinning ? '暂停旋转' : '开始旋转' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const beamColor = ref('#00ffff')
const intensity = ref(1)
const height = ref(12)
const radius = ref(3)
const pulse = ref(true)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let beamMesh, glowSprite, clock
let beamTexture, glowTexture

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createBeamTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.15, 'rgba(255,255,255,0.35)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.85)')
  grad.addColorStop(0.85, 'rgba(255,255,255,0.25)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 10; i++) {
    const y = Math.floor((i / 10) * canvas.height)
    const w = 10 + Math.random() * 18
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`
    ctx.fillRect((canvas.width - w) / 2, y, w, 60)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120)
  grad.addColorStop(0, 'rgba(255,255,255,0.95)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.5)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(128, 128, 120, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function rebuildBeamGeometry() {
  if (!beamMesh || !glowSprite) return
  beamMesh.geometry?.dispose?.()
  beamMesh.geometry = new THREE.CylinderGeometry(radius.value * 0.15, radius.value, height.value, 48, 1, true)
  beamMesh.position.y = height.value / 2
  glowSprite.position.y = 0.05
  glowSprite.scale.set(radius.value * 3.2, radius.value * 3.2, 1)
}

function applyBeamMaterial() {
  if (!beamMesh || !glowSprite) return
  beamMesh.material.color.set(beamColor.value)
  beamMesh.material.opacity = intensity.value
  glowSprite.material.color.set(beamColor.value)
  glowSprite.material.opacity = Math.min(1, 0.7 * intensity.value)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  beamMesh?.geometry?.dispose?.()
  beamMesh?.material?.dispose?.()
  glowSprite?.material?.dispose?.()
  beamTexture?.dispose?.()
  glowTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 7, 14)
  camera.lookAt(0, 4, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
  scene.add(ambientLight)
  const pointLight = new THREE.PointLight(0xffffff, 1.2)
  pointLight.position.set(0, 10, 6)
  scene.add(pointLight)

  const groundGeometry = new THREE.CircleGeometry(14, 64)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(28, 28, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 4, 0)

  beamTexture = createBeamTexture()
  glowTexture = createGlowTexture()

  const beamGeometry = new THREE.CylinderGeometry(radius.value * 0.15, radius.value, height.value, 48, 1, true)
  const beamMaterial = new THREE.MeshBasicMaterial({
    map: beamTexture,
    transparent: true,
    opacity: intensity.value,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    color: new THREE.Color(beamColor.value)
  })
  beamMesh = new THREE.Mesh(beamGeometry, beamMaterial)
  beamMesh.position.y = height.value / 2
  scene.add(beamMesh)

  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: new THREE.Color(beamColor.value)
  })
  glowSprite = new THREE.Sprite(glowMaterial)
  glowSprite.position.y = 0.05
  glowSprite.scale.set(radius.value * 3.2, radius.value * 3.2, 1)
  scene.add(glowSprite)

  applyBeamMaterial()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function toggleSpin() {
  spinning.value = !spinning.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const t = clock.getElapsedTime()

  if (spinning.value) {
    beamMesh.rotation.y += delta * 0.35
  }

  if (pulse.value) {
    const k = 0.8 + Math.sin(t * 2.4) * 0.2
    beamMesh.material.opacity = intensity.value * k
    glowSprite.material.opacity = Math.min(1, 0.7 * intensity.value) * k
  } else {
    beamMesh.material.opacity = intensity.value
    glowSprite.material.opacity = Math.min(1, 0.7 * intensity.value)
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([height, radius], rebuildBeamGeometry)
watch([beamColor, intensity], applyBeamMaterial)
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
  flex-wrap: wrap;
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
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
