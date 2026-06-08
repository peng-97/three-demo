<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">Z-fight修复:</span>
      <select v-model="zfightingFix" class="control-select">
        <option value="none">无修复</option>
        <option value="bias">Offset Bias</option>
        <option value="distance">距离分离</option>
      </select>
      <span class="panel-label">Offset数值:</span>
      <input type="range" v-model="offsetValue" min="-0.1" max="0.1" step="0.01" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const zfightingFix = ref('none')
const offsetValue = ref(0.01)

let scene, camera, renderer, animationId, controls
let meshes = [], clock

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
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.PlaneGeometry(6, 6)
    const material = new THREE.MeshStandardMaterial({ 
      color: colors[i],
      side: THREE.DoubleSide
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = i * 0.001
    mesh.position.z = i * 0.001
    scene.add(mesh)
    meshes.push(mesh)
  }

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([zfightingFix, offsetValue], () => {
  meshes.forEach((mesh, i) => {
    mesh.material.polygonOffset = zfightingFix.value === 'bias'
    mesh.material.polygonOffsetFactor = offsetValue.value * (i + 1)
    mesh.material.polygonOffsetUnits = offsetValue.value * (i + 1)
    
    if (zfightingFix.value === 'distance') {
      mesh.position.y = i * 0.1
      mesh.position.z = i * 0.1
    } else {
      mesh.position.y = i * 0.001
      mesh.position.z = i * 0.001
    }
  })
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  meshes.forEach((mesh, i) => {
    mesh.rotation.z = time * 0.2 + i * 0.5
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
