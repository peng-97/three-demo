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
  scene.background = new THREE.Color(0xf0f0f0)
  
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 5
  
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
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
