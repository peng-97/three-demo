<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleMasterSound" class="control-btn">{{ masterSound ? '总声音开' : '总声音关'}}</button>
      <span class="panel-label">距离影响:</span>
      <input type="range" v-model="rolloffFactor" min="0.1" max="5" step="0.1" class="control-range">
      <span class="panel-value">{{ rolloffFactor.toFixed(1) }}</span>
      <span class="panel-label">主音量:</span>
      <input type="range" v-model="masterVolume" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ (masterVolume * 100).toFixed(0) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const masterSound = ref(true)
const rolloffFactor = ref(1)
const masterVolume = ref(0.3)

let scene, camera, renderer, animationId, controls
let listener, soundObjects = []
let audioContext, isAudioInitialized = false

const soundDefs = [
  { name: '钟声', freq: 523.25, color: 0xff6b6b, radius: 3, path: [0, 0, 0] },
  { name: '鼓声', freq: 130.81, color: 0x4ecdc4, radius: 4, path: [10, 0, 0] },
  { name: '钢琴', freq: 261.63, color: 0x667eea, radius: 5, path: [-10, 0, 0] },
  { name: '贝斯', freq: 65.41, color: 0xfeca57, radius: 6, path: [0, 0, 10] },
  { name: '弦乐', freq: 392.00, color: 0xc56cf0, radius: 4, path: [0, 0, -10] },
]

function initAudio() {
  if (isAudioInitialized) return
  
  listener = new THREE.AudioListener()
  camera.add(listener)
  audioContext = listener.context
  isAudioInitialized = true
}

function createSoundObject(def, index) {
  const geometry = new THREE.SphereGeometry(def.radius * 0.3, 32, 32)
  const material = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.color,
    emissiveIntensity: 0.3,
    metalness: 0.5,
    roughness: 0.3
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(def.path[0], def.path[1] + 2, def.path[2])
  scene.add(mesh)
  
  const sound = new THREE.PositionalAudio(listener)
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(def.freq, audioContext.currentTime)
  oscillator.connect(gain)
  sound.setNodeSource(gain)
  sound.setRefDistance(5)
  sound.setRolloffFactor(rolloffFactor.value)
  sound.setDistanceModel('exponential')
  sound.setVolume(masterVolume.value)
  mesh.add(sound)
  oscillator.start()
  
  const ringGeom = new THREE.RingGeometry(def.radius * 0.8, def.radius, 64)
  const ringMat = new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  const ring = new THREE.Mesh(ringGeom, ringMat)
  ring.rotation.x = -Math.PI / 2
  mesh.add(ring)
  
  return {
    mesh,
    sound,
    oscillator,
    gain,
    ring,
    baseFreq: def.freq,
    baseRadius: def.radius,
    originalPos: mesh.position.clone()
  }
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(15, 10, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(50, 50, 0x444466, 0x222233)
  scene.add(gridHelper)

  const markerGeom = new THREE.ConeGeometry(0.5, 1.5, 32)
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const marker = new THREE.Mesh(markerGeom, markerMat)
  marker.position.set(0, 0.75, 0)
  marker.userData.isListenerMarker = true
  scene.add(marker)

  const floorGeometry = new THREE.PlaneGeometry(60, 60)
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, metalness: 0.3, roughness: 0.8 })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
}

function startSound() {
  initAudio()
  if (soundObjects.length === 0) {
    soundDefs.forEach((def, i) => {
      soundObjects.push(createSoundObject(def, i))
    })
  }
  soundObjects.forEach(obj => {
    obj.sound.setVolume(masterVolume.value)
  })
}

function stopSound() {
  soundObjects.forEach(obj => {
    obj.sound.setVolume(0)
  })
}

function toggleMasterSound() {
  masterSound.value = !masterSound.value
  if (masterSound.value) {
    startSound()
  } else {
    stopSound()
  }
}

watch(rolloffFactor, () => {
  soundObjects.forEach(obj => {
    obj.sound.setRolloffFactor(rolloffFactor.value)
  })
})

watch(masterVolume, () => {
  soundObjects.forEach(obj => {
    obj.sound.setVolume(masterVolume.value)
  })
})

let time = 0
function animate() {
  animationId = requestAnimationFrame(animate)
  time += 0.016
  
  soundObjects.forEach((obj, i) => {
    const t = time + i * Math.PI * 0.5
    const orbitRadius = obj.baseRadius * 1.5
    obj.mesh.position.x = obj.originalPos.x + Math.cos(t * 0.5) * orbitRadius * 0.5
    obj.mesh.position.z = obj.originalPos.z + Math.sin(t * 0.5) * orbitRadius * 0.5
    obj.mesh.position.y = obj.originalPos.y + Math.sin(t) * 0.5
    
    const scale = 1 + Math.sin(t * 3) * 0.1
    obj.mesh.scale.setScalar(scale)
    obj.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.2)
    
    const freqMod = 1 + Math.sin(t * 1.5) * 0.1
    obj.oscillator.frequency.setValueAtTime(obj.baseFreq * freqMod, audioContext.currentTime)
  })
  
  scene.traverse(obj => {
    if (obj.userData.isListenerMarker) {
      obj.position.copy(camera.position)
      obj.position.y = 0.75
    }
  })
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
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
