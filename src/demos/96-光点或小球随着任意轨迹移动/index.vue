<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">轨迹:</span>
      <select v-model="pathType" class="control-select">
        <option value="heart">心形</option>
        <option value="sine">波浪</option>
        <option value="helix">螺旋</option>
        <option value="random">随机</option>
      </select>
      <span class="panel-label">载体:</span>
      <select v-model="carrier" class="control-select">
        <option value="sprite">光点</option>
        <option value="sphere">小球</option>
      </select>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">尾迹:</span>
      <input type="range" v-model="trailPoints" min="10" max="500" step="10" class="control-range">
      <span class="panel-value">{{ trailPoints }}</span>
      <span class="panel-label">大小:</span>
      <input type="range" v-model="size" min="0.05" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ size.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="playing">
        <span>播放</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="showPath">
        <span>显示轨迹</span>
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
const carrier = ref('sprite')
const speed = ref(1.2)
const trailPoints = ref(180)
const size = ref(0.28)
const playing = ref(true)
const showPath = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let activeCurve
let progress = 0

let pathLine
let trailLine
let trailPositions
let trailWrite = 0

let sphereMesh
let sprite
let spriteTexture

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120)
  grad.addColorStop(0, 'rgba(255,255,255,0.95)')
  grad.addColorStop(0.2, 'rgba(0,255,255,0.6)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(128, 128, 120, 0, Math.PI * 2)
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createCurve() {
  if (pathType.value === 'heart') {
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

  if (pathType.value === 'random') {
    const pts = []
    const n = 18
    for (let i = 0; i < n; i++) {
      pts.push(new THREE.Vector3((Math.random() - 0.5) * 18, 1.5 + Math.random() * 7, (Math.random() - 0.5) * 18))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.65)
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

function rebuildPath() {
  activeCurve = createCurve()

  if (pathLine) {
    scene.remove(pathLine)
    disposeObject(pathLine)
    pathLine = null
  }
  const pts = activeCurve.getPoints(900)
  const geom = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color: 0x667eea, transparent: true, opacity: 0.35 })
  pathLine = activeCurve.closed ? new THREE.LineLoop(geom, mat) : new THREE.Line(geom, mat)
  pathLine.visible = showPath.value
  scene.add(pathLine)

  progress = 0
  resetTrail()
}

function resetTrail() {
  if (trailLine) {
    scene.remove(trailLine)
    disposeObject(trailLine)
    trailLine = null
  }

  const n = Math.max(10, trailPoints.value)
  trailPositions = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    trailPositions[i * 3 + 0] = 0
    trailPositions[i * 3 + 1] = 2
    trailPositions[i * 3 + 2] = 0
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
  trailLine = new THREE.Line(geom, mat)
  scene.add(trailLine)
  trailWrite = 0
}

function rebuildCarrier() {
  if (sphereMesh) {
    scene.remove(sphereMesh)
    disposeObject(sphereMesh)
    sphereMesh = null
  }
  if (sprite) {
    scene.remove(sprite)
    sprite.material?.dispose?.()
    sprite = null
  }

  if (!spriteTexture) spriteTexture = createGlowTexture()

  if (carrier.value === 'sphere') {
    const geom = new THREE.SphereGeometry(1, 28, 28)
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.35, metalness: 0.15, emissive: 0x00ffff, emissiveIntensity: 0.35 })
    sphereMesh = new THREE.Mesh(geom, mat)
    sphereMesh.scale.setScalar(size.value)
    scene.add(sphereMesh)
  } else {
    const mat = new THREE.SpriteMaterial({
      map: spriteTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    sprite = new THREE.Sprite(mat)
    sprite.scale.setScalar(size.value * 3.2)
    scene.add(sprite)
  }
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeObject(pathLine)
  disposeObject(trailLine)
  disposeObject(sphereMesh)
  sprite?.material?.dispose?.()
  spriteTexture?.dispose?.()
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
  rebuildPath()
  rebuildCarrier()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()

  if (playing.value && speed.value > 0) {
    progress = (progress + delta * speed.value * 0.1) % 1
  }

  if (activeCurve) {
    const p = activeCurve.getPointAt(progress)
    if (sphereMesh) sphereMesh.position.copy(p)
    if (sprite) sprite.position.copy(p)

    const n = trailPositions.length / 3
    if (n > 0) {
      const i3 = (trailWrite % n) * 3
      trailPositions[i3 + 0] = p.x
      trailPositions[i3 + 1] = p.y
      trailPositions[i3 + 2] = p.z
      trailWrite++
      trailLine.geometry.attributes.position.needsUpdate = true
    }
  }

  if (sphereMesh) sphereMesh.scale.setScalar(size.value)
  if (sprite) sprite.scale.setScalar(size.value * 3.2)
  if (pathLine) pathLine.visible = showPath.value

  controls.update()
  renderer.render(scene, camera)
}

watch([pathType], rebuildPath)
watch([trailPoints], resetTrail)
watch([carrier], rebuildCarrier)
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
