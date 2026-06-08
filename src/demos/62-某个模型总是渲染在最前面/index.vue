<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">前方物体:</span>
      <select v-model="frontMesh" class="control-select">
        <option value="1">红色盒子</option>
        <option value="2">蓝色盒子</option>
        <option value="3">绿色盒子</option>
      </select>
      <span class="panel-label">控制方式:</span>
      <select v-model="controlMode" class="control-select">
        <option value="renderOrder">renderOrder</option>
        <option value="depth">Depth Test</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const frontMesh = ref('1')
const controlMode = ref('renderOrder')

let scene, camera, renderer, animationId, controls
let meshes = []
let clock
let positions = []

function applyFrontSettings() {
  if (meshes.length === 0) return
  const idx = parseInt(frontMesh.value, 10) - 1
  meshes.forEach((mesh, i) => {
    if (controlMode.value === 'renderOrder') {
      mesh.material.depthTest = true
      mesh.material.depthWrite = true
      mesh.renderOrder = i === idx ? 999 : 0
    } else {
      mesh.renderOrder = 0
      mesh.material.depthTest = i !== idx
      mesh.material.depthWrite = i !== idx
    }
    mesh.material.needsUpdate = true
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

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea]
  positions = [
    [0, 0, 0], [-3, 0, -3], [3, 0, -3]
  ]
  
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[i], 
      metalness: 0.3, 
      roughness: 0.5
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...positions[i])
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()

  applyFrontSettings()
  window.addEventListener('resize', onResize)
}

watch([frontMesh, controlMode], () => {
  applyFrontSettings()
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.rotation.x += 0.005
    mesh.rotation.y += 0.01
    mesh.position.y = Math.sin(time + i)
    mesh.position.z = positions[i][2] + Math.cos(time * 0.5 + i)
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
.control-select { padding: 8px 12px; font-size: 0.9rem; border-radius: 6px; border: none; }
</style>
