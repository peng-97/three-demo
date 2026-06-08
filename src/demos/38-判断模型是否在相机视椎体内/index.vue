<template>
  <div class="demo-wrapper">
    <div ref="container" class="demo-container"></div>
    <div class="control-panel">
      <span class="panel-label">可见物体: {{ visibleCount }}/{{ totalCount }}</span>
      <span class="panel-label">自动移动:</span>
      <input type="checkbox" v-model="autoMove" class="control-checkbox">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref(null)
const autoMove = ref(true)
const visibleCount = ref(0)
const totalCount = ref(0)

let scene, camera, renderer, animationId, controls
let objects = [], frustum = new THREE.Frustum()
let projScreenMatrix = new THREE.Matrix4()

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 1, 50)
  camera.position.set(0, 5, 15)
  camera.lookAt(0, 0, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(10, 20, 10)
  scene.add(dir)
  
  const grid = new THREE.GridHelper(60, 60, 0x444466, 0x222233)
  scene.add(grid)
  
  const colors = [0xff6b6b, 0x4ecdc4, 0x667eea, 0xfeca57, 0xa8e6cf, 0xc56cf0, 0xff9f43, 0x5f27cd]
  
  for (let i = 0; i < 50; i++) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      metalness: 0.4,
      roughness: 0.5
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      (Math.random() - 0.5) * 60,
      Math.random() * 10,
      (Math.random() - 0.5) * 60
    )
    mesh.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    )
    mesh.userData.originalColor = colors[i % colors.length]
    scene.add(mesh)
    objects.push(mesh)
  }
  
  totalCount.value = objects.length
  
  const cameraHelper = new THREE.CameraHelper(camera)
  scene.add(cameraHelper)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 5, 0)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(projScreenMatrix)
  
  let visible = 0
  
  objects.forEach(obj => {
    if (autoMove.value) {
      obj.position.add(obj.userData.velocity.clone().multiplyScalar(0.02))
      
      if (Math.abs(obj.position.x) > 30) obj.userData.velocity.x *= -1
      if (obj.position.y > 15 || obj.position.y < 0) obj.userData.velocity.y *= -1
      if (Math.abs(obj.position.z) > 30) obj.userData.velocity.z *= -1
    }
    
    const box = new THREE.Box3().setFromObject(obj)
    const isVisible = frustum.intersectsBox(box)
    
    if (isVisible) {
      visible++
      obj.material.color.setHex(obj.userData.originalColor)
      obj.material.opacity = 1
      obj.material.emissiveIntensity = 0.2
    } else {
      obj.material.color.setHex(0x333333)
      obj.material.opacity = 0.3
      obj.material.emissiveIntensity = 0
    }
  })
  
  visibleCount.value = visible
  
  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => { init(); animate() })
onUnmounted(() => { cancelAnimationFrame(animationId); renderer.dispose() })
</script>

<style scoped>
.demo-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
.demo-container { flex: 1; }
.control-panel { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); flex-wrap: wrap; }
.panel-label { color: white; font-weight: 600; font-size: 0.9rem; }
.control-checkbox { width: 20px; height: 20px; cursor: pointer; }
</style>
