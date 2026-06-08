<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载URL</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelGroup">清空</button>
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
const loading = ref(false)

let scene, camera, renderer, animationId, controls
let clock
let loader
let modelGroup = null
let ground, grid

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
  if (!modelGroup) return
  scene.remove(modelGroup)
  disposeObject(modelGroup)
  modelGroup = null
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
  status.value = '加载中...'

  loader.load(
    pathOrUrl,
    (gltf) => {
      loading.value = false
      modelGroup = gltf.scene || gltf.scenes?.[0]
      if (!modelGroup) {
        status.value = '加载成功，但未找到 scene'
        return
      }
      scene.add(modelGroup)
      fitCameraToObject(modelGroup)
      status.value = '加载成功'
    },
    (e) => {
      if (e?.total) {
        const p = Math.round((e.loaded / e.total) * 100)
        status.value = `加载中... ${p}%`
      }
    },
    (err) => {
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
  init()
  animate()
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

function init() {
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

function animate() {
  animationId = requestAnimationFrame(animate)
  if (animating) {
  clock.getDelta()
  renderer.render(scene, camera)
}
</script>

<style scoped>
.demo-wrapper {
.control-file { display: none; }
.control-text { width: 260px; padding: 8px 10px; border-radius: 6px; border: none; }
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
.panel-value { color: white; font-weight: 700; min-width: 120px; text-align: left; }
.control-range { width: 120px; cursor: pointer; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
