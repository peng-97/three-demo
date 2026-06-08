<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">臂长:</span>
      <input type="range" v-model="armLength" min="1" max="6" step="0.1" class="control-range">
      <span class="panel-value">{{ armLength.toFixed(1) }}</span>
      <span class="panel-label">臂宽:</span>
      <input type="range" v-model="armWidth" min="0.2" max="2.5" step="0.1" class="control-range">
      <span class="panel-value">{{ armWidth.toFixed(1) }}</span>
      <span class="panel-label">厚度:</span>
      <input type="range" v-model="depth" min="0.1" max="2" step="0.1" class="control-range">
      <span class="panel-value">{{ depth.toFixed(1) }}</span>
      <label class="control-check">
        <input type="checkbox" v-model="wireframe">
        <span>线框</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="spinning">
        <span>旋转</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const container = ref(null)
const armLength = ref(4)
const armWidth = ref(1.2)
const depth = ref(0.6)
const wireframe = ref(false)
const spinning = ref(true)

let scene, camera, renderer, animationId, controls
let plusMesh, plusMaterial, clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function createPlusGeometry() {
  const l = armLength.value
  const w = armWidth.value
  const d = depth.value

  const barA = new THREE.BoxGeometry(l, w, d)
  const barB = new THREE.BoxGeometry(w, l, d)

  const merged = mergeGeometries([barA, barB], false)
  barA.dispose()
  barB.dispose()
  merged.computeVertexNormals()
  return merged
}

function rebuildPlus() {
  if (!plusMesh) return
  plusMesh.geometry?.dispose?.()
  plusMesh.geometry = createPlusGeometry()
  plusMaterial.wireframe = wireframe.value
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  plusMesh?.geometry?.dispose?.()
  plusMaterial?.dispose?.()
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 200)
  camera.position.set(0, 6, 14)
  camera.lookAt(0, 2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 2, 0)

  plusMaterial = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    roughness: 0.45,
    metalness: 0.25,
    wireframe: wireframe.value
  })

  plusMesh = new THREE.Mesh(createPlusGeometry(), plusMaterial)
  plusMesh.position.y = 2
  scene.add(plusMesh)

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (spinning.value) {
    plusMesh.rotation.y += delta * 0.55
    plusMesh.rotation.x += delta * 0.22
  }
  controls.update()
  renderer.render(scene, camera)
}

watch([armLength, armWidth, depth, wireframe], rebuildPlus)
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
.panel-value { color: white; font-weight: 700; min-width: 54px; text-align: right; }
.control-range { width: 120px; cursor: pointer; }
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
