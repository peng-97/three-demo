<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">曲线:</span>
      <select v-model="curveType" class="control-select">
        <option value="heart">心形</option>
        <option value="helix">螺旋</option>
        <option value="sine">波浪</option>
        <option value="knot">结</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="showTube">
        <span>管道</span>
      </label>
      <span class="panel-label">采样:</span>
      <input type="range" v-model="segments" min="80" max="1200" step="20" class="control-range">
      <span class="panel-value">{{ segments }}</span>
      <span class="panel-label">配色:</span>
      <select v-model="palette" class="control-select">
        <option value="cool">冷色</option>
        <option value="warm">暖色</option>
        <option value="rainbow">彩虹</option>
      </select>
      <span class="panel-label">半径:</span>
      <input type="range" v-model="tubeRadius" min="0.05" max="0.5" step="0.01" class="control-range" :disabled="!showTube">
      <span class="panel-value">{{ tubeRadius.toFixed(2) }}</span>
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
const curveType = ref('helix')
const showTube = ref(true)
const segments = ref(500)
const tubeRadius = ref(0.16)
const palette = ref('rainbow')
const speed = ref(1.2)
const playing = ref(true)

let scene, camera, renderer, animationId, controls
let currentMesh, movingSphere, clock
let activeCurve
let progress = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function paletteColor(t) {
  if (palette.value === 'cool') return new THREE.Color('#4ecdc4').lerp(new THREE.Color('#667eea'), t)
  if (palette.value === 'warm') return new THREE.Color('#ff4d6d').lerp(new THREE.Color('#ffd166'), t)
  const c = new THREE.Color()
  c.setHSL((t * 0.92) % 1, 0.85, 0.6)
  return c
}

function createCurve() {
  if (curveType.value === 'heart') {
    const pts = []
    const n = 240
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = 16 * Math.pow(Math.sin(a), 3)
      const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
      pts.push(new THREE.Vector3(x * 0.18, (y * 0.18) / 2.2 + 2, 0))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.2)
  }

  if (curveType.value === 'sine') {
    const pts = []
    const n = 260
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const x = (t - 0.5) * 18
      const y = 2 + Math.sin(t * Math.PI * 6) * 2.2
      const z = Math.cos(t * Math.PI * 4) * 4
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
  }

  if (curveType.value === 'knot') {
    const pts = []
    const n = 520
    const R = 6
    const r = 2.2
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2
      const x = (R + r * Math.cos(3 * t)) * Math.cos(2 * t)
      const z = (R + r * Math.cos(3 * t)) * Math.sin(2 * t)
      const y = 2 + r * Math.sin(3 * t)
      pts.push(new THREE.Vector3(x * 0.6, y * 0.6, z * 0.6))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.4)
  }

  const pts = []
  const turns = 3
  const n = 520
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const angle = t * Math.PI * 2 * turns
    const radius = 5
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = 2 + (t - 0.5) * 9
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
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

  activeCurve = createCurve()

  if (showTube.value) {
    const geom = new THREE.TubeGeometry(activeCurve, Math.max(80, Math.floor(segments.value / 2)), tubeRadius.value, 18, activeCurve.closed)
    const uv = geom.attributes.uv
    const colors = new Float32Array(geom.attributes.position.count * 3)
    for (let i = 0; i < geom.attributes.position.count; i++) {
      const t = uv.getX(i)
      const c = paletteColor(t)
      const i3 = i * 3
      colors[i3 + 0] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 })
    currentMesh = new THREE.Mesh(geom, mat)
  } else {
    const pts = activeCurve.getPoints(segments.value)
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const colors = new Float32Array(pts.length * 3)
    for (let i = 0; i < pts.length; i++) {
      const t = i / Math.max(1, pts.length - 1)
      const c = paletteColor(t)
      const i3 = i * 3
      colors[i3 + 0] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.LineBasicMaterial({ vertexColors: true })
    currentMesh = new THREE.Line(geom, mat)
  }
  scene.add(currentMesh)

  movingSphere.position.copy(activeCurve.getPointAt(progress))
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
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 10, 18)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  const sphereGeom = new THREE.SphereGeometry(0.3, 32, 32)
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b })
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
  }

  if (activeCurve) movingSphere.position.copy(activeCurve.getPointAt(progress))
  controls.update()
  renderer.render(scene, camera)
}

watch([curveType, showTube, segments, palette, tubeRadius], rebuild)
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
