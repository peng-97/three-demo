<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">线宽:</span>
      <input type="range" v-model="linewidth" min="1" max="20" step="1" class="control-range">
      <span class="panel-value">{{ linewidth }}</span>
      <span class="panel-label">尾长:</span>
      <input type="range" v-model="trailLength" min="0.02" max="0.6" step="0.01" class="control-range">
      <span class="panel-value">{{ trailLength.toFixed(2) }}</span>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="showBase">
        <span>显示轨迹</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

const container = ref(null)
const linewidth = ref(8)
const trailLength = ref(0.25)
const speed = ref(1.2)
const showBase = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let baseLine, flyLine
let baseMat, flyMat
let curvePoints = []
let head = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  const res = new THREE.Vector2(clientWidth, clientHeight)
  if (baseMat) baseMat.resolution.copy(res)
  if (flyMat) flyMat.resolution.copy(res)
}

function createCurvePoints() {
  const pts = []
  const n = 700
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = (t - 0.5) * 26
    const y = 2 + Math.sin(t * Math.PI * 8) * 2.2
    const z = Math.cos(t * Math.PI * 4) * 6
    pts.push(new THREE.Vector3(x, y, z))
  }
  return pts
}

function disposeLine(line) {
  if (!line) return
  line.geometry?.dispose?.()
  line.material?.dispose?.()
}

function rebuild() {
  if (baseLine) {
    scene.remove(baseLine)
    disposeLine(baseLine)
    baseLine = null
  }
  if (flyLine) {
    scene.remove(flyLine)
    disposeLine(flyLine)
    flyLine = null
  }

  curvePoints = createCurvePoints()
  const positions = []
  curvePoints.forEach((p) => positions.push(p.x, p.y, p.z))

  const baseGeo = new LineGeometry()
  baseGeo.setPositions(positions)
  baseMat = new LineMaterial({
    color: 0x667eea,
    linewidth: linewidth.value,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  })
  baseMat.resolution.set(container.value.clientWidth, container.value.clientHeight)
  baseLine = new Line2(baseGeo, baseMat)
  baseLine.computeLineDistances()
  baseLine.visible = showBase.value
  scene.add(baseLine)

  const flyGeo = new LineGeometry()
  const flyPos = new Float32Array(3 * 200)
  flyGeo.setPositions(flyPos)
  flyMat = new LineMaterial({
    color: 0x00ffff,
    linewidth: linewidth.value,
    transparent: true,
    opacity: 1,
    depthWrite: false
  })
  flyMat.resolution.set(container.value.clientWidth, container.value.clientHeight)
  flyLine = new Line2(flyGeo, flyMat)
  flyLine.computeLineDistances()
  scene.add(flyLine)

  head = 0
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeLine(baseLine)
  disposeLine(flyLine)
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 12, 26)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const gridHelper = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  clock = new THREE.Clock()
  rebuild()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const ptsCount = curvePoints.length
  if (ptsCount > 2) {
    if (speed.value > 0) head = (head + delta * speed.value * 0.12) % 1
    const seg = Math.max(0.02, trailLength.value)
    const start = head - seg < 0 ? head - seg + 1 : head - seg
    const steps = 200
    const flyPositions = []
    for (let i = 0; i < steps; i++) {
      const tt = (start + (i / (steps - 1)) * seg) % 1
      const idx = Math.floor(tt * (ptsCount - 1))
      const tL = tt * (ptsCount - 1) - idx
      const a = curvePoints[idx]
      const b = curvePoints[Math.min(idx + 1, ptsCount - 1)]
      flyPositions.push(
        a.x + (b.x - a.x) * tL,
        a.y + (b.y - a.y) * tL,
        a.z + (b.z - a.z) * tL
      )
    }
    flyLine.geometry.setPositions(flyPositions)
    flyLine.computeLineDistances()
  }

  if (baseMat) baseMat.linewidth = linewidth.value
  if (flyMat) flyMat.linewidth = linewidth.value
  if (baseLine) baseLine.visible = showBase.value

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
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
