<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="stats-overlay">
      <pre class="stats-pre">{{ stats }}</pre>
    </div>
    <div class="control-panel">
      <span class="panel-label">重复:</span>
      <input type="range" v-model="repeat" min="0" max="8" step="1" class="control-range">
      <span class="panel-value">{{ repeat }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="yoyo">
        <span>yoyo</span>
      </label>
      <button @click="start" class="control-btn">开始</button>
      <button @click="stop" class="control-btn">停止</button>
      <button @click="reset" class="control-btn">重置计数</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

const container = ref(null)
const repeat = ref(2)
const yoyo = ref(true)

const counters = ref({
  onStart: 0,
  onUpdate: 0,
  onRepeat: 0,
  onComplete: 0,
  onStop: 0
})
const lastK = ref(0)

const stats = computed(() => {
  const c = counters.value
  return [
    `onStart: ${c.onStart}`,
    `onUpdate: ${c.onUpdate}`,
    `onRepeat: ${c.onRepeat}`,
    `onComplete: ${c.onComplete}`,
    `onStop: ${c.onStop}`,
    `k: ${lastK.value.toFixed(3)}`
  ].join('\n')
})

let scene, camera, renderer, animationId, controls
let mesh, clock
let tween = null
let virtualTime = 0

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
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

  const geometry = new THREE.TorusKnotGeometry(2.2, 0.7, 180, 16)
  const material = new THREE.MeshStandardMaterial({ color: 0x667eea, roughness: 0.35, metalness: 0.25 })
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 3
  scene.add(mesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    const delta = clock.getDelta()
    if (tween) {
      virtualTime += delta * 1000
      TWEEN.update(virtualTime)
    }
    controls.update()
    renderer.render(scene, camera)
  }
  tick()
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
}

function reset() {
  counters.value = { onStart: 0, onUpdate: 0, onRepeat: 0, onComplete: 0, onStop: 0 }
  lastK.value = 0
}

function start() {
  stop()
  reset()

  const data = { k: 0 }
  tween = new TWEEN.Tween(data)
    .to({ k: 1 }, 1600)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onStart(() => {
      counters.value.onStart++
    })
    .onUpdate(() => {
      counters.value.onUpdate++
      lastK.value = data.k
      mesh.rotation.y = data.k * Math.PI * 2
      mesh.position.x = (data.k - 0.5) * 10
    })
    .onRepeat(() => {
      counters.value.onRepeat++
    })
    .onComplete(() => {
      counters.value.onComplete++
    })
    .onStop(() => {
      counters.value.onStop++
    })

  tween.repeat(repeat.value)
  tween.yoyo(yoyo.value)
  virtualTime = 0
  tween.start(0)
}

function stop() {
  if (tween) tween.stop()
  tween = null
  TWEEN.removeAll()
  virtualTime = 0
}
</script>

<style scoped>
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.demo-container {
  flex: 1;
}
.stats-overlay {
  position: absolute;
  left: 12px;
  top: 12px;
  width: 160px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  pointer-events: none;
}
.stats-pre { margin: 0; white-space: pre-wrap; color: rgba(255, 255, 255, 0.9); font-size: 12px; line-height: 1.35; }
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
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
