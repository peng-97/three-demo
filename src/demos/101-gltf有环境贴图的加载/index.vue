<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <input ref="fileInput" type="file" class="control-file" accept=".glb,.gltf" @change="onPickFile">
      <button @click="pickFile" class="control-btn">选择GLB/GLTF</button>
      <span class="panel-label">或URL:</span>
      <input v-model="url" class="control-text" placeholder="粘贴 glb/gltf url">
      <button @click="loadFromUrl" class="control-btn" :disabled="loading || !url">加载</button>
      <button @click="clearModel" class="control-btn" :disabled="loading || !modelRoot">清空</button>
      <label class="control-check">
        <input type="checkbox" v-model="useEnvironment">
        <span>环境贴图</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="useBackground">
        <span>背景</span>
      </label>
      <span class="panel-label">强度:</span>
      <input type="range" v-model="envIntensity" min="0" max="5" step="0.05" class="control-range" :disabled="!useEnvironment">
      <span class="panel-value">{{ envIntensity.toFixed(2) }}</span>
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

const container = ref(null)
const fileInput = ref(null)
const url = ref('')
const status = ref('等待选择文件或输入URL')
const loading = ref(false)
const useEnvironment = ref(true)
const useBackground = ref(false)
const envIntensity = ref(1.2)

let scene, camera, renderer, animationId, controls
let loader
let pmrem
let envTexture
let envRT
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

function createEnvironmentEquirect() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
  sky.addColorStop(0, '#05051a')
  sky.addColorStop(0.6, '#1a1a2e')
  sky.addColorStop(1, '#0b1026')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 1.4
    const a = 0.1 + Math.random() * 0.7
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 180; i++) {
    const x = Math.random() * canvas.width
    const y = canvas.height * (0.65 + Math.random() * 0.32)
    const w = 40 + Math.random() * 220
    const h = 10 + Math.random() * 40
    ctx.fillStyle = `rgba(233,69,96,${0.02 + Math.random() * 0.06})`
    ctx.fillRect(x, y, w, h)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.mapping = THREE.EquirectangularReflectionMapping
  return texture
}

function applyEnvironment() {
  if (!scene) return
  if (useEnvironment.value) {
    if (!envTexture) envTexture = createEnvironmentEquirect()
    if (pmrem && !envRT) envRT = pmrem.fromEquirectangular(envTexture)
    scene.environment = envRT?.texture ?? envTexture
  } else {
    scene.environment = null
  }

  if (useBackground.value) {
    scene.background = envTexture
  } else {
    scene.background = new THREE.Color(0x05051a)
  }

  if (modelRoot) {
    modelRoot.traverse((o) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.filter(Boolean).forEach((m) => {
        if ('envMapIntensity' in m) m.envMapIntensity = envIntensity.value
        m.needsUpdate = true
      })
    })
  }
}

function loadGltf(pathOrUrl) {
  clearModel()
  loading.value = true
  status.value = '加载中...'

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
      applyEnvironment()
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

  pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()

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
  applyEnvironment()
  window.addEventListener('resize', onResize)

  clock = new THREE.Clock()
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
  envRT?.dispose?.()
  envTexture?.dispose?.()
  pmrem?.dispose?.()
  ground?.geometry?.dispose?.()
  ground?.material?.dispose?.()
  grid?.geometry?.dispose?.()
  grid?.material?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

watch([useEnvironment, useBackground, envIntensity], applyEnvironment)
</script>

<style scoped>
.control-file { display: none; }
.control-text { width: 260px; padding: 8px 10px; border-radius: 6px; border: none; }
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
.panel-value { color: white; font-weight: 700; min-width: 90px; text-align: left; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
