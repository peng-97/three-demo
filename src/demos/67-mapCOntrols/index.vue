<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <label class="control-check">
        <input type="checkbox" v-model="enableRotate">
        <span>允许旋转</span>
      </label>
      <label class="control-check">
        <input type="checkbox" v-model="enableDamping">
        <span>惯性阻尼</span>
      </label>
      <button @click="resetView" class="control-btn">重置视角</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { MapControls } from 'three/examples/jsm/controls/MapControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, controls
let meshes = []
let clock
const enableRotate = ref(false)
const enableDamping = ref(true)
const target = new THREE.Vector3(0, 0, 0)

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

onMounted(() => {
  init()
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
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 18, 18)
  camera.lookAt(target)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
  scene.add(gridHelper)

  controls = new MapControls(camera, renderer.domElement)
  controls.enableDamping = enableDamping.value
  controls.screenSpacePanning = true
  controls.enableRotate = enableRotate.value
  controls.maxPolarAngle = Math.PI / 2
  controls.minDistance = 5
  controls.maxDistance = 80
  controls.target.copy(target)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]
  const baseGeometries = [
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16),
    new THREE.SphereGeometry(0.75, 24, 24)
  ]

  for (let i = 0; i < 40; i++) {
    const geometry = baseGeometries[Math.floor(Math.random() * baseGeometries.length)].clone()
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.6,
      metalness: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set((Math.random() - 0.5) * 18, 0.6, (Math.random() - 0.5) * 18)
    mesh.rotation.y = Math.random() * Math.PI * 2
    scene.add(mesh)
    meshes.push(mesh)
  }

  clock = new THREE.Clock()
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()
  meshes.forEach((m, i) => {
    m.rotation.y += delta * (0.1 + i * 0.002)
  })
  controls.update()
  renderer.render(scene, camera)
}

function resetView() {
  camera.position.set(0, 18, 18)
  controls.target.copy(target)
  controls.update()
}

watch([enableRotate, enableDamping], () => {
  if (!controls) return
  controls.enableRotate = enableRotate.value
  controls.enableDamping = enableDamping.value
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
.control-check { display: inline-flex; align-items: center; gap: 6px; color: white; font-weight: 600; font-size: 0.9rem; user-select: none; }
.control-check input { cursor: pointer; }
</style>
