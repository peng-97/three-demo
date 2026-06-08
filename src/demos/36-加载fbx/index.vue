<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".fbx" @change="onPickFile">
      <button @click="pickFile" class="control-btn" :disabled="loading">选择FBX</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 fbx url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelLoaded">清空</button>
      <span class="panel-label">动画:</span>
      <select v-model="clipIndex" class="control-select" :disabled="!clips.length">
        <option v-for="(c, i) in clips" :key="c.name + i" :value="i">{{ c.name || `Clip-${i}` }}</option>
      </select>
      <button @click="toggleAnimation" class="control-btn" :disabled="!clips.length">{{ animPlaying ? '暂停' : '播放' }}</button>
      <span class="panel-label">速度:</span>
      <input type="range" v-model="animSpeed" min="0" max="3" step="0.05" class="control-range" :disabled="!clips.length">
      <span class="panel-value">{{ animSpeed.toFixed(2) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="showSkeleton" :disabled="!hasSkinned">
        <span>骨骼</span>
      </label>
      <span class="panel-label">状态:</span>
      <span class="panel-value">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const status = ref('等待选择FBX或输入URL')
const loading = ref(false)
const modelLoaded = ref(false)

const animPlaying = ref(false)
const animSpeed = ref(1)
const showSkeleton = ref(false)
const clipIndex = ref(0)
const clips = ref([])
const hasSkinned = ref(false)

let scene, camera, renderer, animationId, controls
let loader, clock, mixer, action
let modelRoot = null
let skeletonHelper = null

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
  animPlaying.value = false
  hasSkinned.value = false
  showSkeleton.value = false
  modelLoaded.value = false
  status.value = '已清空'
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
  let skinned = null
  modelRoot.traverse((o) => {
    if (!skinned && o.isSkinnedMesh) skinned = o
  })
  if (!skinned) return
  skeletonHelper = new THREE.SkeletonHelper(skinned)
  scene.add(skeletonHelper)
}

function playSelectedClip() {
  if (!mixer || !clips.value.length) return
  if (action) action.stop()
  const clip = clips.value[clipIndex.value]
  action = mixer.clipAction(clip)
  action.reset()
  action.play()
  animPlaying.value = true
  status.value = `播放: ${clip.name || `Clip-${clipIndex.value}`}`
}

function toggleAnimation() {
  if (!clips.value.length) return
  if (!action) {
    playSelectedClip()
    return
  }
  animPlaying.value = !animPlaying.value
  action.paused = !animPlaying.value
}

function loadFbx(pathOrUrl) {
  clearModel()
  loading.value = true
  status.value = '加载中...'

  loader.load(
    pathOrUrl,
    (object) => {
      loading.value = false
      modelRoot = object
      scene.add(modelRoot)
      modelLoaded.value = true
      fitCameraToObject(modelRoot)

      let foundSkinned = false
      modelRoot.traverse((o) => {
        if (o.isSkinnedMesh) foundSkinned = true
        if (o.isMesh) {
          o.castShadow = true
          o.receiveShadow = true
        }
      })
      hasSkinned.value = foundSkinned
      showSkeleton.value = foundSkinned
      refreshSkeletonHelper()

      clips.value = object.animations || []
      clipIndex.value = 0
      if (clips.value.length) {
        mixer = new THREE.AnimationMixer(modelRoot)
        playSelectedClip()
      } else {
        status.value = '加载成功（无动画）'
      }
    },
    (e) => {
      if (e?.total) {
        const p = Math.round((e.loaded / e.total) * 100)
        status.value = `加载中... ${p}%`
      }
    },
    () => {
      loading.value = false
      status.value = '加载失败'
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
  status.value = `加载文件: ${file.name}`
  loadFbx(objectUrl)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  e.target.value = ''
}

function loadFromUrl() {
  if (!url.value) return
  loadFbx(url.value.trim())
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (mixer && animPlaying.value) {
    mixer.timeScale = animSpeed.value
    mixer.update(delta)
  }
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(0, 10, 20)
  camera.lookAt(0, 5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)
  
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  dir.castShadow = true
  scene.add(dir)
  
  const grid = new THREE.GridHelper(40, 40, 0x444466, 0x222233)
  scene.add(grid)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)

  loader = new FBXLoader()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  clearModel()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch(clipIndex, () => {
  if (!clips.value.length) return
  playSelectedClip()
})

watch(showSkeleton, refreshSkeletonHelper)
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; font-size: 0.95rem; min-width: 60px; }
.control-file { display: none; }
.control-text { width: 220px; padding: 8px 10px; border-radius: 6px; border: none; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; max-width: 180px; }
.control-range { width: 110px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
.control-btn { padding: 10px 20px; font-size: 0.9rem; font-weight: 600; color: #333; background: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.3s; }
.control-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
</style>
