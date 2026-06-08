<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">数量:</span>
      <input type="range" v-model="count" min="20" max="1200" step="20" class="control-range">
      <span class="panel-value">{{ count }}</span>
      <span class="panel-label">延迟:</span>
      <input type="range" v-model="stagger" min="0" max="40" step="1" class="control-range">
      <span class="panel-value">{{ stagger }}ms</span>
      <span class="panel-label">时长:</span>
      <input type="range" v-model="duration" min="200" max="4000" step="50" class="control-range">
      <span class="panel-value">{{ duration }}ms</span>
      <label class="control-check">
        <input type="checkbox" v-model="yoyo">
        <span>yoyo</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="repeat">
        <span>repeat</span>
      </label>
      <button @click="start" class="control-btn">开始</button>
      <button @click="stop" class="control-btn">停止</button>
      <button @click="rebuild" class="control-btn">重建</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const count = ref(300)
const stagger = ref(6)
const duration = ref(1200)
const yoyo = ref(true)
const repeat = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let group
let objects = []
let tweens = []

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
  objects.forEach((o) => {
    o.geometry?.dispose?.()
    o.material?.dispose?.()
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 18, 30)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(60, 60, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)

  group = new THREE.Group()
  scene.add(group)

  clock = new THREE.Clock()
  rebuild()
  window.addEventListener('resize', onResize)
}

function rebuild() {
  stop()
  objects.forEach((o) => {
    group.remove(o)
    o.geometry?.dispose?.()
    o.material?.dispose?.()
  })
  objects = []

  const n = count.value
  const cols = Math.ceil(Math.sqrt(n))
  const spacing = 1.8
  const startX = -((cols - 1) * spacing) / 2
  const startZ = -((cols - 1) * spacing) / 2

  for (let i = 0; i < n; i++) {
    const x = startX + (i % cols) * spacing
    const z = startZ + Math.floor(i / cols) * spacing
    const geometry = new THREE.SphereGeometry(0.45, 16, 16)
    const color = new THREE.Color().setHSL((i / n) * 0.9, 0.85, 0.6)
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, 0.45, z)
    mesh.userData.baseY = mesh.position.y
    objects.push(mesh)
    group.add(mesh)
  }
}

function start() {
  stop()
  tweens = []
  const base = { k: 0 }
  objects.forEach((o, idx) => {
    const t = new TWEEN.Tween(base)
      .to({ k: 1 }, duration.value)
      .delay(idx * stagger.value)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        const k = base.k
        o.position.y = o.userData.baseY + k * 6
        o.rotation.y = k * Math.PI * 2
      })
    if (yoyo.value) t.yoyo(true)
    if (repeat.value) t.repeat(Infinity)
    t.start()
    tweens.push(t)
  })
}

function stop() {
  tweens.forEach((t) => t.stop())
  tweens = []
  TWEEN.removeAll()
  objects.forEach((o) => {
    o.position.y = o.userData.baseY ?? 0.45
    o.rotation.set(0, 0, 0)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  TWEEN.update()
  group.rotation.y += delta * 0.08
  controls.update()
  renderer.render(scene, camera)
}

watch([count], rebuild)
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
