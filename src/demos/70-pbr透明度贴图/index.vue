<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">透明度:</span>
      <input type="range" v-model="opacity" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ opacity.toFixed(2) }}</span>
      <span class="panel-label">alphaTest:</span>
      <input type="range" v-model="alphaTest" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ alphaTest.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="transparent">
        <span>transparent</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="depthWrite">
        <span>depthWrite</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="doubleSide">
        <span>DoubleSide</span>
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
const opacity = ref(1)
const alphaTest = ref(0)
const transparent = ref(true)
const depthWrite = ref(false)
const doubleSide = ref(true)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let cardMesh, backMesh, clock
let colorTexture, alphaTexture

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createColorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 256, 256)

  ctx.fillStyle = '#667eea'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 44px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ALPHA', 128, 32)

  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + i * 0.03})`
    ctx.beginPath()
    ctx.arc(40 + i * 20, 140 + Math.sin(i) * 10, 10 + i, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function createAlphaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, 256, 256)

  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(128, 150, 90, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.arc(70 + i * 26, 150 + Math.sin(i * 1.2) * 28, 14, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  const grad = ctx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(1, 'rgba(255,255,255,0.2)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.anisotropy = 4
  return texture
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  if (cardMesh) {
    cardMesh.geometry?.dispose?.()
    cardMesh.material?.dispose?.()
  }
  if (backMesh) {
    backMesh.geometry?.dispose?.()
    backMesh.material?.dispose?.()
  }
  colorTexture?.dispose?.()
  alphaTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 3.5, 9)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const backGeometry = new THREE.TorusKnotGeometry(1.2, 0.45, 150, 24)
  const backMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.35, metalness: 0.55 })
  backMesh = new THREE.Mesh(backGeometry, backMaterial)
  backMesh.position.set(0, 2.2, -2.5)
  scene.add(backMesh)

  colorTexture = createColorTexture()
  alphaTexture = createAlphaTexture()

  const cardGeometry = new THREE.PlaneGeometry(4, 4, 1, 1)
  const cardMaterial = new THREE.MeshStandardMaterial({
    map: colorTexture,
    alphaMap: alphaTexture,
    transparent: transparent.value,
    opacity: opacity.value,
    alphaTest: alphaTest.value,
    side: doubleSide.value ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: depthWrite.value,
    roughness: 0.55,
    metalness: 0.15
  })
  cardMesh = new THREE.Mesh(cardGeometry, cardMaterial)
  cardMesh.position.set(0, 2.2, 0.5)
  scene.add(cardMesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    cardMesh.rotation.y += delta * 0.6
    backMesh.rotation.x += delta * 0.35
    backMesh.rotation.y += delta * 0.5
  }
  controls.update()
  renderer.render(scene, camera)
}

function toggleSpin() {
  spinning.value = !spinning.value
}

function applyMaterialSettings() {
  if (!cardMesh) return
  const material = cardMesh.material
  material.transparent = transparent.value
  material.opacity = opacity.value
  material.alphaTest = alphaTest.value
  material.depthWrite = depthWrite.value
  material.side = doubleSide.value ? THREE.DoubleSide : THREE.FrontSide
  material.needsUpdate = true
}

watch([opacity, alphaTest, transparent, depthWrite, doubleSide], applyMaterialSettings)
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
.control-range { width: 110px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
