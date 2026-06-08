<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="changeShape" class="control-btn">切换形状</button>
      <button @click="changeColor" class="control-btn">切换颜色</button>
      <button @click="toggleAnimation" class="control-btn">{{ animating ? '暂停漫游' : '开始漫游' }}</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0.2" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, controls
let pipeMesh
let pipeCurve
let curveLine
let clock
let progress = 0

let currentShapeIndex = 0
let currentColorIndex = 0
const animating = ref(true)
const speed = ref(1)

const curveFactories = [
  () => {
    const points = []
    const turns = 2
    const length = 80
    for (let i = 0; i <= length; i++) {
      const t = i / length
      const angle = t * Math.PI * 2 * turns
      const radius = 6
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          (t - 0.5) * 10,
          Math.sin(angle) * radius
        )
      )
    }
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
  },
  () => {
    const points = []
    const length = 120
    for (let i = 0; i <= length; i++) {
      const t = i / length
      const x = (t - 0.5) * 18
      const y = Math.sin(t * Math.PI * 4) * 2
      const z = Math.cos(t * Math.PI * 3) * 6
      points.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.6)
  },
  () => {
    const points = []
    const segments = 160
    const a = 8
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      const x = (a * Math.sin(t)) / (1 + Math.cos(t) * Math.cos(t))
      const z = (a * Math.sin(t) * Math.cos(t)) / (1 + Math.cos(t) * Math.cos(t))
      const y = Math.sin(t * 2) * 1.2
      points.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.4)
  }
]

const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  if (pipeMesh) {
    pipeMesh.geometry?.dispose?.()
    pipeMesh.material?.dispose?.()
  }
  if (curveLine) {
    curveLine.geometry?.dispose?.()
    curveLine.material?.dispose?.()
  }
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function buildPipe() {
  if (pipeMesh) {
    scene.remove(pipeMesh)
    pipeMesh.geometry.dispose()
    pipeMesh.material.dispose()
    pipeMesh = undefined
  }
  if (curveLine) {
    scene.remove(curveLine)
    curveLine.geometry.dispose()
    curveLine.material.dispose()
    curveLine = undefined
  }

  pipeCurve = curveFactories[currentShapeIndex]()
  const tubeGeometry = new THREE.TubeGeometry(pipeCurve, 300, 1.2, 18, pipeCurve.closed)
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color: colors[currentColorIndex],
    roughness: 0.55,
    metalness: 0.2,
    side: THREE.DoubleSide
  })
  pipeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
  scene.add(pipeMesh)

  const points = pipeCurve.getPoints(400)
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  curveLine = new THREE.Line(lineGeometry, lineMaterial)
  scene.add(curveLine)

  progress = 0
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.02, 200)
  camera.position.set(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enabled = false

  buildPipe()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function changeShape() {
  currentShapeIndex = (currentShapeIndex + 1) % curveFactories.length
  buildPipe()
}

function changeColor() {
  currentColorIndex = (currentColorIndex + 1) % colors.length
  if (pipeMesh) pipeMesh.material.color.setHex(colors[currentColorIndex])
}

function toggleAnimation() {
  animating.value = !animating.value
  controls.enabled = !animating.value
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (animating.value && pipeCurve) {
    progress = (progress + delta * speed.value * 0.06) % 1
    const p = pipeCurve.getPointAt(progress)
    const lookAt = pipeCurve.getPointAt((progress + 0.01) % 1)
    camera.position.copy(p)
    camera.lookAt(lookAt)
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
.panel-value { color: white; font-weight: 700; min-width: 40px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
</style>
