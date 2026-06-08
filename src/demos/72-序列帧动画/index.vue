<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="togglePlay" class="control-btn">{{ playing ? '暂停' : '播放' }}</button>
      <button @click="reset" class="control-btn">重置</button>
      <span class="panel-label">FPS:</span>
      <input type="range" v-model="fps" min="1" max="30" step="1" class="control-range">
      <span class="panel-value">{{ fps }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="loop">
        <span>循环</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="nearest">
        <span>像素风</span>
      </label>
      <span class="panel-label">帧:</span>
      <span class="panel-value">{{ frame + 1 }}/{{ totalFrames }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const fps = ref(12)
const loop = ref(true)
const nearest = ref(false)
const playing = ref(true)
const frame = ref(0)

const totalFrames = 32
const atlasCols = 8
const atlasRows = 4

let scene, camera, renderer, animationId, controls
let clock
let atlasTexture
let cardMesh
let backgroundMesh
let accum = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createAtlasTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size * atlasCols
  canvas.height = size * atlasRows
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < totalFrames; i++) {
    const col = i % atlasCols
    const row = Math.floor(i / atlasCols)
    const x0 = col * size
    const y0 = row * size

    ctx.clearRect(x0, y0, size, size)

    const hue = (i / totalFrames) * 320
    const baseColor = `hsl(${hue}, 90%, 60%)`

    const grad = ctx.createRadialGradient(x0 + size / 2, y0 + size / 2, 6, x0 + size / 2, y0 + size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.85)')
    grad.addColorStop(0.25, baseColor.replace('hsl', 'hsla').replace(')', ', 0.7)'))
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x0 + size / 2, y0 + size / 2, size * (0.28 + 0.12 * Math.sin(i * 0.35)), 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), x0 + size / 2, y0 + size / 2)

    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 3
    ctx.strokeRect(x0 + 6, y0 + 6, size - 12, size - 12)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1 / atlasCols, 1 / atlasRows)
  texture.offset.set(0, 1 - 1 / atlasRows)
  return texture
}

function applyFrame() {
  if (!atlasTexture) return
  const i = ((frame.value % totalFrames) + totalFrames) % totalFrames
  const col = i % atlasCols
  const row = Math.floor(i / atlasCols)
  atlasTexture.offset.x = col / atlasCols
  atlasTexture.offset.y = 1 - (row + 1) / atlasRows
  atlasTexture.needsUpdate = true
}

function applyFiltering() {
  if (!atlasTexture) return
  if (nearest.value) {
    atlasTexture.generateMipmaps = false
    atlasTexture.minFilter = THREE.NearestFilter
    atlasTexture.magFilter = THREE.NearestFilter
  } else {
    atlasTexture.generateMipmaps = true
    atlasTexture.minFilter = THREE.LinearMipmapLinearFilter
    atlasTexture.magFilter = THREE.LinearFilter
  }
  atlasTexture.needsUpdate = true
}

function togglePlay() {
  playing.value = !playing.value
}

function reset() {
  frame.value = 0
  accum = 0
  applyFrame()
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 120)
  camera.position.set(0, 3.5, 9)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65)
  directionalLight.position.set(10, 18, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const backGeometry = new THREE.TorusKnotGeometry(1.2, 0.45, 160, 24)
  const backMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, roughness: 0.35, metalness: 0.55 })
  backgroundMesh = new THREE.Mesh(backGeometry, backMaterial)
  backgroundMesh.position.set(0, 2, -2.5)
  scene.add(backgroundMesh)

  atlasTexture = createAtlasTexture()
  applyFiltering()

  const cardGeometry = new THREE.PlaneGeometry(4, 4)
  const cardMaterial = new THREE.MeshBasicMaterial({
    map: atlasTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  cardMesh = new THREE.Mesh(cardGeometry, cardMaterial)
  cardMesh.position.set(0, 2.2, 0.5)
  scene.add(cardMesh)

  applyFrame()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()

  if (backgroundMesh) {
    backgroundMesh.rotation.x += delta * 0.15
    backgroundMesh.rotation.y += delta * 0.25
  }

  if (playing.value) {
    const dt = Math.min(delta, 0.2)
    accum += dt
    const frameTime = 1 / Math.max(1, fps.value)
    if (accum >= frameTime) {
      const step = Math.floor(accum / frameTime)
      accum -= step * frameTime
      const next = frame.value + step
      if (loop.value) {
        frame.value = next % totalFrames
      } else {
        frame.value = Math.min(next, totalFrames - 1)
        if (frame.value === totalFrames - 1) playing.value = false
      }
      applyFrame()
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
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  cardMesh?.geometry?.dispose?.()
  cardMesh?.material?.dispose?.()
  backgroundMesh?.geometry?.dispose?.()
  backgroundMesh?.material?.dispose?.()
  atlasTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch(nearest, applyFiltering)
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
.panel-value { color: white; font-weight: 700; min-width: 60px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
