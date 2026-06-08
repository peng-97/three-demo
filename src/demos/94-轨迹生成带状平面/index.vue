<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">轨迹:</span>
      <select v-model="pathType" class="control-select">
        <option value="sine">波浪</option>
        <option value="helix">螺旋</option>
        <option value="loop">闭合</option>
      </select>
      <span class="panel-label">宽度:</span>
      <input type="range" v-model="width" min="0.2" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ width.toFixed(1) }}</span>
      <span class="panel-label">采样:</span>
      <input type="range" v-model="segments" min="40" max="1600" step="20" class="control-range">
      <span class="panel-value">{{ segments }}</span>
      <span class="panel-label">流速:</span>
      <input type="range" v-model="flowSpeed" min="0" max="4" step="0.1" class="control-range">
      <span class="panel-value">{{ flowSpeed.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="showCenterLine">
        <span>中心线</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const pathType = ref('sine')
const width = ref(2.6)
const segments = ref(600)
const flowSpeed = ref(1.2)
const wireframe = ref(false)
const showCenterLine = ref(true)

let scene, camera, renderer, animationId, controls
let ribbonMesh, ribbonMaterial, ribbonTexture
let centerLine
let clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createFlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
  grad.addColorStop(0, 'rgba(0,255,255,0)')
  grad.addColorStop(0.1, 'rgba(0,255,255,0.9)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.2)')
  grad.addColorStop(0.35, 'rgba(102,126,234,0.9)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.2)')
  grad.addColorStop(0.75, 'rgba(233,69,96,0.9)')
  grad.addColorStop(1, 'rgba(233,69,96,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 28; i++) {
    const x = Math.random() * canvas.width
    const w = 10 + Math.random() * 40
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`
    ctx.fillRect(x, 0, w, canvas.height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(6, 1)
  return texture
}

function createCurve() {
  if (pathType.value === 'helix') {
    const pts = []
    const turns = 2.8
    const n = 520
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const angle = t * Math.PI * 2 * turns
      const r = 6
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = 2 + (t - 0.5) * 10
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4)
  }

  if (pathType.value === 'loop') {
    const pts = []
    const n = 520
    const a = 7
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2
      const x = (a * Math.sin(t)) / (1 + Math.cos(t) * Math.cos(t))
      const z = (a * Math.sin(t) * Math.cos(t)) / (1 + Math.cos(t) * Math.cos(t))
      const y = 2 + Math.sin(t * 2) * 1.6
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.45)
  }

  const pts = []
  const n = 520
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = (t - 0.5) * 26
    const y = 2 + Math.sin(t * Math.PI * 6) * 2.2
    const z = Math.cos(t * Math.PI * 4) * 6
    pts.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35)
}

function disposeObject(obj) {
  if (!obj) return
  obj.geometry?.dispose?.()
  obj.material?.dispose?.()
}

function buildRibbonGeometry(curve, sampleCount) {
  const pts = curve.getPoints(sampleCount)
  const n = pts.length
  const positions = new Float32Array(n * 2 * 3)
  const uvs = new Float32Array(n * 2 * 2)
  const colors = new Float32Array(n * 2 * 3)
  const indices = []

  const upA = new THREE.Vector3(0, 1, 0)
  const upB = new THREE.Vector3(1, 0, 0)
  const tangent = new THREE.Vector3()
  const side = new THREE.Vector3()
  const colorA = new THREE.Color('#00ffff')
  const colorB = new THREE.Color('#6c5ce7')
  const colorC = new THREE.Color('#ff4d6d')
  const c = new THREE.Color()

  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1)
    curve.getTangentAt(t, tangent)
    side.crossVectors(upA, tangent)
    if (side.lengthSq() < 1e-6) side.crossVectors(upB, tangent)
    side.normalize().multiplyScalar(width.value * 0.5)

    const p = pts[i]
    const left = new THREE.Vector3().copy(p).add(side)
    const right = new THREE.Vector3().copy(p).sub(side)

    const i6 = i * 6
    positions[i6 + 0] = left.x
    positions[i6 + 1] = left.y
    positions[i6 + 2] = left.z
    positions[i6 + 3] = right.x
    positions[i6 + 4] = right.y
    positions[i6 + 5] = right.z

    const i4 = i * 4
    uvs[i4 + 0] = t
    uvs[i4 + 1] = 0
    uvs[i4 + 2] = t
    uvs[i4 + 3] = 1

    if (t < 0.5) c.copy(colorA).lerp(colorB, t / 0.5)
    else c.copy(colorB).lerp(colorC, (t - 0.5) / 0.5)

    const i6c = i * 6
    colors[i6c + 0] = c.r
    colors[i6c + 1] = c.g
    colors[i6c + 2] = c.b
    colors[i6c + 3] = c.r
    colors[i6c + 4] = c.g
    colors[i6c + 5] = c.b
  }

  for (let i = 0; i < n - 1; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const cIdx = (i + 1) * 2
    const d = (i + 1) * 2 + 1
    indices.push(a, b, cIdx, b, d, cIdx)
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return { geom, pts }
}

function rebuild() {
  const curve = createCurve()

  if (ribbonMesh) {
    scene.remove(ribbonMesh)
    disposeObject(ribbonMesh)
    ribbonMesh = null
  }
  if (centerLine) {
    scene.remove(centerLine)
    disposeObject(centerLine)
    centerLine = null
  }

  const { geom, pts } = buildRibbonGeometry(curve, Math.max(20, segments.value))

  if (!ribbonTexture) ribbonTexture = createFlowTexture()
  if (!ribbonMaterial) {
    ribbonMaterial = new THREE.MeshBasicMaterial({
      map: ribbonTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }
  ribbonMaterial.wireframe = wireframe.value

  ribbonMesh = new THREE.Mesh(geom, ribbonMaterial)
  scene.add(ribbonMesh)

  const lineGeom = new THREE.BufferGeometry().setFromPoints(pts)
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  centerLine = new THREE.Line(lineGeom, lineMat)
  centerLine.visible = showCenterLine.value
  scene.add(centerLine)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(ribbonMesh)
  disposeObject(centerLine)
  ribbonTexture?.dispose?.()
  ribbonMaterial?.dispose?.()
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
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
  if (ribbonTexture && flowSpeed.value > 0) {
    ribbonTexture.offset.x = (ribbonTexture.offset.x + delta * flowSpeed.value * 0.15) % 1
  }
  if (ribbonMaterial) ribbonMaterial.wireframe = wireframe.value
  if (centerLine) centerLine.visible = showCenterLine.value
  controls.update()
  renderer.render(scene, camera)
}

watch([pathType, width, segments], rebuild)
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
.panel-value { color: white; font-weight: 700; min-width: 52px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
