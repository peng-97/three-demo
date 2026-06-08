<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">视口数量:</span>
      <select v-model="viewportCount" class="control-select">
        <option value="1">1个</option>
        <option value="4">4个</option>
        <option value="9">9个</option>
      </select>
      <span class="panel-label">间距:</span>
      <input type="range" v-model="viewportGap" min="0.01" max="0.1" step="0.01" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const viewportCount = ref(4)
const viewportGap = ref(0.03)

let scene, camera, renderer, animationId, controls
let meshes = [], clock

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  renderer.setSize(clientWidth, clientHeight)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf, 0xc56cf0, 0xff9f43, 0x5f27cd, 0x00d2d3]
  const geometries = [
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.TorusGeometry(0.5, 0.2, 16, 100),
    new THREE.ConeGeometry(0.5, 1, 32),
    new THREE.OctahedronGeometry(0.6),
    new THREE.IcosahedronGeometry(0.5),
    new THREE.DodecahedronGeometry(0.5),
    new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8),
    new THREE.CylinderGeometry(0.4, 0.6, 1, 32)
  ]

  for (let i = 0; i < 9; i++) {
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[i], 
      metalness: 0.3, 
      roughness: 0.5 
    })
    const mesh = new THREE.Mesh(geometries[i], material)
    mesh.userData.index = i
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

function updateViewportLayout() {
  const count = parseInt(viewportCount.value)
  const cols = Math.ceil(Math.sqrt(count))
  const rows = cols
  const gap = viewportGap.value
  const size = Math.max(0.02, (1 - gap * (cols + 1)) / cols)
  
  meshes.forEach((mesh, i) => {
    mesh.visible = i < count
    if (mesh.visible) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const left = gap + col * (size + gap)
      const bottom = 1 - gap - (row + 1) * size - row * gap
      mesh.userData.viewport = { left, bottom, size }
    }
  })
}

watch([viewportCount, viewportGap], updateViewportLayout)

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  const rendererWidth = container.value.clientWidth
  const rendererHeight = container.value.clientHeight

  renderer.setScissorTest(true)
  renderer.setClearColor(0x1a1a2e)
  renderer.clear()

  meshes.forEach((mesh, i) => {
    if (mesh.visible && mesh.userData.viewport) {
      const vp = mesh.userData.viewport
      
      const scissorX = vp.left * rendererWidth
      const scissorY = vp.bottom * rendererHeight
      const scissorW = vp.size * rendererWidth
      const scissorH = vp.size * rendererHeight

      const localTime = time + i * 0.5
      mesh.rotation.x += 0.01 + i * 0.002
      mesh.rotation.y += 0.015 + i * 0.003
      mesh.position.y = Math.sin(localTime * 1.5) * 0.3
      
      renderer.setViewport(scissorX, scissorY, scissorW, scissorH)
      renderer.setScissor(scissorX, scissorY, scissorW, scissorH)
      
      renderer.render(scene, camera)
    }
  })

  renderer.setScissorTest(false)
  controls.update()
}

onMounted(() => { 
  init()
  updateViewportLayout()
  window.addEventListener('resize', onResize)
  animate()
})
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  meshes.forEach((m) => {
    m.geometry?.dispose?.()
    m.material?.dispose?.()
  })
  meshes = []
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
.control-range { width: 100px; cursor: pointer; }
</style>
