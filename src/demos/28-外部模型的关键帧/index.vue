<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleAnimation" class="control-btn">{{ isPlaying ? '暂停' : '播放' }}</button>
      <button @click="resetAnimation" class="control-btn">重置</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="speed" min="0.1" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ speed.toFixed(1) }}</span>
      <span class="panel-label">当前轨道: {{ currentTrack }}</span>
      <button @click="switchTrack" class="control-btn">切换轨道</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const isPlaying = ref(false)
const speed = ref(1)
const currentTrack = ref('轨道 1')

let scene, camera, renderer, animationId, controls
let modelGroup, tracks, currentTrackIndex, clock, lineHelpers

function createRobotModel() {
  const group = new THREE.Group()
  
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.5, roughness: 0.4 })
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, metalness: 0.5, roughness: 0.4 })
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.5, roughness: 0.4 })
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0xf9ca24, metalness: 0.5, roughness: 0.4 })
  
  const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8)
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 1.5
  group.add(body)
  
  const headGeometry = new THREE.SphereGeometry(0.5, 32, 32)
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 2.9
  group.add(head)
  
  const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16)
  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.9, 1.8, 0)
  leftArm.rotation.z = Math.PI / 4
  group.add(leftArm)
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.9, 1.8, 0)
  rightArm.rotation.z = -Math.PI / 4
  group.add(rightArm)
  
  const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.4, 16)
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-0.4, 0.4, 0)
  group.add(leftLeg)
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(0.4, 0.4, 0)
  group.add(rightLeg)
  
  return group
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(8, 6, 12)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)

  modelGroup = createRobotModel()
  scene.add(modelGroup)

  tracks = [
    {
      name: '轨道 1',
      keyframes: [
        { time: 0, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 1.5, position: new THREE.Vector3(4, 1, 0), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: new THREE.Vector3(1.2, 1.2, 1.2) },
        { time: 3, position: new THREE.Vector3(0, 0, 4), rotation: new THREE.Euler(0, Math.PI, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 4.5, position: new THREE.Vector3(-4, 1, 0), rotation: new THREE.Euler(0, -Math.PI / 2, 0), scale: new THREE.Vector3(0.8, 0.8, 0.8) },
        { time: 6, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) }
      ],
      color: 0x667eea
    },
    {
      name: '轨道 2',
      keyframes: [
        { time: 0, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 1, position: new THREE.Vector3(3, 3, 0), rotation: new THREE.Euler(Math.PI / 4, Math.PI / 4, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 2, position: new THREE.Vector3(0, 5, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0), scale: new THREE.Vector3(0.7, 0.7, 0.7) },
        { time: 3, position: new THREE.Vector3(-3, 3, 0), rotation: new THREE.Euler(Math.PI / 4, -Math.PI / 4, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 4, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) }
      ],
      color: 0xff6b6b
    },
    {
      name: '轨道 3',
      keyframes: [
        { time: 0, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 0.8, position: new THREE.Vector3(3, 0, 3), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: new THREE.Vector3(1.3, 1.3, 1.3) },
        { time: 1.6, position: new THREE.Vector3(0, 0, -3), rotation: new THREE.Euler(0, Math.PI, 0), scale: new THREE.Vector3(1, 1, 1) },
        { time: 2.4, position: new THREE.Vector3(-3, 0, 3), rotation: new THREE.Euler(0, -Math.PI / 2, 0), scale: new THREE.Vector3(0.6, 0.6, 0.6) },
        { time: 3.2, position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) }
      ],
      color: 0x4ecdc4
    }
  ]
  currentTrackIndex = 0

  clock = new THREE.Clock()

  drawTrackLines()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)
}

function drawTrackLines() {
  lineHelpers?.forEach(line => scene.remove(line))
  lineHelpers = []

  tracks.forEach((track, idx) => {
    if (idx !== currentTrackIndex) return
    
    const points = track.keyframes.map(kf => kf.position)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: track.color, linewidth: 3 })
    const line = new THREE.LineLoop(geometry, material)
    scene.add(line)
    lineHelpers.push(line)
  })
}

function toggleAnimation() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    clock.start()
  }
}

function resetAnimation() {
  isPlaying.value = false
  applyFrame(0)
}

function switchTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length
  currentTrack.value = tracks[currentTrackIndex].name
  drawTrackLines()
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpVector3(a, b, t) {
  return new THREE.Vector3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t))
}

function lerpEuler(a, b, t) {
  return new THREE.Euler(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t))
}

function applyFrame(t) {
  const track = tracks[currentTrackIndex]
  let prevKeyframe = track.keyframes[0]
  let nextKeyframe = track.keyframes[1]
  
  for (let i = 0; i < track.keyframes.length - 1; i++) {
    if (t >= track.keyframes[i].time && t <= track.keyframes[i + 1].time) {
      prevKeyframe = track.keyframes[i]
      nextKeyframe = track.keyframes[i + 1]
      break
    }
  }
  
  const segmentDuration = nextKeyframe.time - prevKeyframe.time
  const localT = (t - prevKeyframe.time) / segmentDuration
  
  const position = lerpVector3(prevKeyframe.position, nextKeyframe.position, localT)
  const rotation = lerpEuler(prevKeyframe.rotation, nextKeyframe.rotation, localT)
  const scale = lerpVector3(prevKeyframe.scale, nextKeyframe.scale, localT)
  
  modelGroup.position.copy(position)
  modelGroup.rotation.copy(rotation)
  modelGroup.scale.copy(scale)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (isPlaying.value) {
    const track = tracks[currentTrackIndex]
    const duration = track.keyframes[track.keyframes.length - 1].time
    const elapsed = clock.getElapsedTime()
    const t = (elapsed * speed.value) % duration
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
