<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="changeShape" class="control-btn">切换形状</button>
      <button @click="changeColor" class="control-btn">切换颜色</button>
      <button @click="toggleAnimation" class="control-btn">{{ animating ? '暂停' : '开始动画' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
let scene, camera, renderer, animationId, controls
let mesh, currentShapeIndex = 0, currentColorIndex = 0, animating = true

const shapes = [
  () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
  () => new THREE.SphereGeometry(1, 32, 32),
  () => new THREE.ConeGeometry(1, 2, 32),
  () => new THREE.TorusGeometry(1, 0.4, 16, 100),
  () => new THREE.OctahedronGeometry(1.2),
  () => new THREE.DodecahedronGeometry(1)
]

const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xf9ca24, 0xa8e6cf, 0xc56cf0]

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 3, 8)

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

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const geometry = shapes[currentShapeIndex]()
  const material = new THREE.MeshStandardMaterial({ 
    color: colors[currentColorIndex],
    roughness: 0.5,
    metalness: 0.3
  })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

function changeShape() {
  currentShapeIndex = (currentShapeIndex + 1) % shapes.length
  const newGeometry = shapes[currentShapeIndex]()
  mesh.geometry.dispose()
  mesh.geometry = newGeometry
}

function changeColor() {
  currentColorIndex = (currentColorIndex + 1) % colors.length
  mesh.material.color.setHex(colors[currentColorIndex])
}

function toggleAnimation() {
  animating = !animating
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (animating) {
    mesh.rotation.x += 0.01
    mesh.rotation.y += 0.015
  }
  controls.update()
  renderer.render(scene, camera)
}
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
</style>