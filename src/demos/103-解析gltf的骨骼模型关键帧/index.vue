<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn" :disabled="loading">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <span class="panel-label">动画:</span>
      <select v-model="clipIndex" class="control-select" :disabled="!clips.length">
        <option v-for="(c, i) in clips" :key="c.name + i" :value="i">{{ c.name || `Clip-${i}` }}</option>
      </select>
      <button @click="togglePlay" class="control-btn" :disabled="!clips.length">{{ playing ? '暂停' : '播放' }}</button>
      <span class="panel-label">时间:</span>
      <input type="range" v-model="time" min="0" :max="duration" step="0.001" class="control-range" :disabled="!clips.length">
      <span class="panel-value">{{ time.toFixed(2) }}/{{ duration.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="showSkeleton" :disabled="!hasSkinned">
        <span>骨骼</span>
      </label>
      <span class="panel-label">骨骼:</span>
      <span class="panel-value">{{ boneCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const loading = ref(false)
const clipIndex = ref(0)
const playing = ref(false)
const time = ref(0)
const showSkeleton = ref(false)

const clips = ref([])
const duration = computed(() => clips.value[clipIndex.value]?.duration ?? 0)

const boneCount = ref(0)
const hasSkinned = ref(false)

let scene, camera, renderer, animationId, controls
let loader
let modelRoot = null
let mixer = null
let action = null
let clock
let skeletonHelper = null
let grid, ground
let settingTime = false
let syncingTime = false

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function disposeObject(obj) {
  if (!obj) return
  obj.traverse?.((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.()
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.())
      else child.material?.dispose?.()
    }
  })
}

function clearModel() {
  if (skeletonHelper) {
    scene.remove(skeletonHelper)
    skeletonHelper.geometry.dispose()
    skeletonHelper.material.dispose()
    skeletonHelper = null
  }

  if (modelRoot) {
    scene.remove(modelRoot)
    disposeObject(modelRoot)
    modelRoot = null
  }

  mixer = null
  action = null
  clips.value = []
  clipIndex.value = 0
  playing.value = false
  time.value = 0
  boneCount.value = 0
  hasSkinned.value = false
  showSkeleton.value = false
}

function fitCameraToObject(obj) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxSize = Math.max(size.x, size.y, size.z)
  const fitHeightDistance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.35

  const dir = new THREE.Vector3(1, 0.6, 1).normalize()
  camera.position.copy(center).add(dir.multiplyScalar(distance))
  camera.near = Math.max(0.01, maxSize / 100)
  camera.far = Math.max(200, maxSize * 20)
  camera.updateProjectionMatrix()
  controls.target.copy(center)
  controls.update()
}

function refreshSkeletonHelper() {
  if (skeletonHelper) {
    scene.remove(skeletonHelper)
    skeletonHelper.geometry.dispose()
    skeletonHelper.material.dispose()
    skeletonHelper = null
  }

  if (!modelRoot || !showSkeleton.value) return

  let rootForHelper = null
  modelRoot.traverse((o) => {
    if (!rootForHelper && o.isSkinnedMesh) rootForHelper = o
  })
  if (!rootForHelper) return

  skeletonHelper = new THREE.SkeletonHelper(rootForHelper)
  skeletonHelper.material.linewidth = 1
  scene.add(skeletonHelper)
}

function playSelectedClip() {
  if (!mixer || !clips.value.length) return
  if (action) action.stop()
  const clip = clips.value[clipIndex.value]
  action = mixer.clipAction(clip)
  action.reset()
  action.play()
  playing.value = true
}

function togglePlay() {
  if (!clips.value.length) return
  if (!action) {
    playSelectedClip()
    return
  }
  playing.value = !playing.value
  action.paused = !playing.value
}

function loadGltf(pathOrUrl) {
  clearModel()
  loading.value = true

  loader.load(
    pathOrUrl,
    (gltf) => {
      loading.value = false
      modelRoot = gltf.scene || gltf.scenes?.[0]
      if (!modelRoot) return
      scene.add(modelRoot)
      fitCameraToObject(modelRoot)

      clips.value = gltf.animations || []
      clipIndex.value = 0
      time.value = 0
      mixer = new THREE.AnimationMixer(modelRoot)

      const bones = new Set()
      let foundSkinned = false
      modelRoot.traverse((o) => {
        if (o.isSkinnedMesh) {
          foundSkinned = true
          o.skeleton?.bones?.forEach((b) => bones.add(b))
        }
      })
      boneCount.value = bones.size
      hasSkinned.value = foundSkinned
      if (clips.value.length) playSelectedClip()
      refreshSkeletonHelper()
    },
    () => {},
    () => {
      loading.value = false
    }
  )
}

function pickFile() {
  fileInput.value?.click?.()
}

function onPickFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const objectUrl = URL.createObjectURL(file)
  loadGltf(objectUrl)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  e.target.value = ''
}

function loadFromUrl() {
  if (!url.value) return
  loadGltf(url.value.trim())
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(12, 10, 16)
  camera.lookAt(0, 3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 20)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(80, 80)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  grid = new THREE.GridHelper(80, 40, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)

  loader = new GLTFLoader()
  clock = new THREE.Clock()

  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    const delta = clock.getDelta()
    if (mixer && playing.value && !settingTime) mixer.update(delta)
    if (mixer && action && !settingTime) {
      syncingTime = true
      time.value = action.time % Math.max(0.0001, duration.value)
      syncingTime = false
    }
    controls.update()
    renderer.render(scene, camera)
  }
  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  clearModel()
  ground?.geometry?.dispose?.()
  ground?.material?.dispose?.()
  grid?.geometry?.dispose?.()
  grid?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch(clipIndex, () => {
  if (!clips.value.length) return
  playSelectedClip()
})

watch(showSkeleton, refreshSkeletonHelper)

watch(time, () => {
  if (syncingTime) return
  if (!action) return
  settingTime = true
  action.paused = true
  playing.value = false
  action.time = Math.min(duration.value, Math.max(0, time.value))
  mixer?.update(0)
  settingTime = false
})
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 240px; padding: 8px 10px; border-radius: 6px; border: none; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; max-width: 180px; }
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
.control-range { width: 140px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
