<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <button @click="generateOBJ" class="control-btn">生成OBJ模型</button>
      <span class="panel-label">复杂度:</span>
      <input type="range" v-model="complexity" min="1" max="5" step="1" class="control-range">
      <span class="panel-value">{{ complexity }}</span>
      <span class="panel-label">显示法线:</span>
      <input type="checkbox" v-model="showNormals" class="control-checkbox">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const complexity = ref(3)
const showNormals = ref(false)

let scene, camera, renderer, animationId, controls
let currentMesh = null, normalsHelper = null

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 5, 15)
  camera.lookAt(0, 0, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)
  const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x222233)
  scene.add(gridHelper)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  generateOBJ()
}

function generateOBJ() {
  if (currentMesh) { scene.remove(currentMesh); currentMesh.geometry.dispose(); currentMesh.material.dispose() }
  if (normalsHelper) { scene.remove(normalsHelper) }
  
  const segs = complexity.value * 8
  const geometry = new THREE.IcosahedronGeometry(4, complexity.value - 1)
  const material = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4, metalness: 0.3, roughness: 0.6, flatShading: true
  })
  currentMesh = new THREE.Mesh(geometry, material)
  scene.add(currentMesh)
  
  if (showNormals.value) {
    normalsHelper = new THREE.VertexNormalsHelper(currentMesh, 0.5, 0xff0000, 1)
    scene.add(normalsHelper)
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (currentMesh) { currentMesh.rotation.y += 0.01; currentMesh.rotation.x += 0.005 }
  if (showNormals.value && normalsHelper) { normalsHelper.update() }
  controls.update(); renderer.render(scene, camera)
}

watch([showNormals, () => { generateOBJ() })

onMounted(() => { init(); animate() })
onUnmounted(() => { cancelAnimationFrame(animationId); renderer.dispose() })
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.panel-value { color: white; font-weight: 700; font-size: 1rem; min-width: 40px; }
.control-range { width: 100px; cursor: pointer; }
.control-checkbox { width: 20px; height: 20px; cursor: pointer; }
.control-btn { padding: 10px 20px; font-size: 0.9rem; font-weight: 600; color: #333; background: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.3s; }
.control-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
</style>
