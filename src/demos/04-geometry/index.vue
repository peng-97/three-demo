<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, animationId, meshes = []

onMounted(() => {
  init()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  renderer.dispose()
})

function init() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8f9fa)
  
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 2, 8)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.7, 32, 32),
    new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32),
    new THREE.ConeGeometry(0.7, 1.5, 32),
    new THREE.TorusGeometry(0.6, 0.2, 16, 100),
    new THREE.OctahedronGeometry(0.8)
  ]
  
  const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c]
  
  geometries.forEach((geometry, i) => {
    const material = new THREE.MeshLambertMaterial({ color: colors[i] })
    const mesh = new THREE.Mesh(geometry, material)
    const angle = (i / geometries.length) * Math.PI * 2
    mesh.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5)
    scene.add(mesh)
    meshes.push(mesh)
  })
  
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)
  const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(controls)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  meshes.forEach((mesh, i) => {
    mesh.rotation.x += 0.01 * (i + 1) * 0.5
    mesh.rotation.y += 0.02 * (i + 1) * 0.5
  })
  renderer.render(scene, camera)
}
window.addEventListener('resize', onResize)
function onResize() {
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
}
</style>
