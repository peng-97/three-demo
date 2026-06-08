<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="showTube">
        <span>管道</span>
      </label>
      <span class="panel-label">采样:</span>
      <input type="range" v-model="segments" min="80" max="1200" step="20" class="control-range">
      <span class="panel-value">{{ segments }}</span>
      <span class="panel-label">半径:</span>
      <input type="range" v-model="tubeRadius" min="0.05" max="0.5" step="0.01" class="control-range" :disabled="!showTube">
      <span class="panel-value">{{ tubeRadius.toFixed(2) }}</span>
      <span class="panel-label">大小:</span>
      <input type="range" v-model="scale" min="0.08" max="0.35" step="0.01" class="control-range">
      <span class="panel-value">{{ scale.toFixed(2) }}</span>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="playing">
        <span>动画</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const showTube = ref(true)
const segments = ref(420)
const tubeRadius = ref(0.18)
const scale = ref(0.18)
const speed = ref(1.2)
const playing = ref(true)

let scene, camera, renderer, animationId, controls
let currentMesh, movingSphere, clock
let heartCurve
let progress = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createHeartCurvePoints(pointCount) {
  const pts = []
  for (let i = 0; i <= pointCount; i++) {
    const t = (i / pointCount) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push(new THREE.Vector3(x * scale.value, (y * scale.value) / 2.2 + 2, 0))
  }
  return pts
}

function createHeartCurve() {
  const pts = createHeartCurvePoints(Math.max(120, Math.floor(segments.value / 2)))
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.2)
  return curve
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

function rebuild() {
  if (currentMesh) {
    scene.remove(currentMesh)
    disposeObject(currentMesh)
    currentMesh = null
  }

  heartCurve = createHeartCurve()
  if (showTube.value) {
    const geom = new THREE.TubeGeometry(heartCurve, Math.max(80, Math.floor(segments.value / 2)), tubeRadius.value, 18, true)
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.55, metalness: 0.25 })
    currentMesh = new THREE.Mesh(geom, mat)
  } else {
    const points = heartCurve.getPoints(segments.value)
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color: 0xff4d6d })
    currentMesh = new THREE.LineLoop(geom, mat)
  }
  scene.add(currentMesh)

  const point = heartCurve.getPointAt(progress)
  movingSphere.position.copy(point)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(currentMesh)
  disposeObject(movingSphere)
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 6, 16)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const sphereGeom = new THREE.SphereGeometry(0.3, 32, 32)
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.35, metalness: 0.2 })
  movingSphere = new THREE.Mesh(sphereGeom, sphereMat)
  scene.add(movingSphere)

  rebuild()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const delta = clock.getDelta()
  if (playing.value && speed.value > 0) {
    progress = (progress + delta * speed.value * 0.08) % 1
    movingSphere.position.copy(heartCurve.getPointAt(progress))
  }

  controls.update()
  renderer.render(scene, camera)
}

watch([showTube, segments, tubeRadius, scale], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 50px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
