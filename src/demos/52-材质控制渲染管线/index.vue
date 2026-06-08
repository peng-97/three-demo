<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">多边形模式:</span>
      <select v-model="polygonMode" class="control-select">
        <option value="fill">填充 Fill</option>
        <option value="line">线框 Line</option>
        <option value="points">点 Points</option>
      </select>
      <span class="panel-label">点大小:</span>
      <input type="range" v-model="pointSize" min="1" max="10" step="1" class="control-range">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const polygonMode = ref('fill')
const pointSize = ref(3)

let scene, camera, renderer, animationId, controls
let mesh, clock

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

  const geometry = new THREE.TorusKnotGeometry(3, 1, 128, 32)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea, 
    metalness: 0.3, 
    roughness: 0.5,
    wireframe: polygonMode.value === 'line'
  })
  
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([polygonMode, pointSize], () => {
  if (mesh) {
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
    
    let newMesh
    const geometry = new THREE.TorusKnotGeometry(3, 1, 128, 32)
    
    if (polygonMode.value === 'points') {
      const material = new THREE.PointsMaterial({ 
        color: 0x667eea, 
        size: pointSize.value,
        sizeAttenuation: true
      })
      newMesh = new THREE.Points(geometry, material)
    } else if (polygonMode.value === 'line') {
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x667eea, 
        wireframe: true
      })
      newMesh = new THREE.Mesh(geometry, material)
    } else {
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x667eea, 
        metalness: 0.3, 
        roughness: 0.5
      })
      newMesh = new THREE.Mesh(geometry, material)
    }
    
    mesh = newMesh
    scene.add(mesh)
  }
})

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
