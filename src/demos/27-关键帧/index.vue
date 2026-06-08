<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="playAnimation" class="control-btn">{{ isPlaying ? '暂停' : '播放' }}</button>
      <button @click="resetAnimation" class="control-btn">重置</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">进度: {{ Math.floor(progress * 100) }}%</span>
      <input type="range" v-model="progress" min="0" max="1" step="0.01" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const isPlaying = ref(false)
const speed = ref(1)
const progress = ref(0)

let scene, camera, renderer, animationId, controls
let mesh, clock, keyframes, duration

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
  const material = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.3, roughness: 0.5 })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  keyframes = [
    { time: 0, position: new THREE.Vector3(-5, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
    { time: 1, position: new THREE.Vector3(0, 3, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0), scale: new THREE.Vector3(1.5, 1.5, 1.5) },
    { time: 2, position: new THREE.Vector3(5, 0, 0), rotation: new THREE.Euler(Math.PI, Math.PI, 0), scale: new THREE.Vector3(1, 1, 1) },
    { time: 3, position: new THREE.Vector3(0, 0, 5), rotation: new THREE.Euler(0, Math.PI * 1.5, Math.PI / 2), scale: new THREE.Vector3(0.8, 0.8, 0.8) },
    { time: 4, position: new THREE.Vector3(-5, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) }
  ]
  duration = 4

  clock = new THREE.Clock()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function playAnimation() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    clock.start()
    clock.elapsedTime = progress.value * duration
  }
}

function resetAnimation() {
  isPlaying.value = false
  progress.value = 0
  applyFrame(0)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpVector3(a, b, t) {
  return new THREE.Vector3(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t)
  )
}

function lerpEuler(a, b, t) {
  return new THREE.Euler(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t)
  )
}

function applyFrame(t) {
  let prevKeyframe = keyframes[0]
  let nextKeyframe = keyframes[1]
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      prevKeyframe = keyframes[i]
      nextKeyframe = keyframes[i + 1]
      break
    }
  }
  
  const segmentDuration = nextKeyframe.time - prevKeyframe.time
  const localT = (t - prevKeyframe.time) / segmentDuration
  
  const position = lerpVector3(prevKeyframe.position, nextKeyframe.position, localT)
  const rotation = lerpEuler(prevKeyframe.rotation, nextKeyframe.rotation, localT)
  const scale = lerpVector3(prevKeyframe.scale, nextKeyframe.scale, localT)
  
  mesh.position.copy(position)
  mesh.rotation.copy(rotation)
  mesh.scale.copy(scale)
}

watch(progress, () => {
  if (!isPlaying.value) {
    applyFrame(progress.value * duration)
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (isPlaying.value) {
    const elapsed = clock.getElapsedTime()
    const t = (elapsed * speed.value) % duration
    progress.value = t / duration
    applyFrame(t)
  }
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  min-width: 50px;
}

.control-range {
  width: 100px;
  cursor: pointer;
}

.control-btn {
  padding: 10px 20px;
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
</style>
