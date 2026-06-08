<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId

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
  camera.position.set(8, 6, 10)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  // 1. 创建点模型 (Points)
  const pointPositions = new Float32Array([
    -5, 2, 0,
    -3, 3, 0,
    -4, 0, 0,
    -6, 1, 0
  ])
  const pointGeometry = new THREE.BufferGeometry()
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
  const pointMaterial = new THREE.PointsMaterial({ 
    color: 0xff6b6b, 
    size: 0.3,
    sizeAttenuation: true
  })
  const pointMesh = new THREE.Points(pointGeometry, pointMaterial)
  scene.add(pointMesh)

  // 2. 创建线模型 (Line)
  const linePositions = new Float32Array([
    0, 3, 0,
    2, 4, 0,
    3, 2, 0,
    1, 1, 0,
    0, 3, 0
  ])
  const lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4, linewidth: 2 })
  const lineMesh = new THREE.Line(lineGeometry, lineMaterial)
  scene.add(lineMesh)

  // 3. 创建网格模型 (Mesh)
  const cubeGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5)
  const cubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x667eea,
    metalness: 0.3,
    roughness: 0.7
  })
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cubeMesh.position.set(6, 2, 0)
  scene.add(cubeMesh)

  // 4. 创建球体网格
  const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32)
  const sphereMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa8e6cf,
    metalness: 0.4,
    roughness: 0.3
  })
  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphereMesh.position.set(6, -1, 0)
  scene.add(sphereMesh)

  // 5. 创建网格辅助线
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
  scene.add(gridHelper)

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
}

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
