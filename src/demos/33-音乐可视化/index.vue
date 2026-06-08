<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="togglePlay" class="control-btn">{{ isPlaying ? '停止' : '播放'}}</button>
      <span class="panel-label">可视化模式:</span>
      <button @click="prevMode" class="control-btn">&lt;</button>
      <span class="panel-value">{{ modes[modeIndex] }}</span>
      <button @click="nextMode" class="control-btn">&gt;</button>
      <span class="panel-label">缩放:</span>
      <input type="range" v-model="visualScale" min="0.5" max="3" step="0.1" class="control-range">
      <span class="panel-value">{{ visualScale.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const isPlaying = ref(false)
const modeIndex = ref(0)
const visualScale = ref(1.5)

const modes = ['柱状图', '波浪', '环形', '球体']

let scene, camera, renderer, animationId, controls
let audioContext, analyser, dataArray, source
let oscillatorNodes = [], gainNodes = []
let visualBars = [], visualRing = null, visualSphere = null
let clock

const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf, 0xc56cf0, 0xff9f43, 0x5f27cd]

function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  dataArray = new Uint8Array(analyser.frequencyBinCount)
  
  const gain = audioContext.createGain()
  gain.gain.value = 0.1
  gain.connect(analyser)
  analyser.connect(audioContext.destination)
  
  frequencies.forEach((freq, i) => {
    const osc = audioContext.createOscillator()
    const g = audioContext.createGain()
    osc.type = ['sine', 'square', 'sawtooth', 'triangle'][i % 4]
    osc.frequency.setValueAtTime(freq, audioContext.currentTime)
    osc.connect(g)
    g.connect(gain)
    g.gain.value = 0.15
    osc.start()
    oscillatorNodes.push(osc)
    gainNodes.push(g)
  })
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 20, 30)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 1, 100)
  pointLight.position.set(10, 20, 10)
  scene.add(pointLight)

  const gridHelper = new THREE.GridHelper(50, 50, 0x333366, 0x1a1a33)
  scene.add(gridHelper)
  
  createBars()
  createRing()
  createSphere()
  
  clock = new THREE.Clock()

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)
}

function createBars() {
  const barGroup = new THREE.Group()
  for (let i = 0; i < 64; i++) {
    const geo = new THREE.BoxGeometry(0.8, 0.1, 0.8)
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.5
    })
    const bar = new THREE.Mesh(geo, mat)
    const angle = (i / 64) * Math.PI * 2
    bar.position.x = Math.cos(angle) * 12
    bar.position.z = Math.sin(angle) * 12
    bar.position.y = 0.05
    bar.userData.index = i
    visualBars.push(bar)
    barGroup.add(bar)
  }
  barGroup.userData.type = 'bars'
  scene.add(barGroup)
}

function createRing() {
  const group = new THREE.Group()
  for (let i = 0; i < 128; i++) {
    const geo = new THREE.BoxGeometry(0.4, 0.1, 0.4)
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.5
    })
    const box = new THREE.Mesh(geo, mat)
    const angle = (i / 128) * Math.PI * 2
    box.position.x = Math.cos(angle) * 8
    box.position.z = Math.sin(angle) * 8
    box.position.y = 2
    box.userData.index = i
    group.add(box)
  }
  group.userData.type = 'ring'
  group.visible = false
  scene.add(group)
  visualRing = group
}

function createSphere() {
  const group = new THREE.Group()
  const radius = 6
  const segments = 12
  
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments * 2; lon++) {
      const phi = (lat / segments) * Math.PI
      const theta = (lon / (segments * 2)) * Math.PI * 2
      
      const geo = new THREE.BoxGeometry(0.5, 0.1, 0.5)
      const mat = new THREE.MeshStandardMaterial({
        color: colors[(lat + lon) % colors.length],
        emissive: colors[(lat + lon) % colors.length],
        emissiveIntensity: 0.4
      })
      const box = new THREE.Mesh(geo, mat)
      
      box.position.x = Math.sin(phi) * Math.cos(theta) * radius
      box.position.y = Math.cos(phi) * radius
      box.position.z = Math.sin(phi) * Math.sin(theta) * radius
      
      box.lookAt(0, 0, 0)
      box.userData.index = lat * segments * 2 + lon
      
      group.add(box)
    }
  }
  group.userData.type = 'sphere'
  group.visible = false
  scene.add(group)
  visualSphere = group
}

function togglePlay() {
  if (!audioContext) initAudio()
  
  isPlaying.value = !isPlaying.value
  
  if (isPlaying.value) {
    if (audioContext.state === 'suspended') audioContext.resume()
  }
}

function prevMode() {
  modeIndex.value = (modeIndex.value - 1 + modes.length) % modes.length
  updateModeVisibility()
}

function nextMode() {
  modeIndex.value = (modeIndex.value + 1) % modes.length
  updateModeVisibility()
}

function updateModeVisibility() {
  scene.traverse(obj => {
    if (obj.userData.type === 'bars') obj.visible = modeIndex.value === 0 || modeIndex.value === 1
    if (obj.userData.type === 'ring') obj.visible = modeIndex.value === 2
    if (obj.userData.type === 'sphere') obj.visible = modeIndex.value === 3
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = clock.getElapsedTime()
  
  if (isPlaying.value && analyser && dataArray) {
    oscillatorNodes.forEach((osc, i) => {
      const mod = 1 + Math.sin(time * 2 + i * Math.PI / 4) * 0.1
      osc.frequency.setValueAtTime(frequencies[i] * mod, audioContext.currentTime)
      gainNodes[i].gain.value = 0.08 + Math.sin(time * 3 + i) * 0.07
    })
    
    analyser.getByteFrequencyData(dataArray)
    
    visualBars.forEach((bar, i) => {
      const value = dataArray[i] / 255
      const height = 0.1 + value * 20 * visualScale.value
      bar.scale.y = height
      bar.position.y = height / 2
      bar.material.emissiveIntensity = 0.3 + value * 0.5
    })
    
    if (visualRing) {
      visualRing.children.forEach((box, i) => {
        const value = dataArray[i % dataArray.length] / 255
        const height = 0.1 + value * 10 * visualScale.value
        box.scale.y = height
        box.position.y = 2 + height / 2
      })
    }
    
    if (visualSphere) {
      visualSphere.children.forEach((box, i) => {
        const value = dataArray[i % dataArray.length] / 255
        const height = 0.1 + value * 6 * visualScale.value
        box.scale.y = height
      })
    }
  }
  
  if (modeIndex.value === 1 && visualBars.length > 0) {
    const waveOffset = time * 2
    visualBars.forEach((bar, i) => {
      const wave = Math.sin(waveOffset + i * 0.2)
      const height = bar.scale.y
      bar.position.y = height / 2 + wave * 2
    })
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
  oscillatorNodes.forEach(o => o.stop())
  if (audioContext) audioContext.close()
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
  min-width: 60px;
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
