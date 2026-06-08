<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">模板模式:</span>
      <select v-model="stencilMode" class="control-select">
        <option value="stencil">模板测试</option>
        <option value="mirror">镜面反射</option>
        <option value="outline">轮廓描边</option>
      </select>
      <span class="panel-label">效果强度:</span>
      <input type="range" v-model="stencilStrength" min="0" max="2" step="0.1" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const stencilMode = ref('stencil')
const stencilStrength = ref(1)

let scene, camera, renderer, animationId, controls
let mesh, planeMesh, clock

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    stencil: true 
  })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)

  const grid = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(grid)

  const geometry = new THREE.TorusKnotGeometry(2, 0.7, 128, 32)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea, 
    metalness: 0.3, 
    roughness: 0.5 
  })
  
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const planeGeometry = new THREE.PlaneGeometry(20, 20)
  const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x222222,
    transparent: true,
    opacity: 0.5
  })
  planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
  planeMesh.rotation.x = -Math.PI / 2
  planeMesh.position.y = -2.5
  scene.add(planeMesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  if (mesh) {
    mesh.rotation.x += 0.005
    mesh.rotation.y += 0.01
  }

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
