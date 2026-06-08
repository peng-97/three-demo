<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="report-overlay">
      <pre class="report-pre">{{ report }}</pre>
    </div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <label class="control-check">
        <input type="checkbox" v-model="showHelpers">
        <span>显示灯光辅助</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const loading = ref(false)
const showHelpers = ref(false)
const report = ref('等待选择文件或输入URL')

let scene, camera, renderer, animationId, controls
let loader
let modelRoot = null
let helpers = []
let grid

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
  helpers.forEach((h) => scene.remove(h))
  helpers.forEach((h) => {
    h.geometry?.dispose?.()
    h.material?.dispose?.()
  })
  helpers = []

  if (modelRoot) {
    scene.remove(modelRoot)
    disposeObject(modelRoot)
    modelRoot = null
  }

  report.value = '已清空'
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

function materialSummary(material) {
  const m = material
  const out = {
    type: m.type,
    name: m.name || '',
    color: m.color ? `#${m.color.getHexString()}` : null,
    emissive: m.emissive ? `#${m.emissive.getHexString()}` : null,
    metalness: typeof m.metalness === 'number' ? m.metalness : null,
    roughness: typeof m.roughness === 'number' ? m.roughness : null,
    transparent: !!m.transparent,
    opacity: typeof m.opacity === 'number' ? m.opacity : null,
    maps: {
      map: !!m.map,
      normalMap: !!m.normalMap,
      emissiveMap: !!m.emissiveMap,
      roughnessMap: !!m.roughnessMap,
      metalnessMap: !!m.metalnessMap,
      aoMap: !!m.aoMap,
      alphaMap: !!m.alphaMap,
      envMap: !!m.envMap
    }
  }
  return out
}

function buildReport(gltf) {
  const sceneObj = gltf.scene || gltf.scenes?.[0]
  const parserJson = gltf.parser?.json || {}
  const used = parserJson.extensionsUsed || []
  const required = parserJson.extensionsRequired || []

  let nodeCount = 0
  let meshCount = 0
  let skinnedMeshCount = 0
  let materialCount = 0
  const materialSet = new Set()
  const lightList = []
  const meshList = []

  sceneObj.traverse((o) => {
    nodeCount++
    if (o.isMesh) {
      meshCount++
      if (o.isSkinnedMesh) skinnedMeshCount++
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.filter(Boolean).forEach((m) => materialSet.add(m))
      meshList.push({
        name: o.name || '',
        type: o.type,
        materialTypes: mats.filter(Boolean).map((m) => m.type)
      })
    }
    if (o.isLight) {
      lightList.push({
        name: o.name || '',
        type: o.type,
        color: o.color ? `#${o.color.getHexString()}` : null,
        intensity: o.intensity,
        distance: typeof o.distance === 'number' ? o.distance : null,
        angle: typeof o.angle === 'number' ? o.angle : null
      })
    }
  })

  const materials = Array.from(materialSet)
  materialCount = materials.length

  const matSummary = materials.map((m) => materialSummary(m))

  const hasEnvOnMaterials = materials.some((m) => !!m.envMap)
  const hasSceneEnv = !!scene.environment

  const summary = {
    extensionsUsed: used,
    extensionsRequired: required,
    nodes: nodeCount,
    meshes: meshCount,
    skinnedMeshes: skinnedMeshCount,
    materials: materialCount,
    lights: lightList.length,
    hasSceneEnvironment: hasSceneEnv,
    hasEnvMapOnMaterials: hasEnvOnMaterials
  }

  return JSON.stringify(
    {
      summary,
      lights: lightList,
      materials: matSummary,
      meshes: meshList.slice(0, 40)
    },
    null,
    2
  )
}

function buildLightHelpers() {
  helpers.forEach((h) => scene.remove(h))
  helpers.forEach((h) => {
    h.geometry?.dispose?.()
    h.material?.dispose?.()
  })
  helpers = []

  if (!modelRoot || !showHelpers.value) return

  modelRoot.traverse((o) => {
    if (o.isDirectionalLight) helpers.push(new THREE.DirectionalLightHelper(o, 2, 0x00ffff))
    else if (o.isPointLight) helpers.push(new THREE.PointLightHelper(o, 1.2, 0x00ffff))
    else if (o.isSpotLight) helpers.push(new THREE.SpotLightHelper(o, 0x00ffff))
  })

  helpers.forEach((h) => scene.add(h))
}

function loadGltf(pathOrUrl) {
  clearModel()
  loading.value = true
  report.value = '加载中...'

  loader.load(
    pathOrUrl,
    (gltf) => {
      loading.value = false
      modelRoot = gltf.scene || gltf.scenes?.[0]
      if (!modelRoot) {
        report.value = '加载成功，但未找到 scene'
        return
      }
      scene.add(modelRoot)
      fitCameraToObject(modelRoot)
      report.value = buildReport(gltf)
      buildLightHelpers()
    },
    (e) => {
      if (e?.total) {
        const p = Math.round((e.loaded / e.total) * 100)
        report.value = `加载中... ${p}%`
      }
    },
    () => {
      loading.value = false
      report.value = '加载失败'
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
  report.value = `加载文件: ${file.name}`
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

  grid = new THREE.GridHelper(80, 40, 0x222244, 0x111122)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 3, 0)

  loader = new GLTFLoader()
  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    controls.update()
    helpers.forEach((h) => h.update?.())
    renderer.render(scene, camera)
  }
  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  clearModel()
  grid?.geometry?.dispose?.()
  grid?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch(showHelpers, buildLightHelpers)
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
.report-overlay {
  position: absolute;
  left: 12px;
  top: 12px;
  width: min(520px, calc(100% - 24px));
  max-height: calc(100% - 80px);
  overflow: auto;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  pointer-events: none;
}
.report-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  line-height: 1.35;
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
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
