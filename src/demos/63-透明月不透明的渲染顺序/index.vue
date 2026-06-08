<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模式:</span>
      <select v-model="renderMode" class="control-select">
        <option value="auto">自动顺序</option>
        <option value="opaqueFirst">先不透明</option>
        <option value="transparentFirst">先透明</option>
      </select>
      <span class="panel-label">透明物体:</span>
      <span class="panel-value">{{ transparentCount }}个</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const renderMode = ref('auto')
const transparentCount = ref(3)

let scene, camera, renderer, animationId, controls
let meshes = []
let clock

function applyRenderMode() {
  if (meshes.length === 0) return
  meshes.forEach((mesh) => {
    if (renderMode.value === 'opaqueFirst') {
      mesh.renderOrder = mesh.userData.isOpaque ? 0 : 10
    } else if (renderMode.value === 'transparentFirst') {
      mesh.renderOrder = mesh.userData.isOpaque ? 10 : 0
    } else {
      mesh.renderOrder = 0
    }
  })
}

function onResize() {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
}

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(grid)

  // 不透明物体
  const opaqueColors = [0xff6b6b, 0x667eea]
  for (let i = 0; i < 2; i++) {
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({ 
      color: opaqueColors[i], 
      metalness: 0.3, 
      roughness: 0.5
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(-3 + i * 6, 0, 0)
    mesh.userData.isOpaque = true
    scene.add(mesh)
    meshes.push(mesh)
  }

  // 透明物体
  const transparentColors = [0x4ecdc4, 0xfeca57, 0xa8e6cf]
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100)
    const material = new THREE.MeshStandardMaterial({ 
      color: transparentColors[i], 
      metalness: 0.3, 
      roughness: 0.5,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(-2 + i * 2, 1, 1)
    mesh.userData.isOpaque = false
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()

  applyRenderMode()
  window.addEventListener('resize', onResize)
}

watch([renderMode], () => {
  applyRenderMode()
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.rotation.x += 0.005
    mesh.rotation.y += 0.01
    mesh.position.y = mesh.userData.isOpaque ? 0 : Math.sin(time + i)
  })

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls?.dispose?.()
  meshes.forEach((mesh) => {
    mesh.geometry?.dispose?.()
    mesh.material?.dispose?.()
  })
  renderer?.dispose?.()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
})
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; min-width: 50px; }
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
</style>
