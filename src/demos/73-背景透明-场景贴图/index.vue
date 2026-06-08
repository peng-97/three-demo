<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">背景:</span>
      <select v-model="backgroundMode" class="control-select">
        <option value="transparent">透明</option>
        <option value="solid">纯色</option>
        <option value="texture">场景贴图</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="showSceneTexture">
        <span>显示场景贴图屏</span>
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
const backgroundMode = ref('transparent')
const showSceneTexture = ref(true)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let objects = []
let clock
let backgroundTexture
let renderTarget, screenPlane

function createBackgroundTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, '#0b1026')
  grad.addColorStop(0.6, '#1a1a2e')
  grad.addColorStop(1, '#e94560')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 1.2
    const a = 0.1 + Math.random() * 0.6
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function applyBackground() {
  if (!scene || !renderer) return
  if (backgroundMode.value === 'transparent') {
    scene.background = null
    renderer.setClearColor(0x000000, 0)
  } else if (backgroundMode.value === 'solid') {
    scene.background = new THREE.Color(0x1a1a2e)
    renderer.setClearColor(0x000000, 1)
  } else {
    scene.background = backgroundTexture
    renderer.setClearColor(0x000000, 1)
  }
}

function onResize() {
  if (!container.value || !renderer || !camera || !renderTarget) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  renderTarget.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  objects.forEach((m) => {
    m.geometry?.dispose?.()
    m.material?.dispose?.()
  })
  screenPlane?.geometry?.dispose?.()
  screenPlane?.material?.dispose?.()
  renderTarget?.dispose?.()
  backgroundTexture?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  backgroundTexture = createBackgroundTexture()

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 4, 12)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]
  const baseGeometries = [
    new THREE.TorusKnotGeometry(1.2, 0.45, 140, 24),
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.SphereGeometry(1.1, 32, 32)
  ]
  for (let i = 0; i < 16; i++) {
    const geometry = baseGeometries[Math.floor(Math.random() * baseGeometries.length)].clone()
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.45,
      metalness: 0.35
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set((Math.random() - 0.5) * 18, 1 + Math.random() * 5, (Math.random() - 0.5) * 18)
    scene.add(mesh)
    objects.push(mesh)
  }

  renderTarget = new THREE.WebGLRenderTarget(container.value.clientWidth, container.value.clientHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  })

  const screenGeom = new THREE.PlaneGeometry(5.2, 3)
  const screenMat = new THREE.MeshBasicMaterial({
    map: renderTarget.texture,
    transparent: true,
    opacity: 0.95
  })
  screenPlane = new THREE.Mesh(screenGeom, screenMat)
  screenPlane.position.set(-6.8, 3.2, 0)
  screenPlane.rotation.y = Math.PI / 8
  scene.add(screenPlane)

  applyBackground()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function toggleSpin() {
  spinning.value = !spinning.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    objects.forEach((m, i) => {
      m.rotation.y += delta * (0.2 + i * 0.01)
      m.rotation.x += delta * 0.06
    })
  }

  screenPlane.visible = showSceneTexture.value
  if (showSceneTexture.value) {
    screenPlane.visible = false
    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    screenPlane.visible = true
  }

  controls.update()
  renderer.render(scene, camera)
}

watch(backgroundMode, applyBackground)
watch(showSceneTexture, () => {
  if (screenPlane) screenPlane.visible = showSceneTexture.value
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
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.08) 0 12px, rgba(255, 255, 255, 0.02) 12px 24px),
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.10), transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08), transparent 45%),
    #0b1026;
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
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
