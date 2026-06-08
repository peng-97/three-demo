<template>
  <div ref="container" class="demo-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const container = ref(null)
let scene, camera, renderer, mesh, animationId
let rotation = { x: 0, y: 0 }

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
  scene.background = new THREE.Color(0xe8eaf0)
  
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 5
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  const geometry = new THREE.IcosahedronGeometry(1.5, 0)
  const material = new THREE.MeshPhongMaterial({ color: 0xff6b6b, flatShading: true })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)
  

    const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(controls)
}
function animate() {
  animationId = requestAnimationFrame(animate)
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
  cursor: grab;
}
.demo-container:active {
  cursor: grabbing;
}
</style>
