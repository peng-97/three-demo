<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="frustumOnly">
        <span>只加载视椎体内</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="unloadOutOfView">
        <span>离开视野卸载</span>
      </label>
      <span class="panel-label">并发:</span>
      <input type="range" v-model="maxConcurrent" min="1" max="12" step="1" class="control-range">
      <span class="panel-value">{{ maxConcurrent }}</span>
      <span class="panel-label">延迟:</span>
      <input type="range" v-model="baseDelay" min="0" max="1500" step="50" class="control-range">
      <span class="panel-value">{{ baseDelay }}ms</span>
      <label class="control-check">
        <input type="checkbox" v-model="autoMove">
        <span>相机巡航</span>
      </label>
      <button @click="resetAll" class="control-btn">重置</button>
      <span class="panel-label">视野内:</span>
      <span class="panel-value">{{ inViewCount }}</span>
      <span class="panel-label">加载中:</span>
      <span class="panel-value">{{ loadingCount }}</span>
      <span class="panel-label">已加载:</span>
      <span class="panel-value">{{ loadedCount }}/{{ totalCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const frustumOnly = ref(true)
const unloadOutOfView = ref(false)
const maxConcurrent = ref(4)
const baseDelay = ref(500)
const autoMove = ref(true)

const inViewCount = ref(0)
const loadedCount = ref(0)
const loadingCount = ref(0)
const totalCount = ref(0)

let scene, camera, renderer, animationId, controls
let clock
let disposed = false

let placeholderGeometry
let placeholderMaterial
let items = []

const frustum = new THREE.Frustum()
const projScreenMatrix = new THREE.Matrix4()
const tmpVec = new THREE.Vector3()

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createLoadedMesh(seed) {
  const geom = new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16)
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL((seed % 60) / 60, 0.75, 0.58),
    roughness: 0.35,
    metalness: 0.55
  })
  const mesh = new THREE.Mesh(geom, mat)
  mesh.userData.isLoadedMesh = true
  return mesh
}

function disposeObject(obj) {
  obj.traverse?.((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    }
  })
}

function updateStats({ inView }) {
  inViewCount.value = inView
  const loaded = items.filter((it) => it.state === 'loaded').length
  const loading = items.filter((it) => it.state === 'loading').length
  loadedCount.value = loaded
  loadingCount.value = loading
}

function scheduleLoad(item) {
  if (item.state !== 'placeholder') return
  item.state = 'loading'
  item.placeholder.material.color.setHex(0xffaa00)
  const delay = baseDelay.value === 0 ? 0 : Math.max(30, Math.round(baseDelay.value * (0.6 + Math.random() * 0.8)))
  item.timeoutId = window.setTimeout(() => {
    item.timeoutId = null
    if (disposed) return
    if (item.state !== 'loading') return
    const mesh = createLoadedMesh(item.seed)
    mesh.position.copy(item.position)
    mesh.position.y += 0.8
    scene.add(mesh)
    item.mesh = mesh
    item.placeholder.visible = false
    item.state = 'loaded'
  }, delay)
}

function cancelLoad(item) {
  if (item.timeoutId != null) {
    window.clearTimeout(item.timeoutId)
    item.timeoutId = null
  }
  if (item.state === 'loading') {
    item.state = 'placeholder'
    item.placeholder.material.color.setHex(0x666666)
  }
}

function unloadItem(item) {
  cancelLoad(item)
  if (item.state === 'loaded' && item.mesh) {
    scene.remove(item.mesh)
    disposeObject(item.mesh)
    item.mesh = null
    item.placeholder.visible = true
    item.placeholder.material.color.setHex(0x666666)
    item.state = 'placeholder'
  }
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  disposed = true
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  items.forEach((it) => {
    cancelLoad(it)
    it.placeholder?.geometry?.dispose?.()
    it.placeholder?.material?.dispose?.()
    if (it.mesh) {
      scene.remove(it.mesh)
      disposeObject(it.mesh)
    }
  })
  placeholderGeometry?.dispose?.()
  placeholderMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05051a)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 300)
  camera.position.set(0, 16, 28)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(20, 35, 15)
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(120, 120)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1226, roughness: 0.95, metalness: 0.05 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(120, 60, 0x222244, 0x111122)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  placeholderGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9)
  placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.75, metalness: 0.05 })

  const gridSize = 13
  const spacing = 7
  const start = -((gridSize - 1) * spacing) / 2
  items = []
  let idx = 0
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const placeholder = new THREE.Mesh(placeholderGeometry.clone(), placeholderMaterial.clone())
      const pos = new THREE.Vector3(start + x * spacing, 0.45, start + z * spacing)
      placeholder.position.copy(pos)
      scene.add(placeholder)
      items.push({
        id: idx++,
        seed: idx,
        position: pos,
        placeholder,
        mesh: null,
        state: 'placeholder',
        timeoutId: null
      })
    }
  }

  totalCount.value = items.length
  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function resetAll() {
  items.forEach((it) => unloadItem(it))
  updateStats({ inView: 0 })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  const t = clock.getElapsedTime()

  if (autoMove.value) {
    const radius = 34
    camera.position.x = Math.cos(t * 0.22) * radius
    camera.position.z = Math.sin(t * 0.22) * radius
    camera.position.y = 16 + Math.sin(t * 0.33) * 4
    camera.lookAt(controls.target)
  }

  camera.updateMatrixWorld()
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(projScreenMatrix)

  let inView = 0
  for (const item of items) {
    tmpVec.copy(item.position)
    tmpVec.y += 0.6
    const visible = frustumOnly.value ? frustum.containsPoint(tmpVec) : true
    if (visible) inView++

    if (frustumOnly.value && unloadOutOfView.value && !visible) {
      unloadItem(item)
    }
  }

  const currentLoading = items.filter((it) => it.state === 'loading').length
  let budget = Math.max(0, maxConcurrent.value - currentLoading)
  if (budget > 0) {
    for (const item of items) {
      if (budget <= 0) break
      tmpVec.copy(item.position)
      tmpVec.y += 0.6
      const shouldLoad = frustumOnly.value ? frustum.containsPoint(tmpVec) : true
      if (shouldLoad && item.state === 'placeholder') {
        scheduleLoad(item)
        budget--
      }
    }
  }

  items.forEach((it) => {
    if (it.state === 'loaded' && it.mesh) {
      it.mesh.rotation.y += delta * 0.4
      it.mesh.rotation.x += delta * 0.15
    }
  })

  updateStats({ inView })
  controls.update()
  renderer.render(scene, camera)
}

watch([frustumOnly, unloadOutOfView, maxConcurrent, baseDelay], () => {
  items.forEach((it) => {
    if (it.state === 'placeholder') it.placeholder.material.color.setHex(0x666666)
  })
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
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 44px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
