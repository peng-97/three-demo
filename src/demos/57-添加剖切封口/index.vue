<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">显示封口:</span>
      <select v-model="showCap" class="control-select">
        <option value="on">显示</option>
        <option value="off">不显示</option>
        <option value="only">仅显示</option>
      </select>
      <span class="panel-label">封口颜色:</span>
      <select v-model="capColor" class="control-select">
        <option value="0x667eea">蓝色</option>
        <option value="0x4ecdc4">青色</option>
        <option value="0xff6b6b">红色</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const showCap = ref('on')
const capColor = ref('0x667eea')

let scene, camera, renderer, animationId, controls
let mesh, capMesh, clock

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

  const geometry = new THREE.SphereGeometry(3, 64, 64)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x667eea, 
    metalness: 0.3, 
    roughness: 0.5,
    side: THREE.DoubleSide
  })
  
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const capGeometry = new THREE.CircleGeometry(3, 64)
  const capMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4ecdc4,
    side: THREE.DoubleSide
  })
  
  capMesh = new THREE.Mesh(capGeometry, capMaterial)
  capMesh.rotation.y = Math.PI / 2
  capMesh.visible = true
  scene.add(capMesh)

  renderer.localClippingEnabled = true
  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
  mesh.material.clippingPlanes = [plane]

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)
  clock = new THREE.Clock()
}

watch([showCap, capColor], () => {
  if (capMesh) {
    capMesh.visible = showCap.value !== 'off'
    mesh.visible = showCap.value !== 'only'
    capMesh.material.color.setHex(parseInt(capColor.value))
  }
})

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()

  if (mesh) {
    mesh.rotation.x += 0.005
    mesh.rotation.y += 0.01
  }

  if (capMesh) {
    capMesh.rotation.x += 0.005
    capMesh.rotation.y += 0.01
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
</style>
