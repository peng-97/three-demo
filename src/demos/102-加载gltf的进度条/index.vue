<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="progress-overlay" v-if="loading">
      <div class="progress-card">
        <div class="progress-title">{{ status }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-value">{{ progress }}%</div>
      </div>
    </div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn" :disabled="loading">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <span class="panel-label">状态:</span>
      <span class="panel-value">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const status = ref('等待选择文件或输入URL')
const progress = ref(0)
const loading = ref(false)

let scene, camera, renderer, animationId, controls
let loader, manager
let modelRoot = null
let grid, ground

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
  if (!modelRoot) return
  scene.remove(modelRoot)
  disposeObject(modelRoot)
  modelRoot = null
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

function loadGltf(pathOrUrl) {
  clearModel()
  loading.value = true
  progress.value = 0
  status.value = '开始加载...'

  loader.load(
    pathOrUrl,
    (gltf) => {
      loading.value = false
      modelRoot = gltf.scene || gltf.scenes?.[0]
      if (!modelRoot) {
        status.value = '加载成功，但未找到 scene'
        return
      }
      scene.add(modelRoot)
      fitCameraToObject(modelRoot)
      status.value = '加载成功'
      progress.value = 100
    },
    () => {},
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

  manager = new THREE.LoadingManager()
  manager.onStart = () => {
    progress.value = 0
    loading.value = true
    status.value = '加载中...'
  }
  manager.onProgress = (_url, loaded, total) => {
    if (total > 0) progress.value = Math.round((loaded / total) * 100)
  }
  manager.onLoad = () => {
    progress.value = 100
  }
  manager.onError = () => {
    loading.value = false
    status.value = '加载失败'
  }

  loader = new GLTFLoader(manager)
  loader.manager.onProgress = (itemUrl, loaded, total) => {
    if (total > 0) progress.value = Math.round((loaded / total) * 100)
    status.value = `加载中... (${loaded}/${total})`
  }

  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
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
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 260px; padding: 8px 10px; border-radius: 6px; border: none; }
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
.progress-overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
.progress-card {
  width: min(520px, calc(100% - 40px));
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.progress-title { color: rgba(255, 255, 255, 0.92); font-weight: 700; margin-bottom: 10px; }
.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #667eea, #ff4d6d);
  width: 0%;
  transition: width 0.2s;
}
.progress-value { margin-top: 8px; color: rgba(255, 255, 255, 0.9); font-weight: 700; }
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
.panel-value { color: white; font-weight: 700; min-width: 140px; text-align: left; }
</style>
