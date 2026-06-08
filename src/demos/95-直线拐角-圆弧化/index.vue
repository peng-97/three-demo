<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">路径:</span>
      <select v-model="preset" class="control-select">
        <option value="poly">折线</option>
        <option value="zigzag">之字</option>
        <option value="rect">矩形</option>
      </select>
      <span class="panel-label">圆角半径:</span>
      <input type="range" v-model="radius" min="0" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ radius.toFixed(1) }}</span>
      <span class="panel-label">圆弧细分:</span>
      <input type="range" v-model="arcSegments" min="2" max="48" step="1" class="control-range">
      <span class="panel-value">{{ arcSegments }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="closed">
        <span>闭合</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="showOriginal">
        <span>原始折线</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const preset = ref('poly')
const radius = ref(2.2)
const arcSegments = ref(18)
const closed = ref(false)
const showOriginal = ref(true)
const spinning = ref(false)

let scene, camera, renderer, animationId, controls
let clock
let group
let originalLine
let roundedLine

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

function getPresetPoints() {
  if (preset.value === 'rect') {
    return [
      new THREE.Vector2(-10, -6),
      new THREE.Vector2(10, -6),
      new THREE.Vector2(10, 6),
      new THREE.Vector2(-10, 6)
    ]
  }
  if (preset.value === 'zigzag') {
    return [
      new THREE.Vector2(-12, -6),
      new THREE.Vector2(-6, 6),
      new THREE.Vector2(0, -6),
      new THREE.Vector2(6, 6),
      new THREE.Vector2(12, -6)
    ]
  }
  return [
    new THREE.Vector2(-12, -4),
    new THREE.Vector2(-6, 4),
    new THREE.Vector2(-2, -1),
    new THREE.Vector2(3, 6),
    new THREE.Vector2(10, 0)
  ]
}

function cross2(a, b) {
  return a.x * b.y - a.y * b.x
}

function roundPolyline(points2, r, seg, isClosed) {
  const pts = points2.slice()
  if (isClosed && pts.length >= 3) pts.push(pts[0], pts[1])
  const out = []

  const n = pts.length
  if (n < 3) return pts

  const addPoint = (p) => {
    const last = out[out.length - 1]
    if (!last || last.distanceTo(p) > 1e-6) out.push(p.clone())
  }

  addPoint(pts[0])

  const startIdx = 1
  const endIdx = isClosed ? n - 2 : n - 2

  for (let i = startIdx; i <= endIdx; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]

    const inDir = p0.clone().sub(p1).normalize()
    const outDir = p2.clone().sub(p1).normalize()

    const dot = THREE.MathUtils.clamp(inDir.dot(outDir), -1, 1)
    const theta = Math.acos(dot)

    if (!isFinite(theta) || theta < 1e-3 || Math.abs(Math.PI - theta) < 1e-3 || r <= 1e-6) {
      addPoint(p1)
      continue
    }

    const lenIn = p0.distanceTo(p1)
    const lenOut = p1.distanceTo(p2)
    const offset = Math.min(r / Math.tan(theta / 2), lenIn * 0.49, lenOut * 0.49)

    const start = p1.clone().add(inDir.clone().multiplyScalar(offset))
    const end = p1.clone().add(outDir.clone().multiplyScalar(offset))

    const bisector = inDir.clone().add(outDir).normalize()
    const distToCenter = r / Math.sin(theta / 2)
    const center = p1.clone().add(bisector.multiplyScalar(distToCenter))

    const turn = cross2(inDir, outDir)
    let a0 = Math.atan2(start.y - center.y, start.x - center.x)
    let a1 = Math.atan2(end.y - center.y, end.x - center.x)
    let delta = a1 - a0
    if (turn > 0 && delta < 0) delta += Math.PI * 2
    if (turn < 0 && delta > 0) delta -= Math.PI * 2

    addPoint(start)
    const steps = Math.max(2, seg)
    for (let s = 1; s < steps; s++) {
      const a = a0 + (delta * s) / steps
      addPoint(new THREE.Vector2(center.x + Math.cos(a) * r, center.y + Math.sin(a) * r))
    }
    addPoint(end)
  }

  if (!isClosed) addPoint(pts[n - 1])
  return out
}

function buildLine(points2, color, loop) {
  const pts3 = points2.map((p) => new THREE.Vector3(p.x, 2.2, p.y))
  const geometry = new THREE.BufferGeometry().setFromPoints(pts3)
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
  if (loop) return new THREE.LineLoop(geometry, material)
  return new THREE.Line(geometry, material)
}

function rebuild() {
  if (originalLine) {
    group.remove(originalLine)
    disposeObject(originalLine)
    originalLine = null
  }
  if (roundedLine) {
    group.remove(roundedLine)
    disposeObject(roundedLine)
    roundedLine = null
  }

  const base = getPresetPoints()
  const rounded = roundPolyline(base, radius.value, arcSegments.value, closed.value)

  originalLine = buildLine(base, 0xffffff, closed.value)
  originalLine.material.opacity = 0.25
  originalLine.visible = showOriginal.value
  group.add(originalLine)

  roundedLine = buildLine(rounded, 0x00ffff, closed.value)
  group.add(roundedLine)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(originalLine)
  disposeObject(roundedLine)
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 10, 24)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
  scene.add(ambientLight)

  const gridHelper = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2.2, 0)

  group = new THREE.Group()
  scene.add(group)

  rebuild()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    group.rotation.y += delta * 0.25
  }
  if (originalLine) originalLine.visible = showOriginal.value
  controls.update()
  renderer.render(scene, camera)
}

watch([preset, radius, arcSegments, closed], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 56px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
