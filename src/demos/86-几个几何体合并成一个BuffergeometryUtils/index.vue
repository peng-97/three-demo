<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="toggleAnimation" class="control-btn">{{ animating ? '暂停' : '播放' }}</button>
      <button @click="reset" class="control-btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const animating = ref(true)

let scene, camera, renderer, animationId, controls
let mesh, time = 0

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 100, 16)
  const material = new THREE.MeshStandardMaterial({
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

function toggleAnimation() {
  animating.value = !animating.value
}

function reset() {
  if (mesh) {
    mesh.rotation.set(0, 0, 0)
    mesh.position.set(0, 0, 0)
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  if (animating.value && mesh) {
    mesh.rotation.y += 0.01
    mesh.rotation.x += 0.005
  }
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.control-btn {
  padding: 10px 20px;
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
</style>
