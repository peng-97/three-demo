<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">延迟:</span>
      <input type="range" v-model="delay" min="0" max="3000" step="50" class="control-range">
      <span class="panel-value">{{ delay }}ms</span>
      <span class="panel-label">重复:</span>
      <input type="range" v-model="repeat" min="0" max="10" step="1" class="control-range">
      <span class="panel-value">{{ repeat }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="yoyo">
        <span>yoyo</span>
      </label>
      <button @click="start" class="control-btn">开始</button>
      <button @click="pause" class="control-btn" :disabled="!tween">暂停</button>
      <button @click="resume" class="control-btn" :disabled="!tween">继续</button>
      <button @click="stop" class="control-btn" :disabled="!tween">停止</button>
      <button @click="reset" class="control-btn">重置</button>
      <span class="panel-label">状态:</span>
      <span class="panel-value">{{ state }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const delay = ref(600)
const repeat = ref(2)
const yoyo = ref(true)
const state = ref('idle')

let scene, camera, renderer, animationId, controls
let mesh, clock
let tween = null
let paused = false
let virtualTime = 0

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
  mesh?.geometry?.dispose?.()
  mesh?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 260)
  camera.position.set(0, 12, 22)
  camera.lookAt(0, 3, 0)

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
  controls.target.set(0, 3, 0)

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    roughness: 0.45,
    metalness: 0.2
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 1
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function start() {
  stop()
  state.value = 'running'
  const data = { k: 0 }
  tween = new TWEEN.Tween(data)
    .to({ k: 1 }, 1200)
    .delay(delay.value)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onStart(() => {
      state.value = 'running'
    })
    .onUpdate(() => {
      mesh.position.y = 1 + data.k * 6
      mesh.rotation.y = data.k * Math.PI * 2
    })
    .onComplete(() => {
      state.value = 'completed'
    })
  tween.yoyo(yoyo.value)
  tween.repeat(repeat.value)
  paused = false
  virtualTime = 0
  tween.start(0)
}

function pause() {
  if (!tween || paused) return
  paused = true
  state.value = 'paused'
}

function resume() {
  if (!tween || !paused) return
  paused = false
  state.value = 'running'
}

function stop() {
  if (tween) tween.stop()
  tween = null
  TWEEN.removeAll()
  paused = false
  virtualTime = 0
  if (state.value !== 'idle') state.value = 'stopped'
}

function reset() {
  stop()
  state.value = 'idle'
  mesh.position.y = 1
  mesh.rotation.set(0, 0, 0)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (tween && !paused) {
    virtualTime += delta * 1000
    TWEEN.update(virtualTime)
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
.control-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 86px; text-align: left; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
