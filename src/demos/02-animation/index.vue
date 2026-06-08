<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let scene, camera, renderer, cube, animationId

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
  scene.background = new THREE.Color(0x1a1a2e)
  
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 5
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100)
  const material = new THREE.MeshStandardMaterial({ color: 0x4fc3f7 })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  const light = new THREE.PointLight(0xffffff, 1, 100)
  light.position.set(5, 5, 5)
  scene.add(light)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.015
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
