<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="play" class="control-btn">播放</button>
      <button @click="togglePause" class="control-btn" :disabled="!tween">{{ paused ? '继续' : '暂停' }}</button>
      <button @click="stop" class="control-btn" :disabled="!tween">停止</button>
      <button @click="reset" class="control-btn">重置</button>
      <label class="control-check">
        <input type="checkbox" v-model="loop">
        <span>循环</span>
      </label>
      <span class="panel-label">时长:</span>
      <input type="range" v-model="duration" min="1000" max="15000" step="250" class="control-range">
      <span class="panel-value">{{ duration }}ms</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const duration = ref(6000)
const loop = ref(true)
const paused = ref(false)

let scene, camera, renderer, animationId, controls
let clock
let tween = null
let virtualTime = 0
let curve, targetCurve
let cameraHomePos, targetHome

function disposeScene() {
  if (!scene) return
  const geometries = new Set()
  const materials = new Set()
  scene.traverse((o) => {
    if (o.isMesh || o.isLine) {
      if (o.geometry) geometries.add(o.geometry)
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.filter(Boolean).forEach((m) => materials.add(m))
    }
  })
  geometries.forEach((g) => g.dispose?.())
  materials.forEach((m) => m.dispose?.())
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  stop()
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  disposeScene()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 400)
  camera.position.set(18, 14, 22)
  camera.lookAt(0, 4, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(80, 40, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 4, 0)

  const groundGeometry = new THREE.PlaneGeometry(80, 80)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 18)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.45, metalness: 0.2 })
  const positions = [
    new THREE.Vector3(-18, 4, -18),
    new THREE.Vector3(18, 4, -18),
    new THREE.Vector3(18, 4, 18),
    new THREE.Vector3(-18, 4, 18),
    new THREE.Vector3(0, 4, 0)
  ]
  positions.forEach((p, i) => {
    const m = new THREE.Mesh(pillarGeo.clone(), pillarMat.clone())
    m.position.copy(p)
    m.material.color = new THREE.Color().setHSL(i / positions.length, 0.85, 0.55)
    scene.add(m)
  })

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

  curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(18, 14, 22),
      new THREE.Vector3(-22, 10, 16),
      new THREE.Vector3(-18, 12, -22),
      new THREE.Vector3(22, 10, -16),
      new THREE.Vector3(18, 14, 22)
    ],
    true,
    'catmullrom',
    0.35
  )
  targetCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 4, 0),
      new THREE.Vector3(-18, 4, -18),
      new THREE.Vector3(18, 4, -18),
      new THREE.Vector3(18, 4, 18),
      new THREE.Vector3(-18, 4, 18),
      new THREE.Vector3(0, 4, 0)
    ],
    true,
    'catmullrom',
    0.4
  )

  cameraHomePos = camera.position.clone()
  targetHome = controls.target.clone()

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(400)),
    new THREE.LineBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.25 })
  )
  scene.add(line)
}

function applyAt(k) {
  const pos = curve.getPointAt(k)
  const target = targetCurve.getPointAt(k)
  camera.position.copy(pos)
  controls.target.copy(target)
  controls.update()
}

function play() {
  stop()
  paused.value = false
  virtualTime = 0

  const data = { k: 0 }
  tween = new TWEEN.Tween(data)
    .to({ k: 1 }, duration.value)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => applyAt(data.k))
    .onComplete(() => {
      tween = null
      if (loop.value) play()
    })
  tween.start(0)
}

function togglePause() {
  if (!tween) return
  paused.value = !paused.value
}

function stop() {
  if (tween) tween.stop()
  tween = null
  TWEEN.removeAll()
  virtualTime = 0
}

function reset() {
  stop()
  paused.value = false
  camera.position.copy(cameraHomePos)
  controls.target.copy(targetHome)
  controls.update()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (tween && !paused.value) {
    virtualTime += delta * 1000
    TWEEN.update(virtualTime)
  }
  controls.update()
  renderer.render(scene, camera)
}

watch(duration, () => {
  if (tween) play()
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
.control-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 70px; text-align: right; }
.control-range { width: 140px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
