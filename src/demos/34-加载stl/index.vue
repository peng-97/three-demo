<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".stl" @change="onPickFile">
      <button @click="pickFile" class="control-btn" :disabled="loading">选择STL</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 .stl url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !mesh">清空</button>
      <span class="panel-label">材质:</span>
      <select v-model="materialMode" class="control-select" :disabled="!mesh">
        <option value="standard">Standard</option>
        <option value="normal">Normal</option>
      </select>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe" :disabled="!mesh">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="autoRotate">
        <span>自转</span>
      </label>
      <span class="panel-label">缩放:</span>
      <input type="range" v-model="scale" min="0.2" max="6" step="0.1" class="control-range" :disabled="!mesh">
      <span class="panel-value">{{ Number(scale).toFixed(1) }}</span>
      <span class="panel-label">状态:</span>
      <span class="panel-value panel-status">{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const status = ref('选择本地STL文件或输入URL加载')
const loading = ref(false)

const materialMode = ref('standard')
const wireframe = ref(false)
const autoRotate = ref(true)
const scale = ref(1.0)

let scene, camera, renderer, animationId, controls
let loader, clock
let mesh = null
let ground = null
let grid = null
let lastObjectUrl = null

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
  if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(10, 8, 14)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85)
  directionalLight.position.set(20, 35, 20)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(80, 80)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  grid = new THREE.GridHelper(80, 40, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  loader = new STLLoader()
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createMaterial() {
  if (materialMode.value === 'normal') {
    return new THREE.MeshNormalMaterial({ wireframe: wireframe.value })
  }
  return new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    metalness: 0.25,
    roughness: 0.55,
    wireframe: wireframe.value
  })
}

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object)
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

function clearModel() {
  if (!mesh) return
  scene.remove(mesh)
  mesh.geometry?.dispose?.()
  if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose?.())
  else mesh.material?.dispose?.()
  mesh = null
  status.value = '已清空'
}

function applyMaterialOptions() {
  if (!mesh) return
  const nextMaterial = createMaterial()
  const prevMaterial = mesh.material
  mesh.material = nextMaterial
  if (Array.isArray(prevMaterial)) prevMaterial.forEach((m) => m.dispose?.())
  else prevMaterial?.dispose?.()
}

function applyScale() {
  if (!mesh) return
  const s = Number(scale.value) || 1
  mesh.scale.setScalar(s)
}

function loadStl(pathOrUrl) {
  clearModel()
  loading.value = true
  status.value = '加载中...'

  loader.load(
    pathOrUrl,
    (geometry) => {
      loading.value = false
      if (!geometry.attributes.normal) geometry.computeVertexNormals()
      geometry.center()

      const m = createMaterial()
      mesh = new THREE.Mesh(geometry, m)
      mesh.castShadow = true
      mesh.receiveShadow = true
      applyScale()
      scene.add(mesh)
      fitCameraToObject(mesh)

      const triangles = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3
      status.value = `加载成功 triangles:${Math.round(triangles)}`
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
  if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl)
  lastObjectUrl = URL.createObjectURL(file)
  status.value = `加载文件: ${file.name}`
  loadStl(lastObjectUrl)
  e.target.value = ''
}

function loadFromUrl() {
  if (!url.value) return
  loadStl(url.value.trim())
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (autoRotate.value && mesh) mesh.rotation.y += delta * 0.35
  controls.update()
  renderer.render(scene, camera)
}

watch([materialMode, wireframe], applyMaterialOptions)
watch(scale, applyScale)
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 220px; padding: 8px 10px; border-radius: 6px; border: none; }
.control-select { padding: 8px 10px; border-radius: 6px; border: none; cursor: pointer; }
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
.panel-value { color: white; font-weight: 700; min-width: 60px; text-align: left; }
.panel-status { min-width: 180px; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
