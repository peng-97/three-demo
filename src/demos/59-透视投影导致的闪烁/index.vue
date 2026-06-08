<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">Near:</span>
      <input type="range" v-model="near" min="0.01" max="2" step="0.01" class="control-range">
      <span class="panel-label">Far:</span>
      <input type="range" v-model="far" min="10" max="1000" step="10" class="control-range">
      <span class="panel-label">对数缓冲:</span>
      <select v-model="logDepth" class="control-select">
        <option value="on">开启</option>
        <option value="off">关闭</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const near = ref(0.1)
const far = ref(1000)
const logDepth = ref('off')

let scene, camera, renderer, animationId, controls
let meshes = [], clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, near.value, far.value)
  camera.position.set(0, 100, 300)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: logDepth.value === 'on'
  })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(100, 200, 100)
  scene.add(dir)

  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf]
  const distances = [1, 10, 100, 500, 900]
  
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.SphereGeometry(10, 32, 32)
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[i], 
      metalness: 0.3, 
      roughness: 0.5
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -distances[i]
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([near, far, logDepth], () => {
  camera.near = near.value
  camera.far = far.value
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.logarithmicDepthBuffer = logDepth.value === 'on'
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.position.x = Math.sin(time + i) * 50
    mesh.position.y = Math.cos(time * 0.7 + i) * 30
  })

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { 
  cancelAnimationFrame(animationId)
  renderer.dispose()
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
