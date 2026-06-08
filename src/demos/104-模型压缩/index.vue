<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="report-overlay">
      <pre class="report-pre">{{ report }}</pre>
    </div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn" :disabled="loading">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url" :disabled="loading">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <label class="control-check">
        <input type="checkbox" v-model="enableDraco">
        <span>DRACO</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="enableMeshopt">
        <span>Meshopt</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="enableKTX2">
        <span>KTX2</span>
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const status = ref('等待选择文件或输入URL')
const loading = ref(false)
const report = ref('此 Demo 用于演示压缩/转码相关 Loader 的接入方式，并在加载后分析 extensionsUsed/Required')

const enableDraco = ref(true)
const enableMeshopt = ref(true)
const enableKTX2 = ref(true)

let scene, camera, renderer, animationId, controls
let clock
let modelRoot = null
let loader
let dracoLoader = null
let ktx2Loader = null
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

async function buildLoader() {
  const gltfLoader = new GLTFLoader()

  if (enableDraco.value) {
    dracoLoader?.dispose?.()
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
    gltfLoader.setDRACOLoader(dracoLoader)
  } else {
    gltfLoader.setDRACOLoader(null)
  }

  if (enableMeshopt.value) {
    try {
      const mod = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
      gltfLoader.setMeshoptDecoder(mod.MeshoptDecoder)
    } catch {
      report.value = 'MeshoptDecoder 加载失败（可能无网络或路径不可用），如模型使用 EXT_meshopt_compression 可能无法加载'
    }
  } else {
    gltfLoader.setMeshoptDecoder(null)
  }

  if (enableKTX2.value) {
    ktx2Loader?.dispose?.()
    ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/')
    ktx2Loader.detectSupport(renderer)
    gltfLoader.setKTX2Loader(ktx2Loader)
  } else {
    gltfLoader.setKTX2Loader(null)
  }

  loader = gltfLoader
}

function buildReport(gltf) {
  const parserJson = gltf.parser?.json || {}
  const used = parserJson.extensionsUsed || []
  const required = parserJson.extensionsRequired || []

  const sceneObj = gltf.scene || gltf.scenes?.[0]
  let nodes = 0
  let meshes = 0
  let textures = 0
  let materials = 0
  const texSet = new Set()
  const matSet = new Set()

  sceneObj?.traverse?.((o) => {
    nodes++
    if (o.isMesh) {
      meshes++
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.filter(Boolean).forEach((m) => {
        matSet.add(m)
        const maps = [m.map, m.normalMap, m.emissiveMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.alphaMap]
        maps.filter(Boolean).forEach((t) => texSet.add(t))
      })
    }
  })

  textures = texSet.size
  materials = matSet.size

  return JSON.stringify(
    {
      extensionsUsed: used,
      extensionsRequired: required,
      summary: { nodes, meshes, materials, textures },
      loaderConfig: {
        draco: enableDraco.value,
        meshopt: enableMeshopt.value,
        ktx2: enableKTX2.value
      }
    },
    null,
    2
  )
}

async function loadGltf(pathOrUrl) {
  clearModel()
  loading.value = true
  status.value = '加载中...'

  await buildLoader()

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
      report.value = buildReport(gltf)
      status.value = '加载成功'
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

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)

  const tick = () => {
    animationId = requestAnimationFrame(tick)
    clock.getDelta()
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
  dracoLoader?.dispose?.()
  ktx2Loader?.dispose?.()
  ground?.geometry?.dispose?.()
  ground?.material?.dispose?.()
  grid?.geometry?.dispose?.()
  grid?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch([enableDraco, enableMeshopt, enableKTX2], () => {
  report.value = '切换了解码器配置，重新加载模型可验证压缩扩展的加载效果'
})
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 220px; padding: 8px 10px; border-radius: 6px; border: none; }
.demo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
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
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
