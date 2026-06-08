<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" multiple accept=".obj,.mtl,.jpg,.jpeg,.png,.bmp,.gif" @change="onPickFiles">
      <button @click="pickFiles" class="control-btn" :disabled="loading">选择OBJ/MTL/贴图</button>
      <span class="panel-label">OBJ URL:</span>
      <input v-model="objUrl" class="control-text" placeholder="粘贴 .obj url" :disabled="loading">
      <span class="panel-label">MTL URL:</span>
      <input v-model="mtlUrl" class="control-text" placeholder="可选：粘贴 .mtl url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !objUrl">加载URL</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe" :disabled="!modelRoot">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="autoRotate">
        <span>自转</span>
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
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

const container = ref(null)
const fileInput = ref(null)
const objUrl = ref('')
const mtlUrl = ref('')
const status = ref('选择本地OBJ/MTL/贴图，或输入URL加载')
const loading = ref(false)
const wireframe = ref(false)
const autoRotate = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let modelRoot = null
let ground, grid
let activeObjectUrls = []

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
    if (!child.isMesh) return
    child.geometry?.dispose?.()
    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.())
    else child.material?.dispose?.()
  })
}

function revokeActiveObjectUrls() {
  activeObjectUrls.forEach((u) => URL.revokeObjectURL(u))
  activeObjectUrls = []
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

function applyWireframe() {
  if (!modelRoot) return
  modelRoot.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    mats.filter(Boolean).forEach((m) => {
      m.wireframe = wireframe.value
      m.needsUpdate = true
    })
  })
}

function countSummary(obj) {
  let meshes = 0
  const materials = new Set()
  obj.traverse((o) => {
    if (!o.isMesh) return
    meshes++
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    mats.filter(Boolean).forEach((m) => materials.add(m))
  })
  return { meshes, materials: materials.size }
}

function basename(p) {
  const clean = String(p || '').split('?')[0].split('#')[0]
  const parts = clean.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1]
}

function loadObjWithOptionalMtl({ objPath, mtlPath, manager }) {
  const objLoader = new OBJLoader(manager)

  const onLoaded = (object) => {
    modelRoot = object
    modelRoot.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
    })
    scene.add(modelRoot)
    fitCameraToObject(modelRoot)
    applyWireframe()
    const s = countSummary(modelRoot)
    status.value = `加载成功 meshes:${s.meshes} materials:${s.materials}`
    loading.value = false
  }

  const onProgress = (e) => {
    if (e?.total) {
      const p = Math.round((e.loaded / e.total) * 100)
      status.value = `加载中... ${p}%`
    }
  }

  const onError = () => {
    loading.value = false
    status.value = '加载失败'
  }

  if (mtlPath) {
    const mtlLoader = new MTLLoader(manager)
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload()
        objLoader.setMaterials(materials)
        objLoader.load(objPath, onLoaded, onProgress, onError)
      },
      onProgress,
      onError
    )
    return
  }

  objLoader.load(objPath, onLoaded, onProgress, onError)
}

function loadLocalFiles(files) {
  const list = Array.from(files || [])
  if (!list.length) return

  const objFile = list.find((f) => f.name.toLowerCase().endsWith('.obj'))
  if (!objFile) {
    status.value = '未找到 .obj 文件'
    return
  }

  const mtlFile = list.find((f) => f.name.toLowerCase().endsWith('.mtl'))
  const fileMap = new Map()

  revokeActiveObjectUrls()
  list.forEach((f) => {
    const u = URL.createObjectURL(f)
    activeObjectUrls.push(u)
    fileMap.set(f.name, u)
  })

  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => {
    const key = basename(url)
    return fileMap.get(key) || url
  })

  loading.value = true
  status.value = '加载中...'
  clearModel()

  loadObjWithOptionalMtl({
    objPath: fileMap.get(objFile.name),
    mtlPath: mtlFile ? fileMap.get(mtlFile.name) : null,
    manager
  })
}

function loadFromUrl() {
  if (!objUrl.value) return
  loading.value = true
  status.value = '加载中...'
  revokeActiveObjectUrls()
  clearModel()

  const manager = new THREE.LoadingManager()
  loadObjWithOptionalMtl({
    objPath: objUrl.value.trim(),
    mtlPath: mtlUrl.value.trim() || null,
    manager
  })
}

function pickFiles() {
  fileInput.value?.click?.()
}

function onPickFiles(e) {
  const files = e.target.files
  loadLocalFiles(files)
  e.target.value = ''
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 500)
  camera.position.set(12, 10, 16)
  camera.lookAt(0, 3, 0)

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
  controls.target.set(0, 3, 0)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (autoRotate.value && modelRoot) modelRoot.rotation.y += delta * 0.25
  controls.update()
  renderer.render(scene, camera)
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
  revokeActiveObjectUrls()
  ground?.geometry?.dispose?.()
  ground?.material?.dispose?.()
  grid?.geometry?.dispose?.()
  grid?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch(wireframe, applyWireframe)
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 220px; padding: 8px 10px; border-radius: 6px; border: none; }
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.demo-container { flex: 1; }
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
.panel-value { color: white; font-weight: 700; min-width: 160px; text-align: left; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>

