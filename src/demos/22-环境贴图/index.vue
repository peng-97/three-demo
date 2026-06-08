<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">环境强度:</span>
      <input type="range" v-model="envIntensity" min="0" max="2" step="0.1" class="control-range">
      <span class="panel-value">{{ envIntensity.toFixed(1) }}</span>
      <span class="panel-label">粗糙度:</span>
      <input type="range" v-model="roughness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ roughness.toFixed(2) }}</span>
      <span class="panel-label">金属度:</span>
      <input type="range" v-model="metalness" min="0" max="1" step="0.01" class="control-range">
      <span class="panel-value">{{ metalness.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const envIntensity = ref(1)
const roughness = ref(0.1)
const metalness = ref(1)

let scene, camera, renderer, animationId, controls
let meshes = [], environmentTexture

function createEnvironmentTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
  skyGradient.addColorStop(0, '#1a1a2e')
  skyGradient.addColorStop(0.3, '#16213e')
  skyGradient.addColorStop(0.5, '#0f3460')
  skyGradient.addColorStop(0.7, '#533483')
  skyGradient.addColorStop(1, '#e94560')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, 1024, 512)
  
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 300
    const r = Math.random() * 2 + 0.5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.fillStyle = '#e94560'
  ctx.beginPath()
  ctx.arc(800, 400, 80, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#ff6b6b'
  ctx.beginPath()
  ctx.arc(800, 400, 60, 0, Math.PI * 2)
  ctx.fill()
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  return texture
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(0, 3, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  environmentTexture = createEnvironmentTexture()
  scene.environment = environmentTexture

  const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222233)
  scene.add(gridHelper)

  const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64)
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: metalness.value,
    roughness: roughness.value,
    envMap: environmentTexture,
    envMapIntensity: envIntensity.value
  })
  const sphere = new THREE.Mesh(sphereGeo, sphereMat)
  sphere.position.set(-3, 1.5, 0)
  meshes.push(sphere)
  scene.add(sphere)

  const torusGeo = new THREE.TorusKnotGeometry(0.9, 0.35, 128, 32)
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    metalness: metalness.value,
    roughness: roughness.value,
    envMap: environmentTexture,
    envMapIntensity: envIntensity.value
  })
  const torus = new THREE.Mesh(torusGeo, torusMat)
  torus.position.set(0, 1.5, 0)
  meshes.push(torus)
  scene.add(torus)

  const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8)
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    metalness: metalness.value,
    roughness: roughness.value,
    envMap: environmentTexture,
    envMapIntensity: envIntensity.value
  })
  const cube = new THREE.Mesh(cubeGeo, cubeMat)
  cube.position.set(3, 1.5, 0)
  meshes.push(cube)
  scene.add(cube)

  const floorGeo = new THREE.PlaneGeometry(30, 30)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
    metalness: 0.1
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
}

watch([envIntensity, roughness, metalness], () => {
  meshes.forEach(mesh => {
    mesh.material.envMapIntensity = envIntensity.value
    mesh.material.roughness = roughness.value
    mesh.material.metalness = metalness.value
    mesh.material.needsUpdate = true
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  
  meshes.forEach((mesh, i) => {
    mesh.rotation.y += 0.01 + i * 0.002
    mesh.rotation.x += 0.005 + i * 0.001
  })
  
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
  flex-wrap: wrap;
}

.panel-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.panel-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  min-width: 50px;
}

.control-range {
  width: 100px;
  cursor: pointer;
}
</style>
